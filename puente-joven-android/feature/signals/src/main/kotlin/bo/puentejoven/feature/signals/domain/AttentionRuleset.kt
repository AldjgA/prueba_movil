package bo.puentejoven.feature.signals.domain

import androidx.annotation.StringRes
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.CheckCatalog
import bo.puentejoven.core.model.MotivoCatalog
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SignalEvidence
import bo.puentejoven.core.model.TrendDirection
import bo.puentejoven.feature.signals.R

/** Por qué el motor llegó a ese nivel. Permite explicarlo sin inventar copy. */
enum class LevelReason {
    /** Ninguna regla se activó. */
    NOTHING,

    /** Se activó un criterio de `PR-001` §4.3. */
    CRITERION,

    /** No hay criterio grave, pero los factores se acumulan (`PR-001` §4.2). */
    ACCUMULATION,

    /**
     * El cálculo actual daría menos, pero **ya se había alcanzado rojo** y un rojo no
     * se degrada solo (D2). Requiere que una persona lo revise.
     */
    LATCHED_RED,
}

/**
 * Resultado de aplicar el conjunto de reglas.
 *
 * Devuelve **claves de recurso**, no texto: el copy vive en `strings.xml` (regla de la
 * casa #2) y el modelo `AttentionAssessment` no se toca (D4: se prefiere la
 * alternativa que no cambia el contrato).
 */
data class RuleOutcome(
    val level: AttentionLevel,
    val motivoKeys: List<String>,
    val reason: LevelReason,
    @StringRes val titleResId: Int,
    @StringRes val explanationResId: Int,
    @StringRes val whatChangedResId: Int,
    @StringRes val nextStepResId: Int,
    /** Registros concretos que produjeron el resultado (brief §11: mostrarlos). */
    val evidence: List<SignalEvidence>,
)

/**
 * Motor de prioridad preliminar de revisión.
 *
 * **Determinista y auditable.** Sin IA, sin azar: las mismas respuestas y las mismas
 * señales producen siempre el mismo resultado (criterio #3 de `TASK-005`). Es la
 * decisión D1/D2: el rojo lo determinan **reglas**, nunca un modelo de lenguaje.
 *
 * `VERSION` se propaga a `AttentionAssessment.rulesetVersion` y viaja en el reporte
 * (`PR-003` §4): sin ella, una prioridad no es trazable a la regla que la emitió.
 *
 * **Las claves vienen de `CheckCatalog`.** Ni una sola se declara aquí: si se
 * duplicaran y derivasen, la regla dejaría de dispararse **en silencio**.
 *
 * **Lo que este motor NO puede hacer hoy** — ver `unreachableFromApk`:
 * `ideacion_activa`, `plan_estructurado` e `intento_reciente` son criterios de rojo de
 * `PR-001` §4.3 para los que **no existe ninguna fuente** en el APK: ni las 10
 * preguntas del catálogo ni las señales cubren la autolesión o la ideación.
 */
object AttentionRuleset {

    /** Versión del conjunto de reglas. Cambia cuando cambian los umbrales. */
    const val VERSION = "2026-09-30.1"

    /**
     * Cuántos factores deben acumularse para subir a amarillo sin ningún criterio
     * grave. El brief §10 pide «acumulación de señales»; `PR-001` §4.2 lo confirma
     * («varios factores acumulados») pero **no fija el número**.
     *
     * `3` es una decisión de ingeniería, no clínica: está aquí, con nombre y versión,
     * precisamente para que sea fácil de cambiar cuando el clínico la revise.
     */
    const val ACCUMULATION_THRESHOLD = 3

    /**
     * Criterios de `PR-001` §4.3 que **ninguna respuesta del chequeo puede producir**.
     *
     * Es una constante y no un comentario para que la carencia sea visible en el
     * código y comprobable en una prueba.
     */
    val unreachableFromApk: Set<String> = setOf(
        MotivoCatalog.IDEACION_ACTIVA,
        MotivoCatalog.PLAN_ESTRUCTURADO,
        MotivoCatalog.INTENTO_RECIENTE,
    )

