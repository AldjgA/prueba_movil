package bo.puentejoven.app.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

/**
 * Raíz del grafo de navegación del joven.
 *
 * Punto de entrada único de la app. Se mantiene deliberadamente delgado: aquí no
 * hay lógica de negocio ni composición de UI concreta, solo el `NavHost` tipado.
 */
@Composable
fun PuenteJovenApp(
    modifier: Modifier = Modifier,
) {
    PuenteJovenNavHost(
        modifier = modifier
            .fillMaxSize()
            .semantics { contentDescription = "Puente Joven" },
    )
}
