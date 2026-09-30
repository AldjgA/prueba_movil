package bo.puentejoven.feature.signals

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.model.Signal
import bo.puentejoven.feature.signals.domain.RuleOutcome

/** Contenido de la pantalla de señales. */
data class SignalsContent(
    val signals: List<Signal>,
    val outcome: RuleOutcome,
)

/** Estado de la pantalla de señales (brief §10–§11). */
data class SignalsUiState(
    val content: FeatureUiState<SignalsContent> = FeatureUiState.Loading,
)
