package bo.puentejoven.feature.conversation.domain

import bo.puentejoven.core.data.repository.ConversationRepository
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.model.ConversationMessage
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/** Conversación activa, lista para pintar. */
data class ConversationSnapshot(
    val conversationId: ConversationId,
    val messages: List<ConversationMessage>,
)

/**
 * Caso de uso: observar la conversación activa.
 *
 * El repositorio ya descifra el contenido al emitir (`observeActiveConversation`),
 * así que aquí no hay criptografía: solo se proyecta al modelo de la feature.
 */
class ObserveConversationUseCase @Inject constructor(
    private val conversationRepository: ConversationRepository,
) {

    fun observe(): Flow<ConversationSnapshot?> =
        conversationRepository.observeActiveConversation().map { conversation ->
            conversation?.let {
                ConversationSnapshot(
                    conversationId = it.id,
                    messages = it.messages,
                )
            }
        }
}
