/**
 * PR-010 · Auditoría de autenticación (criterio 8).
 *
 * Cada inicio de sesión **exitoso y fallido** deja evento. El fallido es el que más importa:
 * es la única señal de que alguien está probando credenciales.
 *
 * El evento **no** guarda la contraseña, ni el correo completo en el caso de un fallo — solo
 * lo necesario para investigar sin crear un registro de datos personales.
 */

export type AuthAuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "SESSION_EXPIRED"
  | "AUTHORIZATION_DENIED";

export interface AuthAuditEvent {
  readonly action: AuthAuditAction;
  /** Identificador del profesional. `null` en un login fallido: no se sabe quién era. */
  readonly actorId: string | null;
  /** Correo **enmascarado** en los fallos; completo en los éxitos. */
  readonly emailHint: string;
  /** Clave de catálogo con el motivo del rechazo, si lo hubo. */
  readonly reasonKey: string | null;
  readonly at: string; // ISO-8601
}

export interface AuthAuditSink {
  record(event: AuthAuditEvent): void;
}

export const NOOP_AUTH_AUDIT_SINK: AuthAuditSink = {
  record: () => {
    /* intencionadamente vacío */
  },
};

export class InMemoryAuthAuditSink implements AuthAuditSink {
  readonly #events: AuthAuditEvent[] = [];

  record(event: AuthAuditEvent): void {
    this.#events.push(event);
  }

  events(): readonly AuthAuditEvent[] {
    return [...this.#events];
  }

  count(): number {
    return this.#events.length;
  }
}

/**
 * Enmascara un correo para poder investigar sin guardar el dato completo.
 * `ana.lopez@ong.org` → `a***z@ong.org`
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0] ?? "*"}***${domain}`;
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}
