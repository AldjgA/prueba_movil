package bo.puentejoven.feature.auth.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.data.repository.YouthRepository
import javax.inject.Inject

/**
 * Cierra la sesión local.
 *
 * IMPORTANTE: cerrar sesión NO borra el contenido del joven. El PIN sigue
 * configurado, así que se puede volver a entrar con los mismos datos locales
 * (criterio de aceptación #1 de TASK-003). Para destruir el contenido existe
 * `RetentionRepository.deleteAllLocalContent()`.
 */
class CloseSessionUseCase @Inject constructor(
    private val youthRepository: YouthRepository,
) {
    suspend operator fun invoke(): AppResult<Unit> = youthRepository.lockSession()
}
