package bo.puentejoven.core.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.sp
import bo.puentejoven.core.designsystem.R

/**
 * Familias tipográficas EMPAQUETADAS en `res/font/`.
 *
 * Se usan las fuentes reales del MVP web (no fallback de sistema) porque son parte
 * de la identidad: Fraunces (serif editorial), Manrope (sans) y DM Mono (etiquetas).
 *
 * DECISIÓN TÉCNICA: las tres son fuentes **variables** descargadas desde
 * `github.com/google/fonts` (licencia SIL Open Font License 1.1) y se copiaron al
 * repositorio. No se descarga nada en tiempo de ejecución (prohibido por TASK-002).
 *
 * Android no expone ejes variables de forma fiable en `res/font/`, así que cada
 * archivo se declara con `FontWeight` a nivel de familia y Compose sintetiza los
 * pesos intermedios. Los pesos usados (Light 300, Regular 400, Medium 500,
 * SemiBold 600, Bold 700) quedan declarados explícitamente para que el sistema
 * elija el más cercano dentro del eje `wght` de la variable.
 */
object PuenteTypography {

    val Fraunces = FontFamily(
        Font(R.font.fraunces_variable, FontWeight.Light),      // 300
        Font(R.font.fraunces_variable, FontWeight.Normal),     // 400
        Font(R.font.fraunces_variable, FontWeight.Medium),     // 500
        Font(R.font.fraunces_variable, FontWeight.SemiBold),   // 600
        Font(R.font.fraunces_variable, FontWeight.Bold),       // 700
    )

    val Manrope = FontFamily(
        Font(R.font.manrope_variable, FontWeight.Light),
        Font(R.font.manrope_variable, FontWeight.Normal),
        Font(R.font.manrope_variable, FontWeight.Medium),
        Font(R.font.manrope_variable, FontWeight.SemiBold),
        Font(R.font.manrope_variable, FontWeight.Bold),
        Font(R.font.manrope_variable, FontWeight.ExtraBold),
    )

    val DMMono = FontFamily(
        Font(R.font.dmmono_regular, FontWeight.Light),
        Font(R.font.dmmono_regular, FontWeight.Normal),
        Font(R.font.dmmono_regular, FontWeight.Medium),
    )

    /**
     * Ajuste para que los títulos editoriales respiren como en el MVP web
     * (`leading-[1.1]`, `tracking-tight`).
     */
    val Display = TextStyle.Default.copy(
        lineHeightStyle = LineHeightStyle(
            alignment = LineHeightStyle.Alignment.Center,
            trim = LineHeightStyle.Trim.None,
        ),
    )

    /** Escala tipográfica propia de Puente Joven (no la de Material por defecto). */
    val Typography = Typography(
        // --- Display: titulares editoriales Fraunces ---
        displayLarge = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Light,
            fontSize = 56.sp,
            lineHeight = 61.sp, // 1.1
            letterSpacing = (-0.5).sp,
        ),
        displayMedium = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Light,
            fontSize = 44.sp,
            lineHeight = 48.sp,
            letterSpacing = (-0.4).sp,
        ),
        displaySmall = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Light,
            fontSize = 36.sp,
            lineHeight = 40.sp,
            letterSpacing = (-0.3).sp,
        ),

        // --- Headline: títulos de bloque ---
        headlineLarge = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Medium,
            fontSize = 30.sp,
            lineHeight = 37.sp,
            letterSpacing = (-0.2).sp,
        ),
        headlineMedium = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Light,
            fontSize = 26.sp,
            lineHeight = 33.sp,
            letterSpacing = (-0.2).sp,
        ),
        headlineSmall = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Light,
            fontSize = 24.sp,
            lineHeight = 30.sp,
        ),

        // --- Title: nombres, encabezados de tarjeta ---
        titleLarge = TextStyle(
            fontFamily = Fraunces,
            fontWeight = FontWeight.Medium,
            fontSize = 20.sp,
            lineHeight = 26.sp,
            letterSpacing = (-0.1).sp,
        ),
        titleMedium = TextStyle(
            fontFamily = Manrope,
            fontWeight = FontWeight.SemiBold,
            fontSize = 16.sp,
            lineHeight = 22.sp,
        ),
        titleSmall = TextStyle(
            fontFamily = Manrope,
            fontWeight = FontWeight.Medium,
            fontSize = 14.sp,
            lineHeight = 20.sp,
        ),

        // --- Body: texto de lectura ---
        bodyLarge = TextStyle(
            fontFamily = Manrope,
            fontWeight = FontWeight.Normal,
            fontSize = 16.sp,
            lineHeight = 24.sp,
        ),
        bodyMedium = TextStyle(
            fontFamily = Manrope,
            fontWeight = FontWeight.Normal,
            fontSize = 14.sp,
            lineHeight = 21.sp,
        ),
        bodySmall = TextStyle(
            fontFamily = Manrope,
            fontWeight = FontWeight.Normal,
            fontSize = 13.sp,
            lineHeight = 19.sp,
        ),

        // --- Label: usar DM Mono + trackingWide para las etiquetas del MVP ---
        labelLarge = TextStyle(
            fontFamily = Manrope,
            fontWeight = FontWeight.SemiBold,
            fontSize = 15.sp,
            lineHeight = 20.sp,
        ),
        labelMedium = TextStyle(
            fontFamily = DMMono,
            fontWeight = FontWeight.Medium,
            fontSize = 11.sp,
            lineHeight = 15.sp,
            letterSpacing = 1.6.sp, // ≈ tracking-widest
        ),
        labelSmall = TextStyle(
            fontFamily = DMMono,
            fontWeight = FontWeight.Normal,
            fontSize = 10.sp,
            lineHeight = 14.sp,
            letterSpacing = 1.6.sp,
        ),
    )

    // --- Estilos nombrados extra, fuera del enum de Material ---

    /** Etiqueta monoespaciada en mayúsculas con tracking amplio (MVP `.font-mono tracking-widest`). */
    val MonoLabel = TextStyle(
        fontFamily = DMMono,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        letterSpacing = 1.8.sp,
    )

    /** Igual que [MonoLabel] pero más grande, para encabezados de sección. */
    val MonoLabelLarge = TextStyle(
        fontFamily = DMMono,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 15.sp,
        letterSpacing = 1.8.sp,
    )

    /** Cita dentro de la evidencia de una señal (MVP: `text-xs italic`). */
    val Quote = TextStyle(
        fontFamily = Manrope,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 19.sp,
        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
        color = PuentePalette.Ink3,
    )
}
