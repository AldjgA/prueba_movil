/**
 * PR-011 · Composición del tablero «¿Qué necesita nuestra atención ahora?»
 *
 * **Qué es:** la lista priorizada que un equipo pequeño mira al empezar el día para decidir en
 * qué gasta su tiempo. No es un panel de métricas: es un **triaje**.
 *
 * **Qué NO es:** no es la lista completa (`PR-012`), ni el detalle del caso (`PR-013`), ni los
 * agregados (`PR-017`).
 *
 * La urgencia y el orden viven en `../triage/urgency.ts`, **compartidos con `PR-012`**: la spec
 * de alertas exige el mismo orden, y dos copias divergirían.
 */

import type { Directory, ProfessionalCategory } from "../directory/index.ts";
import type { CaseQueue, CaseState } from "../queue/index.ts";
import {
  ESTADOS_FUERA_DE_ATENCION,
  compararUrgencia,
  evaluarUrgencia,
  type AttentionReason,
  type MotiveKey,
  type PatternKey,
} from "../triage/urgency.ts";

// Reexportado para que los consumidores de `PR-011` no dependan de la ruta interna.
export { MOTIVE, PATTERN } from "../triage/urgency.ts";
export type { AttentionReason, MotiveKey, PatternKey } from "../triage/urgency.ts";

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

export function buildTodayBoard(params: BuildTodayBoardParams): TodayBoard {
  const evaluados = params.queue
    .list()
    .filter((t) => !ESTADOS_FUERA_DE_ATENCION.includes(t.state))
    .map((ticket) => {
      const urgencia = evaluarUrgencia({
        ticket,
        status: params.queue.status(ticket.caseToken, params.outOfHours),
        outOfHours: params.outOfHours,
        nowEpochMillis: params.nowEpochMillis,
      });

      const responsableId = ticket.assignee ?? ticket.proposedAssignee;
      const card: AttentionCard = {
        caseToken: ticket.caseToken,
        category: ticket.category,
        reason: urgencia.reason,
        reasons: urgencia.reasons,
        motiveKey: urgencia.motiveKey,
        patternKeys: urgencia.patternKeys,
        waitingSinceEpochMillis: ticket.receivedAtEpochMillis,
        waitingMillis: urgencia.waitingMillis,
        assigneeId: responsableId,
        assigneeName:
          responsableId === null ? null : (params.directory.get(responsableId)?.displayName ?? null),
        state: ticket.state,
        slaBreached: urgencia.slaBreached,
        outOfHours: params.outOfHours,
      };

      return { card, severity: urgencia.severity };
    });

  evaluados.sort((a, b) =>
    compararUrgencia(
      { caseToken: a.card.caseToken, waitingMillis: a.card.waitingMillis, severity: a.severity },
      { caseToken: b.card.caseToken, waitingMillis: b.card.waitingMillis, severity: b.severity },
    ),
  );
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
