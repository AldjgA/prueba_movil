package bo.puentejoven.feature.conversation

/** Acciones de la conversación. */
sealed interface ConversationUiAction {

    /** El joven escribe o borra texto. */
    data class DraftChanged(val draft: String) : ConversationUiAction

    /** Envía el borrador actual. */
    data object Send : ConversationUiAction

    /** Acepta el encuadre de transparencia y abre la conversación. */
    data object AcknowledgeTransparency : ConversationUiAction

    /** Pasa al chequeo contextual. */
    data object OpenContextCheck : ConversationUiAction

    /** Reintenta abrir la conversación tras un error. */
    data object Retry : ConversationUiAction

    /** Descarta el aviso de error de envío. */
    data object DismissSendError : ConversationUiAction
}
