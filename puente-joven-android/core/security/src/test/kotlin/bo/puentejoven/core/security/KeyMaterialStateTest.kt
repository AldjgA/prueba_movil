package bo.puentejoven.core.security

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * F6: la regla que distingue "primer arranque" de "clave perdida".
 *
 * Se prueba aquí, en JVM, porque es pura: Android Keystore no se puede ejercitar
 * en un test unitario, pero el defecto original estaba en esta decisión, no en
 * la llamada al Keystore.
 */
class KeyMaterialStateTest {

    @Test
    fun `con clave presente el material esta listo`() {
        assertEquals(
            KeyMaterialState.READY,
            keyMaterialState(
                aliasPresent = true,
                markerSaysThereWasAKey = true,
                createdInThisProcess = false,
            ),
        )
    }

    @Test
    fun `sin clave y sin marcador es un primer arranque`() {
        assertEquals(
            KeyMaterialState.FIRST_RUN,
            keyMaterialState(
                aliasPresent = false,
                markerSaysThereWasAKey = false,
                createdInThisProcess = false,
            ),
        )
    }

    @Test
    fun `sin clave pero con marcador la clave se perdio`() {
        assertEquals(
            "La clave existió y ya no está: NUNCA debe tratarse como primer arranque",
            KeyMaterialState.LOST,
            keyMaterialState(
                aliasPresent = false,
                markerSaysThereWasAKey = true,
                createdInThisProcess = false,
            ),
        )
    }

    @Test
    fun `clave creada y desaparecida en el mismo proceso tambien es perdida`() {
        assertEquals(
            KeyMaterialState.LOST,
            keyMaterialState(
                aliasPresent = false,
                markerSaysThereWasAKey = true,
                createdInThisProcess = true,
            ),
        )
    }

    @Test
    fun `sin marcador y sin clave creada en este proceso no se confunde con perdida`() {
        assertEquals(
            KeyMaterialState.FIRST_RUN,
            keyMaterialState(
                aliasPresent = false,
                markerSaysThereWasAKey = false,
                createdInThisProcess = true,
            ),
        )
    }
}
