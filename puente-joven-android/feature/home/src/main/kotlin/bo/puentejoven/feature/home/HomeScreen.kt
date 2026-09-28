package bo.puentejoven.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
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
import bo.puentejoven.core.designsystem.component.PuenteOrb
import bo.puentejoven.core.designsystem.component.ResourceCard
import bo.puentejoven.core.designsystem.shape.PuenteShapes
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AccentKey
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.BriefTool
import bo.puentejoven.core.model.ProfileId
import bo.puentejoven.core.model.ToolKey
import bo.puentejoven.core.model.YouthAlias
import bo.puentejoven.core.model.YouthProfile
import bo.puentejoven.core.navigation.AppNavigator

/**
 * Home del joven.
 *
 * Traduce la intención de `HomeJoven.tsx` a teléfono Android:
 * 1. saludo personalizado en Fraunces,
 * 2. módulo principal "Me está pasando algo" sobre gradiente índigo con el orbe,
 * 3. bloque "Quiero ayudar a alguien" en teal,
 * 4. rejilla secundaria (recorrido en oscuro + señales en claro),
 * 5. recursos para hoy en carrusel horizontal,
 * 6. recordatorio de privacidad.
 *
 * Guardrail #6: ninguna tarjeta ni destino lleva a una superficie profesional.
 */
@Composable
fun HomeScreen(
    navigator: AppNavigator,
    modifier: Modifier = Modifier,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                is HomeEffect.Navigate -> navigator.navigateTo(effect.destination)
            }
        }
    }

    HomeScreenContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: previews y pruebas de UI. */
@Composable
fun HomeScreenContent(
    state: HomeUiState,
    onAction: (HomeUiAction) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg),
    ) {
        when (val content = state.content) {
            is FeatureUiState.Loading -> LoadingState()

            is FeatureUiState.Empty -> EmptyState(
                title = "Todavía no hay nada registrado.",
                message = "Cuando quieras, puedes empezar a contarlo como quieras.",
                actionLabel = "Empezar",
                onAction = { onAction(HomeUiAction.StartConversation) },
            )

            is FeatureUiState.Error -> ErrorState(
                title = "No pudimos abrir tu espacio.",
                message = "Puedes intentarlo otra vez. Nada de lo que escribiste se perdió.",
                onRetry = { onAction(HomeUiAction.Retry) },
            )

            is FeatureUiState.Content -> HomeLoaded(
                content = content.data,
                onAction = onAction,
            )
        }
    }
}

