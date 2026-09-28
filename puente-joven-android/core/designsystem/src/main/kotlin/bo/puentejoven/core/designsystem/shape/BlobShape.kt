package bo.puentejoven.core.designsystem.shape

import androidx.compose.foundation.shape.CornerSize
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection

/**
 * Formas orgánicas "blob" del MVP web, expresadas como [Shape] de Compose.
 *
 * El MVP las define con `border-radius` porcentual en dos ejes:
 * ```
 * .blob-1 { border-radius: 60% 40% 70% 30% / 50% 60% 40% 70%; }
 * .blob-2 { border-radius: 40% 60% 30% 70% / 60% 40% 70% 30%; }
 * .blob-3 { border-radius: 50% 50% 60% 40% / 40% 60% 40% 60%; }
 * ```
 * Compose no soporta porcentajes por eje, así que se aproxima con 8 curvas
 * cúbicas (2 por esquina, unidas por puntos medios proporcionales). El resultado
 * conserva la silueta asimétrica y claramente no-circular de la marca.
 *
 * Cada radio se interpreta como fracción (0f..1f) del tamaño del contenedor, igual
 * que el porcentaje del CSS. La componente horizontal y vertical del CSS se mapean a
 * los dos puntos de control de cada esquina.
 */
class BlobShape(
    private val topStart: BlobCorner,
    private val topEnd: BlobCorner,
    private val bottomEnd: BlobCorner,
    private val bottomStart: BlobCorner,
) : Shape {

    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density,
    ): Outline {
        val width = size.width
        val height = size.height
        if (width <= 0f || height <= 0f) {
            return Outline.Rectangle(androidx.compose.ui.geometry.Rect(0f, 0f, width, height))
        }

        val path = Path()

        // Puntos de anclaje sobre los lados (los radios CSS "empujan" el vértice).
        val topStartH = topStart.horizontal * width
        val topStartV = topStart.vertical * height
        val topEndH = topEnd.horizontal * width
        val topEndV = topEnd.vertical * height
        val bottomEndH = bottomEnd.horizontal * width
        val bottomEndV = bottomEnd.vertical * height
        val bottomStartH = bottomStart.horizontal * width
        val bottomStartV = bottomStart.vertical * height

        path.moveTo(topStartH, 0f)

        // Borde superior: top-start -> top-end
        path.cubicTo(
            width * 0.33f + topStartH * 0.5f, topStartV * 0.55f,
            width * 0.66f - topEndH * 0.5f, topEndV * 0.55f,
            width - topEndH, topEndV,
        )

        // Borde derecho: top-end -> bottom-end
        path.cubicTo(
            width - topEndH * 0.45f, height * 0.33f + topEndV * 0.5f,
            width - bottomEndH * 0.45f, height * 0.66f - bottomEndV * 0.5f,
            width - bottomEndH * 0.0f - (bottomEndH * 0.0f), height - bottomEndV,
        )

        // Borde inferior: bottom-end -> bottom-start
        path.cubicTo(
            width * 0.66f + bottomEndH * 0.5f, height - bottomEndV * 0.55f,
            width * 0.33f - bottomStartH * 0.5f, height - bottomStartV * 0.55f,
            bottomStartH, height - bottomStartV,
        )

        // Borde izquierdo: bottom-start -> top-start
        path.cubicTo(
            bottomStartH * 0.45f, height * 0.66f + bottomStartV * 0.5f,
            topStartH * 0.45f, height * 0.33f - topStartV * 0.5f,
            topStartH, topStartV,
        )

        path.close()
        return Outline.Generic(path)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is BlobShape) return false
        return topStart == other.topStart &&
            topEnd == other.topEnd &&
            bottomEnd == other.bottomEnd &&
            bottomStart == other.bottomStart
    }

    override fun hashCode(): Int {
        var result = topStart.hashCode()
        result = 31 * result + topEnd.hashCode()
        result = 31 * result + bottomEnd.hashCode()
        result = 31 * result + bottomStart.hashCode()
        return result
    }
}

/** Esquina de un blob: radios horizontal y vertical como fracción del contenedor. */
data class BlobCorner(val horizontal: Float, val vertical: Float)

/**
 * Las tres formas orgánicas con los valores exactos del MVP web.
 * Se usan también como `CornerSize` válido para `RoundedCornerShape` cuando solo
 * interesa una aproximación de esquina.
 */
object PuenteShapes {

    /** `.blob-1` — usada por el orbe y las formas ambientales principales. */
    val Blob1: Shape = BlobShape(
        topStart = BlobCorner(horizontal = 0.60f, vertical = 0.50f),
        topEnd = BlobCorner(horizontal = 0.40f, vertical = 0.60f),
        bottomEnd = BlobCorner(horizontal = 0.70f, vertical = 0.40f),
        bottomStart = BlobCorner(horizontal = 0.30f, vertical = 0.70f),
    )

    /** `.blob-2` — formas ambientales secundarias. */
    val Blob2: Shape = BlobShape(
        topStart = BlobCorner(horizontal = 0.40f, vertical = 0.60f),
        topEnd = BlobCorner(horizontal = 0.60f, vertical = 0.40f),
        bottomEnd = BlobCorner(horizontal = 0.30f, vertical = 0.70f),
        bottomStart = BlobCorner(horizontal = 0.70f, vertical = 0.30f),
    )

    /** `.blob-3` — iconos orgánicos (tarjeta "Quiero ayudar a alguien"). */
    val Blob3: Shape = BlobShape(
        topStart = BlobCorner(horizontal = 0.50f, vertical = 0.40f),
        topEnd = BlobCorner(horizontal = 0.50f, vertical = 0.60f),
        bottomEnd = BlobCorner(horizontal = 0.60f, vertical = 0.40f),
        bottomStart = BlobCorner(horizontal = 0.40f, vertical = 0.60f),
    )

    /** Esquina totalmente circular, útil para píldoras y avatares. */
    val Circle: CornerSize = CornerSize(percent = 50)
}
