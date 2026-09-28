package bo.puentejoven.feature.home

import bo.puentejoven.core.navigation.AppDestination

/** Efectos de un solo uso del Home: la Route decide cómo navegar. */
sealed interface HomeEffect {
    data class Navigate(val destination: AppDestination) : HomeEffect
}
