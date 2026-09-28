package bo.puentejoven.core.data.repository

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.model.AssessmentId
import bo.puentejoven.core.model.AttentionAssessment
import bo.puentejoven.core.model.BriefTool
import bo.puentejoven.core.model.ConsentId
import bo.puentejoven.core.model.ConsentRecord
import bo.puentejoven.core.model.ContextResponse
import bo.puentejoven.core.model.Conversation
import bo.puentejoven.core.model.ConversationId
import bo.puentejoven.core.model.ConversationMessage
import bo.puentejoven.core.model.JourneyEntry
import bo.puentejoven.core.model.PersonalReport
import bo.puentejoven.core.model.ProfileId
import bo.puentejoven.core.model.RetentionPolicy
import bo.puentejoven.core.model.ShareScopeEntry
import bo.puentejoven.core.model.ShareableSummary
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SituationMap
import bo.puentejoven.core.model.SummaryId
import bo.puentejoven.core.model.SummaryNote
import bo.puentejoven.core.model.SupportRequest
import bo.puentejoven.core.model.SupportRequestId
import bo.puentejoven.core.model.ToolCompletion
import bo.puentejoven.core.model.ToolKey
import bo.puentejoven.core.model.YouthProfile
import kotlinx.coroutines.flow.Flow

/**
 * Contrato de datos del joven (perfil local y sesión).
 *
 * Toda operación devuelve [AppResult] o un [Flow]; la UI nunca accede a datos
 * directamente. Sustituir la implementación local por una remota no cambia esta firma.
 */
interface YouthRepository {

    /** Perfil local del joven, o `null` si todavía no se ha creado la sesión. */
    fun observeProfile(): Flow<YouthProfile?>

    /** Recupera el perfil actual. */
    suspend fun getProfile(): AppResult<YouthProfile>

    /**
     * Crea el perfil local (alias + banda de edad) y guarda el derivado del PIN.
     *
     * El PIN NUNCA se almacena: solo su derivado con sal (TASK-003).
     */
    suspend fun createProfile(
        alias: String,
        ageBand: bo.puentejoven.core.model.AgeBand,
        pin: String,
    ): AppResult<YouthProfile>

    /**
     * Marca la sesión local como activa tras validar el PIN contra su derivado.
     *
     * Devuelve [UiError.Authentication] si el PIN no coincide: un mensaje igual
     * para todos los casos, sin filtrar si el alias existe o cuántos intentos
     * quedan (TASK-003: "PIN inválido presenta error accesible sin filtrar
     * detalles sensibles").
     *
     * No es autenticación remota: no hay backend.
     */
    suspend fun unlockSession(pin: String): AppResult<Unit>

    /**
     * `true` si ya existe un PIN configurado en el dispositivo. Permite a la capa
     * de UI distinguir "primer ingreso" de "volver a entrar" sin leer el PIN.
     */
    suspend fun isPinConfigured(): Boolean

    /** Cierra la sesión local y limpia el desbloqueo. El PIN sigue configurado. */
    suspend fun lockSession(): AppResult<Unit>

    /** Indica si hay una sesión local desbloqueada. */
    fun observeSessionUnlocked(): Flow<Boolean>

    /**
     * Política de retención vigente. Hoy fixture local ([RetentionPolicy.MVP_DEFAULT]);
     * mañana puede llegar desde `JurisdictionPolicy` de backend sin cambiar la firma.
     */
    suspend fun getRetentionPolicy(): AppResult<RetentionPolicy>
}

/** Contrato de la conversación estructurada (privada y localmente cifrada). */
interface ConversationRepository {

    /** Conversación activa del joven, si existe. */
    fun observeActiveConversation(): Flow<Conversation?>

    /** Inicia una nueva conversación estructurada. */
    suspend fun startConversation(): AppResult<Conversation>

