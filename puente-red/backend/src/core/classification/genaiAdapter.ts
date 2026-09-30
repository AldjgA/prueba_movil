/**
 * PR-005 · Adaptador de Google GenAI.
 *
 * ⚠️ **El proveedor de pago es obligatorio** (`PR-INFRA` §4): la capa gratuita usa los
 * prompts para mejorar productos de Google, lo que **no cumple** la decisión D3
 * (no-reentrenamiento sobre datos de menores). El dueño confirmó el 2026-09-30 que se
 * usará la capa de pago.
 *
 * Reglas de esta frontera:
 * - La API key se lee del entorno **en el momento de la llamada** y nunca se guarda en un
 *   objeto de configuración ni se registra en logs (`PR-INFRA` §6).
 * - El payload sale por `assertNoIdentityInPayload` antes de tocar la red.
 * - Cualquier fallo se convierte en `LlmProviderError` para que el servicio aplique el
 *   fallback conservador.
 */

import {
  LlmProviderError,
  assertNoIdentityInPayload,
  type LlmClassificationRequest,
  type LlmClassifierPort,
  type LlmClassificationResponse,
} from "./llmPort.ts";
import { buildPrompt } from "./prompt.ts";
import type { EnvLike } from "./config.ts";

const ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Inyectable para poder probar sin red. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface GenAiAdapterOptions {
  readonly env: EnvLike;
  /** **Nombre** de la variable de entorno con la clave. No es la clave. */
  readonly apiKeyEnvVar: string;
  readonly fetchImpl?: FetchLike;
}

function parseModelResponse(raw: unknown): LlmClassificationResponse {
  if (typeof raw !== "object" || raw === null) {
    throw new LlmProviderError("BAD_SHAPE", "La respuesta del modelo no es un objeto");
  }
  const candidate = raw as { category?: unknown; rationaleKeys?: unknown };
  const category = candidate.category;
  if (category !== "MEDIO" && category !== "ALTO") {
    throw new LlmProviderError("BAD_CATEGORY", `Categoría inválida: ${String(category)}`);
  }
  const keys = candidate.rationaleKeys;
  if (!Array.isArray(keys) || keys.some((k) => typeof k !== "string")) {
    throw new LlmProviderError("BAD_RATIONALE", "rationaleKeys debe ser una lista de claves");
  }
  return { category, rationaleKeys: keys as string[] };
}

export class GoogleGenAiClassifier implements LlmClassifierPort {
  readonly #env: EnvLike;
  readonly #apiKeyEnvVar: string;
  readonly #fetch: FetchLike;

  constructor(options: GenAiAdapterOptions) {
    this.#env = options.env;
    this.#apiKeyEnvVar = options.apiKeyEnvVar;
    this.#fetch = options.fetchImpl ?? ((url, init) => fetch(url, init));
  }

  async classify(
    request: LlmClassificationRequest,
    signal: AbortSignal,
  ): Promise<LlmClassificationResponse> {
    const apiKey = this.#env[this.#apiKeyEnvVar];
    if (apiKey === undefined || apiKey === "") {
      // Fallo esperado cuando no hay proveedor configurado: el servicio hará fallback.
      throw new LlmProviderError("NO_API_KEY", "No hay API key configurada para el proveedor");
    }

    const payload = {
      contents: [{ parts: [{ text: buildPrompt(request) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    };

    // Guarda de frontera: ningún identificador personal sale hacia el proveedor.
    assertNoIdentityInPayload(payload as unknown as Record<string, unknown>);

    const url = `${ENDPOINT_BASE}/${encodeURIComponent(request.modelVersion)}:generateContent`;

    let response: Response;
    try {
      response = await this.#fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // La clave viaja en la cabecera, nunca en el cuerpo ni en logs.
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (error) {
      throw new LlmProviderError("NETWORK", `Fallo de red: ${(error as Error).message}`);
    }

    if (!response.ok) {
      throw new LlmProviderError("HTTP_" + String(response.status), "El proveedor devolvió error");
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new LlmProviderError("BAD_JSON", `Respuesta no parseable: ${(error as Error).message}`);
    }

    const text = extractTextPart(body);
    if (text === null) {
      throw new LlmProviderError("EMPTY_RESPONSE", "El proveedor no devolvió texto");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new LlmProviderError("BAD_JSON", `El modelo no devolvió JSON: ${(error as Error).message}`);
    }

    return parseModelResponse(parsed);
  }
}

function extractTextPart(body: unknown): string | null {
  const candidates = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const parts = (candidates[0] as { content?: { parts?: unknown } }).content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const first = parts[0] as { text?: unknown };
  return typeof first.text === "string" ? first.text : null;
}
