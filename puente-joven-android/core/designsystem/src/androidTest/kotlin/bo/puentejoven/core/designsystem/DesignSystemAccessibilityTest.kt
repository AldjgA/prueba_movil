package bo.puentejoven.core.designsystem

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.unit.dp
import bo.puentejoven.core.designsystem.component.AttentionCard
import bo.puentejoven.core.designsystem.component.PrimaryAction
import bo.puentejoven.core.designsystem.component.PuenteButtonState
import bo.puentejoven.core.designsystem.component.SecondaryAction
import bo.puentejoven.core.designsystem.component.SignalChip
import bo.puentejoven.core.designsystem.theme.PuenteTheme
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.TrendDirection
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Pruebas de accesibilidad y estado de los componentes del design system.
 *
 * Cubren los criterios de TASK-002:
 * - semantics/labels y estados enabled/disabled/loading de botones;
 * - las prioridades se distinguen con texto e icono, no solo color;
 * - objetivos táctiles y etiquetas accesibles.
 */
class DesignSystemAccessibilityTest {

    @get:Rule
    val composeRule = createComposeRule()

    // --- Botones: estados ---

    @Test
    fun primaryAction_enabled_isClickable() {
        var clicked = false
        composeRule.setContent {
            PuenteTheme {
                PrimaryAction(
                    text = "Ver herramienta",
                    onClick = { clicked = true },
                )
            }
        }

        composeRule.onNodeWithText("Ver herramienta")
            .assertIsDisplayed()
            .assertIsEnabled()
            .assertHasClickAction()
            .performClick()

        assertTrue(clicked)
    }

    @Test
    fun primaryAction_disabled_isNotEnabled() {
        var clicked = false
        composeRule.setContent {
            PuenteTheme {
                PrimaryAction(
                    text = "Deshabilitado",
                    onClick = { clicked = true },
                    state = PuenteButtonState.Disabled,
                )
            }
        }

        composeRule.onNodeWithText("Deshabilitado").assertIsNotEnabled()
        assertTrue("No debe disparar el click", !clicked)
    }

    @Test
    fun primaryAction_loading_announcesState() {
        composeRule.setContent {
            PuenteTheme {
                PrimaryAction(
                    text = "Entrar",
                    onClick = {},
                    state = PuenteButtonState.Loading,
                    loadingDescription = "Cargando",
                )
            }
        }

        // El texto del botón se sustituye por el indicador, pero el estado se anuncia.
        composeRule.onNodeWithContentDescription("Cargando").assertIsDisplayed()
    }

    @Test
    fun secondaryAction_hasClickActionAndLabel() {
        composeRule.setContent {
            PuenteTheme {
                SecondaryAction(
                    text = "Preparar solicitud",
                    onClick = {},
                )
            }
        }

        composeRule.onNodeWithText("Preparar solicitud")
            .assertIsDisplayed()
            .assertHasClickAction()
    }

    // --- Prioridad preliminar: no depende solo del color ---

    @Test
    fun attentionCard_exposesTextIconAndDisclaimer_sinSoloColor() {
        composeRule.setContent {
            PuenteTheme {
                AttentionCard(
                    level = AttentionLevel.YELLOW,
                    title = "Sería bueno involucrar a alguien.",
                    explanation = "La frecuencia aumentó.",
                    whatChanged = "Empezó a afectar tu asistencia.",
                )
            }
        }

        // 1. Texto explícito del nivel (no solo color)
        composeRule.onNodeWithText("PRIORIDAD PRELIMINAR: AMARILLA").assertIsDisplayed()

        // 2. Encuadre obligatorio: no es un diagnóstico
        composeRule
            .onNodeWithText("Esta es una prioridad preliminar de revisión, no un diagnóstico.")
            .assertIsDisplayed()

        // 3. Recuerda que ninguna prioridad sustituye a una persona
        composeRule
            .onNodeWithText("Ninguna prioridad reemplaza a una persona.")
            .assertIsDisplayed()

        // 4. La tarjeta se anuncia como una unidad con el nivel y el encuadre completo
        composeRule
            .onNodeWithContentDescription(
                "Prioridad preliminar de revisión: amarilla. Conviene involucrar a alguien de confianza.",
                substring = true,
            )
            .assertExists()
    }

    @Test
    fun attentionCard_greenAndRed_useDifferentLabels() {
        composeRule.setContent {
            PuenteTheme {
                androidx.compose.foundation.layout.Column {
                    AttentionCard(
                        level = AttentionLevel.GREEN,
                        title = "Podemos trabajarlo paso a paso.",
                        explanation = "Algo que vale la pena atender.",
                        whatChanged = "Primera vez que lo registramos.",
                    )
                    AttentionCard(
                        level = AttentionLevel.RED,
                        title = "Esto necesita apoyo humano prioritario.",
                        explanation = "Necesitas apoyo de una persona capacitada.",
                        whatChanged = "Aparecieron señales que requieren apoyo inmediato.",
                    )
                }
            }
        }

        composeRule.onNodeWithText("PRIORIDAD PRELIMINAR: VERDE").assertExists()
        composeRule.onNodeWithText("PRIORIDAD PRELIMINAR: ROJA").assertExists()
    }

    // --- Distintivos de señal ---

    @Test
    fun signalChip_announcesLabelAndTrend() {
        composeRule.setContent {
            PuenteTheme {
                SignalChip(
                    label = "Frecuencia",
                    trend = TrendDirection.RISING,
                    onClick = {},
                )
            }
        }

        composeRule
            .onNodeWithContentDescription("Frecuencia ↑ En aumento")
            .assertExists()
    }

    /**
     * Regresión: el chip interactivo debe cumplir el objetivo táctil mínimo de
     * 48dp. Antes usaba un `minHeight` fijo de 32dp, por debajo del mínimo de
     * accesibilidad exigido en TASK-002. `minTouchTarget = false` sí permite
     * chips compactos, pero solo para uso de solo lectura.
     */
    @Test
    fun signalChip_interactive_meetsMinTouchTarget() {
        var expectedPx = 0
        composeRule.setContent {
            PuenteTheme {
                expectedPx = with(LocalDensity.current) { 48.dp.roundToPx() }
                SignalChip(
                    label = "Frecuencia",
                    onClick = {},
                )
            }
        }

        val bounds = composeRule
            .onNodeWithContentDescription("Frecuencia")
            .fetchSemanticsNode()
            .boundsInRoot

        assertTrue(
            "El chip interactivo debe medir al menos 48dp de alto " +
                "(medido: ${bounds.height}px, esperado >= ${expectedPx}px)",
            bounds.height >= expectedPx,
        )
    }
}
