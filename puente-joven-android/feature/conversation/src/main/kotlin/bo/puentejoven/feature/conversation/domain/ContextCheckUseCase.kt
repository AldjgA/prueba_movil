package bo.puentejoven.feature.conversation.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.data.repository.ContextCheckRepository
import bo.puentejoven.core.model.ConversationId
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * Progreso del chequeo: la pregunta vigente y cuántas se han decidido.
 *
 * `question == null` significa **terminado**, no vacío.
 */
data class CheckProgress(
    val question: CheckQuestion?,
    val decidedCount: Int,
    val totalCount: Int,
) {
    val isFinished: Boolean get() = question == null
}

/**
 * Caso de uso del chequeo contextual.
 *
 * **Qué NO hace, a propósito:** no calcula niveles de atención. Solo recoge
 * respuestas con claves de catálogo. El cálculo de verde/amarillo/rojo es
 * `TASK-005`; mezclarlo aquí metería reglas clínicas en la capa de conversación.
 *
 * **Fuente de las preguntas:** el catálogo de la feature, no
 * `ContextCheckRepository.availableQuestionKeys()`. Ese método devuelve hoy cuatro
 * claves en español (`hoy_como_estas`, `donde_ocurre`…) que **no coinciden** con el
 * catálogo y no tienen copy asociado. Declarado a A en `NECESIDADES.md`.
 */
class ContextCheckUseCase @Inject constructor(
    private val contextCheckRepository: ContextCheckRepository,
) {

    /** Progreso reactivo: avanza solo cuando el joven decide (responde o salta). */
    fun observeProgress(): Flow<CheckProgress> =
        contextCheckRepository.observeResponses().map { responses ->
            val decided = responses.map { it.questionKey.value }.toSet()
            CheckProgress(
                question = GuidedScriptCatalog.nextQuestion(decided),
                decidedCount = GuidedScriptCatalog.questionKeys.count { it in decided },
                totalCount = GuidedScriptCatalog.questions.size,
            )
        }

    /**
     * Registra una decisión del joven.
     *
     * Valida que la pregunta pertenezca al catálogo: sin esto, una clave arbitraria
     * podría llegar a `ContextResponse` y `TASK-005` la interpretaría como una
     * dimensión real. La clave de opción se valida contra las opciones de esa
     * pregunta por el mismo motivo.
     */
    suspend operator fun invoke(
        questionKey: String,
        optionKey: String,
        conversationId: ConversationId?,
    ): AppResult<Unit> {
        val question = GuidedScriptCatalog.question(questionKey)
            ?: return AppResult.Failure(UiError.Validation(technical = "unknown question key"))

        if (question.options.none { it.key == optionKey }) {
            return AppResult.Failure(UiError.Validation(technical = "unknown option key"))
        }

        return when (
            val recorded = contextCheckRepository.recordResponse(
                questionKey = questionKey,
                optionKey = optionKey,
                conversationId = conversationId,
            )
        ) {
            is AppResult.Failure -> recorded
            is AppResult.Success -> AppResult.Success(Unit)
        }
    }
}
