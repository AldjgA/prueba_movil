package bo.puentejoven.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.navigation.AppDestination
import bo.puentejoven.core.navigation.ConversationRoute
import bo.puentejoven.core.navigation.JourneyRoute
import bo.puentejoven.core.navigation.PersonalReportRoute
import bo.puentejoven.core.navigation.SignalsRoute
import bo.puentejoven.core.navigation.ToolDetailRoute
import bo.puentejoven.feature.home.domain.ObserveHomeUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel del Home.
 *
 * Emite [HomeEffect.Navigate] en lugar de navegar él mismo: la Route traduce el
 * efecto a [bo.puentejoven.core.navigation.AppNavigator]. Así el ViewModel es
 * testeable sin Android y sin grafo de navegación.
 */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val observeHome: ObserveHomeUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState = _uiState.asStateFlow()

    private val _effects = Channel<HomeEffect>(Channel.BUFFERED)
    val effects: Flow<HomeEffect> = _effects.receiveAsFlow()

    init {
        load()
    }

    fun onAction(action: HomeUiAction) {
        when (action) {
            HomeUiAction.StartConversation ->
                sendNavigation(ConversationRoute)

            HomeUiAction.OpenSignals ->
                sendNavigation(SignalsRoute)

            HomeUiAction.OpenJourney ->
                sendNavigation(JourneyRoute)

            HomeUiAction.OpenPersonalReport ->
                sendNavigation(PersonalReportRoute)

            HomeUiAction.OpenHelpSomeone ->
                // "Ayudar a alguien" se resuelve dentro de la conversación estructurada:
                // no existe una superficie profesional en esta app (guardrail #6).
                sendNavigation(ConversationRoute)

            is HomeUiAction.OpenTool ->
                sendNavigation(ToolDetailRoute(toolKey = action.toolKey))

            HomeUiAction.Retry -> load()
        }
    }

    /** Expuesto para pruebas y para el botón "volver a intentar". */
    internal fun load() {
        _uiState.update { it.copy(content = FeatureUiState.Loading) }

        viewModelScope.launch {
            when (val result = observeHome()) {
                is AppResult.Success -> {
                    val snapshot = result.data
                    val content = HomeContent(
                        profile = snapshot.profile,
                        greeting = observeHome.greeting(),
                        hasSignalsToReview = snapshot.signals.isNotEmpty(),
                        signalSummaryLabel = if (snapshot.signals.isEmpty()) {
                            "Todavía no hay señales registradas"
                        } else {
                            "Hay algo que cambió"
                        },
                        tools = snapshot.tools,
                    )
                    _uiState.update { it.copy(content = FeatureUiState.Content(content)) }
                }

                is AppResult.Failure ->
                    _uiState.update { it.copy(content = FeatureUiState.Error(result.error)) }
            }
        }
    }

    private fun sendNavigation(destination: AppDestination) {
        viewModelScope.launch { _effects.send(HomeEffect.Navigate(destination)) }
    }
}
