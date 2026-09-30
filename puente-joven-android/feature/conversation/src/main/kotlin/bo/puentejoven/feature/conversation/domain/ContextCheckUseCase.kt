package bo.puentejoven.feature.conversation.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.data.repository.ContextCheckRepository
import bo.puentejoven.core.model.CheckCatalog
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
     * Valida contra `CheckCatalog`: sin esto, una clave arbitraria podría llegar a
     * `ContextResponse` y `TASK-005` la interpretaría como una dimensión real.
     *
     * [optionKeys] es un **conjunto** porque `emotions` admite selección múltiple
     * (`PR-003` §4.3 regla 3). Cada opción elegida se guarda como una respuesta
     * propia: el modelo `ContextResponse` guarda una opción por fila, así que la
     * multi-selección son varias filas con la misma `questionKey`.
     */
    suspend operator fun invoke(
        questionKey: String,
        optionKeys: Set<String>,
        conversationId: ConversationId?,
    ): AppResult<Unit> {
        if (optionKeys.isEmpty()) {
            return AppResult.Failure(UiError.Validation(technical = "no option selected"))
        }

        if (!CheckCatalog.isKnownQuestion(questionKey)) {
            return AppResult.Failure(UiError.Validation(technical = "unknown question key"))
        }

        val invalid = optionKeys.firstOrNull { !CheckCatalog.isKnownOption(questionKey, it) }
        if (invalid != null) {
            return AppResult.Failure(UiError.Validation(technical = "unknown option key: $invalid"))
        }

        // Una sola opción elegida no puede ir junto al salto: o responde, o salta.
        if (optionKeys.size > 1 && CheckCatalog.OPTION_SKIP in optionKeys) {
            return AppResult.Failure(
                UiError.Validation(technical = "skip cannot be combined with options"),
            )
        }

        for (optionKey in optionKeys) {
            val recorded = contextCheckRepository.recordResponse(
                questionKey = questionKey,
                optionKey = optionKey,
                conversationId = conversationId,
            )
            if (recorded is AppResult.Failure) return recorded
        }

        return AppResult.Success(Unit)
    }
}
