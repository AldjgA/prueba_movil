package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Encabezado editorial: etiqueta monoespaciada en mayúsculas + titular Fraunces
 * con parte del texto resaltada en índigo.
 *
 * Replica la jerarquía de `EntryScreen` / `HomeJoven`:
 * ```
 * PUENTE SIGNALS                     <- label DM Mono, tracking-widest, ink-4
 * Hay algo que                       <- Fraunces light
 * cambió.                            <- Fraunces medium en índigo/mint
 * ```
 *
 * @param label etiqueta superior en mayúsculas (se aplica `uppercase()`).
 * @param titleLines líneas del titular. La última puede resaltarse con [accentLastLine].
 * @param accentLastLine si `true`, la última línea se pinta con [accentColor] y peso medio.
 * @param accentColor color del énfasis; por defecto el índigo de la marca.
 * @param trailing contenido opcional a la derecha (p. ej. el orbe).
 */
@Composable
fun EditorialHeader(
    label: String,
    titleLines: List<String>,
    modifier: Modifier = Modifier,
    accentLastLine: Boolean = true,
    accentColor: androidx.compose.ui.graphics.Color = PuenteTheme.colors.indigo,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = PuenteTheme.colors
    val typography = PuenteTheme.typography

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label.uppercase(),
                style = typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(PuenteTheme.spacing.xs))

            val title = buildTitleAnnotated(
                lines = titleLines,
                accentLastLine = accentLastLine,
                accentColor = accentColor,
            )
            Text(
                text = title,
                style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                color = colors.ink1,
                modifier = Modifier.semantics { heading() },
            )
        }

        if (trailing != null) {
            Spacer(Modifier.width(PuenteTheme.spacing.md))
            trailing()
        }
    }
}

/** Encabezado con un solo titular y un subtítulo de apoyo. */
@Composable
fun EditorialHeaderWithSubtitle(
    label: String,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    accentWord: String? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val colors = PuenteTheme.colors
    val typography = PuenteTheme.typography

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label.uppercase(),
                style = typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(PuenteTheme.spacing.xs))

            Text(
                text = buildAnnotatedString {
                    if (accentWord != null && title.contains(accentWord)) {
                        val parts = title.split(accentWord, limit = 2)
                        append(parts[0])
                        withStyle(SpanStyle(color = colors.indigo, fontWeight = FontWeight.Medium)) {
                            append(accentWord)
                        }
                        if (parts.size > 1) append(parts[1])
                    } else {
                        append(title)
                    }
                },
                style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                color = colors.ink1,
                modifier = Modifier.semantics { heading() },
            )
            Spacer(Modifier.height(PuenteTheme.spacing.xs))
            Text(
                text = subtitle,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = colors.ink3,
            )
        }

        if (trailing != null) {
            Spacer(Modifier.width(PuenteTheme.spacing.md))
            trailing()
        }
    }
}

/** Construye el titular multilínea resaltando (o no) la última línea. */
private fun buildTitleAnnotated(
    lines: List<String>,
    accentLastLine: Boolean,
    accentColor: androidx.compose.ui.graphics.Color,
): AnnotatedString = buildAnnotatedString {
    lines.forEachIndexed { index, line ->
        val isLast = index == lines.lastIndex
        if (accentLastLine && isLast) {
            withStyle(SpanStyle(color = accentColor, fontWeight = FontWeight.Medium)) {
                append(line)
            }
        } else {
            append(line)
        }
        if (!isLast) append("\n")
    }
}

@Preview(name = "EditorialHeader", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun EditorialHeaderPreview() {
    PuenteTheme {
        EditorialHeader(
            label = "Puente Signals",
            titleLines = listOf("Hay algo que", "cambió."),
            accentColor = PuentePalettePreviewMint,
            modifier = Modifier.padding(20.dp),
        )
    }
}

private val PuentePalettePreviewMint = androidx.compose.ui.graphics.Color(0xFF5EEAD4)
