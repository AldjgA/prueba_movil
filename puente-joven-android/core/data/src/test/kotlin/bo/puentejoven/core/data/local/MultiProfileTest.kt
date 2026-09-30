package bo.puentejoven.core.data.local

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.model.AgeBand
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Multi-perfil en dispositivo compartido (TASK-025).
 *
 * El escenario que motiva la tarea: un teléfono compartido por hermanos. Si el
 * segundo adolescente **pisa** al primero, es un fallo de privacidad, no una
 * limitación (`TASK-021` T1, la amenaza crítica).
 */
@OptIn(ExperimentalCoroutinesApi::class)
class MultiProfileTest {

    private companion object {
        const val NOW = 1_760_000_000_000L
        const val PIN_A = "111111"
        const val PIN_B = "222222"
        const val TEXT_A = "soy Ana y esto es privado"
        const val TEXT_B = "soy Beto y esto también"
    }

    private fun repository(store: PuenteLocalStore = InMemoryPuenteLocalStore()) =
        LocalPuenteRepository(
            clock = TestClock(current = NOW),
            cipher = TestAesGcmCipher(),
            store = store,
        )

    private fun <T> requireSuccess(result: AppResult<T>): T = when (result) {
        is AppResult.Success -> result.data
        is AppResult.Failure -> error("Se esperaba éxito: ${result.error.technical}")
    }

    @Test
    fun `crear un segundo perfil no modifica el primero`() = runTest {
        val repository = repository()

        val ana = requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        val beto = requireSuccess(repository.createProfile("Beto", AgeBand.LATE_TEEN, PIN_B))

        assertNotEquals("Cada perfil recibe un ProfileId propio", ana.id, beto.id)

        val profiles = repository.observeProfiles().first()
        assertEquals("Deben convivir los dos perfiles", 2, profiles.size)
        assertTrue(profiles.any { it.id == ana.id && it.alias.value == "Ana" })
        assertTrue(profiles.any { it.id == beto.id && it.alias.value == "Beto" })
    }

    @Test
    fun `el pin de un perfil no desbloquea al otro`() = runTest {
        val repository = repository()
        requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        requireSuccess(repository.createProfile("Beto", AgeBand.LATE_TEEN, PIN_B))
        repository.lockSession()

        // El perfil activo es Beto: su PIN abre, el de Ana no.
        assertTrue(
            "El PIN de Beto abre Beto",
            repository.unlockSession(PIN_B) is AppResult.Success,
        )
        repository.lockSession()
        assertTrue(
            "El PIN de Ana NO debe abrir Beto",
            repository.unlockSession(PIN_A) is AppResult.Failure,
        )

        // Con alias + PIN, cada uno resuelve al suyo sin listar nada.
        repository.lockSession()
        requireSuccess(repository.unlockSessionFor("Ana", PIN_A))
        assertEquals("Ana", requireSuccess(repository.getProfile()).alias.value)
    }

    @Test
    fun `el contenido de un perfil no es visible desde el otro`() = runTest {
        val repository = repository()

        val ana = requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        val convA = requireSuccess(repository.startConversation()).id
        requireSuccess(repository.appendYouthMessage(convA, TEXT_A))

        requireSuccess(repository.createProfile("Beto", AgeBand.LATE_TEEN, PIN_B))
        assertNull(
            "Un perfil nuevo no debe ver el chat del anterior",
            repository.observeActiveConversation().first(),
        )

        val convB = requireSuccess(repository.startConversation()).id
        requireSuccess(repository.appendYouthMessage(convB, TEXT_B))

        // Volver a Ana: su chat sigue ahí y el de Beto no aparece.
        requireSuccess(repository.switchProfile(ana.id))
        val messages = repository.observeActiveConversation().first()!!.messages
        assertEquals(1, messages.size)
        assertEquals(TEXT_A, messages.single().content)
    }

    @Test
    fun `borrar un perfil conserva los demas`() = runTest {
        val repository = repository()
        val ana = requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        val beto = requireSuccess(repository.createProfile("Beto", AgeBand.LATE_TEEN, PIN_B))

        requireSuccess(repository.deleteProfile(ana.id))

        val profiles = repository.observeProfiles().first()
        assertEquals(1, profiles.size)
        assertEquals(beto.id, profiles.single().id)

        // El PIN del que queda sigue funcionando.
        repository.lockSession()
        requireSuccess(repository.unlockSession(PIN_B))
    }

    @Test
    fun `borrar el perfil activo deja operativo el otro`() = runTest {
        val repository = repository()
        val ana = requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        val beto = requireSuccess(repository.createProfile("Beto", AgeBand.LATE_TEEN, PIN_B))

        // Beto es el activo; se borra Beto.
        requireSuccess(repository.deleteProfile(beto.id))

        assertEquals(
            "El perfil activo pasa a ser el que queda",
            ana.id,
            requireSuccess(repository.getProfile()).id,
        )
        assertFalse("Cambiar de perfil cierra la sesión", repository.observeSessionUnlocked().first())
    }

    @Test
    fun `un alias desconocido no revela si existe`() = runTest {
        val repository = repository()
        requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        repository.lockSession()

        val result = repository.unlockSessionFor("NoExiste", PIN_A)

        assertTrue("Debe fallar", result is AppResult.Failure)
        assertTrue(
            "Mismo error que un PIN incorrecto: no filtra si el alias existe",
            (result as AppResult.Failure).error is UiError.Authentication,
        )
        assertFalse(repository.observeSessionUnlocked().first())
    }

    @Test
    fun `borrar todo elimina todos los perfiles y sus pines`() = runTest {
        val store = InMemoryPuenteLocalStore()
        val repository = repository(store)
        val ana = requireSuccess(repository.createProfile("Ana", AgeBand.MID_TEEN, PIN_A))
        val beto = requireSuccess(repository.createProfile("Beto", AgeBand.LATE_TEEN, PIN_B))

        requireSuccess(repository.deleteAllLocalContent())

        assertTrue(repository.observeProfiles().first().isEmpty())
        assertFalse("Ningún PIN debe sobrevivir", repository.isPinConfigured())
        assertNull(store.readSession())
        assertNull(store.readContent(ana.id.value))
        assertNull(store.readContent(beto.id.value))
    }
}
