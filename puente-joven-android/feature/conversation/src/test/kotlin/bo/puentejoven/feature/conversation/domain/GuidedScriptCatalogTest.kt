package bo.puentejoven.feature.conversation.domain

import bo.puentejoven.core.model.CheckCatalog
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pruebas del guion de la Ruta A.
 *
 * Criterios de `TASK-004`:
 * - #2 todo turno de Puente nace de una plantilla con `promptId`;
 * - #4 una pregunta por cada dimensión del brief §9, y todas permiten no responder;
 * - el guion es **determinista**: sin IA, sin azar.
 *
 * Y una prueba que protege el contrato con `:core:model`: si `CheckCatalog` gana una
 * clave y aquí falta el copy, **esta clase falla** en vez de perder la pregunta en
 * silencio.
 */
class GuidedScriptCatalogTest {

    @Test
    fun `hay una pregunta por cada dimension del brief 9`() {
        // brief §9 tiene 10 dimensiones; CheckCatalog es la única fuente de claves.
        assertEquals(
            "Cada dimensión del brief §9 debe tener su pregunta con copy",
            CheckCatalog.questionKeys.size,
            GuidedScriptCatalog.questions.size,
        )
        assertEquals(
            "El orden debe ser el del catálogo: la UI lo usa para el progreso",
            CheckCatalog.questionKeys,
            GuidedScriptCatalog.questionKeys,
        )
    }

    @Test
    fun `todas las preguntas permiten no responder`() {
        GuidedScriptCatalog.questions.forEach { question ->
            assertTrue(
                "La pregunta ${question.key} debe ofrecer «${CheckCatalog.OPTION_SKIP}»: " +
                    "poder no responder es un derecho, no una excepción",
                question.options.any { it.key == CheckCatalog.OPTION_SKIP },
            )
        }
    }

    @Test
    fun `todas las opciones del catalogo tienen copy`() {
        // La prueba que evita la pérdida silenciosa: si se añade una opción al
        // catálogo y aquí falta la etiqueta, el número no cuadra.
        val esperadas = CheckCatalog.questionKeys.sumOf { CheckCatalog.optionsFor(it).size + 1 }
        val reales = GuidedScriptCatalog.questions.sumOf { it.options.size }
        assertEquals(
            "Falta copy para alguna opción del catálogo: la pregunta quedaría " +
                "parcialmente irrespondible",
            esperadas,
            reales,
        )
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
    fun `solo emotions admite seleccion multiple`() {
        val multi = GuidedScriptCatalog.questions.filter { it.isMultiSelect }.map { it.key }
        assertEquals(
            "PR-003 §4.3 regla 3: solo emotions admite varias opciones",
            listOf(CheckCatalog.EMOTIONS),
            multi,
        )
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
