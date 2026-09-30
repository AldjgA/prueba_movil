package bo.puentejoven.core.data.local

import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.ChatAccessGrant
import bo.puentejoven.core.model.ChatAccessGrantId
import bo.puentejoven.core.model.ChatAccessPurpose
import bo.puentejoven.core.model.ChatAccessRequest
import bo.puentejoven.core.model.ChatAccessRequestId
import bo.puentejoven.core.model.ChatAccessRequestStatus
import bo.puentejoven.core.model.ChatAccessScope
import bo.puentejoven.core.model.ConsentId
import bo.puentejoven.core.model.ConsentRecord
import bo.puentejoven.core.model.ContextResponse
import bo.puentejoven.core.model.ContextResponseId
import bo.puentejoven.core.model.Conversation
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.model.ConversationMessage
import bo.puentejoven.core.model.ConversationRole
import bo.puentejoven.core.model.MessageId
import bo.puentejoven.core.model.OptionKey
import bo.puentejoven.core.model.ProfileId
import bo.puentejoven.core.model.QuestionKey
import bo.puentejoven.core.model.RevocationReason
import bo.puentejoven.core.model.ShareDefaults
import bo.puentejoven.core.model.ShareScopeEntry
import bo.puentejoven.core.model.ShareableSummary
import bo.puentejoven.core.model.SummaryId
import bo.puentejoven.core.model.SupportRequest
import bo.puentejoven.core.model.SupportRequestId
import bo.puentejoven.core.model.SupportRequestState
import bo.puentejoven.core.model.ToolCompletion
import bo.puentejoven.core.model.ToolCompletionId
import bo.puentejoven.core.model.ToolKey
import bo.puentejoven.core.model.YouthAlias
import bo.puentejoven.core.model.YouthProfile
import kotlinx.serialization.Serializable

/**
 * DTOs de **persistencia** (TASK-003b).
 *
 * Decisión de diseño: `:core:model` NO se anota con `@Serializable`. Los modelos de
 * dominio se mantienen libres de la librería de serialización y el formato de
 * almacenamiento puede evolucionar sin tocarlos. Los mappers son explícitos, campo
 * a campo (misma regla que `BACKEND_INTEGRATION.md` §3: prohibido copiar con reflection).
 *
 * El texto libre (chat, reflexión, nota) viaja ya **cifrado** en un sobre: aquí solo
 * se transporta. Nunca se guarda en claro.
 */

/** Versión del esquema de almacenamiento. Un valor desconocido ⇒ arranque en vacío. */
const val PUENTE_SCHEMA_VERSION = 1

@Serializable
data class SessionSnapshot(
    val schemaVersion: Int = PUENTE_SCHEMA_VERSION,
    /** Todos los perfiles de la instalación (TASK-025). */
    val profiles: List<ProfileEntryDto> = emptyList(),
    /** Perfil activo. `null` si no hay ninguno. */
    val activeProfileId: String? = null,
    /** Contador de ids, global a la instalación. */
    val idCounter: Int = 0,
)

/**
 * Perfil persistido con su metadata propia.
 *
 * El último acceso al chat es **por perfil**: cada uno tiene su propio reloj de
 * retención (`TASK-003`), no uno compartido con los demás.
 */
@Serializable
data class ProfileEntryDto(
    val profile: ProfileDto,
    val lastChatAccessEpochMillis: Long? = null,
)

@Serializable
data class ProfileDto(
    val profileId: String,
    val alias: String,
    val ageBand: String,
    val createdAtEpochMillis: Long,
    val shareSignalsWithProfessional: Boolean = false,
    val shareToolsWithProfessional: Boolean = false,
)

@Serializable
data class ContentSnapshot(
    val conversation: ConversationDto? = null,
    val responses: List<ContextResponseDto> = emptyList(),
    val completions: List<ToolCompletionDto> = emptyList(),
    val summaries: List<SummaryDto> = emptyList(),
    /** Sobres cifrados de las notas, indexados por id de resumen. */
    val summaryNotes: Map<String, String> = emptyMap(),
    val consents: List<ConsentDto> = emptyList(),
    val requests: List<SupportRequestDto> = emptyList(),
    val chatAccessRequests: List<ChatAccessRequestDto> = emptyList(),
    val chatAccessGrants: List<ChatAccessGrantDto> = emptyList(),
)

