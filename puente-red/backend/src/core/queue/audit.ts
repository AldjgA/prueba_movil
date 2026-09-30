/**
 * PR-009 · Auditoría de la cola (criterio 2).
 *
 * Toda transición deja un evento con **actor e instante**. El evento **no** guarda contenido
 * sensible: prueba *que* se accedió y qué cambió, no *qué* se leyó (`PR-018`).
 *
 * El actor es obligatorio y está tipado: un evento humano **no puede** tener `actorId` nulo.
 */

import type { CaseState } from "./states.ts";

export type CaseAuditAction = "CASE_ENQUEUED" | "STATE_CHANGED";

export interface CaseAuditEvent {
  readonly action: CaseAuditAction;
  readonly caseToken: string;
  /** `null` en el alta: el caso no venía de ningún estado. */
  readonly from: CaseState | null;
  readonly to: CaseState;
  readonly actorKind: "SYSTEM" | "HUMAN";
  readonly actorId: string | null;
  /** Clave de catálogo: por qué se hizo la transición. */
  readonly reasonKey: string | null;
  readonly at: string; // ISO-8601
}

export interface CaseAuditSink {
  record(event: CaseAuditEvent): void;
}

export const NOOP_CASE_AUDIT_SINK: CaseAuditSink = {
  record: () => {
    /* intencionadamente vacío */
  },
};

export class InMemoryCaseAuditSink implements CaseAuditSink {
  readonly #events: CaseAuditEvent[] = [];

  record(event: CaseAuditEvent): void {
    this.#events.push(event);
  }

  events(): readonly CaseAuditEvent[] {
    return [...this.#events];
  }

  count(): number {
    return this.#events.length;
  }
}
