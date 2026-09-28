package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AttentionLevel

/**
 * Tarjeta de prioridad preliminar de revisión.
 *
 * GUARDRAIL #4 (crítico): verde/amarillo/rojo significa **prioridad preliminar de
 * revisión**, nunca diagnóstico ni garantía de seguridad. Por eso esta tarjeta
 * SIEMPRE muestra, de forma redundante:
 *  1. el color del nivel,
 *  2. un texto explícito ("Prioridad preliminar: amarilla"),
 *  3. un icono distinto por nivel,
 *  4. una frase que recuerda que no es un diagnóstico y que ninguna prioridad
 *     sustituye a una persona.
 *
 * El bloque completo se anuncia al lector de pantalla como una unidad semántica.
 *
 * @param level nivel de prioridad preliminar.
 * @param title frase principal del nivel (Fraunces).
 * @param explanation por qué se muestra este nivel.
 * @param whatChanged qué cambió respecto a los registros previos.
 * @param nextStep qué ocurre después, en lenguaje claro.
 * @param isPreliminary debe ser `true` en el MVP: no hay validación clínica.
 */
@Composable
fun AttentionCard(
    level: AttentionLevel,
    title: String,
    explanation: String,
    whatChanged: String,
    nextStep: String? = null,
    modifier: Modifier = Modifier,
    isPreliminary: Boolean = true,
) {
    val colors = PuenteTheme.colors
    val accent = colors.attentionColor(level)
    val accentInk = colors.attentionInk(level)
    val shape = RoundedCornerShape(PuenteTheme.radius.xl)

    // Mensaje obligatorio de encuadre: aparece siempre, en los tres niveles.
    val disclaimer = if (isPreliminary) {
        "Esta es una prioridad preliminar de revisión, no un diagnóstico."
    } else {
        "Prioridad de revisión."
    }
    val humanNote = "Ninguna prioridad reemplaza a una persona."

    val fullAccessibilityLabel = buildString {
        append(attentionAccessibilityLabel(level))
        append(". ")
        append(title)
        append(". ")
        append(explanation)
        append(". Qué cambió: ")
        append(whatChanged)
        if (nextStep != null) {
            append(". Qué ocurre después: ")
            append(nextStep)
        }
        append(". ")
        append(disclaimer)
        append(" ")
        append(humanNote)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.attentionCardBrush(level))
            .border(2.dp, colors.attentionBorder(level), shape)
            .semantics(mergeDescendants = true) { contentDescription = fullAccessibilityLabel },
    ) {
        // Forma orgánica ambiental (blob-1) al 20% del color del nivel.
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(140.dp)
                .clip(PuenteShapes.Blob1)
                .background(accent.copy(alpha = 0.20f)),
        )

        Column(modifier = Modifier.padding(PuenteTheme.spacing.xl)) {
            // 1+2+3. Color + texto + icono del nivel
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xs),
                modifier = Modifier
                    .clip(RoundedCornerShape(PuenteTheme.radius.pill))
                    .background(colors.attentionBadgeContainer(level))
                    .border(
                        1.dp,
                        colors.attentionBorder(level),
                        RoundedCornerShape(PuenteTheme.radius.pill),
                    )
                    .padding(horizontal = PuenteTheme.spacing.md, vertical = PuenteTheme.spacing.xs),
            ) {
                AttentionDot(level = level)
                Icon(
                    imageVector = attentionIcon(level),
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(16.dp),
                )
                Text(
                    text = labelForLevel(level),
                    style = PuenteTheme.typography.MonoLabelLarge,
                    color = accentInk,
                    fontWeight = FontWeight.Medium,
                )
            }

            Spacer(Modifier.height(PuenteTheme.spacing.lg))

            Text(
                text = title,
                style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                color = colors.ink1,
                modifier = Modifier.semantics { heading() },
            )

            Spacer(Modifier.height(PuenteTheme.spacing.md))

            Text(
                text = explanation,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = colors.ink3,
            )

            Spacer(Modifier.height(PuenteTheme.spacing.lg))

            // Qué cambió — MVP: fondo `${color}08`, borde `${color}20`.
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(PuenteTheme.radius.md))
                    .background(colors.attentionContainer(level))
                    .border(
                        1.dp,
                        colors.attentionBorderSoft(level),
                        RoundedCornerShape(PuenteTheme.radius.md),
                    )
                    .padding(PuenteTheme.spacing.md),
            ) {
                Text(
                    text = "QUÉ CAMBIÓ",
                    style = PuenteTheme.typography.MonoLabel,
                    color = accentInk,
                )
                Spacer(Modifier.height(PuenteTheme.spacing.xxs))
                Text(
                    text = whatChanged,
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    color = colors.ink2,
                )
            }

            if (nextStep != null) {
                Spacer(Modifier.height(PuenteTheme.spacing.lg))
                Text(
                    text = "QUÉ OCURRE DESPUÉS",
                    style = PuenteTheme.typography.MonoLabel,
                    color = colors.ink4,
                )
                Spacer(Modifier.height(PuenteTheme.spacing.xs))
                Text(
                    text = nextStep,
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    color = colors.ink2,
                )
            }

            // Encuadre obligatorio: nunca solo color.
            Spacer(Modifier.height(PuenteTheme.spacing.lg))
            Text(
                text = disclaimer,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink3,
            )
            Text(
                text = humanNote,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink4,
            )
        }
    }
}

/** Etiqueta visible del nivel, con la palabra "preliminar" siempre presente. */
private fun labelForLevel(level: AttentionLevel): String = when (level) {
    AttentionLevel.GREEN -> "PRIORIDAD PRELIMINAR: VERDE"
    AttentionLevel.YELLOW -> "PRIORIDAD PRELIMINAR: AMARILLA"
    AttentionLevel.RED -> "PRIORIDAD PRELIMINAR: ROJA"
}

@Preview(name = "AttentionCard — amarilla", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun AttentionCardPreview() {
    PuenteTheme {
        AttentionCard(
            level = AttentionLevel.YELLOW,
            title = "Sería bueno involucrar a alguien.",
            explanation = "Notamos que lo que estás viviendo ha cambiado en las últimas semanas. " +
                "La frecuencia aumentó y está afectando tu día a día.",
            whatChanged = "La frecuencia aumentó y empezó a afectar tu asistencia al colegio.",
            nextStep = "Podemos ayudarte a preparar cómo pedir apoyo a alguien de confianza.",
            modifier = Modifier.padding(16.dp),
        )
    }
}
