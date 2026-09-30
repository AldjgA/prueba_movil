/**
 * PR-011 · Composición del tablero «¿Qué necesita nuestra atención ahora?»
 *
 * **Qué es:** la lista priorizada que un equipo pequeño mira al empezar el día para decidir en
 * qué gasta su tiempo. No es un panel de métricas: es un **triaje**.
 *
 * **Qué NO es:** no es la lista completa (`PR-012`), ni el detalle del caso (`PR-013`), ni los
 * agregados (`PR-017`).
 *
 * ## El orden es la parte importante
 *
 * Dos criterios de la spec tiran en direcciones distintas y hay que conciliarlos:
 *
 * - criterio 1: *un caso `ALTO` sin responsable aparece **siempre** primero*.
 * - criterio 2: *un caso con SLA incumplido aparece **aunque sea antiguo***.
 *
 * La solución es una **severidad** calculada, con el tiempo esperando como criterio secundario.
 * Sin la severidad, un caso `MEDIO` incumplido adelantaría a un rojo sin nadie — y eso sería
 * exactamente el fallo que `PR-001` P5 quiere evitar.
 */

import { Directory, type ProfessionalCategory } from "../directory/index.ts";
import { CaseQueue, type CaseState, type CaseTicket } from "../queue/index.ts";

/** Claves de catálogo. **Nunca prosa**: el copy lo pone el portal (`PR-011` §6). */
export const MOTIVE = {
  SEGURIDAD_PRIORITARIA: "motive.seguridad_prioritaria",
  PATRON_CRECIENTE: "motive.patron_creciente",
  REVISION_PROGRAMADA: "motive.revision_programada",
} as const;

export const PATTERN = {
  /** Pasó la ventana de acuse y sigue sin responsable. */
  ESPERANDO_SIN_ACUSE: "pattern.esperando_sin_acuse",
  /** Queda poco margen antes de incumplir el SLA. */
  SLA_EN_RIESGO: "pattern.sla_en_riesgo",
  /** SLA ya incumplido. */
  SLA_INCUMPLIDO: "pattern.sla_incumplido",
  /** El caso llegó fuera del horario de servicio. */
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
 * El caso 0 es el que no admite discusión: un caso `ALTO` **sin nadie que lo haya tomado**.
 * Por debajo, el incumplimiento de SLA, y después el resto.
 */
const SEVERITY = {
  ALTO_SIN_RESPONSABLE: 0,
  SLA_INCUMPLIDO: 1,
  ALTO_CON_RESPONSABLE: 2,
  SIN_RESPONSABLE: 3,
  SLA_EN_RIESGO: 4,
  RESTO: 5,
} as const;

/** Proporción de la ventana de acuse a partir de la cual el SLA está «en riesgo». */
const SLA_AT_RISK_RATIO = 0.8;

export interface AttentionCard {
  readonly caseToken: string;
  readonly category: ProfessionalCategory | null;
  /** El motivo **más grave** aplicable. Es el que ordena. */
  readonly reason: AttentionReason;
  /** Todos los motivos aplicables, para que la tarjeta pueda explicarse. */
  readonly reasons: readonly AttentionReason[];
  readonly motiveKey: MotiveKey;
  readonly patternKeys: readonly PatternKey[];
  readonly waitingSinceEpochMillis: number;
  readonly waitingMillis: number;
  /** Profesional propuesto o asignado. `null` ⇒ «Sin asignar». */
  readonly assigneeId: string | null;
  readonly assigneeName: string | null;
  readonly state: CaseState;
  readonly slaBreached: boolean;
  readonly outOfHours: boolean;
}

export interface TodayBoard {
  readonly cards: readonly AttentionCard[];
  readonly waitingCount: number;
  readonly unassignedCount: number;
  readonly importantChangeCount: number;
  readonly generatedAtEpochMillis: number;
  readonly outOfHours: boolean;
  /** `true` si el tablero se está demostrando con casos ficticios (`PR-003` Q7). */
  readonly demoData: boolean;
}

export interface BuildTodayBoardParams {
  readonly queue: CaseQueue;
  readonly directory: Directory;
  readonly nowEpochMillis: number;
  readonly outOfHours: boolean;
  readonly demoData?: boolean;
}

/**
 * Estados que **ya no** necesitan atención. `RESUELTO` y `CERRADO` son terminales para este
 * propósito: el trabajo del equipo ya terminó (o el joven revocó).
 */
const ESTADOS_FUERA_DEL_TABLERO: readonly CaseState[] = ["RESUELTO", "CERRADO"];

export function buildTodayBoard(params: BuildTodayBoardParams): TodayBoard {
  const tickets = params.queue.list().filter((t) => !ESTADOS_FUERA_DEL_TABLERO.includes(t.state));

  const evaluados = tickets.map((ticket) => evaluar(ticket, params));

  // Orden: severidad → tiempo esperando desc → caseToken asc (reproducible).
  evaluados.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity - b.severity;
    if (a.card.waitingMillis !== b.card.waitingMillis) {
      return b.card.waitingMillis - a.card.waitingMillis;
    }
    return a.card.caseToken.localeCompare(b.card.caseToken);
  });

  const cards = evaluados.map((e) => e.card);

  return {
    cards,
    waitingCount: cards.length,
    // Criterio 7: mismo criterio que `SlaStatus.unassigned` de `PR-009`.
    unassignedCount: cards.filter((c) => c.reasons.includes("UNASSIGNED")).length,
    importantChangeCount: cards.filter((c) => c.reasons.includes("IMPORTANT_CHANGE")).length,
    generatedAtEpochMillis: params.nowEpochMillis,
    outOfHours: params.outOfHours,
    demoData: params.demoData === true,
  };
}

