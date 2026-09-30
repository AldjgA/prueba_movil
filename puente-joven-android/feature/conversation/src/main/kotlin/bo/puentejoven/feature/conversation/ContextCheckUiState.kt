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
    /**
     * Opciones marcadas en la pregunta vigente.
     *
     * En las de selección múltiple puede haber más de una (`PR-003` §4.3 regla 3);
     * en las de una sola opción, el conjunto tiene un único elemento.
     */
    val selectedOptions: Set<String> = emptySet(),
    val isSaving: Boolean = false,
    val saveError: UiError? = null,
)
