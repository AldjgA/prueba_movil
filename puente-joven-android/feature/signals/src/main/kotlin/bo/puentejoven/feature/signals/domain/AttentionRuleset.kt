package bo.puentejoven.feature.signals.domain

import androidx.annotation.StringRes
import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SignalEvidence
import bo.puentejoven.core.model.TrendDirection
import bo.puentejoven.feature.signals.R

/**
 * Claves de pregunta del chequeo contextual (`TASK-004`) que estas reglas interpretan,
 * y los valores de opción que las activan.
 *
 * ⚠️ **Estas claves son un contrato con `feature:conversation`.** Hoy están declaradas
 * aquí porque el vocabulario compartido todavía no vive en `:core:model`. Si las dos
 * listas se separan, la consecuencia **no es un fallo visible: es una regla que deja
 * de dispararse en silencio**, que en el caso del rojo es un fallo de seguridad.
 * Por eso está declarado como necesidad P0 en `deliverables/TASK-005/NECESIDADES.md`.
 */
internal object CheckKey {
    const val FEELINGS = "check.feelings"
    const val SLEEP = "check.sleep"
    const val LONELINESS = "check.loneliness"
    const val BULLYING = "check.bullying"
    const val VIOLENCE = "check.violence"
    const val FAMILY = "check.family"
    const val SCHOOL = "check.school"
    const val SUBSTANCE = "check.substance"
    const val SAFETY = "check.safety"
}

/** Opciones que el motor interpreta, agrupadas por la regla que activan. */
internal object CheckOption {
    const val FEELINGS_WORSE = "worse"
    const val SLEEP_WAKING_UP = "waking_up"
    const val SLEEP_VERY_LITTLE = "very_little"
    const val LONELINESS_OFTEN = "often"
    const val LONELINESS_ALWAYS = "always"
    const val BULLYING_OFTEN = "often"
    const val BULLYING_EVERY_DAY = "every_day"
    const val VIOLENCE_ARGUMENTS = "arguments"
    const val VIOLENCE_PHYSICAL = "physical"
    const val FAMILY_TENSE = "tense"
    const val FAMILY_FIGHTS = "fights"
    const val SCHOOL_MISSING = "missing"
    const val SCHOOL_NOT_GOING = "not_going"
    const val SUBSTANCE_ONCE = "once"
    const val SUBSTANCE_SOMETIMES = "sometimes"
    const val SAFETY_NO = "no"
}

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
 * (`PR-003` §4`): sin ella, una prioridad no es trazable a la regla que la emitió.
 *
 * **Lo que este motor NO puede hacer hoy** — ver `MotivoCatalog.unreachableFromApk`:
 * `ideacion_activa`, `plan_estructurado` e `intento_reciente` son criterios de rojo de
 * `PR-001` §4.3 para los que **no existe ninguna fuente** en el APK: ni el chequeo
 * (brief §9) ni las señales preguntan por ellos.
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

    fun evaluate(
        answers: Map<String, String>,
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
        if (answers[CheckKey.SAFETY] == CheckOption.SAFETY_NO) {
            motivos += MotivoCatalog.PELIGRO_INMEDIATO
        }
        if (answers[CheckKey.VIOLENCE] == CheckOption.VIOLENCE_PHYSICAL) {
            motivos += MotivoCatalog.ABUSO
        }
        canonicalSignals.forEach { (canonical, _) ->
            signalToMotivo[canonical]?.let { motivos += it }
        }

        val hasRedCriterion = motivos.any { it in redMotivos }

        // --- Criterios de AMARILLO (PR-001 §4.3) ---
        if (!hasRedCriterion) {
            if (answers[CheckKey.BULLYING] == CheckOption.BULLYING_OFTEN ||
                answers[CheckKey.BULLYING] == CheckOption.BULLYING_EVERY_DAY
            ) {
                motivos += MotivoCatalog.VIOLENCIA_NO_INMEDIATA
            }
            if (answers[CheckKey.VIOLENCE] == CheckOption.VIOLENCE_ARGUMENTS) {
                motivos += MotivoCatalog.VIOLENCIA_NO_INMEDIATA
            }
            if (answers[CheckKey.SCHOOL] == CheckOption.SCHOOL_MISSING ||
                answers[CheckKey.SCHOOL] == CheckOption.SCHOOL_NOT_GOING
            ) {
                motivos += MotivoCatalog.DETERIORO_ESCOLAR
            }
            if (answers[CheckKey.LONELINESS] == CheckOption.LONELINESS_OFTEN ||
                answers[CheckKey.LONELINESS] == CheckOption.LONELINESS_ALWAYS
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
     * Factores que, sumados, suben la prioridad sin ser criterio por sí solos.
     *
     * Del chequeo: ánimo peor, sueño alterado, conflicto en casa, consumo.
     * De las señales: **cada señal en ascenso es un factor** (brief §10: «frecuencia»,
     * «persistencia», «cambios»).
     *
     * Se cuenta una a una y no como un bloque: un factor es un factor, y agruparlas
     * haría que el umbral significara cosas distintas según cuántas señales hubiera.
     * Con tres señales en ascenso se llega a amarillo **sin ningún motivo concreto**,
     * que es exactamente lo que `PR-001` §4.2 llama «varios factores acumulados».
     */
    private fun accumulationFactors(
        answers: Map<String, String>,
        signals: List<Signal>,
    ): Int {
        var factors = 0

        if (answers[CheckKey.FEELINGS] == CheckOption.FEELINGS_WORSE) factors++
        if (answers[CheckKey.SLEEP] == CheckOption.SLEEP_WAKING_UP ||
            answers[CheckKey.SLEEP] == CheckOption.SLEEP_VERY_LITTLE
        ) {
            factors++
        }
        if (answers[CheckKey.FAMILY] == CheckOption.FAMILY_TENSE ||
            answers[CheckKey.FAMILY] == CheckOption.FAMILY_FIGHTS
        ) {
            factors++
        }
        if (answers[CheckKey.SUBSTANCE] == CheckOption.SUBSTANCE_ONCE ||
            answers[CheckKey.SUBSTANCE] == CheckOption.SUBSTANCE_SOMETIMES
        ) {
            factors++
        }

        factors += signals.count { it.trendDirection == TrendDirection.RISING }

        return factors
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
     *
     * El rojo se mantiene **hasta que una persona lo revise**. El APK no puede
     * confirmarlo (`AttentionAssessment.requiresHumanConfirmation` es `true`).
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
