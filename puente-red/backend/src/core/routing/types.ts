/**
 * PR-008 · Tipos del motor de derivación.
 *
 * **Criterio 8, garantizado por el tipo:** `RoutingProposal` **no tiene** campo `assignee`.
 * El motor propone; asignar es un acto humano (`ACEPTADO`, `PR-003` §3.1). No es una
 * promesa de estilo: no hay dónde ponerlo.
 */

import type { CaseFeatureSet } from "../features/index.ts";
import type {
  Clock,
  Language,
  ProfessionalCategory,
  ResponderId,
  Zone,
} from "../directory/index.ts";

export type { Clock };

export type RoutingOutcome =
  /** Hay candidatos; la propuesta es utilizable. */
  | "PROPOSED"
  /** No hay ningún respondedor elegible. El caso **no** se queda sin ruta: escala. */
  | "NO_ELIGIBLE_RESPONDER"
  /**
   * Caso `ALTO` fuera de horario y nadie de guardia. Es el resultado **honesto** cuando no
   * hay cobertura 24/7 (`PR-003` §15): no se asigna a alguien que no está.
   */
  | "REQUIRES_ON_CALL_ESCALATION";

export interface Candidate {
  readonly responderId: ResponderId;
  /** Puntuación interna 0..100+. **No** se muestra como probabilidad. */
  readonly score: number;
  /** Claves de catálogo: por qué se le propone. */
  readonly reasonKeys: readonly string[];
  /** Claves de catálogo: qué juega en contra. */
  readonly tradeoffKeys: readonly string[];
}

export interface RoutingProposal {
  readonly caseToken: string;
  readonly outcome: RoutingOutcome;
  /** Ordenada: el primero es el recomendado. Vacía si no hay elegibles. */
  readonly candidates: readonly Candidate[];
  readonly engineVersion: string;
  readonly weightsVersion: string;
  readonly catalogVersion: string;
  readonly proposedAt: string; // ISO-8601
  /** Motivo del resultado cuando no es `PROPOSED`. Clave de catálogo. */
  readonly outcomeKey: string | null;
}

export interface RoutingContext {
  readonly caseToken: string;
  /** Categoría operativa, de `PR-005`. */
  readonly category: ProfessionalCategory;
  /** Características del caso, de `PR-006`. */
  readonly features: CaseFeatureSet;
  /**
   * ¿El caso llega fuera del horario de servicio?
   *
   * Se recibe del exterior en vez de calcularse aquí: el horario es una decisión operativa
   * de la ONG, y `PR-003` §15 confirma que **no hay guardia 24/7**.
   */
  readonly outOfHours: boolean;

  /**
   * ⚠️ **Opcionales porque el Contrato A todavía no los trae.**
   *
   * `PLAN-PUENTE-RED.md` §3.3 lista idioma y zona entre los atributos de emparejamiento,
   * pero el Contrato A (`PR-003` §4) **no incluye** ni el idioma del joven ni su zona —
   * y con razón: son datos que el joven tendría que declarar y que hoy no declara.
   *
   * Mientras no existan en el contrato, el motor **no se los inventa**: si no llegan, esos
   * pesos simplemente no se aplican. Declarado a A en
   * `deliverables/PR-008/NECESIDADES.md` §7.2.
   */
  readonly preferredLanguages?: readonly Language[];
  readonly preferredZone?: Zone;
}
