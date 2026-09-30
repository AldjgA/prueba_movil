package bo.puentejoven.feature.signals

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.designsystem.component.EditorialHeader
import bo.puentejoven.core.designsystem.component.EmptyState
import bo.puentejoven.core.designsystem.component.ErrorState
import bo.puentejoven.core.designsystem.component.EvidenceCard
import bo.puentejoven.core.designsystem.component.LoadingState
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.SecondaryAction
import bo.puentejoven.core.designsystem.component.SignalChip
import bo.puentejoven.core.designsystem.theme.PuenteColors
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SignalEvidence
import bo.puentejoven.core.model.SignalEvidenceId
import bo.puentejoven.core.model.SignalKey
import bo.puentejoven.core.model.TrendDirection
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.feature.signals.domain.LevelReason
import bo.puentejoven.feature.signals.domain.RuleOutcome

/**
 * Puente Señales (brief §10) + explicabilidad (brief §11).
 *
 * El brief §11 es explícito: *"Nunca mostrar simplemente AMARILLO."* Antes del nivel
 * va el **por qué**, y cada señal enlaza con los registros concretos que la
 * produjeron. Esa es la razón de que la evidencia se muestre aquí y no en un detalle
 * aparte.
 */
@Composable
fun SignalsRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
    viewModel: SignalsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                is SignalsEffect.Navigate -> navigator.navigateTo(effect.destination)
            }
        }
    }

    SignalsScreenContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: previews y pruebas de UI. */
@Composable
fun SignalsScreenContent(
    state: SignalsUiState,
    onAction: (SignalsUiAction) -> Unit,
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
                message = stringResource(R.string.signals_loading),
            )

            is FeatureUiState.Empty -> EmptyState(
                title = stringResource(R.string.signals_empty),
                message = stringResource(R.string.signals_empty_hint),
            )

            is FeatureUiState.Error -> ErrorState(
                title = stringResource(R.string.signals_error_title),
                message = stringResource(R.string.signals_error_body),
                retryLabel = stringResource(R.string.signals_retry),
            )

            is FeatureUiState.Content -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .statusBarsPadding()
                    .padding(horizontal = spacing.screenHorizontal),
            ) {
                Spacer(Modifier.height(spacing.md))
                EditorialHeader(
                    label = stringResource(R.string.signals_title),
                    titleLines = listOf(stringResource(R.string.signals_headline)),
                )
                Spacer(Modifier.height(spacing.lg))

                // Brief §11: el por qué va ANTES del nivel.
                WhyBlock()
                Spacer(Modifier.height(spacing.lg))

                content.data.signals.forEach { signal ->
                    SignalBlock(signal = signal)
                    Spacer(Modifier.height(spacing.md))
                }

                Spacer(Modifier.height(spacing.xs))
                PrimaryAction(
                    text = stringResource(R.string.signals_open_attention),
                    onClick = { onAction(SignalsUiAction.OpenAttention) },
                )
                Spacer(Modifier.height(spacing.xs))
                SecondaryAction(
                    text = stringResource(R.string.signals_open_map),
                    onClick = { onAction(SignalsUiAction.OpenSituationMap) },
                )
                Spacer(Modifier.height(spacing.xxl))
            }
        }
    }
}

@Composable
private fun WhyBlock() {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column {
        Text(
            text = stringResource(R.string.signals_why_title),
            style = MaterialTheme.typography.titleSmall,
            color = colors.ink1,
        )
        Spacer(Modifier.height(spacing.xxs))
        Text(
            text = stringResource(R.string.signals_why_body),
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink3,
        )
    }
}

@Composable
private fun SignalBlock(signal: Signal) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(modifier = Modifier.fillMaxWidth()) {
        SignalChip(
            label = signal.label,
            trend = signal.trendDirection,
            accentColor = accentFor(signal.trendDirection, colors),
        )
        Spacer(Modifier.height(spacing.xs))

        Text(
            text = trendLabel(signal.trendDirection) + " · " +
                stringResource(R.string.signals_evidence_count, signal.evidence.size),
            style = PuenteTheme.typography.MonoLabel,
            color = colors.ink4,
        )
        Spacer(Modifier.height(spacing.xs))

        // Los registros concretos: es lo que hace el análisis comprensible (brief §11).
        signal.evidence.forEachIndexed { index, evidence ->
            EvidenceCard(
                evidence = evidence,
                index = index + 1,
                accentColor = accentFor(signal.trendDirection, colors),
            )
        }
    }
}

@Composable
private fun trendLabel(direction: TrendDirection): String = when (direction) {
    TrendDirection.RISING -> stringResource(R.string.signals_trend_rising)
    TrendDirection.STABLE -> stringResource(R.string.signals_trend_stable)
    TrendDirection.FALLING -> stringResource(R.string.signals_trend_falling)
}

private fun accentFor(direction: TrendDirection, colors: PuenteColors) =
    when (direction) {
        TrendDirection.RISING -> colors.indigo
        TrendDirection.STABLE -> colors.teal
        TrendDirection.FALLING -> colors.mint
    }

@Preview(name = "Señales", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 900)
@Composable
private fun SignalsPreview() {
    PuenteTheme {
        SignalsScreenContent(
            state = SignalsUiState(
                content = FeatureUiState.Content(
                    SignalsContent(
                        signals = listOf(
                            Signal(
                                key = SignalKey("ISOLATION"),
                                label = "Aislamiento",
                                trendPercent = 72,
                                trendDirection = TrendDirection.RISING,
                                evidence = listOf(
                                    SignalEvidence(
                                        id = SignalEvidenceId("ev-1"),
                                        signalKey = SignalKey("ISOLATION"),
                                        label = "Evita espacios compartidos",
                                        description = "Mejor solo en el aula.",
                                        dateLabel = "09 SEP",
                                        intensity = 2,
                                    ),
                                ),
                            ),
                        ),
                        outcome = RuleOutcome(
                            level = AttentionLevel.YELLOW,
                            motivoKeys = listOf("aislamiento_persistente"),
                            reason = LevelReason.CRITERION,
                            titleResId = R.string.attention_yellow_title,
                            explanationResId = R.string.attention_yellow_explanation,
                            whatChangedResId = R.string.attention_yellow_what_changed,
                            nextStepResId = R.string.attention_yellow_next_step,
                            evidence = emptyList(),
                        ),
                    ),
                ),
            ),
            onAction = {},
        )
    }
}
