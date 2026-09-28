package bo.puentejoven.app.debug

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import bo.puentejoven.core.designsystem.preview.PuenteDesignSystemGallery
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Galería interna del design system, para revisión visual en un dispositivo real.
 *
 * Solo existe en builds **debug**: la Activity no se exporta y no aparece en el
 * recorrido del joven. Permite comparar el sistema Compose contra el MVP web en
 * ancho compacto (criterio de aceptación 5 de TASK-002).
 *
 * Se abre con:
 * `adb shell am start -n bo.puentejoven.app/.debug.DesignSystemGalleryActivity`
 */
class DesignSystemGalleryActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PuenteTheme {
                Surface(color = PuenteTheme.colors.bg, modifier = Modifier) {
                    PuenteDesignSystemGallery()
                }
            }
        }
    }
}
