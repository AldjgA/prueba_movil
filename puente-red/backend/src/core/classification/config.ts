/**
 * PR-005 · Configuración del clasificador.
 *
 * **Invariante de seguridad (criterio 9):** este módulo **nunca** contiene ni transporta la
 * API key. Solo el **nombre** de la variable de entorno que la lleva. La clave la lee el
 * adaptador del proveedor en el momento de la llamada y no sale de ahí.
 *
 * `PR-INFRA` §6: la API key de Gemini solo en el servidor; nunca en el APK.
 */

/** Evita depender de `@types/node` (el paquete usa type stripping, sin type-checker). */
export type EnvLike = Record<string, string | undefined>;

export interface ClassifierConfig {
  /**
   * Interruptor maestro. **Si está en `false`, el clasificador devuelve `ALTO` por defecto**
   * y el caso no se bloquea (criterio 5). Así la demo funciona sin LLM y el sistema sigue
   * siendo seguro si el proveedor falla, se apaga o se agota el tope de gasto.
   */
  readonly enabled: boolean;
  readonly provider: "google-genai";
  readonly modelVersion: string;
  readonly promptVersion: string;
  readonly timeoutMs: number;
  /** Tope de gasto diario (`PR-INFRA` §6: rate limiting y tope, para evitar sorpresas). */
  readonly maxSpendUsdPerDay: number;
  /** Nombre de la variable de entorno con la clave. **No** es la clave. */
  readonly apiKeyEnvVar: string;
  readonly catalogVersion: string;
}

/**
 * Valores por defecto: **clasificador apagado**.
 *
 * Apagado por defecto es la postura conservadora correcta: la demo no usa datos reales
 * (`PR-003` Q7), y encenderlo es una decisión explícita que exige el proveedor de pago.
 */
export const DEFAULT_CONFIG: ClassifierConfig = {
  enabled: false,
  provider: "google-genai",
  modelVersion: "gemini-flash-provisional",
  promptVersion: "classification-prompt/1.0.0-provisional",
  timeoutMs: 8_000,
  maxSpendUsdPerDay: 1,
  apiKeyEnvVar: "GOOGLE_GENAI_API_KEY",
  catalogVersion: "rationale-catalog/1.0.0-provisional",
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Construye la configuración desde el entorno.
 *
 * ⚠️ **Los nombres de las variables siguen la convención de `src/shared/config.js`** (de A),
 * que es quien define la superficie de configuración del backend: `CLASSIFIER_MODE=on|off`,
 * `GOOGLE_GENAI_API_KEY`, `CLASSIFIER_*`. Antes usaba un prefijo `PUENTE_*` propio, y eso
 * habría sido **dos superficies de configuración para el mismo proceso**.
 *
 * **Nunca** lee el valor de la clave: solo su nombre. Si el nombre está vacío, se usa el de por
 * defecto.
 */
export function loadConfigFromEnv(env: EnvLike): ClassifierConfig {
  const modo = env["CLASSIFIER_MODE"];
  const enabled =
    modo === undefined ? parseBoolean(env["CLASSIFIER_ENABLED"], DEFAULT_CONFIG.enabled) : modo === "on";

  return {
    enabled,
    provider: "google-genai",
    modelVersion: env["CLASSIFIER_MODEL"] ?? DEFAULT_CONFIG.modelVersion,
    promptVersion: env["CLASSIFIER_PROMPT"] ?? DEFAULT_CONFIG.promptVersion,
    timeoutMs: parsePositiveInt(env["CLASSIFIER_TIMEOUT_MS"], DEFAULT_CONFIG.timeoutMs),
    maxSpendUsdPerDay: parsePositiveInt(
      env["CLASSIFIER_MAX_SPEND_USD"],
      DEFAULT_CONFIG.maxSpendUsdPerDay,
    ),
    apiKeyEnvVar: env["GENAI_KEY_ENV_VAR"] ?? DEFAULT_CONFIG.apiKeyEnvVar,
    catalogVersion: env["CATALOG_VERSION"] ?? DEFAULT_CONFIG.catalogVersion,
  };
}
