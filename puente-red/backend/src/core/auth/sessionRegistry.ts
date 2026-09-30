/**
 * PR-010 · Registro de sesiones del portal.
 *
 * **Por qué existe:** `AuthService.signIn` devuelve una sesión, pero una sesión no viaja por
 * HTTP — viaja un **token opaco**. Este registro es la correspondencia
 * `token ↔ sesión`, y es la pieza que faltaba para poder guardar rutas.
 *
 * Decisiones:
 *
 * - **El token es opaco y aleatorio** (256 bits). No deriva del `responderId` ni del correo:
 *   un token derivable filtraría información y sería adivinable.
 * - **`resolve` devuelve la sesión aunque esté caducada, y NO marca actividad.** El registro
 *   **almacena**; quien **juzga** si sigue viva es la guardia (`authorize`). Dos motivos:
 *   1. Si el registro devolviera `null` al caducar, el cliente recibiría `NO_SESSION` en vez de
 *      `SESSION_EXPIRED` — y no podría distinguir "no iniciaste sesión" de "tu sesión expiró".
 *   2. **Si `resolve` marcara actividad, la inactividad no se detectaría nunca**: el propio
 *      acceso que se quiere medir reiniciaría el reloj. Marcar actividad es una decisión
 *      **explícita** del llamante, y solo se hace **después** de comprobar que la sesión vive.
 */

import { randomBytes } from "node:crypto";

import { DEFAULT_SESSION_POLICY, sessionExpiryReason, type ProfessionalSession, type SessionPolicy } from "./session.ts";

export interface SessionRegistry {
  /** Emite un token opaco para la sesión. */
  emit(session: ProfessionalSession): string;
  /**
   * Recupera la sesión del token, o `null` si el token no existe.
   * **No marca actividad**: para eso está `touch`.
   */
  resolve(token: string): ProfessionalSession | null;
  /** Marca actividad y devuelve la sesión actualizada. */
  touch(token: string): ProfessionalSession | null;
  /** Invalida el token. Devuelve `true` si existía. */
  revoke(token: string): boolean;
  /** Elimina las sesiones caducadas. Devuelve cuántas se purgaron. */
  purgeExpired(nowEpochMillis: number): number;
  count(): number;
}

export interface InMemorySessionRegistryDeps {
  readonly clock: { nowEpochMillis(): number };
  readonly policy?: SessionPolicy;
}

export class InMemorySessionRegistry implements SessionRegistry {
  readonly #byToken = new Map<string, ProfessionalSession>();
  readonly #clock: { nowEpochMillis(): number };
  readonly #policy: SessionPolicy;

  constructor(deps: InMemorySessionRegistryDeps) {
    this.#clock = deps.clock;
    this.#policy = deps.policy ?? DEFAULT_SESSION_POLICY;
  }

  emit(session: ProfessionalSession): string {
    const token = randomBytes(32).toString("base64url");
    this.#byToken.set(token, session);
    return token;
  }

  resolve(token: string): ProfessionalSession | null {
    // Sin efectos: leer no es actuar.
    return this.#byToken.get(token) ?? null;
  }

  touch(token: string): ProfessionalSession | null {
    const session = this.#byToken.get(token);
    if (session === undefined) return null;
    const touched = { ...session, lastSeenAtEpochMillis: this.#clock.nowEpochMillis() };
    this.#byToken.set(token, touched);
    return touched;
  }

  revoke(token: string): boolean {
    return this.#byToken.delete(token);
  }

  purgeExpired(nowEpochMillis: number): number {
    let purged = 0;
    for (const [token, session] of this.#byToken) {
      if (sessionExpiryReason(session, nowEpochMillis, this.#policy) !== null) {
        this.#byToken.delete(token);
        purged += 1;
      }
    }
    return purged;
  }

  count(): number {
    return this.#byToken.size;
  }
}
