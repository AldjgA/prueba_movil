package bo.puentejoven.core.common

/**
 * Estados base que toda pantalla debe cubrir (guardrail de entrega):
 * loading, vacío, error y contenido.
 *
 * Se implementa como sealed interface para que un `when` exhaustivo obligue a la
 * UI a tratar todos los casos; así no se degrada en silencio un fallo ni se muestra
 * una pantalla vacía sin explicación.
 */
sealed interface FeatureUiState<out T> {

    /** Primera carga, sin contenido todavía. */
    data object Loading : FeatureUiState<Nothing>

    /** Contenido disponible. */
    data class Content<T>(val data: T) : FeatureUiState<T>

    /** No hay contenido porque todavía no existe (no es un error). */
    data class Empty(val messageResKey: String = "puente_empty_message") : FeatureUiState<Nothing>

    /** Falló la operación. `error` es presentable y sin datos sensibles. */
    data class Error(val error: UiError) : FeatureUiState<Nothing>
}

/** Dato de contenido si existe, o `null`. */
fun <T> FeatureUiState<T>.dataOrNull(): T? = (this as? FeatureUiState.Content)?.data

/** `true` mientras se está cargando. */
val FeatureUiState<*>.isLoading: Boolean get() = this is FeatureUiState.Loading

/** Convierte un [AppResult] en un [FeatureUiState], aplicando [isEmpty] al éxito. */
fun <T> AppResult<T>.toUiState(isEmpty: (T) -> Boolean = { false }): FeatureUiState<T> = when (this) {
    is AppResult.Success -> if (isEmpty(data)) {
        FeatureUiState.Empty()
    } else {
        FeatureUiState.Content(data)
    }

    is AppResult.Failure -> FeatureUiState.Error(error)
}
