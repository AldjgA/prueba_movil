package bo.puentejoven.core.designsystem.component

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Estados posibles de un botón de acción.
 * `Loading` deshabilita la interacción y anuncia el estado a lectores de pantalla.
 */
enum class PuenteButtonState { Enabled, Disabled, Loading }

/**
 * Acción principal.
 *
 * Dos variantes visuales fieles al MVP web:
 * - sobre superficie clara: relleno con gradiente índigo → índigo-deep
 *   (`linear-gradient(135deg, #5B5CF0, #4338CA)`)
 * - sobre superficie oscura/hero: relleno blanco con texto índigo
 *   (el botón "Contarlo" del módulo principal del Home)
 *
 * Accesibilidad: altura mínima 48dp, semántica de botón, `disabled()` cuando no
 * está habilitado y `contentDescription` mientras carga.
 */
@Composable
fun PrimaryAction(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    state: PuenteButtonState = PuenteButtonState.Enabled,
    onDarkSurface: Boolean = false,
    fullWidth: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
    loadingDescription: String = "Cargando",
    shape: Shape = RoundedCornerShape(PuenteTheme.radius.md),
) {
    val colors = PuenteTheme.colors
    val enabled = state == PuenteButtonState.Enabled
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed && enabled) 0.98f else 1f,
        animationSpec = androidx.compose.animation.core.tween(
            durationMillis = PuenteTheme.motion.instant,
        ),
        label = "primaryActionScale",
    )

    val containerModifier = Modifier
        .then(if (fullWidth) Modifier.fillMaxWidthCompat() else Modifier)
        .defaultMinSize(minHeight = PuenteTheme.spacing.minTouchTarget)
        .scale(scale)
        .clip(shape)
        .then(
            if (onDarkSurface) {
                Modifier.background(Color.White)
            } else {
                Modifier.background(colors.primaryActionBrush)
            },
        )
        .clickable(
            enabled = enabled,
            interactionSource = interactionSource,
            indication = null,
            role = Role.Button,
            onClick = onClick,
        )
        .semantics {
            role = Role.Button
            if (state == PuenteButtonState.Loading) contentDescription = loadingDescription
            if (!enabled) disabled()
        }
        .padding(horizontal = PuenteTheme.spacing.lg, vertical = PuenteTheme.spacing.sm)

    Box(
        modifier = modifier.then(containerModifier),
        contentAlignment = Alignment.Center,
    ) {
        if (state == PuenteButtonState.Loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = if (onDarkSurface) colors.indigo else Color.White,
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xs),
            ) {
                leadingIcon?.invoke()
                Text(
                    text = text,
                    style = androidx.compose.material3.MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = if (onDarkSurface) colors.indigo else Color.White,
                )
            }
        }
    }
}

/**
 * Acción secundaria.
 *
 * Variantes fieles al MVP:
 * - sobre claro: borde índigo suave + texto índigo (`border-2 border-[#5B5CF0]/20`)
 * - sobre oscuro: borde blanco translúcido + texto muted (`border-white/10`)
 */
@Composable
fun SecondaryAction(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    state: PuenteButtonState = PuenteButtonState.Enabled,
    onDarkSurface: Boolean = false,
    fullWidth: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
) {
    val colors = PuenteTheme.colors
    val enabled = state == PuenteButtonState.Enabled
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed && enabled) 0.98f else 1f,
        animationSpec = androidx.compose.animation.core.tween(PuenteTheme.motion.instant),
        label = "secondaryActionScale",
    )

    val border = if (onDarkSurface) {
        BorderStroke(1.dp, Color.White.copy(alpha = 0.10f))
    } else {
        BorderStroke(1.5.dp, colors.indigo.copy(alpha = 0.20f))
    }
    val contentColor = when {
        !enabled -> if (onDarkSurface) colors.deepMuted else colors.ink4
        onDarkSurface -> colors.deepMuted
        else -> colors.indigo
    }

    Box(
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidthCompat() else Modifier)
            .defaultMinSize(minHeight = PuenteTheme.spacing.minTouchTarget)
            .scale(scale)
            .clip(RoundedCornerShape(PuenteTheme.radius.md))
            .border(border, RoundedCornerShape(PuenteTheme.radius.md))
            .clickable(
                enabled = enabled,
                interactionSource = interactionSource,
                indication = null,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics {
                role = Role.Button
                if (!enabled) disabled()
            }
            .alpha(if (state == PuenteButtonState.Loading) 0.6f else 1f)
            .padding(horizontal = PuenteTheme.spacing.lg, vertical = PuenteTheme.spacing.sm),
        contentAlignment = Alignment.Center,
    ) {
        if (state == PuenteButtonState.Loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(18.dp),
                strokeWidth = 2.dp,
                color = contentColor,
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xs),
            ) {
                leadingIcon?.invoke()
                Text(
                    text = text,
                    style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
                    color = contentColor,
                )
            }
        }
    }
}

/**
 * Acción terciaria: solo texto, para enlaces discretos
 * (MVP: "Ver reporte personal", "Ver moodboard").
 */
@Composable
fun TertiaryAction(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onDarkSurface: Boolean = false,
) {
    val colors = PuenteTheme.colors
    Box(
        modifier = modifier
            .defaultMinSize(minHeight = PuenteTheme.spacing.minTouchTarget)
            .clip(RoundedCornerShape(PuenteTheme.radius.sm))
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics {
                role = Role.Button
                if (!enabled) disabled()
            }
            .padding(horizontal = PuenteTheme.spacing.sm, vertical = PuenteTheme.spacing.xs),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            color = when {
                !enabled -> colors.ink4
                onDarkSurface -> colors.deepMuted
                else -> colors.ink3
            },
        )
    }
}

/** `fillMaxWidth` como extensión de Modifier, para componer con `Modifier.then`. */
private fun Modifier.fillMaxWidthCompat(): Modifier = this.fillMaxWidth()

@Preview(name = "Acciones", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun ActionsPreview() {
    PuenteTheme {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            PrimaryAction(text = "Ver herramienta recomendada →", onClick = {})
            PrimaryAction(text = "Cargando…", onClick = {}, state = PuenteButtonState.Loading)
            PrimaryAction(text = "Deshabilitado", onClick = {}, state = PuenteButtonState.Disabled)
            SecondaryAction(text = "Preparar solicitud de apoyo", onClick = {})
            TertiaryAction(text = "Ver reporte personal", onClick = {})
        }
    }
}
