package bo.puentejoven.feature.conversation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.res.stringResource
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
import bo.puentejoven.core.designsystem.component.PuenteOrb
import bo.puentejoven.core.designsystem.component.SecondaryAction
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.ConversationMessage
import bo.puentejoven.core.model.ConversationRole
import bo.puentejoven.core.model.MessageId
import bo.puentejoven.core.navigation.AppNavigator

/**
 * Pantalla de conversación estructurada (Ruta A).
 *
 * Guardrail #3: **no hay chat generativo**. Los turnos de Puente que aparecen aquí
 * salieron del guion por reglas (`GuidedScriptCatalog`) y quedaron persistidos con
 * su `promptId`. Esta pantalla no genera nada.
 */
@Composable
fun ConversationScreen(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
    viewModel: ConversationViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                is ConversationEffect.Navigate -> navigator.navigateTo(effect.destination)
            }
        }
    }

    ConversationScreenContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: previews y pruebas de UI. */
@Composable
fun ConversationScreenContent(
    state: ConversationUiState,
    onAction: (ConversationUiAction) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg),
    ) {
        if (state.showTransparency) {
            TransparencyGate(onAccept = { onAction(ConversationUiAction.AcknowledgeTransparency) })
            return@Box
        }

        when (val content = state.content) {
            is FeatureUiState.Loading -> LoadingState(
                message = stringResource(R.string.conversation_loading),
            )

            is FeatureUiState.Empty -> EmptyState(
                title = stringResource(R.string.conversation_empty),
                message = stringResource(R.string.conversation_empty_hint),
            )

            is FeatureUiState.Error -> ErrorState(
                title = stringResource(R.string.conversation_error_title),
                message = stringResource(R.string.conversation_error_body),
                retryLabel = stringResource(R.string.conversation_retry),
                onRetry = { onAction(ConversationUiAction.Retry) },
            )

            is FeatureUiState.Content -> ConversationLoaded(
                content = content.data,
                state = state,
                onAction = onAction,
            )
        }
    }
}

/**
 * Encuadre de transparencia (brief §7, etapa 1) + límites honestos.
 *
 * Los límites se declaran **antes** de empezar y en el mismo sitio: `PR-001` P5
 * prohíbe prometer lo que el sistema no puede dar.
 */
@Composable
private fun TransparencyGate(onAccept: () -> Unit) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = spacing.screenHorizontal)
            .padding(vertical = spacing.xl),
        verticalArrangement = Arrangement.Center,
    ) {
        PuenteOrb(size = 64.dp)
        Spacer(Modifier.height(spacing.xl))

        EditorialHeader(
            label = stringResource(R.string.conversation_transparency_label),
            titleLines = listOf(
                stringResource(R.string.conversation_transparency_line1),
                stringResource(R.string.conversation_transparency_line2),
            ),
        )

        Spacer(Modifier.height(spacing.lg))
        Text(
            text = stringResource(R.string.conversation_transparency_body),
            style = MaterialTheme.typography.bodyMedium,
            color = colors.ink2,
        )
        Spacer(Modifier.height(spacing.md))
        Text(
            text = stringResource(R.string.conversation_transparency_limits),
            style = MaterialTheme.typography.bodySmall,
            color = colors.ink4,
        )

        Spacer(Modifier.height(spacing.xl))
        PrimaryAction(
            text = stringResource(R.string.conversation_transparency_accept),
            onClick = onAccept,
        )
    }
}