@Composable
private fun HomeLoaded(
    content: HomeContent,
    onAction: (HomeUiAction) -> Unit,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .statusBarsPadding(),
    ) {
        // --- Forma ambiental ---
        Box(
            modifier = Modifier
                .offset(x = 200.dp, y = (-60).dp)
                .size(180.dp)
                .clip(PuenteShapes.Blob1)
                .background(colors.ambientBrush)
                .alpha(0.06f),
        )

        Column(modifier = Modifier.padding(horizontal = spacing.screenHorizontal)) {
            Spacer(Modifier.height(spacing.md))

            // --- Saludo + avatar ---
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column {
                    Text(
                        text = "${content.greeting},",
                        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                        color = colors.ink4,
                    )
                    Text(
                        text = "${content.profile.alias.value}.",
                        style = androidx.compose.material3.MaterialTheme.typography.headlineLarge,
                        color = colors.ink1,
                        modifier = Modifier.semantics { heading() },
                    )
                }
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(colors.surface2),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Person,
                        contentDescription = null,
                        tint = colors.ink4,
                        modifier = Modifier.size(16.dp),
                    )
                }
            }

            Spacer(Modifier.height(spacing.xl))

            // --- Titular editorial del día ---
            EditorialHeader(
                label = "Hoy",
                titleLines = listOf("Estoy aquí", "contigo."),
                accentLastLine = true,
            )
            Spacer(Modifier.height(spacing.xxs))
            Text(
                text = "¿Qué necesitas hoy?",
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink3,
            )

            Spacer(Modifier.height(spacing.lg))
        }

        // --- Módulo principal "Me está pasando algo" ---
        MainModule(
            onTell = { onAction(HomeUiAction.StartConversation) },
            modifier = Modifier.padding(horizontal = spacing.md),
        )

        Spacer(Modifier.height(spacing.md))

        // --- "Quiero ayudar a alguien" ---
        HelpSomeoneCard(
            onClick = { onAction(HomeUiAction.OpenHelpSomeone) },
            modifier = Modifier.padding(horizontal = spacing.md),
        )

        Spacer(Modifier.height(spacing.sm))

        // --- Rejilla secundaria ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = spacing.md),
            horizontalArrangement = Arrangement.spacedBy(spacing.sm),
        ) {
            JourneyTile(
                onClick = { onAction(HomeUiAction.OpenJourney) },
                modifier = Modifier.weight(1f),
            )
            SignalsTile(
                label = content.signalSummaryLabel,
                onClick = { onAction(HomeUiAction.OpenSignals) },
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(spacing.lg))

        // --- Recursos para hoy ---
        if (content.tools.isNotEmpty()) {
            Column(modifier = Modifier.padding(horizontal = spacing.md)) {
                Text(
                    text = "RECURSOS PARA HOY",
                    style = PuenteTheme.typography.MonoLabel,
                    color = colors.ink4,
                    modifier = Modifier.padding(bottom = spacing.xs),
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(spacing.xs)) {
                    items(items = content.tools, key = { it.key }) { tool ->
                        ResourceCard(
                            label = tool.label,
                            duration = tool.durationLabel,
                            emoji = emojiFor(tool),
                            onClick = { onAction(HomeUiAction.OpenTool(tool.key.value)) },
                            accentColor = accentFor(tool, colors.indigo, colors.lavender, colors.teal),
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(spacing.lg))

        // --- Recordatorio de privacidad ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = spacing.md),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(colors.teal),
            )
            Spacer(Modifier.size(spacing.xs))
            Text(
                text = "Tú decides qué compartir.",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
        }

        Spacer(Modifier.height(spacing.xxl))
    }
}

/**
 * Módulo principal con gradiente índigo, orbe y llamada a la conversación.
 * Replica `HomeJoven.tsx` → "ME ESTÁ PASANDO ALGO".
 */
@Composable
private fun MainModule(
    onTell: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val shape = RoundedCornerShape(PuenteTheme.radius.xl)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.heroBrush),
    ) {
        // Decoración orgánica interna
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 40.dp, y = (-40).dp)
                .size(150.dp)
                .clip(PuenteShapes.Blob1)
                .background(colors.lavender)
                .alpha(0.15f),
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .offset(x = (-30).dp, y = 20.dp)
                .size(90.dp)
                .clip(PuenteShapes.Blob2)
                .background(colors.mint)
                .alpha(0.10f),
        )

        Column(modifier = Modifier.padding(spacing.xl)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = "ME ESTÁ PASANDO ALGO",
                    style = PuenteTheme.typography.MonoLabel,
                    color = Color.White.copy(alpha = 0.55f),
                )
                PuenteOrb(size = 36.dp)
            }

            Spacer(Modifier.height(spacing.md))

            Text(
                text = "Puedes contarlo como quieras.\nNo hay respuestas correctas o incorrectas.",
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.80f),
            )

            Spacer(Modifier.height(spacing.lg))

            // Área de entrada translúcida (MVP: bg-white/10 + blur + border-white/20)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(PuenteTheme.radius.md))
                    .background(Color.White.copy(alpha = 0.10f))
                    .border(
                        1.dp,
                        Color.White.copy(alpha = 0.20f),
                        RoundedCornerShape(PuenteTheme.radius.md),
                    )
                    .padding(spacing.xs),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f).padding(horizontal = spacing.xs)) {
                    Text(
                        text = "HOY…",
                        style = PuenteTheme.typography.MonoLabel,
                        color = Color.White.copy(alpha = 0.40f),
                    )
                    Spacer(Modifier.height(spacing.xxs))
                    Text(
                        text = "Empieza con lo que tengas…",
                        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.45f),
                    )
                }
                PrimaryAction(
                    text = "Contarlo",
                    onClick = onTell,
                    onDarkSurface = true,
                    fullWidth = false,
                    shape = RoundedCornerShape(PuenteTheme.radius.sm),
                )
            }
        }
    }
}

