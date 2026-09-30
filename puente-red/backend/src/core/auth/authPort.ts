/**
 * PR-010 · Puerto de autenticación.
 *
 * **Criterio 1: las credenciales no se validan en código propio.** Todo pasa por Supabase Auth
 * (`PR-003` Q9, `PR-INFRA` §2). Este puerto existe para que eso sea **verificable**: el
 * servicio no tiene ninguna función que compare contraseñas ni ningún hash, y una prueba
 * comprueba que delega.
 *
 * **El puerto no distingue "el correo no existe" de "la contraseña es incorrecta".** Es
 * deliberado y se propaga hasta el usuario (criterio 2): si distinguiera, el login se
 * convertiría en un oráculo para averiguar qué correos están dados de alta.
 */

import type { ProfessionalRole } from "./roles.ts";

export interface SignInParams {
  readonly email: string;
  readonly password: string;
}

export interface RefreshParams {
  readonly refreshToken: string;
}

export interface AuthPortSuccess {
  readonly ok: true;
  readonly responderId: string;
  readonly role: ProfessionalRole;
  readonly institutionId: string;
  readonly isDemo: boolean;
  /** Token de refresco. Lo emite el proveedor; el servicio no lo interpreta. */
  readonly refreshToken: string;
}

export interface AuthPortFailure {
  readonly ok: false;
  /** **Un único** motivo para credenciales: nunca se revela cuál de las dos falló. */
  readonly reason: "INVALID_CREDENTIALS" | "PROVIDER_ERROR";
}

export type AuthPortResult = AuthPortSuccess | AuthPortFailure;

export interface AuthPort {
  signIn(params: SignInParams): Promise<AuthPortResult>;
  refresh(params: RefreshParams): Promise<AuthPortResult>;
  signOut(params: { readonly responderId: string }): Promise<void>;
}
