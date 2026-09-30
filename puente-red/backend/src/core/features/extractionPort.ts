/**
 * PR-006 · Puerto de enriquecimiento por LLM.
 *
 * **Es opcional por diseño.** La extracción base es determinista (`mapping.ts`); este puerto
 * solo añade características que se deducen de la **nota libre** del resumen autorizado.
 *
 * Restricciones del puerto:
 * - Recibe la nota **ya redactada** (`redactForModel`), nunca el texto crudo.
 * - Solo puede devolver valores del vocabulario cerrado; el servicio descarta el resto.
 * - No decide nada: no puntúa gravedad, no estima riesgo, no recomienda derivaciones.
 */

export interface ExtractionRequest {
  readonly caseToken: string;
  /** Nota del joven, ya redactada de edad exacta, institución, teléfono, correo y usuario. */
  readonly redactedNote: string;
  readonly allowedSituationTypes: readonly string[];
  readonly allowedDomains: readonly string[];
  readonly allowedSignalTags: readonly string[];
  readonly allowedProtectiveFactors: readonly string[];
  readonly allowedUrgencyLevels: readonly string[];
  readonly promptVersion: string;
  readonly vocabularyVersion: string;
}

/** Lo que el modelo puede proponer: valores del vocabulario, sin procedencia ni confianza. */
export interface ExtractionResponse {
  readonly situationTypes: readonly string[];
  readonly domains: readonly string[];
  readonly signalTags: readonly string[];
  readonly protectiveFactors: readonly string[];
  readonly urgencyLevels: readonly string[];
}

export class ExtractionProviderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ExtractionProviderError";
    this.code = code;
  }
}

export interface FeatureExtractionPort {
  extract(request: ExtractionRequest, signal: AbortSignal): Promise<ExtractionResponse>;
}
