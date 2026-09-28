package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Tarjeta de resumen: lo que el joven va a compartir (o está revisando).
 *
 * Se usa en `SummaryReview` y en el reporte personal. Su contrato visual es el de
 * una "hoja de decisión": cada elemento incluido se ve como una fila con icono de
 * incluido/excluido, de modo que quede inequívoco qué sale del dispositivo.
 *
 * @param title título del resumen (Fraunces).
 * @param items elementos incluidos/excluidos.
 * @param footnote aclaración obligatoria sobre qué NO se comparte.
 */
@Composable
fun SummaryCard(
    title: String,
    items: List<SummaryItem>,
    modifier: Modifier = Modifier,
    label: String = "Resumen",
    footnote: String? = null,
    onDarkSurface: Boolean = false,
) {
    val colors = PuenteTheme.colors
    val shape = RoundedCornerShape(PuenteTheme.radius.xl)

    val containerColor = if (onDarkSurface) colors.darkSurfaceBg else colors.surface0
    val borderColor = if (onDarkSurface) Color.White.copy(alpha = 0.08f) else colors.surface2
    val titleColor = if (onDarkSurface) colors.darkSurfaceText else colors.ink1
    val labelColor = if (onDarkSurface) colors.darkSurfaceMuted else colors.ink4

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(containerColor)
            .border(1.dp, borderColor, shape),
    ) {
        if (onDarkSurface) {
            // Forma orgánica sutil sobre superficie oscura (MVP: blob a 10%).
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(120.dp)
                    .clip(PuenteShapes.Blob2)
                    .background(colors.teal.copy(alpha = 0.10f)),
            )
        }

        Column(modifier = Modifier.padding(PuenteTheme.spacing.lg)) {
            Text(
                text = label.uppercase(),
                style = PuenteTheme.typography.MonoLabel,
                color = labelColor,
            )
            Spacer(Modifier.height(PuenteTheme.spacing.xs))
            Text(
                text = title,
                style = androidx.compose.material3.MaterialTheme.typography.titleLarge,
                color = titleColor,
                modifier = Modifier.semantics { heading() },
            )

            Spacer(Modifier.height(PuenteTheme.spacing.md))

            Column(verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xs)) {
                items.forEach { item -> SummaryRow(item = item, onDarkSurface = onDarkSurface) }
            }

            if (footnote != null) {
                Spacer(Modifier.height(PuenteTheme.spacing.md))
                Text(
                    text = footnote,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    color = if (onDarkSurface) colors.darkSurfaceMuted else colors.ink4,
                )
            }
        }
    }
}

/** Elemento del resumen. */
data class SummaryItem(
    val key: String,
    val label: String,
    val included: Boolean,
    val detail: String? = null,
)

@Composable
private fun SummaryRow(
    item: SummaryItem,
    onDarkSurface: Boolean,
) {
    val colors = PuenteTheme.colors
    val accent = if (item.included) colors.teal else colors.ink4
    val textColor = if (onDarkSurface) colors.darkSurfaceText else colors.ink2

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(PuenteTheme.radius.sm))
            .background(
                if (onDarkSurface) Color.White.copy(alpha = 0.03f) else colors.surface1,
            )
            .padding(PuenteTheme.spacing.sm)
            .semantics(mergeDescendants = true) {
                contentDescription = buildString {
                    append(item.label)
                    append(if (item.included) ": incluido en el resumen" else ": no incluido")
                    item.detail?.let { append(". $it") }
                }
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.sm),
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(RoundedCornerShape(PuenteTheme.radius.xs))
                .background(accent.copy(alpha = 0.14f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (item.included) Icons.Filled.Check else Icons.Filled.Close,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(13.dp),
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.label,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = textColor,
            )
            if (item.detail != null) {
                Text(
                    text = item.detail,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    color = if (onDarkSurface) colors.darkSurfaceMuted else colors.ink4,
                )
            }
        }
    }
}

/**
 * Tarjeta de recurso/herramienta breve del Home
 * (MVP: "RECURSOS PARA HOY" con emoji + nombre + duración).
 *
 * @param emoji pictograma; se marca como decorativo porque [label] ya es la
 *   información accesible.
 */
@Composable
fun ResourceCard(
    label: String,
    duration: String,
    emoji: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    accentColor: Color = PuenteTheme.colors.indigo,
) {
    val colors = PuenteTheme.colors
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(PuenteTheme.radius.md))
            .background(colors.surface0)
            .border(1.dp, colors.surface2, RoundedCornerShape(PuenteTheme.radius.md))
            .clickable(role = Role.Button, onClick = onClick)
            .semantics(mergeDescendants = true) {
                contentDescription = "$label, $duration"
            }
            .padding(PuenteTheme.spacing.md),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.sm),
    ) {
        Text(text = emoji, style = androidx.compose.material3.MaterialTheme.typography.titleLarge)
        Column {
            Text(
                text = label,
                style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
                color = colors.ink1,
                fontWeight = FontWeight.Medium,
            )
            Text(
                text = duration,
                style = PuenteTheme.typography.MonoLabel,
                color = accentColor,
            )
        }
    }
}

/** Interruptor accesible reutilizable para consentimiento y ajustes de privacidad. */
@Composable
fun PuenteSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    supportingText: String? = null,
    enabled: Boolean = true,
) {
    val colors = PuenteTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = false) {
                contentDescription = buildString {
                    append(label)
                    append(if (checked) ", activado" else ", desactivado")
                    supportingText?.let { append(". $it") }
                }
            },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.md),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = if (enabled) colors.ink1 else colors.ink4,
            )
            if (supportingText != null) {
                Spacer(Modifier.height(PuenteTheme.spacing.xxs))
                Text(
                    text = supportingText,
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    color = colors.ink3,
                )
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            enabled = enabled,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = colors.indigo,
                checkedBorderColor = colors.indigo,
                uncheckedThumbColor = colors.ink4,
                uncheckedTrackColor = colors.surface2,
                uncheckedBorderColor = colors.surface2,
            ),
        )
    }
}

@Preview(name = "SummaryCard", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun SummaryCardPreview() {
    PuenteTheme {
        SummaryCard(
            title = "Lo que compartirás con el equipo de apoyo.",
            items = listOf(
                SummaryItem("s1", "Señales de las últimas semanas", included = true),
                SummaryItem("s2", "Prioridad preliminar de revisión", included = true),
                SummaryItem("s3", "Herramientas que probaste", included = true),
                SummaryItem("s4", "Tu conversación completa", included = false, detail = "Nunca se comparte"),
            ),
            footnote = "Puedes cambiar esto antes de autorizar. Tu conversación privada no se envía.",
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Preview(name = "SummaryCard oscura", showBackground = true, backgroundColor = 0xFF111827)
@Composable
private fun SummaryCardDarkPreview() {
    PuenteTheme {
        SummaryCard(
            title = "Ver lo que ha ido cambiando.",
            label = "Mi recorrido",
            items = listOf(
                SummaryItem("j1", "Contaste algo por primera vez", included = true),
                SummaryItem("j2", "Probaste una herramienta", included = true),
            ),
            onDarkSurface = true,
            modifier = Modifier.padding(16.dp),
        )
    }
}
