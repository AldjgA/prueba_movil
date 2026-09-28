package bo.puentejoven.core.navigation

import kotlinx.serialization.Serializable

/**
 * Grafo de navegación **de la app Puente Joven**.
 *
 * Guardrail #6: Puente Red NO existe dentro de esta app. No hay ningún destino
 * que represente un panel profesional, dashboard oscuro o superficie equivalente.
 * Si esa necesidad aparece, se resuelve en el sistema web/tablet separado.
 *
 * Todos los destinos son tipos serializables: Navigation Compose los usa como rutas
 * tipadas y el resto del código no manipula strings de navegación.
 */
interface AppDestination

/** Pantalla de entrada / elección de acceso. Solo existe el acceso joven. */
@Serializable
data object EntryRoute : AppDestination

/**
 * Inicio de sesión local (alias / PIN).
 * No es autenticación remota: no hay backend todavía.
 */
@Serializable
data object LoginRoute : AppDestination

/** Onboarding de privacidad, encuadre y consentimiento inicial. */
@Serializable
data object OnboardingRoute : AppDestination

/** Inicio del joven. */
@Serializable
data object HomeRoute : AppDestination

/** Conversación estructurada (privada y localmente cifrada). */
@Serializable
data object ConversationRoute : AppDestination

/** Chequeo contextual guiado. */
@Serializable
data class ContextCheckRoute(val conversationId: String? = null) : AppDestination

/** Señales detectadas con su evidencia. */
@Serializable
data object SignalsRoute : AppDestination

/** Mapa de situación (constelación de nodos). */
@Serializable
data object SituationMapRoute : AppDestination

/**
 * Prioridad preliminar de revisión.
 * Nunca se presenta como diagnóstico ni como garantía de seguridad.
 */
@Serializable
data class AttentionRoute(val assessmentId: String? = null) : AppDestination

/** Herramientas breves. */
@Serializable
data object ToolsRoute : AppDestination

/** Detalle de una herramienta breve concreta. */
@Serializable
data class ToolDetailRoute(val toolKey: String) : AppDestination

/** Reporte personal. */
@Serializable
data object PersonalReportRoute : AppDestination

/** Recorrido longitudinal. */
@Serializable
data object JourneyRoute : AppDestination

/** Revisión del resumen compartible antes de autorizar. */
@Serializable
data object SummaryReviewRoute : AppDestination

/** Consentimiento explícito. */
@Serializable
data class ConsentRoute(val summaryId: String? = null) : AppDestination

/** Estado seguro de una solicitud de apoyo autorizada. */
@Serializable
data class SupportRequestStatusRoute(val requestId: String? = null) : AppDestination

/** Ajustes locales del joven. */
@Serializable
data object ProfileRoute : AppDestination
