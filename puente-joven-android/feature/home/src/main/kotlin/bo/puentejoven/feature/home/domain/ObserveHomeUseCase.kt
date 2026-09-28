package bo.puentejoven.feature.home.domain

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.Clock
import bo.puentejoven.core.data.repository.SignalsRepository
import bo.puentejoven.core.data.repository.ToolsRepository
import bo.puentejoven.core.data.repository.YouthRepository
import bo.puentejoven.core.model.BriefTool
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.YouthProfile
import javax.inject.Inject
import kotlinx.coroutines.flow.first

/** Datos que el Home necesita para pintarse. */
data class HomeSnapshot(
    val profile: YouthProfile,
    val signals: List<Signal>,
    val tools: List<BriefTool>,
)

/**
 * Caso de uso: reunir lo necesario para el Home.
 *
 * Concentra el acceso a datos para que el ViewModel no dependa de tres repositorios
 * y para que la futura capa remota no cambie la UI.
 */
class ObserveHomeUseCase @Inject constructor(
    private val youthRepository: YouthRepository,
    private val signalsRepository: SignalsRepository,
    private val toolsRepository: ToolsRepository,
    private val clock: Clock,
) {

    /** Carga el snapshot inicial del Home. */
    suspend operator fun invoke(): AppResult<HomeSnapshot> {
        val profile = when (val result = youthRepository.getProfile()) {
            is AppResult.Failure -> return result
            is AppResult.Success -> result.data
        }

        val tools = when (val result = toolsRepository.availableTools()) {
            is AppResult.Failure -> return result
            is AppResult.Success -> result.data
        }

        // Las señales son opcionales para pintar el Home: si no hay, se muestra el
        // estado vacío del bloque sin tumbar la pantalla completa.
        val signals = signalsRepository.observeSignals().firstOrEmpty()

        return AppResult.Success(
            HomeSnapshot(
                profile = profile,
                signals = signals,
                tools = tools,
            ),
        )
    }

    /**
     * Saludo según la hora del día, con el reloj inyectable
     * (fiel al MVP: antes de 12 "Buenos días", antes de 19 "Hola", si no "Buenas noches").
     */
    fun greeting(): String {
        val hour = epochHour()
        return when {
            hour < 12 -> "Buenos días"
            hour < 19 -> "Hola"
            else -> "Buenas noches"
        }
    }

    private fun epochHour(): Int {
        val zone = java.util.TimeZone.getDefault().toZoneId()
        val instant = java.time.Instant.ofEpochMilli(clock.nowEpochMillis())
        return java.time.ZonedDateTime.ofInstant(instant, zone).hour
    }

    private suspend fun kotlinx.coroutines.flow.Flow<List<Signal>>.firstOrEmpty(): List<Signal> =
        try {
            first()
        } catch (cancellation: kotlin.coroutines.cancellation.CancellationException) {
            throw cancellation
        } catch (throwable: Throwable) {
            emptyList()
        }
}
