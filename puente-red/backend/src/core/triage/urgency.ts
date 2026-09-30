/**
 * Urgencia de un caso — **lógica compartida** entre `PR-011` (home) y `PR-012` (alertas).
 *
 * **Por qué existe este módulo:** la spec de `PR-012` dice literalmente que el orden por defecto
 * es *"igual que `PR-011`"*. Si cada pantalla tuviera su propia copia, un cambio en una haría que
 * las dos pantallas mostraran **prioridades distintas para el mismo caso** — y eso, en un sistema
 * de triaje, es peor que no ordenar.
 *
 * ## El orden
 *
 * `PR-011` tiene dos criterios que tiran en direcciones distintas:
 * - *un caso `ALTO` sin responsable aparece **siempre** primero*;
 * - *un caso con SLA incumplido aparece **aunque sea antiguo***.
 *
 * Se concilian con una **severidad** calculada, y el tiempo esperando como criterio secundario.
 * Sin la severidad, un `MEDIO` incumplido adelantaría a un rojo sin nadie — justo el fallo que
 * `PR-001` P5 quiere evitar.
 */

import type { ProfessionalCategory } from "../directory/index.ts";
import type { CaseState, CaseTicket } from "../queue/index.ts";
import type { SlaStatus } from "../queue/index.ts";

/** Claves de catálogo. **Nunca prosa**: el copy lo pone el portal. */
export const MOTIVE = {
  SEGURIDAD_PRIORITARIA: "motive.seguridad_prioritaria",
  PATRON_CRECIENTE: "motive.patron_creciente",
  REVISION_PROGRAMADA: "motive.revision_programada",
} as const;

export const PATTERN = {
  ESPERANDO_SIN_ACUSE: "pattern.esperando_sin_acuse",
  SLA_EN_RIESGO: "pattern.sla_en_riesgo",
  SLA_INCUMPLIDO: "pattern.sla_incumplido",
  FUERA_DE_HORARIO: "pattern.fuera_de_horario",
} as const;

export type MotiveKey = (typeof MOTIVE)[keyof typeof MOTIVE];
export type PatternKey = (typeof PATTERN)[keyof typeof PATTERN];

export type AttentionReason =
  | "HIGH_WAITING"
  | "UNASSIGNED"
  | "IMPORTANT_CHANGE"
  | "SLA_AT_RISK"
  | "SLA_BREACHED";

/**
 * Severidad. Menor = más urgente. **Es el criterio primario de orden.**
 *
 * El caso 0 no admite discusión: un caso `ALTO` **sin nadie que lo haya tomado**.
 */
export const SEVERITY = {
  ALTO_SIN_RESPONSABLE: 0,
  SLA_INCUMPLIDO: 1,
  ALTO_CON_RESPONSABLE: 2,
  SIN_RESPONSABLE: 3,
  SLA_EN_RIESGO: 4,
  RESTO: 5,
} as const;

/** Proporción de la ventana de acuse a partir de la cual el SLA está «en riesgo». */
export const SLA_AT_RISK_RATIO = 0.8;

/**
 * Estados que **ya no** piden atención. `RESUELTO` y `CERRADO` son terminales para este
 * propósito: el trabajo del equipo terminó (o el joven revocó).
 */
export const ESTADOS_FUERA_DE_ATENCION: readonly CaseState[] = ["RESUELTO", "CERRADO"];

/** Estados en los que el caso está en acompañamiento activo. */
export const ESTADOS_EN_SEGUIMIENTO: readonly CaseState[] = [
  "ACEPTADO",
  "CONTACTO_HABILITADO",
  "EN_CURSO",
];

export interface EvaluacionUrgencia {
  readonly severity: number;
  /** El motivo **más grave** aplicable. Es el que ordena y el que se muestra. */
  readonly reason: AttentionReason;
  /** Todos los motivos aplicables, para que la tarjeta pueda explicarse. */
  readonly reasons: readonly AttentionReason[];
  readonly patternKeys: readonly PatternKey[];
  readonly motiveKey: MotiveKey;
  readonly waitingMillis: number;
  readonly slaBreached: boolean;
  readonly unassigned: boolean;
  readonly atRisk: boolean;
  readonly outOfHours: boolean;
}

export interface EvaluarUrgenciaParams {
  readonly ticket: CaseTicket;
  /** `null` si el caso no está en la cola (no debería pasar). */
  readonly status: SlaStatus | null;
  readonly outOfHours: boolean;
  readonly nowEpochMillis: number;
}

