/**
 * PR-006 · Vocabulario CERRADO de características.
 *
 * **Por qué cerrado:** el extractor no produce texto. Produce valores de un conjunto
 * finito. Eso es lo que hace verificable el criterio 2 (*"ninguna característica contiene
 * texto libre del reporte"*): no es una promesa de estilo, es una propiedad del tipo.
 *
 * Añadir un valor es una **decisión de producto**, no de código. El vocabulario definitivo
 * lo valida el clínico junto con `PR-001` §5 (ver `specs/PR-006-extraccion-caracteristicas.md`
 * §9).
 *
 * Nota técnica: sin `enum` (type stripping de Node no lo soporta) → uniones de literales.
 */

export const VOCABULARY_VERSION = "feature-vocabulary/1.0.0-provisional";

// ---------------------------------------------------------------------------
// Tipos de situación
// ---------------------------------------------------------------------------
export const SITUATION_TYPES = [
  "BULLYING",
  "VIOLENCE",
  "GRIEF",
  "FAMILY_CONFLICT",
  "SUBSTANCE",
  "OTHER",
] as const;
export type SituationType = (typeof SITUATION_TYPES)[number];

// ---------------------------------------------------------------------------
// Ámbito donde ocurre
// ---------------------------------------------------------------------------
export const DOMAINS = ["SCHOOL", "HOME", "COMMUNITY", "DIGITAL"] as const;
export type Domain = (typeof DOMAINS)[number];

// ---------------------------------------------------------------------------
// Señales observables — las cuatro prioritarias del resumen (Sarfo 2026) están marcadas
//
// Forma canónica: `SNAKE_CASE` en MAYÚSCULAS, fijada por `PR-003` §4.1 (hallazgo K1 de B).
// El APK **debe** emitir estas mismas claves; la correspondencia desde lo que emitía
// (`sleep`, `isolation`, …) está en `PR-003` §4.1.
// ---------------------------------------------------------------------------
export const SIGNAL_TAGS = [
  "SLEEP", //             resumen §4.1: sueño alterado por ansiedad — prioritario
  "ANXIETY", //           resumen §4.1: ansiedad — prioritario
  "ISOLATION", //         resumen §4.1: aislamiento — prioritario
  "SCHOOL_IMPACT", //     deterioro escolar (PR-001 §4.2, amarillo)
  "SUBSTANCE_USE", //     resumen §4.1: consumo de alcohol — prioritario
  "SELF_HARM", //         PR-001 §4.3 (rojo)
  "PHYSICAL_VIOLENCE", // resumen §4.1: violencia física — prioritario
] as const;
export type SignalTag = (typeof SIGNAL_TAGS)[number];

// ---------------------------------------------------------------------------
// Factores protectores
// ---------------------------------------------------------------------------
export const PROTECTIVE_FACTORS = [
  "TRUSTED_ADULT",
  "FRIENDSHIP",
  "ACTIVITY",
  "SERVICE_ENGAGED",
] as const;
export type ProtectiveFactor = (typeof PROTECTIVE_FACTORS)[number];

// ---------------------------------------------------------------------------
// Banda de edad — la ÚNICA característica demográfica admitida (nunca la edad exacta)
// ---------------------------------------------------------------------------
export const AGE_BANDS = ["13-14", "15-16", "17-18"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

// ---------------------------------------------------------------------------
// Procedencia: de dónde salió la característica. El profesional tiene derecho a saberlo.
// ---------------------------------------------------------------------------
export const PROVENANCES = ["EXTRACTED", "DECLARED"] as const;
export type Provenance = (typeof PROVENANCES)[number];

/**
 * Banda cualitativa. **No** es un porcentaje: un porcentaje se leería como probabilidad
 * clínica, que es lo que el brief §15 prohíbe mostrar.
 */
export const CONFIDENCE_BANDS = ["LOW", "MEDIUM", "HIGH"] as const;
export type ConfidenceBand = (typeof CONFIDENCE_BANDS)[number];

// ---------------------------------------------------------------------------
// Urgencia declarada por el joven (si el resumen la trae)
// ---------------------------------------------------------------------------
export const URGENCY_LEVELS = ["NO_DECLARADA", "PUEDE_ESPERAR", "PRONTO", "AHORA"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------
export interface FeatureVocabulary {
  readonly version: string;
  readonly situationTypes: readonly string[];
  readonly domains: readonly string[];
  readonly signalTags: readonly string[];
  readonly protectiveFactors: readonly string[];
  readonly ageBands: readonly string[];
  readonly urgencyLevels: readonly string[];
}

export const PROVISIONAL_VOCABULARY: FeatureVocabulary = {
  version: VOCABULARY_VERSION,
  situationTypes: SITUATION_TYPES,
  domains: DOMAINS,
  signalTags: SIGNAL_TAGS,
  protectiveFactors: PROTECTIVE_FACTORS,
  ageBands: AGE_BANDS,
  urgencyLevels: URGENCY_LEVELS,
};

export function isSituationType(value: string): value is SituationType {
  return (SITUATION_TYPES as readonly string[]).includes(value);
}

export function isDomain(value: string): value is Domain {
  return (DOMAINS as readonly string[]).includes(value);
}

export function isSignalTag(value: string): value is SignalTag {
  return (SIGNAL_TAGS as readonly string[]).includes(value);
}

export function isProtectiveFactor(value: string): value is ProtectiveFactor {
  return (PROTECTIVE_FACTORS as readonly string[]).includes(value);
}

export function isAgeBand(value: string): value is AgeBand {
  return (AGE_BANDS as readonly string[]).includes(value);
}

export function isUrgencyLevel(value: string): value is UrgencyLevel {
  return (URGENCY_LEVELS as readonly string[]).includes(value);
}
