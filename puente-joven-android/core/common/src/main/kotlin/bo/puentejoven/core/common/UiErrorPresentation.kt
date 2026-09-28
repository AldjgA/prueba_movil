package bo.puentejoven.core.common

/**
 * Reacción de UI recomendada para cada familia de error. Evita que cada feature
 * invente su política de retry/CTA y garantiza tratamiento consistente de
 * fuente local y remota (TASK-008 criterio #1 y #2).
 */
data class UiErrorPresentation(
    /** `true` si tiene sentido ofrecer "Reintentar". */
    val retryable: Boolean,
    /** `true` si la pantalla debe mostrar el estado degradado/offline. */
    val offlineLike: Boolean,
    /** `true` si la UI debe forzar volver a inicio de sesión local. */
    val requiresReauth: Boolean,
)

fun UiError.presentation(): UiErrorPresentation = when (this) {
    is UiError.Network -> UiErrorPresentation(retryable = true, offlineLike = true, requiresReauth = false)
    is UiError.Server -> UiErrorPresentation(retryable = true, offlineLike = false, requiresReauth = false)
    is UiError.RateLimited -> UiErrorPresentation(retryable = true, offlineLike = false, requiresReauth = false)
    is UiError.Conflict -> UiErrorPresentation(retryable = true, offlineLike = false, requiresReauth = false)
    is UiError.Authentication -> UiErrorPresentation(retryable = false, offlineLike = false, requiresReauth = true)
    is UiError.Authorization -> UiErrorPresentation(retryable = false, offlineLike = false, requiresReauth = false)
    is UiError.Validation -> UiErrorPresentation(retryable = false, offlineLike = false, requiresReauth = false)
    is UiError.NotFound -> UiErrorPresentation(retryable = false, offlineLike = false, requiresReauth = false)
    // Backend sin configurar NO es reintentable: es una precondición de despliegue.
    is UiError.BackendNotConfigured -> UiErrorPresentation(retryable = false, offlineLike = false, requiresReauth = false)
    is UiError.Unexpected -> UiErrorPresentation(retryable = true, offlineLike = false, requiresReauth = false)
}
