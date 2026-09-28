package bo.puentejoven.core.data.local

import bo.puentejoven.core.model.AccentKey
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.AssessmentId
import bo.puentejoven.core.model.AttentionAssessment
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.BriefTool
import bo.puentejoven.core.model.JourneyEntry
import bo.puentejoven.core.model.JourneyEntryId
import bo.puentejoven.core.model.JourneyEntryKind
import bo.puentejoven.core.model.ProfileId
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SignalEvidence
import bo.puentejoven.core.model.SignalEvidenceId
import bo.puentejoven.core.model.SignalKey
import bo.puentejoven.core.model.SituationLink
import bo.puentejoven.core.model.SituationMap
import bo.puentejoven.core.model.SituationNode
import bo.puentejoven.core.model.ToolKey
import bo.puentejoven.core.model.TrendDirection
import bo.puentejoven.core.model.YouthAlias
import bo.puentejoven.core.model.YouthProfile

/**
 * Fixtures de demostración, claramente sintéticas.
 *
 * Regla de privacidad (guardrail #8): estos datos son ficticios, viven solo en el
 * dispositivo y NUNCA se mezclan con datos reales ni se envían a analítica.
 * Ningún identificador corresponde a una persona.
 */
object DemoFixtures {

    const val DEMO_YOUTH_ID = "demo-youth-0001"

    /** Epoch fijo para que los fixtures sean deterministas en tests. */
    const val DEMO_EPOCH_MILLIS = 1_760_000_000_000L

    /**
     * Versión de reglas del escenario de demostración (TASK-008 criterio #3).
     * Es un fixture LOCAL: no procede de ningún backend ni representa una regla
     * clínica validada. Cuando exista backend, la versión la entregará el
     * `RuleSet` activo.
     */
    const val DEMO_RULESET_VERSION = "demo-ruleset-0.1"

    val youthProfile = YouthProfile(
        id = ProfileId(DEMO_YOUTH_ID),
        alias = YouthAlias("Alex"),
        ageBand = AgeBand.MID_TEEN,
        createdAtEpochMillis = DEMO_EPOCH_MILLIS,
    )

    val signals: List<Signal> = listOf(
        Signal(
            key = SignalKey("frequency"),
            label = "Frecuencia",
            trendPercent = 85,
            trendDirection = TrendDirection.RISING,
            evidence = listOf(
                SignalEvidence(
                    id = SignalEvidenceId("ev-freq-1"),
                    signalKey = SignalKey("frequency"),
                    label = "Comentario aislado",
                    description = "Se rieron de mí en el pasillo.",
                    dateLabel = "02 SEP",
                    intensity = 1,
                    tags = listOf("Bullying"),
                ),
                SignalEvidence(
                    id = SignalEvidenceId("ev-freq-2"),
                    signalKey = SignalKey("frequency"),
                    label = "Se repite",
                    description = "Ya son dos veces esta semana.",
                    dateLabel = "06 SEP",
                    intensity = 2,
                    tags = listOf("Bullying", "Frecuencia ↑"),
                ),
                SignalEvidence(
                    id = SignalEvidenceId("ev-freq-3"),
                    signalKey = SignalKey("frequency"),
                    label = "Empieza a evitar el recreo",
                    description = "Prefiero quedarme en el aula.",
                    dateLabel = "09 SEP",
                    intensity = 3,
                    tags = listOf("Aislamiento ↑", "Cambio conductual"),
                ),
                SignalEvidence(
                    id = SignalEvidenceId("ev-freq-4"),
                    signalKey = SignalKey("frequency"),
                    label = "Dificultad para asistir al colegio",
                    description = "No quiero ir mañana tampoco.",
                    dateLabel = "13 SEP",
                    intensity = 4,
                    tags = listOf("Impacto escolar ↑", "Señal prioritaria"),
                ),
            ),
        ),
        Signal(
            key = SignalKey("isolation"),
            label = "Aislamiento",
            trendPercent = 72,
            trendDirection = TrendDirection.RISING,
            evidence = listOf(
                SignalEvidence(
                    id = SignalEvidenceId("ev-iso-1"),
                    signalKey = SignalKey("isolation"),
                    label = "Evita espacios compartidos",
                    description = "Mejor solo en el aula.",
                    dateLabel = "09 SEP",
                    intensity = 2,
                    tags = listOf("Aislamiento"),
                ),
                SignalEvidence(
                    id = SignalEvidenceId("ev-iso-2"),
                    signalKey = SignalKey("isolation"),
                    label = "Se aparta del grupo",
                    description = "No quiso entrar al recreo.",
                    dateLabel = "13 SEP",
                    intensity = 3,
                    tags = listOf("Aislamiento ↑"),
                ),
            ),
        ),
        Signal(
            key = SignalKey("school_impact"),
            label = "Impacto escolar",
            trendPercent = 60,
            trendDirection = TrendDirection.STABLE,
            evidence = listOf(
                SignalEvidence(
                    id = SignalEvidenceId("ev-school-1"),
                    signalKey = SignalKey("school_impact"),
                    label = "Cuenta que cuesta ir",
                    description = "No quiero ir mañana tampoco.",
                    dateLabel = "13 SEP",
                    intensity = 3,
                    tags = listOf("Impacto escolar"),
                ),
            ),
        ),
    )

