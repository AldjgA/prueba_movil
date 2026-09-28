package bo.puentejoven.core.common

/**
 * Fuente de tiempo inyectable. Permite pruebas deterministas del recorrido,
 * los registros y los timestamps de conversación.
 */
interface Clock {
    fun nowEpochMillis(): Long
}

/** Implementación de producción: delega en el reloj del sistema. */
class SystemClock : Clock {
    override fun nowEpochMillis(): Long = System.currentTimeMillis()
}

/**
 * Reloj fijo para pruebas. Avanza solo cuando se le pide explícitamente.
 */
class TestClock(private var current: Long = 0L) : Clock {
    override fun nowEpochMillis(): Long = current

    fun advanceBy(millis: Long) {
        current += millis
    }

    fun set(millis: Long) {
        current = millis
    }
}
