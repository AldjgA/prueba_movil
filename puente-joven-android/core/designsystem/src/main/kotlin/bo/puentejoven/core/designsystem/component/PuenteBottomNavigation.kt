package bo.puentejoven.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Timeline

/**
 * Un destino de la barra inferior.
 * `key` es un identificador opaco de la feature; el design system NO conoce rutas
 * de navegación (eso vive en `:core:navigation`).
 */
data class PuenteNavItem(
    val key: String,
    val label: String,
    val icon: ImageVector,
)

/** Destinos del grafo joven por defecto, fieles al MVP: Inicio, Hablar, Recorrido, Ayudar. */
object PuenteNavDestinations {
    val Home = PuenteNavItem("home", "Inicio", Icons.Filled.Home)
    val Talk = PuenteNavItem("talk", "Hablar", Icons.Filled.Chat)
    val Journey = PuenteNavItem("journey", "Recorrido", Icons.Filled.Timeline)
    val Help = PuenteNavItem("help", "Ayudar", Icons.Filled.FavoriteBorder)

    val Default: List<PuenteNavItem> = listOf(Home, Talk, Journey, Help)
}

/**
 * Barra de navegación inferior.
 *
 * Reproduce el MVP: fondo blanco translúcido, borde superior `surface-2`, cuatro
 * destinos etiquetados, activo en índigo con un punto inferior.
 *
 * Accesibilidad:
 * - cada destino tiene un área táctil mínima de 48dp de alto,
 * - `selected` se anuncia al lector de pantalla,
 * - `contentDescription` es "label, seleccionado" o el label.
 *
 * @param items destinos visibles.
 * @param selectedKey clave del destino activo.
 * @param onSelect callback con la clave seleccionada.
 */
@Composable
fun PuenteBottomNavigation(
    items: List<PuenteNavItem>,
    selectedKey: String?,
    onSelect: (PuenteNavItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surface0.copy(alpha = 0.94f))
            .navigationBarsPadding(),
    ) {
        // Separador fino (MVP: border-t border-[#E4E6F5])
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(colors.surface2),
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = PuenteTheme.spacing.md, vertical = PuenteTheme.spacing.xs),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEach { item ->
                val selected = item.key == selectedKey
                NavBarItem(
                    item = item,
                    selected = selected,
                    onClick = { onSelect(item) },
                )
            }
        }
    }
}

@Composable
private fun NavBarItem(
    item: PuenteNavItem,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = PuenteTheme.colors
    val tint = if (selected) colors.indigo else colors.ink4

    Column(
        modifier = Modifier
            .defaultMinSize(minWidth = PuenteTheme.spacing.minTouchTarget, minHeight = PuenteTheme.spacing.minTouchTarget)
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(PuenteTheme.radius.sm))
            .clickable(role = Role.Tab, onClick = onClick)
            .semantics(mergeDescendants = true) {
                this.selected = selected
                contentDescription = if (selected) "${item.label}, seleccionado" else item.label
            }
            .padding(horizontal = PuenteTheme.spacing.xs, vertical = PuenteTheme.spacing.xs),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = item.icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(22.dp),
        )
        Spacer(Modifier.height(PuenteTheme.spacing.xxs))
        Text(
            text = item.label,
            style = androidx.compose.material3.MaterialTheme.typography.labelSmall,
            color = tint,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
        )
        Spacer(Modifier.height(3.dp))
        Box(
            modifier = Modifier
                .size(4.dp)
                .clip(CircleShape)
                .background(if (selected) colors.indigo else Color.Transparent),
        )
    }
}

@Preview(name = "PuenteBottomNavigation", showBackground = true, backgroundColor = 0xFFF7F8FC)
@Composable
private fun BottomNavPreview() {
    PuenteTheme {
        PuenteBottomNavigation(
            items = PuenteNavDestinations.Default,
            selectedKey = "home",
            onSelect = {},
        )
    }
}
