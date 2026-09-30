package bo.puentejoven.feature.signals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.navigation.AppDestination
import bo.puentejoven.core.navigation.SummaryReviewRoute
import bo.puentejoven.feature.signals.domain.ObserveSignalsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

/** ViewModel de la prioridad preliminar de revisión. */
@HiltViewModel
class AttentionViewModel @Inject constructor(
    private val observeSignals: ObserveSignalsUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AttentionUiState())
    val uiState: StateFlow<AttentionUiState> = _uiState.asStateFlow()

    private val _effects = Channel<SignalsEffect>(Channel.BUFFERED)
    val effects: Flow<SignalsEffect> = _effects.receiveAsFlow()

    init {
        viewModelScope.launch {
            observeSignals.observe().collect { snapshot ->
                _uiState.value = AttentionUiState(
                    content = FeatureUiState.Content(AttentionContent(snapshot.outcome)),
                )
            }
        }
    }

    fun onAction(action: AttentionUiAction) {
        when (action) {
            // `TASK-007` aún no está construida: el destino existe en el grafo como
            // placeholder, así que la navegación es correcta y no rompe nada.
            AttentionUiAction.OpenSupport -> sendNavigation(SummaryReviewRoute)
        }
    }

    private fun sendNavigation(destination: AppDestination) {
        viewModelScope.launch { _effects.send(SignalsEffect.Navigate(destination)) }
    }
}
