package bo.puentejoven.core.designsystem.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Escala de espaciado con base 4dp.
 *
 * Todo margen/padding del proyecto sale de aquí: no se admiten valores sueltos.
 * El MVP web usa una retícula de 4/8px, de modo que la escala es fiel a la intención.
 */
@Immutable
data class PuenteSpacing(
    val none: Dp = 0.dp,
    val xxxs: Dp = 2.dp,
    val xxs: Dp = 4.dp,
    val xs: Dp = 8.dp,
    val sm: Dp = 12.dp,
    val md: Dp = 16.dp,
    val lg: Dp = 20.dp,
    val xl: Dp = 24.dp,
    val xxl: Dp = 32.dp,
    val xxxl: Dp = 40.dp,
    val huge: Dp = 48.dp,
    val giant: Dp = 64.dp,
) {
    /** Margen lateral estándar de pantalla en el MVP web (`px-5` = 20dp). */
    val screenHorizontal: Dp get() = lg

    /** Margen lateral de pantallas con contenido amplio (`px-8` = 32dp). */
    val screenHorizontalWide: Dp get() = xxl

    /** Área táctil mínima exigida por accesibilidad. */
    val minTouchTarget: Dp get() = 48.dp
}

/**
 * Radios del sistema.
 *
 * `blobCorner` es la base de las formas orgánicas; las formas reales viven en
 * [bo.puentejoven.core.designsystem.shape.BlobShape] porque son porcentuales.
 */
@Immutable
data class PuenteRadius(
    val xs: Dp = 8.dp,
    val sm: Dp = 12.dp,
    val md: Dp = 16.dp,
    val lg: Dp = 20.dp,
    val xl: Dp = 24.dp,
    val pill: Dp = 999.dp,
)

/**
 * Elevaciones del sistema.
 *
 * El MVP web es mayoritariamente plano con sombras muy suaves al interactuar
 * (`hover:shadow-md`, `hover:shadow-lg`). Se traduce a sombras discretas.
 */
@Immutable
data class PuenteElevation(
    val none: Dp = 0.dp,
    val subtle: Dp = 1.dp,
    val low: Dp = 3.dp,
    val medium: Dp = 6.dp,
    val high: Dp = 12.dp,
)

/**
 * Duración de animaciones, fiel al MVP web:
 * `.transition-smooth` = 250ms cubic-bezier(0.4, 0, 0.2, 1).
 */
@Immutable
data class PuenteMotionDurations(
    /** Interacciones inmediatas (hover/press del MVP: 0.18s). */
    val instant: Int = 180,
    /** Transición estándar. */
    val standard: Int = 250,
    /** Entradas editoriales (`animate-float` 0.5s). */
    val entrance: Int = 400,
    /** Pulso del orbe (`orb-pulse` 3s). */
    val orbPulse: Int = 3000,
    /** Rotación interna del orbe (`orb-inner` 8s). */
    val orbInner: Int = 8000,
)
