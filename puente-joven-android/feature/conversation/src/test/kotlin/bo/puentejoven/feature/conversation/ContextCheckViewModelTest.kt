package bo.puentejoven.feature.conversation

import androidx.lifecycle.SavedStateHandle
import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.security.PassThroughLocalCipher
import bo.puentejoven.feature.conversation.domain.ContextCheckUseCase
import bo.puentejoven.feature.conversation.domain.GuidedScriptCatalog
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
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Pruebas del `ContextCheckViewModel`.
 *
 * Cubren los criterios de `TASK-004` verificables sin emulador:
 * - #3 una sola pregunta a la vez y no avanza sin decisión;
 * - el chequeo **no** calcula niveles (eso es `TASK-005`);
 * - ninguna clave ajena al catálogo llega a `ContextResponse`.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class ContextCheckViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var repository: LocalPuenteRepository
    private lateinit var viewModel: ContextCheckViewModel

    private val conversationId = "conv-de-prueba"

    @Before
    fun setUp() = runTest(dispatcher) {
        Dispatchers.setMain(dispatcher)
        repository = LocalPuenteRepository(
            clock = TestClock(current = 1_760_000_000_000L),
            cipher = PassThroughLocalCipher(),
        )
        repository.createProfile(alias = "Alex", ageBand = AgeBand.MID_TEEN, pin = "123456")

        viewModel = ContextCheckViewModel(
            contextCheck = ContextCheckUseCase(repository),
            savedStateHandle = SavedStateHandle(
                mapOf(ContextCheckViewModel.ARG_CONVERSATION_ID to conversationId),
            ),
        )
        advanceUntilIdle()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `empieza por la primera pregunta del catalogo`() = runTest(dispatcher) {
        advanceUntilIdle()

        val content = viewModel.uiState.value.content
        assertTrue(content is FeatureUiState.Content)

        val data = (content as FeatureUiState.Content).data
        assertEquals(GuidedScriptCatalog.questions.first().key, data.question?.key)
        assertEquals(0, data.decidedCount)
        assertEquals(GuidedScriptCatalog.questions.size, data.totalCount)
        assertFalse(data.isFinished)
    }

    @Test
    fun `responder guarda la clave y avanza a la siguiente pregunta`() = runTest(dispatcher) {
        advanceUntilIdle()
        val primera = GuidedScriptCatalog.questions.first()

        viewModel.onAction(
            ContextCheckUiAction.Decide(questionKey = primera.key, optionKey = "worse"),
        )
        advanceUntilIdle()

        val guardadas = repository.observeResponses().first()
        assertEquals(1, guardadas.size)
        assertEquals(primera.key, guardadas.single().questionKey.value)
        assertEquals("worse", guardadas.single().optionKey.value)
        assertEquals(
            "La respuesta debe quedar vinculada a la conversación de la ruta",
            conversationId,
            guardadas.single().conversationId?.value,
        )

        val data = (viewModel.uiState.value.content as FeatureUiState.Content).data
        assertEquals(GuidedScriptCatalog.questions[1].key, data.question?.key)
        assertEquals(1, data.decidedCount)
    }

    @Test
    fun `saltar tambien es una decision y no se vuelve a preguntar`() = runTest(dispatcher) {
        advanceUntilIdle()
        val primera = GuidedScriptCatalog.questions.first()

        viewModel.onAction(
            ContextCheckUiAction.Decide(
                questionKey = primera.key,
                optionKey = GuidedScriptCatalog.OPTION_SKIP,
            ),
        )
        advanceUntilIdle()

        val guardadas = repository.observeResponses().first()
        assertEquals(GuidedScriptCatalog.OPTION_SKIP, guardadas.single().optionKey.value)

        val data = (viewModel.uiState.value.content as FeatureUiState.Content).data
        assertEquals(GuidedScriptCatalog.questions[1].key, data.question?.key)
    }

    @Test
    fun `una clave ajena al catalogo no se guarda`() = runTest(dispatcher) {
        advanceUntilIdle()

        viewModel.onAction(
            ContextCheckUiAction.Decide(questionKey = "check.inventado", optionKey = "worse"),
        )
        advanceUntilIdle()

        assertTrue(
            "Una clave ajena no puede llegar a ContextResponse: TASK-005 la leería " +
                "como una dimensión real",
            repository.observeResponses().first().isEmpty(),
        )
    }

    @Test
    fun `una opcion ajena a su pregunta no se guarda`() = runTest(dispatcher) {
        advanceUntilIdle()
        val primera = GuidedScriptCatalog.questions.first()

        viewModel.onAction(
            ContextCheckUiAction.Decide(questionKey = primera.key, optionKey = "opcion_inventada"),
        )
        advanceUntilIdle()

        assertTrue(repository.observeResponses().first().isEmpty())
    }

    @Test
    fun `al decidir todas las preguntas el chequeo termina`() = runTest(dispatcher) {
        advanceUntilIdle()

        GuidedScriptCatalog.questions.forEach { question ->
            viewModel.onAction(
                ContextCheckUiAction.Decide(
                    questionKey = question.key,
                    optionKey = question.options.first().key,
                ),
            )
            advanceUntilIdle()
        }

        val data = (viewModel.uiState.value.content as FeatureUiState.Content).data
        assertNull("Terminado significa sin pregunta vigente", data.question)
        assertTrue(data.isFinished)
        assertEquals(GuidedScriptCatalog.questions.size, data.decidedCount)
        assertEquals(
            GuidedScriptCatalog.questions.size,
            repository.observeResponses().first().size,
        )
    }
}
