package bo.puentejoven.feature.home

/** Acciones del Home. */
sealed interface HomeUiAction {
    /** El joven quiere contar algo: abre la conversación estructurada. */
    data object StartConversation : HomeUiAction

    /** Abre la lista de señales. */
    data object OpenSignals : HomeUiAction

    /** Abre el recorrido. */
    data object OpenJourney : HomeUiAction

    /** Abre el reporte personal. */
    data object OpenPersonalReport : HomeUiAction

    /** Abre la pantalla "quiero ayudar a alguien". */
    data object OpenHelpSomeone : HomeUiAction

    /** Abre el detalle de una herramienta breve. */
    data class OpenTool(val toolKey: String) : HomeUiAction

    /** Reintenta la carga tras un error. */
    data object Retry : HomeUiAction
}