    /** Añade un turno del joven. El contenido se cifra localmente. */
    suspend fun appendYouthMessage(conversationId: ConversationId, content: String): AppResult<ConversationMessage>

    /** Añade un turno guiado de Puente asociado a una regla/plantilla. */
    suspend fun appendPuenteMessage(
        conversationId: ConversationId,
        content: String,
        promptId: String,
    ): AppResult<ConversationMessage>

    /** Cierra la conversación sin borrar su historial local. */
    suspend fun closeConversation(conversationId: ConversationId): AppResult<Unit>
}

/** Contrato del chequeo contextual guiado. */
interface ContextCheckRepository {

    /** Preguntas del chequeo disponibles para la sesión actual. */
    suspend fun availableQuestionKeys(): AppResult<List<String>>

    /** Registra una respuesta del joven. */
    suspend fun recordResponse(
        questionKey: String,
        optionKey: String,
        conversationId: ConversationId?,
    ): AppResult<ContextResponse>

    /** Historial de respuestas registradas. */
    fun observeResponses(): Flow<List<ContextResponse>>
}

/** Contrato de señales, mapa de situación y prioridad preliminar de revisión. */
interface SignalsRepository {

    /** Señales detectadas con su evidencia. */
    fun observeSignals(): Flow<List<Signal>>

    /** Mapa de situación del joven. */
    fun observeSituationMap(): Flow<SituationMap>

    /**
     * Evaluación de prioridad **preliminar** de revisión.
     * Nunca un diagnóstico (guardrail #4).
     */
    suspend fun getAttentionAssessment(): AppResult<AttentionAssessment>
}

/** Contrato de herramientas breves. */
interface ToolsRepository {

    /** Catálogo de herramientas breves disponibles. */
    suspend fun availableTools(): AppResult<List<BriefTool>>

    /** Registra la finalización de una herramienta. */
    suspend fun recordCompletion(toolKey: ToolKey, reflection: String?): AppResult<ToolCompletion>

    /** Historial de herramientas completadas. */
    fun observeCompletions(): Flow<List<ToolCompletion>>
}

/** Contrato del reporte personal y del recorrido. */
interface ReportRepository {

    /** Reporte personal completo del joven. */
    suspend fun getPersonalReport(): AppResult<PersonalReport>

    /** Recorrido longitudinal. */
    fun observeJourney(): Flow<List<JourneyEntry>>
}

/** Contrato del resumen compartible y el consentimiento explícito. */
interface SharingRepository {

    /**
     * Construye un resumen compartible a partir de la selección del joven.
     * El [scope] es el conjunto CERRADO de lo autorizado; no se amplía después.
     */
    suspend fun buildShareableSummary(
        scope: Set<ShareScopeEntry>,
        note: SummaryNote?,
    ): AppResult<ShareableSummary>

    /**
     * Resúmenes construidos, con su nota ya descifrada.
     *
     * La nota es texto libre del joven: se guarda cifrada y solo se descifra al
     * salir por aquí (F1/F3 de la auditoría de seguridad).
     */
    fun observeSummaries(): Flow<List<ShareableSummary>>

    /**
     * Registra el consentimiento explícito. Sin consentimiento no hay solicitud.
     *
     * Debe verificar el invariante `scope ⊆ summary.scope`; si se intenta consentir
     * más de lo resumido, devuelve `UiError.Authorization` (no lo amplía en silencio).
     */
    suspend fun recordConsent(
        summaryId: SummaryId,
        scope: Set<ShareScopeEntry>,
        granted: Boolean,
    ): AppResult<ConsentRecord>

    /** Consentimientos registrados. */
    fun observeConsents(): Flow<List<ConsentRecord>>
}

/** Contrato de solicitudes de apoyo (estado seguro para el joven). */
interface SupportRepository {

    /** Crea una solicitud en estado DRAFT a partir de consentimiento + resumen. */
    suspend fun draftRequest(
        consentRecordId: ConsentId,
        summaryId: SummaryId,
    ): AppResult<SupportRequest>

