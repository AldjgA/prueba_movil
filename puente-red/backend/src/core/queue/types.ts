/**
 * PR-009 · Tipos de la cola.
 *
 * **Criterio 9, garantizado por el tipo:** `YouthVisibleCaseStatus` tiene **ocho campos y
 * ninguno más**. No hay dónde poner el estado interno, la carga del profesional ni las notas
 * internas — que es exactamente lo que el guardrail #4 prohíbe que llegue al joven.
 */

import type { ProfessionalCategory, PublicProfessional } from "../directory/index.ts";
import type { CaseState } from "./states.ts";

/**
 * Quién provoca una transición.
 *
 * La distinción no es decorativa: **`ACEPTADO` exige un actor humano** (criterio 6). Ese acto
 * es la validación humana que el guardrail #2 exige — el LLM propone, la persona decide.
 */
export type Actor =
  | { readonly kind: "HUMAN"; readonly id: string }
  | { readonly kind: "SYSTEM" };

export const SYSTEM_ACTOR: Actor = { kind: "SYSTEM" };

export function humanActor(id: string): Actor {
  return { kind: "HUMAN", id };
}

/** Motivos de revocación. Mismos valores que el APK (`RevocationReason`), sin inventar estados. */
export const REVOCATION_REASONS = [
  "CONSENT_WITHDRAWN",
  "CLOSED_BY_TEAM",
  "WINDOW_EXPIRED",
] as const;
export type RevocationReason = (typeof REVOCATION_REASONS)[number];

/**
 * Expediente del caso: lo que el **Contrato A** (`PR-003` §4) ya define y que la ficha de caso
 * (`PR-013`) necesita mostrar.
 *
 * **Nada de esto se inventa aquí**: son campos del contrato. Lo que NO está son las
 * características del caso (`PR-006`), que la ficha declarará como no disponibles.
 */
export interface Expediente {
  /** Claves del catálogo canónico de `motivo` (`PR-003` §4.2). Nunca texto libre. */
  readonly motivoKeys: readonly string[];
  /** Resumen autorizado por el joven. `scope` es CERRADO. */
  readonly resumenAutorizado: {
    readonly scope: readonly string[];
    readonly note?: string;
  };
  readonly consentimiento: {
    readonly id: string;
    readonly scope: readonly string[];
    readonly otorgadoEnEpochMillis: number;
  } | null;
  /**
   * Herramientas que el joven **autorizó** compartir: las entradas `Tool` de su `scope`
   * (hallazgo **K3** de B). Fuera del `scope` no hay herramientas — y eso es correcto.
   */
  readonly herramientasAutorizadas: readonly string[];
}

/** El ticket interno del caso. **Nunca sale entero hacia el joven.** */
export interface CaseTicket {
  readonly caseToken: string;
  readonly state: CaseState;
  readonly category: ProfessionalCategory | null;
  readonly originLevel: string;
  readonly rulesetVersion: string;
  /** Propuesto por `PR-008`. No es asignación efectiva hasta `ACEPTADO`. */
  readonly proposedAssignee: string | null;
  /** Asignado efectivamente. Solo tras la aceptación humana. */
  readonly assignee: string | null;
  readonly receivedAtEpochMillis: number;
  readonly acknowledgedAtEpochMillis: number | null;
  readonly acceptedAtEpochMillis: number | null;
  readonly closedAtEpochMillis: number | null;
  /**
   * Instante en que el psicólogo **decidió** comunicarse (R1).
   *
   * **El canal es un hecho, no un estado.** No se deduce de `state`: el psicólogo puede
   * trabajar el caso (`EN_CURSO`) sin abrir nunca el canal in-app, porque el canal es **baja
   * prioridad** (`PR-003` §6.2, R2). Deducirlo del estado daría canal a quien no lo abrió.
   */
  readonly contactChannelOpenedAtEpochMillis: number | null;
  readonly ackDueAtEpochMillis: number;
  readonly resolveDueAtEpochMillis: number;
  readonly revocationReason: RevocationReason | null;
  /** Clave de idempotencia de la ingesta. Evita duplicar el caso en reintentos offline. */
  readonly idempotencyKey: string;
  readonly updatedAtEpochMillis: number;
  /** Expediente del Contrato A. `null` si la ingesta no lo trajo. */
  readonly expediente: Expediente | null;
}

/**
 * **Contrato B** (`PR-003` §5): lo que el joven ve del caso.
 *
 * Nueve campos, ni uno más. `psicologo` no nulo desde `ACEPTADO` (R5); `canalContacto` no nulo
 * solo desde `CONTACTO_HABILITADO` (R1). Que el joven vea los datos del profesional **no** le da
 * canal.
 */
export interface YouthVisibleCaseStatus {
  readonly caseToken: string;
  readonly contratoVersion: string;
  readonly estado: CaseState;
  readonly categoria: ProfessionalCategory | null;
  readonly actualizadoEn: string; // ISO-8601
  readonly psicologo: PublicProfessional | null;
  readonly canalContacto: string | null;
  /**
   * **Añadido el 2026-09-30** (hallazgo **K5** de B, `PR-003` §5).
   *
   * Sin este campo, el APK tendría que **inferir el horario del equipo** para ser honesto con
   * los tiempos (`PR-001` P5 y §9). Eso sería copiar localmente una regla de negocio ajena, y
   * se desincronizaría el primer día.
   */
  readonly fueraDeHorario: boolean;
  readonly mensajesNoLeidos: number;
}

export interface Clock {
  nowEpochMillis(): number;
}

/** Entrada de la ingesta. Es el Contrato A ya validado por `PR-004`. */
export interface EnqueueInput {
  readonly caseToken: string;
  readonly originLevel: string;
  readonly rulesetVersion: string;
  readonly category: ProfessionalCategory | null;
  readonly receivedAtEpochMillis?: number;
  /** Expediente del Contrato A, si la ingesta lo trae. */
  readonly expediente?: Expediente;
}
