# TASK-008 · Ruta B — «Quiero ayudar a alguien»

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-00A` · **Bloquea:** `TASK-010`

## 1. Contexto

El brief §18 lo dice en mayúsculas: **"ESTA RUTA DEBE TENER SU PROPIA ESTRUCTURA. NO reutilizar el
flujo de «Me está pasando algo»."** Y `PLAN-TRABAJO-SDD.md` §2.2 la llama *"el hueco más grave"*:
hoy no existe ni ruta, ni módulo, ni contrato de datos.

Por qué es distinta de la Ruta A, y por qué no se puede reutilizar:

| | Ruta A | Ruta B |
|---|---|---|
| Quién es el sujeto | **el joven** | **una tercera persona** |
| Qué se evalúa | su situación | **nada**: no se evalúa psicológicamente a un tercero |
| Quién es el usuario | quien necesita ayuda | **quien quiere ayudar** |
| Resultado | un reporte sobre sí mismo | **una orientación para acompañar** |

Guardrail del brief §19, literal: **"NO convertir a quien ayuda en terapeuta."** Es la regla que
gobierna toda la tarea: el resultado es *orientación para acompañar y buscar ayuda*, nunca una
evaluación de la otra persona ni un tratamiento.

## 2. Alcance

### Dentro
- **Módulo nuevo** `feature:help` con **estructura propia** (no comparte pantallas con `Ruta A`).
- **Ruta nueva** en el grafo: `HelpRoute` (+ las sub-pantallas que el flujo necesite).
- Secuencia del brief §19, en 7 pasos:
  1. **ESCUCHA** — *"Lo primero es dejar que pueda hablar."*
  2. **VALIDA** — *"Gracias por confiar en mí."*
  3. **EVITA** — las frases que no ayudan (*"No es para tanto." · "Ignóralos." · "Defiéndete."*)
  4. **PREGUNTA** — *"¿Esto está ocurriendo seguido?" · "¿Hay algún adulto que pueda ayudarte?" ·
     "¿Te sientes seguro/a ahora?"*
  5. **OBSERVA** — señales que sugieren buscar ayuda adicional
  6. **ACOMPAÑA** — *"Puedes ofrecerte a ir con esa persona a buscar apoyo."*
  7. **BUSCAR MÁS AYUDA** — cuándo debe involucrarse una persona capacitada
- Pregunta inicial del brief §18: *"¿Quién eres para esta persona?"* con las 7 opciones (amigo/a,
  compañero/a, hermano/a, familiar, profesor/a, tutor/a, otro).
- Entrada desde Home: la Ruta B es **camino principal** del Home (brief §6 y decisión P3, que le da
  *"más protagonismo que en una barra"*).

### Fuera
- Cualquier evaluación de la tercera persona: sin nivel de atención, sin señales sobre ella, sin
  reporte sobre ella.
- El flujo de solicitud de apoyo **del joven** → `TASK-007`.
- Herramientas breves para el joven → `TASK-006a`.
- Derivación y directorio → `TASK-011`.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:help`
- Dueño: **B**
- Compartidos que **declara** (este es el caso con **más necesidades nuevas** de toda la cola de B):
  1. `settings.gradle.kts` → `include(":feature:help")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:help"))`
  3. `AppDestination.kt` → **RUTA NUEVA `HelpRoute`** (`@Serializable data object`) + las sub-rutas
     que resulten del flujo
  4. `PuenteJovenNavHost.kt` → montar `HelpRoute` y sus sub-rutas
  5. `feature/home/HomeScreen.kt` → **tarjeta principal** «Quiero ayudar a alguien» (brief §6)
  6. `Repositories.kt` → **contrato nuevo `HelpRepository`** — ver §4
  7. `LocalPuenteRepository.kt` → implementación del contrato nuevo

## 4. Contratos de datos

**Consume:** **ninguno existente.** La Ruta B no reutiliza `ConversationRepository`,
`SignalsRepository` ni `ContextCheckRepository` — precisamente porque el sujeto no es el joven.

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- **Contrato nuevo `HelpRepository`** — `[nuevo]`. Propuesta mínima:

```kotlin
/** Contrato de la Ruta B: acompañar a un tercero SIN evaluarlo. */
interface HelpRepository {
    /** Guarda con quién habla el joven (rol declarado, no identidad de la persona). */
    suspend fun declareRelationship(roleKey: String): AppResult<HelpRelationship>
    /** Registra lo que le contaron, con el mismo cifrado local que la Ruta A. */
    suspend fun recordWhatTheyShared(content: String): AppResult<HelpEntry>
    /** Progreso del acompañamiento por los 7 pasos del brief §19. */
    fun observeProgress(): Flow<HelpProgress>
    /** Marca un paso como completado. */
    suspend fun completeStep(stepKey: String): AppResult<HelpProgress>
}
```

  - **Decisión de diseño crítica:** el contrato **no tiene** ningún tipo de nivel, señal, evaluación
    ni reporte sobre la tercera persona. Eso hace que el guardrail *"no evaluar psicológicamente a la
    tercera persona"* sea **imposible de violar por accidente**: no hay dónde meterlo.
  - Alternativa si A no quiere un contrato nuevo: reutilizar `ConversationRepository` con una
    conversación marcada como Ruta B. **B la rechaza** y explica por qué: rompería la distinción del
    brief §18 y haría que el mismo `Conversation` pudiera acabar en un resumen compartible
    (`TASK-007`), que es exactamente lo que no debe pasar. **La decisión es de A.**

