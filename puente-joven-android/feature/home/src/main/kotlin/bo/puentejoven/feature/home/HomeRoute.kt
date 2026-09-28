package bo.puentejoven.feature.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import bo.puentejoven.core.navigation.AppNavigator

/**
 * Route del Home.
 *
 * Conecta la navegación tipada con la pantalla. La barra inferior se monta en el
 * grafo (`:app`) para que sea compartida por los destinos de primer nivel.
 */
@Composable
fun HomeRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
) {
    HomeScreen(
        navigator = navigator,
        modifier = modifier,
    )
}
