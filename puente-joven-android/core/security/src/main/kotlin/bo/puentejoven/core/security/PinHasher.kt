package bo.puentejoven.core.security

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import javax.inject.Inject

/**
 * Secreto derivado del PIN.
 *
 * NUNCA contiene el PIN: solo la sal, el hash y los parámetros de derivación. Es
 * seguro persistirlo y seguro registrarlo en un error (aunque no se hace).
 */
data class PinSecret(
    val salt: String,
    val hash: String,
    val iterations: Int,
    val algorithm: String = PinHasher.PBKDF2_HMAC_SHA256,
)

/**
 * Derivación y verificación del PIN local.
 *
 * El PIN nunca se guarda: se guarda un derivado con sal aleatoria. Así, aunque el
 * almacén se leyera entero, el PIN no estaría ahí (guardrail de TASK-003: "el alias
 * no es una clave criptográfica"; tampoco lo es el hash).
 */
interface PinHasher {

    /** Deriva un secreto nuevo con sal aleatoria. */
    fun createSecret(pin: String): PinSecret

    /** Comprueba un PIN contra un secreto previamente derivado. */
    fun verify(pin: String, secret: PinSecret): Boolean

    companion object {
        const val PBKDF2_HMAC_SHA256 = "PBKDF2WithHmacSHA256"
    }
}

/**
 * PBKDF2-HMAC-SHA256 con sal aleatoria de 16 bytes.
 *
 * Funciona en JVM (pruebas unitarias) y en Android sin dependencias nuevas.
 * Las iteraciones son configurables para poder usar un valor bajo en pruebas sin
 * tocar el de producción.
 */
class Pbkdf2PinHasher @Inject constructor(
    private val iterations: Int = DEFAULT_ITERATIONS,
) : PinHasher {

    override fun createSecret(pin: String): PinSecret {
        val salt = ByteArray(SALT_BYTES)
        SECURE_RANDOM.nextBytes(salt)
        return PinSecret(
            salt = encode(salt),
            hash = encode(derive(pin, salt, iterations)),
            iterations = iterations,
        )
    }

    override fun verify(pin: String, secret: PinSecret): Boolean {
        // Cualquier secreto corrupto se trata como "no coincide": nunca se lanza
        // una excepción que pudiera arrastrar datos al log.
        val salt = runCatching { decode(secret.salt) }.getOrNull() ?: return false
        val expected = runCatching { decode(secret.hash) }.getOrNull() ?: return false
        val actual = runCatching { derive(pin, salt, secret.iterations) }.getOrNull() ?: return false
        // Comparación en tiempo constante: no filtra por tiempo de respuesta.
        return MessageDigest.isEqual(expected, actual)
    }

    private fun derive(pin: String, salt: ByteArray, iterations: Int): ByteArray {
        val spec = PBEKeySpec(pin.toCharArray(), salt, iterations, KEY_BITS)
        return try {
            SecretKeyFactory.getInstance(PinHasher.PBKDF2_HMAC_SHA256)
                .generateSecret(spec)
                .encoded
        } finally {
            spec.clearPassword()
        }
    }

    private fun encode(bytes: ByteArray): String =
        Base64.getEncoder().encodeToString(bytes)

    private fun decode(value: String): ByteArray =
        Base64.getDecoder().decode(value)

    private companion object {
        const val SALT_BYTES = 16
        const val KEY_BITS = 256
        const val DEFAULT_ITERATIONS = 120_000
        val SECURE_RANDOM = SecureRandom()
    }
}
