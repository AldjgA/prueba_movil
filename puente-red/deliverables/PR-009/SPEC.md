# PR-009 · Cola de asignación, SLA y trazabilidad

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-008`, `PR-004`, `PR-003` §3 (máquina de estados), `PR-001` §7–8
**Bloquea a:** `PR-011` (home profesional), `PR-012` (centro de alertas), `PR-015` (timeline), `PR-019`
**Reconciliado:** 2026-09-30 con `PR-003` §3/§5/§15 y `PR-004` §4

---

## Contexto

La cola es donde un caso **espera a una persona**. Es la pieza que hace honesto al sistema: si
el APK promete *"una persona lo está revisando"*, esta cola es la que debe poder cumplirlo, y su
SLA determina si esa promesa es verdad (`PR-001` §8, principio P5).

También es el punto de **trazabilidad operativa**: quién recibió qué, cuándo, cuánto esperó y
quién lo tomó. Alimenta `PR-011`, `PR-012`, `PR-015`, `PR-018` y las métricas de `TASK-020`.

**Cambio de fondo respecto de la revisión 1:** la máquina de estados ya **no la define C**.
`PR-003` §3.1 la fija, y este servicio la implementa.

---

## Alcance

### Dentro

- Implementar la **máquina de estados de `PR-003` §3.1** (nombres en español, sin traducción):

```
RECIBIDO → CLASIFICADO → EN_COLA → ASIGNADO → ACEPTADO → [CONTACTO_HABILITADO] → EN_CURSO → RESUELTO → CERRADO
```

- **Temporizadores de SLA** por categoría (`PR-001` §7 **[VALIDAR]**):
  - `ALTO`: acuse ≤ 5 min · psicólogo ≤ 30 min;
  - `MEDIO`: acuse ≤ 4 h · resolución ≤ 24 h.
- **Cálculo de tiempo esperando** en vivo (`ProCaseScreen` muestra *"Esperando: 1h 24 min"*).
- Marca de **"caso sin responsable"** cuando `EN_COLA` supera la ventana de acuse.
- Registro de **trazabilidad**: cada transición con actor, instante y motivo → `audit_event`
  (`PR-004` §4.3).
- **Proyección al joven** (Contrato B de `PR-003` §5), que ahora **sí** incluye datos del
  profesional desde `ACEPTADO`.

### Fuera

- El motor de emparejamiento: `PR-008`.
- La UI de la cola: `PR-012`.
- Las notas internas profesionales: `PR-014`.
- El canal in-app: `PR-016` y la ola posterior (baja prioridad, R2).
- **Definir** los estados: los define `PR-003` (A). C los implementa.

---

## ⚠️ Cambios que introduce la revisión 2

| # | Antes (revisión 1) | Ahora | Origen |
|---|---|---|---|
| 1 | Estados en inglés (`RECEIVED`…) | **Estados de `PR-003` §3.1** en español | `PR-003` §3.1 |
| 2 | `YouthVisibleCaseStatus` **nunca** exponía datos del profesional | **Sí los expone desde `ACEPTADO`** (`psicologo`), y `canalContacto` **solo** desde `CONTACTO_HABILITADO` | `PR-003` §5–§7 (R1/R5) |
| 3 | SLA asumía cobertura | **No hay guardia 24/7** (Q8): el SLA de `ALTO` no es exigible fuera de horario | `PR-003` §15 |
| 4 | `caseToken` sin formato | **ULID** | `PR-004` §3 |
| 5 | Sin versionado de contrato | `contratoVersion` viaja en cada petición/respuesta | `PR-003` §8 |

---

## Módulo y propiedad

- Módulo: `puente-red/backend/core/queue` (dueño: **C**)
- Runtime: **Go** (o Node/Bun) — `PR-INFRA` §3
- **Persistencia: Supabase (Postgres + RLS)**, no un almacén propio (`PR-INFRA` §2)

```
enqueue(IngestedReport) -> CaseTicket
acknowledge(caseToken, responderId) -> CaseTicket
take(caseToken, responderId) -> CaseTicket      // EN_COLA|ASIGNADO -> ACEPTADO
transition(caseToken, to: CaseState, actor, reasonKey) -> CaseTicket
projectForYouth(caseToken) -> YouthVisibleCaseStatus
```

---

## Contratos de datos

```go
type CaseState string

const (
    StateRecibido          CaseState = "RECIBIDO"
    StateClasificado       CaseState = "CLASIFICADO"
    StateEnCola            CaseState = "EN_COLA"
    StateAsignado          CaseState = "ASIGNADO"
    StateAceptado          CaseState = "ACEPTADO"
    StateContactoHabilitado CaseState = "CONTACTO_HABILITADO"
    StateEnCurso           CaseState = "EN_CURSO"
    StateResuelto          CaseState = "RESUELTO"
    StateCerrado           CaseState = "CERRADO"
)

