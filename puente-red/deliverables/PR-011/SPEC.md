# PR-011 · Home profesional — "¿Qué necesita nuestra atención ahora?"

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-009` (cola y SLA), `PR-012` (alertas), `PR-010` (sesión)
**Bloquea a:** `PR-017` (observatorio toma sus agregados del mismo modelo)
**Reconciliado:** 2026-09-30 — tres cambios:
1. Los estados del tablero son los de `PR-003` §3.1 (`RECIBIDO`…`CERRADO`).
2. **Sin guardia 24/7** (`PR-003` §15, Q8): fuera de horario el tablero marca `fuera_de_horario` y **no** pinta un SLA incumplido como si hubiera alguien disponible.
3. La demo opera **sin datos** (`PR-003` Q7): el **estado vacío es el caso normal** y debe verse bien, con hora de generación.

---

## Contexto

El brief §22 fija la primera pregunta del panel: *"¿Qué necesita nuestra atención ahora?"*.
No es un dashboard decorativo: es un **triaje de la mañana** para un equipo pequeño que debe
decidir en qué gasta su tiempo hoy.

La decisión **D4** subió este home al MVP: sin él, el nivel rojo no tiene dónde aterrizar.

---

## Alcance

### Dentro

- **Prioridad de hoy** con, en este orden:
  1. casos `HIGH` esperando (con tiempo esperando en vivo);
  2. casos **sin responsable** (`AWAITING_ASSIGNMENT` pasada la ventana de acuse);
  3. casos `MEDIUM` con **cambio importante** observado;
  4. **SLA en riesgo** o incumplido.
- Tarjeta por caso con: `caseToken` (`PJ-0XX`), categoría, motivo en una línea, patrón
  observado, tiempo esperando, responsable y CTA.
- CTA primaria *"Revisar ahora"* / *"Revisar"*.
- Estado vacío honesto: *"No hay nada que requiera atención ahora"*, con la hora de última
  actualización.
- Actualización en vivo de los tiempos esperando.
- Contadores de cabecera: casos esperando, sin responsable, cambios importantes.

### Fuera

- La lista completa y los filtros: `PR-012`.
- El detalle del caso: `PR-013`.
- Métricas agregadas y tendencias: `PR-017`.
- Cualquier dato identificable del joven: no existe en el portal (guardrail #3).

---

## Módulo y propiedad

- Módulo: `puente-red/portal/home`
- Dueño: **C**.

```
attentionNow(session) -> TodayBoard
```

---

## Contratos de datos

```kotlin
enum class AttentionReason { HIGH_WAITING, UNASSIGNED, IMPORTANT_CHANGE, SLA_AT_RISK, SLA_BREACHED }

data class AttentionCard(
    val caseToken: CaseToken,
    val category: ProfessionalCategory,
    val reason: AttentionReason,
    val motiveKey: String,          // catálogo: "Seguridad prioritaria", "Patrón creciente"
    val patternKeys: List<String>,  // "Aislamiento ↑", "4 registros / 14 días"
    val waitingSinceEpochMillis: Long,
    val assignee: ResponderId?,     // null ⇒ "Sin asignar"
    val state: CaseState,
)

data class TodayBoard(
    val cards: List<AttentionCard>, // ordenadas por urgencia, no por fecha
    val waitingCount: Int,
    val unassignedCount: Int,
    val importantChangeCount: Int,
    val generatedAtEpochMillis: Long,
)
```

**Orden:** por `AttentionReason` (severidad) y, dentro de cada grupo, por tiempo esperando
descendente. **Nunca** por fecha de creación: un rojo de hace 10 minutos va antes que un
amarillo de ayer.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un caso `HIGH` sin responsable aparece siempre primero | prueba unitaria de orden |
| 2 | Un caso `SLA_BREACHED` aparece aunque sea antiguo | prueba unitaria |
| 3 | El tiempo esperando se actualiza sin recargar la página | prueba de UI/integración |
| 4 | El estado vacío se muestra cuando no hay tarjetas, con hora de generación | revisión visual |
| 5 | Ninguna tarjeta contiene nombre, alias ni identidad del joven | prueba de contrato sobre el payload |
| 6 | El home respeta la autorización por rol (`PR-010`) | prueba de autorización |
| 7 | El contador de *"sin responsable"* coincide con `PR-009` | prueba de integración |

---

## Guardrails aplicables

- #1 — la categoría se muestra con texto y motivo, nunca solo color. El brief §13 aplica igual
  en el panel: `ROJO` no aparece desnudo.
- #2 — el home informa; el acto de tomar el caso es humano (`PR-013`).
- #3 — el profesional nunca ve identidad.
- D4 — el home es MVP, no fase posterior.

---

## Referencia visual

`ProWorkspaceScreen.tsx` — *"¿Qué necesita nuestra atención ahora?"*, tarjetas `PJ-047 ROJO /
Seguridad prioritaria / Esperando: 18 min / Responsable: Sin asignar / Revisar ahora` y
`PJ-032 AMARILLO / Cambio observado: Aislamiento ↑ / 4 registros / 14 días / Revisar`.

---

## Dependencias

- **Bloqueado por:** `PR-009` (cola y SLA), `PR-010` (sesión y rol).
- **Bloquea a:** `PR-017` (el observatorio agrega lo mismo).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿Cuántas tarjetas antes de paginar? | propuesta: 10 + "ver todas" hacia `PR-012` |
| P9 | ¿Un caso ALTO fuera de horario aparece igual o con marca de "fuera de horario"? | honestidad de cobertura (`PR-001` §8) |
