package bo.puentejoven.feature.conversation

/** Acciones del chequeo contextual. */
sealed interface ContextCheckUiAction {

    /**
     * El joven decide sobre la pregunta vigente.
     *
     * «Saltar» es una decisión más (`optionKey` = `GuidedScriptCatalog.OPTION_SKIP`):
     * se registra igual que una respuesta, porque poder no responder es un derecho y
     * dejarlo invisible falsearía lo que el joven contó.
     */
    data class Decide(val questionKey: String, val optionKey: String) : ContextCheckUiAction

    /** Reintenta registrar la última decisión. */
    data class RetryDecision(val questionKey: String, val optionKey: String) : ContextCheckUiAction

    /** Descarta el aviso de error de guardado. */
    data object DismissSaveError : ContextCheckUiAction
}
