package bo.puentejoven.feature.conversation.domain

import androidx.annotation.StringRes
import bo.puentejoven.feature.conversation.R

/**
 * Dimensiones que explora el chequeo contextual — brief §9.
 *
 * `catalogKey` es un identificador de código (inglés/minúsculas), nunca copy.
 * La lista es **cerrada**: añadir una dimensión es una decisión de producto, no un
 * detalle de implementación (mismo criterio que `ShareScopeEntry`).
 */
enum class CheckDimension(val catalogKey: String) {
    FEELINGS("feelings"),
    SLEEP("sleep"),
    LONELINESS("loneliness"),
    BULLYING("bullying"),
    VIOLENCE("violence"),
    FAMILY_CONFLICT("family_conflict"),
    SCHOOL("school"),
    AVAILABLE_SUPPORT("available_support"),
    SUBSTANCE_USE("substance_use"),
    PERSONAL_SAFETY("personal_safety"),
}

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
 * respuesta es una opción predefinida de esta lista.
 */
data class CheckQuestion(
    val key: String,
    val dimension: CheckDimension,
    @StringRes val promptResId: Int,
    val options: List<CheckOption>,
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
 * Guion de la Ruta A: catálogo **cerrado y versionado** de turnos y preguntas.
 *
 * Reglas de diseño:
 * - Determinista: la misma entrada produce siempre el mismo turno. Sin IA, sin azar.
 * - Auditable: cada turno lleva `promptId`; cada pregunta y opción, su clave.
 * - **No calcula niveles de atención.** Eso es `TASK-005`. Aquí solo se recogen
 *   respuestas; confundir ambas cosas metería reglas clínicas en la capa de UI.
 *
 * `VERSION` se declara para que el catálogo pueda correlacionarse con
 * `rulesetVersion` cuando `TASK-005` lo pida (`TASK-004` §9 Q1, aún abierta).
 */
object GuidedScriptCatalog {

    /** Versión del guion. Cambia cuando cambia el guion, no cuando cambia el código. */
    const val VERSION = "1.0"

    const val PROMPT_OPENING = "conversation.opening"
    const val PROMPT_ACKNOWLEDGE = "conversation.acknowledge"
    const val PROMPT_CHECK_INTRO = "conversation.check_intro"

    /** Clave de la opción «prefiero no responder», disponible en **todas** las preguntas. */
    const val OPTION_SKIP = "skip"

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

    /** Opción de salto. Se añade a todas las preguntas: poder no responder es un derecho. */
    private val skipOption = CheckOption(OPTION_SKIP, R.string.check_skip)

    /**
     * Las 10 dimensiones del brief §9, una pregunta cada una.
     *
     * Nota de producto: el brief dice que el consumo de sustancias se explora
     * «cuando corresponda», pero **no define la regla** de cuándo corresponde
     * (`TASK-004` §9 Q5, abierta). Hasta que se decida, la pregunta existe y el
     * joven puede saltarla — no se activa por perfil ni por edad, porque eso sería
     * una regla inventada.
     */
    val questions: List<CheckQuestion> = listOf(
        CheckQuestion(
            key = "check.feelings",
            dimension = CheckDimension.FEELINGS,
            promptResId = R.string.check_feelings_prompt,
            options = listOf(
                CheckOption("better", R.string.check_feelings_better),
                CheckOption("same", R.string.check_feelings_same),
                CheckOption("worse", R.string.check_feelings_worse),
                CheckOption("mixed", R.string.check_feelings_mixed),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.sleep",
            dimension = CheckDimension.SLEEP,
            promptResId = R.string.check_sleep_prompt,
            options = listOf(
                CheckOption("ok", R.string.check_sleep_ok),
                CheckOption("falling_asleep", R.string.check_sleep_falling_asleep),
                CheckOption("waking_up", R.string.check_sleep_waking_up),
                CheckOption("very_little", R.string.check_sleep_very_little),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.loneliness",
            dimension = CheckDimension.LONELINESS,
            promptResId = R.string.check_loneliness_prompt,
            options = listOf(
                CheckOption("accompanied", R.string.check_loneliness_accompanied),
                CheckOption("sometimes", R.string.check_loneliness_sometimes),
                CheckOption("often", R.string.check_loneliness_often),
                CheckOption("always", R.string.check_loneliness_always),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.bullying",
            dimension = CheckDimension.BULLYING,
            promptResId = R.string.check_bullying_prompt,
            options = listOf(
                CheckOption("no", R.string.check_bullying_no),
                CheckOption("sometimes", R.string.check_bullying_sometimes),
                CheckOption("often", R.string.check_bullying_often),
                CheckOption("every_day", R.string.check_bullying_every_day),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.violence",
            dimension = CheckDimension.VIOLENCE,
            promptResId = R.string.check_violence_prompt,
            options = listOf(
                CheckOption("no", R.string.check_violence_no),
                CheckOption("arguments", R.string.check_violence_arguments),
                CheckOption("physical", R.string.check_violence_physical),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.family",
            dimension = CheckDimension.FAMILY_CONFLICT,
            promptResId = R.string.check_family_prompt,
            options = listOf(
                CheckOption("calm", R.string.check_family_calm),
                CheckOption("tense", R.string.check_family_tense),
                CheckOption("fights", R.string.check_family_fights),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.school",
            dimension = CheckDimension.SCHOOL,
            promptResId = R.string.check_school_prompt,
            options = listOf(
                CheckOption("well", R.string.check_school_well),
                CheckOption("focus", R.string.check_school_focus),
                CheckOption("missing", R.string.check_school_missing),
                CheckOption("not_going", R.string.check_school_not_going),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.support",
            dimension = CheckDimension.AVAILABLE_SUPPORT,
            promptResId = R.string.check_support_prompt,
            options = listOf(
                CheckOption("adult", R.string.check_support_adult),
                CheckOption("friend", R.string.check_support_friend),
                CheckOption("not_sure", R.string.check_support_not_sure),
                CheckOption("nobody", R.string.check_support_nobody),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.substance",
            dimension = CheckDimension.SUBSTANCE_USE,
            promptResId = R.string.check_substance_prompt,
            options = listOf(
                CheckOption("no", R.string.check_substance_no),
                CheckOption("once", R.string.check_substance_once),
                CheckOption("sometimes", R.string.check_substance_sometimes),
                skipOption,
            ),
        ),
        CheckQuestion(
            key = "check.safety",
            dimension = CheckDimension.PERSONAL_SAFETY,
            promptResId = R.string.check_safety_prompt,
            options = listOf(
                CheckOption("yes", R.string.check_safety_yes),
                CheckOption("mostly", R.string.check_safety_mostly),
                CheckOption("not_always", R.string.check_safety_not_always),
                CheckOption("no", R.string.check_safety_no),
                skipOption,
            ),
        ),
    )

    /** Todas las claves de pregunta, en orden. */
    val questionKeys: List<String> = questions.map { it.key }

    fun question(key: String): CheckQuestion? = questions.firstOrNull { it.key == key }

    /**
     * Primera pregunta **sin decidir** según [answeredKeys].
     * `null` cuando ya se ha respondido o saltado todas.
     */
    fun nextQuestion(answeredKeys: Set<String>): CheckQuestion? =
        questions.firstOrNull { it.key !in answeredKeys }
}
