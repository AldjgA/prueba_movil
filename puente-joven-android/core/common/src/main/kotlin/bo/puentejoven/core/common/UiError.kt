package bo.puentejoven.core.common

/**
 * Error presentable en UI.
 *
 * Reglas de privacidad (guardrail: nada de datos sensibles en logs/errores):
 * - `messageResKey` es una clave de recurso, nunca texto con datos personales.
 * - `technical` solo debe usarse en modo debug y no puede contener contenido del joven.
 *
 * Taxonomía alineada con Plan §6.4 (autenticación, autorización, validación,
 * conflicto, no encontrado, límite, red, servidor) + `BackendNotConfigured`
 * de TASK-008 criterio #7. Los subtipos son la frontera de contrato: los
 * adaptadores remotos DEBEN mapear sus errores a alguno de estos, y la UI
 * DEBE reaccionar de forma distinta a cada uno.
 */
sealed interface UiError {

    /** Clave de recurso para el mensaje mostrado al usuario. */
    val messageResKey: String

    /** Mensaje técnico opcional. Nunca datos personales ni del chat. */
    val technical: String?

    val cause: String?

    /** No se encontró el recurso solicitado. */
    data class NotFound(
        override val messageResKey: String = "error_not_found",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /** Datos inválidos aportados por el usuario o el formulario. */
    data class Validation(
        override val messageResKey: String = "error_validation",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /** No hay identidad válida: requiere iniciar sesión de nuevo. */
    data class Authentication(
        override val messageResKey: String = "error_authentication",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /**
     * Hay identidad, pero no permiso para esta acción/alcance.
     * Se usa, por ejemplo, cuando falta consentimiento explícito para crear
     * una solicitud de apoyo o para ampliar el scope compartido.
     */
    data class Authorization(
        override val messageResKey: String = "error_authorization",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /**
     * El estado cambió desde que se leyó (p. ej. caso ya tomado, versión de
     * resumen desactualizada). La UI debe recargar y ofrecer reintentar.
     */
    data class Conflict(
        override val messageResKey: String = "error_conflict",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /** Sin conectividad o tiempo de espera agotado. Estado degradado, no fatal. */
    data class Network(
        override val messageResKey: String = "error_network",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /** Límite de uso alcanzado (rate limit). La UI sugiere esperar. */
    data class RateLimited(
        override val messageResKey: String = "error_rate_limited",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /** Fallo del servidor. Reintentable, sin exponer detalles internos. */
    data class Server(
        override val messageResKey: String = "error_server",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /**
     * La fuente remota no está configurada/aprobada todavía (TASK-008 #7).
     * No es un fallo de red: significa que el binding local sigue siendo el activo.
     */
    data class BackendNotConfigured(
        override val messageResKey: String = "error_backend_not_configured",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError

    /** Cualquier otra cosa no clasificada. */
    data class Unexpected(
        override val messageResKey: String = "error_unexpected",
        override val technical: String? = null,
        override val cause: String? = null,
    ) : UiError
}
