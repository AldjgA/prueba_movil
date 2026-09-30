package bo.puentejoven.feature.conversation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.model.ConversationRole
import bo.puentejoven.core.navigation.AppDestination
import bo.puentejoven.core.navigation.ContextCheckRoute
import bo.puentejoven.feature.conversation.domain.ConversationSnapshot
import bo.puentejoven.feature.conversation.domain.ObserveConversationUseCase
import bo.puentejoven.feature.conversation.domain.SendYouthMessageUseCase
import bo.puentejoven.feature.conversation.domain.StartConversationUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel de la conversación estructurada.
 *
 * Emite [ConversationEffect.Navigate] en lugar de navegar: así es testeable sin
 * Android ni grafo de navegación (mismo patrón que `HomeViewModel`).
 */
@HiltViewModel
class ConversationViewModel @Inject constructor(
    private val observeConversation: ObserveConversationUseCase,
    private val startConversation: StartConversationUseCase,
    private val sendYouthMessage: SendYouthMessageUseCase,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ConversationUiState())
    val uiState: StateFlow<ConversationUiState> = _uiState.asStateFlow()

    private val _effects = Channel<ConversationEffect>(Channel.BUFFERED)
    val effects: Flow<ConversationEffect> = _effects.receiveAsFlow()

    init {
        viewModelScope.launch {
            observeConversation.observe().collect { snapshot ->
                _uiState.update { it.withSnapshot(snapshot) }
            }
        }
    }

    fun onAction(action: ConversationUiAction) {
        when (action) {
            is ConversationUiAction.DraftChanged ->
                _uiState.update { it.copy(draft = action.draft) }

            ConversationUiAction.Send -> send()

            ConversationUiAction.AcknowledgeTransparency -> {
                _uiState.update { it.copy(showTransparency = false) }
                openConversation()
            }

            ConversationUiAction.OpenContextCheck -> openContextCheck()

            ConversationUiAction.Retry -> openConversation()

            ConversationUiAction.DismissSendError ->
                _uiState.update { it.copy(sendError = null) }
        }
    }

    /** Expuesto para pruebas. */
    internal fun openConversation() {
        viewModelScope.launch {
            when (val opened = startConversation()) {
                is AppResult.Success -> Unit // el flujo del repositorio refleja la conversación
                is AppResult.Failure ->
                    _uiState.update { it.copy(content = FeatureUiState.Error(opened.error)) }
            }
        }
    }

    private fun send() {
        val state = _uiState.value
        val content = state.content as? FeatureUiState.Content ?: return
        if (!state.canSend) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, sendError = null) }

            val result = sendYouthMessage(
                conversationId = ConversationId(content.data.conversationId),
                content = state.draft,
            )

            _uiState.update { current ->
                when (result) {
                    // El borrador solo se limpia si el mensaje llegó a guardarse:
                    // perder lo que el joven escribió sería el peor fallo posible aquí.
                    is AppResult.Success -> current.copy(isSending = false, draft = "")
                    is AppResult.Failure -> current.copy(isSending = false, sendError = result.error)
                }
            }
        }
    }

    private fun openContextCheck() {
        val content = _uiState.value.content as? FeatureUiState.Content ?: return
        sendNavigation(ContextCheckRoute(conversationId = content.data.conversationId))
    }

    private fun sendNavigation(destination: AppDestination) {
        viewModelScope.launch { _effects.send(ConversationEffect.Navigate(destination)) }
    }
}

/**
 * Proyecta el snapshot del repositorio al estado de UI.
 *
 * Regla de conservación: si hubo un **error al abrir**, un snapshot vacío no lo pisa
 * (si no, el aviso desaparecería y el botón de reintentar con él).
 */
private fun ConversationUiState.withSnapshot(
    snapshot: ConversationSnapshot?,
): ConversationUiState = when {
    snapshot != null -> copy(
        content = FeatureUiState.Content(
            ConversationContent(
                conversationId = snapshot.conversationId.value,
                messages = snapshot.messages,
                canContinueToCheck = snapshot.messages.any { it.role == ConversationRole.YOUTH },
            ),
        ),
        showTransparency = false,
        sendError = null,
    )

    content is FeatureUiState.Error -> this

    else -> copy(content = FeatureUiState.Empty())
}
