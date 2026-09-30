package bo.puentejoven.feature.signals

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.designsystem.component.AttentionCard
import bo.puentejoven.core.designsystem.component.ErrorState
import bo.puentejoven.core.designsystem.component.EvidenceCard
import bo.puentejoven.core.designsystem.component.LoadingState
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.feature.signals.domain.AttentionRuleset
import bo.puentejoven.feature.signals.domain.LevelReason
import bo.puentejoven.feature.signals.domain.RuleOutcome

/**
 * Prioridad preliminar de revisión (brief §13).
 *
 * **Guardrail #1, la parte que más importa:** el nivel nunca se muestra solo. El
 * `AttentionCard` del design system incluye el encuadre obligatorio (*"Esta es una
 * prioridad preliminar de revisión, no un diagnóstico"* y *"Ninguna prioridad
 * reemplaza a una persona"*) y resuelve el color con texto e icono.
 *
 * **Lo que esta pantalla NO muestra, a propósito:** las claves de `motivo`
 * (`ideacion_activa`, `abuso`…). Son vocabulario para el equipo y viajan en el reporte
 * (`PR-003` §4); mostrárselas a un adolescente sería exactamente el lenguaje clínico
 * que `PR-001` §15 prohíbe. El joven ve **qué cambió y qué hacer**, no la etiqueta.
 */
@Composable
fun AttentionRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
    viewModel: AttentionViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                is SignalsEffect.Navigate -> navigator.navigateTo(effect.destination)
            }
        }
    }

    AttentionScreenContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: previews y pruebas de UI. */
@Composable
fun AttentionScreenContent(
    state: AttentionUiState,
    onAction: (AttentionUiAction) -> Unit,
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
                message = stringResource(R.string.attention_loading),
            )

            is FeatureUiState.Empty -> LoadingState(
                message = stringResource(R.string.attention_loading),
            )

            is FeatureUiState.Error -> ErrorState(
                title = stringResource(R.string.attention_error_title),
                message = stringResource(R.string.attention_error_body),
                retryLabel = stringResource(R.string.attention_retry),
            )

            is FeatureUiState.Content -> AttentionLoaded(
                outcome = content.data.outcome,
                onAction = onAction,
            )
        }
    }
}

@Composable
private fun AttentionLoaded(
    outcome: RuleOutcome,
    onAction: (AttentionUiAction) -> Unit,
) {
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

        AttentionCard(
            level = outcome.level,
            title = stringResource(outcome.titleResId),
            explanation = stringResource(outcome.explanationResId),
            whatChanged = stringResource(outcome.whatChangedResId),
            nextStep = stringResource(outcome.nextStepResId),
            isPreliminary = true,
        )

        Spacer(Modifier.height(spacing.md))

        // Por qué el motor llegó aquí, sin tecnicismos y sin claves de catálogo.
        Text(
            text = when (outcome.reason) {
                LevelReason.CRITERION -> stringResource(R.string.attention_reason_criterion)
                LevelReason.ACCUMULATION -> stringResource(R.string.attention_reason_accumulation)
                LevelReason.LATCHED_RED -> stringResource(R.string.attention_reason_latched_red)
                LevelReason.NOTHING -> stringResource(R.string.attention_green_what_changed)
            },
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink3,
        )

        Spacer(Modifier.height(spacing.lg))

        EvidenceBlock(outcome)

        // --- Bloque de emergencia: SOLO en rojo (PR-001 §9) ---
        if (outcome.level == AttentionLevel.RED) {
            Spacer(Modifier.height(spacing.lg))
            EmergencyBlock()
        }

        Spacer(Modifier.height(spacing.lg))

        if (outcome.level != AttentionLevel.GREEN) {
            PrimaryAction(
                text = stringResource(R.string.attention_open_support),
                onClick = { onAction(AttentionUiAction.OpenSupport) },
            )
            Spacer(Modifier.height(spacing.sm))
        }

        Text(
            text = stringResource(R.string.attention_ruleset_note, AttentionRuleset.VERSION),
            style = PuenteTheme.typography.MonoLabel,
            color = colors.ink4,
        )

        Spacer(Modifier.height(spacing.xxl))
    }
}

