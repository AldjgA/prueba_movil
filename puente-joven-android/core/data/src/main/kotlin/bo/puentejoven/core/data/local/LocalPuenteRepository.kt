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
import bo.puentejoven.core.model.ChatAccessGrant
import bo.puentejoven.core.model.ChatAccessGrantId
import bo.puentejoven.core.model.ChatAccessPurpose
import bo.puentejoven.core.model.ChatAccessRequest
import bo.puentejoven.core.model.ChatAccessRequestId
import bo.puentejoven.core.model.ChatAccessRequestStatus
import bo.puentejoven.core.model.ChatAccessScope
import bo.puentejoven.core.model.CheckCatalog
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementación **local** de todos los contratos de repositorio.
 *
 * Características:
 * - Sin backend y sin red. El estado se **persiste** en [PuenteLocalStore]
 *   (DataStore, dos almacenes — TASK-003b); el valor por defecto en memoria es
 *   solo para pruebas de JVM.
 * - Contenido de texto libre del joven cifrado con [LocalCipher] antes de guardarse:
 *   el snapshot guarda **sobres**, nunca texto en claro.
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
    /** Persistencia del estado. En la app, DataStore; en pruebas, en memoria. */
    private val store: PuenteLocalStore = InMemoryPuenteLocalStore(),
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

    /** Todos los perfiles de la instalación (`TASK-025`). */
    private val profilesState =
        MutableStateFlow<List<YouthProfile>>(listOf(DemoFixtures.youthProfile))

    /** Id del perfil activo. `null` si no hay ninguno. */
    private val activeProfileIdState = MutableStateFlow<String?>(DemoFixtures.DEMO_YOUTH_ID)

    /** Perfil activo, derivado de [profilesState] + [activeProfileIdState]. */
    private val profileState = MutableStateFlow<YouthProfile?>(DemoFixtures.youthProfile)

    private val sessionUnlocked = MutableStateFlow(false)

    /**
     * Último acceso al chat **por perfil**: cada uno tiene su propio reloj de
     * retención (`TASK-003`). Es un mapa y no un valor único porque el perfil
     * activo puede cambiar sin perder el de los demás.
     */
    private val lastChatAccessByProfile = mutableMapOf<String, Long?>()

    private var lastChatAccessEpochMillis: Long?
        get() = activeProfileIdState.value?.let { lastChatAccessByProfile[it] }
        set(value) {
            activeProfileIdState.value?.let { lastChatAccessByProfile[it] = value }
        }

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

    /** `true` cuando el estado ya se cargó desde el almacén (una sola vez). */
    private var loaded = false

    /** Protege la carga para que dos accesos simultáneos no la dupliquen. */
    private val loadMutex = Mutex()

    /**
     * Carga en segundo plano: un `Flow` observado antes de cualquier llamada
     * `suspend` también acaba viendo el estado persistido.
     */
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    init {
        scope.launch { ensureLoaded() }
    }

    // -----------------------------------------------------------------------
    // Persistencia (TASK-003b)
    // -----------------------------------------------------------------------

    /**
     * Carga el estado persistido **una sola vez**.
     *
     * Reglas:
     * - Un `schemaVersion` desconocido ⇒ se arranca en vacío (no hay datos de
     *   producción que migrar en el MVP). No revienta.
     * - Si no hay snapshot, se conserva el estado inicial de demostración, que es
     *   el comportamiento que ya tenía la app.
     * - No se vuelve a cargar tras un borrado: `deleteAllLocalContent` limpia el
     *   almacén y el estado en memoria, y no se re-siembra.
     */
    private suspend fun ensureLoaded() {
        if (loaded) return
        loadMutex.withLock {
            if (loaded) return@withLock
            loadFromStore()
            loaded = true
        }
    }

    private suspend fun loadFromStore() {
        val session = store.readSession()
        if (session != null && session.schemaVersion != PUENTE_SCHEMA_VERSION) {
            // Esquema que no entendemos: se ignora por completo.
            return
        }
        if (session == null || session.profiles.isEmpty()) {
            // Sin perfiles persistidos: se conserva el perfil de demostración con
            // el que arranca el repositorio (mismo comportamiento que antes).
            return
        }

        profilesState.value = session.profiles.map { it.profile.toDomain() }
        idCounter = session.idCounter
        session.profiles.forEach { entry ->
            lastChatAccessByProfile[entry.profile.profileId] = entry.lastChatAccessEpochMillis
        }
        val active = session.activeProfileId
            ?.takeIf { candidate -> profilesState.value.any { it.id.value == candidate } }
            ?: profilesState.value.first().id.value
        activeProfileIdState.value = active
        syncActiveProfile()
        loadContentFor(active)
    }

    /** Deja [profileState] apuntando al perfil activo. */
    private fun syncActiveProfile() {
        val id = activeProfileIdState.value
        profileState.value = profilesState.value.firstOrNull { it.id.value == id }
    }

    /**
     * Carga el contenido de **un** perfil.
     *
     * Si no hay contenido persistido, el estado queda **vacío** — nunca el de otro
     * perfil. Ese es el aislamiento: no hay una rama que "reutilice" lo anterior.
     */
    private suspend fun loadContentFor(profileId: String) {
        val content = store.readContent(profileId)
        conversationState.value = content?.conversation?.toDomain()
        responsesState.value = content?.responses?.map { it.toDomain() } ?: emptyList()
        completionsState.value = content?.completions?.map { it.toDomain() } ?: emptyList()
        summariesState.value =
            content?.summaries?.associateBy({ it.id }, { it.toDomain() }) ?: emptyMap()
        summaryNotesState.value = content?.summaryNotes ?: emptyMap()
        consentsState.value = content?.consents?.map { it.toDomain() } ?: emptyList()
        requestsState.value = content?.requests?.map { it.toDomain() } ?: emptyList()
        chatAccessRequestsState.value =
            content?.chatAccessRequests?.map { it.toDomain() } ?: emptyList()
        chatAccessGrantsState.value = content?.chatAccessGrants?.map { it.toDomain() } ?: emptyList()
    }

    /** Vacía el estado de contenido en memoria (cambio de perfil o borrado). */
    private fun clearContentState() {
        conversationState.value = null
        responsesState.value = emptyList()
        completionsState.value = emptyList()
        summariesState.value = emptyMap()
        summaryNotesState.value = emptyMap()
        consentsState.value = emptyList()
        requestsState.value = emptyList()
        chatAccessRequestsState.value = emptyList()
        chatAccessGrantsState.value = emptyList()
    }

    private suspend fun persistSession() {
        store.writeSession(
            SessionSnapshot(
                schemaVersion = PUENTE_SCHEMA_VERSION,
                profiles = profilesState.value.map { profile ->
                    ProfileEntryDto(
                        profile = profile.toDto(),
                        lastChatAccessEpochMillis = lastChatAccessByProfile[profile.id.value],
                    )
                },
                activeProfileId = activeProfileIdState.value,
                idCounter = idCounter,
            ),
        )
    }

    private suspend fun persistContent() {
        val profileId = activeProfileIdState.value ?: return
        store.writeContent(
            profileId,
            ContentSnapshot(
                conversation = conversationState.value?.toDto(),
                responses = responsesState.value.map { it.toDto() },
                completions = completionsState.value.map { it.toDto() },
                summaries = summariesState.value.values.map { it.toDto() },
                summaryNotes = summaryNotesState.value,
                consents = consentsState.value.map { it.toDto() },
                requests = requestsState.value.map { it.toDto() },
                chatAccessRequests = chatAccessRequestsState.value.map { it.toDto() },
                chatAccessGrants = chatAccessGrantsState.value.map { it.toDto() },
            ),
        )
    }

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
        ensureLoaded()
        val profile = profileState.value
            ?: return AppResult.Failure(UiError.NotFound(technical = "profile is null"))
        return AppResult.Success(profile)
    }

    override suspend fun createProfile(
        alias: String,
        ageBand: AgeBand,
        pin: String,
    ): AppResult<YouthProfile> {
        ensureLoaded()
        val trimmed = alias.trim()
        if (trimmed.isEmpty()) {
            return AppResult.Failure(UiError.Validation(technical = "alias blank"))
        }
        if (!PinPolicy.isWellFormed(pin)) {
            // Nunca se devuelve el PIN ni su longitud concreta en el error.
            return AppResult.Failure(UiError.Validation(technical = "pin malformed"))
        }
        // TASK-025: id OPACO y único por perfil. Antes era la constante de demo,
        // que con varios perfiles los haría indistinguibles entre sí.
        val profile = YouthProfile(
            id = ProfileId(UUID.randomUUID().toString()),
            alias = YouthAlias(trimmed),
            ageBand = ageBand,
            createdAtEpochMillis = clock.nowEpochMillis(),
        )
        // El perfil de demostración es un modo de entrada, no un perfil real:
        // al crear el primer perfil de verdad, se retira de la lista.
        profilesState.value = profilesState.value
            .filterNot { it.id.value == DemoFixtures.DEMO_YOUTH_ID } + profile
        activeProfileIdState.value = profile.id.value
        syncActiveProfile()
        // Un perfil nuevo empieza con SU contenido vacío; el anterior ya está persistido.
        clearContentState()
        lastChatAccessByProfile.remove(profile.id.value)
        persistPinSecret(profile.id.value, pinHasher.createSecret(pin))
        // Crear perfil = empezar de cero: el cifrado debe quedar operativo.
        prepareCipher()
        persistSession()
        persistContent()
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
        ensureLoaded()
        val profileId = activeProfileIdState.value ?: return false
        return readPinSecret(profileId) != null
    }

    override suspend fun unlockSession(pin: String): AppResult<Unit> {
        ensureLoaded()
        if (!PinPolicy.isWellFormed(pin)) {
            return AppResult.Failure(UiError.Validation(technical = "pin malformed"))
        }
        val profileId = activeProfileIdState.value
            ?: return AppResult.Failure(UiError.NotFound(technical = "no profile"))
        val secret = readPinSecret(profileId)
            ?: return AppResult.Failure(UiError.NotFound(technical = "pin not configured"))

        if (!pinHasher.verify(pin, secret)) {
            // Mensaje idéntico para cualquier fallo: no revela si el alias existe,
            // cuántos dígitos fallaron ni cuántos intentos quedan.
            return AppResult.Failure(UiError.Authentication(technical = "pin mismatch"))
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
    // Multi-perfil (TASK-025)
    // -----------------------------------------------------------------------

    override fun observeProfiles(): Flow<List<YouthProfile>> = profilesState.asStateFlow()

    override suspend fun switchProfile(profileId: ProfileId): AppResult<Unit> {
        ensureLoaded()
        val id = profileId.value
        if (profilesState.value.none { it.id.value == id }) {
            return AppResult.Failure(UiError.NotFound(technical = "profile not found"))
        }
        if (activeProfileIdState.value == id) return AppResult.Success(Unit)

        // Guarda el contenido del perfil que se abandona ANTES de cambiar de activo.
        persistContent()
        persistSession()
        activeProfileIdState.value = id
        syncActiveProfile()
        // Cambiar de perfil es cambiar de sesión: el nuevo empieza bloqueado.
        sessionUnlocked.value = false
        loadContentFor(id)
        return AppResult.Success(Unit)
    }

    override suspend fun deleteProfile(profileId: ProfileId): AppResult<Unit> {
        ensureLoaded()
        val id = profileId.value
        if (profilesState.value.none { it.id.value == id }) {
            return AppResult.Failure(UiError.NotFound(technical = "profile not found"))
        }
        profilesState.value = profilesState.value.filterNot { it.id.value == id }
        lastChatAccessByProfile.remove(id)
        // El PIN y el contenido de ESTE perfil; los demás quedan intactos.
        deletePinSecret(id)
        store.deleteContent(id)

        if (activeProfileIdState.value == id) {
            activeProfileIdState.value = profilesState.value.firstOrNull()?.id?.value
            syncActiveProfile()
            clearContentState()
            sessionUnlocked.value = false
            activeProfileIdState.value?.let { loadContentFor(it) }
        }
        persistSession()
        return AppResult.Success(Unit)
    }

    override suspend fun unlockSessionFor(alias: String, pin: String): AppResult<Unit> {
        ensureLoaded()
        if (!PinPolicy.isWellFormed(pin)) {
            return AppResult.Failure(UiError.Validation(technical = "pin malformed"))
        }
        val trimmed = alias.trim()
        // Se prueban los perfiles con ese alias; gana el que verifique el PIN.
        // NO se lista nada: el joven teclea alias + PIN y el sistema resuelve.
        val match = if (trimmed.isEmpty()) {
            null
        } else {
            profilesState.value
                .filter { it.alias.value == trimmed }
                .firstOrNull { profile ->
                    readPinSecret(profile.id.value)?.let { pinHasher.verify(pin, it) } == true
                }
        }
        // Un único mensaje para todos los fallos: no filtra si el alias existe.
        if (match == null) {
            return AppResult.Failure(UiError.Authentication(technical = "pin mismatch"))
        }
        if (activeProfileIdState.value != match.id.value) {
            when (val switched = switchProfile(match.id)) {
                is AppResult.Success -> Unit
                is AppResult.Failure -> return AppResult.Failure(switched.error)
            }
        }
        sessionUnlocked.value = true
        return AppResult.Success(Unit)
    }

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
     *
     * El efecto de la purga se **persiste**: lo purgado no reaparece al reiniciar.
     */
    override suspend fun purgeExpired(nowEpochMillis: Long): AppResult<RetentionPurgeResult> {
        ensureLoaded()
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

        persistContent()
        persistSession()

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
        ensureLoaded()
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
        ensureLoaded()
        clearContentState()
        // El alias lo escribió el joven: también es contenido local. Borrar todo
        // y conservarlo sería un borrado a medias.
        profilesState.value = emptyList()
        activeProfileIdState.value = null
        profileState.value = null
        lastChatAccessByProfile.clear()
        // `clear()` destruye los derivados de PIN de TODOS los perfiles (TASK-025).
        secureStore.clear()
        // Guardrail #4: sin clave, lo que quedara cifrado es irrecuperable.
        cipher.destroyKeyMaterial()
        sessionUnlocked.value = false
        // Los DOS almacenes quedan vacíos; no se re-siembra el perfil de demo.
        store.clearAll()
        return AppResult.Success(Unit)
    }

    // -----------------------------------------------------------------------
    // PIN: persistencia del derivado (nunca del PIN), ESPACIADO POR PERFIL
    // (TASK-025). El derivado de un perfil no sirve para desbloquear otro.
    // -----------------------------------------------------------------------

    private fun pinSaltKey(profileId: String) = "${SecureLocalStore.KEY_PIN_SALT}.$profileId"

    private fun pinHashKey(profileId: String) = "${SecureLocalStore.KEY_PIN_HASH}.$profileId"

    private fun pinIterationsKey(profileId: String) =
        "${SecureLocalStore.KEY_PIN_ITERATIONS}.$profileId"

    private suspend fun persistPinSecret(profileId: String, secret: PinSecret) {
        secureStore.write(pinSaltKey(profileId), secret.salt)
        secureStore.write(pinHashKey(profileId), secret.hash)
        secureStore.write(pinIterationsKey(profileId), secret.iterations.toString())
    }

    private suspend fun readPinSecret(profileId: String): PinSecret? {
        val salt = secureStore.read(pinSaltKey(profileId)) ?: return null
        val hash = secureStore.read(pinHashKey(profileId)) ?: return null
        val iterations = secureStore.read(pinIterationsKey(profileId))
            ?.toIntOrNull()
            ?: return null
        return PinSecret(salt = salt, hash = hash, iterations = iterations)
    }

    private suspend fun deletePinSecret(profileId: String) {
        secureStore.remove(pinSaltKey(profileId))
        secureStore.remove(pinHashKey(profileId))
        secureStore.remove(pinIterationsKey(profileId))
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
        ensureLoaded()
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
        persistContent()
        persistSession()
        return AppResult.Success(conversation)
    }

    override suspend fun appendYouthMessage(
        conversationId: ConversationId,
        content: String,
    ): AppResult<ConversationMessage> {
        ensureLoaded()
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
        persistContent()
        persistSession()
        // Se devuelve el texto legible; lo guardado es el sobre cifrado.
        return AppResult.Success(message.copy(content = content))
    }

    override suspend fun appendPuenteMessage(
        conversationId: ConversationId,
        content: String,
        promptId: String,
    ): AppResult<ConversationMessage> {
        ensureLoaded()
        // Guardrail #3: sin IA generativa en el APK, todo turno de la app nace de una
        // plantilla. Un turno sin `promptId` es **indistinguible de contenido generado**,
        // que es exactamente lo que el guardrail prohíbe (criterio #2 de TASK-004).
        if (promptId.isBlank()) {
            return AppResult.Failure(UiError.Validation(technical = "blank promptId"))
        }
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
        persistContent()
        persistSession()
        return AppResult.Success(message.copy(content = content))
    }

    override suspend fun closeConversation(conversationId: ConversationId): AppResult<Unit> {
        ensureLoaded()
        val conversation = conversationState.value
        if (conversation == null || conversation.id != conversationId) {
            return AppResult.Failure(UiError.NotFound(technical = "conversation mismatch"))
        }
        conversationState.value = null
        persistContent()
        return AppResult.Success(Unit)
    }

    // -----------------------------------------------------------------------
    // ContextCheckRepository
    // -----------------------------------------------------------------------

    /**
     * Claves del chequeo, del **catálogo único** (`CheckCatalog`, `PR-003` §4.3).
     *
     * Antes esta lista estaba escrita aquí a mano, con 4 claves **distintas** de las
     * del prototipo: dos vocabularios para lo mismo. Si derivaban, una regla dejaba
     * de dispararse **en silencio** — y la que más importa es `safety`.
     */
    override suspend fun availableQuestionKeys(): AppResult<List<String>> =
        AppResult.Success(CheckCatalog.questionKeys)

    override suspend fun recordResponse(
        questionKey: String,
        optionKey: String,
        conversationId: ConversationId?,
    ): AppResult<ContextResponse> {
        ensureLoaded()
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
        persistContent()
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
        ensureLoaded()
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
        persistContent()
        return AppResult.Success(completion.copy(reflection = plainReflection))
    }

    override fun observeCompletions(): Flow<List<ToolCompletion>> =
        completionsState.map { list -> list.map { it.withPlainReflection() } }

    // -----------------------------------------------------------------------
    // ReportRepository
    // -----------------------------------------------------------------------

    override suspend fun getPersonalReport(): AppResult<PersonalReport> {
        ensureLoaded()
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
        ensureLoaded()
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
        persistContent()
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
        ensureLoaded()
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
        persistContent()
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
        ensureLoaded()
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
        persistContent()
        return AppResult.Success(request)
    }

    override suspend fun authorizeRequest(requestId: SupportRequestId): AppResult<SupportRequest> {
        ensureLoaded()
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
        persistContent()
        return AppResult.Success(updated)
    }

    override suspend fun revokeRequest(requestId: SupportRequestId): AppResult<SupportRequest> {
        ensureLoaded()
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
        persistContent()
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
        ensureLoaded()
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
        persistContent()
        return AppResult.Success(grant)
    }

    override suspend fun declineRequest(requestId: ChatAccessRequestId): AppResult<ChatAccessRequest> {
        ensureLoaded()
        val current = chatAccessRequestsState.value.firstOrNull { it.id == requestId }
            ?: return AppResult.Failure(UiError.NotFound(technical = "chat access request not found"))
        if (current.status != ChatAccessRequestStatus.PENDING) {
            return AppResult.Failure(UiError.Conflict(technical = "request not pending"))
        }
        val updated = current.copy(status = ChatAccessRequestStatus.DECLINED)
        chatAccessRequestsState.value = chatAccessRequestsState.value.map {
            if (it.id == requestId) updated else it
        }
        persistContent()
        return AppResult.Success(updated)
    }

    override suspend fun revokeGrant(grantId: ChatAccessGrantId): AppResult<ChatAccessGrant> {
        ensureLoaded()
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
        persistContent()
        return AppResult.Success(updated)
    }

    /**
     * Crea una solicitud de acceso sintética para demostración (no hay backend).
     * Solo existe para que TASK-008 criterio #5 pueda simular aceptar/rechazar/revocar.
     *
     * Nota: no persiste aquí (no es `suspend`); el estado se guardará en la
     * siguiente escritura de contenido.
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
