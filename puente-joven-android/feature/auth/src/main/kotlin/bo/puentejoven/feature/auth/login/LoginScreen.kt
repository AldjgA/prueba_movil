package bo.puentejoven.feature.auth.login

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.PuenteButtonState
import bo.puentejoven.core.designsystem.component.PuenteOrb
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.PinPolicy

/**
 * Pantalla de inicio de sesión local.
 *
 * Crea un perfil en el dispositivo (alias + banda de edad + PIN local) y abre la
 * sesión. NO es autenticación remota: no se envía nada a ningún servidor.
 *
 * Privacidad visible: se explica que el alias no es el nombre real y que el PIN
 * solo protege el acceso en este teléfono.
 *
 * @param onAuthenticated se invoca cuando la sesión local quedó lista.
 * @param onBack vuelve a la pantalla de entrada.
 */
@Composable
fun LoginScreen(
    onAuthenticated: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: LoginViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(viewModel) {
        viewModel.effects.collect { effect ->
            when (effect) {
                LoginEffect.SessionReady -> onAuthenticated()
            }
        }
    }

    LoginScreenContent(
        state = state,
        onAction = viewModel::onAction,
        onBack = onBack,
        modifier = modifier,
    )
}

/** Contenido sin ViewModel: permite previews y pruebas de UI directas. */
@Composable
fun LoginScreenContent(
    state: LoginUiState,
    onAction: (LoginUiAction) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val spacing = PuenteTheme.spacing

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.bg),
    ) {
        // Orbe ambiental suave arriba-derecha
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = spacing.md, end = spacing.md),
        ) {
            PuenteOrb(size = 56.dp)
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = spacing.screenHorizontalWide),
        ) {
            Spacer(Modifier.height(spacing.md))

            IconButton(
                onClick = onBack,
                modifier = Modifier.semantics { contentDescription = "Volver" },
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = null,
                    tint = colors.ink3,
                )
            }

            Spacer(Modifier.height(spacing.md))

            Text(
                text = "TU ESPACIO",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))
            Text(
                text = "Cómo quieres que te llame.",
                style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                color = colors.ink1,
                modifier = Modifier.semantics { heading() },
            )
            Spacer(Modifier.height(spacing.xs))
            Text(
                text = "Elige un alias, no tu nombre real. Todo se queda en este teléfono.",
                style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                color = colors.ink3,
            )

            Spacer(Modifier.height(spacing.xl))

            // --- Alias ---
            Text(
                text = "ALIAS",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))
            OutlinedTextField(
                value = state.alias,
                onValueChange = { onAction(LoginUiAction.AliasChanged(it)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = {
                    Text(
                        text = "Por ejemplo: Alex",
                        color = colors.ink4,
                        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    )
                },
                shape = RoundedCornerShape(PuenteTheme.radius.md),
                colors = puenteTextFieldColors(),
            )

            Spacer(Modifier.height(spacing.lg))

            // --- PIN local ---
            Text(
                text = "PIN LOCAL",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xxs))
            Text(
                text = "Protege el acceso en este teléfono. No se envía a ningún sitio.",
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))
            OutlinedTextField(
                value = state.pin,
                onValueChange = { onAction(LoginUiAction.PinChanged(it)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                visualTransformation = PasswordVisualTransformation(),
                placeholder = {
                    Text(
                        text = "${PinPolicy.LENGTH} dígitos",
                        color = colors.ink4,
                        style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    )
                },
                shape = RoundedCornerShape(PuenteTheme.radius.md),
                colors = puenteTextFieldColors(),
            )

            Spacer(Modifier.height(spacing.lg))

            // --- Banda de edad ---
            Text(
                text = "TU EDAD",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xxs))
            Text(
                text = "Solo la franja, no tu edad exacta.",
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink4,
            )
            Spacer(Modifier.height(spacing.xs))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(spacing.xs),
            ) {
                AgeBand.entries.forEach { band ->
                    AgeBandOption(
                        band = band,
                        selected = state.ageBand == band,
                        onSelect = { onAction(LoginUiAction.AgeBandChanged(band)) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            if (state.error != null) {
                Spacer(Modifier.height(spacing.md))
                Text(
                    text = "No pudimos abrir tu espacio. Revisa el alias y el PIN de " +
                        "${PinPolicy.LENGTH} dígitos e inténtalo otra vez.",
                    style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                    color = colors.red,
                )
            }

            Spacer(Modifier.height(spacing.xl))

            PrimaryAction(
                text = "Entrar",
                onClick = { onAction(LoginUiAction.Submit) },
                state = when {
                    state.isSubmitting -> PuenteButtonState.Loading
                    !state.canSubmit -> PuenteButtonState.Disabled
                    else -> PuenteButtonState.Enabled
                },
            )

            Spacer(Modifier.height(spacing.md))

            Text(
                text = "Tu conversación se guarda cifrada en tu teléfono. Tú decides qué compartir.",
                style = PuenteTheme.typography.MonoLabel,
                color = colors.ink4,
            )

            Spacer(Modifier.height(spacing.md))

            // --- Biometría: comodidad opcional, NUNCA sustituto del PIN ---
            Text(
                text = if (state.biometricAvailable) {
                    "Puedes usar tu huella como atajo. El PIN sigue siendo la llave."
                } else {
                    "Desbloqueo con huella: no disponible en esta versión. El PIN es la llave."
                },
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink4,
            )

            Spacer(Modifier.height(spacing.xs))

            // --- Explicación obligatoria de recuperación (TASK-003) ---
            Text(
                text = "No hay recuperación configurada: si olvidas el PIN o pierdes el teléfono, " +
                    "tu historial local no se puede restaurar.",
                style = androidx.compose.material3.MaterialTheme.typography.bodySmall,
                color = colors.ink4,
            )

            Spacer(Modifier.height(spacing.xxl))
        }
    }
}

@Composable
private fun AgeBandOption(
    band: AgeBand,
    selected: Boolean,
    onSelect: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = PuenteTheme.colors
    val shape = RoundedCornerShape(PuenteTheme.radius.md)
    Box(
        modifier = modifier
            .height(PuenteTheme.spacing.minTouchTarget)
            .clip(shape)
            .background(if (selected) colors.indigo.copy(alpha = 0.12f) else colors.surface0)
            .border(
                width = if (selected) 1.5.dp else 1.dp,
                color = if (selected) colors.indigo else colors.surface2,
                shape = shape,
            )
            .clickable(role = Role.RadioButton, onClick = onSelect)
            .semantics(mergeDescendants = true) {
                contentDescription = "Franja de edad ${band.label}" +
                    if (selected) ", seleccionada" else ""
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = band.label,
            style = androidx.compose.material3.MaterialTheme.typography.titleSmall,
            color = if (selected) colors.indigo else colors.ink2,
        )
    }
}

/** Colores de campo de texto alineados al sistema, sin depender del tema Material. */
@Composable
internal fun puenteTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = PuenteTheme.colors.indigo,
    unfocusedBorderColor = PuenteTheme.colors.surface2,
    focusedTextColor = PuenteTheme.colors.ink1,
    unfocusedTextColor = PuenteTheme.colors.ink1,
    cursorColor = PuenteTheme.colors.indigo,
    focusedContainerColor = PuenteTheme.colors.surface0,
    unfocusedContainerColor = PuenteTheme.colors.surface0,
)

@Preview(name = "Login — compacto", showBackground = true, backgroundColor = 0xFFF7F8FC, widthDp = 360, heightDp = 900)
@Composable
private fun LoginScreenPreview() {
    PuenteTheme {
        LoginScreenContent(
            state = LoginUiState(alias = "Alex", pin = "1".repeat(PinPolicy.LENGTH)),
            onAction = {},
            onBack = {},
        )
    }
}
