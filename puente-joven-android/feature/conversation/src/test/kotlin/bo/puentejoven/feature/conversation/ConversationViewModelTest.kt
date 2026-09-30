package bo.puentejoven.feature.conversation

import bo.puentejoven.core.common.FeatureUiState
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.ConversationRole
import bo.puentejoven.core.navigation.ContextCheckRoute
import bo.puentejoven.core.security.PassThroughLocalCipher
import bo.puentejoven.feature.conversation.domain.GuidedScriptCatalog
import bo.puentejoven.feature.conversation.domain.ObserveConversationUseCase
import bo.puentejoven.feature.conversation.domain.SendYouthMessageUseCase
import bo.puentejoven.feature.conversation.domain.StartConversationUseCase
import bo.puentejoven.feature.conversation.domain.StringResolver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
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
 * Pruebas del `ConversationViewModel`.
 *
 * Cubren los criterios de `TASK-004` que se pueden verificar sin emulador:
 * - #1 el historial sobrevive (lo garantiza el repositorio persistente, que aquí es
 *   el real: `LocalPuenteRepository`);
 * - #2 todo turno de Puente llega con `promptId`;
 * - #3 una pregunta cada vez (probado en `ContextCheckViewModelTest`).
 */
@OptIn(ExperimentalCoroutinesApi::class)
class ConversationViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var repository: LocalPuenteRepository
    private lateinit var viewModel: ConversationViewModel

    /**
     * Resolutor de texto determinista: los `@StringRes` no existen en la JVM, así
     * que se sustituyen por un marcador estable. Lo que se prueba aquí es **qué
     * recurso se pide**, no su contenido.
     */
    private val resolver = StringResolver { resId -> "res:$resId" }

    @Before
    fun setUp() = runTest(dispatcher) {
        Dispatchers.setMain(dispatcher)
        repository = LocalPuenteRepository(
            clock = TestClock(current = 1_760_000_000_000L),
            cipher = PassThroughLocalCipher(),
        )
        repository.createProfile(alias = "Alex", ageBand = AgeBand.MID_TEEN, pin = "123456")

        viewModel = ConversationViewModel(
            observeConversation = ObserveConversationUseCase(repository),
            startConversation = StartConversationUseCase(repository, resolver),
            sendYouthMessage = SendYouthMessageUseCase(repository, resolver),
        )
        advanceUntilIdle()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `pide el encuadre de transparencia antes de crear nada`() = runTest(dispatcher) {
        advanceUntilIdle()

        assertTrue("El encuadre debe preceder a la conversación", viewModel.uiState.value.showTransparency)
        assertTrue(
            "Sin conversación, el contenido está vacío, no en error",
            viewModel.uiState.value.content is FeatureUiState.Empty,
        )
    }

    @Test
    fun `al aceptar la transparencia abre la conversacion con un turno del guion`() = runTest(dispatcher) {
        viewModel.onAction(ConversationUiAction.AcknowledgeTransparency)
        advanceUntilIdle()

        val content = viewModel.uiState.value.content
        assertTrue(content is FeatureUiState.Content)

        val messages = (content as FeatureUiState.Content).data.messages
        assertEquals(1, messages.size)

        val opening = messages.single()
        assertEquals(ConversationRole.PUENTE, opening.role)
        assertEquals(
            "El primer turno debe nacer del guion, no de un modelo",
            GuidedScriptCatalog.PROMPT_OPENING,
            opening.promptId,
        )
        assertFalse(viewModel.uiState.value.showTransparency)
    }

    @Test
    fun `el mensaje del joven se guarda y recibe el acuse del guion`() = runTest(dispatcher) {
        viewModel.onAction(ConversationUiAction.AcknowledgeTransparency)
        advanceUntilIdle()

        viewModel.onAction(ConversationUiAction.DraftChanged("Hoy me sentí solo en el recreo"))
        viewModel.onAction(ConversationUiAction.Send)
        advanceUntilIdle()

        val messages = (viewModel.uiState.value.content as FeatureUiState.Content).data.messages
        assertEquals(3, messages.size)

        val youthMessage = messages[1]
        assertEquals(ConversationRole.YOUTH, youthMessage.role)
        assertEquals("Hoy me sentí solo en el recreo", youthMessage.content)

        val acuse = messages[2]
        assertEquals(ConversationRole.PUENTE, acuse.role)
        assertEquals(GuidedScriptCatalog.PROMPT_ACKNOWLEDGE, acuse.promptId)

        assertEquals("El borrador se limpia al guardarse", "", viewModel.uiState.value.draft)
    }

    @Test
    fun `el segundo mensaje invita al chequeo y el tercero ya no recibe turno`() = runTest(dispatcher) {
        viewModel.onAction(ConversationUiAction.AcknowledgeTransparency)
        advanceUntilIdle()

        enviar("Uno")
        enviar("Dos")
        enviar("Tres")

        val messages = (viewModel.uiState.value.content as FeatureUiState.Content).data.messages
        val puentePromptIds = messages
            .filter { it.role == ConversationRole.PUENTE }
            .map { it.promptId }

        assertEquals(
            listOf(
                GuidedScriptCatalog.PROMPT_OPENING,
                GuidedScriptCatalog.PROMPT_ACKNOWLEDGE,
                GuidedScriptCatalog.PROMPT_CHECK_INTRO,
            ),
            puentePromptIds,
        )
        assertTrue(
            "Ningún turno de Puente puede quedar sin promptId",
            puentePromptIds.none { it.isNullOrBlank() },
        )
    }

    @Test
    fun `un borrador vacio no escribe nada`() = runTest(dispatcher) {
        viewModel.onAction(ConversationUiAction.AcknowledgeTransparency)
        advanceUntilIdle()

        viewModel.onAction(ConversationUiAction.DraftChanged("   "))
        viewModel.onAction(ConversationUiAction.Send)
        advanceUntilIdle()

        val messages = (viewModel.uiState.value.content as FeatureUiState.Content).data.messages
        assertEquals("Solo debe quedar el turno de apertura", 1, messages.size)
    }

    @Test
    fun `el chequeo contextual se abre sobre la conversacion activa`() = runTest(dispatcher) {
        viewModel.onAction(ConversationUiAction.AcknowledgeTransparency)
        advanceUntilIdle()

        val conversationId = (viewModel.uiState.value.content as FeatureUiState.Content)
            .data.conversationId

        viewModel.onAction(ConversationUiAction.OpenContextCheck)
        advanceUntilIdle()

        val effect = viewModel.effects.first()
        assertTrue(effect is ConversationEffect.Navigate)
        assertEquals(
            ContextCheckRoute(conversationId = conversationId),
            (effect as ConversationEffect.Navigate).destination,
        )
    }

    @Test
    fun `el chequeo solo se ofrece despues de que el joven escriba`() = runTest(dispatcher) {
        viewModel.onAction(ConversationUiAction.AcknowledgeTransparency)
        advanceUntilIdle()

        assertFalse(
            "Con la conversación recién abierta no hay nada que chequear todavía",
            (viewModel.uiState.value.content as FeatureUiState.Content).data.canContinueToCheck,
        )

        enviar("Hoy fue un día difícil")

        assertTrue(
            (viewModel.uiState.value.content as FeatureUiState.Content).data.canContinueToCheck,
        )
    }

    private fun TestScope.enviar(texto: String) {
        viewModel.onAction(ConversationUiAction.DraftChanged(texto))
        viewModel.onAction(ConversationUiAction.Send)
        advanceUntilIdle()
    }
}
