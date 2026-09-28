package bo.puentejoven.app

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Guardas de arquitectura verificables en CI.
 *
 * Cierran tres riesgos de la capa de datos:
 * - S-3 (guardrail #6): ningún contrato profesional de Puente Red se compila en
 *   el APK juvenil.
 * - S-2 (TASK-008 criterio #7): NI `demo` NI `remote` dependen de una capa de red
 *   mientras el backend no esté aprobado. `remote` es hoy una **barrera sin
 *   transporte**: existe como dimensión para que el día que se apruebe el backend
 *   la dependencia se añada en un único punto, pero no puede activar red ni datos
 *   reales antes (guardrails #5 y #8).
 * - Guardrail #5/#8: ninguna variante ni fuente contiene endpoints reales.
 *
 * Son pruebas de texto sobre el árbol de fuentes: no requieren Android ni red.
 */
class ModuleGraphGuardTest {

    private fun projectRoot(): File {
        var f = File(System.getProperty("user.dir"))
        while (!File(f, "settings.gradle.kts").exists() && f.parentFile != null) {
            f = f.parentFile
        }
        return f
    }

    @Test
    fun `el APK juvenil no declara modulos profesionales de Puente Red`() {
        val settings = File(projectRoot(), "settings.gradle.kts").readText()
        listOf(
            ":professional",
            ":core:professional",
            ":feature:cases",
            ":feature:alerts",
            ":feature:referrals",
        ).forEach { modulo ->
            assertTrue(
                "No debe existir el módulo profesional $modulo en la app juvenil",
                !settings.contains(modulo),
            )
        }
    }

    @Test
    fun `ninguna fuente de la app juvenil referencia contratos profesionales`() {
        val prohibidos = listOf(
            "ProfessionalCase",
            "ProfessionalAlert",
            "ProfessionalProfile",
            "ProfessionalAssessment",
            "CaseAssignment",
            "AggregateMetric",
            "AlertQueue",
        )
        val offenders = mutableListOf<String>()
        File(projectRoot(), "app").walkTopDown()
            .filter { it.isFile && it.extension == "kt" }
            // Este guardián DECLARA la lista de tokens prohibidos, así que su propio
            // archivo los contiene por construcción. Excluirlo no debilita la guarda:
            // lo que se vigila es el código que se compila en el APK, no el test que
            // define la lista. Sin esta exclusión la prueba se autodelataba y fallaba
            // siempre, dando una falsa sensación de guardrail roto.
            .filterNot { it.name == "ModuleGraphGuardTest.kt" }
            .forEach { file ->
                val text = file.readText()
                prohibidos.forEach { token ->
                    if (Regex("\\b$token\\b").containsMatchIn(text)) {
                        offenders += "${file.name}: $token"
                    }
                }
            }
        assertTrue("Código profesional detectado en app juvenil: $offenders", offenders.isEmpty())
    }

    @Test
    fun `el flavour demo no depende de una capa de red`() {
        val appBuild = File(projectRoot(), "app/build.gradle.kts").readText()
        assertTrue(
            "El flavour demo no debe incluir :core:network",
            !Regex("""demo\s*\{[\s\S]*?:core:network""").containsMatchIn(appBuild),
        )
    }

    @Test
    fun `el flavour remote tamien no depende de una capa de red (backend sin aprobar)`() {
        // `remote` existe como dimension para el dia que se apruebe el backend, pero
        // hoy NO puede arrastrar `:core:network`: el modulo ni siquiera existe. Si
        // alguien lo anade sin aprobar contratos/privacidad, esta guarda lo detiene.
        val appBuild = File(projectRoot(), "app/build.gradle.kts").readText()
        assertTrue(
            "El flavour remote no debe incluir :core:network hasta aprobar el backend",
            !Regex("""remote\s*\{[\s\S]*?:core:network""").containsMatchIn(appBuild),
        )
        assertTrue(
            "El modulo :core:network no debe existir todavia",
            !File(projectRoot(), "core/network").exists(),
        )
    }

    @Test
    fun `ninguna variante ni fuente declara endpoints reales`() {
        // Guardrails #5 y #8: sin URLs de produccion, secretos ni datos identificables.
        val patronesProhibidos = listOf(
            Regex("""https?://(?!schemas\.android\.com|www\.w3\.org|developer\.android\.com)[a-zA-Z0-9.-]+"""),
            Regex("""(?i)api[_-]?key\s*=\s*"[^"]+""""),
            Regex("""(?i)secret\s*=\s*"[^"]+""""),
        )
        val offenders = mutableListOf<String>()
        listOf("app", "core", "feature").forEach { raiz ->
            File(projectRoot(), raiz).walkTopDown()
                .filter { it.isFile && (it.extension == "kt" || it.extension == "kts") }
                .filterNot { it.path.contains("${File.separator}build${File.separator}") }
                .forEach { file ->
                    val text = file.readText()
                    patronesProhibidos.forEach { regex ->
                        regex.findAll(text).forEach { m ->
                            offenders += "${file.path}: ${m.value.take(60)}"
                        }
                    }
                }
        }
        assertTrue(
            "Endpoint o secreto real detectado en fuentes: $offenders",
            offenders.isEmpty(),
        )
    }
}
