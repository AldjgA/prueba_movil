# Plantilla de NECESIDADES — declaración de un agente a A

**Tarea:** `TASK-00A` · **Formato oficial** de `CONTRATO-DE-INTEGRACION.md` §2
**Uso:** copiar a `puente-joven-android/deliverables/<TASK-ID>/NECESIDADES.md` y rellenar.

> Un agente **no edita** los archivos de A. Los **declara** aquí, y A los aplica.
> Si una necesidad no está declarada, **no existe**: A no adivina.

---

## Qué NO se declara

- Nada de tu propio módulo `feature:<tu-módulo>/**`: eso es tuyo y lo editas tú.
- Nada del **diseño** de tu pantalla: eso va en tu spec, no aquí.

## Qué SÍ se declara (todo lo que toca a A)

| Sección | Cuándo se rellena |
|---|---|
| 1. Módulo nuevo | Si creas un `feature:*` que hay que `include(...)` |
| 2. Dependencia de build | Siempre que haya módulo nuevo |
| 3. Ruta nueva en el NavHost | Si tu pantalla se navega |
| 4. Entrada desde Home | Si el joven llega a tu pantalla desde Inicio |
| 5. Métodos de repositorio | Si consumes uno existente o necesitas uno nuevo |
| 6. Componentes del design system | Si `core/designsystem` no tiene lo que necesitas |
| 7. Otros | Permisos, flags, migraciones, cambios en el contrato |

Si una sección no aplica, escribe **`—` y el motivo**. No la dejes vacía.

---

## Plantilla (copiar desde aquí)

```markdown
# NECESIDADES — <TASK-ID>

**Agente:** <B|C> · **Fecha:** YYYY-MM-DD · **Spec:** specs/<archivo>.md

## 1. Módulo nuevo
:feature:conversation

## 2. Dependencia de build (la aplica A)
implementation(project(":feature:conversation"))

## 3. Ruta nueva en el NavHost
ConversationRoute → ConversationScreen(navigator)

## 4. Entrada desde Home
Tarjeta "Me está pasando algo" → ConversationRoute

## 5. Métodos de repositorio
- ConversationRepository.startConversation()                        [existente]
- ConversationRepository.appendYouthMessage(conversationId, texto)  [existente]
- YouthRepository.observeProfiles()                                 [existente]

## 6. Componentes del design system
- (si falta alguno, se pide; NO se improvisa uno nuevo)

## 7. Otros (permisos, flags, migraciones)
—
```

---

## Ejemplo relleno: `TASK-004` (conversación)

Así se ve una declaración real, para que sirva de referencia:

```markdown
# NECESIDADES — TASK-004

**Agente:** B · **Fecha:** 2026-09-30 · **Spec:** specs/TASK-004-conversacion.md

## 1. Módulo nuevo
:feature:conversation

## 2. Dependencia de build (la aplica A)
implementation(project(":feature:conversation"))

## 3. Ruta nueva en el NavHost
ConversationRoute → ConversationScreen(navigator)
ContextCheckRoute(conversationId) → ContextCheckScreen(navigator, conversationId)

## 4. Entrada desde Home
Tarjeta "Me está pasando algo" → ConversationRoute

## 5. Métodos de repositorio
- ConversationRepository.observeActiveConversation()                [existente]
- ConversationRepository.startConversation()                        [existente]
- ConversationRepository.appendYouthMessage(...)                    [existente]
- ConversationRepository.appendPuenteMessage(...)                   [existente]
- ContextCheckRepository.availableQuestionKeys()                    [existente]
- ContextCheckRepository.recordResponse(...)                        [existente]
- YouthRepository.observeSessionUnlocked()                          [existente]

## 6. Componentes del design system
— (el design system está congelado y ya cubre chat + formularios)

## 7. Otros
— (el contenido se cifra solo: no hay que pedir nada)
```

> Fíjate en que **ningún método es nuevo**: `TASK-003b` y `TASK-025` ya dejaron los contratos
> listos. Ese es el estado deseable: cuanto menos declares, menos esperas.
