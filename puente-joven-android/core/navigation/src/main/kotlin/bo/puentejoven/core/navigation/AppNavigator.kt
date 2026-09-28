package bo.puentejoven.core.navigation

/**
 * Contrato de navegación expuesto a las features.
 *
 * Las features NO reciben el `NavController` directamente: dependen de esta
 * abstracción, lo que mantiene los módulos de feature desacoplados del grafo
 * y permite testear la navegación sin instrumentación de Android.
 */
interface AppNavigator {

    /** Avanza hacia [destination]. */
    fun navigateTo(destination: AppDestination)

    /** Vuelve a la pantalla anterior. Devuelve `false` si no había historial. */
    fun navigateBack(): Boolean

    /**
     * Navega limpiando la pila anterior.
     * Se usa tras el login/onboarding para que "atrás" no vuelva a credenciales.
     */
    fun navigateAndClearStack(destination: AppDestination, keepStartDestination: Boolean = true)
}
