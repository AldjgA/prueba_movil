package bo.puentejoven.feature.signals

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.feature.signals.domain.RuleOutcome

/** Contenido de la prioridad preliminar de revisión. */
data class AttentionContent(val outcome: RuleOutcome)

/**
 * Estado de la pantalla de prioridad.
 *
 * No hay `assessmentId` en la ruta: la prioridad **se deriva**, no se almacena. Si el
 * producto quiere un histórico de evaluaciones (brief §10: «comparar con registros
 * anteriores»), es una decisión que hay que tomar y declarar — ver `NECESIDADES.md`.
 */
data class AttentionUiState(
    val content: FeatureUiState<AttentionContent> = FeatureUiState.Loading,
)
