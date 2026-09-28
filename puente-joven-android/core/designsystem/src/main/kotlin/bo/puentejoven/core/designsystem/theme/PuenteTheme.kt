package bo.puentejoven.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * Entrada única al sistema visual de Puente Joven.
 *
 * Material 3 se usa como INFRAESTRUCTURA (ripple, semántica, componentes base),
 * nunca como estética final: la paleta, tipografía, formas y movimiento propios
 * viven en [PuenteColors], [PuenteTypography], [PuenteSpacing] y [PuenteShapes].
 *
 * Uso:
 * ```
 * PuenteTheme {
 *     // PuenteTheme.colors, .spacing, .radius, .elevation, .motion, .typography
 * }
 * ```
 */
@Composable
fun PuenteTheme(
    content: @Composable () -> Unit,
) {
    val puenteColors = PuenteColors()

    val materialColorScheme = lightColorScheme(
        primary = puenteColors.indigo,
        onPrimary = Color.White,
        primaryContainer = puenteColors.indigoSoft.copy(alpha = 0.16f),
        onPrimaryContainer = puenteColors.indigoDeep,

        secondary = puenteColors.teal,
        onSecondary = Color.White,
        secondaryContainer = puenteColors.mint.copy(alpha = 0.20f),
        onSecondaryContainer = puenteColors.ink1,

        tertiary = puenteColors.lavender,
        onTertiary = Color.White,

        background = puenteColors.bg,
        onBackground = puenteColors.ink1,

        surface = puenteColors.surface0,
        onSurface = puenteColors.ink1,
        surfaceVariant = puenteColors.surface1,
        onSurfaceVariant = puenteColors.ink2,

        outline = puenteColors.surface2,
        outlineVariant = puenteColors.ink4,

        // Los estados de prioridad NO son colores de error/semánticos de Material;
        // se gestionan en PuenteColors.attentionColor para no confundir prioridad
        // preliminar de revisión con un error de aplicación.
        error = puenteColors.red,
        onError = Color.White,

        scrim = puenteColors.ink1.copy(alpha = 0.45f),
    )

    CompositionLocalProvider(
        LocalPuenteColors provides puenteColors,
        LocalPuenteSpacing provides PuenteSpacing(),
        LocalPuenteRadius provides PuenteRadius(),
        LocalPuenteElevation provides PuenteElevation(),
        LocalPuenteMotion provides PuenteMotionDurations(),
        LocalPuenteTypography provides PuenteTypography,
    ) {
        MaterialTheme(
            colorScheme = materialColorScheme,
            typography = PuenteTypography.Typography,
            shapes = PuenteMaterialShapes,
            content = content,
        )
    }
}

/** Tokens de espaciado disponibles desde cualquier composable. */
val LocalPuenteSpacing = staticCompositionLocalOf { PuenteSpacing() }

/** Tokens de radio. */
val LocalPuenteRadius = staticCompositionLocalOf { PuenteRadius() }

/** Tokens de elevación. */
val LocalPuenteElevation = staticCompositionLocalOf { PuenteElevation() }

/** Duraciones de animación. */
val LocalPuenteMotion = staticCompositionLocalOf { PuenteMotionDurations() }

/** Tipografía extendida (MonoLabel, Quote, etc.). */
val LocalPuenteTypography = staticCompositionLocalOf { PuenteTypography }

/**
 * Punto de acceso de lectura a los tokens del design system.
 *
 * Ejemplo: `PuenteTheme.spacing.xl`, `PuenteTheme.colors.indigo`.
 */
object PuenteTheme {

    val colors: PuenteColors
        @Composable @ReadOnlyComposable get() = LocalPuenteColors.current

    val spacing: PuenteSpacing
        @Composable @ReadOnlyComposable get() = LocalPuenteSpacing.current

    val radius: PuenteRadius
        @Composable @ReadOnlyComposable get() = LocalPuenteRadius.current

    val elevation: PuenteElevation
        @Composable @ReadOnlyComposable get() = LocalPuenteElevation.current

    val motion: PuenteMotionDurations
        @Composable @ReadOnlyComposable get() = LocalPuenteMotion.current

    /** Tipografía extendida, además de `MaterialTheme.typography`. */
    val typography: PuenteTypography
        @Composable @ReadOnlyComposable get() = LocalPuenteTypography.current
}

/** Esquema oscuro reservado; el MVP prioriza la superficie clara editorial. */
@Suppress("unused")
private val ReservedDarkScheme = darkColorScheme()
