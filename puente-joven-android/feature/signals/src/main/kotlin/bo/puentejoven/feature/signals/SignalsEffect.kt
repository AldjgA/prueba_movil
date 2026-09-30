package bo.puentejoven.feature.signals

import bo.puentejoven.core.navigation.AppDestination

/** Efectos de un solo uso: la Route decide cómo navegar. */
sealed interface SignalsEffect {
    data class Navigate(val destination: AppDestination) : SignalsEffect
}
