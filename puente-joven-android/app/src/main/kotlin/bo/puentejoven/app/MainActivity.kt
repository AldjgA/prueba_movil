package bo.puentejoven.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import bo.puentejoven.app.navigation.PuenteJovenApp
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Activity única de Puente Joven La Paz.
 *
 * Responsabilidad mínima: aplicar [PuenteTheme] y montar el grafo de navegación
 * del joven. No contiene lógica de negocio (criterio de TASK-001).
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            PuenteTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(PuenteTheme.colors.bg),
                    color = PuenteTheme.colors.bg,
                ) {
                    PuenteJovenApp()
                }
            }
        }
    }
}
