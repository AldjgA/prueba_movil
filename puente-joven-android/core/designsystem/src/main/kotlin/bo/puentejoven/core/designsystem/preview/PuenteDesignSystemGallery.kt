package bo.puentejoven.core.designsystem.preview

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.component.AttentionCard
import bo.puentejoven.core.designsystem.component.EditorialHeader
import bo.puentejoven.core.designsystem.component.EmptyState
import bo.puentejoven.core.designsystem.component.ErrorState
import bo.puentejoven.core.designsystem.component.LoadingState
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.PuenteButtonState
import bo.puentejoven.core.designsystem.component.PuenteOrb
import bo.puentejoven.core.designsystem.component.SecondaryAction
import bo.puentejoven.core.designsystem.component.SignalChip
import bo.puentejoven.core.designsystem.component.SummaryCard
import bo.puentejoven.core.designsystem.component.SummaryItem
import bo.puentejoven.core.designsystem.component.TertiaryAction
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuentePalette
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.TrendDirection

/**
 * Galería interna de componentes para revisión visual.
 *
 * Es una pantalla de DESARROLLO (no se publica al joven): permite comparar el
 * design system Compose contra el MVP web en un solo scroll, en ancho compacto.
 *
 * Se abre desde `:app` en builds debug; también sirve como `@Preview` en Android
 * Studio.
 */
@Composable
fun PuenteDesignSystemGallery(
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg)
            .verticalScroll(rememberScrollState())
            .padding(PuenteTheme.spacing.lg),
        verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xl),
    ) {
        GallerySection("Orbe") {
            Row(
                horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.lg),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                PuenteOrb(size = 32.dp)
                PuenteOrb(size = 48.dp)
                PuenteOrb(size = 72.dp)
            }
        }

        GallerySection("Formas orgánicas (blob-1/2/3)") {
            Row(
                horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BlobSwatch(PuenteShapes.Blob1, "blob-1")
                BlobSwatch(PuenteShapes.Blob2, "blob-2")
                BlobSwatch(PuenteShapes.Blob3, "blob-3")
            }
        }

        GallerySection("Tipografía") {
            Column(verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xs)) {
                Text(
                    text = "Un espacio para entender lo que está pasando.",
                    style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                    color = colors.ink1,
                )
                Text(
                    text = "Manrope cuerpo — Y encontrar el siguiente paso.",
                    style = androidx.compose.material3.MaterialTheme.typography.bodyLarge,
                    color = colors.ink2,
                )
                Text(
                    text = "DM MONO · ETIQUETA TRACKING-WIDEST",
                    style = PuenteTheme.typography.MonoLabel,
                    color = colors.ink4,
                )
                Text(
                    text = "«Prefiero quedarme en el aula.»",
                    style = PuenteTheme.typography.Quote,
                )
            }
        }

        GallerySection("Jerarquía editorial") {
            EditorialHeader(
                label = "Puente Signals",
                titleLines = listOf("Hay algo que", "cambió."),
                accentColor = colors.mint,
                trailing = { PuenteOrb(size = 40.dp) },
            )
        }

        GallerySection("Acciones") {
            Column(verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.sm)) {
                PrimaryAction(text = "Ver herramienta recomendada →", onClick = {})
                PrimaryAction(text = "Cargando…", onClick = {}, state = PuenteButtonState.Loading)
                PrimaryAction(text = "Deshabilitado", onClick = {}, state = PuenteButtonState.Disabled)
                SecondaryAction(text = "Preparar solicitud de apoyo", onClick = {})
                TertiaryAction(text = "Ver reporte personal", onClick = {})
            }
        }

        GallerySection("Acciones sobre superficie oscura") {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.darkSurfaceBg)
                    .padding(PuenteTheme.spacing.md),
                verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.sm),
            ) {
                PrimaryAction(text = "Contarlo", onClick = {}, onDarkSurface = true, fullWidth = false)
                SecondaryAction(
                    text = "Ver nivel de atención",
                    onClick = {},
                    onDarkSurface = true,
                )
            }
        }

        GallerySection("Distintivos de señal") {
            Row(horizontalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.xs)) {
                SignalChip(label = "Bullying", accentColor = colors.coral)
                SignalChip(label = "Nuevo", accentColor = colors.indigo, selected = true)
                SignalChip(
                    label = "Frecuencia",
                    accentColor = colors.yellow,
                    trend = TrendDirection.RISING,
                )
                SignalChip(label = "Estable", accentColor = colors.green)
            }
        }

        GallerySection("Prioridad preliminar de revisión (3 estados, con texto e icono)") {
            Column(verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.md)) {
                AttentionCard(
                    level = AttentionLevel.GREEN,
                    title = "Podemos trabajar en esto paso a paso.",
                    explanation = "Lo que contaste muestra algo que vale la pena atender.",
                    whatChanged = "Esta es la primera vez que registramos esta situación.",
                    nextStep = "Te sugerimos una herramienta breve para empezar.",
                )
                AttentionCard(
                    level = AttentionLevel.YELLOW,
                    title = "Sería bueno involucrar a alguien.",
                    explanation = "Notamos que lo que estás viviendo ha cambiado.",
                    whatChanged = "La frecuencia aumentó y empezó a afectar tu asistencia.",
                    nextStep = "Podemos ayudarte a preparar cómo pedir apoyo.",
                )
                AttentionCard(
                    level = AttentionLevel.RED,
                    title = "Esto necesita apoyo humano prioritario.",
                    explanation = "Lo que compartiste indica que necesitas apoyo de una persona capacitada.",
                    whatChanged = "Aparecieron señales que indican que necesitas apoyo inmediato.",
                    nextStep = "Vamos a preparar una solicitud para que alguien te contacte pronto.",
                )
            }
        }

        GallerySection("Resumen compartible") {
            SummaryCard(
                title = "Lo que compartirás con el equipo de apoyo.",
                items = listOf(
                    SummaryItem("s1", "Señales de las últimas semanas", included = true),
                    SummaryItem("s2", "Prioridad preliminar de revisión", included = true),
                    SummaryItem(
                        "s3",
                        "Tu conversación completa",
                        included = false,
                        detail = "Nunca se comparte",
                    ),
                ),
                footnote = "Puedes cambiar esto antes de autorizar.",
            )
        }

        GallerySection("Estados") {
            Column(verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.md)) {
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

        Spacer(Modifier.height(PuenteTheme.spacing.xxl))
    }
}

@Composable
private fun GallerySection(
    title: String,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(PuenteTheme.spacing.sm)) {
        Text(
            text = title.uppercase(),
            style = PuenteTheme.typography.MonoLabel,
            color = PuenteTheme.colors.ink4,
            modifier = Modifier.semantics { heading() },
        )
        content()
    }
}

@Composable
private fun BlobSwatch(
    shape: androidx.compose.ui.graphics.Shape,
    label: String,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .height(72.dp)
                .fillMaxWidth(0.3f)
                .background(PuentePalette.Lavender, shape),
        )
        Spacer(Modifier.height(PuenteTheme.spacing.xxs))
        Text(
            text = label,
            style = PuenteTheme.typography.MonoLabel,
            color = PuenteTheme.colors.ink4,
        )
    }
}

@Preview(
    name = "Galería del design system (compacto)",
    showBackground = true,
    backgroundColor = 0xFFF7F8FC,
    widthDp = 360,
    heightDp = 2400,
)
@Composable
private fun GalleryPreview() {
    PuenteTheme {
        PuenteDesignSystemGallery()
    }
}