type CaseTicket struct {
    CaseToken      string       // ULID
    State          CaseState
    Category       *ProfessionalCategory // nil hasta CLASIFICADO
    ProposedAssignee *string    // de PR-008; NO es asignación efectiva
    Assignee       *string      // solo tras aceptación humana
    ReceivedAt     time.Time
    AcknowledgedAt *time.Time
    AcceptedAt     *time.Time
    SlaAckDueAt    time.Time
    SlaResolveDueAt time.Time
    SlaBreached    bool
}

// Contrato B de PR-003 §5. Proyección SEGURA hacia el joven.
type YouthVisibleCaseStatus struct {
    CaseToken      string
    ContratoVersion string
    Estado         CaseState
    Categoria      *ProfessionalCategory
    ActualizadoEn  time.Time
    Psicologo      *PublicProfessional   // NO NULO desde ACEPTADO (R5)
    CanalContacto  *string               // "IN_APP"; NO NULO solo desde CONTACTO_HABILITADO (R1)
    MensajesNoLeidos int
}

// Datos públicos del profesional — Contrato C de PR-003 §6.1.
type PublicProfessional struct {
    NombreVisible string
    Rol           string // psicologo | trabajador_social | orientador | supervisor
    Especialidad  string
}
```

**Reglas duras (invariantes `PR-003` §9):**
- `Psicologo` es `nil` **antes** de `ACEPTADO`. Criterio 3.
- `CanalContacto` es `nil` salvo que el **psicólogo lo inicie**. Que el joven vea los datos
  **no** le da canal. Criterio 4.
- La proyección **nunca** incluye estado interno, carga del profesional ni notas internas
  (`PR-003` §6.3).

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | La máquina implementa exactamente los estados de `PR-003` §3.1, sin estados extra | prueba de tabla de estados |
| 2 | Toda transición genera un `audit_event` con actor e instante | prueba de integración con `PR-004` §4.3 |
| 3 | `GET /joven/casos/{token}` **no** devuelve `psicologo` antes de `ACEPTADO` | prueba de contrato (coincide con `PR-004` criterio 4) |
| 4 | `canalContacto` es `nil` hasta `CONTACTO_HABILITADO` | prueba de contrato |
| 5 | Un caso `ALTO` sin acuse pasada la ventana queda `SlaBreached` y visible como *"sin responsable"* | prueba con reloj inyectable |
| 6 | Un caso no puede pasar a `ACEPTADO` sin un actor humano identificado | restricción de dominio + prueba |
| 7 | `enqueue` es idempotente por `Idempotency-Key` (reintentos offline no duplican) | prueba de idempotencia (coincide con `PR-004` criterio 2) |
| 8 | Un caso `CERRADO` no vuelve a estados anteriores | prueba de máquina de estados |
| 9 | La proyección nunca contiene estado interno, carga ni notas | prueba de contrato |
| 10 | `contratoVersion` viaja en toda respuesta | prueba de contrato |

---

## Guardrails aplicables

- #4 — las notas internas no llegan al joven. Criterio 9.
- #2 — la asignación requiere acto humano. Criterio 6.
- **#3 nuevo** — el joven ve los datos del profesional **desde `ACEPTADO`**, no antes. Criterio 3.
- **#4 nuevo** — el canal no se abre con la aceptación. Criterio 4.
- **#12 nuevo** — **sin guardia 24/7**: el SLA de `ALTO` no se promete de noche. Ver más abajo.
- P5 (`PR-001` §8) — si el SLA no se puede cumplir, el sistema lo declara.

### Nota sobre SLA y horario (Q8 resuelto)

`PR-003` §15 confirma que **no hay guardia 24/7**. Por lo tanto:

- El SLA de `ALTO` (30 min) es un **objetivo en horario**, no una promesa de 24 horas.
- Fuera de horario, el caso queda `EN_COLA` y la app del joven muestra **emergencia + números de
  crisis reales**, sin prometer contacto inmediato.
- La cola debe marcar `fuera_de_horario` para que `PR-011` y `PR-012` no pinten un SLA
  incumplido como si hubiera alguien disponible.

---

## Referencia visual

`ProWorkspaceScreen.tsx` (*"Esperando: 18 min"*, *"Responsable: Sin asignar"*),
`ProAlertsScreen.tsx` (filtros *"Sin asignar"*, *"En seguimiento"*), `ProTimelineScreen.tsx`
(*"Caso asignado"*).

---

## Dependencias

- **Bloqueado por:** `PR-003` §3 ✅ y `PR-004` ✅ (publicados por A).
- **Bloqueado por:** los tiempos de `PR-001` §7 **[VALIDAR]** (sin firma clínica).
- **Bloquea a:** `PR-011`, `PR-012`, `PR-015`, `PR-019`.

---

## Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| P8 | ¿Guardia 24/7? | ✅ **resuelto: no existe** (`PR-003` §15) |
| P9 | ¿Caso ALTO fuera de horario? | ✅ **resuelto**: emergencia + números reales, sin promesa de contacto |
| — | ¿Los tiempos de `PR-001` §7 se confirman? | ⏳ propuesta, no dato clínico |
| — | ¿`RESUELTO` es un estado distinto de `CERRADO` o un alias? | ⏳ aclarar con A (el diagrama de `PR-003` los escribe como `RESUELTO→CERRADO`) |
