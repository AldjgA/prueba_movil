/**
 * PR-009 · Cola de asignación, SLA y trazabilidad.
 *
 * Es la pieza que hace **honesto** al sistema: si el APK promete *"una persona lo está
 * revisando"*, esta cola es la que debe poder cumplirlo.
 *
 * Tres cosas que este módulo garantiza y que conviene no romper:
 *
 * 1. **`ACEPTADO` exige un actor humano** (criterio 6). El LLM propone, la persona decide: es
 *    el guardrail #2 puesto en código, no una convención.
 * 2. **La proyección al joven tiene ocho campos** (criterio 9). El estado interno, la carga
 *    del profesional y las notas internas **no tienen dónde ir**.
 * 3. **El SLA se calcula al leer, no se almacena** (criterio 5). Un incumplimiento depende del
 *    reloj; guardarlo obligaría a un proceso que recorriera la cola cada minuto.
 *
 * **Persistencia:** se accede por el puerto `CaseStore`. La implementación real será Supabase
 * (RLS + `audit_event`, `PR-004` §4); aquí va una en memoria para que la lógica sea
 * demostrable sin base de datos.
 */

import { Directory, type ProfessionalCategory } from "../directory/index.ts";
import { InMemoryCaseAuditSink, NOOP_CASE_AUDIT_SINK, type CaseAuditEvent, type CaseAuditSink } from "./audit.ts";
import { computeSlaDue, computeSlaStatus, DEFAULT_SLA_WINDOWS, type SlaStatus, type SlaWindows } from "./sla.ts";
import {
  ALLOWED_TRANSITIONS,
  STATES_WITH_PROFESSIONAL_VISIBLE,
  canTransition,
  isTerminal,
  type CaseState,
} from "./states.ts";
import type {
  Actor,
  CaseTicket,
  Clock,
  EnqueueInput,
  RevocationReason,
  YouthVisibleCaseStatus,
} from "./types.ts";

export const QUEUE_VERSION = "queue/1.0.0";
export const DEFAULT_CONTRATO_VERSION = "1.0";

export const SYSTEM_CLOCK: Clock = { nowEpochMillis: () => Date.now() };

// ---------------------------------------------------------------------------
// Puerto de persistencia
// ---------------------------------------------------------------------------

export interface CaseStore {
  get(caseToken: string): CaseTicket | null;
  getByIdempotencyKey(key: string): CaseTicket | null;
  put(ticket: CaseTicket): void;
  list(): CaseTicket[];
}

export class InMemoryCaseStore implements CaseStore {
  readonly #byToken = new Map<string, CaseTicket>();
  readonly #byKey = new Map<string, string>();

  get(caseToken: string): CaseTicket | null {
    return this.#byToken.get(caseToken) ?? null;
  }