- **Sin** acceso a `SharingRepository`: la Ruta B **no genera nada compartible**.

**Nota de privacidad:** lo que le contaron al joven es dato de un **tercero que no consintió**. Por
tanto: se guarda cifrado local, **nunca** entra en el resumen compartible, y **no** es exportable.
Lo declaro explícitamente porque es el punto donde esta feature podría causar daño.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | La Ruta B tiene **estructura propia**: no reutiliza ninguna pantalla ni ViewModel de `feature:conversation` | `grep` de imports cruzados entre `feature/help/**` y `feature/conversation/**` (debe ser 0) |
| 2 | **No existe** ninguna evaluación de la tercera persona: sin `AttentionLevel`, sin `Signal`, sin `AttentionAssessment` producidos en la Ruta B | `grep` de esos tipos en `feature/help/**` (debe ser 0) |
| 3 | Lo que le contaron al joven **no puede** acabar en un `ShareableSummary` | unitaria: no existe camino de código; `HelpRepository` no expone nada consumible por `SharingRepository` |
| 4 | Los **7 pasos** del brief §19 existen y el progreso se persiste | unitaria + instrumentada |
| 5 | El paso **EVITA** muestra las 3 frases del brief (*"No es para tanto." · "Ignóralos." · "Defiéndete."*) como frases a **evitar**, con el encuadre correcto (no como consejos) | revisión de contenido |
| 6 | El paso **OBSERVA** no produce un nivel ni una categoría: muestra **señales para buscar ayuda adicional**, con lenguaje de acción, no de gravedad | revisión de contenido |
| 7 | El resultado final **no** es un diagnóstico ni un tratamiento: es orientación para acompañar (brief §19: *"NO convertir a quien ayuda en terapeuta"*) | revisión de contenido |
| 8 | La entrada desde Home es un **camino principal**, no una tarjeta secundaria (brief §6) | revisión visual |
| 9 | Lo registrado **sobrevive al reinicio** y está aislado por perfil | unitaria sobre `LocalPuenteRepository` |
| 10 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 11 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **Brief §18 — estructura propia, no reutilizar la Ruta A** | Criterios #1 y #2 |
| **Brief §19 — no evaluar psicológicamente a un tercero** | El contrato `HelpRepository` no tiene tipos de evaluación (criterio #2) |
| **Brief §19 — no convertir a quien ayuda en terapeuta** | Criterio #7; el paso 7 deriva a *"persona capacitada"* cuando corresponde |
| **#4 — la IA no diagnostica** | No hay IA en la Ruta B: el contenido son los 7 pasos del brief, no un modelo |
| **#7 — privacidad** | Lo que contó un tercero no consentido nunca sale del dispositivo (criterio #3) |
| **`TASK-021` §5.1** | Este es un dato **de otro**, y el modelo de amenaza no lo preveía. Lo añado como observación a A |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Prototipo: `HelpSomeoneScreen.tsx` (197 líneas — la pantalla más completa del prototipo juvenil
  sin tarea asignada hasta hoy). Brief §18–§19. Demo: brief §36 *"DEMO C — QUIERO AYUDAR"*.
- Design system: `EditorialHeader`, `PuenteOrb`, `PuenteActions`, `ResourceCard` (para el paso
  *BUSCAR MÁS AYUDA*), `PuenteStates`, `SignalChip`.
- **No se reutiliza ningún componente de `feature:conversation`**: si la Ruta B necesita un patrón
  de UI que no existe, **se pide a A**, no se copia de la Ruta A.

## 8. Dependencias

- **Bloquea:** `TASK-010` (los «próximos pasos» pueden incluir el acompañamiento a alguien).
- **Bloqueado por:** `TASK-00A` ✅ (S1) y la decisión de A sobre el contrato nuevo `HelpRepository`
  (§4) y sobre la ruta nueva en `AppDestination.kt`.
- **Specs relacionadas:** `TASK-010`, `TASK-011`, `TASK-007` (frontera: la Ruta B no genera nada
  compartible), `TASK-021`.

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | ¿Se aprueba el **contrato nuevo `HelpRepository`**, o A prefiere otra vía? Sin contrato no hay módulo compilable | A | **Bloquea el arranque** |
| **Q2** | ¿La Ruta B tiene **una** pantalla con los 7 pasos secuenciados o **una pantalla por paso**? El brief §19 los presenta como una experiencia secuenciada | producto | Nº de rutas nuevas |
| Q3 | ¿Lo que le contaron al joven es **texto libre**? El brief §18 dice *"¿Qué te contó?"*, pero la Ruta A evita el texto libre interpretado | producto | Riesgo de privacidad del tercero |
| Q4 | El brief §19 paso 5 (*OBSERVA: mostrar señales que sugieren buscar ayuda adicional*) es lo más cerca que la Ruta B está de una evaluación. ¿Se apoya en el **mismo** catálogo de señales de `TASK-005` o en un catálogo de **acciones** distinto? | clínico / producto | Frontera con `TASK-005` |
| Q5 | ¿La Ruta B se ofrece a **cualquier** edad del piloto (13–18), o hay un mínimo? El brief no lo dice | producto | Alcance |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 resuelta** por A (contrato `HelpRepository`)
- [ ] **Q4 resuelta** (frontera con `TASK-005`)
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluidos los `grep` de #1, #2 y #3
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
