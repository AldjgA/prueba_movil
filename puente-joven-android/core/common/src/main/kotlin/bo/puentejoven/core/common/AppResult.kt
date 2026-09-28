package bo.puentejoven.core.common

/**
 * Resultado explícito de una operación de dominio o datos.
 *
 * Se prefiere sobre excepciones para que las capas de UI/casos de uso deban
 * manejar el fallo de forma visible (guardrail: nunca degradar en silencio).
 */
sealed interface AppResult<out T> {

    data class Success<T>(val data: T) : AppResult<T>

    data class Failure(val error: UiError) : AppResult<Nothing>

    val isSuccess: Boolean get() = this is Success

    companion object {
        inline fun <T> catching(block: () -> T): AppResult<T> =
            try {
                Success(block())
            } catch (cancellation: kotlin.coroutines.cancellation.CancellationException) {
                throw cancellation
            } catch (throwable: Throwable) {
                Failure(
                    UiError.Unexpected(
                        technical = throwable.message,
                        cause = throwable::class.simpleName,
                    ),
                )
            }
    }
}

/** Transforma el valor de éxito conservando el fallo. */
inline fun <T, R> AppResult<T>.map(transform: (T) -> R): AppResult<R> = when (this) {
    is AppResult.Success -> AppResult.Success(transform(data))
    is AppResult.Failure -> this
}

/** Devuelve el dato o `null` si falló. */
fun <T> AppResult<T>.getOrNull(): T? = (this as? AppResult.Success)?.data

/** Devuelve el error o `null` si fue exitoso. */
fun <T> AppResult<T>.errorOrNull(): UiError? = (this as? AppResult.Failure)?.error
