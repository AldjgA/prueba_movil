package bo.puentejoven.core.common

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers

/**
 * Provee los dispatchers de corrutinas, de modo que los ViewModels y repositorios
 * puedan testearse sin depender de `Dispatchers.Main`.
 */
interface DispatcherProvider {
    val main: CoroutineDispatcher
    val io: CoroutineDispatcher
    val default: CoroutineDispatcher
}

/** Implementación de producción. */
class DefaultDispatcherProvider : DispatcherProvider {
    override val main: CoroutineDispatcher = Dispatchers.Main
    override val io: CoroutineDispatcher = Dispatchers.IO
    override val default: CoroutineDispatcher = Dispatchers.Default
}

/**
 * Implementación para pruebas: todos los dispatchers apuntan a un mismo
 * `TestDispatcher`, evitando saltos de hilo en los tests.
 */
class TestDispatcherProvider(
    override val main: CoroutineDispatcher,
    override val io: CoroutineDispatcher = main,
    override val default: CoroutineDispatcher = main,
) : DispatcherProvider
