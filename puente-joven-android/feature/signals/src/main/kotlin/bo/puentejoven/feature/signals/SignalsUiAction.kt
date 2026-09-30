package bo.puentejoven.feature.signals

/** Acciones de la pantalla de señales. */
sealed interface SignalsUiAction {

    /** Abre la prioridad preliminar de revisión. */
    data object OpenAttention : SignalsUiAction

    /** Abre el mapa de situación. */
    data object OpenSituationMap : SignalsUiAction
}
