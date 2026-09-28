package bo.puentejoven.feature.auth.login

import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.PinPolicy

/** Estado de la pantalla de inicio de sesión local. */
data class LoginUiState(
    val alias: String = "",
    val ageBand: AgeBand = AgeBand.MID_TEEN,
    val pin: String = "",
    val isSubmitting: Boolean = false,
    val error: UiError? = null,
    /**
     * Biometría disponible en el dispositivo. Es COMODIDAD OPCIONAL: cuando es
     * `false` la pantalla lo declara en vez de mostrar un interruptor inerte
     * (TASK-003: "biometría es comodidad, no reemplaza PIN ni consentimiento").
     */
    val biometricAvailable: Boolean = false,
) {

    /** La longitud del PIN la define [PinPolicy]: una sola fuente de verdad. */
    val canSubmit: Boolean
        get() = alias.isNotBlank() && PinPolicy.isWellFormed(pin) && !isSubmitting
}