    /**
     * Evalúa la prioridad.
     *
     * @param answers pregunta → **conjunto** de opciones elegidas. Es un conjunto porque
     *   `emotions` admite selección múltiple (`PR-003` §4.3 regla 3).
     */
    fun evaluate(
        answers: Map<String, Set<String>>,
        signals: List<Signal>,
    ): RuleOutcome {
        val motivos = linkedSetOf<String>()

        // --- Señales: normalizadas al catálogo canónico (PR-003 §4.1) ---
        // Una clave desconocida (p. ej. FREQUENCY, retirada) se ignora: inventarle
        // significado a un dato ajeno sería peor que no usarlo.
        val canonicalSignals = signals.mapNotNull { signal ->
            SignalCatalog.canonicalOrNull(signal.key.value)?.let { canonical -> canonical to signal }
        }

        // --- Criterios de ROJO (PR-001 §4.3) ---
        if (answers[CheckCatalog.SAFETY]?.contains("no") == true) {
            motivos += MotivoCatalog.PELIGRO_INMEDIATO
        }
        if (answers[CheckCatalog.VIOLENCE]?.contains("physical") == true) {
            motivos += MotivoCatalog.ABUSO
        }
        canonicalSignals.forEach { (canonical, _) ->
            signalToMotivo[canonical]?.let { motivos += it }
        }

        val hasRedCriterion = motivos.any { it in redMotivos }

        // --- Criterios de AMARILLO (PR-001 §4.2 / §4.3) ---
        if (!hasRedCriterion) {
            if (answers[CheckCatalog.BULLYING]?.any { it == "often" || it == "every_day" } == true) {
                // `acoso` existe en el catálogo desde el 2026-09-30: es el caso central
                // del brief y, sin la pregunta de acoso, era una etiqueta sin fuente.
                motivos += MotivoCatalog.ACOSO
            }
            if (answers[CheckCatalog.VIOLENCE]?.contains("arguments") == true) {
                motivos += MotivoCatalog.VIOLENCIA_NO_INMEDIATA
            }
            if (answers[CheckCatalog.SCHOOL]
                    ?.any { it == "missing_school" || it == "doesnt_want_to_go" } == true
            ) {
                motivos += MotivoCatalog.DETERIORO_ESCOLAR
            }
            if (answers[CheckCatalog.LONELINESS]
                    ?.any { it == "usually_not" || it == "no_one" } == true
            ) {
                motivos += MotivoCatalog.AISLAMIENTO_PERSISTENTE
            }
        }

        val accumulation = accumulationFactors(answers, canonicalSignals.map { it.second })

        val reason = when {
            hasRedCriterion -> LevelReason.CRITERION
            motivos.isNotEmpty() -> LevelReason.CRITERION
            accumulation >= ACCUMULATION_THRESHOLD -> LevelReason.ACCUMULATION
            else -> LevelReason.NOTHING
        }

        // Un amarillo por acumulación **sí** lleva motivo desde que `acumulacion`
        // existe en el catálogo: antes viajaba vacío y el equipo no sabía por qué.
        if (reason == LevelReason.ACCUMULATION) {
            motivos += MotivoCatalog.ACUMULACION
        }

        val level = when (reason) {
            LevelReason.CRITERION -> if (hasRedCriterion) AttentionLevel.RED else AttentionLevel.YELLOW
            LevelReason.ACCUMULATION -> AttentionLevel.YELLOW
            LevelReason.NOTHING -> AttentionLevel.GREEN
            // `evaluate` nunca produce LATCHED_RED: eso lo aplica [enforceNoDegrade],
            // que necesita conocer la secuencia. La rama existe para que el `when` sea
            // exhaustivo, y si algún día se alcanzara, rojo es la respuesta segura.
            LevelReason.LATCHED_RED -> AttentionLevel.RED
        }

        return RuleOutcome(
            level = level,
            motivoKeys = motivos.toList(),
            reason = reason,
            titleResId = titleFor(level),
            explanationResId = explanationFor(level),
            whatChangedResId = whatChangedFor(level),
            nextStepResId = nextStepFor(level),
            // Brief §11: solo la evidencia de las señales que el motor usó.
            evidence = canonicalSignals
                .filter { signalToMotivo.containsKey(it.first) }
                .flatMap { it.second.evidence },
        )
    }

