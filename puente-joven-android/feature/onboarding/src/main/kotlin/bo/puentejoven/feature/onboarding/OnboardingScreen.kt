package bo.puentejoven.feature.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.PuenteButtonState
import bo.puentejoven.core.designsystem.component.PuenteOrb
import bo.puentejoven.core.designsystem.component.PuenteSwitch
import bo.puentejoven.core.designsystem.theme.PuenteTheme

/**
 * Onboarding: encuadre, privacidad y expectativas.
 *
 * Redactado en segunda persona, sin jerga clínica. Cada paso declara de forma
 * explícita los límites del producto (guardrails #2, #3, #4).
 */
@Composable
fun OnboardingScreen(
    onFinished: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: OnboardingViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                OnboardingEffect.Finished -> onFinished()
            }
        }
    }

    OnboardingScreenContent(
        state = state,
        onAction = viewModel::onAction,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel, reutilizable en previews y pruebas de UI. */
@Composable
fun OnboardingScreenContent(
    state: OnboardingUiState,
    onAction: (OnboardingUiAction) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg)
            .statusBarsPadding(),
    ) {
        // --- Barra de progreso + volver ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = spacing.md, vertical = spacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(
                onClick = { onAction(OnboardingUiAction.Back) },
                enabled = state.step.ordinal > 0,
                modifier = Modifier.semantics { contentDescription = "Paso anterior" },
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = null,
                    tint = if (state.step.ordinal > 0) colors.ink3 else colors.surface2,
                )
            }
            Spacer(Modifier.width(spacing.xs))
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(PuenteTheme.radius.pill))
                    .background(colors.surface2),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(state.progress)
                        .height(4.dp)
                        .clip(RoundedCornerShape(PuenteTheme.radius.pill))
                        .background(colors.primaryActionBrush),
                )
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = spacing.screenHorizontalWide),
        ) {
            Spacer(Modifier.height(spacing.lg))

            when (state.step) {
                OnboardingStep.FRAMING -> FramingStep(
                    acknowledged = state.acknowledgedFraming,
                    onAcknowledge = { onAction(OnboardingUiAction.FramingAcknowledged(it)) },
                )

                OnboardingStep.PRIVACY -> PrivacyStep(
                    acknowledged = state.acknowledgedPrivacy,
                    onAcknowledge = { onAction(OnboardingUiAction.PrivacyAcknowledged(it)) },
                )

                OnboardingStep.EXPECTATIONS -> ExpectationsStep()
            }

            Spacer(Modifier.height(spacing.xxl))
        }

        // --- Acciones ---
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(horizontal = spacing.screenHorizontalWide, vertical = spacing.md),
        ) {
            PrimaryAction(
                text = if (state.step.isLast) "Entrar a mi espacio" else "Continuar",
                onClick = {
                    if (state.step.isLast) {
                        onAction(OnboardingUiAction.Finish)
                    } else {
                        onAction(OnboardingUiAction.Next)
                    }
                },
                state = when {
                    state.isFinishing -> PuenteButtonState.Loading
                    !state.canAdvance -> PuenteButtonState.Disabled
                    else -> PuenteButtonState.Enabled
                },
            )
        }
    }
}

@Composable
private fun FramingStep(
    acknowledged: Boolean,
    onAcknowledge: (Boolean) -> Unit,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    PuenteOrb(size = 56.dp)

    Spacer(Modifier.height(spacing.lg))

    Text(
        text = "QUÉ ES PUENTE",
        style = PuenteTheme.typography.MonoLabel,
        color = colors.ink4,
    )
    Spacer(Modifier.height(spacing.xs))
    Text(
        text = "Te acompaña a ordenar\nlo que estás viviendo.",
        style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
        color = colors.ink1,
        modifier = Modifier.semantics { heading() },
    )
    Spacer(Modifier.height(spacing.md))
    Text(
        text = "Puente es una guía estructurada. Te hace preguntas, registra lo que " +
            "cuentas y te muestra cambios con el tiempo. Si en algún momento hace " +
            "falta una persona, te ayuda a pedir apoyo humano.",
        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
        color = colors.ink2,
    )

    Spacer(Modifier.height(spacing.lg))

    Text(
        text = "QUÉ NO ES PUENTE",
        style = PuenteTheme.typography.MonoLabel,
        color = colors.ink4,
    )
    Spacer(Modifier.height(spacing.xs))
    listOf(
        "No es terapia ni reemplaza a un profesional.",
        "No diagnostica. Los colores solo indican prioridad preliminar de revisión.",
        "No es un chatbot abierto: las conversaciones siguen un guion pensado.",
        "No decide por ti: siempre puedes elegir no compartir.",
    ).forEach { line ->
        Row(
            modifier = Modifier.padding(vertical = spacing.xxs),
            verticalAlignment = Alignment.Top,
        ) {
            Box(
                modifier = Modifier
                    .padding(top = 8.dp)
                    .size(5.dp)
                    .clip(RoundedCornerShape(PuenteTheme.radius.pill))
                    .background(colors.indigo),
            )
            Spacer(Modifier.width(spacing.xs))
            Text(
                text = line,
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = colors.ink3,
            )
        }
    }

    Spacer(Modifier.height(spacing.lg))

    PuenteSwitch(
        checked = acknowledged,
        onCheckedChange = onAcknowledge,
        label = "Entiendo qué es Puente y qué no es.",
    )
}

