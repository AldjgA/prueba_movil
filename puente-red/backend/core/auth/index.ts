/**
 * PR-010 · API pública del paquete `auth`.
 *
 * `PR-011`…`PR-017` (portal) consumen `AuthService.guard` en **toda** acción, y `PR-018`
 * consume los eventos de auditoría.
 */

export {
  AUTHORIZATION_MATRIX,
  PORTAL_ACTIONS,
  PROFESSIONAL_ROLES,
  WRITE_ACTIONS,
  isPortalAction,
  isProfessionalRole,
  isWriteAction,
  roleCan,
} from "./roles.ts";
export type { PortalAction, ProfessionalRole } from "./roles.ts";

export {
  DEFAULT_ABSOLUTE_TTL_MS,
  DEFAULT_IDLE_TIMEOUT_MS,
  DEFAULT_SESSION_POLICY,
  SESSION_POLICY_VERSION,
  createSession,
  isSessionAlive,
  sessionExpiryReason,
  touchSession,
} from "./session.ts";
export type {
  CreateSessionParams,
  ProfessionalSession,
  SessionExpiryReason,
  SessionPolicy,
} from "./session.ts";

export { authorize, rejectionKey } from "./authorize.ts";
export type { AuthzDecision, AuthzRejection, AuthorizeOptions, ResourceRef } from "./authorize.ts";

export { InMemoryAuthAuditSink, NOOP_AUTH_AUDIT_SINK, maskEmail } from "./audit.ts";
export type { AuthAuditAction, AuthAuditEvent, AuthAuditSink } from "./audit.ts";

export type {
  AuthPort,
  AuthPortFailure,
  AuthPortResult,
  AuthPortSuccess,
  RefreshParams,
  SignInParams,
} from "./authPort.ts";

export { AUTH_SERVICE_VERSION, AuthService, GENERIC_SIGN_IN_MESSAGE, SYSTEM_CLOCK } from "./authService.ts";
export type { AuthServiceDeps, SignInFailureReason, SignInResult } from "./authService.ts";
