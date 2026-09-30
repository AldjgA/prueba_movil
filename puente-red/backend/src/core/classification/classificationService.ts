/**
 * PR-005 · Servicio de clasificación.
 *
 * Es la pieza con mayor tensión con el guardrail #2: un LLM que clasifica texto libre es,
 * funcionalmente, triaje automático. Aquí están las tres cosas que lo hacen admisible:
 *
 * 1. **La regla dura D2** (`PR-003` §9.4): si el nivel de origen es `ROJO`, la categoría es
 *    `ALTO` y **no es degradable**. El modelo no llega a decidir en ese caso.
 * 2. **Fallback conservador**: ante timeout, error, proveedor ausente o clasificador
 *    apagado, la categoría es `ALTO`. Nunca un caso sin categoría (`PR-001` §10).
 * 3. **La salida es una propuesta**, no una decisión: la validación humana es el acto de
 *    aceptación del profesional (`ACEPTADO`, `PR-003` §3.1).
 */

import { createHash } from "node:crypto";

import { PROVISIONAL_CATALOG, RATIONALE, type RationaleCatalog } from "./catalog.ts";
import type { ClassifierConfig } from "./config.ts";
import {
  LlmProviderError,
  type LlmClassificationRequest,
  type LlmClassifierPort,
} from "./llmPort.ts";
import { PROMPT_VERSION } from "./prompt.ts";
import type {
  CaseTransition,
  ClassificationOutcome,
  ClassificationProposal,
  Clock,
  IngestedReport,
  ProfessionalCategory,
} from "./types.ts";

/** Reloj real. En pruebas se inyecta uno fijo. */
export const SYSTEM_CLOCK: Clock = {
  nowEpochMillis: () => Date.now(),
};

export interface ClassificationServiceDeps {
  /** `null` si no hay proveedor configurado. El servicio sigue funcionando (fallback). */
  readonly port: LlmClassifierPort | null;
  readonly config: ClassifierConfig;
  readonly clock?: Clock;
  readonly catalog?: RationaleCatalog;
}

/**
 * Hash canónico de la entrada.
 *
 * Permite **auditar sin retener el prompt** (criterio 8 y `PR-018`): se guarda el hash, no
 * el texto. Como el `IngestedReport` no contiene identidad, hashearlo entero es seguro.
 */
export function hashInput(report: IngestedReport): string {
  const canonical = JSON.stringify({
    caseToken: report.caseToken,
    contratoVersion: report.contratoVersion,
    origenNivel: report.origenNivel,
    rulesetVersion: report.rulesetVersion,
    motivo: [...report.motivo].sort(),
    scope: [...report.resumenAutorizado.scope].sort(),
    creadoEn: report.creadoEn,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

function isoFrom(clock: Clock): string {
  return new Date(clock.nowEpochMillis()).toISOString();
}

export class ClassificationService {
  readonly #port: LlmClassifierPort | null;
  readonly #config: ClassifierConfig;
  readonly #clock: Clock;
  readonly #catalog: RationaleCatalog;

  constructor(deps: ClassificationServiceDeps) {
    this.#port = deps.port;
    this.#config = deps.config;
    this.#clock = deps.clock ?? SYSTEM_CLOCK;
    this.#catalog = deps.catalog ?? PROVISIONAL_CATALOG;
  }

  async classify(report: IngestedReport): Promise<ClassificationOutcome> {
    const inputHash = hashInput(report);
    const proposal = await this.#propose(report, inputHash);
    return {
      proposal,
      transition: this.#transitionToClassified(),
    };
  }

  async #propose(report: IngestedReport, inputHash: string): Promise<ClassificationProposal> {
    const base = {
      caseToken: report.caseToken,
      modelVersion: this.#config.modelVersion,
      promptVersion: this.#config.promptVersion,
      inputHash,
      producedAt: isoFrom(this.#clock),
    } as const;

    // ------------------------------------------------------------------
    // Regla dura D2: el rojo NUNCA se degrada. Ni se consulta al modelo.
    // ------------------------------------------------------------------
    if (report.origenNivel === "ROJO") {
      return {
        ...base,
        category: "ALTO",
        rationaleKeys: this.#filterKnown([RATIONALE.ORIGEN_ROJO_NO_DEGRADABLE, ...report.motivo]),
        isDegradable: false,
        fallbackApplied: false,
      };
    }

    // ------------------------------------------------------------------
    // Clasificador apagado o sin proveedor: fallback conservador (criterio 5).
    // ------------------------------------------------------------------
    if (!this.#config.enabled || this.#port === null) {
      return {
        ...base,
        category: "ALTO",
        rationaleKeys: [RATIONALE.FALLBACK_CONSERVADOR],
        isDegradable: true,
        fallbackApplied: true,
      };
    }

    // ------------------------------------------------------------------
    // Consulta al modelo, con timeout y validación estricta.
    // ------------------------------------------------------------------
    try {
      const response = await this.#callWithTimeout(report);
      const category = this.#enforceD2(response.category, report.origenNivel);
      const rationaleKeys = this.#filterKnown(response.rationaleKeys);
      if (rationaleKeys.length === 0) {
        throw new LlmProviderError("NO_VALID_RATIONALE", "El modelo no devolvió claves válidas");
      }
      return {
        ...base,
        category,
        rationaleKeys,
        isDegradable: true,
        fallbackApplied: false,
      };
    } catch {
      return {
        ...base,
        category: "ALTO",
        rationaleKeys: [RATIONALE.FALLBACK_CONSERVADOR],
        isDegradable: true,
        fallbackApplied: true,
      };
    }
  }

  async #callWithTimeout(report: IngestedReport) {
    const port = this.#port;
    if (port === null) {
      throw new LlmProviderError("NO_PORT", "No hay proveedor configurado");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.#config.timeoutMs);

    try {
      const request: LlmClassificationRequest = {
        caseToken: report.caseToken,
        origenNivel: report.origenNivel,
        motivo: report.motivo,
        authorizedScope: report.resumenAutorizado.scope,
        modelVersion: this.#config.modelVersion,
        promptVersion: this.#config.promptVersion,
        catalogVersion: this.#catalog.version,
        allowedRationaleKeys: this.#catalog.keys,
      };
      return await port.classify(request, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Segunda barrera de D2. Aunque la primera ya devuelve antes de llamar al modelo, esto
   * protege contra un cambio futuro que mueva la comprobación: **un rojo no puede salir
   * `MEDIO` ni por error del proveedor**.
   */
  #enforceD2(category: ProfessionalCategory, origin: IngestedReport["origenNivel"]): ProfessionalCategory {
    if (origin === "ROJO") return "ALTO";
    return category;
  }

  /** Criterio 7: `rationaleKeys` solo puede contener claves del catálogo vigente. */
  #filterKnown(keys: readonly string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const key of keys) {
      if (this.#catalog.has(key) && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    }
    return result;
  }

  #transitionToClassified(): CaseTransition {
    return { from: "RECIBIDO", to: "CLASIFICADO", at: isoFrom(this.#clock) };
  }
}

/** Versión de la plantilla del prompt vigente, reexportada para trazabilidad. */
export { PROMPT_VERSION };
