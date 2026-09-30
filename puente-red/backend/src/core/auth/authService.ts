/**
 * PR-010 · Servicio de autenticación del portal.
 *
 * Hace tres cosas y ninguna más:
 *
 * 1. **Delega** la verificación de credenciales en el proveedor (criterio 1).
 * 2. **Audita** cada intento, exitoso o fallido (criterio 8).
 * 3. **Guardia** cada acción del portal, para que ninguna ruta se ejecute sin pasar por
 *    `authorize` (criterio 9).
 *
 * Lo que **no** hace: comparar contraseñas, guardar hashes, ni distinguir por qué falló un
 * login. Eso es lo que hace que el criterio 2 se cumpla por construcción.
 */

import {
  InMemoryAuthAuditSink,
  NOOP_AUTH_AUDIT_SINK,
  maskEmail,
  type AuthAuditSink,
} from "./audit.ts";
import type { AuthPort } from "./authPort.ts";
import { authorize, rejectionKey, type AuthzDecision, type ResourceRef } from "./authorize.ts";
import {
  DEFAULT_SESSION_POLICY,
  createSession,
  touchSession,
  type ProfessionalSession,
  type SessionPolicy,
} from "./session.ts";
import type { PortalAction } from "./roles.ts";

export const AUTH_SERVICE_VERSION = "auth-service/1.0.0";

/** Mensaje **único** para cualquier fallo de credenciales (criterio 2). */
export const GENERIC_SIGN_IN_MESSAGE = "Correo o contraseña incorrectos.";

export const SYSTEM_CLOCK = { nowEpochMillis: () => Date.now() };

export type SignInFailureReason = "INVALID_CREDENTIALS" | "PROVIDER_ERROR";

export type SignInResult =
  | { readonly ok: true; readonly session: ProfessionalSession; readonly refreshToken: string }
  | { readonly ok: false; readonly reason: SignInFailureReason; readonly message: string };

export interface AuthServiceDeps {
  readonly port: AuthPort;
  readonly audit?: AuthAuditSink;
  readonly clock?: { nowEpochMillis(): number };
  readonly policy?: SessionPolicy;
}

export class AuthService {
  readonly #port: AuthPort;
  readonly #audit: AuthAuditSink;
  readonly #clock: { nowEpochMillis(): number };
  readonly #policy: SessionPolicy;

  constructor(deps: AuthServiceDeps) {
    this.#port = deps.port;
    this.#audit = deps.audit ?? NOOP_AUTH_AUDIT_SINK;
    this.#clock = deps.clock ?? SYSTEM_CLOCK;
    this.#policy = deps.policy ?? DEFAULT_SESSION_POLICY;
  }

  /**
   * Inicia sesión delegando en el proveedor.
   *
   * Cualquier fallo de credenciales produce **el mismo** mensaje y **el mismo** `reasonKey`
   * en la auditoría. Distinguirlos convertiría el login en un oráculo.
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    const result = await this.#port.signIn({ email, password });

    if (!result.ok) {
      this.#audit.record({
        action: "LOGIN_FAILURE",
        actorId: null,
        emailHint: maskEmail(email),
        reasonKey: `auth.${result.reason.toLowerCase()}`,
        at: new Date(this.#clock.nowEpochMillis()).toISOString(),
      });
      return {
        ok: false,
        reason: result.reason,
        message: GENERIC_SIGN_IN_MESSAGE,
      };
    }

    const session = createSession({
      responderId: result.responderId,
      role: result.role,
      institutionId: result.institutionId,
      isDemo: result.isDemo,
      nowEpochMillis: this.#clock.nowEpochMillis(),
      policy: this.#policy,
    });

    this.#audit.record({
      action: "LOGIN_SUCCESS",
      actorId: result.responderId,
      emailHint: maskEmail(email),
      reasonKey: null,
      at: new Date(this.#clock.nowEpochMillis()).toISOString(),
    });

    return { ok: true, session, refreshToken: result.refreshToken };
  }

  async signOut(session: ProfessionalSession): Promise<void> {
    await this.#port.signOut({ responderId: session.responderId });
    this.#audit.record({
      action: "LOGOUT",
      actorId: session.responderId,
      emailHint: "",
      reasonKey: null,
      at: new Date(this.#clock.nowEpochMillis()).toISOString(),
    });
  }

  /** Marca actividad en la sesión. No prolonga la caducidad absoluta. */
  touch(session: ProfessionalSession): ProfessionalSession {
    return touchSession(session, this.#clock.nowEpochMillis());
  }

  /**
   * Guardia de una acción del portal (criterio 9).
   *
   * Audita **solo los rechazos**: un `VIEW_ALERTS` correcto no merece un evento, pero un
   * intento de `orientador` de escribir notas internas sí.
   */
  guard(
    session: ProfessionalSession | null,
    action: PortalAction,
    resource?: ResourceRef,
  ): AuthzDecision {
    const decision = authorize(session, action, {
      nowEpochMillis: this.#clock.nowEpochMillis(),
      policy: this.#policy,
      ...(resource === undefined ? {} : { resource }),
    });

    if (!decision.allowed) {
      this.#audit.record({
        action: "AUTHORIZATION_DENIED",
        actorId: session?.responderId ?? null,
        emailHint: "",
        reasonKey: rejectionKey(decision.reason),
        at: new Date(this.#clock.nowEpochMillis()).toISOString(),
      });
    }

    return decision;
  }

  auditEvents() {
    return this.#audit instanceof InMemoryAuthAuditSink ? this.#audit.events() : [];
  }
}
