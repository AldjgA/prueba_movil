/**
 * PR-010 · La guardia de autorización.
 *
 * Es la función por la que **pasa toda** acción del portal (criterio 9). Si una ruta de
 * `/profesional` se ejecuta sin llamarla, es un fallo de seguridad — por eso la matriz vive
 * en datos y no en una cadena de `if` repartida por los endpoints.
 *
 * El orden de las comprobaciones es deliberado: primero la sesión, después el aislamiento
 * entre instituciones, después el rol, y por último el modo demo. Así el mensaje que recibe
 * el profesional apunta a la causa más grave.
 */

import {
  isWriteAction,
  roleCan,
  type PortalAction,
  type ProfessionalRole,
} from "./roles.ts";
import {
  DEFAULT_SESSION_POLICY,
  sessionExpiryReason,
  type ProfessionalSession,
  type SessionPolicy,
} from "./session.ts";

export type AuthzRejection =
  | "NO_SESSION"
  | "SESSION_EXPIRED"
  | "SESSION_IDLE"
  | "ROLE_NOT_PERMITTED"
  | "DEMO_READ_ONLY"
  | "CROSS_INSTITUTION";

export type AuthzDecision =
  | { readonly allowed: true; readonly action: PortalAction; readonly role: ProfessionalRole }
  | { readonly allowed: false; readonly action: PortalAction; readonly reason: AuthzRejection };

/** Recurso sobre el que se actúa, si lo hay. */
export interface ResourceRef {
  /** Institución a la que pertenece el recurso. Aísla datos entre instituciones. */
  readonly institutionId?: string;
  readonly caseToken?: string;
}

export interface AuthorizeOptions {
  readonly nowEpochMillis: number;
  readonly resource?: ResourceRef;
  readonly policy?: SessionPolicy;
}

/**
 * Decide si una sesión puede ejecutar una acción.
 *
 * **Nunca lanza.** Un rechazo es un valor, no una excepción: así el llamante está obligado a
 * mirarlo, y una guardia olvidada no se convierte en un `try/catch` silencioso.
 */
export function authorize(
  session: ProfessionalSession | null,
  action: PortalAction,
  options: AuthorizeOptions,
): AuthzDecision {
  if (session === null) {
    return { allowed: false, action, reason: "NO_SESSION" };
  }

  const policy = options.policy ?? DEFAULT_SESSION_POLICY;
  const expiry = sessionExpiryReason(session, options.nowEpochMillis, policy);
  if (expiry === "EXPIRED") {
    return { allowed: false, action, reason: "SESSION_EXPIRED" };
  }
  if (expiry === "IDLE") {
    return { allowed: false, action, reason: "SESSION_IDLE" };
  }

  // Aislamiento entre instituciones. Si el recurso declara institución y no es la de la
  // sesión, se rechaza **antes** de mirar el rol: el rol no da derecho a ver a otra
  // institución.
  const resourceInstitution = options.resource?.institutionId;
  if (resourceInstitution !== undefined && resourceInstitution !== session.institutionId) {
    return { allowed: false, action, reason: "CROSS_INSTITUTION" };
  }

  if (!roleCan(session.role, action)) {
    return { allowed: false, action, reason: "ROLE_NOT_PERMITTED" };
  }

  // El modo demo opera solo con datos ficticios (`PR-003` Q7): puede mirar, no escribir.
  if (session.isDemo && isWriteAction(action)) {
    return { allowed: false, action, reason: "DEMO_READ_ONLY" };
  }

  return { allowed: true, action, role: session.role };
}

/** Motivo legible para el registro de auditoría. Clave de catálogo, no prosa. */
export function rejectionKey(reason: AuthzRejection): string {
  return `authz.${reason.toLowerCase()}`;
}
