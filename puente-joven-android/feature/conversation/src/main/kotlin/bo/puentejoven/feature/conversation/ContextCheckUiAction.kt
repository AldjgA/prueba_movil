package bo.puentejoven.feature.conversation

/** Acciones del chequeo contextual. */
sealed interface ContextCheckUiAction {

    /**
     * Confirma la decisión sobre la pregunta vigente.
     *
     * «Saltar» es una decisión más (`optionKey` = `CheckCatalog.OPTION_SKIP`):
     * se registra igual que una respuesta, porque poder no responder es un derecho y
     * dejarlo invisible falsearía lo que el joven contó.
     */
    data class Decide(val questionKey: String, val optionKeys: Set<String>) : ContextCheckUiAction

    /**
     * Marca o desmarca una opción en una pregunta de selección múltiple
     * (`PR-003` §4.3 regla 3: `emotions`).
     */
    data class ToggleOption(val optionKey: String) : ContextCheckUiAction

    /** Reintenta registrar la última decisión. */
    data class RetryDecision(val questionKey: String, val optionKeys: Set<String>) : ContextCheckUiAction

    /** Descarta el aviso de error de guardado. */
    data object DismissSaveError : ContextCheckUiAction
}
