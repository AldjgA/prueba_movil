package bo.puentejoven.feature.onboarding

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Pruebas del `OnboardingViewModel`: recorrido de pasos, validación por
 * reconocimiento explícito y emisión del efecto final.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class OnboardingViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var viewModel: OnboardingViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
        viewModel = OnboardingViewModel()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `estado inicial es el paso de encuadre sin reconocer`() {
        val state = viewModel.uiState.value

        assertEquals(OnboardingStep.FRAMING, state.step)
        assertFalse(state.acknowledgedFraming)
        assertFalse("No se puede avanzar sin reconocer el encuadre", state.canAdvance)
    }

    @Test
    fun `no se avanza al siguiente paso sin reconocer el actual`() {
        viewModel.onAction(OnboardingUiAction.Next)

        assertEquals(OnboardingStep.FRAMING, viewModel.uiState.value.step)
    }

    @Test
    fun `reconocer el encuadre permite avanzar a privacidad`() {
        viewModel.onAction(OnboardingUiAction.FramingAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)

        assertEquals(OnboardingStep.PRIVACY, viewModel.uiState.value.step)
        assertTrue(viewModel.uiState.value.canAdvance.not())
    }

    @Test
    fun `volver retrocede un paso`() {
        viewModel.onAction(OnboardingUiAction.FramingAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)
        viewModel.onAction(OnboardingUiAction.PrivacyAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)

        assertEquals(OnboardingStep.EXPECTATIONS, viewModel.uiState.value.step)

        viewModel.onAction(OnboardingUiAction.Back)
        assertEquals(OnboardingStep.PRIVACY, viewModel.uiState.value.step)
    }

    @Test
    fun `el progreso refleja el avance entre pasos`() {
        assertEquals(1f / 3f, viewModel.uiState.value.progress, 0.001f)

        viewModel.onAction(OnboardingUiAction.FramingAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)
        assertEquals(2f / 3f, viewModel.uiState.value.progress, 0.001f)

        viewModel.onAction(OnboardingUiAction.PrivacyAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)
        assertEquals(1f, viewModel.uiState.value.progress, 0.001f)
    }

    @Test
    fun `finish solo emite el efecto en el ultimo paso`() = runTest(dispatcher) {
        viewModel.onAction(OnboardingUiAction.Finish)
        advanceUntilIdle()
        assertEquals(OnboardingStep.FRAMING, viewModel.uiState.value.step)

        viewModel.onAction(OnboardingUiAction.FramingAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)
        viewModel.onAction(OnboardingUiAction.PrivacyAcknowledged(true))
        viewModel.onAction(OnboardingUiAction.Next)

        viewModel.onAction(OnboardingUiAction.Finish)
        advanceUntilIdle()

        assertEquals(OnboardingEffect.Finished, viewModel.effects.first())
    }
}
