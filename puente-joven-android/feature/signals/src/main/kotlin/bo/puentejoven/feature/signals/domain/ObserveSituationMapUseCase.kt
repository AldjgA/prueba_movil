package bo.puentejoven.feature.signals.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.data.repository.SignalsRepository
import bo.puentejoven.core.model.SituationMap
import javax.inject.Inject
import kotlinx.coroutines.flow.first

/** Caso de uso: el mapa de situación del joven (brief §12). */
class ObserveSituationMapUseCase @Inject constructor(
    private val signalsRepository: SignalsRepository,
) {

    suspend operator fun invoke(): AppResult<SituationMap> =
        AppResult.catching { signalsRepository.observeSituationMap().first() }
}
