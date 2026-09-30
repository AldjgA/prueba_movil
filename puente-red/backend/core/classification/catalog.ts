/**
 * PR-005 · Catálogo de claves de justificación (`rationaleKeys`).
 *
 * **Por qué existe:** el modelo no devuelve prosa. Devuelve claves de un conjunto CERRADO;
 * la prosa la renderiza el portal desde este catálogo versionado. Eso (a) evita que el
 * modelo inyecte texto arbitrario hacia una superficie humana y (b) hace el resultado
 * diffeable y auditable.
 *
 * ⚠️ **ESTADO: PROVISIONAL.** El catálogo definitivo lo fija el clínico en `PR-001` §5
 * (ver `specs/PR-005-clasificador-llm.md` §9). Las claves de abajo se derivan de los
 * criterios que **ya están escritos** en el resumen ejecutivo §4 y en
 * `PLAN-PUENTE-RED.md` §7. Cuando `PR-001` §5 se publique con su catálogo, este archivo se
 * sustituye y `CATALOG_VERSION` sube de versión.
 *
 * Añadir una clave es una **decisión de producto**, no de código.
 */

export const CATALOG_VERSION = "rationale-catalog/1.0.0-provisional";

export const RATIONALE = {
  /** El nivel de origen era ROJO: no es degradable (D2 / `PR-003` §9.4). */
  ORIGEN_ROJO_NO_DEGRADABLE: "origen_rojo_no_degradable",

  /** Varios factores acumulados en el periodo (`PR-001` §4.2, amarillo). */
  ACUMULACION_DE_FACTORES: "acumulacion_de_factores",

  /** El malestar persiste en el tiempo. */
  PERSISTENCIA: "persistencia",

  /** Aislamiento observado. */
  AISLAMIENTO: "aislamiento",

  /** Deterioro del ámbito escolar. */
  DETERIORO_ESCOLAR: "deterioro_escolar",

  /** Violencia declarada, no inmediata. */
  VIOLENCIA_NO_INMEDIATA: "violencia_no_inmediata",

  /** Hay factores protectores que permiten una revisión programada. */
  FACTORES_PROTECTORES: "factores_protectores",

  /** El clasificador estaba apagado o no disponible: se aplicó el fallback conservador. */
  FALLBACK_CONSERVADOR: "fallback_conservador",
} as const;

export type RationaleKey = (typeof RATIONALE)[keyof typeof RATIONALE];

/** Conjunto cerrado de claves válidas. */
export const RATIONALE_KEYS: readonly string[] = Object.values(RATIONALE);

export function isKnownRationaleKey(key: string): boolean {
  return RATIONALE_KEYS.includes(key);
}

/**
 * Catálogo con su versión, para que `PR-018` pueda auditar qué vocabulario estaba vigente
 * cuando se emitió una propuesta.
 */
export interface RationaleCatalog {
  readonly version: string;
  readonly keys: readonly string[];
  has(key: string): boolean;
}

export const PROVISIONAL_CATALOG: RationaleCatalog = {
  version: CATALOG_VERSION,
  keys: RATIONALE_KEYS,
  has: isKnownRationaleKey,
};
