# TASK-006a · Herramientas breves

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-005` · **Bloquea:** `TASK-006b`

## 1. Contexto

El brief §14 es tajante sobre lo que **no** hay que hacer: *"Después del análisis no mandar
directamente al profesional en todos los casos."* Las herramientas breves son la alternativa: el
joven recibe algo que puede hacer **hoy**, solo, sin depender de que alguien le responda. Es la pieza
que hace que un nivel verde no sea un callejón sin salida.

Guardrail clave del brief §14: **no mostrar nombres clínicos.** La lista de técnicas del brief
(reconocer emociones, respiración/regulación, sueño, culpa/desesperanza, resolución de problemas,
activación, autoeficacia, plan de apoyo) se traduce a títulos en lenguaje de adolescente:
*"Ponle nombre a lo que sientes." · "Bajemos un poco la tensión." · "Cuando tu cabeza se queda
atrapada." · "¿Qué podemos cambiar hoy?" · "Recuerda lo que sí está en tus manos." · "Preparemos cómo
pedir ayuda."*

## 2. Alcance

### Dentro
- `feature:tools`: catálogo de herramientas + pantalla de detalle con el guion de cada una.
- Registro de finalización con **reflexión opcional** (`ToolCompletion.reflection`).
- Selección **sugerida por nivel** (verde: catálogo completo; amarillo: las de regulación y apoyo).
- Los **3 módulos TCC del MVP** (decisión Q5): **sueño · respiración/regulación · plan de apoyo**.
- Historial de herramientas completadas (`observeCompletions()`), que alimenta `TASK-006b`.

### Fuera
- El recorrido longitudinal y el reporte → `TASK-006b`.
- El nivel de atención (se **consume**, no se calcula) → `TASK-005`.
- Contenido clínico nuevo: **los guiones se escriben sobre las traducciones del brief §14**, no se
  inventan técnicas.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:tools`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:tools")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:tools"))`
  3. `PuenteJovenNavHost.kt` → 2 placeholders (`ToolsRoute`, `ToolDetailRoute`)
  4. `feature/home/HomeScreen.kt` → entrada «Herramientas» (brief §6, secundaria)
  5. `Repositories.kt` → **sin cambios** (los contratos ya existen)
  6. `AppDestination.kt` → sin cambios

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `ToolsRepository` | `availableTools()`, `recordCompletion(toolKey, reflection)`, `observeCompletions()` |
| `SignalsRepository` | `getAttentionAssessment()` (para sugerir según nivel) |

**Métodos nuevos que necesita:** **ninguno.**

**Decisión de diseño — el catálogo de guiones.** `availableTools()` devuelve `BriefTool`
(`key`, `label`, `durationLabel`, `summary`, `accentKey`) — es decir, **metadatos**, no el guion. El
**guion** de cada herramienta (los pasos que el joven sigue) vive en `feature:tools` como fixture
versionado + `strings.xml`. Mismo criterio que en `TASK-004`: el contrato de datos queda libre de copy
y el contenido clínico es revisable en un solo sitio.

**Hallazgo que condiciona esta tarea (ver §9 Q1):** las tres fuentes del catálogo **no coinciden**:

| Fuente | Contenido |
|---|---|
| Q5 (`PLAN-TRABAJO-SDD` §10.4) | 3 **módulos** TCC: sueño · respiración/regulación · plan de apoyo |
| Brief §14 | 6 **títulos** de herramienta (*"Ponle nombre…"*, *"Bajemos…"*, etc.) |
| Fixtures actuales | 3 claves distintas: `breathe`, `write`, `listen` |

Son tres taxonomías. El mapeo es una decisión de producto, no de implementación. **No la cierro yo.**

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | El catálogo del MVP contiene los **3 módulos de Q5** (sueño, respiración/regulación, plan de apoyo) | unitaria: `availableTools()` contiene las 3 claves |
| 2 | Cada herramienta tiene **guion navegable de principio a fin** y `durationLabel` coherente con la duración real del guion | instrumentada |
| 3 | Completar una herramienta crea un `ToolCompletion` **con `youthId` del perfil activo** (no del perfil de demo) | unitaria |
| 4 | La reflexión es **opcional**: se puede completar sin escribir nada | unitaria + instrumentada |
| 5 | Ningún título ni guion contiene **nombre clínico** (revisión contra la lista del brief §14) | revisión de contenido |
| 6 | La herramienta **no se bloquea** si no hay nivel calculado: funciona en verde, amarillo y rojo | instrumentada |
| 7 | El historial de completadas **sobrevive al reinicio** | unitaria sobre `LocalPuenteRepository` |
| 8 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 9 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **Brief §14 — no nombres clínicos** | Los títulos son los del brief; ningún término técnico visible |
| **`PR-001` P8 — no se recomiendan tratamientos farmacológicos** | Ninguna herramienta menciona medicación |
| **`PR-001` §9 — verde: herramientas y recorrido** | En verde el catálogo está disponible; en rojo la herramienta **no sustituye** la ruta humana (`TASK-015`) |
| **`PR-001` P4 — ninguna prioridad reemplaza a una persona** | Una herramienta nunca se presenta como suficiente para un nivel rojo |
| **`TASK-021`** | El historial de herramientas es dato longitudinal: se persiste local, cifrado, y no sale del dispositivo |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Brief §14 (títulos y enfoque), §7 etapa 8 (*"HERRAMIENTA BREVE"* dentro de la secuencia de la Ruta A).
- Design system: `EditorialHeader`, `PuenteActions` (`PrimaryAction`/`SecondaryAction`/`TertiaryAction`),
  `PuenteOrb` (respiración — ya existe y es el componente natural para la herramienta de regulación),
  `IntensityMeter`, `ResourceCard`, `PuenteStates`.
- **`PuenteOrb` se reutiliza para la respiración guiada.** No se crea animación nueva sin autorización.

## 8. Dependencias

- **Bloquea:** `TASK-006b` (el reporte y el recorrido muestran las herramientas completadas).
- **Bloqueado por:** `TASK-005` (nivel sugerido), Q5 ✅ (ya decidido), **Q1 de esta spec** (mapeo del
  catálogo).
- **Specs relacionadas:** `TASK-006b`, `TASK-010` (próximos pasos puede proponer una herramienta),
  `TASK-017` (una herramienta no es un evento adverso; no se registra ahí).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **Mapeo del catálogo.** ¿Los 3 módulos de Q5 se implementan como 3 herramientas, o como 3 **familias** que contienen las 6 herramientas del brief §14? Y ¿qué pasa con las claves actuales de fixtures (`breathe`, `write`, `listen`)? | producto | **Bloquea el criterio #1** |
| Q2 | El brief dice *"Mostrar herramientas breves **según el contexto**"*. ¿La sugerencia depende del **nivel** (verde/amarillo/rojo) o de las **señales** concretas? | producto | Lógica de sugerencia |
| Q3 | ¿Una herramienta se puede repetir? ¿Se registra cada repetición o solo la última? | producto | Modelo de historial |
| Q4 | ¿La reflexión tiene límite de longitud? `SummaryNote` usa 500 caracteres; ¿se reutiliza ese criterio? | producto | Validación |
| Q5 | ¿Las herramientas se ofrecen también en la Ruta B (a quien ayuda)? El brief §19 no las menciona | producto | Alcance vs. `TASK-008` |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 resuelta** por producto
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
