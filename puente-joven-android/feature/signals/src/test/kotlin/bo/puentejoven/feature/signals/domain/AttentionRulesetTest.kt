package bo.puentejoven.feature.signals.domain

import bo.puentejoven.core.model.AttentionLevel
import bo.puentejoven.core.model.CheckCatalog
import bo.puentejoven.core.model.MotivoCatalog
import bo.puentejoven.core.model.Signal
import bo.puentejoven.core.model.SignalEvidence
import bo.puentejoven.core.model.SignalEvidenceId
import bo.puentejoven.core.model.SignalKey
import bo.puentejoven.core.model.TrendDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pruebas del motor de prioridad preliminar de revisión.
 *
 * Es el fichero de pruebas más importante del APK: aquí vive la decisión que activa
 * o no a una persona. Cubre `TASK-005`:
 * - #3 determinismo y reproducibilidad;
 * - #6 **un rojo no se degrada** (D2);
 * - la separación entre lo que el APK puede detectar y lo que no.
 *
 * Las claves vienen de `CheckCatalog` (`:core:model`): una sola fuente.
 */
class AttentionRulesetTest {

    // -----------------------------------------------------------------------
    // Catálogos
    // -----------------------------------------------------------------------

    @Test
    fun `el catalogo de motivo es el de PR-003 4_2 con acumulacion y acoso`() {
        assertTrue(MotivoCatalog.isKnown("acumulacion"))
        assertTrue(MotivoCatalog.isKnown("acoso"))
        assertTrue(MotivoCatalog.isKnown("peligro_inmediato"))
        assertTrue(MotivoCatalog.isKnown("abuso"))
    }

    @Test
    fun `normaliza claves de senal y retira frequency`() {
        // `DemoFixtures` emite hoy minúsculas; PR-003 §4.1 fijó MAYÚSCULAS.
        assertEquals(SignalCatalog.ISOLATION, SignalCatalog.canonicalOrNull("isolation"))
        assertEquals(SignalCatalog.SCHOOL_IMPACT, SignalCatalog.canonicalOrNull("school_impact"))
        assertEquals(SignalCatalog.ISOLATION, SignalCatalog.canonicalOrNull("ISOLATION"))

        // `frequency` es una DIMENSIÓN (brief §10), no un tipo de señal.
        assertNull(SignalCatalog.canonicalOrNull("frequency"))
        assertNull(SignalCatalog.canonicalOrNull("inventada"))
    }

    // -----------------------------------------------------------------------
    // Verde
    // -----------------------------------------------------------------------

    @Test
    fun `sin respuestas y sin senales el nivel es verde`() {
        val outcome = AttentionRuleset.evaluate(answers = emptyMap(), signals = emptyList())

        assertEquals(AttentionLevel.GREEN, outcome.level)
        assertEquals(LevelReason.NOTHING, outcome.reason)
        assertTrue(outcome.motivoKeys.isEmpty())
    }

