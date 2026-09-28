package bo.puentejoven.core.model

/**
 * Política del PIN local. FUENTE ÚNICA DE VERDAD de su longitud.
 *
 * De aquí leen `LoginUiState`, `LoginViewModel` y `OpenLocalSessionUseCase`.
 * Cambiar [LENGTH] es el único paso necesario para ajustar el PIN: no hay
 * literales de longitud repartidos por la app.
 *
 * CONFLICTO DOCUMENTADO (pendiente de confirmación humana):
 * - `TASK-003_SESION_PRIVADA_Y_DATOS_LOCALES.md` especifica "PIN de seis dígitos".
 * - La referencia visual del MVP web usa 4 (`pin.length === 4` en `JovenLoginScreen`).
 *
 * Se aplica 6 por seguir la especificación normativa, que además es la opción más
 * conservadora para un PIN que protege conversación privada. Si manda la fidelidad
 * con la maqueta, basta con poner [LENGTH] = 4 aquí: nada más cambia.
 *
 * El PIN es LOCAL: no viaja a ningún servidor, no es una contraseña remota y no
 * sustituye consentimiento (guardrail: biometría y PIN son comodidad/acceso).
 */
object PinPolicy {

    const val LENGTH = 6

    /** `true` cuando el PIN tiene la longitud exacta y solo dígitos. */
    fun isWellFormed(pin: String): Boolean =
        pin.length == LENGTH && pin.all { it.isDigit() }

    /** Descarta cualquier carácter no numérico y recorta al largo permitido. */
    fun sanitize(raw: String): String = raw.filter { it.isDigit() }.take(LENGTH)
}