@Serializable
data class MessageDto(
    val id: String,
    val role: String,
    /** Sobre cifrado, nunca texto en claro. */
    val content: String,
    val createdAtEpochMillis: Long,
    val promptId: String? = null,
)

@Serializable
data class ConversationDto(
    val id: String,
    val youthId: String,
    val startedAtEpochMillis: Long,
    val lastAccessEpochMillis: Long,
    val messages: List<MessageDto> = emptyList(),
)

@Serializable
data class ContextResponseDto(
    val id: String,
    val youthId: String,
    val questionKey: String,
    val optionKey: String,
    val answeredAtEpochMillis: Long,
    val conversationId: String? = null,
)

@Serializable
data class ToolCompletionDto(
    val id: String,
    val youthId: String,
    val toolKey: String,
    val completedAtEpochMillis: Long,
    /** Sobre cifrado de la reflexión, o `null`. */
    val reflection: String? = null,
)

@Serializable
data class ScopeEntryDto(val type: String, val key: String)

@Serializable
data class SummaryDto(
    val id: String,
    val youthId: String,
    val createdAtEpochMillis: Long,
    val scope: List<ScopeEntryDto>,
)

@Serializable
data class ConsentDto(
    val id: String,
    val youthId: String,
    val summaryId: String,
    val scope: List<ScopeEntryDto>,
    val granted: Boolean,
    val recordedAtEpochMillis: Long,
    val revokedAtEpochMillis: Long? = null,
)

@Serializable
data class SupportRequestDto(
    val id: String,
    val youthId: String,
    val state: String,
    val consentRecordId: String,
    val summaryId: String,
    val createdAtEpochMillis: Long,
    val updatedAtEpochMillis: Long,
    val revokedAtEpochMillis: Long? = null,
    val revocationReason: String? = null,
    val stateNote: String? = null,
)

@Serializable
data class ChatAccessScopeDto(
    val type: String,
    val fromEpochMillis: Long? = null,
    val toEpochMillis: Long? = null,
    val messageIds: List<String> = emptyList(),
)

@Serializable
data class ChatAccessRequestDto(
    val id: String,
    val youthId: String,
    val caseId: String,
    val scope: ChatAccessScopeDto,
    val purpose: String,
    val recipientCategory: String,
    val requestedAtEpochMillis: Long,
    val maxDurationMillis: Long,
    val status: String,
    val consentRecordId: String? = null,
)

@Serializable
data class ChatAccessGrantDto(
    val id: String,
    val requestId: String,
    val caseId: String,
    val scope: ChatAccessScopeDto,
    val grantedAtEpochMillis: Long,
    val expiresAtEpochMillis: Long,
    val revokedAtEpochMillis: Long? = null,
)

// ---------------------------------------------------------------------------
// Mappers explícitos (dominio ⇄ DTO)
// ---------------------------------------------------------------------------

private inline fun <reified T : Enum<T>> enumOrNull(name: String?): T? =
    name?.let { n -> enumValues<T>().firstOrNull { it.name == n } }

fun YouthProfile.toDto(): ProfileDto = ProfileDto(
    profileId = id.value,
    alias = alias.value,
    ageBand = ageBand.name,
    createdAtEpochMillis = createdAtEpochMillis,
    shareSignalsWithProfessional = shareDefaults.shareSignalsWithProfessional,
    shareToolsWithProfessional = shareDefaults.shareToolsWithProfessional,
)

fun ProfileDto.toDomain(): YouthProfile = YouthProfile(
    id = ProfileId(profileId),
    alias = YouthAlias(alias),
    ageBand = enumOrNull<AgeBand>(ageBand) ?: AgeBand.MID_TEEN,
    createdAtEpochMillis = createdAtEpochMillis,
    shareDefaults = ShareDefaults(
        shareSignalsWithProfessional = shareSignalsWithProfessional,
        shareToolsWithProfessional = shareToolsWithProfessional,
    ),
)

fun ConversationMessage.toDto(): MessageDto = MessageDto(
    id = id.value,
    role = role.name,
    content = content,
    createdAtEpochMillis = createdAtEpochMillis,
    promptId = promptId,
)

fun MessageDto.toDomain(): ConversationMessage = ConversationMessage(
    id = MessageId(id),
    role = enumOrNull<ConversationRole>(role) ?: ConversationRole.PUENTE,
    content = content,
    createdAtEpochMillis = createdAtEpochMillis,
    promptId = promptId,
)

