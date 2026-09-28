package bo.puentejoven.core.data.local

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.Clock
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.data.repository.ChatAccessRepository
import bo.puentejoven.core.data.repository.ConversationRepository
import bo.puentejoven.core.data.repository.ContextCheckRepository
import bo.puentejoven.core.data.repository.ReportRepository
import bo.puentejoven.core.data.repository.SharingRepository
import bo.puentejoven.core.data.repository.SignalsRepository
import bo.puentejoven.core.data.repository.SupportRepository
import bo.puentejoven.core.data.repository.ToolsRepository
import bo.puentejoven.core.data.repository.YouthRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.AssessmentId
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
import bo.puentejoven.core.model.JourneyEntry
import bo.puentejoven.core.model.MessageId
import bo.puentejoven.core.model.PersonalReport
import bo.puentejoven.core.model.ProfileId
import bo.puentejoven.core.model.PinPolicy
import bo.puentejoven.core.model.ReportId
import bo.puentejoven.core.model.RetentionPurgeResult
import bo.puentejoven.core.model.RetentionStatus
import bo.puentejoven.core.model.RetentionPolicy
import bo.puentejoven.core.model.RevocationReason
import bo.puentejoven.core.model.ShareScopeEntry
import bo.puentejoven.core.model.ShareableSummary
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SituationMap
import bo.puentejoven.core.model.SummaryId
import bo.puentejoven.core.model.SummaryNote
import bo.puentejoven.core.model.SupportRequest
import bo.puentejoven.core.model.SupportRequestId
import bo.puentejoven.core.model.SupportRequestState
import bo.puentejoven.core.model.ToolCompletion
import bo.puentejoven.core.model.ToolKey
import bo.puentejoven.core.model.YouthAlias
import bo.puentejoven.core.model.YouthProfile
import bo.puentejoven.core.data.repository.RetentionRepository
import bo.puentejoven.core.security.InMemorySecureLocalStore
import bo.puentejoven.core.security.LocalCipher
import bo.puentejoven.core.security.Pbkdf2PinHasher
import bo.puentejoven.core.security.PinHasher
import bo.puentejoven.core.security.PinSecret
import bo.puentejoven.core.security.SecureLocalStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementación **local de demostración** de todos los contratos de repositorio.
 *
 * Características:
 * - Todo vive en memoria: no hay backend, ni red, ni persistencia real todavía.
 * - Contenido del chat cifrado con [LocalCipher] antes de guardarse.
 * - Datos sintéticos de [DemoFixtures]; nunca datos reales (guardrail #8).
 *
 * Al sustituirse por adaptadores remotos, la firma de los contratos no cambia.
 */
@Singleton
class LocalPuenteRepository @Inject constructor(
    private val clock: Clock,
    private val cipher: LocalCipher,
    /**
     * Almacén de secretos. Valor por defecto solo para pruebas de JVM: en la app
     * Hilt inyecta [EncryptedPreferencesSecureLocalStore] (Keystore).
     */
    private val secureStore: SecureLocalStore = InMemorySecureLocalStore(),
    private val pinHasher: PinHasher = Pbkdf2PinHasher(),
) : YouthRepository,
    ConversationRepository,
    ContextCheckRepository,
    SignalsRepository,
    ToolsRepository,
    ReportRepository,
    SharingRepository,
    SupportRepository,
    ChatAccessRepository,
    RetentionRepository {

    private val profileState = MutableStateFlow<YouthProfile?>(DemoFixtures.youthProfile)
    private val sessionUnlocked = MutableStateFlow(false)

    /** Derivado del PIN en memoria. Nunca el PIN en claro. */
    private var pinSecret: PinSecret? = null

    /** Último acceso al chat: base de la política de retención. */
    private var lastChatAccessEpochMillis: Long? = null

    private val conversationState = MutableStateFlow<Conversation?>(null)

    private val responsesState = MutableStateFlow<List<ContextResponse>>(emptyList())
    private val completionsState = MutableStateFlow<List<ToolCompletion>>(emptyList())
    private val consentsState = MutableStateFlow<List<ConsentRecord>>(emptyList())
    private val requestsState = MutableStateFlow<List<SupportRequest>>(emptyList())
    /**
     * Resúmenes construidos. La nota NO viaja dentro del resumen: es texto libre
     * del joven y se guarda aparte, cifrada, en [summaryNotesState].
     */
    private val summariesState = MutableStateFlow<Map<String, ShareableSummary>>(emptyMap())

    /** Notas de resumen cifradas, indexadas por id de resumen. */
    private val summaryNotesState = MutableStateFlow<Map<String, String>>(emptyMap())

    private val chatAccessRequestsState = MutableStateFlow<List<ChatAccessRequest>>(emptyList())
    private val chatAccessGrantsState = MutableStateFlow<List<ChatAccessGrant>>(emptyList())

    private var idCounter = 0

    private fun nextId(prefix: String): String {
        idCounter += 1
        return "$prefix-${idCounter.toString().padStart(4, '0')}"
    }

    private fun currentYouthId(): ProfileId? = profileState.value?.id

    // -----------------------------------------------------------------------
    // YouthRepository
    // -----------------------------------------------------------------------

    override fun observeProfile(): Flow<YouthProfile?> = profileState.asStateFlow()

    override suspend fun getProfile(): AppResult<YouthProfile> {
        val profile = profileState.value
            ?: return AppResult.Failure(UiError.NotFound(technical = "profile is null"))
        return AppResult.Success(profile)
    }

    override suspend fun createProfile(
        alias: String,
        ageBand: AgeBand,
        pin: String,
    ): AppResult<YouthProfile> {
        val trimmed = alias.trim()
        if (trimmed.isEmpty()) {
            return AppResult.Failure(UiError.Validation(technical = "alias blank"))
        }
        if (!PinPolicy.isWellFormed(pin)) {
            // Nunca se devuelve el PIN ni su longitud concreta en el error.
            return AppResult.Failure(UiError.Validation(technical = "pin malformed"))
        }
        val profile = YouthProfile(
            id = ProfileId(DemoFixtures.DEMO_YOUTH_ID),
            alias = YouthAlias(trimmed),
            ageBand = ageBand,
            createdAtEpochMillis = clock.nowEpochMillis(),
        )
        profileState.value = profile
        persistPinSecret(pinHasher.createSecret(pin))
        // Crear perfil = empezar de cero: el cifrado debe quedar operativo.
        prepareCipher()
        return AppResult.Success(profile)
    }

    /**
     * Deja el material de claves listo para usar.
     *
     * Si [LocalCipher.ensureKeyMaterial] devuelve `false`, la clave existió y ya
     * no está: no se regenera en silencio. Se destruye el rastro y se prepara
     * material NUEVO de forma explícita (lo cifrado antes ya es irrecuperable).
     */
    private suspend fun prepareCipher() {
        if (cipher.ensureKeyMaterial()) return
        cipher.destroyKeyMaterial()
        cipher.ensureKeyMaterial()
    }

    override suspend fun isPinConfigured(): Boolean {
        if (pinSecret != null) return true
        val salt = secureStore.read(SecureLocalStore.KEY_PIN_SALT) ?: return false
        val hash = secureStore.read(SecureLocalStore.KEY_PIN_HASH) ?: return false
        val iterations = secureStore.read(SecureLocalStore.KEY_PIN_ITERATIONS)
            ?.toIntOrNull()
            ?: return false
        pinSecret = PinSecret(salt = salt, hash = hash, iterations = iterations)
        return true
    }

    override suspend fun unlockSession(pin: String): AppResult<Unit> {
        if (!PinPolicy.isWellFormed(pin)) {
            return AppResult.Failure(UiError.Validation(technical = "pin malformed"))
        }
        val secret = pinSecret
            ?: restorePinSecret()
            ?: return AppResult.Failure(UiError.NotFound(technical = "pin not configured"))

        if (!pinHasher.verify(pin, secret)) {
            // Mensaje idéntico para cualquier fallo: no revela si el alias existe,
            // cuántos dígitos fallaron ni cuántos intentos quedan.
            return AppResult.Failure(UiError.Authentication(technical = "pin mismatch"))
        }
        if (profileState.value == null) {
            return AppResult.Failure(UiError.NotFound(technical = "no profile to unlock"))
        }
        sessionUnlocked.value = true
        return AppResult.Success(Unit)
    }

    override suspend fun lockSession(): AppResult<Unit> {
        // El PIN NO se borra: cerrar sesión no es borrar la cuenta local.
        sessionUnlocked.value = false
        return AppResult.Success(Unit)
    }

    override fun observeSessionUnlocked(): Flow<Boolean> = sessionUnlocked.asStateFlow()

    override suspend fun getRetentionPolicy(): AppResult<RetentionPolicy> =
        AppResult.Success(RetentionPolicy.MVP_DEFAULT)

    // -----------------------------------------------------------------------
    // RetentionRepository (TASK-003)
    // -----------------------------------------------------------------------

    /**
     * Purga TODO el contenido local vencido, no solo el chat.
     *
     * Ventanas aplicadas (cada una lee de [RetentionPolicy], nunca un literal):
     * - Chat: [RetentionPolicy.chatRetentionDays] desde el ÚLTIMO acceso.
     * - Insumos del reporte (respuestas, herramientas): [RetentionPolicy.reportRetentionDays]
     *   desde su propia marca de tiempo.
     * - Borradores (resúmenes, solicitudes en DRAFT): [RetentionPolicy.draftRetentionDays].
     * - Accesos temporales concedidos: vencen por su propia fecha de expiración.
     *
     * Excepción deliberada: los consentimientos NO se purgan solos. Son la
     * evidencia de que un acceso fue autorizado y no contienen texto libre;
     * solo se destruyen con [deleteAllLocalContent].
     */
    override suspend fun purgeExpired(nowEpochMillis: Long): AppResult<RetentionPurgeResult> {
        val policy = RetentionPolicy.MVP_DEFAULT

        // 1) Chat personal: la ventana corre desde el último acceso.
        var purgedConversations = 0
        var purgedMessages = 0
        val lastAccess = lastChatAccessEpochMillis
        if (lastAccess != null &&
            nowEpochMillis - lastAccess >= policy.chatRetentionDays * DAY_MILLIS
        ) {
            val current = conversationState.value
            if (current != null) {
                purgedConversations = 1
                purgedMessages = current.messages.size
            }
            conversationState.value = null
            lastChatAccessEpochMillis = null
        }

        // 2) Insumos del reporte.
        val reportWindow = policy.reportRetentionDays * DAY_MILLIS
        val keptResponses = responsesState.value.filter {
            nowEpochMillis - it.answeredAtEpochMillis < reportWindow
        }
        val purgedResponses = responsesState.value.size - keptResponses.size
        responsesState.value = keptResponses

        val keptCompletions = completionsState.value.filter {
            nowEpochMillis - it.completedAtEpochMillis < reportWindow
        }
        val purgedCompletions = completionsState.value.size - keptCompletions.size
        completionsState.value = keptCompletions

        // 3) Borradores: resúmenes y solicitudes que nunca se enviaron.
        val draftWindow = policy.draftRetentionDays * DAY_MILLIS
        val keptSummaries = summariesState.value.filterValues {
            nowEpochMillis - it.createdAtEpochMillis < draftWindow
        }
        val purgedSummaries = summariesState.value.size - keptSummaries.size
        summariesState.value = keptSummaries
        // Las notas cifradas siguen la suerte de su resumen: no quedan huérfanas.
        summaryNotesState.value = summaryNotesState.value.filterKeys { keptSummaries.containsKey(it) }

        val keptRequests = requestsState.value.filter {
            it.state != SupportRequestState.DRAFT ||
                nowEpochMillis - it.updatedAtEpochMillis < draftWindow
        }
        val purgedDrafts = requestsState.value.size - keptRequests.size
        requestsState.value = keptRequests

        // 4) Accesos temporales al chat: vencidos o revocados.
        val keptGrants = chatAccessGrantsState.value.filter {
            it.revokedAtEpochMillis == null && nowEpochMillis < it.expiresAtEpochMillis
        }
        val purgedGrants = chatAccessGrantsState.value.size - keptGrants.size
        chatAccessGrantsState.value = keptGrants

        return AppResult.Success(
            RetentionPurgeResult(
                policy = policy,
                purgedConversations = purgedConversations,
                purgedMessages = purgedMessages,
                purgedResponses = purgedResponses,
                purgedCompletions = purgedCompletions,
                purgedSummaries = purgedSummaries,
                purgedDrafts = purgedDrafts,
                purgedGrants = purgedGrants,
                executedAtEpochMillis = nowEpochMillis,
            ),
        )
    }

    override suspend fun retentionStatus(nowEpochMillis: Long): AppResult<RetentionStatus> {
        val policy = RetentionPolicy.MVP_DEFAULT
        val lastAccess = lastChatAccessEpochMillis
            ?: return AppResult.Success(
                RetentionStatus(
                    policy = policy,
                    chatDaysUntilExpiry = null,
                    needsRenewalNotice = false,
                    lastChatAccessEpochMillis = null,
                ),
            )

        val elapsedDays = ((nowEpochMillis - lastAccess) / DAY_MILLIS).toInt().coerceAtLeast(0)
        return AppResult.Success(
            RetentionStatus(
                policy = policy,
                chatDaysUntilExpiry = (policy.chatRetentionDays - elapsedDays).coerceAtLeast(0),
                needsRenewalNotice = elapsedDays >= policy.chatRenewalNoticeDays,
                lastChatAccessEpochMillis = lastAccess,
            ),
        )
    }

    override suspend fun deleteAllLocalContent(): AppResult<Unit> {
        // Orden deliberado: primero el contenido, después el material de claves.
        // Así un "borrar todo" no deja derivados huérfanos.
        conversationState.value = null
        responsesState.value = emptyList()
        completionsState.value = emptyList()
        consentsState.value = emptyList()
        requestsState.value = emptyList()
        summariesState.value = emptyMap()
        summaryNotesState.value = emptyMap()
        chatAccessRequestsState.value = emptyList()
        chatAccessGrantsState.value = emptyList()
        // El alias lo escribió el joven: también es contenido local. Borrar todo
        // y conservarlo sería un borrado a medias.
        profileState.value = null
        lastChatAccessEpochMillis = null
        pinSecret = null
        secureStore.clear()
        // Guardrail #4: sin clave, lo que quedara cifrado es irrecuperable.
        cipher.destroyKeyMaterial()
        sessionUnlocked.value = false
        return AppResult.Success(Unit)
    }

    // -----------------------------------------------------------------------
    // PIN: persistencia del derivado (nunca del PIN)
    // -----------------------------------------------------------------------

    private suspend fun persistPinSecret(secret: PinSecret) {
        pinSecret = secret
        secureStore.write(SecureLocalStore.KEY_PIN_SALT, secret.salt)
        secureStore.write(SecureLocalStore.KEY_PIN_HASH, secret.hash)
        secureStore.write(SecureLocalStore.KEY_PIN_ITERATIONS, secret.iterations.toString())
    }

    private suspend fun restorePinSecret(): PinSecret? {
        val salt = secureStore.read(SecureLocalStore.KEY_PIN_SALT) ?: return null
        val hash = secureStore.read(SecureLocalStore.KEY_PIN_HASH) ?: return null
        val iterations = secureStore.read(SecureLocalStore.KEY_PIN_ITERATIONS)
            ?.toIntOrNull()
            ?: return null
        return PinSecret(salt = salt, hash = hash, iterations = iterations)
            .also { pinSecret = it }
    }

    // -----------------------------------------------------------------------
    // Cifrado en reposo: los tres campos de texto libre del joven
    // (mensajes del chat, reflexión de herramienta, nota del resumen)
    // entran y salen SIEMPRE por aquí.
    // -----------------------------------------------------------------------

    private fun encryptStored(plainText: String): String = cipher.encrypt(plainText)

    /**
     * Descifra en la frontera de lectura. Si el material de claves ya no está,
     * no se devuelve el sobre ni se propaga la excepción con datos: se devuelve
     * un marcador neutro, porque el contenido es irrecuperable por definición.
     */
    private fun decryptStored(envelope: String): String =
        runCatching { cipher.decrypt(envelope) }.getOrDefault(UNREADABLE_CONTENT)

    private fun ToolCompletion.withPlainReflection(): ToolCompletion {
        val envelope = reflection ?: return this
        return copy(reflection = decryptStored(envelope))
    }

    // -----------------------------------------------------------------------
    // ConversationRepository
    // -----------------------------------------------------------------------

    /**
     * Conversación con el contenido ya descifrado.
     *
     * En reposo los mensajes están cifrados; el descifrado ocurre ÚNICAMENTE en
     * la frontera de lectura, para que la UI nunca tenga que saberlo (F3).
     */
    override fun observeActiveConversation(): Flow<Conversation?> =
        conversationState.map { conversation ->
            conversation?.copy(
                messages = conversation.messages.map { message ->
                    message.copy(content = decryptStored(message.content))
                },
            )
        }

    override suspend fun startConversation(): AppResult<Conversation> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        val now = clock.nowEpochMillis()
        val conversation = Conversation(
            id = ConversationId(nextId("conv")),
            youthId = youthId,
            startedAtEpochMillis = now,
            lastAccessEpochMillis = now,
        )
        conversationState.value = conversation
        lastChatAccessEpochMillis = now
        return AppResult.Success(conversation)
    }

    override suspend fun appendYouthMessage(
        conversationId: ConversationId,
        content: String,
    ): AppResult<ConversationMessage> {
        if (content.isBlank()) {
            return AppResult.Failure(UiError.Validation(technical = "empty youth message"))
        }
        val conversation = conversationState.value
        if (conversation == null || conversation.id != conversationId) {
            return AppResult.Failure(UiError.NotFound(technical = "conversation mismatch"))
        }
        val now = clock.nowEpochMillis()
        val message = ConversationMessage(
            id = MessageId(nextId("msg")),
            role = ConversationRole.YOUTH,
            // El contenido del joven se cifra localmente antes de almacenarse.
            content = encryptStored(content),
            createdAtEpochMillis = now,
        )
        conversationState.value = conversation.copy(
            messages = conversation.messages + message,
            lastAccessEpochMillis = now,
        )
        lastChatAccessEpochMillis = now
        // Se devuelve el texto legible; lo guardado es el sobre cifrado.
        return AppResult.Success(message.copy(content = content))
    }

    override suspend fun appendPuenteMessage(
        conversationId: ConversationId,
        content: String,
        promptId: String,
    ): AppResult<ConversationMessage> {
        val conversation = conversationState.value
        if (conversation == null || conversation.id != conversationId) {
            return AppResult.Failure(UiError.NotFound(technical = "conversation mismatch"))
        }
        val now = clock.nowEpochMillis()
        val message = ConversationMessage(
            id = MessageId(nextId("msg")),
            role = ConversationRole.PUENTE,
            // F1: los turnos de la app también son contenido del joven: se cifran.
            content = encryptStored(content),
            createdAtEpochMillis = now,
            promptId = promptId,
        )
        conversationState.value = conversation.copy(
            messages = conversation.messages + message,
            lastAccessEpochMillis = now,
        )
        lastChatAccessEpochMillis = now
        return AppResult.Success(message.copy(content = content))
    }

    override suspend fun closeConversation(conversationId: ConversationId): AppResult<Unit> {
        val conversation = conversationState.value
        if (conversation == null || conversation.id != conversationId) {
            return AppResult.Failure(UiError.NotFound(technical = "conversation mismatch"))
        }
        conversationState.value = null
        return AppResult.Success(Unit)
    }

    // -----------------------------------------------------------------------
    // ContextCheckRepository
    // -----------------------------------------------------------------------

    override suspend fun availableQuestionKeys(): AppResult<List<String>> =
        AppResult.Success(
            listOf(
                "hoy_como_estas",
                "donde_ocurre",
                "cada_cuanto",
                "con_quien_puedes_contar",
            ),
        )

    override suspend fun recordResponse(
        questionKey: String,
        optionKey: String,
        conversationId: ConversationId?,
    ): AppResult<ContextResponse> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        if (questionKey.isBlank() || optionKey.isBlank()) {
            return AppResult.Failure(UiError.Validation(technical = "blank question/option"))
        }
        val response = ContextResponse(
            id = ContextResponseId(nextId("ctx")),
            youthId = youthId,
            questionKey = bo.puentejoven.core.model.QuestionKey(questionKey),
            optionKey = bo.puentejoven.core.model.OptionKey(optionKey),
            answeredAtEpochMillis = clock.nowEpochMillis(),
            conversationId = conversationId,
        )
        responsesState.value = responsesState.value + response
        return AppResult.Success(response)
    }

    override fun observeResponses(): Flow<List<ContextResponse>> = responsesState.asStateFlow()

    // -----------------------------------------------------------------------
    // SignalsRepository
    // -----------------------------------------------------------------------

    override fun observeSignals(): Flow<List<Signal>> =
        MutableStateFlow(DemoFixtures.signals).asStateFlow()

    override fun observeSituationMap(): Flow<SituationMap> =
        MutableStateFlow(DemoFixtures.situationMap).asStateFlow()

    override suspend fun getAttentionAssessment() =
        AppResult.Success(DemoFixtures.attentionAssessment)

    // -----------------------------------------------------------------------
    // ToolsRepository
    // -----------------------------------------------------------------------

    override suspend fun availableTools() = AppResult.Success(DemoFixtures.briefTools)

    override suspend fun recordCompletion(
        toolKey: ToolKey,
        reflection: String?,
    ): AppResult<ToolCompletion> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        if (DemoFixtures.briefTools.none { it.key == toolKey }) {
            return AppResult.Failure(UiError.NotFound(technical = "unknown toolKey"))
        }
        // F2: la reflexión es texto libre del joven: se guarda cifrada.
        val plainReflection = reflection?.trim()?.takeIf { it.isNotEmpty() }
        val completion = ToolCompletion(
            id = bo.puentejoven.core.model.ToolCompletionId(nextId("tool")),
            youthId = youthId,
            toolKey = toolKey,
            completedAtEpochMillis = clock.nowEpochMillis(),
            reflection = plainReflection?.let(::encryptStored),
        )
        completionsState.value = completionsState.value + completion
        return AppResult.Success(completion.copy(reflection = plainReflection))
    }

    override fun observeCompletions(): Flow<List<ToolCompletion>> =
        completionsState.map { list -> list.map { it.withPlainReflection() } }

    // -----------------------------------------------------------------------
    // ReportRepository
    // -----------------------------------------------------------------------

    override suspend fun getPersonalReport(): AppResult<PersonalReport> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        return AppResult.Success(
            PersonalReport(
                id = ReportId(nextId("report")),
                youthId = youthId,
                generatedAtEpochMillis = clock.nowEpochMillis(),
                signals = DemoFixtures.signals,
                assessments = listOf(DemoFixtures.attentionAssessment),
                toolCompletions = completionsState.value.map { it.withPlainReflection() },
                journeyHighlights = DemoFixtures.journey,
            ),
        )
    }

    override fun observeJourney(): Flow<List<JourneyEntry>> =
        MutableStateFlow(DemoFixtures.journey).asStateFlow()

    // -----------------------------------------------------------------------
    // SharingRepository
    // -----------------------------------------------------------------------

    override suspend fun buildShareableSummary(
        scope: Set<ShareScopeEntry>,
        note: SummaryNote?,
    ): AppResult<ShareableSummary> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        // La nota es texto libre del joven: se guarda cifrada y aparte.
        // `SummaryNote` valida una longitud máxima, así que el sobre no cabe ahí.
        val plainNote = note?.value?.trim()?.takeIf { it.isNotEmpty() }
        val stored = ShareableSummary(
            id = SummaryId(nextId("summary")),
            youthId = youthId,
            createdAtEpochMillis = clock.nowEpochMillis(),
            scope = scope,
            note = null,
        )
        summariesState.value = summariesState.value + (stored.id.value to stored)
        if (plainNote != null) {
            summaryNotesState.value =
                summaryNotesState.value + (stored.id.value to encryptStored(plainNote))
        }
        return AppResult.Success(stored.copy(note = plainNote?.let(::SummaryNote)))
    }

    override fun observeSummaries(): Flow<List<ShareableSummary>> =
        summariesState.map { map ->
            map.values.map { summary ->
                val envelope = summaryNotesState.value[summary.id.value] ?: return@map summary
                summary.copy(note = SummaryNote(decryptStored(envelope)))
            }
        }

    override suspend fun recordConsent(
        summaryId: SummaryId,
        scope: Set<ShareScopeEntry>,
        granted: Boolean,
    ): AppResult<ConsentRecord> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        if (scope.isEmpty()) {
            return AppResult.Failure(UiError.Validation(technical = "empty scope"))
        }
        // Invariante: no puede consentirse más de lo que el resumen contiene.
        val summary = summariesState.value[summaryId.value]
            ?: return AppResult.Failure(UiError.NotFound(technical = "summary not found"))
        if (!summary.scope.containsAll(scope)) {
            return AppResult.Failure(
                UiError.Authorization(technical = "consent scope exceeds summary scope"),
            )
        }
        val record = ConsentRecord(
            id = ConsentId(nextId("consent")),
            youthId = youthId,
            summaryId = summaryId,
            scope = scope,
            granted = granted,
            recordedAtEpochMillis = clock.nowEpochMillis(),
        )
        consentsState.value = consentsState.value + record
        return AppResult.Success(record)
    }

    override fun observeConsents(): Flow<List<ConsentRecord>> = consentsState.asStateFlow()

    // -----------------------------------------------------------------------
    // SupportRepository
    // -----------------------------------------------------------------------

    override suspend fun draftRequest(
        consentRecordId: ConsentId,
        summaryId: SummaryId,
    ): AppResult<SupportRequest> {
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        val grantedConsent = consentsState.value
            .firstOrNull { it.id == consentRecordId && it.granted && it.revokedAtEpochMillis == null }
        // Sin consentimiento explícito no se crea ninguna solicitud.
        // Es un fallo de AUTORIZACIÓN (hay identidad, falta permiso), no de autenticación.
        if (grantedConsent == null) {
            return AppResult.Failure(UiError.Authorization(technical = "consent not granted"))
        }
        val now = clock.nowEpochMillis()
        val request = SupportRequest(
            id = SupportRequestId(nextId("request")),
            youthId = youthId,
            state = SupportRequestState.DRAFT,
            consentRecordId = consentRecordId,
            summaryId = summaryId,
            createdAtEpochMillis = now,
            updatedAtEpochMillis = now,
            stateNote = "Tu solicitud está en borrador. Tú decides cuándo autorizarla.",
        )
        requestsState.value = requestsState.value + request
        return AppResult.Success(request)
    }

    override suspend fun authorizeRequest(requestId: SupportRequestId): AppResult<SupportRequest> {
        val current = requestsState.value.firstOrNull { it.id == requestId }
            ?: return AppResult.Failure(UiError.NotFound(technical = "request not found"))
        if (current.state != SupportRequestState.DRAFT) {
            return AppResult.Failure(UiError.Validation(technical = "request not in DRAFT"))
        }
        val updated = current.copy(
            state = SupportRequestState.AUTHORIZED,
            updatedAtEpochMillis = clock.nowEpochMillis(),
            stateNote = "Autorizaste esta solicitud. Aquí verás su estado.",
        )
        requestsState.value = requestsState.value.map { if (it.id == requestId) updated else it }
        return AppResult.Success(updated)
    }

    override suspend fun revokeRequest(requestId: SupportRequestId): AppResult<SupportRequest> {
        val current = requestsState.value.firstOrNull { it.id == requestId }
            ?: return AppResult.Failure(UiError.NotFound(technical = "request not found"))
        if (current.state == SupportRequestState.CLOSED) {
            return AppResult.Failure(UiError.Conflict(technical = "request already closed"))
        }
        val now = clock.nowEpochMillis()
        // Revocar = bloquear futuros accesos. La UI explicará el límite legal real.
        val updated = current.copy(
            state = SupportRequestState.CLOSED,
            revokedAtEpochMillis = now,
            revocationReason = RevocationReason.CONSENT_WITHDRAWN,
            updatedAtEpochMillis = now,
            stateNote = "Retiraste tu consentimiento. Bloqueamos accesos futuros. " +
                "Si la ley obliga a conservar algo ya recibido, se te explicará por separado.",
        )
        requestsState.value = requestsState.value.map { if (it.id == requestId) updated else it }
        return AppResult.Success(updated)
    }

    override fun observeRequest(requestId: SupportRequestId): Flow<SupportRequest?> =
        requestsState.map { list -> list.firstOrNull { it.id == requestId } }

    override fun observeRequests(): Flow<List<SupportRequest>> = requestsState.asStateFlow()

    // -----------------------------------------------------------------------
    // ChatAccessRepository (solo contrato + simulación local; no habilita acceso real)
    // -----------------------------------------------------------------------

    override fun observeChatAccessRequests(): Flow<List<ChatAccessRequest>> =
        chatAccessRequestsState.asStateFlow()

    override fun observeGrants(): Flow<List<ChatAccessGrant>> =
        chatAccessGrantsState.asStateFlow()

    override suspend fun acceptRequest(requestId: ChatAccessRequestId): AppResult<ChatAccessGrant> {
        val current = chatAccessRequestsState.value.firstOrNull { it.id == requestId }
            ?: return AppResult.Failure(UiError.NotFound(technical = "chat access request not found"))
        if (current.status != ChatAccessRequestStatus.PENDING) {
            return AppResult.Failure(UiError.Conflict(technical = "request not pending"))
        }
        val youthId = currentYouthId()
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        val now = clock.nowEpochMillis()
        val consent = ConsentRecord(
            id = ConsentId(nextId("consent")),
            youthId = youthId,
            summaryId = SummaryId("chat-access-${current.id.value}"),
            scope = emptySet(),
            granted = true,
            recordedAtEpochMillis = now,
        )
        consentsState.value = consentsState.value + consent
        val grant = ChatAccessGrant(
            id = ChatAccessGrantId(nextId("grant")),
            requestId = current.id,
            caseId = current.caseId,
            scope = current.scope,
            grantedAtEpochMillis = now,
            expiresAtEpochMillis = now + current.maxDurationMillis,
        )
        chatAccessGrantsState.value = chatAccessGrantsState.value + grant
        chatAccessRequestsState.value = chatAccessRequestsState.value.map {
            if (it.id == requestId) {
                it.copy(status = ChatAccessRequestStatus.GRANTED, consentRecordId = consent.id)
            } else {
                it
            }
        }
        return AppResult.Success(grant)
    }

    override suspend fun declineRequest(requestId: ChatAccessRequestId): AppResult<ChatAccessRequest> {
        val current = chatAccessRequestsState.value.firstOrNull { it.id == requestId }
            ?: return AppResult.Failure(UiError.NotFound(technical = "chat access request not found"))
        if (current.status != ChatAccessRequestStatus.PENDING) {
            return AppResult.Failure(UiError.Conflict(technical = "request not pending"))
        }
        val updated = current.copy(status = ChatAccessRequestStatus.DECLINED)
        chatAccessRequestsState.value = chatAccessRequestsState.value.map {
            if (it.id == requestId) updated else it
        }
        return AppResult.Success(updated)
    }

    override suspend fun revokeGrant(grantId: ChatAccessGrantId): AppResult<ChatAccessGrant> {
        val current = chatAccessGrantsState.value.firstOrNull { it.id == grantId }
            ?: return AppResult.Failure(UiError.NotFound(technical = "grant not found"))
        if (current.revokedAtEpochMillis != null) {
            return AppResult.Failure(UiError.Conflict(technical = "grant already revoked"))
        }
        val updated = current.copy(revokedAtEpochMillis = clock.nowEpochMillis())
        chatAccessGrantsState.value = chatAccessGrantsState.value.map {
            if (it.id == grantId) updated else it
        }
        chatAccessRequestsState.value = chatAccessRequestsState.value.map {
            if (it.id == current.requestId) it.copy(status = ChatAccessRequestStatus.REVOKED) else it
        }
        return AppResult.Success(updated)
    }

    /**
     * Crea una solicitud de acceso sintética para demostración (no hay backend).
     * Solo existe para que TASK-008 criterio #5 pueda simular aceptar/rechazar/revocar.
     */
    fun seedDemoChatAccessRequest() {
        val youthId = currentYouthId() ?: return
        val now = clock.nowEpochMillis()
        val request = ChatAccessRequest(
            id = ChatAccessRequestId(nextId("chatreq")),
            youthId = youthId,
            caseId = "case-opaque-0001",
            scope = ChatAccessScope.TimeRange(fromEpochMillis = now - HOUR, toEpochMillis = now),
            purpose = ChatAccessPurpose.CONTEXT_FOR_REVIEW,
            recipientCategory = "Equipo Puente",
            requestedAtEpochMillis = now,
            maxDurationMillis = DEFAULT_CHAT_ACCESS_WINDOW_MILLIS,
            status = ChatAccessRequestStatus.PENDING,
        )
        chatAccessRequestsState.value = chatAccessRequestsState.value + request
    }

    private companion object {
        const val HOUR = 3_600_000L
        /** 72 h — DECISIONES §6.3(6). */
        const val DEFAULT_CHAT_ACCESS_WINDOW_MILLIS = 72 * HOUR
        /** Un día: base de la política de retención (TASK-003). */
        const val DAY_MILLIS = 24 * HOUR

        /** Marcador neutro cuando el contenido ya no se puede descifrar. */
        const val UNREADABLE_CONTENT = "Contenido no disponible"
    }
}
