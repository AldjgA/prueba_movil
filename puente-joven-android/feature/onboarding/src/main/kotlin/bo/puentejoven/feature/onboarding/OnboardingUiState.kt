package bo.puentejoven.feature.onboarding

import bo.puentejoven.core.common.UiError

/**
 * Pasos del onboarding.
 *
 * El orden importa: primero el encuadre (qué es y qué no es Puente), después la
 * privacidad, y solo al final la decisión de empezar. Nada se registra antes de
 * que el joven entienda dónde están sus datos.
 */
enum class OnboardingStep {
    /** Qué es Puente y qué NO es (no diagnóstico, no terapia, no chatbot abierto). */
    FRAMING,

    /** Cómo se guardan los datos: local, cifrado, bajo su control. */
    PRIVACY,

    /** Qué puede hacer y qué no puede hacer la app con lo que cuenta. */
    EXPECTATIONS,
    ;

    val isLast: Boolean get() = this == entries.last()
}

/** Estado del onboarding. */
data class OnboardingUiState(
    val step: OnboardingStep = OnboardingStep.FRAMING,
    val acknowledgedFraming: Boolean = false,
    val acknowledgedPrivacy: Boolean = false,
    val isFinishing: Boolean = false,
    val error: UiError? = null,
) {
    /** Se puede avanzar solo si se reconoció el paso actual. */
    val canAdvance: Boolean
        get() = when (step) {
            OnboardingStep.FRAMING -> acknowledgedFraming
            OnboardingStep.PRIVACY -> acknowledgedPrivacy
            OnboardingStep.EXPECTATIONS -> true
        } && !isFinishing

    val progress: Float
        get() = (step.ordinal + 1).toFloat() / OnboardingStep.entries.size.toFloat()
}
