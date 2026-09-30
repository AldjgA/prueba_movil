/**
 * PR-005 · Puerto del clasificador LLM.
 *
 * El servicio depende de esta interfaz, no del proveedor. Eso permite (a) probar el
 * servicio sin red y (b) cambiar de proveedor sin tocar la lógica de seguridad.
 *
 * **Invariante (criterio 6):** la petición **no tiene** campo para `ProfileId`, alias,
 * MAC ni ningún identificador personal. No es que se omita: el tipo no lo admite.
 */

import type { OriginLevel, ProfessionalCategory } from "./types.ts";

export interface LlmClassificationRequest {
  readonly caseToken: string; // ULID — el único identificador que ve el modelo
  readonly origenNivel: OriginLevel;
  readonly motivo: readonly string[];
  readonly authorizedScope: readonly string[];
  readonly modelVersion: string;
  readonly promptVersion: string;
  readonly catalogVersion: string;
  readonly allowedRationaleKeys: readonly string[];
}

export interface LlmClassificationResponse {
  readonly category: ProfessionalCategory;
  readonly rationaleKeys: readonly string[];
}

/** Error tipado del proveedor. El servicio lo trata como fallo → fallback conservador. */
export class LlmProviderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "LlmProviderError";
    this.code = code;
  }
}

export interface LlmClassifierPort {
  classify(request: LlmClassificationRequest, signal: AbortSignal): Promise<LlmClassificationResponse>;
}

/**
 * Guarda de frontera: ningún payload saliente puede contener claves de identidad.
 * Se ejecuta **antes** de llamar al proveedor, así que un fallo aquí es un fallo del
 * programador, no del modelo.
 */
const FORBIDDEN_PAYLOAD_KEYS: readonly string[] = [
  "profileId",
  "profile_id",
  "youthId",
  "youth_id",
  "alias",
  "youthAlias",
  "deviceKey",
  "device_key",
  "mac",
  "summaryId",
  "consentRecordId",
];

export function assertNoIdentityInPayload(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_PAYLOAD_KEYS.includes(key)) {
      throw new Error(`Payload hacia el proveedor contiene un identificador prohibido: ${key}`);
    }
  }
}
