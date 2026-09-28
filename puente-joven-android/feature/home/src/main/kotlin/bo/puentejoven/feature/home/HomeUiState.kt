package bo.puentejoven.feature.home

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.model.BriefTool
import bo.puentejoven.core.model.YouthProfile

/** Contenido del Home una vez cargado. */
data class HomeContent(
    val profile: YouthProfile,
    val greeting: String,
    val hasSignalsToReview: Boolean,
    val signalSummaryLabel: String,
    val tools: List<BriefTool>,
)

/** Estado del Home. */
data class HomeUiState(
    val content: FeatureUiState<HomeContent> = FeatureUiState.Loading,
) {
    val isLoading: Boolean get() = content is FeatureUiState.Loading
}
