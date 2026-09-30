package bo.puentejoven.feature.signals.domain

import bo.puentejoven.core.model.AttentionLevel
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
 * o no a una persona. Los criterios de `TASK-005` que se cubren:
 * - #3 determinismo y reproducibilidad;
 * - #6 **un rojo no se degrada** (D2);
 * - la separación entre lo que el APK puede detectar y lo que no.
 */
class AttentionRulesetTest {

    // -----------------------------------------------------------------------
    // Catálogos
    // -----------------------------------------------------------------------

    @Test
    fun `el catalogo de motivo tiene las 9 claves de PR-003 4_2`() {
        assertEquals(
            setOf(
                "ideacion_activa", "plan_estructurado", "intento_reciente", "autolesion",
                "abuso", "peligro_inmediato", "violencia_no_inmediata", "deterioro_escolar",
                "aislamiento_persistente",
            ),
            MotivoCatalog.all,
        )
    }

    @Test
    fun `las claves de senal son las canonicas de PR-003 4_1`() {
        assertEquals(
            setOf(
                "SLEEP", "ANXIETY", "ISOLATION", "SCHOOL_IMPACT",
                "SUBSTANCE_USE", "SELF_HARM", "PHYSICAL_VIOLENCE",
            ),
            SignalCatalog.all,
        )
    }

