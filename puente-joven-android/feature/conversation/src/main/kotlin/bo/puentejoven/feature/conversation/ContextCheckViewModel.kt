package bo.puentejoven.feature.conversation

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.feature.conversation.domain.CheckQuestion
import bo.puentejoven.feature.conversation.domain.ContextCheckUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel del chequeo contextual.
 *
 * La pregunta vigente **no** la elige el ViewModel: la deriva el caso de uso a partir
 * de las respuestas ya guardadas. Así, si el joven sale y vuelve, continúa donde
 * estaba sin que la UI tenga que recordarlo.
 */
@HiltViewModel
class ContextCheckViewModel @Inject constructor(
    private val contextCheck: ContextCheckUseCase,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    /**
     * Conversación de origen, si la ruta la trajo.
     *
     * Se lee del `SavedStateHandle` porque la ruta tipada
     * (`ContextCheckRoute(conversationId)`) ya deja el argumento ahí. Es opcional por
     * contrato (`ContextCheckRepository.recordResponse` acepta `null`): si falta, la
     * respuesta se guarda igual y solo se pierde el vínculo con la conversación.
     */
    private val conversationId: ConversationId? =
        savedStateHandle.get<String>(ARG_CONVERSATION_ID)
            ?.takeIf { it.isNotBlank() }
            ?.let(::ConversationId)

    private val _uiState = MutableStateFlow(ContextCheckUiState())
    val uiState: StateFlow<ContextCheckUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            contextCheck.observeProgress().collect { progress ->
                _uiState.update { current ->
                    val nextQuestion = progress.question
                    val previousKey = currentQuestionKey()
                    current.copy(
                        content = FeatureUiState.Content(
                            ContextCheckContent(
                                question = nextQuestion,
                                decidedCount = progress.decidedCount,
                                totalCount = progress.totalCount,
                            ),
                        ),
                        // Al cambiar de pregunta se limpia la selección: si no, lo que
                        // el joven marcó en la anterior aparecería marcado en la nueva.
                        selectedOptions = if (nextQuestion?.key == previousKey) {
                            current.selectedOptions
                        } else {
                            emptySet()
                        },
                    )
                }
            }
        }
    }

    /** Pregunta vigente, o `null` si el chequeo terminó o aún está cargando. */
    fun currentQuestion(): CheckQuestion? =
        (_uiState.value.content as? FeatureUiState.Content)?.data?.question

    private fun currentQuestionKey(): String? = currentQuestion()?.key

    fun onAction(action: ContextCheckUiAction) {
        when (action) {
            is ContextCheckUiAction.Decide ->
                decide(action.questionKey, action.optionKeys)

            is ContextCheckUiAction.RetryDecision ->
                decide(action.questionKey, action.optionKeys)

            is ContextCheckUiAction.ToggleOption -> toggle(action.optionKey)

            ContextCheckUiAction.DismissSaveError ->
                _uiState.update { it.copy(saveError = null) }
        }
    }

    /**
     * Marca o desmarca una opción.
     *
     * En una pregunta de una sola opción, marcar **reemplaza**: no tiene sentido
     * acumular selecciones donde el catálogo dice que solo cabe una.
     */
    private fun toggle(optionKey: String) {
        val question = currentQuestion() ?: return

        _uiState.update { state ->
            val current = state.selectedOptions
            val next = if (question.isMultiSelect) {
                if (optionKey in current) current - optionKey else current + optionKey
            } else {
                // El salto no se combina con otras opciones: o responde, o salta.
                setOf(optionKey)
            }
            state.copy(selectedOptions = next)
        }
    }

    private fun decide(questionKey: String, optionKeys: Set<String>) {
        if (_uiState.value.isSaving) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, saveError = null) }

            val result = contextCheck(
                questionKey = questionKey,
                optionKeys = optionKeys,
                conversationId = conversationId,
            )

            _uiState.update { current ->
                when (result) {
                    // El avance lo produce el flujo de respuestas, no esta línea: si
                    // falla el guardado, la pregunta NO avanza y el joven lo ve.
                    is AppResult.Success -> current.copy(
                        isSaving = false,
                        selectedOptions = emptySet(),
                    )

                    is AppResult.Failure -> current.copy(isSaving = false, saveError = result.error)
                }
            }
        }
    }

    internal companion object {
        /** Debe coincidir con el nombre del argumento de `ContextCheckRoute` (grafo tipado). */
        const val ARG_CONVERSATION_ID = "conversationId"
    }
}
