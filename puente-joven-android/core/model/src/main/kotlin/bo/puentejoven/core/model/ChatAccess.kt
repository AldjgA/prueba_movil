package bo.puentejoven.core.model

/**
 * Acceso profesional temporal a fragmentos del chat.
 *
 * DECISIONES §6.3: el profesional NO recibe el chat completo al tomar un caso.
 * Si necesita contexto, se SOLICITA a la persona joven, que ve el alcance exacto
 * y acepta o rechaza. El permiso es temporal y expira.
 *
 * Guardrail #7: el chat completo nunca se comparte por defecto.
 */

/**
 * Alcance del acceso solicitado. Es un tipo cerrado, NO un String libre, para que:
 * - la UI pueda describir con precisión qué se pide (DECISIONES §6.3(3));
 * - el mapper de borde no pueda ampliar el alcance sin un tipo nuevo;
 * - el servidor tenga una petición estructurada que validar.
 */
sealed interface ChatAccessScope {

    /**
     * Un intervalo continuo de mensajes, acotado por tiempo.
     * `fromEpochMillis`/`toEpochMillis` delimitan el rango.
     */
    data class TimeRange(
        val fromEpochMillis: Long,
        val toEpochMillis: Long,
    ) : ChatAccessScope {
        init {
            require(fromEpochMillis <= toEpochMillis) {
                "TimeRange: fromEpochMillis debe ser <= toEpochMillis"
            }
        }
    }

    /**
     * Un conjunto explícito de mensajes concretos, por id opaco.
     * Nunca vacío: un conjunto vacío no es una solicitud válida.
     */
    data class Messages(
        val messageIds: List<MessageId>,
    ) : ChatAccessScope {
        init {
            require(messageIds.isNotEmpty()) { "Messages: la lista no puede estar vacía" }
        }
    }
}

/** Para qué se solicita el acceso. Obligatorio y visible al joven. */
enum class ChatAccessPurpose(val labelResKey: String) {
    CONTEXT_FOR_REVIEW("chat_access_purpose_review"),
    SAFEGUARD_PROTOCOL("chat_access_purpose_safeguard"),
}

/**
 * Solicitud de acceso temporal que la persona joven ve y decide.
 *
 * IMPORTANTE (guardrail #6): `caseId` es un identificador OPACO de correlación.
 * NO habilita navegación hacia Puente Red: la app nunca lo usa para construir
 * rutas, deep links ni pantallas profesionales. Sirve solo para que el contrato
 * de borde pueda correlacionar la solicitud con el caso sin exponer nada de Red.
 *
 * El joven NO ve identidad del profesional individual: solo categoría/equipo,
 * según DECISIONES §2 (los roles se asignan por servidor; el joven no los ve).
 */
data class ChatAccessRequest(
    val id: ChatAccessRequestId,
    val youthId: ProfileId,
    val caseId: String,
    val scope: ChatAccessScope,
    val purpose: ChatAccessPurpose,
    val recipientCategory: String,
    val requestedAtEpochMillis: Long,
    /** Duración máxima propuesta. Por defecto 72 h (DECISIONES §6.3(6)). */
    val maxDurationMillis: Long,
    val status: ChatAccessRequestStatus,
    /** Vincula con el consentimiento registrado al aceptar (null hasta aceptar). */
    val consentRecordId: ConsentId? = null,
)

enum class ChatAccessRequestStatus {
    /** Esperando decisión del joven. */
    PENDING,

    /** El joven aceptó; hay una concesión activa. */
    GRANTED,

    /** El joven rechazó. No hay acceso. */
    DECLINED,

    /** Expiró sin decisión o venció la concesión. */
    EXPIRED,

    /** Revocado por el joven después de conceder. */
    REVOKED,
}

/**
 * Concesión temporal efectiva. En el MVP Android Joven es **solo contrato**:
 * el acceso real lo aplica el backend (DECISIONES §6.3(4)-(7)). La app Joven
 * muestra estado y permite revocar; nunca habilita el acceso al chat en Android.
 */
data class ChatAccessGrant(
    val id: ChatAccessGrantId,
    val requestId: ChatAccessRequestId,
    val caseId: String,
    val scope: ChatAccessScope,
    val grantedAtEpochMillis: Long,
    val expiresAtEpochMillis: Long,
    val revokedAtEpochMillis: Long? = null,
)

@JvmInline value class ChatAccessRequestId(val value: String)
@JvmInline value class ChatAccessGrantId(val value: String)
