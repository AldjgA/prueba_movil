package bo.puentejoven.feature.conversation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import bo.puentejoven.core.navigation.AppNavigator

/**
 * Route de la conversación estructurada.
 *
 * El `:app` la monta sobre `ConversationRoute` del grafo tipado, sustituyendo el
 * placeholder (`NECESIDADES.md` de `TASK-004`).
 */
@Composable
fun ConversationRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
) {
    ConversationScreen(
        navigator = navigator,
        modifier = modifier,
    )
}
