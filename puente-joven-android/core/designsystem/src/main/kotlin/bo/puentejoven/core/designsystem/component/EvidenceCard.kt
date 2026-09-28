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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.SignalEvidence
import bo.puentejoven.core.model.SignalEvidenceId
import bo.puentejoven.core.model.SignalKey

/**
 * Tarjeta de evidencia de una señal.
 *
 * Reproduce la entrada de la línea temporal de `SignalsScreen` del MVP web:
 * nodo numerado sobre el conector, fecha en mono, etiqueta, la frase textual
 * del joven entre comillas, y los distintivos de contexto.
 *
 * Importante (privacidad): [SignalEvidence.description] contiene la frase que el
 * joven escribió. Se muestra porque es SU evidencia y puede verla; no se comparte
 * con nadie sin consentimiento explícito.
 *
 * @param index posición en la línea temporal (1-based) para el nodo numerado.
 * @param showConnector dibuja el conector vertical del recorrido.
 * @param accentColor color de la señal a la que pertenece la evidencia.
 */
@Composable
fun EvidenceCard(
    evidence: SignalEvidence,
    modifier: Modifier = Modifier,
    index: Int = 1,
    accentColor: Color = PuenteTheme.colors.indigo,
    showConnector: Boolean = true,
    onClick: (() -> Unit)? = null,
) {
    val colors = PuenteTheme.colors

    Row(modifier = modifier) {
        if (showConnector) {
            TimelineNode(
                index = index,
                accentColor = accentColor,
                drawTopLine = index > 1,
                drawBottomLine = true,
            )
            Spacer(Modifier.width(PuenteTheme.spacing.md))
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(PuenteTheme.radius.md))
                .background(colors.surface0)
                .border(
                    1.dp,
                    colors.surface2,
                    RoundedCornerShape(PuenteTheme.radius.md),
                )
                .then(
                    if (onClick != null) {
                        Modifier.semantics { contentDescription = evidence.label }
                    } else {
                        Modifier
                    },
                )
                .padding(PuenteTheme.spacing.md),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = evidence.dateLabel.uppercase(),
                    style = PuenteTheme.typography.MonoLabel,
                    color = accentColor,
                )
                IntensityMeter(
                    intensity = evidence.intensity,
                    accentColor = accentColor,
                )
            }

            Spacer(Modifier.height(PuenteTheme.spacing.xs))

            Text(
                text = evidence.label,
                style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
                color = colors.ink1,
                fontWeight = FontWeight.Medium,
            )

            Spacer(Modifier.height(PuenteTheme.spacing.xxs))

            Text(
                text = "«${evidence.description}»",
                style = PuenteTheme.typography.Quote,
                color = colors.ink3,
            )

            if (evidence.tags.isNotEmpty()) {
                Spacer(Modifier.height(PuenteTheme.spacing.xs))
                Row(horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xxs)) {
                    evidence.tags.forEach { tag ->
                        SignalChip(
                            label = tag,
                            accentColor = accentColor,
                            minTouchTarget = false,
                        )
                    }
                }
            }
        }
    }
}

/**
 * Nodo numerado con conector vertical, sobre el gradiente índigo del recorrido
 * (MVP `.timeline-connector`).
 */
@Composable
private fun TimelineNode(
    index: Int,
    accentColor: Color,
    drawTopLine: Boolean,
    drawBottomLine: Boolean,
) {
    val colors = PuenteTheme.colors
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(PuenteTheme.spacing.xl),
    ) {
        if (drawTopLine) {
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .height(PuenteTheme.spacing.xs)
                    .background(colors.indigo.copy(alpha = 0.3f)),
            )
        } else {
            Spacer(Modifier.height(PuenteTheme.spacing.xs))
        }

        Box(
            modifier = Modifier
                .size(PuenteTheme.spacing.xxl)
                .clip(CircleShape)
                .background(accentColor.copy(alpha = 0.12f))
                .border(2.dp, accentColor, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = index.toString(),
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink1,
                fontWeight = FontWeight.Medium,
            )
        }

        if (drawBottomLine) {
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .height(PuenteTheme.spacing.xs)
                    .background(colors.indigo.copy(alpha = 0.3f)),
            )
        }
    }
}

/**
 * Medidor de intensidad 1..4 como cuadros sólidos.
 *
 * Importante: la intensidad indica proximidad a una señal prioritaria de revisión,
 * NO gravedad clínica. No se comunica al lector de pantalla como valor numérico
 * aislado para evitar interpretaciones diagnósticas.
 */
@Composable
fun IntensityMeter(
    intensity: Int,
    accentColor: Color = PuenteTheme.colors.indigo,
    modifier: Modifier = Modifier,
    steps: Int = 4,
    contentDescription: String? = null,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(steps) { position ->
            Box(
                modifier = Modifier
                    .size(width = 5.dp, height = 5.dp)
                    .clip(RoundedCornerShape(1.dp))
                    .background(
                        if (position < intensity) accentColor
                        else PuenteTheme.colors.surface2,
                    ),
            )
        }
    }
}

@Preview(name = "EvidenceCard", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun EvidenceCardPreview() {
    PuenteTheme {
        EvidenceCard(
            evidence = SignalEvidence(
                id = SignalEvidenceId("ev-1"),
                signalKey = SignalKey("frequency"),
                label = "Empieza a evitar el recreo",
                description = "Prefiero quedarme en el aula.",
                dateLabel = "09 SEP",
                intensity = 3,
                tags = listOf("Aislamiento ↑", "Cambio conductual"),
            ),
            index = 3,
            accentColor = PuenteTheme.colors.indigo,
            modifier = Modifier.padding(16.dp),
        )
    }
}
