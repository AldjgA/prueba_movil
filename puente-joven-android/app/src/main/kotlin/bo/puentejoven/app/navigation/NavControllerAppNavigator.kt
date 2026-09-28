package bo.puentejoven.app.navigation

import androidx.navigation.NavController
import bo.puentejoven.core.navigation.AppDestination

/**
 * Implementación de navegación sobre `NavController` de Navigation Compose.
 *
 * Es la ÚNICA clase del proyecto que conoce `NavController`: las features dependen
 * de la abstracción `AppNavigator` (en `:core:navigation`), de modo que no aparecen
 * strings de ruta sueltos ni acoplamiento a Navigation fuera de este punto.
 */
class NavControllerAppNavigator(
    private val navController: NavController,
) : bo.puentejoven.core.navigation.AppNavigator {

    override fun navigateTo(destination: AppDestination) {
        navController.navigate(destination)
    }

    override fun navigateBack(): Boolean {
        if (!navController.popBackStack()) return false
        return true
    }

    override fun navigateAndClearStack(
        destination: AppDestination,
        keepStartDestination: Boolean,
    ) {
        navController.navigate(destination) {
            popUpTo(navController.graph.id) {
                // Al limpiar la pila tras el login/onboarding, "atrás" no debe poder
                // volver a credenciales ni al onboarding.
                inclusive = true
                saveState = false
            }
            launchSingleTop = true
            if (keepStartDestination) {
                // Reservado: por ahora el grafo joven no necesita preservar el inicio,
                // porque Entry/Login/Onboarding no se reutilizan tras entrar.
            }
        }
    }
}
