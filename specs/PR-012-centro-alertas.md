# PR-012 · Centro de alertas con priorización y filtros

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-009`, `PR-010` · **Bloquea:** `PR-013`, `PR-017`

---

## 1. Contexto

El home (`PR-011`) responde *"¿qué atiendo ahora?"*. El centro de alertas responde *"¿qué hay en
total y cómo lo filtro?"*. El brief §23 lo pide con filtros: Todos · Rojo · Amarillo · Sin
asignar · En seguimiento · Derivados.

Es también la superficie donde se ejerce la **aceptación del caso** —el acto humano que el
guardrail #2 exige— o donde se delega en la ficha (`PR-013`).

---

## 2. Alcance

### Dentro
- Lista de alertas con los filtros del brief §23.
- Por alerta: **nivel, motivo, patrón, tiempo esperando, responsable, estado**.
- Orden por defecto = urgencia (igual que `PR-011`), no por fecha.
- Búsqueda por `caseToken`.
- Paginación y contadores por filtro.
- Acción *"Tomar caso"* desde la lista (mismo endpoint que `PR-013`).
- Estados vacíos por filtro, honestos.
- Marca visual de `SlaBreached`.

### Fuera
- El detalle del caso y la valoración profesional: `PR-013`, `PR-014`.
- El timeline: `PR-015`.
- Las derivaciones: `PR-016`.
- Filtros por datos del joven (no existen): solo por metadatos operativos.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/alerts`
- Dueño: **C**
- Stack: **TypeScript + React + Vite**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type AlertFilter string
const (
    FilterAll        AlertFilter = "ALL"
    FilterRed        AlertFilter = "RED"
    FilterYellow     AlertFilter = "YELLOW"
    FilterUnassigned AlertFilter = "UNASSIGNED"
    FilterInFollowup AlertFilter = "IN_FOLLOWUP"
    FilterReferred   AlertFilter = "REFERRED"
)

type AlertRow struct {
    CaseToken      string
    Category       ProfessionalCategory // MEDIO | ALTO (LLM)
    YouthLevel     string               // VERDE | AMARILLO | ROJO (reglas del APK)
    MotiveKey      string
    PatternKeys    []string
    WaitingSince   time.Time
    Assignee       *string
    State          CaseState
    SlaBreached    bool
}

type AlertPage struct {
    Rows     []AlertRow
    Total    int
    Page     int
    PageSize int
}
```

**Nota crítica:** `Category` (MEDIO/ALTO, del LLM) y `YouthLevel` (VERDE/AMARILLO/ROJO, de reglas
del APK) son **dos ejes distintos** y la UI debe mostrarlos como tales. Un caso puede ser `ROJO`
para el joven y `MEDIO` operativamente. Confundirlos rompe `PLAN-PUENTE-RED.md` §7.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Los 6 filtros del brief §23 existen y devuelven resultados coherentes | integración por filtro |
| 2 | El filtro `RED` filtra por `YouthLevel == ROJO`, **no** por `Category` | unitaria (distinción de ejes) |
| 3 | `UNASSIGNED` equivale a `Assignee == nil` | unitaria |
| 4 | Ninguna fila expone identidad del joven | contrato |
| 5 | El orden por defecto es urgencia, y es estable | unitaria de orden |
| 6 | Los contadores por filtro cuadran con la lista | integración |
| 7 | Un caso `SlaBreached` se marca visualmente **y** con texto (no solo color) | revisión visual + aserción |
| 8 | Tomar caso desde la lista produce el mismo resultado que desde la ficha | integración |

---

## 6. Guardrails aplicables

- `PR-001` §2 — texto + motivo además del color.
- #2 — la acción *"Tomar caso"* es el acto humano obligatorio.
- **`PR-003` §9.7** — sin identidad del joven.
- Brief §23 — los filtros exactos pedidos.
- **`PR-003` §9.4** — la categoría nunca se degrada; el filtro `RED` refleja el nivel de origen.

---

## 7. Referencia visual

`ProAlertsScreen.tsx` — filtros *Todos / Rojo / Amarillo / Sin asignar / En seguimiento /
Derivados*; badge numérico en `ProSidebar.tsx` (*"Alertas · 2"*).

---

## 8. Dependencias

- **Bloquea:** `PR-013`, `PR-017`.
- **Bloqueado por:** `PR-009`, `PR-010`.
- **Specs relacionadas:** `PR-011`, `PR-013`.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Se necesita filtro por respondedor ("mis casos")? | útil con más de 3 profesionales; no está en el brief |
| — | ¿Vista tabla o tarjetas? | el brief §34 pide densidad: propuesta, tabla |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`npm run build`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
