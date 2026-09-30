# PR-009 · Cola de asignación, SLA y trazabilidad

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R1 · **Depende de:** `PR-003` §3, `PR-004`, `PR-008`, `PR-001` §7–8 · **Bloquea:** `PR-011`, `PR-012`, `PR-015`, `PR-019`

---

## 1. Contexto

La cola es donde un caso **espera a una persona**. Es la pieza que hace honesto al sistema: si el
APK promete *"una persona lo está revisando"*, esta cola es la que debe poder cumplirlo, y su SLA
determina si esa promesa es verdad (`PR-001` §8, principio P5).

También es el punto de **trazabilidad operativa**: quién recibió qué, cuándo, cuánto esperó y
quién lo tomó. Alimenta `PR-011`, `PR-012`, `PR-015`, `PR-018` y las métricas de `TASK-020`.

**La máquina de estados no la define C**: `PR-003` §3.1 la fija y este servicio la implementa.

---

## 2. Alcance

### Dentro
- Implementar la máquina de estados de `PR-003` §3.1, **sin traducir los nombres**:

```
RECIBIDO → CLASIFICADO → EN_COLA → ASIGNADO → ACEPTADO → [CONTACTO_HABILITADO] → EN_CURSO → RESUELTO → CERRADO
```

- **SLA** por categoría, según `PR-001` §7 **(firmado 2026-09-30)**: `ALTO` acuse ≤ 5 min ·
  psicólogo ≤ 30 min; `MEDIO` acuse ≤ 4 h · resolución ≤ 24 h.
- **Tiempo esperando** en vivo (`ProCaseScreen`: *"Esperando: 1h 24 min"*).
- Marca de **"caso sin responsable"** cuando `EN_COLA` supera la ventana de acuse.
- **Trazabilidad**: cada transición con actor, instante y motivo → `audit_event` (`PR-004` §4.3).
- **Proyección al joven** (Contrato B, `PR-003` §5), que incluye datos del profesional desde
  `ACEPTADO` y canal solo desde `CONTACTO_HABILITADO`.

### Fuera
- El motor de emparejamiento: `PR-008`.
- La UI de la cola: `PR-012`.
- Las notas internas profesionales: `PR-014`.
- El canal in-app: ola posterior (baja prioridad, R2).
- **Definir** los estados: los define `PR-003` (A).

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/queue`
- Dueño: **C**
- Runtime: **Go** (o Node/Bun)
- **Persistencia: Supabase (Postgres + RLS)**, no un almacén propio (`PR-INFRA` §2)
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type CaseState string
const (
    StateRecibido           CaseState = "RECIBIDO"
    StateClasificado        CaseState = "CLASIFICADO"
    StateEnCola             CaseState = "EN_COLA"
    StateAsignado           CaseState = "ASIGNADO"
    StateAceptado           CaseState = "ACEPTADO"
    StateContactoHabilitado CaseState = "CONTACTO_HABILITADO"
    StateEnCurso            CaseState = "EN_CURSO"
    StateResuelto           CaseState = "RESUELTO"
    StateCerrado            CaseState = "CERRADO"
)

**Semántica de `RESUELTO` y `CERRADO`** — son **dos** estados, aclarado en `REVISION-C.md` §5.1:

| Estado | Significa | Cómo se llega |
|---|---|---|
| `RESUELTO` | El objetivo del caso se cumplió (hubo acompañamiento) | Desde `EN_CURSO` |
| `CERRADO` | Cierre **administrativo**, no necesariamente resuelto | Desde `RESUELTO` **o** sin resolver (revocación del joven / vencimiento) |

Ambos proyectan a `CLOSED` del `SupportRequestState` del APK, con el motivo en `revocationReason`.
**Un caso puede cerrarse sin resolverse** — y eso no es un error, es el camino de la revocación.

type CaseTicket struct {
    CaseToken       string // ULID
    State           CaseState
    Category        *ProfessionalCategory
    ProposedAssignee *string
    Assignee        *string // solo tras aceptación humana
    ReceivedAt      time.Time
    AcknowledgedAt  *time.Time
    AcceptedAt      *time.Time
    SlaAckDueAt     time.Time
    SlaResolveDueAt time.Time
    SlaBreached     bool
}

// Contrato B de PR-003 §5
type YouthVisibleCaseStatus struct {
    CaseToken        string
    ContratoVersion  string
    Estado           CaseState
    Categoria        *ProfessionalCategory
    ActualizadoEn    time.Time
    Psicologo        *PublicProfessional // NO NULO desde ACEPTADO (R5)
    CanalContacto    *string             // "IN_APP"; NO NULO solo desde CONTACTO_HABILITADO (R1)
    MensajesNoLeidos int
}

type PublicProfessional struct { // Contrato C, PR-003 §6.1
    NombreVisible string
    Rol           string
    Especialidad  string
}
```

