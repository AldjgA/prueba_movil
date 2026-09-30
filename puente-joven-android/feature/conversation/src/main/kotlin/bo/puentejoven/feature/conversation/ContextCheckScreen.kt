package bo.puentejoven.feature.conversation

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
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.designsystem.component.EditorialHeader
import bo.puentejoven.core.designsystem.component.EmptyState
import bo.puentejoven.core.designsystem.component.ErrorState
import bo.puentejoven.core.designsystem.component.LoadingState
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.PuenteButtonState
import bo.puentejoven.core.designsystem.component.SignalChip
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.CheckCatalog
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.feature.conversation.domain.GuidedScriptCatalog

/**
 * Chequeo contextual (brief §9).
 *
 * Se muestra **una pregunta cada vez** y nunca un cuestionario completo: el brief §9
 * pide explorar por partes y con chips, no con un formulario clínico.
 *
 * Esta pantalla **no** dice al joven qué nivel tiene. El cálculo es `TASK-005`.
 */
@Composable
fun ContextCheckRoute(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
    viewModel: ContextCheckViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    ContextCheckScreenContent(
        state = state,
        onAction = viewModel::onAction,
        onBack = { navigator.navigateBack() },
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: previews y pruebas de UI. */
@Composable
fun ContextCheckScreenContent(
    state: ContextCheckUiState,
    onAction: (ContextCheckUiAction) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg),
    ) {
        when (val content = state.content) {
            is FeatureUiState.Loading -> LoadingState(
                message = stringResource(R.string.check_loading),
            )

            is FeatureUiState.Empty -> EmptyState(
                title = stringResource(R.string.check_empty),
                message = stringResource(R.string.check_empty_hint),
                actionLabel = stringResource(R.string.check_done_action),
                onAction = onBack,
            )

            is FeatureUiState.Error -> ErrorState(
                title = stringResource(R.string.check_error_title),
                message = stringResource(R.string.check_error_body),
                retryLabel = stringResource(R.string.check_retry),
                onRetry = { onAction(ContextCheckUiAction.DismissSaveError) },
            )

            is FeatureUiState.Content -> if (content.data.isFinished) {
                CheckFinished(onBack = onBack)
            } else {
                CheckQuestionView(
                    content = content.data,
                    state = state,
                    onAction = onAction,
                    onBack = onBack,
                )
            }
        }
    }
}

@Composable
private fun CheckQuestionView(
    content: ContextCheckContent,
    state: ContextCheckUiState,
    onAction: (ContextCheckUiAction) -> Unit,
    onBack: () -> Unit,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val question = content.question ?: return

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = spacing.screenHorizontal),
    ) {
        Spacer(Modifier.height(spacing.md))

        EditorialHeader(
            label = stringResource(R.string.check_title),
            titleLines = listOf(
                stringResource(
                    R.string.check_progress,
                    content.decidedCount + 1,
                    content.totalCount,
                ),
            ),
        )

        Spacer(Modifier.height(spacing.xl))

        Text(
            text = stringResource(question.promptResId),
            style = MaterialTheme.typography.headlineSmall,
            color = colors.ink1,
            modifier = Modifier.semantics { heading() },
        )

        Spacer(Modifier.height(spacing.lg))

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(spacing.xs),
        ) {
            question.options.forEach { option ->
                SignalChip(
                    label = stringResource(option.labelResId),
                    selected = option.key in state.selectedOptions,
                    onClick = {
                        if (question.isMultiSelect) {
                            // Selección múltiple: se marca y se confirma aparte, porque
                            // el joven puede elegir más de una emoción.
                            onAction(ContextCheckUiAction.ToggleOption(option.key))
                        } else {
                            onAction(
                                ContextCheckUiAction.Decide(
                                    questionKey = question.key,
                                    optionKeys = setOf(option.key),
                                ),
                            )
                        }
                    },
                    // «Prefiero no responder» se distingue del resto para que saltar
                    // sea una opción visible y no un gesto escondido.
                    accentColor = if (option.key == CheckCatalog.OPTION_SKIP) {
                        colors.ink4
                    } else {
                        colors.indigo
                    },
                )
            }
        }

        if (question.isMultiSelect) {
            Spacer(Modifier.height(spacing.xs))
            Text(
                text = stringResource(R.string.check_multi_select_hint),
                style = MaterialTheme.typography.bodySmall,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))
            PrimaryAction(
                text = stringResource(R.string.check_confirm),
                onClick = {
                    onAction(
                        ContextCheckUiAction.Decide(
                            questionKey = question.key,
                            optionKeys = state.selectedOptions,
                        ),
                    )
                },
                state = if (state.selectedOptions.isEmpty()) {
                    PuenteButtonState.Disabled
                } else {
                    PuenteButtonState.Enabled
                },
            )
        }

        if (state.saveError != null) {
            Spacer(Modifier.height(spacing.md))
            Text(
                text = stringResource(R.string.check_save_error),
                style = MaterialTheme.typography.bodySmall,
                color = colors.red,
            )
        }

        Spacer(Modifier.height(spacing.xl))

        PrimaryAction(
            text = stringResource(R.string.check_back_to_conversation),
            onClick = onBack,
        )

        Spacer(Modifier.height(spacing.xl))
    }
}

@Composable
private fun CheckFinished(onBack: () -> Unit) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = spacing.screenHorizontal),
        verticalArrangement = Arrangement.Center,
    ) {
        EditorialHeader(
            label = stringResource(R.string.check_title),
            titleLines = listOf(stringResource(R.string.check_done_title)),
        )
        Spacer(Modifier.height(spacing.md))
        Text(
            text = stringResource(R.string.check_done_body),
            style = MaterialTheme.typography.bodyMedium,
            color = colors.ink2,
        )
        Spacer(Modifier.height(spacing.xl))
        PrimaryAction(
            text = stringResource(R.string.check_done_action),
            onClick = onBack,
        )
    }
}

@Preview(name = "Chequeo — pregunta", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 720)
@Composable
private fun CheckQuestionPreview() {
    PuenteTheme {
        ContextCheckScreenContent(
            state = ContextCheckUiState(
                content = FeatureUiState.Content(
                    ContextCheckContent(
                        question = GuidedScriptCatalog.questions[1],
                        decidedCount = 1,
                        totalCount = GuidedScriptCatalog.questions.size,
                    ),
                ),
            ),
            onAction = {},
            onBack = {},
        )
    }
}

@Preview(name = "Chequeo — terminado", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 720)
@Composable
private fun CheckFinishedPreview() {
    PuenteTheme {
        ContextCheckScreenContent(
            state = ContextCheckUiState(
                content = FeatureUiState.Content(
                    ContextCheckContent(
                        question = null,
                        decidedCount = GuidedScriptCatalog.questions.size,
                        totalCount = GuidedScriptCatalog.questions.size,
                    ),
                ),
            ),
            onAction = {},
            onBack = {},
        )
    }
}
