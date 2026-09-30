package bo.puentejoven.feature.signals

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.security.PassThroughLocalCipher
import bo.puentejoven.feature.signals.domain.ObserveSignalsUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
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
 * Pruebas del `SignalsViewModel`.
 *
 * Cubren que la prioridad se **calcule** a partir de las señales reales y no se lea
 * del fixture `DemoFixtures.attentionAssessment`.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class SignalsViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var repository: LocalPuenteRepository
    private lateinit var viewModel: SignalsViewModel

    @Before
    fun setUp() = runTest(dispatcher) {
        Dispatchers.setMain(dispatcher)
        repository = LocalPuenteRepository(
            clock = TestClock(current = 1_760_000_000_000L),
            cipher = PassThroughLocalCipher(),
        )
        repository.createProfile(alias = "Alex", ageBand = AgeBand.MID_TEEN, pin = "123456")

        viewModel = SignalsViewModel(ObserveSignalsUseCase(repository, repository))
        advanceUntilIdle()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `emite contenido con las senales y su prioridad calculada`() = runTest(dispatcher) {
        advanceUntilIdle()

        val content = viewModel.uiState.value.content
        assertTrue(content is FeatureUiState.Content)

        val data = (content as FeatureUiState.Content).data
        assertFalse("Debe haber señales en el escenario de demo", data.signals.isEmpty())

        // Las fixtures traen aislamiento y deterioro escolar en ascenso: eso es un
        // criterio amarillo de PR-001 §4.3, así que el cálculo debe dar amarillo.
        assertEquals(AttentionLevel.YELLOW, data.outcome.level)
        assertTrue(data.outcome.motivoKeys.isNotEmpty())
        assertFalse(
            "El brief §11 exige poder mostrar de dónde sale: sin evidencia no hay explicación",
            data.outcome.evidence.isEmpty(),
        )
    }

    @Test
    fun `la prioridad no es la del fixture sino la calculada`() = runTest(dispatcher) {
        advanceUntilIdle()

        val outcome = (viewModel.uiState.value.content as FeatureUiState.Content).data.outcome

        // `DemoFixtures.attentionAssessment` tiene texto fijo; el motor produce copy
        // por recurso. Si el nivel coincidiera por casualidad, el motivo no.
        assertTrue(
            "El resultado debe venir del motor de reglas, no del fixture",
            outcome.motivoKeys.contains("aislamiento_persistente") ||
                outcome.motivoKeys.contains("deterioro_escolar"),
        )
    }
}