    /**
     * Prioridad **preliminar** de revisión. Amarillo en la demo.
     * El texto acompaña siempre al color (guardrail #4).
     */
    val attentionAssessment = AttentionAssessment(
        id = AssessmentId("demo-assessment-0001"),
        youthId = ProfileId(DEMO_YOUTH_ID),
        rulesetVersion = DEMO_RULESET_VERSION,
        level = AttentionLevel.YELLOW,
        title = "Sería bueno involucrar a alguien.",
        explanation = "Notamos que lo que estás viviendo ha cambiado en las últimas semanas. " +
            "La frecuencia aumentó y está afectando tu día a día. No tienes que manejarlo solo/a.",
        whatChanged = "La frecuencia aumentó y empezó a afectar tu asistencia al colegio.",
        nextStep = "Podemos ayudarte a preparar cómo pedir apoyo a alguien de confianza.",
        evidence = signals.flatMap { it.evidence }.take(4),
        assessedAtEpochMillis = DEMO_EPOCH_MILLIS,
        isPreliminary = true,
        requiresHumanConfirmation = true,
    )

    val briefTools: List<BriefTool> = listOf(
        BriefTool(
            key = ToolKey("breathe"),
            label = "Respirar",
            durationLabel = "2 min",
            summary = "Una pausa corta para bajar el ritmo del cuerpo.",
            accentKey = AccentKey("indigo"),
        ),
        BriefTool(
            key = ToolKey("write"),
            label = "Escribir",
            durationLabel = "5 min",
            summary = "Poner en palabras lo que está pasando, sin corregirlo.",
            accentKey = AccentKey("lavender"),
        ),
        BriefTool(
            key = ToolKey("listen"),
            label = "Escuchar",
            durationLabel = "3 min",
            summary = "Un momento de calma sonora para ordenar ideas.",
            accentKey = AccentKey("teal"),
        ),
    )

    val situationMap: SituationMap = SituationMap(
        entries = listOf(
            SituationNode(
                key = "school",
                label = "Colegio",
                detail = "El lugar donde más se repite.",
                weight = 4,
            ),
            SituationNode(
                key = "peer",
                label = "Compañeros",
                detail = "Comentarios y risas repetidas.",
                weight = 3,
            ),
            SituationNode(
                key = "home",
                label = "Casa",
                detail = "Donde cuesta más hablar de lo que pasa.",
                weight = 2,
            ),
            SituationNode(
                key = "rest",
                label = "Descanso",
                detail = "El sueño y la energía cambiaron.",
                weight = 2,
            ),
        ),
        links = listOf(
            SituationLink(fromKey = "school", toKey = "peer", relationLabel = "ocurre en"),
            SituationLink(fromKey = "school", toKey = "rest", relationLabel = "afecta"),
            SituationLink(fromKey = "home", toKey = "rest", relationLabel = "influye en"),
        ),
    )

    val journey: List<JourneyEntry> = listOf(
        JourneyEntry(
            id = JourneyEntryId("jr-1"),
            occurredAtEpochMillis = DEMO_EPOCH_MILLIS,
            title = "Contaste algo por primera vez",
            detail = "Empezaste describiendo lo del pasillo.",
            kind = JourneyEntryKind.CONVERSATION,
        ),
        JourneyEntry(
            id = JourneyEntryId("jr-2"),
            occurredAtEpochMillis = DEMO_EPOCH_MILLIS + 3 * DAY,
            title = "Se repitió",
            detail = "Registramos una segunda vez la misma situación.",
            kind = JourneyEntryKind.SIGNAL,
        ),
        JourneyEntry(
            id = JourneyEntryId("jr-3"),
            occurredAtEpochMillis = DEMO_EPOCH_MILLIS + 7 * DAY,
            title = "Probaste una herramienta",
            detail = "Respirar durante 2 minutos.",
            kind = JourneyEntryKind.TOOL,
        ),
        JourneyEntry(
            id = JourneyEntryId("jr-4"),
            occurredAtEpochMillis = DEMO_EPOCH_MILLIS + 11 * DAY,
            title = "Revisamos el nivel de atención",
            detail = "Puente te mostró por qué te lo señalaba.",
            kind = JourneyEntryKind.ASSESSMENT,
        ),
    )

    private const val DAY = 86_400_000L
}
