package bo.puentejoven.feature.conversation.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.data.repository.ConversationRepository
import bo.puentejoven.core.model.Conversation
import javax.inject.Inject

/**
 * Caso de uso: abrir la conversación y dejar el primer turno de Puente.
 *
 * El turno inicial **no** lo escribe un modelo: sale del catálogo
 * ([GuidedScriptCatalog.openingTurn]) y se persiste con su `promptId`, de modo que
 * el primer mensaje de la app también es auditable (guardrail #3).
 */
class StartConversationUseCase @Inject constructor(
    private val conversationRepository: ConversationRepository,
    private val stringResolver: StringResolver,
) {

    suspend operator fun invoke(): AppResult<Conversation> {
        val conversation = when (val started = conversationRepository.startConversation()) {
            is AppResult.Failure -> return started
            is AppResult.Success -> started.data
        }

        val opening = GuidedScriptCatalog.openingTurn()
        return when (
            val appended = conversationRepository.appendPuenteMessage(
                conversationId = conversation.id,
                content = stringResolver.get(opening.messageResId),
                promptId = opening.promptId,
            )
        ) {
            is AppResult.Failure -> appended
            is AppResult.Success -> AppResult.Success(conversation)
        }
    }
}
