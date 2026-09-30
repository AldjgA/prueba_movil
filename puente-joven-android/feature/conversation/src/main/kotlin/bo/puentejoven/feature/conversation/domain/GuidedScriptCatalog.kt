package bo.puentejoven.feature.conversation.domain

import androidx.annotation.StringRes
import bo.puentejoven.core.model.CheckCatalog
import bo.puentejoven.feature.conversation.R

/**
 * Opción de respuesta del chequeo.
 *
 * `key` es lo que se persiste (`ContextResponse.optionKey`): una **clave**, nunca
 * texto. Así el dato guardado no depende del idioma ni del copy.
 */
data class CheckOption(
    val key: String,
    @StringRes val labelResId: Int,
)

/**
 * Pregunta del chequeo contextual.
 *
 * El MVP **no** acepta texto libre interpretado por IA (guardrail #3): toda
 * respuesta es una opción cerrada del catálogo.
 */
data class CheckQuestion(
    /** Clave de `CheckCatalog`. Nunca un literal de esta feature. */
    val key: String,
    @StringRes val promptResId: Int,
    val options: List<CheckOption>,
    /** `PR-003` §4.3 regla 3: `emotions` admite más de una opción. */
    val isMultiSelect: Boolean,
)

/**
 * Turno guiado de Puente: nace de una **plantilla**, nunca de un modelo.
 * `promptId` es el identificador de la regla que lo produjo y se persiste en
 * `ConversationMessage.promptId`, de modo que todo turno de la app es auditable.
 */
data class ScriptedTurn(
    val promptId: String,
    @StringRes val messageResId: Int,
)

/**
 * Guion de la Ruta A: catálogo de turnos y preguntas.
 *
 * **El vocabulario NO está aquí.** Las claves de pregunta y de opción viven en
 * `CheckCatalog` (`:core:model`), que es la única fuente. Aquí solo hay **copy**
 * (`@StringRes`) y el guion de Puente.
 *
 * Por qué importa: si las claves se duplicaran entre esta feature y
 * `feature:signals`, una regla podría dejar de dispararse **en silencio**. Ya pasó
 * una vez (P0 de `TASK-005`) y por eso las claves son ahora de A.
 *
 * `VERSION` se declara para poder correlacionar el guion con `rulesetVersion`
 * cuando `TASK-005` lo pida.
 */
object GuidedScriptCatalog {

    /** Versión del guion. Cambia cuando cambia el guion, no cuando cambia el código. */
    const val VERSION = "1.0"

    const val PROMPT_OPENING = "conversation.opening"
    const val PROMPT_ACKNOWLEDGE = "conversation.acknowledge"
    const val PROMPT_CHECK_INTRO = "conversation.check_intro"

    /** Texto de un turno por su `promptId`, o `null` si el id no pertenece al guion. */
    @StringRes
    fun turnResIdOrNull(promptId: String): Int? = when (promptId) {
        PROMPT_OPENING -> R.string.conversation_puente_opening
        PROMPT_ACKNOWLEDGE -> R.string.conversation_puente_acknowledge
        PROMPT_CHECK_INTRO -> R.string.conversation_puente_check_intro
        else -> null
    }

    /** Turno con el que se abre la conversación (brief §8: «Puedes empezar por lo que pasó hoy»). */
    fun openingTurn(): ScriptedTurn = ScriptedTurn(
        promptId = PROMPT_OPENING,
        messageResId = R.string.conversation_puente_opening,
    )

    /**
     * Turno guiado que sigue al mensaje número [youthMessageCount] del joven.
     *
     * Regla **cerrada y determinista**: 1 → acuse; 2 → invitación al chequeo;
     * a partir de ahí, ninguno (el joven decide cuándo seguir con las preguntas).
     * Un guion que hablara siempre convertiría la conversación en un formulario,
     * que es exactamente lo que el brief §8 prohíbe.
     */
    fun turnAfterYouthMessage(youthMessageCount: Int): ScriptedTurn? = when (youthMessageCount) {
        1 -> ScriptedTurn(PROMPT_ACKNOWLEDGE, R.string.conversation_puente_acknowledge)
        2 -> ScriptedTurn(PROMPT_CHECK_INTRO, R.string.conversation_puente_check_intro)
        else -> null
    }

    /**
     * Las 10 preguntas del brief §9, construidas desde `CheckCatalog`.
     *
     * Si el catálogo gana una clave y aquí falta el copy, la pregunta **no aparece**
     * en vez de romper la app. Eso no es silencioso: `GuidedScriptCatalogTest`
     * comprueba que el número de opciones con copy coincide con el del catálogo.
     */
    val questions: List<CheckQuestion> = CheckCatalog.questionKeys.mapNotNull(::buildQuestion)

    /** Todas las claves de pregunta, en orden. */
    val questionKeys: List<String> = questions.map { it.key }

    fun question(key: String): CheckQuestion? = questions.firstOrNull { it.key == key }

