package bo.puentejoven.core.designsystem.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes

/**
 * Formas que se entregan a Material 3 como infraestructura.
 *
 * IMPORTANTE: los componentes de Puente Joven NO usan la forma `extraLarge`/`large`
 * de Material para sus tarjetas; usan `PuenteTheme.radius` y, cuando procede,
 * `PuenteShapes.BlobN`. Este mapeo solo evita que los componentes Material base
 * (ripple, diálogos, chips por defecto) introduzcan esquinas ajenas al sistema.
 */
val PuenteMaterialShapes: Shapes = Shapes(
    extraSmall = RoundedCornerShape(PuenteRadius().xs),
    small = RoundedCornerShape(PuenteRadius().sm),
    medium = RoundedCornerShape(PuenteRadius().md),
    large = RoundedCornerShape(PuenteRadius().lg),
    extraLarge = RoundedCornerShape(PuenteRadius().xl),
)
