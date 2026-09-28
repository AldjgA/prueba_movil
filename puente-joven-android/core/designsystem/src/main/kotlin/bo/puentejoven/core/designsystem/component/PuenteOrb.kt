package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.motion.rememberPulse
import bo.puentejoven.core.designsystem.motion.rememberReducedMotion
import bo.puentejoven.core.designsystem.motion.rememberSlowRotation
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuentePalette
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * El orbe de Puente Joven: la firma visual de la marca.
 *
 * Reproduce `PuenteOrb.tsx` del MVP web:
 * 1. Halo exterior: gradiente radial lavanda → índigo → teal, opacidad 30%,
 *    desenfocado (`filter: blur(size*0.15)`) y escalado 1.2x.
 * 2. Orbe principal: forma `blob-1` con gradiente radial
 *    `circle at 35% 30%, #A78BFA 0%, #5B5CF0 45%, #14B8A6 100%`.
 * 3. Brillo interior: punto blanco difuminado al 22%/18% del tamaño, opacidad 50%.
 * 4. Animación: pulso de escala 1.00→1.04 (3s) + rotación lenta (8s).
 *
 * Accesibilidad:
 * - Respeta la reducción de movimiento (`ANIMATOR_DURATION_SCALE == 0`): sin pulso
 *   ni rotación, solo la forma estática.
 * - `contentDescription` describe el significado del orbe. Por defecto es `null`
 *   porque el orbe casi siempre es decorativo; pásalo cuando sea informativo.
 *
 * @param size diámetro del orbe (el MVP web usa 32-48dp).
 * @param animated `false` dibuja la forma estática (pruebas/snapshots).
 * @param contentDescription descripción para lectores de pantalla; `null` = decorativo.
 */
@Composable
fun PuenteOrb(
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    animated: Boolean = true,
    contentDescription: String? = null,
) {
    val reducedMotion = rememberReducedMotion()
    val motionEnabled = animated && !reducedMotion
    val colors = PuenteTheme.colors

    val pulseScale = if (motionEnabled) {
        rememberPulse(
            durationMillis = PuenteTheme.motion.orbPulse,
            minScale = 1f,
            maxScale = 1.04f,
        ).value
    } else {
        1f
    }

    val rotation = if (motionEnabled) {
        rememberSlowRotation(durationMillis = PuenteTheme.motion.orbInner).value
    } else {
        0f
    }

    val glowBlur = size * 0.15f
    val highlightSize = size * 0.28f

    Box(
        modifier = modifier
            .size(size)
            .then(
                if (contentDescription != null) {
                    Modifier.semantics { this.contentDescription = contentDescription }
                } else {
                    Modifier
                },
            ),
        contentAlignment = Alignment.Center,
    ) {
        // 1. Halo difuminado exterior
        // MVP: radial-gradient(circle at 40% 35%, ...) · opacity-30 · blur(size*0.15) · scale(1.2)
        Box(
            modifier = Modifier
                .size(size)
                .scale(1.2f)
                .blur(glowBlur)
                .drawBehind {
                    drawCircle(
                        brush = colors.orbGlowBrush(
                            centerX = 0.40f,
                            centerY = 0.35f,
                            // `closest-side` de un gradient circular ≈ radio = mitad
                            // del lado del contenedor del mismo tamaño que el orbe.
                            radius = size.toPx() / 2f,
                        ),
                    )
                },
        )

        // 2. Orbe principal: blob-1 + gradiente radial con foco en (35%, 30%).
        // MVP: el propio orbe lleva `animate-orb-inner` (scale+rotate 8s), así que la
        // rotación lenta se aplica aquí, no al brillo.
        Box(
            modifier = Modifier
                .size(size)
                .scale(pulseScale)
                .rotate(rotation)
                .clip(PuenteShapes.Blob1)
                .drawBehind { drawOrbCore() },
        )

        // 3. Brillo interior blanco.
        // MVP: width/height = size*0.28, top = size*0.18, left = size*0.22,
        // `opacity-50` con `radial-gradient(circle, rgba(255,255,255,0.85), transparent)`.
        // No lleva blur: la suavidad la aporta el degradado. El wrapper `opacity-50`
        // se replica con el alfa 0.425 en el color (0.85 * 0.5).
        Box(
            modifier = Modifier
                .size(highlightSize)
                .blur(size * 0.02f)
                .drawBehind {
                    drawCircle(
                        brush = Brush.radialGradient(
                            colorStops = arrayOf(
                                0.00f to Color.White.copy(alpha = 0.425f),
                                1.00f to Color.Transparent,
                            ),
                            center = Offset(this.size.width / 2f, this.size.height / 2f),
                            radius = this.size.minDimension / 2f,
                        ),
                    )
                }
                .offsetProportional(
                    topFraction = 0.18f,
                    leftFraction = 0.22f,
                    parentSize = size,
                ),
        )
    }
}

/** Gradiente radial del núcleo del orbe, fiel al `radial-gradient` del MVP web.
 *
 * MVP: `radial-gradient(circle at 35% 30%, #A78BFA 0%, #5B5CF0 45%, #14B8A6 100%)`.
 * Los paros (0%, 45%, 100%) se declaran explícitamente con `colorStops` porque
 * Compose distribuye los colores de forma uniforme si no se indican.
 */
private fun DrawScope.drawOrbCore() {
    val focus = Offset(size.width * 0.35f, size.height * 0.30f)
    // Radio de relleno: cubre la forma del blob. El degradado va de lavanda en el
    // foco a teal en el borde, igual que el `radial-gradient` del web.
    val radius = maxOf(size.width, size.height) * 0.95f
    drawCircle(
        brush = Brush.radialGradient(
            colorStops = arrayOf(
                0.00f to PuentePalette.Lavender,
                0.45f to PuentePalette.Indigo,
                1.00f to PuentePalette.Teal,
            ),
            center = focus,
            radius = radius,
        ),
        radius = radius,
        center = focus,
    )
}

/** Posiciona el hijo en una fracción del tamaño del padre. */
private fun Modifier.offsetProportional(
    topFraction: Float,
    leftFraction: Float,
    parentSize: Dp,
): Modifier = this.layout { measurable, constraints ->
    val placeable = measurable.measure(constraints)
    layout(placeable.width, placeable.height) {
        placeable.placeRelative(
            x = (parentSize * leftFraction).roundToPx(),
            y = (parentSize * topFraction).roundToPx(),
        )
    }
}

@Preview(name = "Orbe — tamaños", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun PuenteOrbPreview() {
    PuenteTheme {
        Row(
            horizontalArrangement = Arrangement.spacedBy(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(24.dp),
        ) {
            PuenteOrb(size = 32.dp, animated = false)
            PuenteOrb(size = 48.dp, animated = false)
            PuenteOrb(size = 72.dp, animated = false)
        }
    }
}
