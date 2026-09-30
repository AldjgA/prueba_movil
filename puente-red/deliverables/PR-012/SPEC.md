# PR-012 · Centro de alertas con priorización y filtros

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-009`, `PR-010`
**Bloquea a:** `PR-013` (desde aquí se abre la ficha), `PR-017`

---

## Contexto

El home (`PR-011`) responde *"¿qué atiendo ahora?"*. El centro de alertas responde *"¿qué hay
en total, y cómo lo filtro?"*. El brief §23 lo pide explícitamente con filtros:
Todos · Rojo · Amarillo · Sin asignar · En seguimiento · Derivados.

Es también la superficie donde se ejerce la **aceptación del caso** —el acto humano que el
guardrail #2 exige— o donde se delega en la ficha (`PR-013`).

---

## Alcance

### Dentro

- Lista de alertas con los filtros del brief §23.
- Por alerta: **nivel, motivo, patrón, tiempo esperando, responsable, estado**.
- Orden por defecto = urgencia (igual que `PR-011`), no por fecha.
- Búsqueda por `caseToken`.
- Paginación y contadores por filtro.
- Acción *"Tomar caso"* desde la lista (equivale a la de `PR-013`, mismo endpoint).
- Estados vacíos por filtro, honestos (*"No hay alertas rojas sin asignar"*).
- Marca visual de `SLA_BREACHED`.

### Fuera

- El detalle del caso y la valoración profesional: `PR-013`, `PR-014`.
- El timeline: `PR-015`.
- Las derivaciones: `PR-016`.
- Filtros por datos del joven (no existen): solo por metadatos operativos.

---

## Módulo y propiedad

- Módulo: `puente-red/portal/alerts`
- Dueño: **C**.

```
listAlerts(session, filter, page) -> AlertPage
```

---

## Contratos de datos

```kotlin
enum class AlertFilter { ALL, RED, YELLOW, UNASSIGNED, IN_FOLLOWUP, REFERRED }

data class AlertRow(
    val caseToken: CaseToken,
    val category: ProfessionalCategory,
    val youthLevel: AttentionLevel,     // el nivel preliminar del APK, para trazabilidad
    val motiveKey: String,
    val patternKeys: List<String>,
    val waitingSinceEpochMillis: Long,
    val assignee: ResponderId?,
    val state: CaseState,
    val slaBreached: Boolean,
)

data class AlertPage(val rows: List<AlertRow>, val total: Int, val page: Int, val pageSize: Int)
```

**Nota:** `category` (medio/alto, del LLM) y `youthLevel` (verde/amarillo/rojo, de reglas) son
**dos ejes distintos** y la UI debe mostrarlos como tales. Un caso puede ser `RED` para el joven
y `MEDIUM` operativamente. Confundirlos rompe `PLAN-PUENTE-RED.md` §7.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Los 6 filtros del brief §23 existen y devuelven resultados coherentes | prueba de integración por filtro |
| 2 | El filtro `RED` filtra por `youthLevel == RED`, no por `category` | prueba unitaria (distinción de ejes) |
| 3 | `UNASSIGNED` equivale a `assignee == null` | prueba unitaria |
| 4 | Ninguna fila expone identidad del joven | prueba de contrato |
| 5 | El orden por defecto es urgencia, y es estable | prueba de orden |
| 6 | Los contadores por filtro cuadran con la lista | prueba de integración |
| 7 | Un caso `slaBreached` se marca visualmente **y** con texto (no solo color) | revisión visual + aserción de atributo |
| 8 | Tomar caso desde la lista produce el mismo resultado que desde la ficha | prueba de integración |

---

## Guardrails aplicables

- #1 — texto + motivo además del color.
- #2 — la acción *"Tomar caso"* es el acto humano obligatorio.
- #3 — sin identidad del joven.
- Brief §23 — los filtros exactos pedidos.

---

## Referencia visual

`ProAlertsScreen.tsx` — filtros *Todos / Rojo / Amarillo / Sin asignar / En seguimiento /
Derivados*; badge numérico en `ProSidebar.tsx` (*"Alertas · 2"*).

---

## Dependencias

- **Bloqueado por:** `PR-009`, `PR-010`.
- **Bloquea a:** `PR-013`, `PR-017`.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿Se necesita filtro por respondedor ("mis casos")? | útil con más de 3 profesionales; no está en el brief |
| — | ¿Vista tabla o tarjetas? | el brief §34 pide densidad: propuesta, tabla |
