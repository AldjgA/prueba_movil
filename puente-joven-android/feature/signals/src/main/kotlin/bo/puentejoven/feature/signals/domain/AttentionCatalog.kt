package bo.puentejoven.feature.signals.domain

import bo.puentejoven.core.model.MotivoCatalog

/**
 * Catálogo de claves de señal — `PR-003` §4.1 — y su correspondencia con los motivos.
 *
 * **Lo que NO está aquí:** el catálogo de `motivo` (vive en `:core:model`,
 * `MotivoCatalog`) ni el de preguntas del chequeo (vive en `:core:model`,
 * `CheckCatalog`). Antes este fichero duplicaba el de motivos; la duplicación era
 * exactamente el problema que `REVISION-C-POR-B.md` K1 detectó y que A resolvió
 * publicando los catálogos en `:core:model`.
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
     * probada.
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
 * Correspondencia señal canónica → motivo.
 *
 * Solo las señales que **son** un criterio de `PR-001` §4.3 tienen motivo. Las demás
 * (sueño, ansiedad, consumo) **acumulan** sin ser motivo por sí solas: el brief §10
 * habla de «acumulación de señales», no de que una sola baste.
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
