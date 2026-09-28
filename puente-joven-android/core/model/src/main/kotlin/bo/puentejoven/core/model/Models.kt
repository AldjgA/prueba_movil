package bo.puentejoven.core.model

/**
 * Identidad local del joven dentro del dispositivo.
 *
 * Guardrail #7: el chat y los datos personales son privados y se guardan localmente.
 * `alias` es el nombre visible elegido por el joven; NO es su nombre legal. Es de
 * tipo [YouthAlias], nunca un [ProfileId]: el alias no identifica de forma estable.
 * No contiene PII obligatoria: el MVP funciona sin nombre real ni documento.
 */
data class YouthProfile(
    val id: ProfileId,
    val alias: YouthAlias,
    val ageBand: AgeBand,
    val createdAtEpochMillis: Long,
    /** El joven decide qué compartir; por defecto solo lo mínimo. */
    val shareDefaults: ShareDefaults = ShareDefaults(),
)

/**
 * Banda de edad, no edad exacta: reduce identificabilidad y es suficiente para el
 * encuadre del piloto (13-18). La separación/divorcio parental es contexto de
 * entrada, nunca causa automática de malestar (guardrail #2).
 */
enum class AgeBand(val label: String, val minAge: Int, val maxAge: Int) {
    EARLY_TEEN("13-14", 13, 14),
    MID_TEEN("15-16", 15, 16),
    LATE_TEEN("17-18", 17, 18);

    companion object {
        fun fromAge(age: Int): AgeBand =
            entries.firstOrNull { age in it.minAge..it.maxAge } ?: LATE_TEEN
    }
}

/** Preferencias iniciales de compartición. Todo apagado salvo lo mínimo del MVP. */
data class ShareDefaults(
    val shareSignalsWithProfessional: Boolean = false,
    val shareToolsWithProfessional: Boolean = false,
)

/**
 * Contexto de entrada declarado por el joven (no evaluación clínica).
 * `parentalChangeContext` describe la situación, no un diagnóstico.
 */
data class ParentalChangeContext(
    val description: String,
    val startedApproxLabel: String? = null,
)

// ---------------------------------------------------------------------------
// Conversación estructurada
// ---------------------------------------------------------------------------

/**
 * Mensaje dentro de la conversación estructurada.
 * El MVP NO es chat generativo libre (guardrail #3): cada turno nace de una
 * plantilla/guion definido por reglas, de ahí `promptId`.
 */
data class ConversationMessage(
    val id: MessageId,
    val role: ConversationRole,
    val content: String,
    val createdAtEpochMillis: Long,
    /** Identificador de la regla/plantilla que originó el turno de la app. */
    val promptId: String? = null,
)

enum class ConversationRole {
    YOUTH,
    PUENTE,
}

/** Conversación estructurada completa. Privada y localmente cifrada (guardrail #7). */
data class Conversation(
    val id: ConversationId,
    val youthId: ProfileId,
    val startedAtEpochMillis: Long,
    val messages: List<ConversationMessage> = emptyList(),
    /**
     * Última vez que el joven abrió o escribió en esta conversación. Es la base de
     * la política de retención (TASK-003): los días se cuentan desde el ÚLTIMO
     * acceso, no desde el inicio de la conversación.
     */
    val lastAccessEpochMillis: Long = startedAtEpochMillis,
)

// ---------------------------------------------------------------------------
// Chequeo contextual
// ---------------------------------------------------------------------------

/**
 * Respuesta del joven a un chequeo contextual guiado.
 * `optionKey` apunta a una opción predefinida; el MVP no acepta texto libre
 * interpretado por IA.
 */
data class ContextResponse(
    val id: ContextResponseId,
    val youthId: ProfileId,
    val questionKey: QuestionKey,
    val optionKey: OptionKey,
    val answeredAtEpochMillis: Long,
    val conversationId: ConversationId? = null,
)

// ---------------------------------------------------------------------------
// Señales y evidencia
// ---------------------------------------------------------------------------

/**
 * Evidencia que respalda una señal detectada: una ocurrencia concreta,
 * nunca una interpretación automática.
 */
data class SignalEvidence(
    val id: SignalEvidenceId,
    val signalKey: SignalKey,
    val label: String,
    val description: String,
    val dateLabel: String,
    /** 1..4 — proximidad a señal prioritaria, NO gravedad clínica. */
    val intensity: Int,
    val tags: List<String> = emptyList(),
    val sourceConversationId: ConversationId? = null,
)

