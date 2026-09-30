package bo.puentejoven.feature.signals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.navigation.AppDestination
import bo.puentejoven.core.navigation.AttentionRoute
import bo.puentejoven.core.navigation.SituationMapRoute
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

/**
 * ViewModel de señales.
 *
 * La prioridad **se recalcula** en cada emisión, no se lee de un almacén: el motor de
 * reglas es determinista (`AttentionRuleset`), así que el mismo estado produce
 * siempre el mismo resultado.
 */
@HiltViewModel
class SignalsViewModel @Inject constructor(
    private val observeSignals: ObserveSignalsUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignalsUiState())
    val uiState: StateFlow<SignalsUiState> = _uiState.asStateFlow()

    private val _effects = Channel<SignalsEffect>(Channel.BUFFERED)
    val effects: Flow<SignalsEffect> = _effects.receiveAsFlow()

    init {
        viewModelScope.launch {
            observeSignals.observe().collect { snapshot ->
                _uiState.value = SignalsUiState(
                    content = if (snapshot.signals.isEmpty()) {
                        // Sin señales no hay nada que explicar: el estado vacío es
                        // informativo, no un error.
                        FeatureUiState.Empty()
                    } else {
                        FeatureUiState.Content(
                            SignalsContent(
                                signals = snapshot.signals,
                                outcome = snapshot.outcome,
                            ),
                        )
                    },
                )
            }
        }
    }

    fun onAction(action: SignalsUiAction) {
        when (action) {
            SignalsUiAction.OpenAttention -> sendNavigation(AttentionRoute())
            SignalsUiAction.OpenSituationMap -> sendNavigation(SituationMapRoute)
        }
    }

    private fun sendNavigation(destination: AppDestination) {
        viewModelScope.launch { _effects.send(SignalsEffect.Navigate(destination)) }
    }
}
