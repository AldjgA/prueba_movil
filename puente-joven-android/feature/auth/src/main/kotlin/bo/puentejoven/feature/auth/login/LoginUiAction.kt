package bo.puentejoven.feature.auth.login

import bo.puentejoven.core.model.AgeBand

/** Acciones que la pantalla de login puede enviar a su ViewModel. */
sealed interface LoginUiAction {
    data class AliasChanged(val value: String) : LoginUiAction
    data class PinChanged(val value: String) : LoginUiAction
    data class AgeBandChanged(val band: AgeBand) : LoginUiAction
    data object Submit : LoginUiAction
}
