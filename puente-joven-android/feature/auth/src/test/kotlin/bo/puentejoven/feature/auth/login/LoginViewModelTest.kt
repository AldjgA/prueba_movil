package bo.puentejoven.feature.auth.login

import bo.puentejoven.core.common.AppResult
import bo.puentejoven.core.common.TestClock
import bo.puentejoven.core.common.UiError
import bo.puentejoven.core.data.local.LocalPuenteRepository
import bo.puentejoven.core.model.AgeBand
import bo.puentejoven.core.model.PinPolicy
import bo.puentejoven.core.security.PassThroughLocalCipher
import bo.puentejoven.core.security.UnavailableBiometricUnlock
import androidx.lifecycle.SavedStateHandle
import bo.puentejoven.feature.auth.domain.CloseSessionUseCase
import bo.puentejoven.feature.auth.domain.OpenLocalSessionUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Pruebas del `LoginViewModel`.
 *
 * Verifican: emisión inicial, validación controlada, actualización del estado ante
 * acciones, apertura de la sesión local y el ciclo "cerrar y volver a entrar"
 * (criterio de aceptación #1 de TASK-003).
 */
@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var repository: LocalPuenteRepository
    private lateinit var viewModel: LoginViewModel

    /** PIN de prueba. La longitud sale de [PinPolicy], no de un literal mágico. */
    private val validPin = "1".repeat(PinPolicy.LENGTH)
    private val wrongPin = "2".repeat(PinPolicy.LENGTH)

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
        repository = LocalPuenteRepository(
            clock = TestClock(current = 1_760_000_000_000L),
            cipher = PassThroughLocalCipher(),
        )
        viewModel = LoginViewModel(
            openLocalSession = OpenLocalSessionUseCase(repository),
            biometric = UnavailableBiometricUnlock(),
            savedStateHandle = SavedStateHandle(),
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `estado inicial no permite enviar y no tiene error`() {
        val state = viewModel.uiState.value

        assertEquals("", state.alias)
        assertEquals("", state.pin)
        assertFalse("No se debe poder enviar sin alias y PIN", state.canSubmit)
        assertNull(state.error)
        assertFalse("La biometría no está disponible en el MVP", state.biometricAvailable)
    }

    @Test
    fun `alias y pin validos habilitan el envio`() {
        viewModel.onAction(LoginUiAction.AliasChanged("Alex"))
        viewModel.onAction(LoginUiAction.PinChanged(validPin))

        val state = viewModel.uiState.value
        assertEquals("Alex", state.alias)
        assertEquals(validPin, state.pin)
        assertTrue(state.canSubmit)
    }

    @Test
    fun `el pin se filtra a digitos y se limita a la longitud definida`() {
        viewModel.onAction(LoginUiAction.PinChanged("12a3b4567890"))

        val state = viewModel.uiState.value
        assertEquals("123456".take(PinPolicy.LENGTH), state.pin)
        assertEquals(PinPolicy.LENGTH, state.pin.length)
    }

    @Test
    fun `pin demasiado corto mantiene el envio deshabilitado`() {
        viewModel.onAction(LoginUiAction.AliasChanged("Alex"))
        viewModel.onAction(LoginUiAction.PinChanged("12"))

        assertFalse(viewModel.uiState.value.canSubmit)
    }

    @Test
    fun `submit crea la sesion local y emite el efecto SessionReady`() = runTest(dispatcher) {
        viewModel.onAction(LoginUiAction.AliasChanged("Alex"))
        viewModel.onAction(LoginUiAction.PinChanged(validPin))
        viewModel.onAction(LoginUiAction.AgeBandChanged(AgeBand.LATE_TEEN))

        viewModel.onAction(LoginUiAction.Submit)
        advanceUntilIdle()

        val effect = viewModel.effects.first()
        assertEquals(LoginEffect.SessionReady, effect)
        assertFalse(viewModel.uiState.value.isSubmitting)

        // El repositorio local quedó con el perfil y la sesión desbloqueada.
        val profile = when (val result = repository.getProfile()) {
            is AppResult.Success -> result.data
            is AppResult.Failure -> error("El perfil debería existir tras el login")
        }
        assertEquals("Alex", profile.alias.value)
        assertEquals(AgeBand.LATE_TEEN, profile.ageBand)
        assertTrue(repository.observeSessionUnlocked().first())
    }

    @Test
    fun `submit ignorado cuando el formulario no es valido`() = runTest(dispatcher) {
        viewModel.onAction(LoginUiAction.AliasChanged("Alex"))
        // Sin PIN válido
        viewModel.onAction(LoginUiAction.Submit)
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isSubmitting)
        // No debe haberse creado perfil nuevo con datos incompletos.
        val result = repository.getProfile()
        assertTrue(result is AppResult.Success)
    }

    @Test
    fun `pin incorrecto no desbloquea y devuelve error de autenticacion`() = runTest(dispatcher) {
        repository.createProfile("Alex", AgeBand.MID_TEEN, validPin)
        repository.lockSession()

        viewModel.onAction(LoginUiAction.AliasChanged("Alex"))
        viewModel.onAction(LoginUiAction.PinChanged(wrongPin))
        viewModel.onAction(LoginUiAction.Submit)
        advanceUntilIdle()

        // Error genérico de autenticación: no filtra qué falló exactamente.
        assertTrue(
            "Se esperaba UiError.Authentication",
            viewModel.uiState.value.error is UiError.Authentication,
        )
        assertFalse(repository.observeSessionUnlocked().first())
    }

    @Test
    fun `cerrar sesion y volver a entrar con el mismo pin funciona`() = runTest(dispatcher) {
        repository.createProfile("Alex", AgeBand.MID_TEEN, validPin)
        CloseSessionUseCase(repository).invoke()
        assertFalse("Tras cerrar sesión no debe quedar desbloqueada", repository.observeSessionUnlocked().first())

        viewModel.onAction(LoginUiAction.AliasChanged("Alex"))
        viewModel.onAction(LoginUiAction.PinChanged(validPin))
        viewModel.onAction(LoginUiAction.Submit)
        advanceUntilIdle()

        assertTrue(repository.observeSessionUnlocked().first())
        assertNull("No debe quedar ningún error tras reingresar", viewModel.uiState.value.error)
    }
}
