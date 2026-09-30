# TASK-010 · Próximos pasos

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 2 · **Depende de:** `TASK-006b`, `TASK-008` · **Bloquea:** `TASK-012`

## 1. Contexto

`PLAN-TRABAJO-SDD.md` §2.2 la marca como hueco: la pantalla `RouteScreen.tsx` del prototipo (170
líneas, brief §6) **no tiene ruta ni tarea** en Android. El brief §6 la lista entre las
funcionalidades secundarias del Home (*"Mis próximos pasos"*) y §16 la incluye en el recorrido
(*"Próximos pasos"*).

Su función en el relato: cerrar el ciclo. El joven conversó, vio sus señales, recibió un nivel, usó
una herramienta y pidió (o no) apoyo. **¿Y ahora qué?** Sin esta pantalla, la Ruta A termina en un
diagnóstico de situación sin un paso siguiente; con ella, termina en algo que el joven puede hacer.

Es también la superficie donde el producto puede **fallar por exceso**: una lista de «deberías hacer»
es exactamente lo que el brief evita. La orientación tiene que ser **concreta, pequeña y elegible**,
nunca una prescripción.

## 2. Alcance

### Dentro
- **Módulo nuevo** `feature:nextsteps` con **estructura propia**.
- **Ruta nueva** `NextStepsRoute` en el grafo.
- Lista de próximos pasos **derivada del estado real del joven**, no de un catálogo fijo:
  - si hay un nivel calculado, el paso coherente con ese nivel (`PR-001` §9);
  - si hay herramientas usadas, una relacionada;
  - si hay una solicitud de apoyo en curso, su estado;
  - si hay acompañamiento a alguien (Ruta B), su progreso.
- Cada paso es **elegible y accionable**: enlaza a la pantalla que lo ejecuta, no describe una tarea.
- Entrada desde Home (secundaria, brief §6) y desde el recorrido (brief §16).

### Fuera
- El contenido de cada destino enlazado (herramientas → `TASK-006a`; apoyo → `TASK-007`; acompañar
  → `TASK-008`; derivación → `TASK-011`).
- Cualquier prescripción, dosis de actividad o plan terapéutico.
- El cálculo de señales y nivel → `TASK-005`.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:nextsteps`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:nextsteps")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:nextsteps"))`
  3. `AppDestination.kt` → **RUTA NUEVA `NextStepsRoute`**
  4. `PuenteJovenNavHost.kt` → montar `NextStepsRoute`
  5. `feature/home/HomeScreen.kt` → entrada «Mis próximos pasos» (brief §6, secundaria)
  6. `Repositories.kt` → **posible** contrato nuevo: ver §4
  7. `LocalPuenteRepository.kt` → implementación si se aprueba el contrato nuevo

## 4. Contratos de datos

**Consume (lectura, sin escribir):**

| Interfaz | Métodos |
|---|---|
| `ReportRepository` | `getPersonalReport()`, `observeJourney()` |
| `SignalsRepository` | `getAttentionAssessment()` |
| `ToolsRepository` | `observeCompletions()`, `availableTools()` |
| `SupportRepository` | `observeRequests()` |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- **Contrato nuevo `NextStepsRepository`** — `[nuevo]`. Motivo: los próximos pasos son **derivados**
  (se calculan a partir de otros contratos), y calcularlos dentro de un ViewModel de feature
  significaría que `TASK-012` (integración narrativa) no puede probarlos de forma aislada, y que el
  mismo cálculo se duplicaría en el recorrido (`TASK-006b` §16, que también muestra «próximos pasos»).
  Propuesta mínima:

```kotlin
/** Próximos pasos derivados del estado real del joven. No es un plan terapéutico. */
interface NextStepsRepository {
    /** Pasos vigentes, ordenados por prioridad y acotados (nunca una lista larga). */
    suspend fun currentSteps(): AppResult<List<NextStep>>
    /** Marca un paso como descartado por el joven. Descartar es un derecho, no un fallo. */
    suspend fun dismiss(stepKey: String): AppResult<Unit>
}
```

  - `NextStep` necesitaría modelo nuevo en `:core:model` (`stepKey`, `title`, `reason`, `target`).
    **Eso toca `:core:model`, que no tiene dueño asignado** (`REVISION-B.md` H6/H7).
  - **Alternativa sin contrato ni modelo nuevo:** calcular los pasos en la feature y no persistir el
    descarte. **B la considera aceptable para el MVP** y la prefiere si A quiere evitar tocar
    `:core:model` en esta ola. **La decisión es de A.**