export function evaluarUrgencia(params: EvaluarUrgenciaParams): EvaluacionUrgencia {
  const { ticket, status } = params;

  const waitingMillis = status?.waitingMillis ?? 0;
  const ackBreached = status?.ackBreached ?? false;
  const resolveBreached = status?.resolveBreached ?? false;
  const slaBreached = ackBreached || resolveBreached;
  const unassigned = status?.unassigned ?? false;

  const sinResponsable = ticket.proposedAssignee === null && ticket.assignee === null;
  const esAlto = ticket.category === "ALTO";
  // «Esperando» = el equipo todavía no ha aceptado el caso.
  const esperando = !ESTADOS_EN_SEGUIMIENTO.includes(ticket.state);

  const atRisk = enRiesgo(
    status?.ackDueAtEpochMillis ?? null,
    ticket.receivedAtEpochMillis,
    params.nowEpochMillis,
    ackBreached,
  );

  const reasons: AttentionReason[] = [];
  if (slaBreached) reasons.push("SLA_BREACHED");
  if (esAlto && esperando) reasons.push("HIGH_WAITING");
  if (unassigned) reasons.push("UNASSIGNED");
  if (atRisk) reasons.push("SLA_AT_RISK");

  const { severity, reason } = clasificar({ esAlto, sinResponsable, slaBreached, unassigned, atRisk });

  const patternKeys: PatternKey[] = [];
  if (slaBreached) patternKeys.push(PATTERN.SLA_INCUMPLIDO);
  if (unassigned) patternKeys.push(PATTERN.ESPERANDO_SIN_ACUSE);
  if (atRisk) patternKeys.push(PATTERN.SLA_EN_RIESGO);
  if (params.outOfHours) patternKeys.push(PATTERN.FUERA_DE_HORARIO);

  return {
    severity,
    reason,
    reasons,
    patternKeys,
    motiveKey: motivoDe(ticket.category),
    waitingMillis,
    slaBreached,
    unassigned,
    atRisk,
    outOfHours: params.outOfHours,
  };
}

/**
 * Severidad **y motivo** en una sola decisión.
 *
 * Van juntos a propósito: si `reason` se calculara por separado, podría no coincidir con lo que
 * ordena la lista, y el profesional vería una fila arriba con un motivo que no explica por qué
 * está arriba.
 */
export function clasificar(ctx: {
  esAlto: boolean;
  sinResponsable: boolean;
  slaBreached: boolean;
  unassigned: boolean;
  atRisk: boolean;
}): { severity: number; reason: AttentionReason } {
  // Lo que no admite discusión: un rojo que nadie ha tomado.
  if (ctx.esAlto && ctx.sinResponsable) {
    return { severity: SEVERITY.ALTO_SIN_RESPONSABLE, reason: "HIGH_WAITING" };
  }
  if (ctx.slaBreached) return { severity: SEVERITY.SLA_INCUMPLIDO, reason: "SLA_BREACHED" };
  if (ctx.esAlto) return { severity: SEVERITY.ALTO_CON_RESPONSABLE, reason: "HIGH_WAITING" };
  if (ctx.unassigned) return { severity: SEVERITY.SIN_RESPONSABLE, reason: "UNASSIGNED" };
  if (ctx.atRisk) return { severity: SEVERITY.SLA_EN_RIESGO, reason: "SLA_AT_RISK" };
  return { severity: SEVERITY.RESTO, reason: "IMPORTANT_CHANGE" };
}

/** Lo mínimo que hace falta para ordenar. */
export interface Ordenable {
  readonly caseToken: string;
  readonly waitingMillis: number;
  readonly severity: number;
}

/**
 * Orden por defecto: severidad → tiempo esperando desc → caseToken asc (reproducible).
 *
 * **Ojo:** recibe `severity`, no solo la tarjeta. Si se le pasa un objeto sin `severity`, la
 * comparación da `NaN` y el `sort` **no ordena nada** — y como el backend no comprueba tipos
 * (Node los borra), el fallo es silencioso. Por eso el tipo lo exige explícitamente.
 */
export function compararUrgencia(a: Ordenable, b: Ordenable): number {
  if (a.severity !== b.severity) return a.severity - b.severity;
  if (a.waitingMillis !== b.waitingMillis) return b.waitingMillis - a.waitingMillis;
  return a.caseToken.localeCompare(b.caseToken);
}

function motivoDe(category: ProfessionalCategory | null): MotiveKey {
  if (category === "ALTO") return MOTIVE.SEGURIDAD_PRIORITARIA;
  if (category === "MEDIO") return MOTIVE.PATRON_CRECIENTE;
  return MOTIVE.REVISION_PROGRAMADA;
}

function enRiesgo(
  ackDueAtEpochMillis: number | null,
  receivedAtEpochMillis: number,
  nowEpochMillis: number,
  ackBreached: boolean,
): boolean {
  if (ackBreached || ackDueAtEpochMillis === null) return false;
  const ventana = ackDueAtEpochMillis - receivedAtEpochMillis;
  if (ventana <= 0) return false;
  const transcurrido = nowEpochMillis - receivedAtEpochMillis;
  return transcurrido >= ventana * SLA_AT_RISK_RATIO;
}
