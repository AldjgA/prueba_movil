package bo.puentejoven.feature.signals

/** Acciones de la pantalla de prioridad preliminar de revisión. */
sealed interface AttentionUiAction {

    /** Abre la preparación de una solicitud de apoyo (`TASK-007`). */
    data object OpenSupport : AttentionUiAction
}
