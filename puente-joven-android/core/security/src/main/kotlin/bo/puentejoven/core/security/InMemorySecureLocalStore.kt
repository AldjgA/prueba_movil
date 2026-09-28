package bo.puentejoven.core.security

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import javax.inject.Inject

/**
 * Implementación en memoria de [SecureLocalStore].
 *
 * NO cifra: existe para las pruebas de JVM (sin Android) y como valor por defecto
 * en constructores de repositorio. En producción se inyecta
 * [EncryptedPreferencesSecureLocalStore].
 */
class InMemorySecureLocalStore @Inject constructor() : SecureLocalStore {

    private val mutex = Mutex()
    private val values = LinkedHashMap<String, String>()

    override suspend fun read(key: String): String? = mutex.withLock { values[key] }

    override suspend fun write(key: String, value: String) {
        mutex.withLock { values[key] = value }
    }

    override suspend fun remove(key: String) {
        mutex.withLock { values.remove(key) }
    }

    override suspend fun clear() {
        mutex.withLock { values.clear() }
    }

    override val isEncryptedAtRest: Boolean = false
}
