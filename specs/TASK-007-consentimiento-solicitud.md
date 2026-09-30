# TASK-007 · Consentimiento, resumen compartible y solicitud de apoyo

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-006b`, `PR-001` §7–§8 · **Bloquea:** `TASK-015`, `TASK-016`

> ⚠️ **Bloqueada parcialmente por firma clínica.** `PR-001` §7 (quién responde y en cuánto tiempo) y
> §8 (cobertura real) son la fuente de verdad, pero `REVISION-C.md` §5.5 confirma que la firma vive
> **fuera del repositorio** y que A no sabe si el clínico ajustó valores. Esta spec **referencia**
> §7/§8 y **no los reestatea**. Ver §9 Q1.

## 1. Contexto

Esta es **la tarea de privacidad del producto**. Todo lo demás se puede corregir; si esta falla, se
comparte algo que un adolescente no autorizó, y el proyecto pierde su razón de ser.

El brief §17 fija el flujo: *"NO compartir conversación completa."* → *"Preparemos lo necesario para
pedir ayuda."* → mostrar situación, cambios observados, frecuencia, impacto, apoyo disponible →
**el adolescente revisa** → Editar / Autorizar / Cancelar → *"Solo después de AUTORIZAR el caso entra
en Puente Red."*

El repositorio ya tiene el contrato correcto y bien pensado:

- `ShareableSummary.scope` es el **único lugar de verdad** de lo autorizado, y es un **conjunto
  cerrado** de `ShareScopeEntry` (sealed interface: añadir un tipo obliga a una decisión de producto).
- `ConsentRecord` usa **el mismo tipo cerrado**, de modo que el invariante
  **`consent.scope ⊆ summary.scope`** es codificable y comprobable.
- `SupportRequest` modela el estado visible al joven con 7 estados estables y un
  `revocationReason` aparte, para no confundir «cerrado por el equipo» con «retiré mi consentimiento».

**Esta tarea no inventa nada de eso: lo hace cumplir en la UI y lo prueba.**

## 2. Alcance

### Dentro
- `feature:sharing`: tres pantallas.
  1. **Revisar resumen** (`SummaryReviewRoute`): qué se comparte y qué no, con Editar / Autorizar /
     Cancelar (brief §17).
  2. **Consentimiento** (`ConsentRoute(summaryId)`): registro explícito y específico de esa versión
     del resumen.
  3. **Estado de la solicitud** (`SupportRequestStatusRoute(requestId)`): los 7 estados de
     `SupportRequestState`, con `stateNote` y `revocationReason` en el copy correcto.
- **Revocación** del consentimiento y de la solicitud, con el copy que distingue *"revocar futuros
  accesos"* de *"eliminar lo que una obligación legal deba conservar"* (`RevocationReason`).
- **Solicitudes de acceso al chat** (`ChatAccessRepository`): el joven ve el alcance exacto que se le
  pide (`ChatAccessScope.TimeRange` o `.Messages`), con propósito visible, y acepta / rechaza /
  revoca. En el MVP **es solo contrato**: la app muestra estado y revoca, **nunca habilita acceso al
  chat desde Android** (la KDoc de la interfaz lo dice explícitamente).
- Cálculo y presentación del **estado seguro** para el joven, sin notas internas (guardrail #6).

### Fuera
- La generación del paquete de alerta roja y su encolado → `TASK-015`.
- El estado del caso en la API Joven (`psicologo`, `canalContacto`) → `TASK-016`.
- La clasificación medio/alto → `PR-005` (C).
- El acceso efectivo al chat: lo aplica el servidor, no el APK.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:sharing`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:sharing")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:sharing"))`
  3. `PuenteJovenNavHost.kt` → 3 placeholders (`SummaryReviewRoute`, `ConsentRoute`,
     `SupportRequestStatusRoute`)
  4. `feature/home/HomeScreen.kt` → sin entrada directa (se llega desde el nivel y el recorrido)
  5. `Repositories.kt` → **posible** método nuevo: ver §4
  6. `AppDestination.kt` → sin cambios

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `SharingRepository` | `buildShareableSummary(scope, note)`, `observeSummaries()`, `recordConsent(summaryId, scope, granted)`, `observeConsents()` |
| `SupportRepository` | `draftRequest(consentRecordId, summaryId)`, `authorizeRequest(requestId)`, `revokeRequest(requestId)`, `observeRequest(requestId)`, `observeRequests()` |
| `ChatAccessRepository` | `observeChatAccessRequests()`, `observeGrants()`, `acceptRequest(requestId)`, `declineRequest(requestId)`, `revokeGrant(grantId)` |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- `SupportRepository.updateRequestState(requestId, state, stateNote): AppResult<SupportRequest>`
  — **`[nuevo]`**. Motivo: el brief §17 exige que el joven **revise y edite** el resumen antes de
  autorizar, y el estado `DRAFT → AUTHORIZED` ya está cubierto por `authorizeRequest`. Pero el brief
  §17 también pide **«Editar»**: si editar el resumen cambia su `scope`, hace falta **reconstruir el
  resumen y volver a consentir** (no se puede ampliar en silencio). La alternativa sin método nuevo
  es: editar ⇒ `buildShareableSummary` con nuevo `scope` ⇒ nuevo `ConsentRecord` ⇒ `draftRequest`
  otra vez, **descartando la solicitud anterior**. **B prefiere esta segunda** porque no toca el
  contrato y hace imposible el camino inseguro. **Lo declaro como decisión, no como necesidad**, para
  que A lo ratifique.
- **Sin** otros métodos nuevos.

**Invariante que esta tarea debe hacer imposible de violar en la UI:**
`consent.scope ⊆ summary.scope`. La UI **no puede** ofrecer un control que permita consentir más de
lo resumido: el `scope` del consentimiento se **deriva** del `scope` del resumen, no se elige aparte.
Si `recordConsent` devuelve `UiError.Authorization`, la UI lo trata como un fallo de producto, no
como un error de usuario.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | **Sin consentimiento no hay solicitud**: `draftRequest` con un `consentRecordId` inexistente o no otorgado devuelve fallo y **no** crea `SupportRequest` | unitaria (prueba negativa) |
| 2 | **`consent.scope ⊆ summary.scope`** se rechaza cuando se intenta ampliar: `recordConsent` con un elemento fuera del resumen devuelve `UiError.Authorization` y **no** amplía en silencio | unitaria (prueba negativa) |
| 3 | El joven ve el **alcance exacto** de una solicitud de acceso al chat (rango temporal o ids concretos) **antes** de decidir, con el propósito visible | instrumentada |
| 4 | **Rechazar** una solicitud de acceso **no crea** ningún `ChatAccessGrant` | unitaria (prueba negativa) |
| 5 | Revocar produce el **copy correcto** según `revocationReason` (los 3 casos: retiré mi consentimiento / cerró el equipo / venció la ventana) | instrumentada |
| 6 | La pantalla de estado **no muestra** notas internas ni el estado interno del caso: solo `stateNote` y `state` | revisión + `grep` (sin referencias a `Puente Red`, panel profesional o carga del profesional) |
| 7 | El **chat completo nunca entra** en el resumen: no existe ninguna ruta de código que copie `Conversation.messages` a un `ShareableSummary` | `grep` + revisión de código |
| 8 | El consentimiento y la solicitud **sobreviven al reinicio** | unitaria sobre `LocalPuenteRepository` |
| 9 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 10 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **#7 / `PR-001` P6 — no se comparte la conversación completa** | Criterio #7. Es la frontera que `ShareScopeEntry` protege por diseño |
| **`PR-001` P7 — el joven autoriza antes de que salga nada** | Criterio #1 |
| **Invariante 1 de `PR-003` §9** | `consent.scope ⊆ summary.scope` |
| **#6 — el APK no expone el panel profesional** | Criterio #6; `ChatAccessRequest.caseId` es opaco y **no** habilita navegación a Red |
| **`PR-001` §9 — qué ve el joven cuando el reporte se envía** | *"Que una persona lo está revisando; nunca notas internas"* |
| **`PR-003` §6.3 — lo que la app NO muestra nunca** | Estado interno del caso, carga del profesional, identidad del joven hacia el profesional |
| **`PR-003` §10 / `PR-001` §10** | El flujo **no depende de la red** para funcionar: consentir y solicitar es local |
| **`TASK-021` §5.1** | El resumen es el artefacto que más daño haría en manos de un familiar: alcance mínimo por defecto (`ShareDefaults`), sin Auto Backup |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Brief §17 (revisar → Editar / Autorizar / Cancelar).
- Design system: `SummaryCard` (el resumen por secciones), `PuenteSwitch` (qué se comparte y qué no),
  `InfoBadge` (encuadre de prioridad preliminar), `EditorialHeader`, `PuenteActions`,
  `PuenteStates`.
- **`PuenteSwitch` es el control de la selección de `scope`.** Si falta un control para el rango
  temporal del `ChatAccessScope`, **se pide a A**.

## 8. Dependencias

- **Bloquea:** `TASK-015` (el paquete de alerta roja consume resumen + consentimiento),
  `TASK-016` (el estado del caso es la continuación de esta pantalla).
- **Bloqueado por:** `TASK-006b` (el reporte personal es la base del resumen), `PR-001` §7/§8
  (firma clínica → Q1).
- **Specs relacionadas:** `TASK-015`, `TASK-016`, `TASK-018` (suite de seguridad: los 3 invariantes
  de esta spec son casos de prueba obligatorios), `PR-003` §4–§6, `PR-019` (C, revocación
  cross-producto).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **Qué promete el flujo.** `PR-001` §7 (SLAs por categoría) y §8 (cobertura) son vinculantes, pero si el clínico los ajustó al firmar hay que publicarlos. La pantalla **no puede** prometer un tiempo que no se cumple (P5) | clínico / dueño | **Bloquea el copy de la pantalla de estado** |
| Q2 | ¿«Editar» el resumen **descarta** la solicitud anterior, o la mantiene en borrador hasta autorizar la nueva versión? | producto | Modelo de estados |
| Q3 | ¿El joven puede tener **varias** solicitudes simultáneas (p. ej. una por cada resumen)? `observeRequests()` devuelve lista, pero el brief §17 sugiere un flujo único | producto | UX |
| Q4 | ¿`ChatAccessPurpose` tiene copy en `strings.xml`? Hoy usa `labelResKey` pero no vi el recurso creado | A / B | Criterio #9 |
| Q5 | La revocación: `PR-019` (C) la trata como cross-producto. ¿Quién es dueño del copy de revocación, el APK o el portal? Debe ser **el mismo texto** en los dos | A | Consistencia |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 resuelta** por el clínico (no por un agente)
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluidas las **4 pruebas negativas** (#1, #2,
      #4 y la de #7)
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