fun Conversation.toDto(): ConversationDto = ConversationDto(
    id = id.value,
    youthId = youthId.value,
    startedAtEpochMillis = startedAtEpochMillis,
    lastAccessEpochMillis = lastAccessEpochMillis,
    messages = messages.map { it.toDto() },
)

fun ConversationDto.toDomain(): Conversation = Conversation(
    id = ConversationId(id),
    youthId = ProfileId(youthId),
    startedAtEpochMillis = startedAtEpochMillis,
    messages = messages.map { it.toDomain() },
    lastAccessEpochMillis = lastAccessEpochMillis,
)

fun ContextResponse.toDto(): ContextResponseDto = ContextResponseDto(
    id = id.value,
    youthId = youthId.value,
    questionKey = questionKey.value,
    optionKey = optionKey.value,
    answeredAtEpochMillis = answeredAtEpochMillis,
    conversationId = conversationId?.value,
)

fun ContextResponseDto.toDomain(): ContextResponse = ContextResponse(
    id = ContextResponseId(id),
    youthId = ProfileId(youthId),
    questionKey = QuestionKey(questionKey),
    optionKey = OptionKey(optionKey),
    answeredAtEpochMillis = answeredAtEpochMillis,
    conversationId = conversationId?.let { ConversationId(it) },
)

fun ToolCompletion.toDto(): ToolCompletionDto = ToolCompletionDto(
    id = id.value,
    youthId = youthId.value,
    toolKey = toolKey.value,
    completedAtEpochMillis = completedAtEpochMillis,
    reflection = reflection,
)

fun ToolCompletionDto.toDomain(): ToolCompletion = ToolCompletion(
    id = ToolCompletionId(id),
    youthId = ProfileId(youthId),
    toolKey = ToolKey(toolKey),
    completedAtEpochMillis = completedAtEpochMillis,
    reflection = reflection,
)

fun ShareScopeEntry.toDto(): ScopeEntryDto = when (this) {
    is ShareScopeEntry.Signal -> ScopeEntryDto(TYPE_SIGNAL, key)
    is ShareScopeEntry.Tool -> ScopeEntryDto(TYPE_TOOL, key)
    is ShareScopeEntry.Assessment -> ScopeEntryDto(TYPE_ASSESSMENT, key)
}

fun ScopeEntryDto.toDomain(): ShareScopeEntry = when (type) {
    TYPE_TOOL -> ShareScopeEntry.Tool(key)
    TYPE_ASSESSMENT -> ShareScopeEntry.Assessment(key)
    else -> ShareScopeEntry.Signal(key)
}

fun ShareableSummary.toDto(): SummaryDto = SummaryDto(
    id = id.value,
    youthId = youthId.value,
    createdAtEpochMillis = createdAtEpochMillis,
    scope = scope.map { it.toDto() },
)

/** La nota NO se reconstruye aquí: vive aparte, cifrada, en `summaryNotes`. */
fun SummaryDto.toDomain(): ShareableSummary = ShareableSummary(
    id = SummaryId(id),
    youthId = ProfileId(youthId),
    createdAtEpochMillis = createdAtEpochMillis,
    scope = scope.map { it.toDomain() }.toSet(),
    note = null,
)

fun ConsentRecord.toDto(): ConsentDto = ConsentDto(
    id = id.value,
    youthId = youthId.value,
    summaryId = summaryId.value,
    scope = scope.map { it.toDto() },
    granted = granted,
    recordedAtEpochMillis = recordedAtEpochMillis,
    revokedAtEpochMillis = revokedAtEpochMillis,
)

fun ConsentDto.toDomain(): ConsentRecord = ConsentRecord(
    id = ConsentId(id),
    youthId = ProfileId(youthId),
    summaryId = SummaryId(summaryId),
    scope = scope.map { it.toDomain() }.toSet(),
    granted = granted,
    recordedAtEpochMillis = recordedAtEpochMillis,
    revokedAtEpochMillis = revokedAtEpochMillis,
)

fun SupportRequest.toDto(): SupportRequestDto = SupportRequestDto(
    id = id.value,
    youthId = youthId.value,
    state = state.name,
    consentRecordId = consentRecordId.value,
    summaryId = summaryId.value,
    createdAtEpochMillis = createdAtEpochMillis,
    updatedAtEpochMillis = updatedAtEpochMillis,
    revokedAtEpochMillis = revokedAtEpochMillis,
    revocationReason = revocationReason?.name,
    stateNote = stateNote,
)

