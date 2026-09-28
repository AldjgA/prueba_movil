package bo.puentejoven.feature.onboarding

/** Acciones del onboarding. */
sealed interface OnboardingUiAction {
    data class FramingAcknowledged(val acknowledged: Boolean) : OnboardingUiAction
    data class PrivacyAcknowledged(val acknowledged: Boolean) : OnboardingUiAction
    data object Next : OnboardingUiAction
    data object Back : OnboardingUiAction
    data object Finish : OnboardingUiAction
}
