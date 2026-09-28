package bo.puentejoven.core.data.local

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.model.ShareScopeEntry
import bo.puentejoven.core.model.SummaryNote
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Cifrado en reposo del contenido del joven (F1–F6 de la auditoría).
 *
 * Estas pruebas usan [TestAesGcmCipher]: cifra de verdad y permite destruir el
 * material de claves, algo imposible de ejercitar en JVM con Android Keystore.
 *
 * Lo que se demuestra:
 * - F1/F1b: los turnos de la app y la nota del resumen se cifran, no solo los
 *   mensajes del joven.
 * - F2: la reflexión de la herramienta se cifra.
 * - F3: la lectura devuelve texto legible (ida y vuelta real).
 * - F5: "borrar todo" destruye el material de claves y lo cifrado no vuelve.
 * - Degradación honesta: sin clave no se filtra el sobre, se muestra un marcador.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class LocalContentEncryptionTest {

    private companion object {
        const val NOW = 1_760_000_000_000L
        const val DAY = 24 * 3_600_000L
        const val YOUTH_TEXT = "hoy me sentí muy solo en el recreo"
        const val PUENTE_TEXT = "gracias por contarlo, ¿qué pasó antes?"
        const val REFLECTION = "me sirvió respirar un minuto"
        const val NOTE = "quiero que sepan esto antes de la cita"
    }

    private fun repository(cipher: TestAesGcmCipher): LocalPuenteRepository =
        LocalPuenteRepository(clock = TestClock(current = NOW), cipher = cipher)

    private suspend fun openChat(repository: LocalPuenteRepository): ConversationId =
        when (val result = repository.startConversation()) {
            is AppResult.Success -> result.data.id
            is AppResult.Failure -> error("No se pudo abrir la conversación")
        }

    private fun <T> requireSuccess(result: AppResult<T>): T = when (result) {
        is AppResult.Success -> result.data
        is AppResult.Failure -> error("Se esperaba éxito: ${result.error.technical}")
    }

    // ---------------------------------------------------------------- F1 ----

    @Test
    fun `los turnos de la app se cifran igual que los del joven`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)
        val conversationId = openChat(repository)

        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))
        requireSuccess(repository.appendPuenteMessage(conversationId, PUENTE_TEXT, "prompt-01"))

        assertTrue("El mensaje del joven pasó por el cifrador", cipher.plainTextsSeen.contains(YOUTH_TEXT))
        assertTrue("El turno de la app pasó por el cifrador", cipher.plainTextsSeen.contains(PUENTE_TEXT))
    }

    // ---------------------------------------------------------------- F2 ----

    @Test
    fun `la reflexion de la herramienta se cifra`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)

        requireSuccess(repository.recordCompletion(DemoFixtures.briefTools.first().key, REFLECTION))

        assertTrue("La reflexión pasó por el cifrador", cipher.plainTextsSeen.contains(REFLECTION))
    }

    // --------------------------------------------------------------- F1b ----

    @Test
    fun `la nota del resumen se cifra`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)

        requireSuccess(
            repository.buildShareableSummary(
                scope = setOf(ShareScopeEntry.Signal("frequency")),
                note = SummaryNote(NOTE),
            ),
        )

        assertTrue("La nota pasó por el cifrador", cipher.plainTextsSeen.contains(NOTE))
    }

    // ---------------------------------------------------------------- F3 ----

    @Test
    fun `leer devuelve el texto legible`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)
        val conversationId = openChat(repository)

        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))
        requireSuccess(repository.appendPuenteMessage(conversationId, PUENTE_TEXT, "prompt-01"))
        requireSuccess(repository.recordCompletion(DemoFixtures.briefTools.first().key, REFLECTION))
        requireSuccess(
            repository.buildShareableSummary(
                scope = setOf(ShareScopeEntry.Signal("frequency")),
                note = SummaryNote(NOTE),
            ),
        )

        val messages = repository.observeActiveConversation().first()!!.messages
        assertEquals(YOUTH_TEXT, messages[0].content)
        assertEquals(PUENTE_TEXT, messages[1].content)

        val completion = repository.observeCompletions().first().single()
        assertEquals(REFLECTION, completion.reflection)

        val summary = repository.observeSummaries().first().single()
        assertEquals(NOTE, summary.note?.value)
    }

    @Test
    fun `el reporte personal trae las reflexiones legibles`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)

        requireSuccess(repository.recordCompletion(DemoFixtures.briefTools.first().key, REFLECTION))

        val report = requireSuccess(repository.getPersonalReport())
        assertEquals(REFLECTION, report.toolCompletions.single().reflection)
    }

    // ---------------------------------------------------------------- F4 ----

    @Test
    fun `la purga cubre respuestas herramientas y resumenes`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)
        val conversationId = openChat(repository)

        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))
        repository.recordResponse("hoy_como_estas", "regular", conversationId)
        requireSuccess(repository.recordCompletion(DemoFixtures.briefTools.first().key, REFLECTION))
        requireSuccess(
            repository.buildShareableSummary(
                scope = setOf(ShareScopeEntry.Signal("frequency")),
                note = SummaryNote(NOTE),
            ),
        )

        val purge = requireSuccess(repository.purgeExpired(NOW + 91 * DAY))

        assertEquals(1, purge.purgedResponses)
        assertEquals(1, purge.purgedCompletions)
        assertEquals(1, purge.purgedSummaries)
        assertTrue(purge.purgedAnything)

        assertTrue("No deben quedar respuestas", repository.observeResponses().first().isEmpty())
        assertTrue("No deben quedar herramientas", repository.observeCompletions().first().isEmpty())
        assertTrue("No deben quedar resúmenes", repository.observeSummaries().first().isEmpty())
    }

    // ---------------------------------------------------------------- F5 ----

    @Test
    fun `borrar todo destruye el material de claves`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)
        val conversationId = openChat(repository)
        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))

        // Un sobre producido ANTES del borrado: debe quedar irrecuperable.
        val envelopeBefore = cipher.encrypt(YOUTH_TEXT)

        requireSuccess(repository.deleteAllLocalContent())

        assertFalse("El cifrador queda sin clave tras borrar todo", cipher.isSecure)
        assertTrue(
            "Lo cifrado antes del borrado no debe poder descifrarse",
            runCatching { cipher.decrypt(envelopeBefore) }.isFailure,
        )
    }

    // ------------------------------------------------- degradación honesta --

    @Test
    fun `sin clave la lectura no filtra el sobre`() = runTest {
        val cipher = TestAesGcmCipher()
        val repository = repository(cipher)
        val conversationId = openChat(repository)
        requireSuccess(repository.appendYouthMessage(conversationId, YOUTH_TEXT))

        // La clave se pierde y se prepara una nueva: el sobre anterior no vuelve.
        cipher.destroyKeyMaterial()
        cipher.ensureKeyMaterial()

        val shown = repository.observeActiveConversation().first()!!.messages.first().content
        assertEquals("Contenido no disponible", shown)
        assertFalse("No se debe mostrar el sobre cifrado", shown.startsWith("test+aesgcm:"))
    }
}