/** Señal agregada con su tendencia longitudinal. */
data class Signal(
    val key: SignalKey,
    val label: String,
    /** Porcentaje 0..100 de presencia relativa en el periodo. */
    val trendPercent: Int,
    val trendDirection: TrendDirection,
    val evidence: List<SignalEvidence> = emptyList(),
)

enum class TrendDirection(val label: String, val arrow: String) {
    RISING("En aumento", "↑"),
    STABLE("Estable", "→"),
    FALLING("En descenso", "↓"),
}

// ---------------------------------------------------------------------------
// Prioridad preliminar de revisión (NUNCA diagnóstico)
// ---------------------------------------------------------------------------

/**
 * Nivel de prioridad preliminar de revisión humana.
 *
 * Guardrail #4: verde/amarillo/rojo significa **prioridad preliminar de revisión**,
 * nunca diagnóstico ni garantía de seguridad. Toda superficie que use este valor
 * debe acompañarlo con texto e icono, no solo color.
 */
enum class AttentionLevel {
    /** Verde — se puede trabajar paso a paso. */
    GREEN,

    /** Amarillo — conviene involucrar a una persona de confianza. */
    YELLOW,

    /** Rojo — requiere apoyo humano prioritario. */
    RED,
    ;

    companion object {
        /**
         * Texto obligatorio asociado al nivel. Se muestra SIEMPRE junto al color
         * para no depender solo de la señal cromática.
         */
        fun labelOf(level: AttentionLevel): String = when (level) {
            GREEN -> "Prioridad preliminar: verde"
            YELLOW -> "Prioridad preliminar: amarilla"
            RED -> "Prioridad preliminar: roja"
        }
    }
}

/**
 * Evaluación de prioridad PRELIMINAR.
 *
 * `isPreliminary` es siempre `true` en el MVP: no existe validación clínica.
 * `requiresHumanConfirmation` recuerda que ninguna prioridad sustituye a una persona.
 *
 * `rulesetVersion` identifica la versión de reglas que produjo este resultado
 * (TASK-008 criterio #3, DECISIONES §3.3). Sin ella, una prioridad no es trazable
 * a la regla que la emitió. En el MVP apunta a un fixture local versionado; cuando
 * exista backend, apuntará al `RuleSet` activo sin cambiar este contrato.
 */
data class AttentionAssessment(
    val id: AssessmentId,
    val youthId: ProfileId,
    val rulesetVersion: String,
    val level: AttentionLevel,
    val title: String,
    val explanation: String,
    val whatChanged: String,
    val nextStep: String,
    val evidence: List<SignalEvidence> = emptyList(),
    val assessedAtEpochMillis: Long,
    val isPreliminary: Boolean = true,
    val requiresHumanConfirmation: Boolean = true,
)

// ---------------------------------------------------------------------------
// Herramientas breves
// ---------------------------------------------------------------------------

/** Herramienta breve disponible (respirar, escribir, escuchar...). */
data class BriefTool(
    val key: ToolKey,
    val label: String,
    val durationLabel: String,
    val summary: String,
    val accentKey: AccentKey,
)

/** Registro de finalización de una herramienta breve, elegido por el joven. */
data class ToolCompletion(
    val id: ToolCompletionId,
    val youthId: ProfileId,
    val toolKey: ToolKey,
    val completedAtEpochMillis: Long,
    val reflection: String? = null,
)

// ---------------------------------------------------------------------------
// Reporte personal y resumen compartible
// ---------------------------------------------------------------------------

/**
 * Reporte personal: lo que el joven ve sobre sí mismo.
 * Es de su propiedad y controla qué se comparte.
 */
data class PersonalReport(
    val id: ReportId,
    val youthId: ProfileId,
    val generatedAtEpochMillis: Long,
    val signals: List<Signal>,
    val assessments: List<AttentionAssessment>,
    val toolCompletions: List<ToolCompletion>,
    val journeyHighlights: List<JourneyEntry>,
)

/** Entrada del recorrido (journey) del joven. */
data class JourneyEntry(
    val id: JourneyEntryId,
    val occurredAtEpochMillis: Long,
    val title: String,
    val detail: String,
    val kind: JourneyEntryKind,
)

enum class JourneyEntryKind {
    CONVERSATION,
    SIGNAL,
    TOOL,
    ASSESSMENT,
    SUPPORT,
}

/**
 * Resumen compartible: subconjunto explícito y consentido del reporte personal.
 * Guardrail #7: un profesional NO recibe el chat completo; solo lo autorizado aquí.
 *
 * `scope` es el ÚNICO lugar de verdad de lo autorizado. Es un conjunto cerrado de
 * [ShareScopeEntry]: un mapper o un DTO de borde no puede ampliarlo añadiendo un
 * campo nuevo sin una decisión de producto (ver `ShareScope.kt`).
 */
