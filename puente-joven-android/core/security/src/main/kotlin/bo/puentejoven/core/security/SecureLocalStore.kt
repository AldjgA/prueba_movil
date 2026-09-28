package bo.puentejoven.core.security

/**
 * Almacén local para secretos y contenido sensible.
 *
 * TASK-003: "clave protegida por Android Keystore y almacenamiento cifrado detrás
 * de una interfaz". Esta es la interfaz. Todo lo que sea sensible —derivados del
 * PIN, preferencias de privacidad, y más adelante el contenido del chat— entra y
 * sale por aquí, nunca por `SharedPreferences` plano.
 *
 * Reglas de uso:
 * - Nunca escribir el PIN en texto claro: solo el derivado ([PinSecret]).
 * - Nunca escribir contenido de chat sin pasar antes por [LocalCipher].
 * - [clear] debe destruir también el material de claves asociado, de modo que un
 *   "borrar mi historial" sea irreversible.
 *
 * Implementaciones: [EncryptedPreferencesSecureLocalStore] (producción, Keystore) y
 * [InMemorySecureLocalStore] (pruebas de JVM, sin Android).
 */
interface SecureLocalStore {

    /** Lee un valor, o `null` si la clave no existe. */
    suspend fun read(key: String): String?

    /** Escribe (o sobrescribe) un valor. */
    suspend fun write(key: String, value: String)

    /** Elimina una clave concreta. */
    suspend fun remove(key: String)

    /**
     * Vacía el almacén. Tras esta llamada no debe quedar ningún derivado del PIN
     * ni contenido sensible recuperable.
     */
    suspend fun clear()

    /** `true` si la implementación cifra en reposo de forma verificable. */
    val isEncryptedAtRest: Boolean

    companion object {
        /** Sal del derivado del PIN. No es secreta por sí sola; no es el PIN. */
        const val KEY_PIN_SALT = "youth.pin.salt"

        /** Hash derivado del PIN (PBKDF2). Nunca el PIN en claro. */
        const val KEY_PIN_HASH = "youth.pin.hash"

        /** Iteraciones usadas al derivar: necesarias para poder volver a verificar. */
        const val KEY_PIN_ITERATIONS = "youth.pin.iterations"

        /** Preferencia de desbloqueo biométrico (comodidad opcional). */
        const val KEY_BIOMETRIC_ENABLED = "youth.biometric.enabled"

        /**
         * Marcador de "la clave de contenido existía". Permite distinguir un
         * primer arranque (todavía no hay clave: se crea) de una clave que
         * desapareció del Keystore (NO se regenera en silencio).
         */
        const val KEY_CONTENT_KEY_PRESENT = "content.key.present"
    }
}
