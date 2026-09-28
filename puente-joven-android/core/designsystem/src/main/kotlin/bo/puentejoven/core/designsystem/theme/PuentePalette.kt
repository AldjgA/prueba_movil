package bo.puentejoven.core.designsystem.theme

import androidx.compose.ui.graphics.Color

/**
 * Tokens de color EXACTOS del MVP web (`Propuesta UX_UI Puente Joven/src/index.css`,
 * bloque `@theme inline`).
 *
 * Estos son los únicos valores hexadecimales permitidos en el proyecto. Ningún
 * componente debe declarar colores literales: siempre pasan por [PuenteColors].
 */
object PuentePalette {

    // --- Marca / acentos ---
    val Indigo = Color(0xFF5B5CF0)
    val IndigoDeep = Color(0xFF4338CA)
    val IndigoSoft = Color(0xFF818CF8)
    val Teal = Color(0xFF14B8A6)
    val Mint = Color(0xFF5EEAD4)
    val Lavender = Color(0xFFA78BFA)
    val Coral = Color(0xFFFB7185)

    // --- Neutros / superficies claras ---
    val Bg = Color(0xFFF7F8FC)
    val Dark = Color(0xFF111827)
    val Surface0 = Color(0xFFFFFFFF)
    val Surface1 = Color(0xFFF0F1FA)
    val Surface2 = Color(0xFFE4E6F5)

    // --- Tinta ---
    val Ink1 = Color(0xFF111827)
    val Ink2 = Color(0xFF374151)
    val Ink3 = Color(0xFF6B7280)
    val Ink4 = Color(0xFF9CA3AF)

    // --- Semánticos ---
    val Green = Color(0xFF22C55E)
    val Yellow = Color(0xFFF59E0B)
    val Red = Color(0xFFEF4444)

    // --- Semánticos derivados de los estados de etiqueta del MVP web ---
    // `.signal-rising/.signal-moderate/.signal-stable/.signal-new`
    val YellowInk = Color(0xFFD97706)
    val GreenInk = Color(0xFF16A34A)

    // --- Superficies oscuras (MVP web `.pro-*`) ---
    // NOTA: son solo tokens de tema reutilizables para superficies editoriales oscuras
    // (p. ej. la tarjeta "Mi recorrido" del Home, que el MVP web pinta en #111827).
    // NO representan ninguna superficie profesional ni panel de Puente Red.
    val ProBg = Color(0xFF0D0F1A)
    val ProSurface = Color(0xFF141622)
    val ProCard = Color(0xFF1C1F33)
    val ProText = Color(0xFFE8EAFF)
    val ProMuted = Color(0xFF6B7899)
    val ProBorder = Color(0x12FFFFFF) // rgba(255,255,255,0.07) aproximado a 8 bits
}
