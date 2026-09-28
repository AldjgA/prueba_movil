package bo.puentejoven.app.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import bo.puentejoven.core.navigation.AppDestination
import bo.puentejoven.core.navigation.AppNavigator
import bo.puentejoven.core.navigation.AttentionRoute
import bo.puentejoven.core.navigation.ConsentRoute
import bo.puentejoven.core.navigation.ContextCheckRoute
import bo.puentejoven.core.navigation.ConversationRoute
import bo.puentejoven.core.navigation.EntryRoute
import bo.puentejoven.core.navigation.HomeRoute
import bo.puentejoven.core.navigation.JourneyRoute
import bo.puentejoven.core.navigation.LoginRoute
import bo.puentejoven.core.navigation.OnboardingRoute
import bo.puentejoven.core.navigation.PersonalReportRoute
import bo.puentejoven.core.navigation.ProfileRoute
import bo.puentejoven.core.navigation.SignalsRoute
import bo.puentejoven.core.navigation.SituationMapRoute
import bo.puentejoven.core.navigation.SummaryReviewRoute
import bo.puentejoven.core.navigation.SupportRequestStatusRoute
import bo.puentejoven.core.navigation.ToolDetailRoute
import bo.puentejoven.core.navigation.ToolsRoute
import bo.puentejoven.feature.auth.entry.EntryRoute as EntryScreenRoute
import bo.puentejoven.feature.auth.login.LoginRoute as LoginScreenRoute
import bo.puentejoven.feature.onboarding.OnboardingRoute as OnboardingScreenRoute
import bo.puentejoven.feature.home.HomeRoute as HomeScreenRoute

/**
 * Grafo de navegación del joven.
 *
 * Usa rutas TIPADAS (`@Serializable` en `:core:navigation`): no hay strings sueltos
 * de navegación en ninguna parte del proyecto.
 *
 * Guardrail #6: el grafo NO contiene ningún destino de panel profesional.
 * Todos los destinos existen aquí, pero los que pertenecen a tareas posteriores
 * (TASK-003 a TASK-007) se montan sobre el placeholder compartido hasta que esas
 * features se implementen: así la navegación ya es completa y verificable.
 *
 * @param navController controlador de Navigation Compose.
 */
@Composable
fun PuenteJovenNavHost(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
) {
    val navigator: AppNavigator = remember(navController) {
        NavControllerAppNavigator(navController)
    }

    NavHost(
        navController = navController,
        startDestination = EntryRoute,
        modifier = modifier,
    ) {
        // --- Entry -> Login -> Onboarding -> Home (el camino crítico del MVP) ---
        composable<EntryRoute> {
            EntryScreenRoute(navigator = navigator)
        }

        composable<LoginRoute> {
            LoginScreenRoute(navigator = navigator)
        }

        composable<OnboardingRoute> {
            OnboardingScreenRoute(navigator = navigator)
        }

        composable<HomeRoute> {
            HomeScreenRoute(navigator = navigator)
        }

        // --- Resto del grafo joven (placeholders hasta sus tareas) ---
        composable<ConversationRoute> {
            DestinationPlaceholder(
                destination = ConversationRoute,
                title = "Contarlo",
                note = "Conversación estructurada y privada. Se implementa en TASK-004.",
                navigator = navigator,
            )
        }

        composable<ContextCheckRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<ContextCheckRoute>()
            DestinationPlaceholder(
                destination = route,
                title = "Chequeo contextual",
                note = "Preguntas guiadas por reglas. Se implementa en TASK-004.",
                navigator = navigator,
            )
        }

        composable<SignalsRoute> {
            DestinationPlaceholder(
                destination = SignalsRoute,
                title = "Señales",
                note = "Señales detectadas con su evidencia. Se implementa en TASK-005.",
                navigator = navigator,
            )
        }

        composable<SituationMapRoute> {
            DestinationPlaceholder(
                destination = SituationMapRoute,
                title = "Mapa de situación",
                note = "Constelación de nodos de la situación. Se implementa en TASK-005.",
                navigator = navigator,
            )
        }

        composable<AttentionRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<AttentionRoute>()
            DestinationPlaceholder(
                destination = route,
                title = "Prioridad preliminar de revisión",
                note = "Nunca un diagnóstico. Se implementa en TASK-005.",
                navigator = navigator,
            )
        }

        composable<ToolsRoute> {
            DestinationPlaceholder(
                destination = ToolsRoute,
                title = "Herramientas breves",
                note = "Respirar, escribir, escuchar. Se implementa en TASK-006.",
                navigator = navigator,
            )
        }

        composable<ToolDetailRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<ToolDetailRoute>()
            DestinationPlaceholder(
                destination = route,
                title = "Herramienta",
                note = "Detalle de la herramienta «${route.toolKey}». Se implementa en TASK-006.",
                navigator = navigator,
            )
        }

        composable<PersonalReportRoute> {
            DestinationPlaceholder(
                destination = PersonalReportRoute,
                title = "Reporte personal",
                note = "Lo que tú ves sobre ti. Se implementa en TASK-006.",
                navigator = navigator,
            )
        }

        composable<JourneyRoute> {
            DestinationPlaceholder(
                destination = JourneyRoute,
                title = "Recorrido",
                note = "Lo que ha ido cambiando en el tiempo. Se implementa en TASK-006.",
                navigator = navigator,
            )
        }

        composable<SummaryReviewRoute> {
            DestinationPlaceholder(
                destination = SummaryReviewRoute,
                title = "Revisar resumen",
                note = "Qué se comparte y qué no. Se implementa en TASK-007.",
                navigator = navigator,
            )
        }

        composable<ConsentRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<ConsentRoute>()
            DestinationPlaceholder(
                destination = route,
                title = "Tu consentimiento",
                note = "Sin autorización no se crea ninguna solicitud. Se implementa en TASK-007.",
                navigator = navigator,
            )
        }

        composable<SupportRequestStatusRoute> { backStackEntry ->
            val route = backStackEntry.toRoute<SupportRequestStatusRoute>()
            DestinationPlaceholder(
                destination = route,
                title = "Estado de tu solicitud",
                note = "Aquí solo ves el estado seguro de tu solicitud. Se implementa en TASK-007.",
                navigator = navigator,
            )
        }

        composable<ProfileRoute> {
            DestinationPlaceholder(
                destination = ProfileRoute,
                title = "Tu perfil",
                note = "Ajustes locales de alias y privacidad. Se implementa en TASK-003.",
                navigator = navigator,
            )
        }
    }
}

/**
 * Placeholder de destino todavía no implementado.
 *
 * Mantiene la navegación completa y verificable sin inventar UI de features que
 * pertenecen a otras tareas. Reutiliza el design system para no romper la estética.
 */
@Composable
private fun DestinationPlaceholder(
    destination: AppDestination,
    title: String,
    note: String,
    navigator: AppNavigator,
) {
    bo.puentejoven.core.designsystem.component.PlaceholderScreen(
        label = destination.javaClass.simpleName,
        title = title,
        note = note,
        onBack = { navigator.navigateBack() },
    )
}
