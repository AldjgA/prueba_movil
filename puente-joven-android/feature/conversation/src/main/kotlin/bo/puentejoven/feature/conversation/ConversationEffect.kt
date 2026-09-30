package bo.puentejoven.feature.conversation

import bo.puentejoven.core.navigation.AppDestination

/** Efectos de un solo uso: la Route decide cómo navegar. */
sealed interface ConversationEffect {
    data class Navigate(val destination: AppDestination) : ConversationEffect
}
