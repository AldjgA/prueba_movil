package bo.puentejoven.core.security

import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pruebas de la derivación del PIN.
 *
 * Cubren el requisito de TASK-003 de que el PIN nunca se almacena en claro y de
 * que un fallo de verificación no lanza excepciones que puedan acabar en un log.
 *
 * Se usan pocas iteraciones SOLO para que la prueba sea rápida; producción usa
 * el valor por defecto de [Pbkdf2PinHasher].
 */
class PinHasherTest {

    private val hasher = Pbkdf2PinHasher(iterations = 1_000)

    @Test
    fun `el secreto nunca contiene el pin en claro`() {
        val secret = hasher.createSecret("123456")

        assertFalse("El PIN no puede aparecer en el hash", secret.hash.contains("123456"))
        assertFalse("El PIN no puede aparecer en la sal", secret.salt.contains("123456"))
        assertTrue(secret.hash.isNotBlank())
        assertTrue(secret.salt.isNotBlank())
    }

    @Test
    fun `el mismo pin produce secretos distintos gracias a la sal`() {
        val first = hasher.createSecret("123456")
        val second = hasher.createSecret("123456")

        assertNotEquals("La sal debe ser distinta en cada derivación", first.salt, second.salt)
        assertNotEquals(first.hash, second.hash)
    }

    @Test
    fun `verificacion acepta el pin correcto`() {
        val secret = hasher.createSecret("123456")

        assertTrue(hasher.verify("123456", secret))
    }

    @Test
    fun `verificacion rechaza un pin incorrecto`() {
        val secret = hasher.createSecret("123456")

        assertFalse(hasher.verify("123457", secret))
        assertFalse(hasher.verify("654321", secret))
        assertFalse(hasher.verify("", secret))
    }

    @Test
    fun `un secreto corrupto se rechaza sin lanzar excepcion`() {
        val corrupt = PinSecret(salt = "!!! no es base64 !!!", hash = "tampoco", iterations = 1_000)

        assertFalse("Un secreto corrupto debe tratarse como 'no coincide'", hasher.verify("123456", corrupt))
    }
}
