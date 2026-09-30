/**
 * PR-010 · Sesión profesional.
 *
 * **El portal SÍ caduca** (`REVISION-C.md` §5.2). El `sessionToken` **sin caducidad** es una
 * decisión del dueño **solo para la API Joven** (un dispositivo por joven, demo de ≤5
 * usuarios). La API Profesional maneja datos de menores y permisos clínicos, así que usa la
 * sesión normal de Supabase Auth, que **expira y se refresca**.
 *
 * Se controlan **dos** relojes, y hacen falta los dos:
 * - **caducidad absoluta** (`expiresAt`): una sesión no puede durar para siempre.
 * - **inactividad** (`lastSeenAt` + `idleTimeout`): un portátil abierto y desatendido en un
 *   centro comunitario no debe seguir con sesión viva.
 */

import type { ProfessionalRole } from "./roles.ts";

export interface ProfessionalSession {
  /** Mapea a `auth.users.id` de Supabase Auth (`PR-003` Q9). */
  readonly responderId: string;
  readonly role: ProfessionalRole;
  /** Institución del profesional. Aísla datos entre instituciones (RLS). */
  readonly institutionId: string;
  readonly issuedAtEpochMillis: number;
  readonly expiresAtEpochMillis: number;
  /** Última actividad. Es lo que mide la inactividad, no la emisión. */
  readonly lastSeenAtEpochMillis: number;
  /** Sesión de demostración: solo lectura sobre datos ficticios (`PR-003` Q7). */
  readonly isDemo: boolean;
}

export const SESSION_POLICY_VERSION = "session-policy/1.0.0";

/** 8 horas de vida máxima. */
export const DEFAULT_ABSOLUTE_TTL_MS = 8 * 60 * 60 * 1000;
/** 30 minutos de inactividad. */
export const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export interface SessionPolicy {
  readonly absoluteTtlMs: number;
  readonly idleTimeoutMs: number;
}

export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  absoluteTtlMs: DEFAULT_ABSOLUTE_TTL_MS,
  idleTimeoutMs: DEFAULT_IDLE_TIMEOUT_MS,
};

export type SessionExpiryReason = "EXPIRED" | "IDLE";

/**
 * ¿La sesión sigue viva?
 * Devuelve `null` si está vigente, o el motivo por el que ya no lo está.
 */
export function sessionExpiryReason(
  session: ProfessionalSession,
  nowEpochMillis: number,
  policy: SessionPolicy = DEFAULT_SESSION_POLICY,
): SessionExpiryReason | null {
  if (nowEpochMillis >= session.expiresAtEpochMillis) return "EXPIRED";
  if (nowEpochMillis - session.lastSeenAtEpochMillis >= policy.idleTimeoutMs) return "IDLE";
  return null;
}

export function isSessionAlive(
  session: ProfessionalSession,
  nowEpochMillis: number,
  policy: SessionPolicy = DEFAULT_SESSION_POLICY,
): boolean {
  return sessionExpiryReason(session, nowEpochMillis, policy) === null;
}

/** Marca actividad. No prolonga la caducidad absoluta: solo reinicia el reloj de inactividad. */
export function touchSession(
  session: ProfessionalSession,
  nowEpochMillis: number,
): ProfessionalSession {
  return { ...session, lastSeenAtEpochMillis: nowEpochMillis };
}

export interface CreateSessionParams {
  readonly responderId: string;
  readonly role: ProfessionalRole;
  readonly institutionId: string;
  readonly isDemo: boolean;
  readonly nowEpochMillis: number;
  readonly policy?: SessionPolicy;
}

export function createSession(params: CreateSessionParams): ProfessionalSession {
  const policy = params.policy ?? DEFAULT_SESSION_POLICY;
  return {
    responderId: params.responderId,
    role: params.role,
    institutionId: params.institutionId,
    issuedAtEpochMillis: params.nowEpochMillis,
    expiresAtEpochMillis: params.nowEpochMillis + policy.absoluteTtlMs,
    lastSeenAtEpochMillis: params.nowEpochMillis,
    isDemo: params.isDemo,
  };
}