interface Evaluado {
  readonly card: AttentionCard;
  readonly severity: number;
}

function evaluar(ticket: CaseTicket, params: BuildTodayBoardParams): Evaluado {
  const status = params.queue.status(ticket.caseToken, params.outOfHours);

  const waitingMillis = status?.waitingMillis ?? 0;
  const ackBreached = status?.ackBreached ?? false;
  const resolveBreached = status?.resolveBreached ?? false;
  const slaBreached = ackBreached || resolveBreached;
  const unassigned = status?.unassigned ?? false;

  const sinResponsable = ticket.proposedAssignee === null && ticket.assignee === null;
  const esAlto = ticket.category === "ALTO";
  // «Esperando» = el equipo todavía no ha aceptado el caso.
  const esperando = ticket.state !== "ACEPTADO" && ticket.state !== "CONTACTO_HABILITADO" && ticket.state !== "EN_CURSO";

  const reasons: AttentionReason[] = [];
  if (slaBreached) reasons.push("SLA_BREACHED");
  if (esAlto && esperando) reasons.push("HIGH_WAITING");
  if (unassigned) reasons.push("UNASSIGNED");
  const atRisk = enRiesgo(
    status?.ackDueAtEpochMillis ?? null,
    ticket.receivedAtEpochMillis,
    params.nowEpochMillis,
    ackBreached,
  );
  if (atRisk) reasons.push("SLA_AT_RISK");

  const { severity, reason } = clasificar({ esAlto, sinResponsable, slaBreached, unassigned, atRisk });

  const patternKeys: PatternKey[] = [];
  if (slaBreached) patternKeys.push(PATTERN.SLA_INCUMPLIDO);
  if (unassigned) patternKeys.push(PATTERN.ESPERANDO_SIN_ACUSE);
  if (atRisk) patternKeys.push(PATTERN.SLA_EN_RIESGO);
  if (params.outOfHours) patternKeys.push(PATTERN.FUERA_DE_HORARIO);

  const responsableId = ticket.assignee ?? ticket.proposedAssignee;
  const card: AttentionCard = {
    caseToken: ticket.caseToken,
    category: ticket.category,
    reason,
    reasons,
    motiveKey: motivoDe(ticket),
    patternKeys,
    waitingSinceEpochMillis: ticket.receivedAtEpochMillis,
    waitingMillis,
    assigneeId: responsableId,
    assigneeName:
      responsableId === null ? null : (params.directory.get(responsableId)?.displayName ?? null),
    state: ticket.state,
    slaBreached,
    outOfHours: params.outOfHours,
  };

  return { card, severity };
}

/**
 * Severidad **y motivo** en una sola decisión.
 *
 * Van juntos a propósito: si `reason` se calculara por separado, podría no coincidir con lo que
 * ordena el tablero, y el profesional vería una tarjeta arriba con un motivo que no explica por
 * qué está arriba.
 *
 * Menor severidad = más urgente.
 */
function clasificar(ctx: {
  esAlto: boolean;
  sinResponsable: boolean;
  slaBreached: boolean;
  unassigned: boolean;
  atRisk: boolean;
}): { severity: number; reason: AttentionReason } {
  // Lo que no admite discusión: un rojo que nadie ha tomado.
  if (ctx.esAlto && ctx.sinResponsable) return { severity: SEVERITY.ALTO_SIN_RESPONSABLE, reason: "HIGH_WAITING" };
  if (ctx.slaBreached) return { severity: SEVERITY.SLA_INCUMPLIDO, reason: "SLA_BREACHED" };
  if (ctx.esAlto) return { severity: SEVERITY.ALTO_CON_RESPONSABLE, reason: "HIGH_WAITING" };
  if (ctx.unassigned) return { severity: SEVERITY.SIN_RESPONSABLE, reason: "UNASSIGNED" };
  if (ctx.atRisk) return { severity: SEVERITY.SLA_EN_RIESGO, reason: "SLA_AT_RISK" };
  return { severity: SEVERITY.RESTO, reason: "IMPORTANT_CHANGE" };
}

function motivoDe(ticket: CaseTicket): MotiveKey {
  if (ticket.category === "ALTO") return MOTIVE.SEGURIDAD_PRIORITARIA;
  if (ticket.category === "MEDIO") return MOTIVE.PATRON_CRECIENTE;
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
