package bo.puentejoven.core.designsystem.motion

import android.provider.Settings
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * Curvas del MVP web:
 * - `.transition-smooth` -> `cubic-bezier(0.4, 0, 0.2, 1)` ≈ [EaseInOut]
 */
object PuenteEasing {
    val Standard = EaseInOut
}

/**
 * Detecta si el usuario pidió reducir el movimiento en Ajustes del sistema.
 *
 * Lee `Settings.Global.ANIMATOR_DURATION_SCALE`: si es 0, el usuario desactivó las
 * animaciones. Todo movimiento del design system (incluido el orbe) debe respetarlo.
 */
@Composable
fun rememberReducedMotion(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        val scale = Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f,
        )
        scale == 0f
    }
}

/**
 * `tween` estándar que se convierte en `snap` (sin animación) cuando el usuario
 * pidió reducir el movimiento.
 */
@Composable
fun motionAwareTween(durationMillis: Int): AnimationSpec<Float> {
    val reduced = rememberReducedMotion()
    return if (reduced) {
        snap()
    } else {
        tween(durationMillis = durationMillis, easing = PuenteEasing.Standard)
    }
}

/**
 * Pulso continuo (0f..1f de escala) que respeta la reducción de movimiento:
 * con movimiento reducido devuelve siempre el valor inicial, sin transición infinita.
 *
 * @param durationMillis duración de medio ciclo.
 */
@Composable
fun rememberPulse(
    durationMillis: Int,
    minScale: Float = 1f,
    maxScale: Float = 1.04f,
): State<Float> {
    val reduced = rememberReducedMotion()
    if (reduced) {
        return remember { androidx.compose.runtime.mutableFloatStateOf(minScale) }
    }
    val transition = rememberInfiniteTransition(label = "puentePulse")
    return transition.animateFloat(
        initialValue = minScale,
        targetValue = maxScale,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis / 2, easing = PuenteEasing.Standard),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "puentePulseScale",
    )
}

/**
 * Rotación lenta continua (grados) para el interior del orbe.
 * Con movimiento reducido devuelve 0f de forma estática.
 */
@Composable
fun rememberSlowRotation(durationMillis: Int): State<Float> {
    val reduced = rememberReducedMotion()
    if (reduced) {
        return remember { androidx.compose.runtime.mutableFloatStateOf(0f) }
    }
    val transition = rememberInfiniteTransition(label = "puenteRotation")
    return transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = androidx.compose.animation.core.LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "puenteRotationDegrees",
    )
}
