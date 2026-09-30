package bo.puentejoven.feature.signals

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.model.SituationMap
import bo.puentejoven.feature.signals.domain.ObserveSituationMapUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** Estado del mapa de situación (brief §12). */
data class SituationMapUiState(
    val content: FeatureUiState<SituationMap> = FeatureUiState.Loading,
)

/** ViewModel del mapa de situación. */
@HiltViewModel
class SituationMapViewModel @Inject constructor(
    private val observeSituationMap: ObserveSituationMapUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SituationMapUiState())
    val uiState: StateFlow<SituationMapUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    /** Expuesto para pruebas y para el botón de reintentar. */
    internal fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(content = FeatureUiState.Loading) }

            val next = when (val result = observeSituationMap()) {
                is AppResult.Success -> {
                    val map = result.data
                    if (map.entries.isEmpty()) {
                        FeatureUiState.Empty()
                    } else {
                        FeatureUiState.Content(map)
                    }
                }

                is AppResult.Failure -> FeatureUiState.Error(result.error)
            }

            _uiState.update { it.copy(content = next) }
        }
    }
}
