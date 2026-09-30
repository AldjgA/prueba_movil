/**
 * PR-008 · Pesos del motor de derivación.
 *
 * Los pesos son **configuración versionada**, no constantes en código: cambiarlos exige una
 * `weightsVersion` nueva y queda auditado. Es lo que permite ajustar el emparejamiento sin
 * tocar el motor, y lo que hace reproducible una propuesta antigua.
 *
 * ⚠️ **PROVISIONAL.** `PLAN-PUENTE-RED.md` §3.3 y `specs/PR-008-motor-derivacion.md` §4
 * proponen estos valores, pero **nadie ha definido todavía qué significa "el más apropiado"**
 * (pregunta **P6**, abierta). Los valores son una propuesta, no un dato clínico.
 */

export const WEIGHTS_VERSION = "routing-weights/1.0.0-provisional";

export interface RoutingWeights {
  /** La especialidad cubre el tipo de situación. */
  readonly specialtyMatch: number;
  /** El respondedor atiende la banda de edad del caso. */
  readonly ageBandMatch: number;
  /** Idioma en común. */
  readonly languageMatch: number;
  /** Misma zona. */
  readonly zoneMatch: number;
  /** Participa en guardia (solo relevante fuera de horario). */
  readonly onCall: number;

  /**
   * ⚠️ **A 0 por decisión explícita, no por olvido.**
   *
   * La spec lista un peso para *"factores protectores ya cubiertos por el respondedor"*
   * (10 puntos), pero **no define su semántica**: no hay en el contrato ningún vínculo entre
   * un respondedor y los factores protectores de un caso. Implementarlo exigiría inventar
   * una regla de triaje, que es exactamente lo que la plantilla prohíbe
   * (*"si algo no aplica, escribe `—` y di por qué"*; *"no lo inventes: abre una pregunta"*).
   *
   * El peso queda **declarado y configurable** para que el clínico lo active cuando responda
   * **P6**. Hoy vale 0.
   */
  readonly protectiveCoverage: number;

  /** Penalización por carga abierta por encima de la mediana. */
  readonly loadPenalty: number;
  /** Penalización por carga muy por encima de la mediana. */
  readonly veryHighLoadPenalty: number;
  /** Penalización por concentración reciente por encima de la mediana. */
  readonly concentrationPenalty: number;
}

export const DEFAULT_WEIGHTS: RoutingWeights = {
  specialtyMatch: 30,
  ageBandMatch: 20,
  languageMatch: 8,
  zoneMatch: 7,
  onCall: 10,
  protectiveCoverage: 0, // ver comentario arriba — pendiente de P6
  loadPenalty: -12,
  veryHighLoadPenalty: -25,
  concentrationPenalty: -15,
};

/**
 * Umbrales de equidad, expresados como **múltiplos de la mediana** del equipo.
 *
 * Relativos y no absolutos a propósito: con un equipo de tres personas, "carga alta" no
 * puede significar un número fijo. Lo que importa es que la carga **no se concentre**
 * (`PLAN-PUENTE-RED.md` §3.3).
 */
export interface EquityThresholds {
  readonly highLoadMultiplier: number;
  readonly veryHighLoadMultiplier: number;
  readonly concentrationMultiplier: number;
}

export const DEFAULT_EQUITY_THRESHOLDS: EquityThresholds = {
  highLoadMultiplier: 1.0,
  veryHighLoadMultiplier: 2.0,
  concentrationMultiplier: 1.0,
};

/** Mediana. Con lista vacía devuelve 0; con lista par, la media de los dos centrales. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] as number;
  const lower = sorted[middle - 1] as number;
  const upper = sorted[middle] as number;
  return (lower + upper) / 2;
}
