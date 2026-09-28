package bo.puentejoven.core.security

import javax.inject.Inject

/**
 * Implementación de DEMOSTRACIÓN de [LocalCipher].
 *
 * NO cifra: solo antepone una marca para dejar explícito en los datos que el sobre
 * proviene de esta implementación y permitir una migración ordenada.
 *
 * Se usa en el MVP para que el resto de la app pueda desarrollarse antes de que se
 * aprueben plataforma de cifrado, política de claves y retención (guardrail #6 de
 * `00_GUARDRAILS_Y_PROTOCOLO_AGENTICO.md`: bloqueo que requiere decisión humana).
 *
 * Reemplazar por la implementación con KeyStore antes del piloto con datos reales.
 */
class PassThroughLocalCipher @Inject constructor() : LocalCipher {

    override fun encrypt(plainText: String): String =
        DEMO_PREFIX + plainText.toByteArray(Charsets.UTF_8).let(::encodeBase64)

    override fun decrypt(envelope: String): String {
        if (!envelope.startsWith(DEMO_PREFIX)) {
            // No se lanza excepción con contenido: el error no debe filtrar el dato.
            throw IllegalArgumentException("Sobre no reconocido por PassThroughLocalCipher")
        }
        return decodeBase64(envelope.removePrefix(DEMO_PREFIX)).toString(Charsets.UTF_8)
    }

    override val isSecure: Boolean = false

    /**
     * No hay material de claves que destruir: esta implementación no cifra.
     * Devuelve `true` porque la precondición "no queda clave que permita
     * recuperar lo borrado" se cumple trivialmente.
     */
    override suspend fun destroyKeyMaterial(): Boolean = true

    override suspend fun ensureKeyMaterial(): Boolean = true

    private companion object {
        const val DEMO_PREFIX = "demo+plain:"

        fun encodeBase64(bytes: ByteArray): String =
            java.util.Base64.getEncoder().encodeToString(bytes)

        fun decodeBase64(value: String): ByteArray =
            java.util.Base64.getDecoder().decode(value)
    }
}
