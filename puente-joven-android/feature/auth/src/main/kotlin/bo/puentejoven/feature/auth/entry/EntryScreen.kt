package bo.puentejoven.feature.auth.entry

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.PuenteOrb
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Pantalla de entrada de Puente Joven.
 *
 * Adapta la intención de `EntryScreen.tsx` a teléfono Android:
 * formas orgánicas ambientales, orbe, sello "sistema activo", titular editorial
 * Fraunces y una única tarjeta de acceso.
 *
 * GUARDRAIL #6: existe **solo** el acceso joven. No hay tarjeta, enlace, botón ni
 * texto que mencione o permita llegar a un panel profesional.
 *
 * @param onEnter callback al pulsar "Entrar a Puente Joven".
 */
@Composable
fun EntryScreen(
    onEnter: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg),
    ) {
        // --- Formas ambientales (blob-1 arriba-derecha, blob-2 abajo-izquierda) ---
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 160.dp, y = (-140).dp)
                .size(300.dp)
                .clip(PuenteShapes.Blob1)
                .background(colors.ambientBrush)
                .alpha(0.07f),
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .offset(x = (-120).dp, y = 130.dp)
                .size(220.dp)
                .clip(PuenteShapes.Blob2)
                .background(colors.teal)
                .alpha(0.05f),
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = spacing.screenHorizontalWide),
        ) {
            Spacer(Modifier.height(spacing.xxl))

            // --- Cabecera de marca ---
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(spacing.sm),
            ) {
                PuenteOrb(size = 32.dp)
                Text(
                    text = "Puente",
                    style = androidx.compose.material3.MaterialTheme.typography.headlineSmall,
                    color = colors.ink1,
                )
            }

            Spacer(Modifier.height(spacing.xxl))

            // --- Sello "Sistema activo" ---
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(colors.surface0)
                    .padding(horizontal = spacing.md, vertical = spacing.xs),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(spacing.xs),
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(colors.green),
                )
                Text(
                    text = "Sistema activo",
                    style = PuenteTheme.typography.MonoLabel,
                    color = colors.ink3,
                )
            }

            Spacer(Modifier.height(spacing.lg))

            // --- Titular editorial ---
            Text(
                text = "Un espacio para",
                style = androidx.compose.material3.MaterialTheme.typography.displaySmall,
                color = colors.ink1,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                text = "entender lo que",
                style = androidx.compose.material3.MaterialTheme.typography.displaySmall,
                color = colors.indigo,
            )
            Text(
                text = "está pasando.",
                style = androidx.compose.material3.MaterialTheme.typography.displaySmall,
                color = colors.ink1,
            )

            Spacer(Modifier.height(spacing.md))

            Text(
                text = "Y encontrar el siguiente paso.",
                style = androidx.compose.material3.MaterialTheme.typography.bodyLarge,
                color = colors.ink3,
            )

            Spacer(Modifier.height(spacing.xxl))

            // --- Tarjeta única de acceso (Puente Joven) ---
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(androidx.compose.foundation.shape.RoundedCornerShape(PuenteTheme.radius.xl))
                    .background(colors.surface0)
                    .padding(spacing.xl),
            ) {
                Row(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(androidx.compose.foundation.shape.RoundedCornerShape(PuenteTheme.radius.sm))
                        .background(colors.indigo.copy(alpha = 0.10f)),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    PuenteOrb(size = 24.dp)
                }

                Spacer(Modifier.height(spacing.md))

                Text(
                    text = "PUENTE JOVEN",
                    style = PuenteTheme.typography.MonoLabel,
                    color = colors.ink4,
                )
                Spacer(Modifier.height(spacing.xxs))
                Text(
                    text = "Recibir apoyo o acompañar a alguien.",
                    style = androidx.compose.material3.MaterialTheme.typography.titleLarge,
                    color = colors.ink1,
                )
                Spacer(Modifier.height(spacing.xs))
                Text(
                    text = "Un espacio privado para entender lo que te pasa y decidir el siguiente paso.",
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    color = colors.ink4,
                )

                Spacer(Modifier.height(spacing.lg))

                PrimaryAction(
                    text = "Entrar a Puente Joven",
                    onClick = onEnter,
                )
            }

            Spacer(Modifier.height(spacing.xl))

            // --- Privacidad ---
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(colors.teal),
                )
                Spacer(Modifier.size(spacing.xs))
                Text(
                    text = "Privado por diseño",
                    style = PuenteTheme.typography.MonoLabel,
                    color = colors.ink4,
                )
            }

            Spacer(Modifier.height(spacing.md))

            Text(
                text = "Puente no diagnostica · No reemplaza a profesionales",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(spacing.xxl))
        }
    }
}

@Preview(name = "Entry — compacto", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 800)
@Composable
private fun EntryScreenPreview() {
    PuenteTheme {
        EntryScreen(onEnter = {})
    }
}
