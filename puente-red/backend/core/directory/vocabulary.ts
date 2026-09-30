/**
 * PR-007 · Vocabulario del directorio de respondedores.
 *
 * **Hallazgo de diseño:** el directorio **no es un directorio de psicólogos**. La decisión
 * **D5** establece respuesta **escalonada por gravedad** — personal capacitado para
 * amarillo/medio, psicólogo para rojo/alto. Eso se modela aquí como dos **tipos de
 * respondedor** con un **nivel máximo** distinto, y es una restricción de datos, no de UI.
 *
 * ⚠️ **ESTADO: PROVISIONAL.** Especialidades, zonas e idiomas se derivan de
 * `PLAN-PUENTE-RED.md` §3.3 y del brief §28. El clínico los valida en `PR-001` §7.
 *
 * Nota técnica: sin `enum` (type stripping de Node) → uniones de literales + `as const`.
 */

export const DIRECTORY_VOCABULARY_VERSION = "directory-vocabulary/1.0.0-provisional";

// ---------------------------------------------------------------------------
// Tipos de respondedor (D5)
// ---------------------------------------------------------------------------
export const RESPONDER_KINDS = ["CAPACITATED_STAFF", "PSYCHOLOGIST"] as const;
export type ResponderKind = (typeof RESPONDER_KINDS)[number];

/**
 * Categoría operativa del caso. Mismo vocabulario que `PR-005` (el clasificador), declarado
 * aquí de forma independiente para que los módulos del núcleo no se acoplen.
 */
export const PROFESSIONAL_CATEGORIES = ["MEDIO", "ALTO"] as const;
export type ProfessionalCategory = (typeof PROFESSIONAL_CATEGORIES)[number];

/** Rango para comparar categorías. `ALTO` exige más que `MEDIO`. */
export const CATEGORY_RANK: Readonly<Record<ProfessionalCategory, number>> = {
  MEDIO: 1,
  ALTO: 2,
};

export function categoryAtLeast(
  candidate: ProfessionalCategory,
  required: ProfessionalCategory,
): boolean {
  return CATEGORY_RANK[candidate] >= CATEGORY_RANK[required];
}

// ---------------------------------------------------------------------------
// Atributos de emparejamiento (PLAN-PUENTE-RED §3.3)
// ---------------------------------------------------------------------------
export const SPECIALTIES = ["TRAUMA", "GRIEF", "BULLYING", "FAMILY", "SUBSTANCE"] as const;
export type Specialty = (typeof SPECIALTIES)[number];

export const PROFESSIONAL_ROLES = [
  "PSICOLOGIA",
  "TRABAJO_SOCIAL",
  "ORIENTACION",
  "SUPERVISION",
] as const;
export type ProfessionalRole = (typeof PROFESSIONAL_ROLES)[number];

export const AGE_BANDS = ["13-14", "15-16", "17-18"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

/** Español, aimara, quechua — La Paz. Provisional. */
export const LANGUAGES = ["ES", "AY", "QU"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Zonas de La Paz. Provisional: la ONG define la granularidad real. */
export const ZONES = [
  "CENTRO",
  "SOPOCACHI",
  "MIRAFLORES",
  "SAN_ANTONIO",
  "VILLA_EL_SALVADOR",
  "EL_ALTO",
  "OTRA",
] as const;
export type Zone = (typeof ZONES)[number];

// ---------------------------------------------------------------------------
// Guardas
// ---------------------------------------------------------------------------
export function isResponderKind(value: string): value is ResponderKind {
  return (RESPONDER_KINDS as readonly string[]).includes(value);
}

export function isProfessionalCategory(value: string): value is ProfessionalCategory {
  return (PROFESSIONAL_CATEGORIES as readonly string[]).includes(value);
}

export function isSpecialty(value: string): value is Specialty {
  return (SPECIALTIES as readonly string[]).includes(value);
}

export function isProfessionalRole(value: string): value is ProfessionalRole {
  return (PROFESSIONAL_ROLES as readonly string[]).includes(value);
}

export function isAgeBand(value: string): value is AgeBand {
  return (AGE_BANDS as readonly string[]).includes(value);
}

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

export function isZone(value: string): value is Zone {
  return (ZONES as readonly string[]).includes(value);
}

/**
 * Nivel máximo que puede tomar cada tipo de respondedor (**D5**).
 * Un `CAPACITATED_STAFF` **nunca** puede tener `ALTO`: no es una preferencia, es la
 * restricción que impide que un caso rojo acabe en manos de quien no debe atenderlo.
 */
export const MAX_CATEGORY_BY_KIND: Readonly<Record<ResponderKind, ProfessionalCategory>> = {
  CAPACITATED_STAFF: "MEDIO",
  PSYCHOLOGIST: "ALTO",
};
