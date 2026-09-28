package bo.puentejoven.core.security

/**
 * Frontera de cifrado local.
 *
 * Guardrail #7: el chat personal es privado y se cifra localmente. Esta interfaz
 * separa el "qué" del "cómo" para que la implementación real (KeyStore + AES-GCM,
 * SQLCipher, etc.) se decida y apruebe después sin tocar UI ni casos de uso.
 *
 * IMPORTANTE (MVP): `PassThroughLocalCipher` es una implementación de demostración
 * que NO cifra. Debe sustituirse antes de manejar datos reales de una persona.
 */
interface LocalCipher {

    /** Cifra un texto plano. Devuelve el sobre cifrado (IV + ciphertext codificados). */
    fun encrypt(plainText: String): String

    /** Descifra un sobre producido por [encrypt]. */
    fun decrypt(envelope: String): String

    /** `true` cuando la implementación realmente protege el contenido. */
    val isSecure: Boolean

    /**
     * Garantiza que existe material de claves usable.
     *
     * Devuelve `false` cuando la clave existía y ya no está (Keystore vaciado,
     * cambio de perfil de dispositivo…). En ese caso la implementación NO debe
     * regenerar en silencio: si lo hiciera, el contenido anterior quedaría
     * irrecuperable sin que nadie lo supiera y el sobre nuevo parecería válido.
     * Quien llama decide, de forma explícita, cómo degradar.
     */
    suspend fun ensureKeyMaterial(): Boolean

    /**
     * Destruye el material de claves: tras esto el contenido ya cifrado es
     * irrecuperable (guardrail #4). Es la contraparte de "borrar mi historial".
     *
     * Después de llamarlo, [encrypt] y [decrypt] fallan hasta que se invoque
     * [ensureKeyMaterial] de nuevo: nunca se sigue escribiendo como si nada.
     */
    suspend fun destroyKeyMaterial(): Boolean
}
