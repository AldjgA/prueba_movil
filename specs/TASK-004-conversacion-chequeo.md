# TASK-004 · Conversación estructurada + chequeo contextual

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-003b`, `TASK-00A` · **Bloquea:** `TASK-005`, `TASK-007`

## 1. Contexto

La Ruta A («Me está pasando algo») es la puerta de entrada del producto. El brief §7 fija una
secuencia de 11 etapas; las dos primeras que requieren código son la **conversación inicial** (§8) y
el **chequeo contextual** (§9). Hoy `ConversationRoute` y `ContextCheckRoute` existen en el grafo
tipado pero apuntan a `DestinationPlaceholder` (`PuenteJovenNavHost.kt:80-97`).

**Esta tarea no implementa un chatbot.** Guardrail #3: el MVP no tiene chat generativo libre y la app
no diagnostica. Cada turno de Puente nace de una **plantilla/regla** identificada por `promptId` — el
modelo de datos ya lo exige (`ConversationMessage.promptId`, `Models.kt:66`). El brief §8 lo pide con
esas palabras: *"Debe sentirse humana. No formulario. No ChatGPT."* La forma de conseguirlo sin IA es
un **guion ramificado por reglas**, no un modelo de lenguaje.

## 2. Alcance

### Dentro
- `feature:conversation`: pantalla de conversación (turnos del joven y de Puente, entrada «Hoy…»,
  envío, historial local persistido).
- **Chequeo contextual** guiado: una pregunta cada vez, con chips de opción (brief §9), cubriendo de
  forma progresiva las dimensiones del brief: cómo se siente · sueño · soledad · acoso · violencia ·
  conflicto familiar · escuela · apoyo disponible · consumo de sustancias cuando corresponda ·
  seguridad personal.
- **Selección de plantilla por reglas deterministas** (sin IA): dado el estado de la conversación y
  las respuestas previas, elegir la siguiente pregunta y el siguiente turno de Puente.
- Persistencia real consumiendo `TASK-003b` (el contenido sobrevive al reinicio).
- Encuadre de transparencia al entrar (brief §7 etapa 1): qué es Puente, qué no es, qué se guarda.

### Fuera
- Señales, mapa de situación y nivel de atención → `TASK-005`.
- Herramientas breves → `TASK-006a`.
- Resumen compartible, consentimiento y solicitud → `TASK-007`.
- **Cualquier llamada de red.** `:feature:conversation` no depende de `:core:network`.
- Los 7 archivos compartidos: se **declaran**, no se editan.
- `core/designsystem/**`: si falta un componente, se pide.

## 3. Módulo y propiedad

- Módulo: `feature:conversation`
- Dueño: **B**
- Archivos compartidos que necesita **declarar** (no editar):
  1. `settings.gradle.kts` → `include(":feature:conversation")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:conversation"))`
  3. `PuenteJovenNavHost.kt` → sustituir los 2 placeholders (`ConversationRoute`, `ContextCheckRoute`)
  4. `feature/home/HomeScreen.kt` → entrada de la Ruta A (brief §6)
  5. `Repositories.kt` / `LocalPuenteRepository.kt` → **sin cambios** (los contratos ya existen)
  6. `AppDestination.kt` → **sin cambios** (las rutas ya existen)

## 4. Contratos de datos

**Consume** (ya existen, no se modifican):

| Interfaz | Métodos |
|---|---|
| `ConversationRepository` | `observeActiveConversation()`, `startConversation()`, `appendYouthMessage(conversationId, content)`, `appendPuenteMessage(conversationId, content, promptId)`, `closeConversation(conversationId)` |
| `ContextCheckRepository` | `availableQuestionKeys()`, `recordResponse(questionKey, optionKey, conversationId)`, `observeResponses()` |

**Métodos nuevos que necesita:** **ninguno.** Es una tarea de UI + reglas sobre contratos existentes.
Esto es deliberado: si necesitara un método nuevo, `TASK-004` no podría compilar hasta que A lo
publicara, y eso rompería la vía paralela de la Ola 1.

**Decisión de diseño — dónde vive el guion.** El **texto** de las preguntas y opciones **no** está en
el contrato (`availableQuestionKeys()` devuelve solo claves). El catálogo
(`QuestionKey` → texto de pregunta + opciones + siguiente clave) vive en `feature:conversation` como
**fixture versionado** + `strings.xml`. Razón: el copy es de producto (regla de la casa #2) y el
contrato de datos debe quedar libre de texto visible. Se declara en `NECESIDADES.md` la **versión**
del catálogo para que A pueda correlacionarla con `rulesetVersion` si lo pide (§9 Q1).

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un turno escrito por el joven y la respuesta de Puente **sobreviven al reinicio del proceso** (cerrar la app y reabrir muestra el mismo historial) | instrumentada (o unitaria sobre `LocalPuenteRepository` con DataStore real) |
| 2 | Ningún turno de Puente se puede crear sin `promptId` | unitaria: `appendPuenteMessage(..., promptId = "")` devuelve `UiError.Validation` |
| 3 | El chequeo muestra **una sola pregunta** a la vez y no avanza sin respuesta | revisión visual + instrumentada |
| 4 | Existe al menos una clave de catálogo por cada dimensión del brief §9 (9 dimensiones) | unitaria: `availableQuestionKeys()` cubre el conjunto de dimensiones |
| 5 | Ningún texto del catálogo contiene términos clínicos ni diagnósticos (revisión contra la lista prohibida de `PR-001` §15) | revisión de contenido |
| 6 | **Cero literales de copy en Kotlin**: todo texto visible sale de `strings.xml` | `grep` de literales en `feature/conversation/**` + revisión |
| 7 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |
| 8 | La conversación no se envía a ningún sitio: no hay serialización de `Conversation` a JSON/DTO en el módulo | `grep` + revisión |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **#3 — la IA no diagnostica; sin chat generativo libre** | Cada turno de Puente viene de una plantilla con `promptId`; no hay modelo de lenguaje en el camino |
| **#1 — lenguaje de prioridad, nunca diagnóstico** | El copy del chequeo pregunta por hechos (*"¿Esto está ocurriendo seguido?"*), no por cuadros clínicos |
| **#7 — privacidad** | La conversación es local; no sale del dispositivo. `PR-001` P6: *"no se comparte la conversación completa con nadie"* |
| **`PR-001` P9 — no se generan respuestas abiertas en crisis** | El guion es cerrado; si el joven declara peligro inmediato, la conversación deriva a la ruta de `TASK-005`/`TASK-007`, no improvisa |
| **Regla de la casa #2** | Copy en `strings.xml`, identificadores en inglés |
| **`TASK-021` §5.1** | El chat es el activo más sensible; sin Auto Backup, cifrado local, retención por `lastAccessEpochMillis` |

## 7. Referencia visual

- Prototipo: `ConversationScreen.tsx`, `ContextCheckScreen.tsx`.
- Brief §8 (tono: *"Puedes empezar por lo que pasó hoy."* / input «Hoy…») y §9 (chips, no formulario).
- Design system reutilizado: `EditorialHeader`, `PuenteOrb`, `PrimaryAction` / `SecondaryAction` /
  `TertiaryAction`, `PuenteStates` (`LoadingState`/`ErrorState`/`EmptyState`), `SignalChip` (chips de
  opción), `PuenteDimensions` y `PuenteTypography`.
- **No se crea ningún componente nuevo** salvo que A lo autorice.

## 8. Dependencias

- **Bloquea:** `TASK-005` (consume la conversación y las respuestas), `TASK-007` (el resumen se
  construye sobre lo conversado).
- **Bloqueado por:** `TASK-003b` ✅ (persistencia, ya en `main`), `TASK-00A` ✅ (S1), y la decisión de
  A sobre la barra de 5 pestañas (`REVISION-B.md` H1).
- **Specs relacionadas:** `TASK-005`, `TASK-007`, `TASK-021`, `PR-001` §9.

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| Q1 | ¿El catálogo de preguntas comparte versión con `rulesetVersion` de `TASK-005`, o es un catálogo aparte con su propia versión? | A / producto | Trazabilidad del chequeo |
| Q2 | ¿`closeConversation` se llama al salir de la pantalla o solo al terminar la Ruta A? Afecta a la retención, que cuenta desde `lastAccessEpochMillis` | producto | Retención (`TASK-003`) |
| Q3 | ¿La conversación se **reanuda** siempre, o el joven puede empezar una nueva cada vez? `observeActiveConversation()` sugiere una sola activa | producto | UX + modelo |
| Q4 | ¿El encuadre de transparencia (etapa 1 del brief §7) es una pantalla propia o la primera tarjeta de la conversación? | producto | Alcance de esta tarea vs. `onboarding` |
| Q5 | El brief §9 incluye *consumo de sustancias* **«cuando corresponda»**: ¿qué regla decide que corresponde? | clínico / producto | Bloquea el criterio #4 |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
