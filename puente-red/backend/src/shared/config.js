/**
 * Configuración desde el entorno (`PR-INFRA` §6).
 *
 * Ninguna clave tiene valor por defecto: si falta una que se usa, el arranque
 * falla en vez de arrancar a medias con un secreto vacío.
 */
export function loadConfig(env = process.env) {
  return {
    port: Number.parseInt(env.PORT ?? '8080', 10),
    supabase: {
      url: env.SUPABASE_URL ?? '',
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
    genai: {
      apiKey: env.GOOGLE_GENAI_API_KEY ?? '',
    },
    /**
     * `on` | `off`. Con `off` (por defecto) el clasificador no se llama y todo
     * entra como `ALTO`: el sistema sigue siendo seguro aunque el LLM falte
     * (`PR-005` criterio 5).
     */
    classifierMode: env.CLASSIFIER_MODE === 'on' ? 'on' : 'off',
  };
}

/** `true` si el backend puede hablar con Supabase. */
export function supabaseDisponible(config) {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}
