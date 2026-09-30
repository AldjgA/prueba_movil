package bo.puentejoven.feature.conversation.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.data.repository.ConversationRepository
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.model.ConversationRole
import javax.inject.Inject
import kotlinx.coroutines.flow.first

/**
 * Caso de uso: guardar lo que escribe el joven y responder con el turno del guion.
 *
 * La respuesta de Puente se decide por una **regla cerrada** sobre el número de
 * mensajes previos del joven ([GuidedScriptCatalog.turnAfterYouthMessage]). No hay
 * modelo de lenguaje en este camino: el MVP no tiene chat generativo libre.
 */
class SendYouthMessageUseCase @Inject constructor(
    private val conversationRepository: ConversationRepository,
    private val stringResolver: StringResolver,
) {

    suspend operator fun invoke(
        conversationId: ConversationId,
        content: String,
    ): AppResult<Unit> {
        val trimmed = content.trim()
        if (trimmed.isEmpty()) {
            return AppResult.Failure(UiError.Validation(technical = "blank youth message"))
        }

        // Se cuenta ANTES de escribir: así la regla no depende de que el flujo del
        // repositorio ya refleje el mensaje recién añadido.
        val previousYouthMessages = conversationRepository.observeActiveConversation()
            .first()
            ?.messages
            ?.count { it.role == ConversationRole.YOUTH }
            ?: 0

        return when (
            val appended = conversationRepository.appendYouthMessage(conversationId, trimmed)
        ) {
            is AppResult.Failure -> appended
            is AppResult.Success -> appendScriptedTurn(conversationId, previousYouthMessages + 1)
        }
    }

    private suspend fun appendScriptedTurn(
        conversationId: ConversationId,
        youthMessageCount: Int,
    ): AppResult<Unit> {
        val turn = GuidedScriptCatalog.turnAfterYouthMessage(youthMessageCount)
            ?: return AppResult.Success(Unit)

        return when (
            val appended = conversationRepository.appendPuenteMessage(
                conversationId = conversationId,
                content = stringResolver.get(turn.messageResId),
                promptId = turn.promptId,
            )
        ) {
            is AppResult.Failure -> appended
            is AppResult.Success -> AppResult.Success(Unit)
        }
    }
}
