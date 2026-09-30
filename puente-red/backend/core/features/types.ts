/**
 * PR-006 · Tipos del extractor de características.
 */

import type {
  AgeBand,
  ConfidenceBand,
  Domain,
  ProtectiveFactor,
  Provenance,
  SignalTag,
  SituationType,
  UrgencyLevel,
} from "./vocabulary.ts";

/**
 * Entrada del extractor.
 *
 * Es un **subconjunto estructural del Contrato A** (`PR-003` §4). Se declara aquí en vez de
 * importar el tipo de `classification/` para que los dos módulos del núcleo sean
 * independientes: `PR-006` no debe romperse si `PR-005` cambia.
 *
 * Un `IngestedReport` es asignable a este tipo sin conversión.
 */
export interface ReportForExtraction {
  readonly caseToken: string;
  readonly motivo: readonly string[];
  /** Alcance autorizado. `scope` es CERRADO. */
  readonly resumenAutorizado: {
    readonly scope: readonly string[];
    readonly note?: string;
  };
}

/** Una característica con su procedencia y su banda de confianza. */
export interface CaseFeature<T> {
  readonly value: T;
  /** `DECLARED` = el joven lo afirmó; `EXTRACTED` = se dedujo del contenido autorizado. */
  readonly provenance: Provenance;
  /** Banda **cualitativa**, nunca un porcentaje (brief §15). */
  readonly confidenceBand: ConfidenceBand;
}

/**
 * Resultado de la extracción.
 *
 * Todo campo es un valor del vocabulario cerrado o `null`: **no hay ningún campo de texto
 * libre**, que es lo que hace verificable el criterio 2.
 */
export interface CaseFeatureSet {
  readonly caseToken: string;
  readonly situation: CaseFeature<SituationType> | null;
  readonly domains: readonly CaseFeature<Domain>[];
  readonly signals: readonly CaseFeature<SignalTag>[];
  readonly protectiveFactors: readonly CaseFeature<ProtectiveFactor>[];
  readonly ageBand: AgeBand | null;
  readonly urgencyDeclared: CaseFeature<UrgencyLevel> | null;
  readonly extractorVersion: string;
  readonly promptVersion: string;
  readonly extractedAt: string; // ISO-8601
}

export interface Clock {
  nowEpochMillis(): number;
}
