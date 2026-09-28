package bo.puentejoven.core.model

/**
 * Alcance autorizable del resumen compartible.
 *
 * Es un `sealed interface`: un tipo de elemento NUEVO (p. ej. compartir un
 * `JourneyEntry`) obliga a una decisión explícita de producto y a registrar una
 * solicitud de cambio. Esto impide que un mapper o un DTO de borde amplíe los
 * datos autorizados "por accidente" (TASK-008 prueba de contrato).
 *
 * Invariante: `ConsentRecord.scope ⊆ ShareableSummary.scope`. Nunca puede
 * consentirse más de lo que el resumen contiene.
 */
sealed interface ShareScopeEntry {
    /** Clave estable del elemento dentro de su categoría. */
    val key: String

    data class Signal(override val key: String) : ShareScopeEntry
    data class Tool(override val key: String) : ShareScopeEntry
    data class Assessment(override val key: String) : ShareScopeEntry
}

/**
 * Nota libre del joven dentro del resumen, acotada y sin datos de terceros.
 * El límite evita que la nota se convierta en un canal para volcar el chat
 * completo, y el valor tipado impide pasar texto sin validar.
 *
 * La UI valida antes de construir el valor; el constructor también lo exige.
 */
@JvmInline
value class SummaryNote(val value: String) {
    init {
        require(value.length <= MAX_LENGTH) {
            "SummaryNote no puede superar $MAX_LENGTH caracteres"
        }
    }

    companion object {
        const val MAX_LENGTH = 500
    }
}