    /** Primera pregunta **sin decidir** según [answeredKeys]. `null` si ya están todas. */
    fun nextQuestion(answeredKeys: Set<String>): CheckQuestion? =
        questions.firstOrNull { it.key !in answeredKeys }

    private fun buildQuestion(questionKey: String): CheckQuestion? {
        val promptResId = promptResIdFor(questionKey) ?: return null

        val options = CheckCatalog.optionsFor(questionKey)
            .mapNotNull { optionKey ->
                optionLabelResIdFor(questionKey, optionKey)?.let { CheckOption(optionKey, it) }
            }
            // Poder no responder es un derecho: se añade al final de todas.
            .plus(CheckOption(CheckCatalog.OPTION_SKIP, R.string.check_skip))

        return CheckQuestion(
            key = questionKey,
            promptResId = promptResId,
            options = options,
            isMultiSelect = CheckCatalog.isMultiSelect(questionKey),
        )
    }

    @StringRes
    private fun promptResIdFor(questionKey: String): Int? = when (questionKey) {
        CheckCatalog.EMOTIONS -> R.string.check_emotions_prompt
        CheckCatalog.SLEEP -> R.string.check_sleep_prompt
        CheckCatalog.SCHOOL -> R.string.check_school_prompt
        CheckCatalog.LONELINESS -> R.string.check_loneliness_prompt
        CheckCatalog.BULLYING -> R.string.check_bullying_prompt
        CheckCatalog.FAMILY -> R.string.check_family_prompt
        CheckCatalog.VIOLENCE -> R.string.check_violence_prompt
        CheckCatalog.SUPPORT -> R.string.check_support_prompt
        CheckCatalog.SUBSTANCE -> R.string.check_substance_prompt
        CheckCatalog.SAFETY -> R.string.check_safety_prompt
        else -> null
    }

    @StringRes
    private fun optionLabelResIdFor(questionKey: String, optionKey: String): Int? = when (questionKey) {
        CheckCatalog.EMOTIONS -> when (optionKey) {
            "sad" -> R.string.check_emotions_sad
            "anxious" -> R.string.check_emotions_anxious
            "angry" -> R.string.check_emotions_angry
            "confused" -> R.string.check_emotions_confused
            "exhausted" -> R.string.check_emotions_exhausted
            "lonely" -> R.string.check_emotions_lonely
            "fine" -> R.string.check_emotions_fine
            "dont_know" -> R.string.check_emotions_dont_know
            else -> null
        }

        CheckCatalog.SLEEP -> when (optionKey) {
            "sleeps_well" -> R.string.check_sleep_sleeps_well
            "hard_to_sleep" -> R.string.check_sleep_hard_to_sleep
            "sleeps_too_much" -> R.string.check_sleep_sleeps_too_much
            "nightmares" -> R.string.check_sleep_nightmares
            "varies" -> R.string.check_sleep_varies
            else -> null
        }

        CheckCatalog.SCHOOL -> when (optionKey) {
            "fine" -> R.string.check_school_fine
            "so_so" -> R.string.check_school_so_so
            "struggling" -> R.string.check_school_struggling
            "missing_school" -> R.string.check_school_missing_school
            "doesnt_want_to_go" -> R.string.check_school_doesnt_want_to_go
            else -> null
        }

        CheckCatalog.LONELINESS -> when (optionKey) {
            "several" -> R.string.check_loneliness_several
            "one_or_two" -> R.string.check_loneliness_one_or_two
            "rarely" -> R.string.check_loneliness_rarely
            "usually_not" -> R.string.check_loneliness_usually_not
            "no_one" -> R.string.check_loneliness_no_one
            else -> null
        }

        CheckCatalog.BULLYING -> when (optionKey) {
            "no" -> R.string.check_bullying_no
            "sometimes" -> R.string.check_bullying_sometimes
            "often" -> R.string.check_bullying_often
            "every_day" -> R.string.check_bullying_every_day
            else -> null
        }

        CheckCatalog.FAMILY -> when (optionKey) {
            "calm" -> R.string.check_family_calm
            "tense" -> R.string.check_family_tense
            "fights" -> R.string.check_family_fights
            else -> null
        }

        CheckCatalog.VIOLENCE -> when (optionKey) {
            "no" -> R.string.check_violence_no
            "arguments" -> R.string.check_violence_arguments
            "physical" -> R.string.check_violence_physical
            else -> null
        }

        CheckCatalog.SUPPORT -> when (optionKey) {
            "adult" -> R.string.check_support_adult
            "friend" -> R.string.check_support_friend
            "not_sure" -> R.string.check_support_not_sure
            "nobody" -> R.string.check_support_nobody
            else -> null
        }

        CheckCatalog.SUBSTANCE -> when (optionKey) {
            "no" -> R.string.check_substance_no
            "once" -> R.string.check_substance_once
            "sometimes" -> R.string.check_substance_sometimes
            else -> null
        }

        CheckCatalog.SAFETY -> when (optionKey) {
            "yes" -> R.string.check_safety_yes
            "no" -> R.string.check_safety_no
            else -> null
        }

        else -> null
    }
}
