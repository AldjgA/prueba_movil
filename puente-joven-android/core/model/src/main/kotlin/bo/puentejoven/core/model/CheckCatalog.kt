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
 * Canónico desde el 2026-09-30: antes el prototipo definía estas 5 preguntas y el repositorio
 * devolvía otras 4 (`hoy_como_estas`, `donde_ocurre`, `cada_cuanto`, `con_quien_puedes_contar`).
 */
object CheckCatalog {

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
     * **La pregunta crítica:** es la única cuya respuesta puede elevar a rojo por sí sola.
     * Que su clave sea estable es lo que garantiza que no se pierda un peligro inmediato.
     */
    const val SAFETY = "safety"

    /** Claves de pregunta, en orden de presentación. */
    val questionKeys: List<String> = listOf(EMOTIONS, SLEEP, SCHOOL, LONELINESS, SAFETY)

    /** Opciones cerradas por pregunta. La clave es un identificador; el texto vive en `strings.xml`. */
    val optionsByQuestion: Map<String, List<String>> = mapOf(
        EMOTIONS to listOf(
            "sad", "anxious", "angry", "confused", "exhausted", "lonely", "fine", "dont_know",
        ),
        SLEEP to listOf("sleeps_well", "hard_to_sleep", "sleeps_too_much", "nightmares", "varies"),
        SCHOOL to listOf("fine", "so_so", "struggling", "missing_school", "doesnt_want_to_go"),
        LONELINESS to listOf("several", "one_or_two", "rarely", "usually_not", "no_one"),
        SAFETY to listOf("yes", "no"),
    )

    /** Preguntas que admiten más de una opción. */
    val multiSelectQuestions: Set<String> = setOf(EMOTIONS)

    fun isKnownQuestion(key: String): Boolean = questionKeys.contains(key)

    fun isKnownOption(questionKey: String, optionKey: String): Boolean =
        optionsByQuestion[questionKey]?.contains(optionKey) == true

    fun optionsFor(questionKey: String): List<String> = optionsByQuestion[questionKey].orEmpty()
}

/**
 * Catálogo **cerrado** de `motivo` del reporte (`PR-003` §4.2).
 *
 * **Provisional y versionado** con `rulesetVersion`: provisional no significa indefinido —
 * significa que la lista es cerrada y cambia de **versión**, no de diseño.
 *
 * Nunca texto libre: el reporte viaja con **claves**, y el equipo las interpreta con este catálogo.
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

    fun isKnown(key: String): Boolean = all.contains(key)
}