fun SupportRequestDto.toDomain(): SupportRequest = SupportRequest(
    id = SupportRequestId(id),
    youthId = ProfileId(youthId),
    state = enumOrNull<SupportRequestState>(state) ?: SupportRequestState.DRAFT,
    consentRecordId = ConsentId(consentRecordId),
    summaryId = SummaryId(summaryId),
    createdAtEpochMillis = createdAtEpochMillis,
    updatedAtEpochMillis = updatedAtEpochMillis,
    revokedAtEpochMillis = revokedAtEpochMillis,
    revocationReason = enumOrNull<RevocationReason>(revocationReason),
    stateNote = stateNote,
)

fun ChatAccessScope.toDto(): ChatAccessScopeDto = when (this) {
    is ChatAccessScope.TimeRange -> ChatAccessScopeDto(
        type = TYPE_TIME_RANGE,
        fromEpochMillis = fromEpochMillis,
        toEpochMillis = toEpochMillis,
    )
    is ChatAccessScope.Messages -> ChatAccessScopeDto(
        type = TYPE_MESSAGES,
        messageIds = messageIds.map { it.value },
    )
}

fun ChatAccessScopeDto.toDomain(): ChatAccessScope {
    val ids = messageIds.map { MessageId(it) }
    // `Messages` exige lista no vacía: si el almacén trae una vacía, no se puede
    // reconstruir ese tipo; se degrada a un rango vacío antes que reventar.
    return if (type == TYPE_MESSAGES && ids.isNotEmpty()) {
        ChatAccessScope.Messages(ids)
    } else {
        val from = fromEpochMillis ?: 0L
        val to = toEpochMillis ?: from
        ChatAccessScope.TimeRange(from, to)
    }
}

fun ChatAccessRequest.toDto(): ChatAccessRequestDto = ChatAccessRequestDto(
    id = id.value,
    youthId = youthId.value,
    caseId = caseId,
    scope = scope.toDto(),
    purpose = purpose.name,
    recipientCategory = recipientCategory,
    requestedAtEpochMillis = requestedAtEpochMillis,
    maxDurationMillis = maxDurationMillis,
    status = status.name,
    consentRecordId = consentRecordId?.value,
)

fun ChatAccessRequestDto.toDomain(): ChatAccessRequest = ChatAccessRequest(
    id = ChatAccessRequestId(id),
    youthId = ProfileId(youthId),
    caseId = caseId,
    scope = scope.toDomain(),
    purpose = enumOrNull<ChatAccessPurpose>(purpose) ?: ChatAccessPurpose.CONTEXT_FOR_REVIEW,
    recipientCategory = recipientCategory,
    requestedAtEpochMillis = requestedAtEpochMillis,
    maxDurationMillis = maxDurationMillis,
    status = enumOrNull<ChatAccessRequestStatus>(status) ?: ChatAccessRequestStatus.PENDING,
    consentRecordId = consentRecordId?.let { ConsentId(it) },
)

fun ChatAccessGrant.toDto(): ChatAccessGrantDto = ChatAccessGrantDto(
    id = id.value,
    requestId = requestId.value,
    caseId = caseId,
    scope = scope.toDto(),
    grantedAtEpochMillis = grantedAtEpochMillis,
    expiresAtEpochMillis = expiresAtEpochMillis,
    revokedAtEpochMillis = revokedAtEpochMillis,
)

fun ChatAccessGrantDto.toDomain(): ChatAccessGrant = ChatAccessGrant(
    id = ChatAccessGrantId(id),
    requestId = ChatAccessRequestId(requestId),
    caseId = caseId,
    scope = scope.toDomain(),
    grantedAtEpochMillis = grantedAtEpochMillis,
    expiresAtEpochMillis = expiresAtEpochMillis,
    revokedAtEpochMillis = revokedAtEpochMillis,
)

private const val TYPE_SIGNAL = "signal"
private const val TYPE_TOOL = "tool"
private const val TYPE_ASSESSMENT = "assessment"
private const val TYPE_TIME_RANGE = "time_range"
private const val TYPE_MESSAGES = "messages"
