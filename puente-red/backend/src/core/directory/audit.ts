/**
 * PR-007 · Auditoría del directorio (criterio 4).
 *
 * Toda modificación del directorio deja un evento. El evento **no** guarda contenido
 * sensible: solo qué acción, sobre quién, quién la hizo y cuándo (`PR-018`).
 */

import type { ResponderId } from "./types.ts";

export type DirectoryAuditAction =
  | "RESPONDER_CREATED"
  | "RESPONDER_UPDATED"
  | "RESPONDER_ACTIVATED"
  | "RESPONDER_DEACTIVATED";

export interface DirectoryAuditEvent {
  readonly action: DirectoryAuditAction;
  readonly targetId: ResponderId;
  /** `null` si lo hizo el sistema (siembra de la demo). */
  readonly actorId: string | null;
  readonly at: string; // ISO-8601
  /** Metadatos sin contenido sensible: p. ej. qué campos cambiaron, nunca sus valores. */
  readonly metadata: Readonly<Record<string, string>>;
}

export interface AuditSink {
  record(event: DirectoryAuditEvent): void;
}

/** Sumidero que no hace nada. Útil en pruebas y en contextos sin auditoría. */
export const NOOP_AUDIT_SINK: AuditSink = {
  record: () => {
    /* intencionadamente vacío */
  },
};

/** Sumidero en memoria. En producción lo sustituye el `audit_event` de `PR-004` §4.3. */
export class InMemoryAuditSink implements AuditSink {
  readonly #events: DirectoryAuditEvent[] = [];

  record(event: DirectoryAuditEvent): void {
    this.#events.push(event);
  }

  events(): readonly DirectoryAuditEvent[] {
    return [...this.#events];
  }

  count(): number {
    return this.#events.length;
  }
}
