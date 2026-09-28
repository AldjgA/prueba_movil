package bo.puentejoven.core.data.local

import bo.puentejoven.core.security.LocalCipher
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

/**
 * Doble de pruebas de [LocalCipher] que cifra de VERDAD (AES-256-GCM, JVM) y
 * modela el ciclo de vida del material de claves.
 *
 * Existe porque la implementación de producción (`KeystoreAesGcmLocalCipher`)
 * depende de Android Keystore y no se puede ejercitar en un test de JVM. Aquí sí
 * se puede probar lo que importa:
 * - que el contenido pasa por el cifrador (queda registrado en [plainTextsSeen]);
 * - que destruir el material de claves vuelve irrecuperable lo ya cifrado.
 *
 * Tras [destroyKeyMaterial] se prepara una clave NUEVA: el sobre anterior deja
 * de descifrarse, que es exactamente la propiedad que se quiere verificar.
 */
class TestAesGcmCipher : LocalCipher {

    /** Textos planos que han entrado al cifrador. Permite probar "se cifró". */
    val plainTextsSeen = mutableListOf<String>()

    private var key: javax.crypto.SecretKey? = freshKey()

    override fun encrypt(plainText: String): String {
        val current = key ?: error("material de claves destruido")
        plainTextsSeen += plainText
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val iv = ByteArray(IV_BYTES).also { SecureRandom().nextBytes(it) }
        cipher.init(Cipher.ENCRYPT_MODE, current, GCMParameterSpec(TAG_BITS, iv))
        return PREFIX + encode(iv) + SEPARATOR + encode(cipher.doFinal(plainText.toByteArray()))
    }

    override fun decrypt(envelope: String): String {
        val current = key ?: error("material de claves destruido")
        require(envelope.startsWith(PREFIX)) { "Sobre no reconocido" }
        val parts = envelope.removePrefix(PREFIX).split(SEPARATOR)
        require(parts.size == 2) { "Sobre con formato inválido" }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, current, GCMParameterSpec(TAG_BITS, decode(parts[0])))
        return cipher.doFinal(decode(parts[1])).toString(Charsets.UTF_8)
    }

    override val isSecure: Boolean
        get() = key != null

    /** Destruye la clave actual. Lo cifrado antes queda irrecuperable. */
    override suspend fun destroyKeyMaterial(): Boolean {
        key = null
        return true
    }

    /** Prepara una clave NUEVA: nunca reutiliza la destruida. */
    override suspend fun ensureKeyMaterial(): Boolean {
        if (key == null) key = freshKey()
        return true
    }

    private fun freshKey(): javax.crypto.SecretKey =
        KeyGenerator.getInstance("AES").apply { init(KEY_BITS) }.generateKey()

    private fun encode(bytes: ByteArray): String =
        Base64.getEncoder().encodeToString(bytes)

    private fun decode(value: String): ByteArray =
        Base64.getDecoder().decode(value)

    private companion object {
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val TAG_BITS = 128
        const val IV_BYTES = 12
        const val KEY_BITS = 256
        const val PREFIX = "test+aesgcm:"
        const val SEPARATOR = "."
    }
}
