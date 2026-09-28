package bo.puentejoven.core.model

/**
 * Identificadores de dominio como value classes.
 *
 * Invariante D-2: el ALIAS nunca es un ID. Son tipos distintos, así el compilador
 * impide pasar un alias donde se espera un identificador. Todos los IDs son
 * OPACOS: no derivan del alias, ni del nombre, ni de datos personales.
 *
 * En demo se generan localmente; cuando exista backend, el servidor emite el id
 * (DECISIONES §5.1) sin cambiar estas firmas.
 */
@JvmInline
value class ProfileId(val value: String)

@JvmInline
value class ConversationId(val value: String)

@JvmInline
value class MessageId(val value: String)

@JvmInline
value class ContextResponseId(val value: String)

@JvmInline
value class SignalEvidenceId(val value: String)

@JvmInline
value class AssessmentId(val value: String)

@JvmInline
value class ToolCompletionId(val value: String)

@JvmInline
value class ReportId(val value: String)

@JvmInline
value class JourneyEntryId(val value: String)

@JvmInline
value class SummaryId(val value: String)

@JvmInline
value class ConsentId(val value: String)

@JvmInline
value class SupportRequestId(val value: String)

/**
 * Alias visible elegido por el joven. NO es un ID: no puede usarse para
 * identificar un perfil de forma estable ni para derivar claves.
 */
@JvmInline
value class YouthAlias(val value: String)

/** Claves de catálogo (señal, herramienta, pregunta, opción). Opacas por tipo. */
@JvmInline value class SignalKey(val value: String)
@JvmInline value class ToolKey(val value: String)
@JvmInline value class QuestionKey(val value: String)
@JvmInline value class OptionKey(val value: String)
@JvmInline value class AccentKey(val value: String)