@Composable
private fun PrivacyStep(
    acknowledged: Boolean,
    onAcknowledge: (Boolean) -> Unit,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Text(
        text = "TU PRIVACIDAD",
        style = PuenteTheme.typography.MonoLabel,
        color = colors.ink4,
    )
    Spacer(Modifier.height(spacing.xs))
    Text(
        text = "Lo que cuentas\nse queda contigo.",
        style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
        color = colors.ink1,
        modifier = Modifier.semantics { heading() },
    )
    Spacer(Modifier.height(spacing.md))
    Text(
        text = "Tus conversaciones se guardan cifradas en este teléfono. Nadie las lee " +
            "por defecto. Si algún día pides apoyo humano, tú eliges exactamente qué " +
            "se comparte y qué no.",
        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
        color = colors.ink2,
    )

    Spacer(Modifier.height(spacing.lg))

    HomeInfoRow(
        title = "Local y cifrado",
        detail = "El chat vive en tu dispositivo, protegido con cifrado local.",
    )
    HomeInfoRow(
        title = "Tú decides qué compartir",
        detail = "Antes de enviar nada, ves un resumen y puedes quitar lo que quieras.",
    )
    HomeInfoRow(
        title = "Nombre no obligatorio",
        detail = "Usas un alias. No necesitas dar tu nombre real ni tus datos.",
    )

    Spacer(Modifier.height(spacing.lg))

    PuenteSwitch(
        checked = acknowledged,
        onCheckedChange = onAcknowledge,
        label = "Entiendo cómo se guardan mis datos.",
    )
}

@Composable
private fun ExpectationsStep() {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Text(
        text = "CÓMO FUNCIONA",
        style = PuenteTheme.typography.MonoLabel,
        color = colors.ink4,
    )
    Spacer(Modifier.height(spacing.xs))
    Text(
        text = "Tres pasos,\nsin apuro.",
        style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
        color = colors.ink1,
        modifier = Modifier.semantics { heading() },
    )

    Spacer(Modifier.height(spacing.lg))

    HomeStepRow(1, "Contarlo", "Empiezas por donde quieras, con tus palabras.")
    HomeStepRow(2, "Ver qué cambió", "Puente te muestra repeticiones y cambios en el tiempo.")
    HomeStepRow(3, "Decidir el paso", "Herramientas breves y, si quieres, pedir apoyo humano.")

    Spacer(Modifier.height(spacing.lg))

    Text(
        text = "Verde, amarillo y rojo son prioridades preliminares de revisión, " +
            "no diagnósticos. Siempre van acompañados de una explicación.",
        style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
        color = colors.ink3,
    )
}

@Composable
private fun HomeInfoRow(title: String, detail: String) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = spacing.xs)
            .clip(RoundedCornerShape(PuenteTheme.radius.md))
            .background(colors.surface0)
            .padding(spacing.md),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .padding(top = 6.dp)
                .size(8.dp)
                .clip(RoundedCornerShape(PuenteTheme.radius.pill))
                .background(colors.teal),
        )
        Spacer(Modifier.width(spacing.sm))
        Column {
            Text(
                text = title,
                style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
                color = colors.ink1,
            )
            Spacer(Modifier.height(spacing.xxs))
            Text(
                text = detail,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink3,
            )
        }
    }
}

@Composable
private fun HomeStepRow(index: Int, title: String, detail: String) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = spacing.xs),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(spacing.md),
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(PuenteTheme.radius.sm))
                .background(colors.indigo.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = index.toString(),
                style = PuenteTheme.typography.MonoLabelLarge,
                color = colors.indigo,
            )
        }
        Column {
            Text(
                text = title,
                style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
                color = colors.ink1,
            )
            Spacer(Modifier.height(spacing.xxs))
            Text(
                text = detail,
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink3,
            )
        }
    }
}

@Preview(name = "Onboarding — encuadre", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 800)
@Composable
private fun OnboardingPreview() {
    PuenteTheme {
        OnboardingScreenContent(
            state = OnboardingUiState(step = OnboardingStep.FRAMING),
            onAction = {},
        )
    }
}