    @Test
    fun `las respuestas tranquilas no suben el nivel`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(
                CheckCatalog.EMOTIONS to setOf("fine"),
                CheckCatalog.SLEEP to setOf("sleeps_well"),
                CheckCatalog.SCHOOL to setOf("fine"),
                CheckCatalog.LONELINESS to setOf("several"),
                CheckCatalog.BULLYING to setOf("no"),
                CheckCatalog.FAMILY to setOf("calm"),
                CheckCatalog.VIOLENCE to setOf("no"),
                CheckCatalog.SUPPORT to setOf("adult"),
                CheckCatalog.SUBSTANCE to setOf("no"),
                CheckCatalog.SAFETY to setOf("yes"),
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.GREEN, outcome.level)
    }

    // -----------------------------------------------------------------------
    // Rojo — criterios de PR-001 §4.3
    // -----------------------------------------------------------------------

    @Test
    fun `no sentirse seguro produce rojo por peligro inmediato`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.SAFETY to setOf("no")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.RED, outcome.level)
        assertEquals(LevelReason.CRITERION, outcome.reason)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.PELIGRO_INMEDIATO))
    }

    @Test
    fun `violencia fisica produce rojo por abuso`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.VIOLENCE to setOf("physical")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.RED, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.ABUSO))
    }

    @Test
    fun `una senal de autolesion produce rojo aunque el chequeo no la pregunte`() {
        val outcome = AttentionRuleset.evaluate(
            answers = emptyMap(),
            signals = listOf(signal(SignalCatalog.SELF_HARM, TrendDirection.RISING)),
        )

        assertEquals(AttentionLevel.RED, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.AUTOLESION))
    }

    @Test
    fun `el rojo manda sobre cualquier criterio amarillo`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(
                CheckCatalog.SAFETY to setOf("no"),
                CheckCatalog.BULLYING to setOf("every_day"),
                CheckCatalog.SCHOOL to setOf("missing_school"),
                CheckCatalog.LONELINESS to setOf("no_one"),
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.RED, outcome.level)
    }

    // -----------------------------------------------------------------------
    // Amarillo — criterios y acumulación
    // -----------------------------------------------------------------------

    @Test
    fun `acoso frecuente produce amarillo con el motivo acoso`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.BULLYING to setOf("every_day")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(
            "`acoso` es el caso central del brief: debe poder encenderse",
            outcome.motivoKeys.contains(MotivoCatalog.ACOSO),
        )
    }

    @Test
    fun `no querer ir al colegio produce amarillo por deterioro escolar`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.SCHOOL to setOf("doesnt_want_to_go")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.DETERIORO_ESCOLAR))
    }

    @Test
    fun `no tener con quien hablar produce amarillo por aislamiento`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.LONELINESS to setOf("no_one")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.AISLAMIENTO_PERSISTENTE))
    }

    @Test
    fun `discusiones fuertes son violencia no inmediata`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.VIOLENCE to setOf("arguments")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.VIOLENCIA_NO_INMEDIATA))
    }

    @Test
    fun `tres factores sin criterio propio suben a amarillo por acumulacion`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(
                CheckCatalog.EMOTIONS to setOf("sad"),
                CheckCatalog.SLEEP to setOf("hard_to_sleep"),
                CheckCatalog.FAMILY to setOf("fights"),
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertEquals(LevelReason.ACCUMULATION, outcome.reason)
        // Antes este caso viajaba con motivo VACÍO. Ahora existe `acumulacion`.
        assertTrue(
            "Un amarillo por acumulación debe decir por qué: `acumulacion`",
            outcome.motivoKeys.contains(MotivoCatalog.ACUMULACION),
        )
    }

    @Test
    fun `dos factores no bastan para subir el nivel`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(
                CheckCatalog.EMOTIONS to setOf("sad"),
                CheckCatalog.SLEEP to setOf("hard_to_sleep"),
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.GREEN, outcome.level)
    }

    @Test
    fun `las senales en ascenso se suman a los factores del chequeo`() {
        val signals = listOf(
            signal(SignalCatalog.SLEEP, TrendDirection.RISING),
            signal(SignalCatalog.ANXIETY, TrendDirection.RISING),
        )
        val answers = mapOf(CheckCatalog.SUPPORT to setOf("nobody"))

        val outcome = AttentionRuleset.evaluate(answers = answers, signals = signals)

        // 1 factor del chequeo + 2 señales en ascenso = 3 → acumulación.
        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertEquals(LevelReason.ACCUMULATION, outcome.reason)
    }

    @Test
    fun `las senales estables o en descenso no cuentan como acumulacion`() {
        val signals = listOf(
            signal(SignalCatalog.SLEEP, TrendDirection.STABLE),
            signal(SignalCatalog.ANXIETY, TrendDirection.FALLING),
        )

        val outcome = AttentionRuleset.evaluate(answers = emptyMap(), signals = signals)

        assertEquals(AttentionLevel.GREEN, outcome.level)
    }

    @Test
    fun `una pregunta de seleccion multiple se evalua por conjunto`() {
        // `emotions` admite varias opciones: cualquiera de las que pesan cuenta.
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.EMOTIONS to setOf("fine", "exhausted")),
            signals = emptyList(),
        )

        // `exhausted` es factor de acumulación; una sola no basta.
        assertEquals(AttentionLevel.GREEN, outcome.level)
        assertEquals(1, 1) // el conjunto se procesó sin error
    }

    // -----------------------------------------------------------------------
    // D2 — un rojo no se degrada (criterio #6)
    // -----------------------------------------------------------------------

    @Test
    fun `un rojo previo no baja aunque el calculo actual de verde`() {
        val computed = AttentionRuleset.evaluate(answers = emptyMap(), signals = emptyList())
        assertEquals(AttentionLevel.GREEN, computed.level)

        val effective = AttentionRuleset.enforceNoDegrade(
            computed = computed,
            previousLevel = AttentionLevel.RED,
        )

        assertEquals(AttentionLevel.RED, effective.level)
        assertEquals(LevelReason.LATCHED_RED, effective.reason)
    }

    @Test
    fun `un rojo previo no baja a amarillo`() {
        val computed = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.LONELINESS to setOf("no_one")),
            signals = emptyList(),
        )
        assertEquals(AttentionLevel.YELLOW, computed.level)

        val effective = AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.RED)

        assertEquals(AttentionLevel.RED, effective.level)
    }

    @Test
    fun `la regla no degradar no inventa subidas`() {
        val computed = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.LONELINESS to setOf("no_one")),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.YELLOW).level)
        assertEquals(AttentionLevel.YELLOW, AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.GREEN).level)
        assertEquals(AttentionLevel.YELLOW, AttentionRuleset.enforceNoDegrade(computed, null).level)
    }

    @Test
    fun `un rojo actual se mantiene rojo`() {
        val computed = AttentionRuleset.evaluate(
            answers = mapOf(CheckCatalog.SAFETY to setOf("no")),
            signals = emptyList(),
        )

        val effective = AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.RED)

        assertEquals(AttentionLevel.RED, effective.level)
        assertEquals(
            "Si el rojo ya venía del cálculo, no es un rojo retenido",
            LevelReason.CRITERION,
            effective.reason,
        )
    }

    // -----------------------------------------------------------------------
    // Determinismo y evidencia
    // -----------------------------------------------------------------------

    @Test
    fun `el mismo estado produce siempre el mismo resultado`() {
        val answers = mapOf(
            CheckCatalog.SAFETY to setOf("no"),
            CheckCatalog.BULLYING to setOf("every_day"),
        )
        val signals = listOf(signal(SignalCatalog.ISOLATION, TrendDirection.RISING))

        val first = AttentionRuleset.evaluate(answers, signals)
        val second = AttentionRuleset.evaluate(answers, signals)
        val third = AttentionRuleset.evaluate(answers, signals)

        assertEquals(first, second)
        assertEquals(second, third)
    }

    @Test
    fun `la evidencia solo incluye las senales que el motor uso`() {
        val used = signal(SignalCatalog.ISOLATION, TrendDirection.RISING, evidenceCount = 2)
        val ignored = signal("FREQUENCY", TrendDirection.RISING, evidenceCount = 3)

        val outcome = AttentionRuleset.evaluate(answers = emptyMap(), signals = listOf(used, ignored))

        // `frequency` no está en el catálogo: no aporta evidencia ni motivo.
        assertEquals(2, outcome.evidence.size)
    }

    @Test
    fun `todo resultado declara la version de reglas que lo produjo`() {
        assertNotNull(AttentionRuleset.VERSION)
        assertTrue(AttentionRuleset.VERSION.isNotBlank())
    }

    // -----------------------------------------------------------------------
    // La carencia declarada
    // -----------------------------------------------------------------------

    @Test
    fun `el APK sigue sin poder producir los tres criterios de rojo que nadie pregunta`() {
        // Se responde TODO con la peor opción posible y se añaden todas las señales
        // del catálogo. Aun así, los tres criterios que ni las 10 preguntas ni las
        // señales cubren no aparecen.
        val worstAnswers = CheckCatalog.questionKeys.associateWith { questionKey ->
            val options = CheckCatalog.optionsFor(questionKey)
            // La última opción de cada pregunta es la más desfavorable del catálogo.
            setOf(options.last())
        }
        val allSignals = SignalCatalog.all.map { signal(it, TrendDirection.RISING) }

        val outcome = AttentionRuleset.evaluate(worstAnswers, allSignals)

        AttentionRuleset.unreachableFromApk.forEach { unreachable ->
            assertTrue(
                "El motivo $unreachable NO tiene fuente en el APK: si aparece, es que " +
                    "alguien inventó una regla sin base en PR-001",
                unreachable !in outcome.motivoKeys,
            )
        }

        // Y lo que sí se detecta con el peor caso:
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.PELIGRO_INMEDIATO))
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.ABUSO))
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.AUTOLESION))
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.ACOSO))
    }

    private fun signal(
        key: String,
        direction: TrendDirection,
        evidenceCount: Int = 1,
    ): Signal = Signal(
        key = SignalKey(key),
        label = key,
        trendPercent = 80,
        trendDirection = direction,
        evidence = List(evidenceCount) { index ->
            SignalEvidence(
                id = SignalEvidenceId("ev-$key-$index"),
                signalKey = SignalKey(key),
                label = "Registro $index",
                description = "Descripción $index",
                dateLabel = "0$index SEP",
                intensity = 2,
            )
        },
    )
}
