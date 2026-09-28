package bo.puentejoven.core.security

import javax.inject.Inject

/**
 * Desbloqueo biométrico: COMODIDAD OPCIONAL, nunca un sustituto del PIN ni del
 * consentimiento (TASK-003, "Seguridad obligatoria").
 *
 * El MVP lo expone pero NO lo activa: `androidx.biometric` no forma parte del
 * conjunto de dependencias aprobadas todavía y, sobre todo, la biometría no puede
 * ser la única puerta de una conversación privada de una persona adolescente.
 * Cuando se apruebe, basta con inyectar otra implementación en el módulo de Hilt:
 * ninguna pantalla ni caso de uso cambia.
 */
interface BiometricUnlock {

    /** `true` si el dispositivo ofrece biometría utilizable ahora mismo. */
    val isAvailable: Boolean

    /** `true` si el joven activó la biometría como atajo. */
    suspend fun isEnabled(): Boolean

    /** Activa/desactiva el atajo. No hace nada si [isAvailable] es `false`. */
    suspend fun setEnabled(enabled: Boolean)
}

/**
 * Implementación neutra: biometría no disponible.
 *
 * Degradación explícita y honesta: la UI informa de que la opción no está
 * disponible en lugar de mostrar un interruptor que no funciona.
 */
class UnavailableBiometricUnlock @Inject constructor() : BiometricUnlock {

    override val isAvailable: Boolean = false

    override suspend fun isEnabled(): Boolean = false

    override suspend fun setEnabled(enabled: Boolean) = Unit
}