  getByIdempotencyKey(key: string): CaseTicket | null {
    const token = this.#byKey.get(key);
    return token === undefined ? null : (this.#byToken.get(token) ?? null);
  }

  put(ticket: CaseTicket): void {
    this.#byToken.set(ticket.caseToken, ticket);
    this.#byKey.set(ticket.idempotencyKey, ticket.caseToken);
  }

  list(): CaseTicket[] {
    return [...this.#byToken.values()].sort((a, b) => a.caseToken.localeCompare(b.caseToken));
  }
}

// ---------------------------------------------------------------------------
// Resultados
// ---------------------------------------------------------------------------

export type QueueRejection =
  | "UNKNOWN_CASE"
  | "UNKNOWN_RESPONDER"
  | "ILLEGAL_TRANSITION"
  | "HUMAN_ACTOR_REQUIRED"
  | "MISSING_ACTOR_ID"
  | "MISSING_IDEMPOTENCY_KEY";

export type QueueResult =
  | { readonly ok: true; readonly ticket: CaseTicket }
  | { readonly ok: false; readonly reason: QueueRejection };

export interface CaseQueueDeps {
  readonly directory: Directory;
  readonly store?: CaseStore;
  readonly audit?: CaseAuditSink;
  readonly clock?: Clock;
  readonly slaWindows?: Readonly<Record<ProfessionalCategory, SlaWindows>>;
  readonly contratoVersion?: string;
}

export class CaseQueue {
  readonly #directory: Directory;
  readonly #store: CaseStore;
  readonly #audit: CaseAuditSink;
  readonly #clock: Clock;
  readonly #slaWindows: Readonly<Record<ProfessionalCategory, SlaWindows>>;
  readonly #contratoVersion: string;

  constructor(deps: CaseQueueDeps) {
    this.#directory = deps.directory;
    this.#store = deps.store ?? new InMemoryCaseStore();
    this.#audit = deps.audit ?? NOOP_CASE_AUDIT_SINK;
    this.#clock = deps.clock ?? SYSTEM_CLOCK;
    this.#slaWindows = deps.slaWindows ?? DEFAULT_SLA_WINDOWS;
    this.#contratoVersion = deps.contratoVersion ?? DEFAULT_CONTRATO_VERSION;
  }

  // -------------------------------------------------------------------------
  // Ingesta
  // -------------------------------------------------------------------------

  /**
   * Da de alta el caso en `RECIBIDO`.
   *
   * **Idempotente por `idempotencyKey`** (criterio 7): el APK encola el reporte cuando no hay
   * red y reintenta al reconectar; sin esto, cada reintento crearía un caso nuevo.
   */
  enqueue(input: EnqueueInput, idempotencyKey: string): QueueResult {
    if (idempotencyKey.trim() === "") {
      return { ok: false, reason: "MISSING_IDEMPOTENCY_KEY" };
    }

    const existing = this.#store.getByIdempotencyKey(idempotencyKey);
    if (existing !== null) {
      return { ok: true, ticket: existing };
    }

    const now = input.receivedAtEpochMillis ?? this.#clock.nowEpochMillis();
    const category = input.category ?? "MEDIO";
    const due = computeSlaDue(now, category, this.#slaWindows);

    const ticket: CaseTicket = {
      caseToken: input.caseToken,
      state: "RECIBIDO",
      category: input.category,
      originLevel: input.originLevel,
      rulesetVersion: input.rulesetVersion,
      proposedAssignee: null,
      assignee: null,
      receivedAtEpochMillis: now,
      acknowledgedAtEpochMillis: null,
      acceptedAtEpochMillis: null,
      closedAtEpochMillis: null,
      contactChannelOpenedAtEpochMillis: null,
      ackDueAtEpochMillis: due.ackDueAtEpochMillis,
      resolveDueAtEpochMillis: due.resolveDueAtEpochMillis,
      revocationReason: null,
      idempotencyKey,
      updatedAtEpochMillis: now,
    };

    this.#store.put(ticket);
    this.#emit("CASE_ENQUEUED", ticket.caseToken, null, "RECIBIDO", { kind: "SYSTEM" }, null);

    return { ok: true, ticket };
  }

  // -------------------------------------------------------------------------
  // Transiciones
  // -------------------------------------------------------------------------

  /**
   * Pasa el caso a `EN_COLA` a partir del resultado de `PR-005`.
   *
   * **Recalcula el SLA**: en `RECIBIDO` la categoría todavía no se conoce, así que las fechas
   * límite se habían estimado con las ventanas de `MEDIO`. Al conocer la categoría real
   * (y muy especialmente si es `ALTO`), el reloj del SLA debe ser el correcto. Si no, un caso
   * `ALTO` tendría 4 horas de margen en vez de 5 minutos.
   */
  markClassified(caseToken: string, category: ProfessionalCategory): QueueResult {
    const ticket = this.#store.get(caseToken);
    if (ticket === null) return { ok: false, reason: "UNKNOWN_CASE" };

    const due = computeSlaDue(ticket.receivedAtEpochMillis, category, this.#slaWindows);
    return this.#transition(caseToken, "CLASIFICADO", { kind: "SYSTEM" }, null, {
      category,
      ackDueAtEpochMillis: due.ackDueAtEpochMillis,
      resolveDueAtEpochMillis: due.resolveDueAtEpochMillis,
    });
  }

  enqueueForRouting(caseToken: string): QueueResult {
    return this.#transition(caseToken, "EN_COLA", { kind: "SYSTEM" }, null);
  }

  /**
   * Registra la propuesta de `PR-008` y pasa el caso a `ASIGNADO`.
   *
   * Puede hacerlo el sistema: es solo dejar constancia de la propuesta. **No** es la
   * asignación efectiva — esa ocurre en `accept`, y exige una persona.
   */
  assign(caseToken: string, responderId: string, actor: Actor): QueueResult {
    if (this.#directory.get(responderId) === null) {
      return { ok: false, reason: "UNKNOWN_RESPONDER" };
    }
    return this.#transition(caseToken, "ASIGNADO", actor, null, {
      proposedAssignee: responderId,
      acknowledgedAtEpochMillis: this.#clock.nowEpochMillis(),
    });
  }

