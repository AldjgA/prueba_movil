package bo.puentejoven.core.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.KeyStore
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import javax.inject.Inject

/**
 * Cifrado real del contenido local: AES-256-GCM con clave custodiada por
 * Android Keystore (no exportable).
 *
 * Reemplaza a [PassThroughLocalCipher] (que NO cifraba) como implementación de
 * producción de [LocalCipher]. El sobre es `iv.cipherText` en Base64, con prefijo
 * que identifica la versión del formato para poder migrar sin ambigüedad.
 *
 * Privacidad: los errores nunca incluyen el contenido cifrado ni el texto plano;
 * solo describen que el sobre no es válido o que el material de claves no está.
 *
 * Estados del material de claves (F5/F6 de la auditoría de seguridad):
 * - Normal: el alias existe en el Keystore y se reutiliza.
 * - [destroyKeyMaterial]: se borra el alias y el marcador; `isSecure` pasa a
 *   `false` y cifrar/descifrar falla hasta volver a preparar (guardrail #4).
 * - Clave perdida: el marcador decía que la clave existía pero el alias ya no
 *   está. NO se regenera en silencio: `isSecure` pasa a `false` y las
 *   operaciones fallan con un mensaje explícito. Regenerar sin decirlo dejaría
 *   contenido viejo irrecuperable mientras la app aparenta funcionar.
 */
class KeystoreAesGcmLocalCipher @Inject constructor(
    private val secureStore: SecureLocalStore,
) : LocalCipher {

    @Volatile
    private var destroyed = false

    @Volatile
    private var keyLost = false

    @Volatile
    private var generatedInThisProcess = false

    override fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val cipherText = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
        return PREFIX + encode(cipher.iv) + SEPARATOR + encode(cipherText)
    }

    override fun decrypt(envelope: String): String {
        if (!envelope.startsWith(PREFIX)) {
            throw IllegalArgumentException("Sobre no reconocido por KeystoreAesGcmLocalCipher")
        }
        val parts = envelope.removePrefix(PREFIX).split(SEPARATOR)
        if (parts.size != 2) {
            throw IllegalArgumentException("Sobre con formato inválido")
        }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(
            Cipher.DECRYPT_MODE,
            secretKey(),
            GCMParameterSpec(GCM_TAG_BITS, decode(parts[0])),
        )
        return cipher.doFinal(decode(parts[1])).toString(Charsets.UTF_8)
    }

    override val isSecure: Boolean
        get() = !destroyed && !keyLost

    override suspend fun ensureKeyMaterial(): Boolean = withContext(Dispatchers.IO) {
        val markerSaysThereWasAKey =
            secureStore.read(SecureLocalStore.KEY_CONTENT_KEY_PRESENT) == VALUE_TRUE
        val aliasPresent = keyStore().containsAlias(KEY_ALIAS)

        when (
            keyMaterialState(
                aliasPresent = aliasPresent,
                markerSaysThereWasAKey = markerSaysThereWasAKey,
                createdInThisProcess = generatedInThisProcess,
            )
        ) {
            KeyMaterialState.LOST -> {
                // Caso F6: la clave desapareció. Se informa; no se regenera a escondidas.
                keyLost = true
                return@withContext false
            }

            KeyMaterialState.FIRST_RUN -> {
                generateKey()
                generatedInThisProcess = true
            }

            KeyMaterialState.READY -> Unit
        }
        secureStore.write(SecureLocalStore.KEY_CONTENT_KEY_PRESENT, VALUE_TRUE)
        destroyed = false
        keyLost = false
        true
    }

    override suspend fun destroyKeyMaterial(): Boolean = withContext(Dispatchers.IO) {
        val keyStore = keyStore()
        if (keyStore.containsAlias(KEY_ALIAS)) {
            keyStore.deleteEntry(KEY_ALIAS)
        }
        secureStore.remove(SecureLocalStore.KEY_CONTENT_KEY_PRESENT)
        destroyed = true
        generatedInThisProcess = false
        true
    }

    /** Clave de Keystore: se crea la primera vez y se reutiliza después. */
    private fun secretKey(): java.security.Key {
        check(!destroyed) { "Material de claves destruido: hay que prepararlo de nuevo" }
        check(!keyLost) { "La clave local ya no está en el Keystore: el contenido previo es irrecuperable" }

        keyStore().getKey(KEY_ALIAS, null)?.let { return it }

        // El alias ya no está. Crear material aquí sería regenerar a escondidas
        // (F6): el contenido previo quedaría irrecuperable mientras la app
        // aparenta funcionar bajo una clave nueva. Crear es responsabilidad
        // exclusiva de [ensureKeyMaterial], que sí distingue primer arranque de
        // pérdida. Aquí solo queda decirlo.
        keyLost = true
        throw IllegalStateException(
            "La clave local ya no está en el Keystore: el contenido previo es irrecuperable",
        )
    }

    private fun generateKey() {
        KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
            .apply {
                init(
                    KeyGenParameterSpec.Builder(
                        KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                    )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(KEY_BITS)
                        .build(),
                )
            }
            .generateKey()
    }

    private fun keyStore(): KeyStore =
        KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }

    private fun encode(bytes: ByteArray): String =
        Base64.getEncoder().encodeToString(bytes)

    private fun decode(value: String): ByteArray =
        Base64.getDecoder().decode(value)

    private companion object {
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val KEY_ALIAS = "puente_joven_local_content_key"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_BITS = 128
        const val KEY_BITS = 256
        const val PREFIX = "ks+aesgcm:"
        const val SEPARATOR = "."
        const val VALUE_TRUE = "true"
    }
}