**Reglas duras:** `Psicologo` es `nil` antes de `ACEPTADO`; `CanalContacto` es `nil` salvo que el
psicólogo lo inicie. La proyección **nunca** incluye estado interno, carga ni notas internas.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | La máquina implementa exactamente los estados de `PR-003` §3.1, sin estados extra | unitaria de tabla de estados |
| 2 | Toda transición genera un `audit_event` con actor e instante | integración con `PR-004` §4.3 |
| 3 | `GET /joven/casos/{token}` **no** devuelve `Psicologo` antes de `ACEPTADO` | contrato (coincide con `PR-004` criterio 4) |
| 4 | `CanalContacto` es `nil` hasta `CONTACTO_HABILITADO` | contrato |
| 5 | Caso `ALTO` sin acuse pasada la ventana → `SlaBreached` y *"sin responsable"* | unitaria con reloj inyectable |
| 6 | No se pasa a `ACEPTADO` sin actor humano identificado | unitaria de dominio |
| 7 | `enqueue` es idempotente por `Idempotency-Key` | unitaria (coincide con `PR-004` criterio 2) |
| 8 | Un caso `CERRADO` no vuelve a estados anteriores | unitaria de máquina de estados |
| 9 | La proyección nunca contiene estado interno, carga ni notas | contrato |
| 10 | `contratoVersion` viaja en toda respuesta | contrato |

---

## 6. Guardrails aplicables

- **`PR-003` §9.5** — el joven no ve datos del profesional antes de `ACEPTADO`. Criterio 3.
- **`PR-003` §9.6** — sin canal salvo iniciativa del psicólogo. Criterio 4.
- #4 — las notas internas no llegan al joven. Criterio 9.
- #2 — la asignación requiere acto humano. Criterio 6.
- **`PR-003` §15** — **sin guardia 24/7**: el SLA de `ALTO` es objetivo **en horario**. Fuera de
  horario el caso queda `EN_COLA` y el joven ve emergencia + números reales. La cola marca
  `fuera_de_horario` para que `PR-011`/`PR-012` no pinten un SLA incumplido como si hubiera alguien.

---

## 7. Referencia visual

`ProWorkspaceScreen.tsx` (*"Esperando: 18 min"*, *"Responsable: Sin asignar"*).
`ProAlertsScreen.tsx` (filtros *"Sin asignar"*, *"En seguimiento"*).
`ProTimelineScreen.tsx` (*"Caso asignado"*).

---

## 8. Dependencias

- **Bloquea:** `PR-011`, `PR-012`, `PR-015`, `PR-019`.
- **Bloqueado por:** `PR-003` §3 ✅, `PR-004` ✅ (decisiones cerradas), `PR-008`.
  `PR-001` §7 ✅ **firmado** (2026-09-30).
- **Specs relacionadas:** `PR-004`, `PR-018`.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿`RESUELTO` y `CERRADO` son dos estados o uno? | ✅ **cerrado** (`REVISION-C.md` §5.1): son **dos**; `CERRADO` puede alcanzarse sin `RESUELTO` |
| — | ¿Los tiempos de `PR-001` §7 se confirman? | ✅ **cerrado**: `PR-001` firmado. Si el clínico ajustó los tiempos, se actualizan aquí |

---

## 10. Definition of Done

- [x] Spec **Aprobada** por otro agente (`REVISION-C.md`)
- [x] Compila y pasa pruebas — `npm test`: **114/114 en verde** (30 de este módulo)
- [x] Pruebas de los 10 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado — **entregado**
  (`deliverables/PR-009/NECESIDADES.md`); contiene **un hueco de contrato declarado**
- [x] Sin secretos ni endpoints hardcodeados
- [x] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)

### Estado de implementación (2026-09-30)

**Implementado** en `puente-red/backend/core/queue/` (dueño: C), Node ≥ 22.18, sin dependencias
ni build step. **Cierra la ola R1.**

Lo que hace verificables los criterios:

- **Actor humano (criterio 6):** `accept` exige `Actor.HUMAN` con identificador no vacío. Se
  prueba que el **sistema** no puede aceptar, y que el caso se queda en `ASIGNADO`.
- **Proyección (criterios 3, 4 y 9):** `YouthVisibleCaseStatus` tiene **ocho campos exactos**,
  verificado con `Object.keys` y con una búsqueda de fugas por nombre de campo
  (`proposedAssignee`, `idempotencyKey`, `openCases`, `internalNotes`…). Se recorre el camino
  `RECIBIDO → ASIGNADO` comprobando que `psicologo` es `null` en **todos** ellos.
- **SLA (criterio 5):** reloj inyectado; se comprueba el límite a los 4 y a los 6 minutos en un
  `ALTO`, que el SLA **se recalcula** al clasificar, y que **fuera de horario el reloj no corre**.
- **Idempotencia (criterio 7):** dos envíos con la misma clave producen **un** caso y **un**
  evento de auditoría.
- **Terminalidad (criterio 8):** se recorre `CERRADO` contra los 9 estados y se comprueba que
  ninguno es alcanzable. Además, se cierra un caso desde **cada** estado no terminal (revocación).
- **Auditoría (criterio 2):** toda transición deja evento con actor e instante; una transición
  **rechazada no deja evento**.
- **`contratoVersion` (criterio 10):** viaja en la proyección y es configurable.

### 🐛 Un problema de modelado que detectaron las pruebas

El canal de contacto **no puede deducirse del estado**. El psicólogo puede trabajar el caso
(`EN_CURSO`) sin haber abierto nunca el canal in-app, porque el canal es **baja prioridad**
(`PR-003` §6.2, R2). Se corrigió con un **hecho explícito**
(`contactChannelOpenedAtEpochMillis`): deducirlo del estado daba canal a quien no lo abrió. Al
cerrar el caso, el canal deja de estar disponible.

### ⚠️ Hueco de contrato declarado, no inventado

`PR-003` §3.1 **no define el flujo de rechazo**: si un profesional asignado rechaza el caso,
`ASIGNADO` no tiene vuelta a `EN_COLA`. No se ha inventado una transición; está declarado en
`deliverables/PR-009/NECESIDADES.md` §7.2 con una propuesta.
