package bo.puentejoven.core.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json

/**
 * Snapshot persistente del estado local (TASK-003b).
 *
 * Dos almacenes deliberadamente separados:
 * - **sesión**: pequeño y se lee al arrancar; decide si hay perfil sin cargar el contenido.
 * - **contenido**: el grueso, y lo que la retención destruye.
 *
 * El contenido guarda **sobres cifrados**, nunca texto en claro del joven.
 */
interface PuenteLocalStore {

    suspend fun readSession(): SessionSnapshot?

    suspend fun writeSession(snapshot: SessionSnapshot)

    suspend fun readContent(): ContentSnapshot?

    suspend fun writeContent(snapshot: ContentSnapshot)

    /** Borra los dos almacenes. No toca el `SecureLocalStore` (eso es del repositorio). */
    suspend fun clearAll()
}

/**
 * Implementación **en memoria**: valor por defecto del constructor del repositorio,
 * para pruebas de JVM sin Android. No persiste entre instancias.
 */
class InMemoryPuenteLocalStore : PuenteLocalStore {

    private var session: SessionSnapshot? = null
    private var content: ContentSnapshot? = null

    override suspend fun readSession(): SessionSnapshot? = session

    override suspend fun writeSession(snapshot: SessionSnapshot) {
        session = snapshot
    }

    override suspend fun readContent(): ContentSnapshot? = content

    override suspend fun writeContent(snapshot: ContentSnapshot) {
        content = snapshot
    }

    override suspend fun clearAll() {
        session = null
        content = null
    }
}

/**
 * Implementación real sobre **Preferences DataStore**.
 *
 * Cada almacén guarda un snapshot JSON bajo una clave raíz. La escritura reemplaza
 * el snapshot completo: simple y suficiente para la escala del MVP (≤5 usuarios).
 */
class DataStorePuenteLocalStore(
    private val sessionStore: DataStore<Preferences>,
    private val contentStore: DataStore<Preferences>,
) : PuenteLocalStore {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    override suspend fun readSession(): SessionSnapshot? =
        read(sessionStore, KEY_SESSION) { json.decodeFromString(SessionSnapshot.serializer(), it) }

    override suspend fun writeSession(snapshot: SessionSnapshot) {
        val encoded = json.encodeToString(SessionSnapshot.serializer(), snapshot)
        sessionStore.edit { it[KEY_SESSION] = encoded }
    }

    override suspend fun readContent(): ContentSnapshot? =
        read(contentStore, KEY_CONTENT) { json.decodeFromString(ContentSnapshot.serializer(), it) }

    override suspend fun writeContent(snapshot: ContentSnapshot) {
        val encoded = json.encodeToString(ContentSnapshot.serializer(), snapshot)
        contentStore.edit { it[KEY_CONTENT] = encoded }
    }

    override suspend fun clearAll() {
        sessionStore.edit { it.clear() }
        contentStore.edit { it.clear() }
    }

    /**
     * Lectura tolerante: un snapshot corrupto o de un esquema que ya no se entiende
     * se trata como **ausente**, no como un fallo que impida abrir la app.
     */
    private suspend fun <T> read(
        store: DataStore<Preferences>,
        key: Preferences.Key<String>,
        decode: (String) -> T,
    ): T? {
        val raw = store.data.first()[key] ?: return null
        return runCatching { decode(raw) }.getOrNull()
    }

    companion object {
        val KEY_SESSION = stringPreferencesKey("puente_session_snapshot")
        val KEY_CONTENT = stringPreferencesKey("puente_content_snapshot")
    }
}
