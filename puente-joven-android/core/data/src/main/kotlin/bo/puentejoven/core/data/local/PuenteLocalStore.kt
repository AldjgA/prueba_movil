package bo.puentejoven.core.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json

/**
 * Snapshot persistente del estado local (`TASK-003b`, ampliado en `TASK-025`).
 *
 * Dos almacenes deliberadamente separados:
 * - **sesión**: pequeño y se lee al arrancar; decide si hay perfiles sin cargar contenido.
 * - **contenido**: el grueso, **aislado por perfil**, y lo que la retención destruye.
 *
 * El contenido guarda **sobres cifrados**, nunca texto en claro del joven.
 */
interface PuenteLocalStore {

    suspend fun readSession(): SessionSnapshot?

    suspend fun writeSession(snapshot: SessionSnapshot)

    /** Contenido de **un** perfil. No existe forma de leer el de otro. */
    suspend fun readContent(profileId: String): ContentSnapshot?

    suspend fun writeContent(profileId: String, snapshot: ContentSnapshot)

    /** Borra el contenido de un perfil **sin** tocar los demás. */
    suspend fun deleteContent(profileId: String)

    /** Borra los dos almacenes. No toca el `SecureLocalStore` (eso es del repositorio). */
    suspend fun clearAll()
}

/**
 * Implementación **en memoria**: valor por defecto del constructor del repositorio,
 * para pruebas de JVM sin Android. No persiste entre instancias.
 */
class InMemoryPuenteLocalStore : PuenteLocalStore {

    private var session: SessionSnapshot? = null
    private val content = mutableMapOf<String, ContentSnapshot>()

    override suspend fun readSession(): SessionSnapshot? = session

    override suspend fun writeSession(snapshot: SessionSnapshot) {
        session = snapshot
    }

    override suspend fun readContent(profileId: String): ContentSnapshot? = content[profileId]

    override suspend fun writeContent(profileId: String, snapshot: ContentSnapshot) {
        content[profileId] = snapshot
    }

    override suspend fun deleteContent(profileId: String) {
        content.remove(profileId)
    }

    override suspend fun clearAll() {
        session = null
        content.clear()
    }
}

/**
 * Implementación real sobre **Preferences DataStore**.
 *
 * El almacén de contenido guarda **una entrada por perfil**, con el `ProfileId`
 * (opaco) dentro de la clave. El aislamiento lo garantiza la propia API: no hay
 * forma de leer contenido sin decir de qué perfil, así que no existe "un filtro
 * que alguien pueda olvidar". Se prefirió esto a un fichero por perfil porque los
 * `DataStore` dinámicos no se pueden cerrar ni borrar con seguridad.
 *
 * La escritura reemplaza el snapshot completo de ese perfil: simple y suficiente
 * para la escala del MVP (≤5 usuarios).
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

    override suspend fun readContent(profileId: String): ContentSnapshot? =
        read(contentStore, contentKey(profileId)) {
            json.decodeFromString(ContentSnapshot.serializer(), it)
        }

    override suspend fun writeContent(profileId: String, snapshot: ContentSnapshot) {
        val encoded = json.encodeToString(ContentSnapshot.serializer(), snapshot)
        contentStore.edit { it[contentKey(profileId)] = encoded }
    }

    override suspend fun deleteContent(profileId: String) {
        contentStore.edit { it.remove(contentKey(profileId)) }
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

        /** Clave de contenido **de un perfil**. El `ProfileId` es opaco. */
        fun contentKey(profileId: String): Preferences.Key<String> =
            stringPreferencesKey("puente_content_$profileId")
    }
}
