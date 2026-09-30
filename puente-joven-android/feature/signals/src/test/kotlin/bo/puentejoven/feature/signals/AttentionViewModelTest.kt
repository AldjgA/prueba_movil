package bo.puentejoven.feature.signals

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.navigation.SummaryReviewRoute
import bo.puentejoven.core.security.PassThroughLocalCipher
import bo.puentejoven.feature.signals.domain.ObserveSignalsUseCase
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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Pruebas del `AttentionViewModel`.
 *
 * Lo importante aquí no es la aritmética (está en `AttentionRulesetTest`) sino que la
 * pantalla reciba el nivel **efectivo**, incluido el rojo que no se degrada.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class AttentionViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var repository: LocalPuenteRepository
    private lateinit var viewModel: AttentionViewModel

    @Before
    fun setUp() = runTest(dispatcher) {
        Dispatchers.setMain(dispatcher)
        repository = LocalPuenteRepository(
            clock = TestClock(current = 1_760_000_000_000L),
            cipher = PassThroughLocalCipher(),
        )
        repository.createProfile(alias = "Alex", ageBand = AgeBand.MID_TEEN, pin = "123456")

        viewModel = AttentionViewModel(ObserveSignalsUseCase(repository, repository))
        advanceUntilIdle()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `emite el resultado del motor de reglas`() = runTest(dispatcher) {
        advanceUntilIdle()

        val content = viewModel.uiState.value.content
        assertTrue(content is FeatureUiState.Content)

        val outcome = (content as FeatureUiState.Content).data.outcome
        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.titleResId != 0)
    }

    @Test
    fun `un rojo ya observado no se degrada al responder distinto`() = runTest(dispatcher) {
        advanceUntilIdle()

        // 1. El joven declara que no se siente seguro → rojo.
        repository.recordResponse(
            questionKey = "check.safety",
            optionKey = "no",
            conversationId = ConversationId("conv-1"),
        )
        advanceUntilIdle()
        assertEquals(
            AttentionLevel.RED,
            (viewModel.uiState.value.content as FeatureUiState.Content).data.outcome.level,
        )

        // 2. Cambia de idea y responde que sí.
        repository.recordResponse(
            questionKey = "check.safety",
            optionKey = "yes",
            conversationId = ConversationId("conv-1"),
        )
        advanceUntilIdle()

        // El cálculo puro daría amarillo (las fixtures siguen ahí), pero la alarma
        // roja ya se emitió y no se apaga sola: requiere revisión humana.
        val effective = (viewModel.uiState.value.content as FeatureUiState.Content).data.outcome
        assertEquals(AttentionLevel.RED, effective.level)
    }

    @Test
    fun `preparar una solicitud de apoyo abre la revision del resumen`() = runTest(dispatcher) {
        advanceUntilIdle()

        viewModel.onAction(AttentionUiAction.OpenSupport)
        advanceUntilIdle()

        val effect = viewModel.effects.first()
        assertTrue(effect is SignalsEffect.Navigate)
        assertEquals(
            SummaryReviewRoute,
            (effect as SignalsEffect.Navigate).destination,
        )
    }
}
