package bo.puentejoven.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * El catálogo del chequeo es la **única** fuente del vocabulario (`PR-003` §4.3).
 *
 * Estas pruebas protegen lo que se rompe **en silencio**: una clave que desaparece no
 * da error, simplemente hace que una regla deje de dispararse.
 */
class CheckCatalogTest {

    @Test
    fun `cada pregunta tiene opciones`() {
        for (clave in CheckCatalog.questionKeys) {
            assertTrue(
                "La pregunta $clave no tiene opciones: sería irrespondible",
                CheckCatalog.optionsFor(clave).isNotEmpty(),
            )
        }
    }

    @Test
    fun `no hay claves de pregunta duplicadas`() {
        assertEquals(
            "Hay claves de pregunta repetidas",
            CheckCatalog.questionKeys.size,
            CheckCatalog.questionKeys.toSet().size,
        )
    }

    @Test
    fun `no hay opciones duplicadas dentro de una pregunta`() {
        for (clave in CheckCatalog.questionKeys) {
            val opciones = CheckCatalog.optionsFor(clave)
            assertEquals(
                "Opciones duplicadas en $clave",
                opciones.size,
                opciones.toSet().size,
            )
        }
    }

    @Test
    fun `safety existe y se responde con si o no`() {
        assertTrue(
            "La pregunta crítica debe existir: es la que puede elevar a rojo por sí sola",
            CheckCatalog.isKnownQuestion(CheckCatalog.SAFETY),
        )
        assertTrue(CheckCatalog.isKnownOption(CheckCatalog.SAFETY, "yes"))
        assertTrue(CheckCatalog.isKnownOption(CheckCatalog.SAFETY, "no"))
    }

    @Test
    fun `el catalogo de motivo incluye acumulacion y acoso`() {
        assertTrue(
            "Sin 'acumulacion', un amarillo por acumulación viajaría con motivo vacío",
            MotivoCatalog.isKnown("acumulacion"),
        )
        assertTrue(
            "'acoso' es el caso central del brief: no puede faltar",
            MotivoCatalog.isKnown("acoso"),
        )
    }

    @Test
    fun `una clave desconocida no se acepta como valida`() {
        // Las 4 claves que el repositorio devolvía antes de unificar el vocabulario.
        assertFalse(CheckCatalog.isKnownQuestion("hoy_como_estas"))
        assertFalse(CheckCatalog.isKnownQuestion("donde_ocurre"))
        assertFalse(CheckCatalog.isKnownOption(CheckCatalog.SLEEP, "inventada"))
        assertFalse(MotivoCatalog.isKnown("inventado"))
    }
}
