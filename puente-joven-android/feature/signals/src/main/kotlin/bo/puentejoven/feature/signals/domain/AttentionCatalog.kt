package bo.puentejoven.feature.signals.domain

/**
 * Catálogos compartidos con el backend, tal como los publica `PR-003`.
 *
 * Existen aquí porque el APK **emite** estas claves (`TASK-015`) y **razona** con
 * ellas (`TASK-005`). Están en un solo sitio para que no haya dos listas que se
 * desincronicen — que es exactamente el problema que tuvo `PR-006` con
 * `SignalTag` (ver `REVISION-C-POR-B.md` K1).
 */

/**
 * Claves canónicas de señal — `PR-003` §4.1.
 *
 * **Forma canónica: `SNAKE_CASE` en MAYÚSCULAS.** El backend (`PR-006`) es quien
 * versiona el catálogo; el APK se alinea.
 *
 * `frequency` **no está**: `PR-003` §4.1 la retiró porque es una *dimensión de
 * análisis* (brief §10), no un tipo de señal. Por eso [canonicalOrNull] la rechaza.
 */
object SignalCatalog {

    const val SLEEP = "SLEEP"
    const val ANXIETY = "ANXIETY"
    const val ISOLATION = "ISOLATION"
    const val SCHOOL_IMPACT = "SCHOOL_IMPACT"
    const val SUBSTANCE_USE = "SUBSTANCE_USE"
    const val SELF_HARM = "SELF_HARM"
    const val PHYSICAL_VIOLENCE = "PHYSICAL_VIOLENCE"

    val all: Set<String> = setOf(
        SLEEP, ANXIETY, ISOLATION, SCHOOL_IMPACT, SUBSTANCE_USE, SELF_HARM, PHYSICAL_VIOLENCE,
    )

    /**
     * Normaliza una clave al catálogo canónico.
     *
     * **Por qué existe:** `DemoFixtures` sigue emitiendo `SignalKey("isolation")` en
     * minúsculas, y `PR-003` §4.1 fijó MAYÚSCULAS. En vez de asumir que A lo
     * arreglará antes de que esto se integre, la normalización es explícita y está
     * probada. Cuando A canonicalice las fixtures, esto sigue funcionando.
     *
     * Devuelve `null` si la clave no pertenece al catálogo (p. ej. `FREQUENCY`): una
     * clave desconocida **no se interpreta como una señal**, porque inventar
     * significado a un dato ajeno es peor que ignorarlo.
     */
    fun canonicalOrNull(rawKey: String): String? {
        val normalized = rawKey.trim().uppercase()
        return if (normalized in all) normalized else null
    }
}

/**
 * Claves del catálogo de `motivo` — `PR-003` §4.2 (provisional y versionado con
 * `rulesetVersion`, derivado de `PR-001` §4.3).
 *
 * `motivo` es lo que le dice al equipo **por qué** se activó la alerta. Viaja en el
 * reporte (`PR-003` §4) y nunca como texto libre.
 */
object MotivoCatalog {

    // --- Criterios de ROJO (PR-001 §4.3) ---
    const val IDEACION_ACTIVA = "ideacion_activa"
    const val PLAN_ESTRUCTURADO = "plan_estructurado"
    const val INTENTO_RECIENTE = "intento_reciente"
    const val AUTOLESION = "autolesion"
    const val ABUSO = "abuso"
    const val PELIGRO_INMEDIATO = "peligro_inmediato"

    // --- Criterios de AMARILLO (PR-001 §4.3) ---
    const val VIOLENCIA_NO_INMEDIATA = "violencia_no_inmediata"
    const val DETERIORO_ESCOLAR = "deterioro_escolar"
    const val AISLAMIENTO_PERSISTENTE = "aislamiento_persistente"

    val all: Set<String> = setOf(
        IDEACION_ACTIVA, PLAN_ESTRUCTURADO, INTENTO_RECIENTE, AUTOLESION, ABUSO, PELIGRO_INMEDIATO,
        VIOLENCIA_NO_INMEDIATA, DETERIORO_ESCOLAR, AISLAMIENTO_PERSISTENTE,
    )

    /**
     * Motivos que **el APK no puede producir hoy**, y por qué. Es una constante y no
     * un comentario para que la carencia sea visible en el código y comprobable en
     * una prueba (ver `AttentionRulesetTest`).
     *
     * Los cuatro son criterios de rojo de `PR-001` §4.3. Ni el chequeo contextual
     * (`TASK-004`, brief §9) ni las señales preguntan por ellos, así que **no hay
     * ninguna fuente**: un joven puede escribir «quiero morir» en la conversación y
     * el APK no lo detecta, porque nada lee texto libre (guardrail #3).
     *
     * `SELF_HARM` sí llega por señal — pero nadie emite esa señal hoy.
     */
    val unreachableFromApk: Set<String> = setOf(
        IDEACION_ACTIVA,
        PLAN_ESTRUCTURADO,
        INTENTO_RECIENTE,
    )
}

/**
 * Correspondencia señal canónica → motivo.
 *
 * Solo las señales que **son** un criterio de `PR-001` §4.3 tienen motivo. Las demás
 * (sueño, ansiedad, consumo) **acumulan** sin ser motivo por sí solas: el brief §10
 * habla de «acumulación de señales», no de que una sola baste.
 *
 * Nota de producto: `PR-003` §4.2 **no tiene clave para acoso**, aunque el brief hace
 * del bullying el caso central. El acoso se mapea a `violencia_no_inmediata`, que es
 * lo más cercano en `PR-001` §4.2. Es una decisión de mapeo, no un hecho del contrato.
 */
internal val signalToMotivo: Map<String, String> = mapOf(
    SignalCatalog.ISOLATION to MotivoCatalog.AISLAMIENTO_PERSISTENTE,
    SignalCatalog.SCHOOL_IMPACT to MotivoCatalog.DETERIORO_ESCOLAR,
    SignalCatalog.PHYSICAL_VIOLENCE to MotivoCatalog.ABUSO,
    SignalCatalog.SELF_HARM to MotivoCatalog.AUTOLESION,
)

/** Motivos que, por sí solos, fuerzan prioridad **roja** (`PR-001` §4.3). */
internal val redMotivos: Set<String> = setOf(
    MotivoCatalog.IDEACION_ACTIVA,
    MotivoCatalog.PLAN_ESTRUCTURADO,
    MotivoCatalog.INTENTO_RECIENTE,
    MotivoCatalog.AUTOLESION,
    MotivoCatalog.ABUSO,
    MotivoCatalog.PELIGRO_INMEDIATO,
)
