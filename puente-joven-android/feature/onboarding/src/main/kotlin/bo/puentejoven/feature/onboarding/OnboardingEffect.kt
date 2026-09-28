package bo.puentejoven.feature.onboarding

/** Efectos de un solo uso del onboarding. */
sealed interface OnboardingEffect {
    /** El onboarding terminó: la Route navega al Home limpiando la pila. */
    data object Finished : OnboardingEffect
}
