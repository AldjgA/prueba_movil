package bo.puentejoven.feature.conversation

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.UiError
import bo.puentejoven.feature.conversation.domain.CheckQuestion

/** Contenido del chequeo contextual: la pregunta vigente y el avance. */
data class ContextCheckContent(
    val question: CheckQuestion?,
    val decidedCount: Int,
    val totalCount: Int,
) {
    /** `question == null` significa **terminado**, no vacío. */
    val isFinished: Boolean get() = question == null
}

/** Estado del chequeo contextual (brief §9). */
data class ContextCheckUiState(
    val content: FeatureUiState<ContextCheckContent> = FeatureUiState.Loading,
    val isSaving: Boolean = false,
    val saveError: UiError? = null,
)
