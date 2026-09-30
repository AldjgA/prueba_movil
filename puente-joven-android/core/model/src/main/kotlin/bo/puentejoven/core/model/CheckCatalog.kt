package bo.puentejoven.core.model

/**
 * Catálogo **cerrado** del chequeo contextual (`PR-003` §4.3).
 *
 * Es la **única fuente de verdad** del vocabulario. `feature:conversation` y `feature:signals`
 * lo consumen; ninguno lo duplica. Si los dos vocabularios derivan, una regla deja de dispararse
 * **en silencio** — y la que más importa es [SAFETY]: no detectar un peligro inmediato.
 *
 * El **copy** de las preguntas y de las opciones **no** vive aquí: vive en `strings.xml` del APK
 * (regla de la casa #2). Aquí solo hay **identificadores**.
 *
 * ## Historia (importante, porque explica por qué hay 10 y no 5)
 *
 * - **2026-09-30, primera versión (A):** se canonizó el vocabulario del **prototipo**
 *   (`ContextCheckScreen.tsx`), que define **5** preguntas, y se alineó
 *   `LocalPuenteRepository.availableQuestionKeys()` a él. Resolvió el P0 de B: había dos
 *   vocabularios y ninguno era el bueno.
 * - **2026-09-30, ampliación (decisión del dueño del producto):** el **brief §9** lista
 *   **10 dimensiones**, y `TASK-004` criterio #4 las exige. Con las 5 del prototipo, dos
 *   criterios de `PR-001` §4.3 quedaban **sin fuente**: `abuso` (necesita una pregunta de
 *   violencia) y `acoso` (necesita una de acoso). Y `acoso` es **el caso central del brief**.
 *   Se añaden las 5 dimensiones que faltaban.
 *
 * Ver `REVISION-CHECKCATALOG.md` para el análisis completo.
 *
 * Las 5 primeras claves y sus opciones son **exactamente** las que publicó A: el prototipo no
 * se contradice, **se completa**.
 */
object CheckCatalog {

    // -----------------------------------------------------------------------
    // Las 5 del prototipo (sin cambios)
    // -----------------------------------------------------------------------

    /** ¿Cómo te has sentido esta semana? Admite **selección múltiple**. */
    const val EMOTIONS = "emotions"

    /** ¿Cómo ha estado tu sueño últimamente? */
    const val SLEEP = "sleep"

    /** ¿Cómo está yendo en el colegio? */
    const val SCHOOL = "school"

    /** ¿Tienes personas con quienes hablar cuando algo te preocupa? */
    const val LONELINESS = "loneliness"

    /**
     * ¿Te sientes seguro/a en tu entorno habitual?
     *
     * **La pregunta crítica:** es la única cuya respuesta puede elevar a rojo por sí sola
     * *desde el chequeo*. Que su clave sea estable es lo que garantiza que no se pierda un
     * peligro inmediato.
     */
    const val SAFETY = "safety"

    // -----------------------------------------------------------------------
    // Las 5 dimensiones del brief §9 que faltaban
    // -----------------------------------------------------------------------

    /** ¿Alguien te molesta o se ríe de ti? Fuente del motivo [MotivoCatalog.ACOSO]. */
    const val BULLYING = "bullying"

    /**
     * ¿Has vivido algo violento, en casa o fuera?
     *
     * Fuente de [MotivoCatalog.ABUSO] (rojo) y de [MotivoCatalog.VIOLENCIA_NO_INMEDIATA]
     * (amarillo). Sin esta pregunta, **`abuso` no tenía ninguna forma de encenderse**.
     */
    const val VIOLENCE = "violence"

    /** ¿Cómo están las cosas en casa? Conflicto familiar: factor de acumulación. */
    const val FAMILY = "family"

    /** ¿Hay alguien con quien puedas contar? Factor protector (brief §10). */
    const val SUPPORT = "support"

    /** ¿Has consumido algo para sentirte mejor? El brief §9 lo pide «cuando corresponda». */
    const val SUBSTANCE = "substance"

    /**
     * Claves de pregunta, en orden de presentación.
     *
     * El orden importa: `SAFETY` va **antes** de las que se añadieron para que la pregunta
     * crítica se haga pronto, y las sensibles (violencia, familia, consumo) después de las
     * que dan contexto.
     */
    val questionKeys: List<String> = listOf(
        EMOTIONS,
        SLEEP,
        SCHOOL,
        LONELINESS,
        BULLYING,
        FAMILY,
        VIOLENCE,
        SUPPORT,
        SUBSTANCE,
        SAFETY,
    )

