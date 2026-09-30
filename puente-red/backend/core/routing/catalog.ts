/**
 * PR-008 · Catálogo de motivos y contrapartidas.
 *
 * `ReasonKeys` y `TradeoffKeys` son **claves de catálogo**, nunca prosa (criterio 7). La
 * prosa la renderiza el portal. Eso hace que la recomendación sea **explicable** sin que el
 * motor escriba texto, y que un cambio de copy no toque el motor.
 *
 * El profesional tiene derecho a entender **por qué** se le propone un caso, y por qué no se
 * le propone otro. Estas claves son esa explicación.
 */

export const ROUTING_CATALOG_VERSION = "routing-catalog/1.0.0-provisional";

// ---------------------------------------------------------------------------
// Motivos a favor
// ---------------------------------------------------------------------------
export const REASON = {
  /** La especialidad del respondedor cubre el tipo de situación del caso. */
  SPECIALTY_MATCH: "specialty_match",
  /** El respondedor atiende la banda de edad del caso. */
  AGE_BAND_MATCH: "age_band_match",
  /** El respondedor habla un idioma del caso. */
  LANGUAGE_MATCH: "language_match",
  /** El respondedor opera en la zona del caso. */
  ZONE_MATCH: "zone_match",
  /** El respondedor tiene poca carga abierta. */
  LOW_LOAD: "low_load",
  /** El respondedor participa en guardia. */
  ON_CALL: "on_call",
} as const;

export type ReasonKey = (typeof REASON)[keyof typeof REASON];

// ---------------------------------------------------------------------------
// Contrapartidas (lo que juega en contra)
// ---------------------------------------------------------------------------
export const TRADEOFF = {
  /** Carga abierta por encima de la mediana del equipo. */
  HIGH_LOAD: "high_load",
  /** Carga muy por encima de la mediana: se penaliza con dureza. */
  VERY_HIGH_LOAD: "very_high_load",
  /** Concentración reciente de casos por encima de la mediana. */
  RECENT_CONCENTRATION: "recent_concentration",
  /** El caso llega fuera del horario de servicio. */
  OUT_OF_HOURS: "out_of_hours",
  /** Nadie de los elegibles está de guardia. */
  NO_ON_CALL: "no_on_call",
  /** ⚠️ El perfil es de demostración: la propuesta NO es operativa. */
  FICTIONAL_PROFILE: "fictional_profile",
  /** El respondedor es personal capacitado, no psicólogo (solo aplica a MEDIO). */
  CAPACITATED_STAFF: "capacitated_staff",
} as const;

export type TradeoffKey = (typeof TRADEOFF)[keyof typeof TRADEOFF];

export const REASON_KEYS: readonly string[] = Object.values(REASON);
export const TRADEOFF_KEYS: readonly string[] = Object.values(TRADEOFF);

export interface RoutingCatalog {
  readonly version: string;
  readonly reasonKeys: readonly string[];
  readonly tradeoffKeys: readonly string[];
}

export const PROVISIONAL_CATALOG: RoutingCatalog = {
  version: ROUTING_CATALOG_VERSION,
  reasonKeys: REASON_KEYS,
  tradeoffKeys: TRADEOFF_KEYS,
};
