package bo.puentejoven.core.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Implementación de producción de [SecureLocalStore]: preferencias cifradas cuya
 * clave maestra vive en Android Keystore.
 *
 * - Claves: AES256-SIV (los nombres de preferencia tampoco se filtran).
 * - Valores: AES256-GCM.
 * - Clave maestra: generada y custodiada por el Keystore del sistema, no exportable.
 *
 * Esto cumple TASK-003 ("clave protegida por Android Keystore y almacenamiento
 * cifrado detrás de una interfaz") sin introducir dependencias nuevas:
 * `androidx.security:security-crypto` ya estaba en el catálogo de versiones.
 *
 * Nota: el almacén solo debe construirse con el contexto de aplicación. La
 * inyección se hace en `:core:data` (módulo `SecurityModule`).
 */
class EncryptedPreferencesSecureLocalStore(
    context: Context,
    fileName: String = FILE_NAME,
) : SecureLocalStore {

    private val masterKey = MasterKey.Builder(context.applicationContext)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val preferences = EncryptedSharedPreferences.create(
        context.applicationContext,
        fileName,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override suspend fun read(key: String): String? =
        withContext(Dispatchers.IO) { preferences.getString(key, null) }

    override suspend fun write(key: String, value: String) {
        withContext(Dispatchers.IO) {
            preferences.edit().putString(key, value).apply()
        }
    }

    override suspend fun remove(key: String) {
        withContext(Dispatchers.IO) {
            preferences.edit().remove(key).apply()
        }
    }

    override suspend fun clear() {
        withContext(Dispatchers.IO) {
            preferences.edit().clear().apply()
        }
    }

    override val isEncryptedAtRest: Boolean = true

    private companion object {
        const val FILE_NAME = "puente_joven_secure_store"
    }
}