    /**
     * Opción que significa **«prefiero no responder»**.
     *
     * Es válida en **cualquier** pregunta: poder no responder es un derecho, no una excepción.
     * Se registra como una decisión más, para que el chequeo avance y el salto quede visible
     * en vez de convertirse en un hueco silencioso.
     */
    const val OPTION_SKIP = "skip"

    /** Opciones cerradas por pregunta. La clave es un identificador; el texto vive en `strings.xml`. */
    val optionsByQuestion: Map<String, List<String>> = mapOf(
        EMOTIONS to listOf(
            "sad", "anxious", "angry", "confused", "exhausted", "lonely", "fine", "dont_know",
        ),
        SLEEP to listOf("sleeps_well", "hard_to_sleep", "sleeps_too_much", "nightmares", "varies"),
        SCHOOL to listOf("fine", "so_so", "struggling", "missing_school", "doesnt_want_to_go"),
        LONELINESS to listOf("several", "one_or_two", "rarely", "usually_not", "no_one"),
        BULLYING to listOf("no", "sometimes", "often", "every_day"),
        FAMILY to listOf("calm", "tense", "fights"),
        VIOLENCE to listOf("no", "arguments", "physical"),
        SUPPORT to listOf("adult", "friend", "not_sure", "nobody"),
        SUBSTANCE to listOf("no", "once", "sometimes"),
        SAFETY to listOf("yes", "no"),
    )

    /** Preguntas que admiten más de una opción. */
    val multiSelectQuestions: Set<String> = setOf(EMOTIONS)

    fun isKnownQuestion(key: String): Boolean = questionKeys.contains(key)

    /**
     * `true` si la opción pertenece a esa pregunta.
     *
     * [OPTION_SKIP] se acepta siempre: saltar es una decisión legítima en cualquier pregunta.
     */
    fun isKnownOption(questionKey: String, optionKey: String): Boolean =
        optionKey == OPTION_SKIP || optionsByQuestion[questionKey]?.contains(optionKey) == true

    fun optionsFor(questionKey: String): List<String> = optionsByQuestion[questionKey].orEmpty()

    fun isMultiSelect(questionKey: String): Boolean = multiSelectQuestions.contains(questionKey)
}

/**
 * Catálogo **cerrado** de `motivo` del reporte (`PR-003` §4.2).
 *
 * **Provisional y versionado** con `rulesetVersion`: provisional no significa indefinido —
 * significa que la lista es cerrada y cambia de **versión**, no de diseño.
 *
 * Nunca texto libre: el reporte viaja con **claves**, y el equipo las interpreta con este catálogo.
 *
 * Regla que conviene recordar: **un `motivo` sin ninguna fuente en el APK es peor que no
 * tenerlo**, porque sugiere una capacidad que no existe. Los que hoy no tienen fuente están
 * declarados en `AttentionRuleset.unreachableFromApk` (feature:signals) y protegidos por prueba.
 */
object MotivoCatalog {

    val all: List<String> = listOf(
        "ideacion_activa",
        "plan_estructurado",
        "intento_reciente",
        "autolesion",
        "abuso",
        "peligro_inmediato",
        "violencia_no_inmediata",
        "deterioro_escolar",
        "aislamiento_persistente",
        /** Escalada por acumulación: varias señales amarillas, ninguna grave por sí sola. */
        "acumulacion",
        /** Acoso o violencia entre iguales: el caso central del brief. */
        "acoso",
    )

    const val ACOSO = "acoso"
    const val ACUMULACION = "acumulacion"
    const val ABUSO = "abuso"
    const val AUTOLESION = "autolesion"
    const val PELIGRO_INMEDIATO = "peligro_inmediato"
    const val VIOLENCIA_NO_INMEDIATA = "violencia_no_inmediata"
    const val DETERIORO_ESCOLAR = "deterioro_escolar"
    const val AISLAMIENTO_PERSISTENTE = "aislamiento_persistente"

    /**
     * Los tres criterios de rojo que **el APK no puede producir hoy**.
     *
     * Ni las 10 preguntas del chequeo (brief §9) ni las señales cubren la autolesión
     * o la ideación, y la conversación es texto libre que nada lee (guardrail #3).
     * Cómo preguntar por esto es una decisión **clínica** (`PR-001` §13).
     */
    const val IDEACION_ACTIVA = "ideacion_activa"
    const val PLAN_ESTRUCTURADO = "plan_estructurado"
    const val INTENTO_RECIENTE = "intento_reciente"

    fun isKnown(key: String): Boolean = all.contains(key)
}
