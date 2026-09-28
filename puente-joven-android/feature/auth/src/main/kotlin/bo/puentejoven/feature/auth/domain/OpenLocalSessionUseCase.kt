package bo.puentejoven.feature.auth.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.data.repository.YouthRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.PinPolicy
import javax.inject.Inject

/**
 * Abre la sesión local del joven: crea el perfil la primera vez y, en adelante,
 * valida el PIN para volver a entrar.
 *
 * No hay autenticación remota: no se envía nada a ningún servidor. Cuando exista
 * backend, este caso de uso seguirá igual y solo cambiará la implementación de
 * [YouthRepository].
 *
 * Seguridad (TASK-003):
 * - El PIN se valida contra un derivado con sal; nunca se compara ni se guarda
 *   en claro.
 * - Los errores son genéricos: no revelan si el alias existe ni qué falló.
 */
class OpenLocalSessionUseCase @Inject constructor(
    private val youthRepository: YouthRepository,
) {

    /**
     * @param alias nombre visible elegido por el joven (no su nombre legal).
     * @param ageBand banda de edad (nunca edad exacta).
     * @param pin PIN local; se valida su forma antes de tocar el repositorio.
     */
    suspend operator fun invoke(
        alias: String,
        ageBand: AgeBand,
        pin: String,
    ): AppResult<Unit> {
        val trimmed = alias.trim()
        if (trimmed.isEmpty()) {
            return AppResult.Failure(UiError.Validation(technical = "alias blank"))
        }
        if (!PinPolicy.isWellFormed(pin)) {
            return AppResult.Failure(UiError.Validation(technical = "pin malformed"))
        }

        if (youthRepository.isPinConfigured()) {
            val existing = youthRepository.getProfile()
            if (existing is AppResult.Success &&
                !existing.data.alias.value.equals(trimmed, ignoreCase = true)
            ) {
                // No se dice "ese alias no existe": basta un mensaje de validación.
                return AppResult.Failure(UiError.Validation(technical = "alias mismatch"))
            }
            return youthRepository.unlockSession(pin)
        }

        return when (val created = youthRepository.createProfile(trimmed, ageBand, pin)) {
            is AppResult.Failure -> created
            is AppResult.Success -> youthRepository.unlockSession(pin)
        }
    }
}
