package bo.puentejoven.feature.auth.entry

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.core.navigation.LoginRoute

/**
 * Route de la pantalla de entrada.
 *
 * Responsabilidad única: conectar la navegación tipada con la pantalla.
 * No contiene lógica de negocio ni acceso a datos.
 */
@Composable
fun EntryRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
) {
    EntryScreen(
        onEnter = { navigator.navigateTo(LoginRoute) },
        modifier = modifier,
    )
}
