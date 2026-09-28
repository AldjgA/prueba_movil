package bo.puentejoven.feature.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
 * ViewModel del onboarding.
 *
 * No persiste nada en el repositorio: el MVP solo necesita que el joven recorra y
 * reconozca el encuadre y la privacidad antes de entrar. La persistencia del
 * consentimiento formal ocurre en la feature de Consentimiento (TASK-007).
 */
@HiltViewModel
class OnboardingViewModel @Inject constructor() : ViewModel() {

    private val _uiState = MutableStateFlow(OnboardingUiState())
    val uiState = _uiState.asStateFlow()

    private val _effects = Channel<OnboardingEffect>(Channel.BUFFERED)
    val effects: Flow<OnboardingEffect> = _effects.receiveAsFlow()

    fun onAction(action: OnboardingUiAction) {
        when (action) {
            is OnboardingUiAction.FramingAcknowledged ->
                _uiState.update { it.copy(acknowledgedFraming = action.acknowledged) }

            is OnboardingUiAction.PrivacyAcknowledged ->
                _uiState.update { it.copy(acknowledgedPrivacy = action.acknowledged) }

            OnboardingUiAction.Next -> advance()

            OnboardingUiAction.Back -> goBack()

            OnboardingUiAction.Finish -> finish()
        }
    }

    private fun advance() {
        val current = _uiState.value
        if (!current.canAdvance) return
        if (current.step.isLast) {
            finish()
            return
        }
        _uiState.update { it.copy(step = OnboardingStep.entries[it.step.ordinal + 1]) }
    }

    private fun goBack() {
        val current = _uiState.value
        if (current.step.ordinal == 0) return
        _uiState.update { it.copy(step = OnboardingStep.entries[it.step.ordinal - 1]) }
    }

    private fun finish() {
        if (_uiState.value.step != OnboardingStep.EXPECTATIONS) return
        _uiState.update { it.copy(isFinishing = true) }
        viewModelScope.launch {
            _effects.send(OnboardingEffect.Finished)
            _uiState.update { it.copy(isFinishing = false) }
        }
    }
}
