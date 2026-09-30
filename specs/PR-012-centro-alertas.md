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

- [x] Spec **Aprobada** por otro agente (`REVISION-C.md`)
- [x] Compila y pasa pruebas — backend **231/231** + `tsc` limpio; portal **49/49** + build
- [x] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado — **entregado**
  (`deliverables/PR-012/NECESIDADES.md`); contiene **un hallazgo que afecta a todo el backend**
- [x] Sin secretos ni endpoints hardcodeados
- [x] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)

### Estado de implementación (2026-09-30)

**Implementado** en `backend/src/core/alerts/` y `portal/src/alerts/`. Rutas
`GET /profesional/alertas` y `POST /profesional/casos/:caseToken/tomar`, ambas guardadas.

Lo que hace verificables los criterios:

- **Criterio 2, el decisivo:** hay **dos ejes independientes** — `youthLevel` (`VERDE | AMARILLO |
  ROJO`, reglas del APK) y `category` (`MEDIO | ALTO`, LLM). El filtro `RED` filtra por
  **`youthLevel`**. Se prueba con un caso `ROJO`/`MEDIO` (debe salir en `RED`) y otro
  `AMARILLO`/`ALTO` (no debe salir), y que la fila lleva **los dos ejes separados**.
- **Criterio 5:** el orden es **el mismo código** que `PR-011` (`core/triage/urgency.ts`), y hay
  una prueba que **compara el orden de las dos pantallas** y exige que coincidan.
- **Criterio 6:** los contadores se calculan **antes** de paginar y **después** de aplicar la
  búsqueda, y se prueba que el total de cada filtro coincide con su contador.
- **Criterio 7:** la fila lleva `slaBreached` **y** `pattern.sla_incumplido`; el portal pinta color
  **y** texto, nunca solo color.
- **Criterio 8:** `takeCase` en la cola compone **dos transiciones que ya existen**
  (`EN_COLA → ASIGNADO → ACEPTADO`) y es el **único** camino para tomar un caso: lo usan la lista
  y la ficha (`PR-013`). El identificador del profesional sale de la **sesión**, nunca del cuerpo.

### 🔴 Un hallazgo que afecta a todo el backend

**El backend no comprueba tipos.** Node ejecuta los `.ts` borrando los tipos sin revisarlos, así
que un error de tipos **no falla al construir ni al probar**: se convierte en un bug de ejecución.

Pasó de verdad en esta tarea: en `PR-011` se pasó una tarjeta **sin `severity`** a la comparación
→ `NaN` → `sort` **no ordenó nada**, y los criterios 1 y 2 quedaron sin cumplir sin que nada
fallara. Y al montar el chequeo aparecieron **tres claves duplicadas** en `KEY_TO_FEATURES` (en un
literal de objeto gana la última, así que el catálogo canónico quedaba sobrescrito en silencio).

Se ha añadido `backend/tsconfig.json` y el chequeo **está limpio**. A debe añadir `typescript` +
`@types/node` + un script `typecheck` a su `package.json` y meterlo en el CI (`TASK-014`).

### ⚠️ Dos cosas declaradas, no inventadas

1. **El filtro «Derivados» existe pero devuelve siempre vacío.** No hay estado `DERIVADO` en
   `PR-003` §3.1, y las derivaciones son `PR-016`. El portal lo explica en su estado vacío. **No**
   se ha inventado un estado ni se ha reutilizado `RESUELTO`.
2. **La sesión de demostración no puede tomar casos** (es de solo lectura, `PR-010` criterio 7).
   Es correcto y está probado, pero significa que **la demo no demuestra el criterio 8**: las
   pruebas usan una sesión real.
