package bo.puentejoven.feature.conversation

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.model.ConversationMessage

/** Contenido de la conversación una vez abierta. */
data class ConversationContent(
    val conversationId: String,
    val messages: List<ConversationMessage>,
    /** `true` cuando el joven ya escribió algo: habilita el chequeo contextual. */
    val canContinueToCheck: Boolean,
)

/** Estado de la conversación estructurada (Ruta A, brief §7–§8). */
data class ConversationUiState(
    val content: FeatureUiState<ConversationContent> = FeatureUiState.Loading,
    val draft: String = "",
    val isSending: Boolean = false,
    /**
     * Encuadre de transparencia pendiente de aceptar (brief §7, etapa 1).
     *
     * Se resuelve **dentro** de la pantalla y no como ruta propia: crear un destino
     * nuevo obligaría a tocar `AppDestination.kt` (de A) para algo que es el estado
     * inicial de esta misma superficie. Si producto prefiere pantalla propia
     * (`TASK-004` §9 Q4), se mueve sin cambiar nada más.
     */
    val showTransparency: Boolean = true,
    val sendError: UiError? = null,
) {
    val canSend: Boolean get() = draft.isNotBlank() && !isSending
}
