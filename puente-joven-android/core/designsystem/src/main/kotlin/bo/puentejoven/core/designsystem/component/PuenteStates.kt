package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Estado de carga.
 *
 * Usa el orbe de la marca como indicador (en lugar de un spinner Material genérico)
 * y respeta la reducción de movimiento.
 *
 * `contentDescription` se anuncia a lectores de pantalla para que el estado no sea
 * solo visual.
 */
@Composable
fun LoadingState(
    modifier: Modifier = Modifier,
    message: String = "Preparando tu espacio…",
) {
    val colors = PuenteTheme.colors
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(PuenteTheme.spacing.xl)
            .semantics(mergeDescendants = true) { contentDescription = message },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        PuenteOrb(size = 72.dp)
        androidx.compose.foundation.layout.Spacer(
            Modifier.height(PuenteTheme.spacing.lg),
        )
        Text(
            text = message,
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            color = colors.ink3,
            textAlign = TextAlign.Center,
        )
    }
}

/**
 * Estado de error.
 *
 * Regla: nunca mostrar jerga técnica ni datos sensibles. El mensaje describe qué
 * pasó en lenguaje claro; la acción ofrece una salida.
 */
@Composable
fun ErrorState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    retryLabel: String = "Reintentar",
    onRetry: (() -> Unit)? = null,
) {
    val colors = PuenteTheme.colors
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(PuenteTheme.spacing.xl)
            .semantics(mergeDescendants = true) {
                contentDescription = "$title. $message"
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.md),
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(PuenteTheme.radius.lg))
                .background(colors.surface1)
                .padding(PuenteTheme.spacing.md),
        ) {
            Text(
                text = "!",
                style = androidx.compose.material3.MaterialTheme.typography.titleLarge,
                color = colors.yellowInk,
            )
        }
        Text(
            text = title,
            style = androidx.compose.material3.MaterialTheme.typography.titleMedium,
            color = colors.ink1,
            textAlign = TextAlign.Center,
            modifier = Modifier.semantics { heading() },
        )
        Text(
            text = message,
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            color = colors.ink3,
            textAlign = TextAlign.Center,
        )
        if (onRetry != null) {
            PrimaryAction(
                text = retryLabel,
                onClick = onRetry,
                fullWidth = false,
            )
        }
    }
}

/**
 * Estado vacío.
 *
 * Tono editorial y cálido, nunca "sin resultados" frío: en Puente Joven un vacío
 * suele significar "todavía no hay nada registrado", no un fallo.
 */
@Composable
fun EmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    val colors = PuenteTheme.colors
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(PuenteTheme.spacing.xl)
            .semantics(mergeDescendants = true) {
                contentDescription = "$title. $message"
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.md),
    ) {
        PuenteOrb(size = 56.dp)
        Text(
            text = title,
            style = androidx.compose.material3.MaterialTheme.typography.titleLarge,
            color = colors.ink1,
            textAlign = TextAlign.Center,
            modifier = Modifier.semantics { heading() },
        )
        Text(
            text = message,
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            color = colors.ink3,
            textAlign = TextAlign.Center,
        )
        if (actionLabel != null && onAction != null) {
            SecondaryAction(
                text = actionLabel,
                onClick = onAction,
                fullWidth = false,
            )
        }
    }
}

/** Indicador de carga lineal corto, para refrescos parciales dentro de una pantalla. */
@Composable
fun InlineLoading(
    modifier: Modifier = Modifier,
    contentDescription: String = "Actualizando",
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(
            modifier = Modifier.height(20.dp),
            strokeWidth = 2.dp,
            color = PuenteTheme.colors.indigo,
        )
    }
}

@Preview(name = "Estados", showBackground = true, backgroundColor = 0xFFF7F8FC, heightDp = 900)
@Composable
private fun StatesPreview() {
    PuenteTheme {
        Column(modifier = Modifier.padding(16.dp)) {
            LoadingState()
            ErrorState(
                title = "No pudimos abrir esto ahora.",
                message = "Puedes intentarlo otra vez. Nada de lo que escribiste se perdió.",
                onRetry = {},
            )
            EmptyState(
                title = "Todavía no hay nada registrado.",
                message = "Cuando quieras, puedes empezar a contarlo como quieras.",
                actionLabel = "Empezar",
                onAction = {},
            )
        }
    }
}
