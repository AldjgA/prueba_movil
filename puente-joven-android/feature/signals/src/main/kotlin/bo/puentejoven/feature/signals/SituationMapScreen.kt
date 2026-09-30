package bo.puentejoven.feature.signals

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.designsystem.component.EditorialHeader
import bo.puentejoven.core.designsystem.component.EmptyState
import bo.puentejoven.core.designsystem.component.ErrorState
import bo.puentejoven.core.designsystem.component.IntensityMeter
import bo.puentejoven.core.designsystem.component.LoadingState
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.SituationMap
import bo.puentejoven.core.model.SituationNode
import bo.puentejoven.core.navigation.AppNavigator

/**
 * Mapa de situación (brief §12).
 *
 * El brief §12 pide **no** llamarlo evaluación psicológica y sí *"Entendamos lo que
 * está pasando"*. Ese encuadre se declara explícitamente al pie de la pantalla.
 *
 * El concepto visual del prototipo es una constelación de nodos. Aquí se resuelve con
 * los componentes del design system (`IntensityMeter` para el peso) en vez de dibujar
 * un grafo: el DS está congelado y no hay componente de constelación. Si producto
 * quiere la constelación literal, es una petición de componente a A — no se improvisa.
 */
@Composable
fun SituationMapRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
    viewModel: SituationMapViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    SituationMapScreenContent(
        state = state,
        onRetry = viewModel::load,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: previews y pruebas de UI. */
@Composable
fun SituationMapScreenContent(
    state: SituationMapUiState,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg),
    ) {
        when (val content = state.content) {
            is FeatureUiState.Loading -> LoadingState(
                message = stringResource(R.string.map_loading),
            )

            is FeatureUiState.Empty -> EmptyState(
                title = stringResource(R.string.map_empty),
                message = stringResource(R.string.map_empty_hint),
            )

            is FeatureUiState.Error -> ErrorState(
                title = stringResource(R.string.map_error_title),
                message = stringResource(R.string.map_error_body),
                retryLabel = stringResource(R.string.map_retry),
                onRetry = onRetry,
            )

            is FeatureUiState.Content -> MapLoaded(map = content.data)
        }
    }
}

@Composable
private fun MapLoaded(map: SituationMap) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .padding(horizontal = spacing.screenHorizontal),
    ) {
        Spacer(Modifier.height(spacing.md))
        EditorialHeader(
            label = stringResource(R.string.map_title),
            titleLines = listOf(stringResource(R.string.map_headline)),
        )
        Spacer(Modifier.height(spacing.lg))

        Text(
            text = stringResource(R.string.map_nodes_label),
            style = PuenteTheme.typography.MonoLabel,
            color = colors.ink4,
        )
        Spacer(Modifier.height(spacing.xs))

        map.entries.forEach { node ->
            NodeCard(node = node)
            Spacer(Modifier.height(spacing.xs))
        }

        if (map.links.isNotEmpty()) {
            Spacer(Modifier.height(spacing.md))
            Text(
                text = stringResource(R.string.map_links_label),
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))

            map.links.forEach { link ->
                val from = map.entries.firstOrNull { it.key == link.fromKey }?.label ?: link.fromKey
                val to = map.entries.firstOrNull { it.key == link.toKey }?.label ?: link.toKey
                Text(
                    text = "$from → $to · ${link.relationLabel}",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.ink2,
                )
                Spacer(Modifier.height(spacing.xxs))
            }
        }

        Spacer(Modifier.height(spacing.lg))
        Text(
            text = stringResource(R.string.map_disclaimer),
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink4,
        )
        Spacer(Modifier.height(spacing.xxl))
    }
}

@Composable
private fun NodeCard(node: SituationNode) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val shape = RoundedCornerShape(PuenteTheme.radius.lg)
    val weightDescription = stringResource(R.string.map_weight_accessibility, node.weight)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.surface0)
            .border(1.dp, colors.surface2, shape)
            .padding(spacing.md)
            .semantics { contentDescription = "${node.label}. $weightDescription" },
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = node.label,
                style = MaterialTheme.typography.titleSmall,
                color = colors.ink1,
                modifier = Modifier.weight(1f),
            )
            IntensityMeter(intensity = node.weight, accentColor = colors.indigo)
        }
        Spacer(Modifier.height(spacing.xxs))
        Text(
            text = node.detail,
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink3,
        )
    }
}

@Preview(name = "Mapa de situación", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 720)
@Composable
private fun SituationMapPreview() {
    PuenteTheme {
        SituationMapScreenContent(
            state = SituationMapUiState(
                content = FeatureUiState.Content(
                    SituationMap(
                        entries = listOf(
                            SituationNode("school", "Colegio", "El lugar donde más se repite.", 4),
                            SituationNode("peer", "Compañeros", "Comentarios y risas repetidas.", 3),
                            SituationNode("home", "Casa", "Cambios en la convivencia.", 2),
                        ),
                        links = listOf(
                            bo.puentejoven.core.model.SituationLink(
                                fromKey = "peer",
                                toKey = "school",
                                relationLabel = "ocurre en",
                            ),
                        ),
                    ),
                ),
            ),
            onRetry = {},
        )
    }
}
