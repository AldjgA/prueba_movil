# PR-011 · Home profesional — "¿Qué necesita nuestra atención ahora?"

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-009`, `PR-010`, `PR-012` · **Bloquea:** `PR-017`

---

## 1. Contexto

El brief §22 fija la primera pregunta del panel: *"¿Qué necesita nuestra atención ahora?"*. No es
un dashboard decorativo: es un **triaje de la mañana** para un equipo pequeño que debe decidir en
qué gasta su tiempo hoy.

La decisión **D4** subió este home al MVP: sin él, el nivel rojo no tiene dónde aterrizar.

---

## 2. Alcance

### Dentro
- **Prioridad de hoy**, en este orden:
  1. casos `ALTO` esperando (con tiempo esperando en vivo);
  2. casos **sin responsable** (`EN_COLA` pasada la ventana de acuse);
  3. casos `MEDIO` con **cambio importante** observado;
  4. **SLA en riesgo** o incumplido.
- Tarjeta por caso: `caseToken` (`PJ-0XX`), categoría, motivo en una línea, patrón observado,
  tiempo esperando, responsable y CTA.
- CTA primaria *"Revisar ahora"* / *"Revisar"*.
- Estado vacío honesto: *"No hay nada que requiera atención ahora"*, con hora de actualización.
- Actualización en vivo de los tiempos esperando.
- Contadores: casos esperando, sin responsable, cambios importantes.

### Fuera
- La lista completa y los filtros: `PR-012`.
- El detalle del caso: `PR-013`.
- Métricas agregadas y tendencias: `PR-017`.
- Cualquier dato identificable del joven (no existe en el portal).

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/home`
- Dueño: **C**
- Stack: **TypeScript + React + Vite** (`PR-000` §3); tokens propios, **no** `core/designsystem`
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type AttentionReason string
const (
    ReasonHighWaiting     AttentionReason = "HIGH_WAITING"
    ReasonUnassigned      AttentionReason = "UNASSIGNED"
    ReasonImportantChange AttentionReason = "IMPORTANT_CHANGE"
    ReasonSlaAtRisk       AttentionReason = "SLA_AT_RISK"
    ReasonSlaBreached     AttentionReason = "SLA_BREACHED"
)

type AttentionCard struct {
    CaseToken        string
    Category         ProfessionalCategory
    Reason           AttentionReason
    MotiveKey        string   // catálogo: "Seguridad prioritaria", "Patrón creciente"
    PatternKeys      []string // "Aislamiento ↑", "4 registros / 14 días"
    WaitingSince     time.Time
    Assignee         *string  // nil ⇒ "Sin asignar"
    State            CaseState
    OutOfHours       bool     // PR-003 §15: sin guardia 24/7
}

type TodayBoard struct {
    Cards               []AttentionCard // por urgencia, no por fecha
    WaitingCount        int
    UnassignedCount     int
    ImportantChangeCount int
    GeneratedAt         time.Time
}
```

**Orden:** por `Reason` (severidad) y, dentro de cada grupo, por tiempo esperando descendente.
**Nunca** por fecha de creación: un rojo de hace 10 minutos va antes que un amarillo de ayer.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un caso `ALTO` sin responsable aparece siempre primero | unitaria de orden |
| 2 | Un caso `SLA_BREACHED` aparece aunque sea antiguo | unitaria |
| 3 | El tiempo esperando se actualiza sin recargar la página | instrumentada / integración |
| 4 | El estado vacío se muestra cuando no hay tarjetas, con hora de generación | revisión visual |
| 5 | Ninguna tarjeta contiene nombre, alias ni identidad del joven | contrato sobre el payload |
| 6 | El home respeta la autorización por rol (`PR-010`) | autorización |
| 7 | El contador de *"sin responsable"* coincide con `PR-009` | integración |
| 8 | Fuera de horario, la tarjeta marca `OutOfHours` y **no** pinta SLA incumplido | revisión visual + unitaria |

---

## 6. Guardrails aplicables

- `PR-001` §2 — la categoría se muestra con texto y motivo, nunca solo color (brief §13 aplica
  igual en el panel: `ROJO` no aparece desnudo).
- #2 — el home informa; tomar el caso es humano (`PR-013`).
- **`PR-003` §9.7** — el profesional nunca ve identidad del joven.
- **D4** — el home es MVP, no fase posterior.
- **`PR-003` §15** — sin guardia 24/7. Criterio 8.
- `PR-003` Q7 — demo sin datos: el **estado vacío es el caso normal**.

---

## 7. Referencia visual

`ProWorkspaceScreen.tsx` — *"¿Qué necesita nuestra atención ahora?"*, tarjetas `PJ-047 ROJO /
Seguridad prioritaria / Esperando: 18 min / Responsable: Sin asignar / Revisar ahora` y
`PJ-032 AMARILLO / Cambio observado: Aislamiento ↑ / 4 registros / 14 días / Revisar`.

---

## 8. Dependencias

- **Bloquea:** `PR-017`.
- **Bloqueado por:** `PR-009`, `PR-010`, `PR-012`.
- **Specs relacionadas:** `PR-012` (centro de alertas).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Cuántas tarjetas antes de paginar? | propuesta: 10 + "ver todas" hacia `PR-012` |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`npm run build`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
