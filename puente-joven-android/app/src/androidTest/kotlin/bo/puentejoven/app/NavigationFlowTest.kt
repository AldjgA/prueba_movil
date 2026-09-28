import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import bo.puentejoven.app.MainActivity
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Prueba de navegación del camino crítico del MVP:
 * Entry → Login → Onboarding → Home.
 *
 * También comprueba el criterio de aceptación 4: ninguna pantalla ofrece acceso a
 * una superficie profesional (Puente Red).
 *
 * Nota: requiere `platforms/` y `build-tools/` instalados en el SDK Android.
 */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class NavigationFlowTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun setUp() {
        hiltRule.inject()
    }

    @Test
    fun entryToLoginToOnboardingToHome() {
        // --- Entry ---
        composeRule.onNodeWithText("Entrar a Puente Joven").assertExists()

        // Guardrail #6: no debe existir ninguna referencia a un acceso profesional.
        composeRule.onNodeWithText("Entrar a Puente Red").assertDoesNotExist()
        composeRule.onNodeWithText("Puente Red").assertDoesNotExist()

        composeRule.onNodeWithText("Entrar a Puente Joven").performClick()

        // --- Login ---
        composeRule.onNodeWithText("Cómo quieres que te llame.").assertExists()

        composeRule.onNodeWithText("Por ejemplo: Alex").performTextInput("Alex")
        composeRule.onNodeWithText("4 dígitos").performTextInput("1234")
        composeRule.onNodeWithText("Entrar").performClick()

        // --- Onboarding ---
        composeRule.onNodeWithText("QUÉ ES PUENTE").assertExists()

        composeRule.onNodeWithText("Entiendo qué es Puente y qué no es.").performClick()
        composeRule.onNodeWithText("Continuar").performClick()

        composeRule.onNodeWithText("TU PRIVACIDAD").assertExists()
        composeRule.onNodeWithText("Entiendo cómo se guardan mis datos.").performClick()
        composeRule.onNodeWithText("Continuar").performClick()

        // --- Home ---
        composeRule.onNodeWithText("CÓMO FUNCIONA").assertExists()
        composeRule.onNodeWithText("Entrar a mi espacio").performClick()

        composeRule.onNodeWithText("¿Qué necesitas hoy?").assertExists()
        composeRule.onNodeWithText("ME ESTÁ PASANDO ALGO").assertExists()
    }
}