@Composable
private fun EvidenceBlock(outcome: RuleOutcome) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = stringResource(R.string.attention_evidence_title),
            style = MaterialTheme.typography.titleSmall,
            color = colors.ink1,
        )
        Spacer(Modifier.height(spacing.xs))

        if (outcome.evidence.isEmpty()) {
            // Honestidad: si no hay registros que enseñar, se dice. No se rellena con
            // ejemplos ni con texto genérico.
            Text(
                text = stringResource(R.string.attention_evidence_empty),
                style = MaterialTheme.typography.bodySmall,
                color = colors.ink3,
            )
        } else {
            outcome.evidence.forEachIndexed { index, evidence ->
                EvidenceCard(
                    evidence = evidence,
                    index = index + 1,
                    accentColor = colors.attentionColor(outcome.level),
                )
            }
        }
    }
}

/**
 * Qué hacer ahora, en rojo (`PR-001` §9, filas «Rojo» y «Fuera de horario»).
 *
 * **Dos decisiones de honestidad, y las dos importan:**
 *
 * 1. **No hay teléfonos de crisis.** Inventar un número de ayuda sería el peor fallo
 *    posible de esta pantalla. Mientras la ONG no los configure, se dice que no están
 *    configurados, y se dan instrucciones que sí son ciertas sin ellos.
 * 2. **No se promete contacto inmediato.** Q8 de `PR-003` resolvió que **no hay
 *    guardia 24/7**: `PR-001` P5 prohíbe prometer una respuesta que no existe, y
 *    `PR-003` §15 avisa de que una pantalla de «estamos contigo» sin nadie detrás es
 *    peor que no mostrarla.
 */
@Composable
private fun EmergencyBlock() {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val shape = RoundedCornerShape(PuenteTheme.radius.lg)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.attentionContainer(AttentionLevel.RED))
            .border(1.dp, colors.attentionBorder(AttentionLevel.RED), shape)
            .padding(spacing.lg),
    ) {
        Text(
            text = stringResource(R.string.attention_emergency_title),
            style = MaterialTheme.typography.titleSmall,
            color = colors.attentionInk(AttentionLevel.RED),
        )
        Spacer(Modifier.height(spacing.xs))
        Text(
            text = stringResource(R.string.attention_emergency_body),
            style = MaterialTheme.typography.bodyMedium,
            color = colors.ink1,
        )
        Spacer(Modifier.height(spacing.xs))
        Text(
            text = stringResource(R.string.attention_emergency_contacts_pending),
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink4,
        )
        Spacer(Modifier.height(spacing.sm))
        Text(
            text = stringResource(R.string.attention_coverage_note),
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink3,
        )
    }
}

@Preview(name = "Prioridad — amarillo", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 900)
@Composable
private fun AttentionYellowPreview() {
    PuenteTheme {
        AttentionScreenContent(
            state = AttentionUiState(
                content = FeatureUiState.Content(
                    AttentionContent(
                        RuleOutcome(
                            level = AttentionLevel.YELLOW,
                            motivoKeys = listOf("violencia_no_inmediata"),
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

@Preview(name = "Prioridad — rojo", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 900)
@Composable
private fun AttentionRedPreview() {
    PuenteTheme {
        AttentionScreenContent(
            state = AttentionUiState(
                content = FeatureUiState.Content(
                    AttentionContent(
                        RuleOutcome(
                            level = AttentionLevel.RED,
                            motivoKeys = listOf("peligro_inmediato"),
                            reason = LevelReason.CRITERION,
                            titleResId = R.string.attention_red_title,
                            explanationResId = R.string.attention_red_explanation,
                            whatChangedResId = R.string.attention_red_what_changed,
                            nextStepResId = R.string.attention_red_next_step,
                            evidence = emptyList(),
                        ),
                    ),
                ),
            ),
            onAction = {},
        )
    }
}
