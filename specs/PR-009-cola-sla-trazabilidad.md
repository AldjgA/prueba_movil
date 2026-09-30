# PR-009 · Cola de asignación, SLA y trazabilidad

**Estado:** En revisión
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
| — | ¿`RESUELTO` y `CERRADO` son dos estados o uno? `PR-003` §3.1 los escribe `RESUELTO→CERRADO` | ⏳ aclarar con A |
| — | ¿Los tiempos de `PR-001` §7 se confirman? | ✅ **cerrado**: `PR-001` firmado. Si el clínico ajustó los tiempos, se actualizan aquí |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...`) y pasa lint
- [ ] Pruebas de los 10 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
