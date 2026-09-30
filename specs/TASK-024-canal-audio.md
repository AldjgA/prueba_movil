# TASK-024 · Canal de audio — **BORRADOR CON PUERTA**

**Estado:** 🔒 **Borrador — NO se construye en el MVP**
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 3 (condicional) · **Depende de:** `TASK-016`, `PR-016` (C) · **Bloquea:** —

> ### ⚠️ Esta spec NO se implementa sin una decisión explícita del dueño del producto.
>
> `PLAN-TRABAJO-SDD` §10.1 la marca *"sujeto a decisión"*. `PR-003` §6.2 resuelve que el canal de
> contacto es **baja prioridad, fuera del camino crítico del MVP**, *"candidato a ola posterior a
> `PR-016`"* — es decir, **después** de la tarea 12 de C. Y `PLAN-3-AGENTES.md` la pone como posición
> 14 de la cola de B, **sin marca de bloqueo**, lo que es un error de planificación
> (`REVISION-B.md` H4).
>
> **B no la construye.** Se entrega como borrador con la puerta definida, para que la decisión sea
> informada y no un olvido.

## 1. Contexto

`PR-003` §6.2 compara tres opciones de canal de contacto y **desaconseja** una de ellas:

| Opción | Cómo funciona | Valoración de `PR-003` |
|---|---|---|
| **A. Mensajería en la app** | Hilo mediado y trazable; el profesional inicia, el joven responde | **Recomendada.** No expone datos personales |
| **B. Llamada programada** | Se agenda una franja | Complemento válido |
| **C. Teléfono directo** | Se muestra el número del profesional | **Desaconsejada** |

**Esta tarea es la opción B: canal de audio.** Es decir, **no** la opción recomendada. Eso no la
invalida, pero sí define su naturaleza: es un **complemento**, no el canal principal.

Y hay dos restricciones que la gobiernan:

1. **R1 (`PR-003` §0.2):** el canal **no se abre al aceptar**. Se abre **solo si el psicólogo decide
   comunicarse**. El joven puede tener los datos del profesional (R5) **sin** tener canal.
2. **`PR-001` P5:** el sistema **no puede** ofrecer un canal que no puede atender. **Q8: no hay
   guardia 24/7.** Un canal de audio sin nadie al otro lado es exactamente lo que `PR-001` prohíbe.

## 2. Alcance (si se activa)

### Dentro
- **Módulo** `:core:audit`? **No.** Módulo nuevo por decidir (§9 Q1).
- Coordinación de una **llamada programada**: propuesta de franja por el profesional, aceptación por
  el joven, recordatorio, y registro del resultado.
- **Sin acceso al chat** y **sin revelar la identidad del joven** (`PR-003` §6.3).
- Registro en el registro de eventos adversos (`TASK-017`): la llamada **no** es un evento adverso,
  pero su resultado (realizada / no realizada / sin respuesta) sí es trazabilidad.

### Fuera (explícito y deliberado)
- **Mensajería in-app** (opción A, la recomendada por `PR-003` §6.2). Si el dueño quiere un canal,
  **esa es la que hay que construir primero**, no esta.
- **Teléfono directo** (opción C, desaconsejada).
- **Cualquier forma de audio grabado, transcrito o almacenado.** Guardar audio de un menor es un
  riesgo desproporcionado y no está en ningún contrato del proyecto.
- Cualquier promesa de disponibilidad horaria que no exista.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: **por decidir** (§9 Q1). Candidatos: `feature:sharing` (extiende el estado del caso) o un
  módulo propio `feature:contact`.
- Dueño: **B** (si se activa)
- Compartidos que **declararía**: `AppDestination.kt` (ruta nueva), `PuenteJovenNavHost.kt`,
  `HomeScreen.kt` (entrada desde el estado del caso), `Repositories.kt` (contrato nuevo).

## 4. Contratos de datos (si se activa)

**Consume:** `CaseStatusRepository` (`TASK-016`) — el canal solo existe desde `CONTACTO_HABILITADO`.

**Métodos nuevos que necesitaría:** un contrato `ContactChannelRepository` con propuesta de franja,
aceptación y registro. **No se especifica en detalle a propósito:** detallarlo invitaría a
construirlo sin decisión, que es justo lo que este borrador evita.

## 5. Criterios de aceptación (si se activa)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | El canal **solo** aparece desde `CONTACTO_HABILITADO` (R1): en `ACEPTADO` hay datos del profesional **y ningún canal** | unitaria |
| 2 | **No se graba, transcribe ni almacena audio** en ninguna forma | `grep` de permisos de audio y de APIs de grabación (debe ser 0) |
| 3 | El joven **no revela su identidad** por el canal | revisión |
| 4 | El copy **no promete disponibilidad** que no exista (Q8: sin guardia 24/7) | revisión de contenido |
| 5 | El resultado de la llamada queda trazado en `TASK-017` (realizada / no realizada / sin respuesta) | unitaria |
| 6 | El APK no compila ningún contrato profesional | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **`PR-003` R1** | El canal lo abre el psicólogo, no la aceptación |
| **`PR-003` §6.3** | La app no muestra la identidad del joven hacia el profesional |
| **`PR-001` P5 / `PR-003` §15 / Q8** | Sin guardia 24/7 ⇒ sin promesa de disponibilidad |
| **`TASK-021`** | Un canal de audio es una superficie de exposición nueva; el modelo de amenaza **no la cubre** y habría que ampliarlo |
| **#7 — privacidad** | Sin grabación, sin transcripción, sin almacenamiento de audio |

## 7. Referencia visual

Sin definir. **No se diseña UI para algo que no está decidido construir.**

## 8. Dependencias

- **Bloquea:** nada.
- **Bloqueado por:** `TASK-016`, `PR-016` (C, derivaciones — `PR-003` §6.2 sitúa el canal *"en una ola
  posterior"*), y **la decisión del dueño** (§9 Q1).

## 9. Preguntas abiertas (la puerta)

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **¿Entra el canal de contacto en el MVP?** `PR-003` §6.2 lo pone fuera del camino crítico. Si entra, **¿es la opción A (mensajería, recomendada) o la B (audio)?** | dueño | **Puerta: sin respuesta, esta tarea no existe** |
| Q2 | Si entra: ¿qué módulo? `feature:sharing` o `feature:contact` | A | Arquitectura |
| Q3 | ¿Hay alguna persona real atendiendo ese canal? Sin ella, `PR-001` P5 lo prohíbe | ONG / dueño | Viabilidad |
| Q4 | ¿`TASK-021` debe ampliarse para cubrir el canal antes de construirlo? B sostiene que **sí** | A / dueño | Seguridad |
| Q5 | ¿Por qué audio y no mensajería, si `PR-003` §6.2 recomienda mensajería? Si la razón es la accesibilidad (jóvenes que no escriben), decirlo y documentarlo | dueño | Justificación de producto |

## 10. Definition of Done

- [ ] **Decisión del dueño: ¿entra o no?** (Q1)
- [ ] Si **no** entra: esta spec se marca como **descartada** en `MATRIZ-TRAZABILIDAD.md` y la tarea
      sale de la cola de B
- [ ] Si **entra**: se reescribe como spec completa (no borrador), con las respuestas de Q2–Q5
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
