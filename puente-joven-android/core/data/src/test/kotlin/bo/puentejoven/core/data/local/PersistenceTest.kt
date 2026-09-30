package bo.puentejoven.core.data.local

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.model.ShareScopeEntry
import bo.puentejoven.core.model.SummaryNote
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Persistencia local (TASK-003b).
 *
 * Dos instancias del repositorio sobre el **mismo** [PuenteLocalStore] simulan un
 * reinicio del proceso sin necesitar Android: la segunda debe ver lo que dejó la
 * primera, y lo que se borró o venció **no** debe volver.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class PersistenceTest {

    private companion object {
        const val NOW = 1_760_000_000_000L
        const val DAY = 24 * 3_600_000L
        const val YOUTH_TEXT = "hoy me sentí muy solo en el recreo"
        const val REFLECTION = "me sirvió respirar un minuto"
        const val NOTE = "quiero que sepan esto antes de la cita"
        const val ENVELOPE_PREFIX = "test+aesgcm:"
    }

    private fun repository(
        store: PuenteLocalStore,
        cipher: TestAesGcmCipher = TestAesGcmCipher(),
    ): LocalPuenteRepository = LocalPuenteRepository(
        clock = TestClock(current = NOW),
        cipher = cipher,
        store = store,
    )

    private fun <T> requireSuccess(result: AppResult<T>): T = when (result) {
        is AppResult.Success -> result.data
        is AppResult.Failure -> error("Se esperaba éxito: ${result.error.technical}")
    }

    @Test
    fun `el estado sobrevive a recrear el repositorio`() = runTest {
        val store = InMemoryPuenteLocalStore()
        val cipher = TestAesGcmCipher()

        val first = repository(store, cipher)
        val conversationId = requireSuccess(first.startConversation()).id
        requireSuccess(first.appendYouthMessage(conversationId, YOUTH_TEXT))
        requireSuccess(
            first.buildShareableSummary(
                scope = setOf(ShareScopeEntry.Signal("frequency")),
                note = SummaryNote(NOTE),
            ),
        )

        // Proceso nuevo: mismo almacén, misma clave.
        val second = repository(store, cipher)
        requireSuccess(second.getProfile())

        val messages = second.observeActiveConversation().first()!!.messages
        assertEquals("El chat debe sobrevivir", 1, messages.size)
        assertEquals(YOUTH_TEXT, messages.single().content)
        assertEquals(
            "La nota del resumen debe sobrevivir y descifrarse",
            NOTE,
            second.observeSummaries().first().single().note?.value,
        )
    }

    @Test
    fun `el texto libre nunca se guarda en claro`() = runTest {
        val store = InMemoryPuenteLocalStore()
        val repository = repository(store)

        val conversationId = requireSuccess(repository.startConversation()).id
        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))
        requireSuccess(repository.recordCompletion(DemoFixtures.briefTools.first().key, REFLECTION))

        val snapshot = store.readContent(DemoFixtures.DEMO_YOUTH_ID)!!

        val storedMessage = snapshot.conversation!!.messages.single().content
        assertNotEquals("El mensaje no puede guardarse en claro", YOUTH_TEXT, storedMessage)
        assertTrue("Debe guardarse el sobre", storedMessage.startsWith(ENVELOPE_PREFIX))

        assertTrue(
            "La reflexión también va cifrada",
            snapshot.completions.single().reflection!!.startsWith(ENVELOPE_PREFIX),
        )

        val raw = Json.encodeToString(ContentSnapshot.serializer(), snapshot)
        assertFalse("El texto del joven no debe aparecer en el snapshot", raw.contains(YOUTH_TEXT))
        assertFalse("La reflexión no debe aparecer en el snapshot", raw.contains(REFLECTION))
    }

    @Test
    fun `borrar todo deja los dos almacenes vacios`() = runTest {
        val store = InMemoryPuenteLocalStore()
        val repository = repository(store)

        val conversationId = requireSuccess(repository.startConversation()).id
        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))

        requireSuccess(repository.deleteAllLocalContent())

        assertNull("El almacén de sesión debe quedar vacío", store.readSession())
        assertNull(
            "El almacén de contenido debe quedar vacío",
            store.readContent(DemoFixtures.DEMO_YOUTH_ID),
        )
    }

    @Test
    fun `lo purgado por retencion no reaparece al recrear`() = runTest {
        val store = InMemoryPuenteLocalStore()
        val cipher = TestAesGcmCipher()

        val first = repository(store, cipher)
        val conversationId = requireSuccess(first.startConversation()).id
        requireSuccess(first.appendYouthMessage(conversationId, YOUTH_TEXT))

        requireSuccess(first.purgeExpired(NOW + 91 * DAY))

        val second = repository(store, cipher)
        requireSuccess(second.getProfile())

        assertNull(
            "El chat purgado no debe volver tras recrear el repositorio",
            second.observeActiveConversation().first(),
        )
    }

    @Test
    fun `un esquema desconocido no revienta y arranca vacio`() = runTest {
        val store = InMemoryPuenteLocalStore()
        // Snapshot de una versión futura que este código no entiende.
        store.writeSession(SessionSnapshot(schemaVersion = 999))
        store.writeContent(
            "perfil-futuro",
            ContentSnapshot(
                conversation = ConversationDto(
                    id = "conv-futura",
                    youthId = "desconocido",
                    startedAtEpochMillis = NOW,
                    lastAccessEpochMillis = NOW,
                    messages = listOf(
                        MessageDto(
                            id = "m-1",
                            role = "YOUTH",
                            content = "sobre-cifrado",
                            createdAtEpochMillis = NOW,
                        ),
                    ),
                ),
            ),
        )

        val repository = repository(store)
        requireSuccess(repository.getProfile()) // fuerza la carga

        assertNull(
            "Un esquema desconocido debe ignorarse, no cargarse a medias",
            repository.observeActiveConversation().first(),
        )
    }
}
