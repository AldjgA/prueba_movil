package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.TrendDirection
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.WarningAmber

/**
 * Distintivo compacto de señal.
 *
 * Variantes alineadas con el MVP web (`.signal-rising`, `.signal-moderate`,
 * `.signal-stable`, `.signal-new`): fondo del color al 10%, texto del color y
 * borde al 20%.
 *
 * Nunca comunica solo por color: el texto de la etiqueta + la flecha de tendencia
 * aportan el significado. El lector de pantalla recibe una descripción completa.
 */
@Composable
fun SignalChip(
    label: String,
    modifier: Modifier = Modifier,
    accentColor: Color = PuenteTheme.colors.indigo,
    trend: TrendDirection? = null,
    selected: Boolean = false,
    onClick: (() -> Unit)? = null,
    minTouchTarget: Boolean = true,
) {
    val colors = PuenteTheme.colors
    val textColor = if (selected) Color.White else accentColor
    val containerColor = if (selected) accentColor else accentColor.copy(alpha = 0.10f)
    val borderColor = if (selected) accentColor else accentColor.copy(alpha = 0.20f)

    val trendText = trend?.let { " ${it.arrow} ${it.label}" } ?: ""
    val accessibilityLabel = "$label$trendText"

    val clickModifier = if (onClick != null) {
        Modifier.clickable(role = Role.Button, onClick = onClick)
    } else {
        Modifier
    }

    Row(
        modifier = modifier
            // Accesibilidad: cuando el chip es interactivo exigimos el mínimo táctil
            // de 48dp. `minTouchTarget = false` se reserva para chips de solo
            // lectura (p. ej. dentro de EvidenceCard), donde un chip compacto es válido.
            .then(
                if (minTouchTarget) {
                    Modifier.defaultMinSize(minHeight = PuenteTheme.spacing.minTouchTarget)
                } else {
                    Modifier
                },
            )
            .clip(RoundedCornerShape(colors.let { PuenteTheme.radius.pill }))
            .background(containerColor)
            .border(1.dp, borderColor, RoundedCornerShape(PuenteTheme.radius.pill))
            .then(clickModifier)
            .semantics(mergeDescendants = true) { contentDescription = accessibilityLabel }
            .padding(horizontal = PuenteTheme.spacing.sm, vertical = PuenteTheme.spacing.xs),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xxs),
    ) {
        Text(
            text = label,
            style = PuenteTheme.typography.MonoLabel,
            color = textColor,
            fontWeight = FontWeight.Medium,
        )
        if (trend != null) {
            Text(
                text = "${trend.arrow} ${trend.label}",
                style = PuenteTheme.typography.MonoLabel,
                color = textColor,
            )
        }
    }
}

/**
 * Distintivo de color sólido para indicadores de prioridad preliminar.
 * SIEMPRE acompaña a texto e icono; nunca se usa aislado.
 */
@Composable
fun AttentionDot(
    level: AttentionLevel,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
) {
    val color = PuenteTheme.colors.attentionColor(level)
    Box(
        modifier = modifier
            .size(10.dp)
            .clip(CircleShape)
            .background(color)
            .then(
                if (contentDescription != null) {
                    Modifier.semantics { this.contentDescription = contentDescription }
                } else {
                    Modifier
                },
            ),
    )
}

/**
 * Icono canónico asociado a cada nivel de prioridad.
 *
 * Verde → check; amarillo → atención; rojo → alerta.
 * El icono es obligatorio junto al color (guardrail #4), y su descripción se
 * anuncia con el resto del contenido de la tarjeta.
 */
fun attentionIcon(level: AttentionLevel): ImageVector = when (level) {
    AttentionLevel.GREEN -> Icons.Filled.CheckCircle
    AttentionLevel.YELLOW -> Icons.Filled.WarningAmber
    AttentionLevel.RED -> Icons.Filled.ErrorOutline
}

/**
 * Descripción textual completa del nivel, para lectores de pantalla y para
 * cualquier superficie que no pueda depender del color.
 */
fun attentionAccessibilityLabel(level: AttentionLevel): String = when (level) {
    AttentionLevel.GREEN -> "Prioridad preliminar de revisión: verde. Se puede trabajar paso a paso."
    AttentionLevel.YELLOW -> "Prioridad preliminar de revisión: amarilla. Conviene involucrar a alguien de confianza."
    AttentionLevel.RED -> "Prioridad preliminar de revisión: roja. Requiere apoyo humano prioritario."
}

/** Icono informativo reutilizable (el "¿por qué Puente te muestra esto?"). */
@Composable
fun InfoBadge(
    modifier: Modifier = Modifier,
    tint: Color = PuenteTheme.colors.indigo,
    contentDescription: String? = null,
) {
    Box(
        modifier = modifier
            .size(32.dp)
            .clip(RoundedCornerShape(PuenteTheme.radius.sm))
            .background(PuenteTheme.colors.surface1),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = Icons.Filled.Info,
            contentDescription = contentDescription,
            tint = tint,
            modifier = Modifier.size(16.dp),
        )
    }
}

@Preview(name = "Señales y distintivos", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun SignalChipPreview() {
    PuenteTheme {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                SignalChip(label = "Bullying", accentColor = PuenteTheme.colors.coral)
                SignalChip(
                    label = "Frecuencia",
                    accentColor = PuenteTheme.colors.yellow,
                    trend = TrendDirection.RISING,
                )
                SignalChip(label = "Nuevo", accentColor = PuenteTheme.colors.indigo, selected = true)
            }
            androidx.compose.foundation.layout.Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                AttentionLevel.entries.forEach { level ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        AttentionDot(level = level)
                        Text(
                            text = when (level) {
                                AttentionLevel.GREEN -> "Verde"
                                AttentionLevel.YELLOW -> "Amarilla"
                                AttentionLevel.RED -> "Roja"
                            },
                            style = PuenteTheme.typography.MonoLabel,
                            color = PuenteTheme.colors.attentionInk(level),
                        )
                        Icon(
                            imageVector = attentionIcon(level),
                            contentDescription = null,
                            tint = PuenteTheme.colors.attentionColor(level),
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }
            }
        }
    }
}
