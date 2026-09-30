package bo.puentejoven.feature.signals.domain

import bo.puentejoven.core.data.repository.ContextCheckRepository
import bo.puentejoven.core.data.repository.SignalsRepository
import bo.puentejoven.core.model.Signal
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.scan

/**
 * Señales del joven junto con la prioridad que producen.
 *
 * Van juntas a propósito: mostrar señales sin su prioridad obligaría a la UI a
 * aplicar reglas, y aplicar reglas en la UI es cómo un umbral acaba duplicado.
 */
data class SignalsSnapshot(
    val signals: List<Signal>,
    val outcome: RuleOutcome,
)

/**
 * Caso de uso: observar las señales y recalcular la prioridad.
 *
 * **Dónde vive el cálculo.** En la feature, no en el repositorio: D4
 * (`REVISION-B-POR-A.md`) pide preferir la alternativa que **no** cambia el contrato
 * de `Repositories.kt`. Por eso no existe `SignalsRepository.assess(now)`: el motor
 * de reglas es de la feature y consume lo que el contrato ya ofrece.
 *
 * **Se recalcula, no se lee.** `SignalsRepository.getAttentionAssessment()` devuelve
 * hoy un fixture constante; este caso de uso lo sustituye por el cálculo real.
 * Declarado a A en `NECESIDADES.md`: ese método queda redundante.
 *
 * **La secuencia importa.** `scan` arrastra el nivel observado antes, porque D2 exige
 * que **un rojo no se degrade solo**. Sin esto, el motor sería puro pero el sistema no
 * cumpliría el invariante: bastaría con que el joven cambiara una respuesta para
 * apagar una alarma de la que ya se avisó.
 */
class ObserveSignalsUseCase @Inject constructor(
    private val signalsRepository: SignalsRepository,
    private val contextCheckRepository: ContextCheckRepository,
) {

    fun observe(): Flow<SignalsSnapshot> =
        combine(
            signalsRepository.observeSignals(),
            contextCheckRepository.observeResponses(),
        ) { signals, responses ->
            // El mapa toma la ÚLTIMA decisión por pregunta: si el joven responde dos
            // veces, vale lo más reciente, no la primera.
            val answers = responses.associate { it.questionKey.value to it.optionKey.value }

            signals to AttentionRuleset.evaluate(answers = answers, signals = signals)
        }
            .scan<Pair<List<Signal>, RuleOutcome>, SignalsSnapshot?>(null) { previous, (signals, computed) ->
                SignalsSnapshot(
                    signals = signals,
                    outcome = AttentionRuleset.enforceNoDegrade(
                        computed = computed,
                        previousLevel = previous?.outcome?.level,
                    ),
                )
            }
            .filterNotNull()
}
