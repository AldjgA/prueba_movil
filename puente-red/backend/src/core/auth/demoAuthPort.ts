/**
 * PR-010 · Adaptador de autenticación **de demostración**.
 *
 * ⚠️ **NO es el adaptador de producción.** En producción manda **Supabase Auth** (`PR-003` Q9,
 * `PR-INFRA` §2), y ese adaptador necesita el cliente de `src/shared/**`, que es de A. Está
 * declarado en `deliverables/PR-010/NECESARIADES.md` §7.1.
 *
 * Este existe para que el backend sea **demostrable de punta a punta** hoy, y está diseñado
 * para **fallar cerrado**:
 *
 * - **No hay credenciales en el código.** Salen del entorno.
 * - **Si no hay contraseña configurada, nadie entra.** No hay contraseña por defecto: un
 *   adaptador de demo con credenciales adivinables es peor que no tener demo.
 * - La comparación es **de tiempo constante**, para no filtrar la contraseña por el reloj.
 * - La sesión resultante es `isDemo: true`, así que la guardia la deja en **solo lectura**
 *   (`PR-003` Q7: la demo no usa datos reales ni sintéticos).
 */

import { randomBytes, timingSafeEqual } from "node:crypto";

import type { AuthPort, AuthPortResult, RefreshParams, SignInParams } from "./authPort.ts";
import { isProfessionalRole, type ProfessionalRole } from "./roles.ts";

export type EnvLike = Record<string, string | undefined>;

export const DEMO_DEFAULTS = {
  email: "demo@puentered.org",
  role: "supervisor",
  institutionId: "ong-demo",
} as const;

/** Comparación de tiempo constante. Longitudes distintas se resuelven sin cortocircuitar. */
function igualdadSegura(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) {
    // Se compara igualmente contra sí mismo para no revelar la longitud por el tiempo.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export function createDemoAuthPort(env: EnvLike): AuthPort {
  const emailEsperado = env["PUENTE_DEMO_EMAIL"] ?? DEMO_DEFAULTS.email;
  const passwordEsperada = env["PUENTE_DEMO_PASSWORD"];
  const rolConfigurado = env["PUENTE_DEMO_ROLE"] ?? DEMO_DEFAULTS.role;
  const institucion = env["PUENTE_DEMO_INSTITUTION"] ?? DEMO_DEFAULTS.institutionId;

  const rol: ProfessionalRole = isProfessionalRole(rolConfigurado)
    ? rolConfigurado
    : DEMO_DEFAULTS.role;

  return {
    async signIn({ email, password }: SignInParams): Promise<AuthPortResult> {
      // Fail closed: sin contraseña configurada no entra nadie.
      if (passwordEsperada === undefined || passwordEsperada === "") {
        return { ok: false, reason: "INVALID_CREDENTIALS" };
      }
      const emailOk = igualdadSegura(email.trim().toLowerCase(), emailEsperado.toLowerCase());
      const passwordOk = igualdadSegura(password, passwordEsperada);
      if (!emailOk || !passwordOk) {
        return { ok: false, reason: "INVALID_CREDENTIALS" };
      }
      return {
        ok: true,
        responderId: "demo-responder",
        role: rol,
        institutionId: institucion,
        isDemo: true,
        refreshToken: randomBytes(16).toString("base64url"),
      };
    },

    async refresh(_params: RefreshParams): Promise<AuthPortResult> {
      // El proveedor de demostración no refresca: la sesión dura lo que dura el TTL.
      return { ok: false, reason: "PROVIDER_ERROR" };
    },

    async signOut(): Promise<void> {
      // Sin estado en el proveedor de demostración.
    },
  };
}