**Frontera con `TASK-006b`:** el brief §16 incluye «próximos pasos» **dentro** del recorrido. Decisión
de diseño: el recorrido **enlaza** a esta pantalla y no duplica la lista. Así hay **una sola** fuente
de verdad de los próximos pasos.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Cada paso mostrado es **accionable**: enlaza a una pantalla existente del grafo y navegar a ella funciona | instrumentada (por cada paso, navegación resuelta) |
| 2 | Los pasos se **derivan** del estado real: con un nivel rojo activo, la lista incluye el paso de apoyo humano; sin nivel calculado, la lista **no está vacía** (nunca un callejón sin salida) | unitaria (3 escenarios: sin nivel, nivel amarillo, nivel rojo) |
| 3 | La lista está **acotada**: nunca muestra más de N pasos a la vez (evita el efecto «lista de deberes») | unitaria |
| 4 | El copy **no es prescriptivo**: ninguna frase usa *"debes"*, *"tienes que"* ni imperativos de obligación | revisión de contenido + `grep` sobre `strings.xml` |
| 5 | Ningún paso menciona tratamiento, medicación ni terapia (guardrail #4 / `PR-001` P8) | revisión de contenido |
| 6 | El joven puede **descartar** un paso sin que eso cambie su nivel ni genere un evento negativo | unitaria + instrumentada |
| 7 | Los próximos pasos **no duplican** los del recorrido: el recorrido enlaza a esta pantalla | revisión de código (una sola fuente) |
| 8 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 9 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **#4 / `PR-001` P1 — nunca diagnóstico** | Los pasos son acciones, no valoraciones. Criterios #4 y #5 |
| **`PR-001` §9 — qué ve el joven en cada nivel** | El paso derivado del nivel debe coincidir con lo que `PR-001` §9 promete para ese nivel |
| **`PR-001` P5 — no prometer lo que no se puede dar** | Un paso no puede prometer respuesta humana en un horario que no existe (Q8: no hay guardia 24/7) |
| **`PR-001` P4 — ninguna prioridad reemplaza a una persona** | En rojo, los próximos pasos **no sustituyen** la ruta humana de `TASK-015` |
| **`PR-001` P8 — no se recomiendan tratamientos farmacológicos** | Criterio #5 |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Prototipo: `RouteScreen.tsx` (170 líneas). Brief §6 (*"Mis próximos pasos"* como secundaria del
  Home) y §16 (dentro del recorrido).
- Design system: `SummaryCard`, `PuenteActions`, `EditorialHeader`, `PuenteStates`, `SignalChip`.
- **No se inventa un patrón de «tarjeta de acción»** si no existe en el DS: se pide a A.

## 8. Dependencias

- **Bloquea:** `TASK-012` (el cierre del ciclo narrativo depende de que exista un «y ahora qué»).
- **Bloqueado por:** `TASK-006b` (recorrido), `TASK-008` (Ruta B), y las decisiones de A sobre el
  contrato nuevo y la ruta nueva (§4, §3).
- **Specs relacionadas:** `TASK-006b` (frontera: una sola fuente de próximos pasos), `TASK-011`,
  `TASK-015`, `PR-001` §9.

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | ¿Se aprueba el **contrato nuevo `NextStepsRepository`** (+ `NextStep` en `:core:model`), o se calcula en la feature sin persistir el descarte? | A | **Bloquea el arranque** |
| Q2 | ¿«Mis próximos pasos» es **pantalla propia** o **sección del Home**? `PLAN-TRABAJO-SDD` §5.2 (**P9**) lo dejó abierto y el brief lo menciona en los dos sitios | producto | **Bloquea el alcance** |
| Q3 | ¿Cuántos pasos como máximo (el criterio #3 necesita un N)? | producto | Criterio #3 |
| Q4 | ¿De dónde salen los pasos «genéricos» cuando el joven está en verde y sin historial? El brief no los define | producto | Criterio #2 |
| Q5 | ¿El descarte es **permanente** o el paso reaparece si la situación cambia? | producto | Modelo |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 y Q2 resueltas**
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
