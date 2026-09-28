package bo.puentejoven.feature.auth.login

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.core.navigation.OnboardingRoute

/**
 * Route del login.
 *
 * Al completarse la sesión, navega a Onboarding **limpiando la pila** para que el
 * botón "atrás" no devuelva a las credenciales (criterio de aceptación de TASK-001).
 */
@Composable
fun LoginRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
) {
    LoginScreen(
        onAuthenticated = {
            navigator.navigateAndClearStack(OnboardingRoute, keepStartDestination = false)
        },
        onBack = { navigator.navigateBack() },
        modifier = modifier,
    )
}
