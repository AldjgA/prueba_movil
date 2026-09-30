package bo.puentejoven.feature.conversation.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pruebas del guion de la Ruta A.
 *
 * Criterios de `TASK-004`:
 * - #4 el catálogo cubre las dimensiones del brief §9;
 * - #2 todo turno de Puente nace de una plantilla con `promptId`;
 * - el guion es **determinista**: sin IA, sin azar.
 */
class GuidedScriptCatalogTest {

    @Test
    fun `cubre las 10 dimensiones del brief 9 con una pregunta cada una`() {
        val dimensionesCubiertas = GuidedScriptCatalog.questions.map { it.dimension }.toSet()

        assertEquals(
            "Cada dimensión del brief §9 debe tener su pregunta",
            CheckDimension.entries.toSet(),
            dimensionesCubiertas,
        )
        assertEquals(
            "Una pregunta por dimensión: el brief §9 no pide más",
            CheckDimension.entries.size,
            GuidedScriptCatalog.questions.size,
        )
    }

    @Test
    fun `todas las preguntas permiten no responder`() {
        GuidedScriptCatalog.questions.forEach { question ->
            assertTrue(
                "La pregunta ${question.key} debe ofrecer «${GuidedScriptCatalog.OPTION_SKIP}»: " +
                    "poder no responder es un derecho, no una excepción",
                question.options.any { it.key == GuidedScriptCatalog.OPTION_SKIP },
            )
        }
    }

    @Test
    fun `las claves de pregunta y de opcion son unicas`() {
        val questionKeys = GuidedScriptCatalog.questions.map { it.key }
        assertEquals(questionKeys.size, questionKeys.toSet().size)

        GuidedScriptCatalog.questions.forEach { question ->
            val optionKeys = question.options.map { it.key }
            assertEquals(
                "Opciones repetidas en ${question.key}",
                optionKeys.size,
                optionKeys.toSet().size,
            )
        }
    }

    @Test
    fun `el guion responde de forma determinista y cerrada`() {
        assertEquals(
            GuidedScriptCatalog.PROMPT_ACKNOWLEDGE,
            GuidedScriptCatalog.turnAfterYouthMessage(1)?.promptId,
        )
        assertEquals(
            GuidedScriptCatalog.PROMPT_CHECK_INTRO,
            GuidedScriptCatalog.turnAfterYouthMessage(2)?.promptId,
        )
        // A partir del tercer mensaje Puente calla: si hablara siempre, esto sería
        // un formulario y no una conversación (brief §8).
        assertNull(GuidedScriptCatalog.turnAfterYouthMessage(3))
        assertNull(GuidedScriptCatalog.turnAfterYouthMessage(0))
    }

    @Test
    fun `el turno de apertura declara su promptId`() {
        val opening = GuidedScriptCatalog.openingTurn()

        assertEquals(GuidedScriptCatalog.PROMPT_OPENING, opening.promptId)
        assertTrue(opening.promptId.isNotBlank())
    }

    @Test
    fun `todo promptId del guion tiene texto asociado y ninguno ajeno lo tiene`() {
        listOf(
            GuidedScriptCatalog.PROMPT_OPENING,
            GuidedScriptCatalog.PROMPT_ACKNOWLEDGE,
            GuidedScriptCatalog.PROMPT_CHECK_INTRO,
        ).forEach { promptId ->
            assertNotNull(
                "El promptId $promptId debe resolver a un recurso",
                GuidedScriptCatalog.turnResIdOrNull(promptId),
            )
        }

        assertNull(GuidedScriptCatalog.turnResIdOrNull("prompt.inventado"))
    }

    @Test
    fun `nextQuestion devuelve la primera sin decidir y null al terminar`() {
        val primera = GuidedScriptCatalog.nextQuestion(emptySet())
        assertEquals(GuidedScriptCatalog.questions.first().key, primera?.key)

        val todas = GuidedScriptCatalog.questionKeys.toSet()
        assertNull(GuidedScriptCatalog.nextQuestion(todas))

        // Saltar una pregunta también la da por decidida: no se vuelve a preguntar.
        val sinLaPrimera = setOf(GuidedScriptCatalog.questions.first().key)
        assertEquals(
            GuidedScriptCatalog.questions[1].key,
            GuidedScriptCatalog.nextQuestion(sinLaPrimera)?.key,
        )
    }
}
