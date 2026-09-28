package bo.puentejoven.feature.auth.login

/** Efectos de un solo uso emitidos por [LoginViewModel]. */
sealed interface LoginEffect {
    /** La sesión local se creó correctamente: la Route debe navegar a Onboarding. */
    data object SessionReady : LoginEffect
}