data class ShareableSummary(
    val id: SummaryId,
    val youthId: ProfileId,
    val createdAtEpochMillis: Long,
    val scope: Set<ShareScopeEntry>,
    val note: SummaryNote? = null,
)

/** Mapa de situación: constelación de nodos del grafo joven. */
data class SituationMap(
    val entries: List<SituationNode>,
    val links: List<SituationLink>,
)

data class SituationNode(
    val key: String,
    val label: String,
    val detail: String,
    val weight: Int,
)

data class SituationLink(
    val fromKey: String,
    val toKey: String,
    val relationLabel: String,
)

// ---------------------------------------------------------------------------
// Consentimiento y solicitud de apoyo
// ---------------------------------------------------------------------------

/**
 * Registro de consentimiento explícito del joven para compartir algo concreto.
 *
 * El consentimiento es específico de una VERSIÓN de resumen (`summaryId`). Su
 * `scope` usa el mismo tipo cerrado que [ShareableSummary], de modo que no puede
 * autorizarse más de lo resumido: invariante codificable `consent.scope ⊆ summary.scope`.
 */
data class ConsentRecord(
    val id: ConsentId,
    val youthId: ProfileId,
    val summaryId: SummaryId,
    val scope: Set<ShareScopeEntry>,
    val granted: Boolean,
    val recordedAtEpochMillis: Long,
    /** Revocación del consentimiento (DECISIONES §4.3). `null` si sigue vigente. */
    val revokedAtEpochMillis: Long? = null,
)

/**
 * Solicitud de apoyo: el joven pide acompañamiento humano.
 * La app solo muestra el estado seguro; el panel profesional es un sistema
 * separado y no se referencia desde aquí (guardrail #6).
 *
 * Revocación (DECISIONES §4.3): se modela con [revokedAtEpochMillis] y
 * [revocationReason], SIN añadir un estado nuevo al enum (la lista de estados es
 * contrato estable no renombrable). Ver `RevocationReason` para el copy de UI.
 */
data class SupportRequest(
    val id: SupportRequestId,
    val youthId: ProfileId,
    val state: SupportRequestState,
    val consentRecordId: ConsentId,
    val summaryId: SummaryId,
    val createdAtEpochMillis: Long,
    val updatedAtEpochMillis: Long,
    /** Momento en que se revocó el acceso futuro. `null` si sigue vigente. */
    val revokedAtEpochMillis: Long? = null,
    /**
     * Motivo de la revocación, para que la UI muestre el copy correcto.
     * Es distinto de [state]: una solicitud puede estar `CLOSED` por cierre
     * profesional o por revocación del joven, y el texto debe diferir.
     */
    val revocationReason: RevocationReason? = null,
    /** Mensajes de estado seguros para el joven, sin datos clínicos. */
    val stateNote: String? = null,
)

/**
 * Motivo de una revocación. No es un estado del ciclo de vida: describe POR QUÉ
 * se revocó, para que la UI no confunda "cerrada por el equipo" con "tú retiraste
 * tu consentimiento" ni con "venció la ventana".
 *
 * Nota de producto (DECISIONES §4.3): la UI debe distinguir con honestidad
 * "revocar futuros accesos" de "eliminar información que ya debió conservarse
 * por una obligación legal".
 */
enum class RevocationReason(val labelResKey: String) {
    /** El joven retiró su consentimiento. */
    CONSENT_WITHDRAWN("revocation_consent_withdrawn"),

    /** El equipo de Puente cerró/retiró la solicitud. */
    CLOSED_BY_TEAM("revocation_closed_by_team"),

    /** Venció la ventana de la solicitud sin toma. */
    WINDOW_EXPIRED("revocation_window_expired"),
}

/**
 * Estados de solicitud visibles al joven (contrato estable, no renombrar):
 * DRAFT -> AUTHORIZED -> QUEUED -> ACKNOWLEDGED -> IN_PROGRESS -> UPDATE_AVAILABLE -> CLOSED
 *
 * `CLOSED` es un estado TERMINAL que cubre cualquier finalización. El MOTIVO se
 * expresa en `SupportRequest.revocationReason`, no aquí.
 */
enum class SupportRequestState(val label: String, val order: Int) {
    DRAFT("Borrador", 0),
    AUTHORIZED("Autorizada por ti", 1),
    QUEUED("En cola de revisión", 2),
    ACKNOWLEDGED("Recibida por el equipo", 3),
    IN_PROGRESS("En acompañamiento", 4),
    UPDATE_AVAILABLE("Hay una novedad", 5),
    CLOSED("Cerrada", 6),
}