    @Test
    fun `normaliza claves de senal y retira frequency`() {
        // `DemoFixtures` emite hoy minúsculas; PR-003 §4.1 fijó MAYÚSCULAS.
        assertEquals(SignalCatalog.ISOLATION, SignalCatalog.canonicalOrNull("isolation"))
        assertEquals(SignalCatalog.SCHOOL_IMPACT, SignalCatalog.canonicalOrNull("school_impact"))
        assertEquals(SignalCatalog.ISOLATION, SignalCatalog.canonicalOrNull("ISOLATION"))

        // `frequency` es una DIMENSIÓN (brief §10), no un tipo de señal: se retiró del
        // catálogo, así que no se interpreta. Inventarle significado sería peor.
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
                CheckKey.FEELINGS to "better",
                CheckKey.SLEEP to "ok",
                CheckKey.LONELINESS to "accompanied",
                CheckKey.BULLYING to "no",
                CheckKey.VIOLENCE to "no",
                CheckKey.FAMILY to "calm",
                CheckKey.SCHOOL to "well",
                CheckKey.SUBSTANCE to "no",
                CheckKey.SAFETY to "yes",
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
            answers = mapOf(CheckKey.SAFETY to CheckOption.SAFETY_NO),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.RED, outcome.level)
        assertEquals(LevelReason.CRITERION, outcome.reason)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.PELIGRO_INMEDIATO))
    }

    @Test
    fun `violencia fisica produce rojo por abuso`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckKey.VIOLENCE to CheckOption.VIOLENCE_PHYSICAL),
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
                CheckKey.SAFETY to CheckOption.SAFETY_NO,
                CheckKey.BULLYING to CheckOption.BULLYING_EVERY_DAY,
                CheckKey.SCHOOL to CheckOption.SCHOOL_NOT_GOING,
                CheckKey.LONELINESS to CheckOption.LONELINESS_ALWAYS,
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.RED, outcome.level)
    }

    // -----------------------------------------------------------------------
    // Amarillo — criterios de PR-001 §4.3 y acumulación
    // -----------------------------------------------------------------------

    @Test
    fun `acoso frecuente produce amarillo por violencia no inmediata`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckKey.BULLYING to CheckOption.BULLYING_EVERY_DAY),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.VIOLENCIA_NO_INMEDIATA))
    }

    @Test
    fun `dejar de ir al colegio produce amarillo por deterioro escolar`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckKey.SCHOOL to CheckOption.SCHOOL_NOT_GOING),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.DETERIORO_ESCOLAR))
    }

    @Test
    fun `sentirse solo seguido produce amarillo por aislamiento persistente`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(CheckKey.LONELINESS to CheckOption.LONELINESS_OFTEN),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertTrue(outcome.motivoKeys.contains(MotivoCatalog.AISLAMIENTO_PERSISTENTE))
    }

    @Test
    fun `tres factores que no son criterio por si solos suben a amarillo por acumulacion`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(
                CheckKey.FEELINGS to CheckOption.FEELINGS_WORSE,
                CheckKey.SLEEP to CheckOption.SLEEP_VERY_LITTLE,
                CheckKey.FAMILY to CheckOption.FAMILY_FIGHTS,
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.YELLOW, outcome.level)
        assertEquals(LevelReason.ACCUMULATION, outcome.reason)
    }

    @Test
    fun `dos factores no bastan para subir el nivel`() {
        val outcome = AttentionRuleset.evaluate(
            answers = mapOf(
                CheckKey.FEELINGS to CheckOption.FEELINGS_WORSE,
                CheckKey.SLEEP to CheckOption.SLEEP_VERY_LITTLE,
            ),
            signals = emptyList(),
        )

        assertEquals(AttentionLevel.GREEN, outcome.level)
    }

    @Test
    fun `dos senales en ascenso por si solas no bastan para subir el nivel`() {
        val signals = listOf(
            signal(SignalCatalog.SLEEP, TrendDirection.RISING),
            signal(SignalCatalog.ANXIETY, TrendDirection.RISING),
        )

        val outcome = AttentionRuleset.evaluate(answers = emptyMap(), signals = signals)

        // Sueño y ansiedad no son criterio por sí solos (PR-001 §4.3): dos factores
        // están por debajo del umbral de acumulación.
        assertEquals(AttentionLevel.GREEN, outcome.level)
    }

    @Test
    fun `las senales en ascenso se suman a los factores del chequeo`() {
        val signals = listOf(
            signal(SignalCatalog.SLEEP, TrendDirection.RISING),
            signal(SignalCatalog.ANXIETY, TrendDirection.RISING),
        )
        val answers = mapOf(CheckKey.FEELINGS to CheckOption.FEELINGS_WORSE)

        val outcome = AttentionRuleset.evaluate(answers = answers, signals = signals)

        // 1 factor del chequeo + 2 señales en ascenso = 3 → acumulación (brief §10).
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
            answers = mapOf(CheckKey.LONELINESS to CheckOption.LONELINESS_ALWAYS),
            signals = emptyList(),
        )
        assertEquals(AttentionLevel.YELLOW, computed.level)

        val effective = AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.RED)

        assertEquals(AttentionLevel.RED, effective.level)
    }

    @Test
    fun `la regla no degradar no inventa subidas`() {
        val computed = AttentionRuleset.evaluate(
            answers = mapOf(CheckKey.LONELINESS to CheckOption.LONELINESS_ALWAYS),
            signals = emptyList(),
        )

        // Un amarillo previo NO se convierte en rojo, y un verde previo tampoco.
        assertEquals(AttentionLevel.YELLOW, AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.YELLOW).level)
        assertEquals(AttentionLevel.YELLOW, AttentionRuleset.enforceNoDegrade(computed, AttentionLevel.GREEN).level)
        assertEquals(AttentionLevel.YELLOW, AttentionRuleset.enforceNoDegrade(computed, null).level)
    }

    @Test
    fun `un rojo actual se mantiene rojo`() {
        val computed = AttentionRuleset.evaluate(
            answers = mapOf(CheckKey.SAFETY to CheckOption.SAFETY_NO),
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
            CheckKey.SAFETY to CheckOption.SAFETY_NO,
            CheckKey.BULLYING to CheckOption.BULLYING_EVERY_DAY,
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
    fun `el APK no puede producir los tres criterios de rojo que nadie pregunta`() {
        // Se responden TODAS las preguntas con la peor opción posible y se añaden
        // todas las señales del catálogo. Aun así, los tres criterios que ni el
        // chequeo (brief §9) ni las señales cubren no aparecen.
        val worstAnswers = mapOf(
            CheckKey.FEELINGS to CheckOption.FEELINGS_WORSE,
            CheckKey.SLEEP to CheckOption.SLEEP_VERY_LITTLE,
            CheckKey.LONELINESS to CheckOption.LONELINESS_ALWAYS,
            CheckKey.BULLYING to CheckOption.BULLYING_EVERY_DAY,
            CheckKey.VIOLENCE to CheckOption.VIOLENCE_PHYSICAL,
            CheckKey.FAMILY to CheckOption.FAMILY_FIGHTS,
            CheckKey.SCHOOL to CheckOption.SCHOOL_NOT_GOING,
            CheckKey.SUBSTANCE to CheckOption.SUBSTANCE_SOMETIMES,
            CheckKey.SAFETY to CheckOption.SAFETY_NO,
        )
        val allSignals = SignalCatalog.all.map { signal(it, TrendDirection.RISING) }

        val outcome = AttentionRuleset.evaluate(worstAnswers, allSignals)

        MotivoCatalog.unreachableFromApk.forEach { unreachable ->
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
