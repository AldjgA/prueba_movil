package bo.puentejoven.feature.home

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.navigation.ConversationRoute
import bo.puentejoven.core.navigation.SignalsRoute
import bo.puentejoven.core.security.PassThroughLocalCipher
import bo.puentejoven.feature.home.domain.ObserveHomeUseCase
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
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Pruebas del `HomeViewModel`: emisión del contenido, estado de error y traducción
 * de acciones a destinos tipados.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var repository: LocalPuenteRepository
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
        repository = LocalPuenteRepository(
            clock = TestClock(current = 1_760_000_000_000L),
            cipher = PassThroughLocalCipher(),
        )
        viewModel = HomeViewModel(
            observeHome = ObserveHomeUseCase(
                youthRepository = repository,
                signalsRepository = repository,
                toolsRepository = repository,
                clock = TestClock(current = 1_760_000_000_000L),
            ),
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `emite contenido con perfil, senales y herramientas`() = runTest(dispatcher) {
        advanceUntilIdle()

        val content = viewModel.uiState.value.content
        assertTrue("Se esperaba contenido cargado", content is FeatureUiState.Content)

        val data = (content as FeatureUiState.Content).data
        assertEquals("Alex", data.profile.alias.value)
        assertTrue("Los fixtures deben traer señales", data.hasSignalsToReview)
        assertEquals(3, data.tools.size)
    }

    @Test
    fun `startConversation navega a la conversacion estructurada`() = runTest(dispatcher) {
        advanceUntilIdle()

        viewModel.onAction(HomeUiAction.StartConversation)
        val effect = viewModel.effects.first()

        assertEquals(HomeEffect.Navigate(ConversationRoute), effect)
    }

    @Test
    fun `openSignals navega al destino tipado de senales`() = runTest(dispatcher) {
        advanceUntilIdle()

        viewModel.onAction(HomeUiAction.OpenSignals)
        val effect = viewModel.effects.first()

        assertEquals(HomeEffect.Navigate(SignalsRoute), effect)
    }

    @Test
    fun `openTool navega con la clave de herramienta en la ruta`() = runTest(dispatcher) {
        advanceUntilIdle()

        viewModel.onAction(HomeUiAction.OpenTool("breathe"))
        val effect = viewModel.effects.first()

        assertTrue(effect is HomeEffect.Navigate)
        assertNotNull((effect as HomeEffect.Navigate).destination)
    }

    @Test
    fun `retry vuelve a cargar y deja el contenido disponible`() = runTest(dispatcher) {
        advanceUntilIdle()
        viewModel.onAction(HomeUiAction.Retry)
        advanceUntilIdle()

        assertTrue(viewModel.uiState.value.content is FeatureUiState.Content)
    }
}
