# PR-009 · Cola de asignación, SLA y trazabilidad

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-008`, `PR-004`, `PR-001` §7–8
**Bloquea a:** `PR-011` (home profesional), `PR-012` (centro de alertas), `PR-015` (timeline)

---

## Contexto

La cola es donde un caso **espera a una persona**. Es la pieza que hace honesto al sistema: si
el APK promete *"una persona lo está revisando"*, esta cola es la que debe poder cumplirlo, y su
SLA es lo que determina si esa promesa es verdad (`PR-001` §8, principio P5).

También es el punto de **trazabilidad operativa**: quién recibió qué, cuándo, cuánto esperó y
quién lo tomó. De aquí se alimentan `PR-011`, `PR-012`, `PR-015` y las métricas de `TASK-020`.

---

## Alcance

### Dentro

- Estados del caso en el lado profesional, distintos de los del joven:

```
RECEIVED → CLASSIFIED → AWAITING_ASSIGNMENT → ASSIGNED → IN_PROGRESS → DERIVED → CLOSED
```

- Temporizadores de **SLA** por categoría, tomados de `PR-001` §7 **[VALIDAR]**:
  - `HIGH`: acuse ≤ 5 min · psicólogo ≤ 30 min;
  - `MEDIUM`: acuse ≤ 4 h · resolución ≤ 24 h.
- Cálculo de **tiempo esperando** en vivo (el `ProCaseScreen` muestra *"Esperando: 1h 24 min"*).
- Marca de **"caso sin responsable"** cuando `AWAITING_ASSIGNMENT` supera el umbral de acuse.
- Registro de **trazabilidad**: cada transición con actor, instante y motivo.
- Estado visible para el **joven** (proyección segura, sin notas internas — guardrail #4 y brief
  §31). Esta proyección es lo que `PR-019` reconcilia con el APK.

### Fuera

- El motor de emparejamiento: `PR-008`.
- La UI de la cola: `PR-012`.
- Las notas internas profesionales: `PR-014` (aquí solo se registra que existen).
- Cualquier dato que llegue al joven más allá de la proyección segura.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/queue`
- Dueño: **C**.

```
enqueue(IngestedReport) -> CaseTicket
acknowledge(caseToken, responderId) -> CaseTicket
take(caseToken, responderId) -> CaseTicket
transition(caseToken, to: CaseState, actor, reasonKey) -> CaseTicket
projectForYouth(caseToken) -> YouthVisibleCaseStatus
```

---

## Contratos de datos

```kotlin
enum class CaseState {
    RECEIVED, CLASSIFIED, AWAITING_ASSIGNMENT, ASSIGNED, IN_PROGRESS, DERIVED, CLOSED
}

data class CaseTicket(
    val caseToken: CaseToken,
    val state: CaseState,
    val category: ProfessionalCategory,
    val proposedAssignee: ResponderId?,   // de PR-008; NO es asignación efectiva
    val assignee: ResponderId?,           // solo tras aceptación humana
    val receivedAtEpochMillis: Long,
    val acknowledgedAtEpochMillis: Long?,
    val takenAtEpochMillis: Long?,
    val slaAckDueAtEpochMillis: Long,
    val slaResolveDueAtEpochMillis: Long,
    val slaBreached: Boolean,
)

/** Proyección SEGURA hacia el joven. Nunca incluye notas internas ni identidad. */
data class YouthVisibleCaseStatus(
    val caseToken: CaseToken,
    val state: CaseState,
    val messageKey: String,               // catálogo: "una persona está revisando tu solicitud"
    val updatedAtEpochMillis: Long,
)
```

**Mapeo a los estados que ya modela el APK** (`SupportRequestState` en `:core:model`):
`QUEUED ↔ AWAITING_ASSIGNMENT`, `ACKNOWLEDGED ↔ ASSIGNED`, `IN_PROGRESS ↔ IN_PROGRESS`,
`CLOSED ↔ CLOSED`. El mapeo vive en `PR-003` (de A) y **no se renombran** los estados del APK:
son contrato estable.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Toda transición genera un evento de trazabilidad con actor e instante | prueba de integración |
| 2 | Un caso `HIGH` sin acuse pasados 5 min queda `slaBreached = true` y visible como *"sin responsable"* | prueba con reloj inyectable |
| 3 | `YouthVisibleCaseStatus` **nunca** contiene `assignee`, `ResponderId` ni notas | prueba de contrato: la serialización no incluye esos campos |
| 4 | Un caso no puede pasar a `ASSIGNED` sin un actor humano identificado | restricción de dominio + prueba |
| 5 | `enqueue` es idempotente por `caseToken` (reintentos no duplican casos) | prueba de idempotencia |
| 6 | El tiempo esperando se calcula desde `receivedAt`, no desde el último evento | prueba unitaria |
| 7 | Un caso `CLOSED` no vuelve a estados anteriores | prueba de máquina de estados |
| 8 | El mapeo a `SupportRequestState` cubre los 7 estados del APK sin huérfanos | prueba de tabla de mapeo |

---

## Guardrails aplicables

- #4 — las notas internas no llegan al joven. Criterio 3.
- #2 — la asignación requiere acto humano. Criterio 4.
- #9 — todo acceso auditado; esta cola es la fuente primaria de la traza.
- P5 (`PR-001` §8) — si el SLA no se puede cumplir, el sistema debe declararlo, no ocultarlo.

---

## Referencia visual

`ProWorkspaceScreen.tsx` (prioridad de hoy, *"Esperando: 18 min"*, *"Responsable: Sin
asignar"*). `ProAlertsScreen.tsx` (filtros *"Sin asignar"*, *"En seguimiento"*).
`ProTimelineScreen.tsx` (*"Caso asignado"* con hora).

---

## Dependencias

- **Bloqueado por:** `PR-008`, `PR-004`, y los tiempos de `PR-001` §7 **[VALIDAR]**.
- **Bloquea a:** `PR-011`, `PR-012`, `PR-015`, y la proyección que `PR-019` devuelve al APK.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| P8 | ¿Existe guardia 24/7? | sin ella, el SLA de `HIGH` no es exigible de noche |
| P9 | ¿Qué ocurre con un ALTO fuera de horario? | define el estado de espera y qué ve el joven |
| — | ¿Los tiempos de `PR-001` §7 se confirman? | hoy son propuesta, no dato clínico |
