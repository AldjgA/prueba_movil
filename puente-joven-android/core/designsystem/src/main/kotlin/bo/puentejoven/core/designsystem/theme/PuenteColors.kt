package bo.puentejoven.core.designsystem.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import bo.puentejoven.core.model.AttentionLevel

/**
 * Colores del sistema Puente Joven.
 *
 * Material 3 no cubre gradientes, blobs, superficies editoriales oscuras ni los
 * estados de prioridad preliminar. Este objeto completa el lenguaje visual y es la
 * ÚNICA fuente de color para los componentes del design system.
 */
@Immutable
data class PuenteColors(
    // --- Marca ---
    val indigo: Color = PuentePalette.Indigo,
    val indigoDeep: Color = PuentePalette.IndigoDeep,
    val indigoSoft: Color = PuentePalette.IndigoSoft,
    val teal: Color = PuentePalette.Teal,
    val mint: Color = PuentePalette.Mint,
    val lavender: Color = PuentePalette.Lavender,
    val coral: Color = PuentePalette.Coral,

    // --- Superficies claras ---
    val bg: Color = PuentePalette.Bg,
    val surface0: Color = PuentePalette.Surface0,
    val surface1: Color = PuentePalette.Surface1,
    val surface2: Color = PuentePalette.Surface2,

    // --- Tinta ---
    val ink1: Color = PuentePalette.Ink1,
    val ink2: Color = PuentePalette.Ink2,
    val ink3: Color = PuentePalette.Ink3,
    val ink4: Color = PuentePalette.Ink4,

    // --- Semánticos ---
    val green: Color = PuentePalette.Green,
    val yellow: Color = PuentePalette.Yellow,
    val red: Color = PuentePalette.Red,
    val yellowInk: Color = PuentePalette.YellowInk,
    val greenInk: Color = PuentePalette.GreenInk,

    // --- Superficies editoriales oscuras (tarjetas oscuras del Home del MVP) ---
    val darkSurfaceBg: Color = PuentePalette.Dark,
    val darkSurfaceCard: Color = PuentePalette.Dark,
    val darkSurfaceText: Color = PuentePalette.ProText,
    val darkSurfaceMuted: Color = PuentePalette.ProMuted,

    // --- Superficies profundas (MVP `pro-*`) ---
    val deepBg: Color = PuentePalette.ProBg,
    val deepSurface: Color = PuentePalette.ProSurface,
    val deepCard: Color = PuentePalette.ProCard,
    val deepBorder: Color = PuentePalette.ProBorder,
    val deepText: Color = PuentePalette.ProText,
    val deepMuted: Color = PuentePalette.ProMuted,
) {

    // -----------------------------------------------------------------------
    // Color de la prioridad preliminar de revisión
    // -----------------------------------------------------------------------

    /**
     * Color base asociado al nivel. NUNCA se usa solo: siempre va acompañado de
     * texto, etiqueta e icono (guardrail #4).
     */
    fun attentionColor(level: AttentionLevel): Color = when (level) {
        AttentionLevel.GREEN -> green
        AttentionLevel.YELLOW -> yellow
        AttentionLevel.RED -> red
    }

    /** Color de texto con contraste suficiente sobre fondo claro para cada nivel. */
    fun attentionInk(level: AttentionLevel): Color = when (level) {
        AttentionLevel.GREEN -> greenInk
        AttentionLevel.YELLOW -> yellowInk
        AttentionLevel.RED -> red
    }

    /**
     * Fondo muy suave del nivel.
     * MVP `AttentionLevelScreen`: la caja "QUÉ CAMBIÓ" usa `${color}08` → alfa 8/255 ≈ 0.031.
     */
    fun attentionContainer(level: AttentionLevel): Color =
        attentionColor(level).copy(alpha = 0.031f)

    /**
     * Borde del nivel.
     * MVP: `${color}30` en el borde de la tarjeta → alfa 48/255 ≈ 0.188.
     * El borde interior "QUÉ CAMBIÓ" usa `${color}20` → alfa 32/255 ≈ 0.125.
     */
    fun attentionBorder(level: AttentionLevel): Color =
        attentionColor(level).copy(alpha = 0.188f)

    /** Borde suave (MVP `${color}20`) para sub-bloques dentro de la tarjeta. */
    fun attentionBorderSoft(level: AttentionLevel): Color =
        attentionColor(level).copy(alpha = 0.125f)

    /**
     * Relleno del distintivo de nivel.
     * MVP: `background: ${color}18` → alfa 24/255 ≈ 0.094.
     */
    fun attentionBadgeContainer(level: AttentionLevel): Color =
        attentionColor(level).copy(alpha = 0.094f)

    /**
     * Gradiente de fondo de la tarjeta de nivel.
     * MVP `AttentionLevelScreen`: `linear-gradient(145deg, ${color}15 0%, ${color}08 100%)`.
     */
    fun attentionCardBrush(level: AttentionLevel): Brush = Brush.linearGradient(
        colorStops = arrayOf(
            0.00f to attentionColor(level).copy(alpha = 0.082f), // 15/255 ≈ 0.082
            1.00f to attentionColor(level).copy(alpha = 0.031f), // 08/255 ≈ 0.031
        ),
        start = androidx.compose.ui.geometry.Offset.Zero,
        end = androidx.compose.ui.geometry.Offset.Infinite,
    )

    /**
     * Gradiente del orbe: lavanda → índigo → teal, con foco radial desplazado
     * arriba-izquierda (MVP: `circle at 35% 30%`).
     */
    fun orbBrush(centerX: Float = 0.35f, centerY: Float = 0.30f): Brush = Brush.radialGradient(
        colors = listOf(lavender, indigo, teal),
        center = androidx.compose.ui.geometry.Offset(centerX, centerY),
        radius = 900f,
    )

    /**
     * Halo difuminado exterior del orbe.
     *
     * MVP `PuenteOrb.tsx`: `radial-gradient(circle at 40% 35%, #A78BFA, #5B5CF0, #14B8A6)`
     * con `opacity-30`. El foco está desplazado a (40%, 35%), no centrado: se
     * reproduce con un `Brush.radialGradient` cuyo centro es esa fracción. Como el
     * gradiente se pinta dentro de un `DrawScope` del tamaño del halo, se resuelve
     * en el componente (`PuenteOrb`) pasando la fracción; aquí se expone la
     * variante paramétrica y un valor por defecto fiel.
     */
    fun orbGlowBrush(
        centerX: Float = 0.40f,
        centerY: Float = 0.35f,
        radius: Float = 900f,
    ): Brush = Brush.radialGradient(
        colors = listOf(
            lavender.copy(alpha = 0.30f),
            indigo.copy(alpha = 0.30f),
            teal.copy(alpha = 0.30f),
        ),
        center = androidx.compose.ui.geometry.Offset(centerX, centerY),
        radius = radius,
    )

    /**
     * Gradiente del módulo principal "Me está pasando algo" del Home.
     * MVP: `linear-gradient(145deg, #4338CA 0%, #5B5CF0 50%, #7C3AED 100%)`.
     * `145deg` en CSS apunta hacia arriba-derecha; en Compose se aproxima con
     * `linearGradient` de abajo-izquierda a arriba-derecha.
     */
    val heroBrush: Brush
        get() = Brush.linearGradient(
            colors = listOf(indigoDeep, indigo, HeroViolet),
            start = androidx.compose.ui.geometry.Offset.Zero,
            end = androidx.compose.ui.geometry.Offset.Infinite,
        )

    /**
     * Gradiente de acción principal en superficies claras.
     * MVP: `linear-gradient(135deg, #5B5CF0, #4338CA)`.
     */
    val primaryActionBrush: Brush
        get() = Brush.linearGradient(
            colors = listOf(indigo, indigoDeep),
            start = androidx.compose.ui.geometry.Offset.Zero,
            end = androidx.compose.ui.geometry.Offset.Infinite,
        )

    /** Gradiente de acento teal→menta (tarjeta "Quiero ayudar a alguien", MVP `135deg`). */
    val tealBrush: Brush
        get() = Brush.linearGradient(
            colors = listOf(teal, mint),
            start = androidx.compose.ui.geometry.Offset.Zero,
            end = androidx.compose.ui.geometry.Offset.Infinite,
        )

    /**
     * Conector vertical del recorrido.
     * MVP `.timeline-connector`: `linear-gradient(to bottom, #5B5CF0 0%, #14B8A6 100%)`
     * y la línea temporal de `SignalsScreen` usa `to bottom, #5B5CF0, #4338CA`.
     * Se expone la variante fiel al recorrido de señales (índigo → teal).
     */
    val timelineBrush: Brush
        get() = Brush.verticalGradient(colors = listOf(indigo, teal))

    /** Conector de la línea temporal de señales (MVP `to bottom, #5B5CF0, #4338CA`). */
    val signalTimelineBrush: Brush
        get() = Brush.verticalGradient(colors = listOf(indigo, indigoDeep))

    /** Forma ambiental del fondo de pantallas claras (MVP: `135deg` índigo→lavanda). */
    val ambientBrush: Brush
        get() = Brush.linearGradient(
            colors = listOf(indigo, lavender),
            start = androidx.compose.ui.geometry.Offset.Zero,
            end = androidx.compose.ui.geometry.Offset.Infinite,
        )

    private companion object {
        /** Violeta del tramo final del hero del MVP web (`#7C3AED`). */
        val HeroViolet = Color(0xFF7C3AED)
    }
}

/**
 * Acceso al sistema de color extendido desde cualquier composable.
 * Se instala en [PuenteTheme] y se lee con `PuenteTheme.colors`.
 */
val LocalPuenteColors = staticCompositionLocalOf { PuenteColors() }