@Composable
private fun ConversationLoaded(
    content: ConversationContent,
    state: ConversationUiState,
    onAction: (ConversationUiAction) -> Unit,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val listState = rememberLazyListState()

    // Acompaña al último turno: sin esto, el joven escribe y no ve su propio mensaje.
    LaunchedEffect(content.messages.size) {
        if (content.messages.isNotEmpty()) {
            listState.animateScrollToItem(content.messages.lastIndex)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .imePadding(),
    ) {
        Column(modifier = Modifier.padding(horizontal = spacing.screenHorizontal)) {
            Spacer(Modifier.height(spacing.md))
            EditorialHeader(
                label = stringResource(R.string.conversation_title),
                titleLines = listOf(stringResource(R.string.conversation_headline)),
                trailing = { PuenteOrb(size = 32.dp) },
            )
            Spacer(Modifier.height(spacing.sm))
        }

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                horizontal = spacing.screenHorizontal,
                vertical = spacing.sm,
            ),
            verticalArrangement = Arrangement.spacedBy(spacing.xs),
        ) {
            items(items = content.messages, key = { it.id.value }) { message ->
                MessageBubble(message = message)
            }
        }

        if (state.sendError != null) {
            Text(
                text = stringResource(R.string.conversation_send_error),
                style = MaterialTheme.typography.bodySmall,
                color = colors.red,
                modifier = Modifier.padding(horizontal = spacing.screenHorizontal),
            )
            Spacer(Modifier.height(spacing.xs))
        }

        Column(modifier = Modifier.padding(horizontal = spacing.screenHorizontal)) {
            OutlinedTextField(
                value = state.draft,
                onValueChange = { onAction(ConversationUiAction.DraftChanged(it)) },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text(stringResource(R.string.conversation_input_hint)) },
                enabled = !state.isSending,
                maxLines = 4,
            )
            Spacer(Modifier.height(spacing.xs))
            PrimaryAction(
                text = stringResource(R.string.conversation_send),
                onClick = { onAction(ConversationUiAction.Send) },
                state = when {
                    state.isSending -> PuenteButtonState.Loading
                    state.canSend -> PuenteButtonState.Enabled
                    else -> PuenteButtonState.Disabled
                },
            )

            if (content.canContinueToCheck) {
                Spacer(Modifier.height(spacing.xs))
                SecondaryAction(
                    text = stringResource(R.string.conversation_continue_check),
                    onClick = { onAction(ConversationUiAction.OpenContextCheck) },
                )
            }
            Spacer(Modifier.height(spacing.md))
        }
    }
}

/**
 * Burbuja de un turno.
 *
 * El turno de Puente se marca como tal con **etiqueta de texto**, no solo con color
 * ni posición: la identidad del interlocutor no puede depender del estilo.
 */
@Composable
private fun MessageBubble(message: ConversationMessage) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val isYouth = message.role == ConversationRole.YOUTH

    val bubbleColor = if (isYouth) colors.indigoSoft else colors.surface1
    val textColor = if (isYouth) colors.ink1 else colors.ink1
    val shape = RoundedCornerShape(
        topStart = PuenteTheme.radius.md,
        topEnd = PuenteTheme.radius.md,
        bottomStart = if (isYouth) PuenteTheme.radius.md else PuenteTheme.radius.xs,
        bottomEnd = if (isYouth) PuenteTheme.radius.xs else PuenteTheme.radius.md,
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isYouth) Alignment.End else Alignment.Start,
    ) {
        Text(
            text = stringResource(
                if (isYouth) R.string.conversation_author_label else R.string.conversation_puente_label,
            ),
            style = PuenteTheme.typography.MonoLabel,
            color = colors.ink4,
        )
        Spacer(Modifier.height(spacing.xxs))
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(shape)
                .background(bubbleColor)
                .border(1.dp, colors.surface2, shape)
                .padding(spacing.sm),
        ) {
            Text(
                text = message.content,
                style = MaterialTheme.typography.bodyMedium,
                color = textColor,
            )
        }
    }
}

@Preview(name = "Conversación — transparencia", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 780)
@Composable
private fun TransparencyPreview() {
    PuenteTheme {
        ConversationScreenContent(
            state = ConversationUiState(showTransparency = true),
            onAction = {},
        )
    }
}

@Preview(name = "Conversación — con turnos", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 780)
@Composable
private fun ConversationPreview() {
    PuenteTheme {
        ConversationScreenContent(
            state = ConversationUiState(
                showTransparency = false,
                draft = "Desde que mis papás se separaron…",
                content = FeatureUiState.Content(
                    ConversationContent(
                        conversationId = "conv-1",
                        messages = listOf(
                            ConversationMessage(
                                id = MessageId("m1"),
                                role = ConversationRole.PUENTE,
                                content = "Puedes empezar por lo que pasó hoy.",
                                createdAtEpochMillis = 0L,
                                promptId = "conversation.opening",
                            ),
                            ConversationMessage(
                                id = MessageId("m2"),
                                role = ConversationRole.YOUTH,
                                content = "Desde que mis papás se separaron unos compañeros se ríen de mí.",
                                createdAtEpochMillis = 1L,
                            ),
                        ),
                        canContinueToCheck = true,
                    ),
                ),
            ),
            onAction = {},
        )
    }
}
