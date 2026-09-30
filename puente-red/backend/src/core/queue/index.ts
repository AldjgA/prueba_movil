/**
 * PR-009 · API pública del paquete `queue`.
 *
 * `PR-011` (home profesional), `PR-012` (centro de alertas) y `PR-015` (timeline) consumen
 * esta cola. `PR-019` consume `projectForYouth` para el Contrato B.
 */

export {
  ALLOWED_TRANSITIONS,
  CASE_STATES,
  STATES_WITH_CONTACT_CHANNEL,
  STATES_WITH_PROFESSIONAL_VISIBLE,
  canTransition,
  isCaseState,
  isTerminal,
  stateOrder,
} from "./states.ts";
export type { CaseState } from "./states.ts";

export { DEFAULT_SLA_WINDOWS, SLA_VERSION, computeSlaDue, computeSlaStatus } from "./sla.ts";
export type { SlaDueDates, SlaStatus, SlaWindows } from "./sla.ts";

export {
  InMemoryCaseAuditSink,
  NOOP_CASE_AUDIT_SINK,
} from "./audit.ts";
export type { CaseAuditAction, CaseAuditEvent, CaseAuditSink } from "./audit.ts";

export {
  CaseQueue,
  DEFAULT_CONTRATO_VERSION,
  InMemoryCaseStore,
  QUEUE_VERSION,
  SYSTEM_CLOCK,
} from "./queue.ts";
export type { CaseQueueDeps, CaseStore, QueueRejection, QueueResult } from "./queue.ts";

export { REVOCATION_REASONS, SYSTEM_ACTOR, humanActor } from "./types.ts";
export type {
  Actor,
  CaseTicket,
  Clock,
  EnqueueInput,
  RevocationReason,
  YouthVisibleCaseStatus,
} from "./types.ts";
