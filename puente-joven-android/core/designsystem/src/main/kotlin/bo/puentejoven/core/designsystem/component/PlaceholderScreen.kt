package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Pantalla de destino aún no implementado.
 *
 * Existe para que el grafo de navegación completo sea recorrible desde el primer
 * día, sin inventar UI de features que pertenecen a tareas posteriores.
 * Mantiene la identidad visual: orbe, etiqueta mono, titular Fraunces.
 *
 * @param label nombre técnico del destino (útil para QA del grafo).
 * @param title título legible.
 * @param note qué se implementará aquí y en qué tarea.
 */
@Composable
fun PlaceholderScreen(
    label: String,
    title: String,
    note: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState()),
    ) {
        if (onBack != null) {
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .padding(horizontal = spacing.xs, vertical = spacing.xs)
                    .semantics { contentDescription = "Volver" },
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = null,
                    tint = colors.ink3,
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = spacing.screenHorizontalWide),
        ) {
            Spacer(Modifier.height(spacing.md))
            PuenteOrb(size = 48.dp, animated = false)
            Spacer(Modifier.height(spacing.lg))
            Text(
                text = label.uppercase(),
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))
            Text(
                text = title,
                style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                color = colors.ink1,
                modifier = Modifier.semantics { heading() },
            )
            Spacer(Modifier.height(spacing.sm))
            Text(
                text = note,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = colors.ink3,
            )
            Spacer(Modifier.height(spacing.lg))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(PuenteTheme.radius.lg))
                    .background(colors.surface1)
                    .padding(spacing.md),
            ) {
                Text(
                    text = "Sin datos reales. Este destino se completa en su tarea correspondiente.",
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    color = colors.ink4,
                )
            }
            Spacer(Modifier.height(spacing.xxl))
        }
    }

    // Marca de identidad compartida por todos los placeholders.
    Box(
        modifier = Modifier
            .fillMaxSize()
            .navigationBarsPadding(),
        contentAlignment = Alignment.BottomCenter,
    ) {
        Box(
            modifier = Modifier
                .padding(bottom = spacing.xl)
                .height(2.dp)
                .clip(PuenteShapes.Blob1)
                .background(PuenteTheme.colors.indigo.copy(alpha = 0.12f)),
        )
    }
}

@Preview(name = "Placeholder", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun PlaceholderScreenPreview() {
    PuenteTheme {
        PlaceholderScreen(
            label = "SignalsRoute",
            title = "Señales",
            note = "Señales detectadas con su evidencia. Se implementa en TASK-005.",
            onBack = {},
        )
    }
}