    /**
     * **D2 aplicado al APK: un rojo no se degrada solo.**
     *
     * `PR-003` §9.4 dice que *el LLM no puede bajar un rojo*. La misma lógica vale
     * dentro del APK, y por una razón clínica: una alarma de la que ya se avisó **no
     * debe apagarse sola** porque el joven responda distinto cinco minutos después.
     * `PR-001` P4: ninguna prioridad reemplaza a una persona — y apagar una alarma
     * roja sin que nadie la revise es exactamente sustituir a esa persona.
     *
     * Se implementa como función **pura y separada** de [evaluate] para que:
     * - la evaluación siga siendo determinista y sin estado (criterio #3);
     * - la secuencia (quién observó qué antes) la aporte quien corresponde, no el motor;
     * - el invariante se pueda probar solo, sin montar la secuencia entera.
     */
    fun enforceNoDegrade(
        computed: RuleOutcome,
        previousLevel: AttentionLevel?,
    ): RuleOutcome {
        if (previousLevel != AttentionLevel.RED || computed.level == AttentionLevel.RED) {
            return computed
        }

        return computed.copy(
            level = AttentionLevel.RED,
            reason = LevelReason.LATCHED_RED,
            titleResId = R.string.attention_red_title,
            explanationResId = R.string.attention_red_explanation,
            whatChangedResId = R.string.attention_red_what_changed,
            nextStepResId = R.string.attention_red_next_step,
        )
    }

    /**
     * Factores que, sumados, suben la prioridad sin ser criterio por sí solos.
     *
     * Del chequeo: emociones afectadas, sueño alterado, colegio costando, conflicto
     * en casa, consumo, y **apoyo escaso** (un factor protector que falta también
     * cuenta — brief §10).
     * De las señales: **cada señal en ascenso es un factor**.
     *
     * Con tres señales en ascenso se llega a amarillo **sin ningún motivo concreto**,
     * que es exactamente lo que `PR-001` §4.2 llama «varios factores acumulados» y lo
     * que ahora viaja como `acumulacion`.
     */
    private fun accumulationFactors(
        answers: Map<String, Set<String>>,
        signals: List<Signal>,
    ): Int {
        var factors = 0

        if (answers[CheckCatalog.EMOTIONS]
                ?.any { it in setOf("sad", "anxious", "exhausted", "lonely") } == true
        ) {
            factors++
        }
        if (answers[CheckCatalog.SLEEP]
                ?.any { it == "hard_to_sleep" || it == "sleeps_too_much" || it == "nightmares" } == true
        ) {
            factors++
        }
        if (answers[CheckCatalog.SCHOOL]?.contains("struggling") == true) factors++
        if (answers[CheckCatalog.FAMILY]?.any { it == "tense" || it == "fights" } == true) factors++
        if (answers[CheckCatalog.SUPPORT]?.any { it == "not_sure" || it == "nobody" } == true) factors++
        if (answers[CheckCatalog.SUBSTANCE]?.any { it == "once" || it == "sometimes" } == true) {
            factors++
        }

        factors += signals.count { it.trendDirection == TrendDirection.RISING }

        return factors
    }

    /**
     * Copy por nivel — brief §13, literal.
     *
     * El brief fija las tres frases: *"Podemos trabajar en esto paso a paso."*,
     * *"Sería bueno involucrar a alguien."*, *"Esto necesita apoyo humano prioritario."*
     * No se reescriben.
     */
    @StringRes
    private fun titleFor(level: AttentionLevel): Int = when (level) {
        AttentionLevel.GREEN -> R.string.attention_green_title
        AttentionLevel.YELLOW -> R.string.attention_yellow_title
        AttentionLevel.RED -> R.string.attention_red_title
    }

    @StringRes
    private fun explanationFor(level: AttentionLevel): Int = when (level) {
        AttentionLevel.GREEN -> R.string.attention_green_explanation
        AttentionLevel.YELLOW -> R.string.attention_yellow_explanation
        AttentionLevel.RED -> R.string.attention_red_explanation
    }

    @StringRes
    private fun whatChangedFor(level: AttentionLevel): Int = when (level) {
        AttentionLevel.GREEN -> R.string.attention_green_what_changed
        AttentionLevel.YELLOW -> R.string.attention_yellow_what_changed
        AttentionLevel.RED -> R.string.attention_red_what_changed
    }

    @StringRes
    private fun nextStepFor(level: AttentionLevel): Int = when (level) {
        AttentionLevel.GREEN -> R.string.attention_green_next_step
        AttentionLevel.YELLOW -> R.string.attention_yellow_next_step
        AttentionLevel.RED -> R.string.attention_red_next_step
    }
}