@Composable
private fun HelpSomeoneCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val shape = RoundedCornerShape(PuenteTheme.radius.lg)

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(colors.surface0)
            .border(1.dp, colors.surface2, shape)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(spacing.lg),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(spacing.md),
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(PuenteShapes.Blob3)
                .background(colors.tealBrush),
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "QUIERO AYUDAR A ALGUIEN",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xxs))
            Text(
                text = "Alguien confió en mí y quiero saber qué hacer.",
                style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
                color = colors.ink1,
            )
        }
        Icon(
            imageVector = Icons.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = colors.ink4,
        )
    }
}

@Composable
private fun JourneyTile(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val shape = RoundedCornerShape(PuenteTheme.radius.lg)

    Column(
        modifier = modifier
            .clip(shape)
            .background(colors.darkSurfaceBg)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(spacing.lg),
    ) {
        Spacer(Modifier.height(spacing.xl))
        Text(
            text = "MI RECORRIDO",
            style = PuenteTheme.typography.MonoLabel,
            color = colors.deepMuted,
        )
        Spacer(Modifier.height(spacing.xxs))
        Text(
            text = "Ver lo que ha ido cambiando",
            style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
            color = Color.White,
        )
    }
}

@Composable
private fun SignalsTile(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    val shape = RoundedCornerShape(PuenteTheme.radius.lg)

    Column(
        modifier = modifier
            .clip(shape)
            .background(colors.surface0)
            .border(1.dp, colors.surface2, shape)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(spacing.lg),
    ) {
        Spacer(Modifier.height(spacing.xl))
        Text(
            text = "PUENTE SEÑALES",
            style = PuenteTheme.typography.MonoLabel,
            color = colors.ink4,
        )
        Spacer(Modifier.height(spacing.xxs))
        Text(
            text = label,
            style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
            color = colors.ink1,
        )
    }
}

private fun emojiFor(tool: BriefTool): String = when (tool.key.value) {
    "breathe" -> "🌬️"
    "write" -> "✍️"
    "listen" -> "🎵"
    else -> "•"
}

private fun accentFor(
    tool: BriefTool,
    indigo: Color,
    lavender: Color,
    teal: Color,
): Color = when (tool.accentKey.value) {
    "lavender" -> lavender
    "teal" -> teal
    else -> indigo
}

@Preview(name = "Home — compacto", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 900)
@Composable
private fun HomeScreenPreview() {
    PuenteTheme {
        HomeScreenContent(
            state = HomeUiState(
                content = FeatureUiState.Content(
                    HomeContent(
                        profile = YouthProfile(
                            id = ProfileId("demo"),
                            alias = YouthAlias("Alex"),
                            ageBand = AgeBand.MID_TEEN,
                            createdAtEpochMillis = 0L,
                        ),
                        greeting = "Hola",
                        hasSignalsToReview = true,
                        signalSummaryLabel = "Hay algo que cambió",
                        tools = listOf(
                            BriefTool(ToolKey("breathe"), "Respirar", "2 min", "Una pausa corta.", AccentKey("indigo")),
                            BriefTool(ToolKey("write"), "Escribir", "5 min", "Poner en palabras.", AccentKey("lavender")),
                            BriefTool(ToolKey("listen"), "Escuchar", "3 min", "Calma sonora.", AccentKey("teal")),
                        ),
                    ),
                ),
            ),
            onAction = {},
        )
    }
}