  /**
   * **El acto humano obligatorio** (criterio 6): un profesional acepta el caso.
   *
   * Sin un actor humano identificado, esto **no ocurre**. Es la validación que el guardrail #2
   * exige, y el instante en que el joven pasa a ver los datos del profesional (R5).
   */
  accept(caseToken: string, responderId: string, actor: Actor): QueueResult {
    if (actor.kind !== "HUMAN") {
      return { ok: false, reason: "HUMAN_ACTOR_REQUIRED" };
    }
    if (actor.id.trim() === "") {
      return { ok: false, reason: "MISSING_ACTOR_ID" };
    }
    if (this.#directory.get(responderId) === null) {
      return { ok: false, reason: "UNKNOWN_RESPONDER" };
    }
    return this.#transition(caseToken, "ACEPTADO", actor, null, {
      assignee: responderId,
      acceptedAtEpochMillis: this.#clock.nowEpochMillis(),
    });
  }

  /** El psicólogo decide comunicarse: se abre el canal in-app (R1). Baja prioridad (R2). */
  openContactChannel(caseToken: string, actor: Actor): QueueResult {
    return this.#transition(caseToken, "CONTACTO_HABILITADO", actor, null, {
      contactChannelOpenedAtEpochMillis: this.#clock.nowEpochMillis(),
    });
  }

  startWork(caseToken: string, actor: Actor): QueueResult {
    return this.#transition(caseToken, "EN_CURSO", actor, null);
  }

  resolve(caseToken: string, actor: Actor): QueueResult {
    return this.#transition(caseToken, "RESUELTO", actor, null);
  }

  /**
   * Cierra el caso. **Cerrar no es resolver** (`REVISION-C.md` §5.1): se puede cerrar sin
   * resolverse, y el motivo queda registrado.
   */
  close(caseToken: string, actor: Actor, revocationReason: RevocationReason | null = null): QueueResult {
    return this.#transition(caseToken, "CERRADO", actor, null, {
      closedAtEpochMillis: this.#clock.nowEpochMillis(),
      revocationReason,
    });
  }

  // -------------------------------------------------------------------------
  // Lectura
  // -------------------------------------------------------------------------

  get(caseToken: string): CaseTicket | null {
    return this.#store.get(caseToken);
  }

  list(): CaseTicket[] {
    return this.#store.list();
  }

  /**
   * Estado del SLA en el instante de lectura (criterio 5).
   *
   * `outOfHours` se recibe del exterior: el horario es una decisión operativa de la ONG y
   * `PR-003` §15 confirma que **no hay guardia 24/7**.
   */
  status(caseToken: string, outOfHours = false): SlaStatus | null {
    const ticket = this.#store.get(caseToken);
    if (ticket === null) return null;

    return computeSlaStatus({
      receivedAtEpochMillis: ticket.receivedAtEpochMillis,
      category: ticket.category ?? "MEDIO",
      nowEpochMillis: this.#clock.nowEpochMillis(),
      acknowledgedAtEpochMillis: ticket.acknowledgedAtEpochMillis,
      hasAssignee: ticket.proposedAssignee !== null,
      outOfHours,
      windows: this.#slaWindows,
    });
  }

  /**
   * **Contrato B** (`PR-003` §5).
   *
   * Nueve campos exactos. `psicologo` aparece desde `ACEPTADO` (R5); `canalContacto`, solo desde
   * que el psicólogo lo abre (R1). El estado interno, la carga y las notas internas **no tienen
   * dónde ir** (criterio 9).
   *
   * `outOfHours` se recibe del exterior (hallazgo **K5** de B): el horario es una regla del
   * equipo y el APK **no debe inferirla**. Se propaga tal cual en `fueraDeHorario`.
   */
  projectForYouth(
    caseToken: string,
    options: { readonly outOfHours?: boolean } = {},
  ): YouthVisibleCaseStatus | null {
    const ticket = this.#store.get(caseToken);
    if (ticket === null) return null;

    const showsProfessional = STATES_WITH_PROFESSIONAL_VISIBLE.includes(ticket.state);
    // El canal depende de un HECHO, no del estado: el psicólogo puede trabajar el caso sin
    // haberlo abierto nunca. Y un caso cerrado no tiene canal.
    const showsChannel =
      ticket.contactChannelOpenedAtEpochMillis !== null && ticket.state !== "CERRADO";

    const psicologo =
      showsProfessional && ticket.assignee !== null
        ? this.#directory.publicView(ticket.assignee)
        : null;

    return {
      caseToken: ticket.caseToken,
      contratoVersion: this.#contratoVersion,
      estado: ticket.state,
      categoria: ticket.category,
      actualizadoEn: new Date(ticket.updatedAtEpochMillis).toISOString(),
      psicologo,
      canalContacto: showsChannel ? "IN_APP" : null,
      fueraDeHorario: options.outOfHours === true,
      mensajesNoLeidos: 0,
    };
  }

  auditEvents(): readonly CaseAuditEvent[] {
    return this.#audit instanceof InMemoryCaseAuditSink ? this.#audit.events() : [];
  }

  // -------------------------------------------------------------------------
  // Interno
  // -------------------------------------------------------------------------

  #transition(
    caseToken: string,
    to: CaseState,
    actor: Actor,
    reasonKey: string | null,
    patch: Partial<CaseTicket> = {},
  ): QueueResult {
    const ticket = this.#store.get(caseToken);
    if (ticket === null) return { ok: false, reason: "UNKNOWN_CASE" };

    if (!canTransition(ticket.state, to)) {
      return { ok: false, reason: "ILLEGAL_TRANSITION" };
    }

    // Un actor humano sin identificador no es un actor humano.
    if (actor.kind === "HUMAN" && actor.id.trim() === "") {
      return { ok: false, reason: "MISSING_ACTOR_ID" };
    }

    const updated: CaseTicket = {
      ...ticket,
      ...patch,
      state: to,
      updatedAtEpochMillis: this.#clock.nowEpochMillis(),
    };

    this.#store.put(updated);
    this.#emit("STATE_CHANGED", caseToken, ticket.state, to, actor, reasonKey);

    return { ok: true, ticket: updated };
  }

  #emit(
    action: CaseAuditEvent["action"],
    caseToken: string,
    from: CaseState | null,
    to: CaseState,
    actor: Actor,
    reasonKey: string | null,
  ): void {
    this.#audit.record({
      action,
      caseToken,
      from,
      to,
      actorKind: actor.kind,
      actorId: actor.kind === "HUMAN" ? actor.id : null,
      reasonKey,
      at: new Date(this.#clock.nowEpochMillis()).toISOString(),
    });
  }
}

/** Reexportado para diagnóstico y para `PR-011`/`PR-012`. */
export { ALLOWED_TRANSITIONS, isTerminal };
