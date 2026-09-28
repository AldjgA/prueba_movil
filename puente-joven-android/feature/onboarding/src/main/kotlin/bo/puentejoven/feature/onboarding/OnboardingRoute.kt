package bo.puentejoven.feature.onboarding

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.core.navigation.HomeRoute

/**
 * Route del onboarding.
 *
 * Al terminar navega al Home limpiando la pila: el joven no debe poder volver a
 * las pantallas de entrada con "atrás".
 */
@Composable
fun OnboardingRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
) {
    OnboardingScreen(
        onFinished = {
            navigator.navigateAndClearStack(HomeRoute, keepStartDestination = false)
        },
        modifier = modifier,
    )
}
