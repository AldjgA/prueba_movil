package bo.puentejoven.feature.auth.login

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.model.PinPolicy
import bo.puentejoven.core.security.BiometricUnlock
import bo.puentejoven.feature.auth.domain.OpenLocalSessionUseCase
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
 * ViewModel del inicio de sesión local.
 *
 * Patrón: `StateFlow<LoginUiState>` + `Channel<LoginEffect>` para efectos de un
 * solo uso. [SavedStateHandle] conserva el alias ante muerte de proceso para que
 * el joven no tenga que reescribirlo. El PIN NUNCA se guarda en el bundle.
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val openLocalSession: OpenLocalSessionUseCase,
    private val biometric: BiometricUnlock,
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        LoginUiState(
            alias = savedStateHandle.get<String>(KEY_ALIAS).orEmpty(),
            biometricAvailable = biometric.isAvailable,
        ),
    )
    val uiState = _uiState.asStateFlow()

    private val _effects = Channel<LoginEffect>(Channel.BUFFERED)
    val effects: Flow<LoginEffect> = _effects.receiveAsFlow()

    fun onAction(action: LoginUiAction) {
        when (action) {
            is LoginUiAction.AliasChanged -> {
                savedStateHandle[KEY_ALIAS] = action.value
                _uiState.update { it.copy(alias = action.value, error = null) }
            }

            is LoginUiAction.PinChanged -> {
                // El PIN es local; no se guarda en SavedStateHandle para no dejarlo
                // en el bundle del sistema. Se sanea y se recorta a la política.
                _uiState.update { it.copy(pin = PinPolicy.sanitize(action.value), error = null) }
            }

            is LoginUiAction.AgeBandChanged ->
                _uiState.update { it.copy(ageBand = action.band, error = null) }

            LoginUiAction.Submit -> submit()
        }
    }

    private fun submit() {
        val current = _uiState.value
        if (!current.canSubmit) return

        _uiState.update { it.copy(isSubmitting = true, error = null) }

        viewModelScope.launch {
            when (val result = openLocalSession(current.alias, current.ageBand, current.pin)) {
                is AppResult.Success -> {
                    _uiState.update { it.copy(isSubmitting = false, pin = "") }
                    savedStateHandle.remove<String>(KEY_ALIAS)
                    _effects.send(LoginEffect.SessionReady)
                }

                is AppResult.Failure -> _uiState.update {
                    it.copy(isSubmitting = false, error = result.error)
                }
            }
        }
    }

    private companion object {
        const val KEY_ALIAS = "login_alias"
    }
}

/** Error por defecto cuando el fallo no trae uno propio. */
internal val UnknownError: UiError = UiError.Unexpected()