    /** Autoriza una solicitud en borrador (DRAFT -> AUTHORIZED). */
    suspend fun authorizeRequest(requestId: SupportRequestId): AppResult<SupportRequest>

    /**
     * Revoca futuros accesos (DECISIONES §4.3). Distinto de borrar: no promete
     * eliminación retroactiva de lo que una obligación legal deba conservar.
     * Transiciona a CLOSED con un `revocationReason` explícito.
     */
    suspend fun revokeRequest(requestId: SupportRequestId): AppResult<SupportRequest>

    /**
     * Observa el estado visible para el joven.
     * La app NO expone el panel profesional (guardrail #6).
     */
    fun observeRequest(requestId: SupportRequestId): Flow<SupportRequest?>

    /** Solicitudes del joven. */
    fun observeRequests(): Flow<List<SupportRequest>>
}

/**
 * Contrato del acceso temporal a fragmentos del chat (DECISIONES §6.3).
 *
 * En el MVP el backend no existe: la implementación local permite simular
 * solicitud -> aceptar/rechazar -> revocar sin red (TASK-008 criterio #5).
 * IMPORTANTE: esta interfaz NO habilita acceso al chat en Android; solo modela
 * el consentimiento y su estado. El acceso efectivo lo aplica el servidor.
 */
interface ChatAccessRepository {

    /**
     * Solicitudes de acceso pendientes o históricas para el joven.
     *
     * NOTA de nombre: es `observeChatAccessRequests` y no `observeRequests` para no
     * colisionar con [SupportRepository.observeRequests] cuando una misma clase
     * implementa ambos contratos (JVM no distingue por tipo de retorno).
     */
    fun observeChatAccessRequests(): Flow<List<bo.puentejoven.core.model.ChatAccessRequest>>

    /** Concesiones activas o históricas. */
    fun observeGrants(): Flow<List<bo.puentejoven.core.model.ChatAccessGrant>>

    /** El joven acepta el alcance solicitado; crea ConsentRecord + grant. */
    suspend fun acceptRequest(requestId: bo.puentejoven.core.model.ChatAccessRequestId): AppResult<bo.puentejoven.core.model.ChatAccessGrant>

    /** El joven rechaza; no se crea ningún acceso. */
    suspend fun declineRequest(requestId: bo.puentejoven.core.model.ChatAccessRequestId): AppResult<bo.puentejoven.core.model.ChatAccessRequest>

    /** El joven revoca una concesión existente. */
    suspend fun revokeGrant(grantId: bo.puentejoven.core.model.ChatAccessGrantId): AppResult<bo.puentejoven.core.model.ChatAccessGrant>
}

/**
 * Retención y borrado del contenido local (TASK-003).
 *
 * La purga SIEMPRE recibe el instante "ahora" como parámetro: así es demostrable
 * con un reloj inyectable (criterio de aceptación #4) y no depende de que el
 * reloj del sistema caiga justo en la frontera del plazo.
 *
 * Ningún método devuelve contenido: solo conteos y metadatos. Un resultado de
 * purga se puede registrar sin filtrar texto del chat.
 */
interface RetentionRepository {

    /**
     * Destruye el contenido local vencido según la política vigente.
     *
     * @param nowEpochMillis instante de referencia (inyectable en pruebas).
     */
    suspend fun purgeExpired(nowEpochMillis: Long): AppResult<bo.puentejoven.core.model.RetentionPurgeResult>

    /** Estado de retención: días restantes y si corresponde avisar renovación. */
    suspend fun retentionStatus(nowEpochMillis: Long): AppResult<bo.puentejoven.core.model.RetentionStatus>

    /**
     * Borrado manual: destruye TODO el contenido local del joven y el material de
     * claves asociado. Irreversible por diseño.
     */
    suspend fun deleteAllLocalContent(): AppResult<Unit>
}
