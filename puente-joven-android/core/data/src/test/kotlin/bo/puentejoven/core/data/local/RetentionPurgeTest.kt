package bo.puentejoven.core.data.local

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.security.PassThroughLocalCipher
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pruebas de retención y borrado local (TASK-003, criterio #4: "el repositorio
 * expone una prueba de purga por reloj inyectable").
 *
 * El reloj es [TestClock] y el instante se pasa explícitamente a la purga, así
 * ningún resultado depende del reloj real del sistema.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class RetentionPurgeTest {

    private companion object {
        const val NOW = 1_760_000_000_000L
        const val DAY = 24 * 3_600_000L
        const val PIN = "123456"
    }

    private fun repository(): LocalPuenteRepository = LocalPuenteRepository(
        clock = TestClock(current = NOW),
        cipher = PassThroughLocalCipher(),
    )

    /** Deja una conversación con un mensaje y devuelve el repositorio. */
    private suspend fun repositoryWithChat(): LocalPuenteRepository {
        val repository = repository()
        val conversation = when (val result = repository.startConversation()) {
            is AppResult.Success -> result.data
            is AppResult.Failure -> error("No se pudo abrir la conversación")
        }
        repository.appendYouthMessage(conversation.id, "hola")
        return repository
    }

    @Test
    fun `antes del plazo no se purga nada`() = runTest {
        val repository = repositoryWithChat()

        val result = repository.purgeExpired(NOW + 89 * DAY)

        val purge = requireSuccess(result)
        assertFalse("Con 89 días no vence nada", purge.purgedAnything)
        assertEquals(0, purge.purgedConversations)
        assertTrue(repository.observeActiveConversation().first() != null)
    }

    @Test
    fun `vencido el plazo el chat se destruye`() = runTest {
        val repository = repositoryWithChat()

        val result = repository.purgeExpired(NOW + 91 * DAY)

        val purge = requireSuccess(result)
        assertTrue("Con 91 días el contenido venció", purge.purgedAnything)
        assertEquals(1, purge.purgedConversations)
        assertEquals(1, purge.purgedMessages)
        assertNull("La conversación no debe seguir accesible", repository.observeActiveConversation().first())
    }

    @Test
    fun `el aviso de renovacion aparece a los 75 dias`() = runTest {
        val repository = repositoryWithChat()

        val early = requireSuccess(repository.retentionStatus(NOW + 74 * DAY))
        assertFalse("A 74 días todavía no avisa", early.needsRenewalNotice)
        assertEquals(16, early.chatDaysUntilExpiry)

        val due = requireSuccess(repository.retentionStatus(NOW + 75 * DAY))
        assertTrue("A 75 días corresponde avisar", due.needsRenewalNotice)
        assertEquals(15, due.chatDaysUntilExpiry)
    }

    @Test
    fun `borrado manual destruye contenido y el derivado del pin`() = runTest {
        val repository = repositoryWithChat()
        repository.createProfile("Alex", AgeBand.MID_TEEN, PIN)
        assertTrue(repository.isPinConfigured())

        requireSuccess(repository.deleteAllLocalContent())

        assertFalse("El derivado del PIN debe destruirse", repository.isPinConfigured())
        assertNull(repository.observeActiveConversation().first())
        assertFalse(repository.observeSessionUnlocked().first())
    }

    /**
     * El alias lo escribe el joven: es contenido local. Un "borrar todo" que lo
     * conservara sería un borrado a medias.
     */
    @Test
    fun `borrado manual olvida el alias del joven`() = runTest {
        val repository = repositoryWithChat()
        repository.createProfile("Alex", AgeBand.MID_TEEN, PIN)
        assertTrue(
            "El alias existe antes del borrado",
            repository.observeProfile().first() != null,
        )

        requireSuccess(repository.deleteAllLocalContent())

        assertNull("El alias no debe sobrevivir al borrado", repository.observeProfile().first())
    }

    private fun <T> requireSuccess(result: AppResult<T>): T = when (result) {
        is AppResult.Success -> result.data
        is AppResult.Failure -> error("Se esperaba éxito: ${result.error.technical}")
    }
}
