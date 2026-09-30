# PR-015 · Timeline operacional y seguimiento

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-013`, `PR-009`, `PR-018`
**Bloquea a:** `PR-017` (métricas de tiempo de respuesta), `PR-020`

---

## Contexto

El brief §26 pide un *"timeline operacional"* que muestre **quién hizo qué, cuándo y qué falta**.
Es la memoria del caso: sin ella, cada profesional que retoma un caso empieza de cero, y la
trazabilidad del guardrail #9 se queda en una base de datos que nadie lee.

El ejemplo del brief es explícito y marca la densidad esperada:

```
13 SEP · 14:10  Registro recibido.
13 SEP · 14:12  Patrón detectado.
13 SEP · 14:14  Alerta amarilla.
13 SEP · 14:20  Resumen autorizado.
13 SEP · 14:21  Solicitud enviada.
13 SEP · 15:05  Caso asignado.
```

---

## Alcance

### Dentro

- Timeline cronológico con **actor, instante y tipo de evento**.
- Eventos automáticos del sistema (registro, patrón, clasificación, alerta, SLA) y **eventos
  humanos** (asignación, acción, valoración, derivación, cierre), visualmente distinguibles.
- Marca de **"qué falta"**: siguiente acción esperada y su vencimiento.
- Filtros por tipo de evento y por actor.
- Vista de *"Seguimientos"* (brief §33) agregada: casos con próximo seguimiento vencido o
  próximo.
- Exportación del historial **con marcas de auditoría** (quién lo generó).

### Fuera

- La proyección hacia el joven: `PR-019`.
- El detalle del caso: `PR-013`.
- Las métricas agregadas: `PR-017`.

---

## Módulo y propiedad

- Módulo: `puente-red/portal/timeline`
- Dueño: **C**.

```
timeline(caseToken, filters) -> List<ActionEvent>
pendingFollowUps(session) -> List<FollowUpItem>
```

---

## Contratos de datos

```kotlin
enum class ActorKind { SYSTEM, HUMAN }
enum class EventType {
    REPORT_RECEIVED, PATTERN_DETECTED, CLASSIFIED, ALERT_RAISED,
    SUMMARY_AUTHORIZED, REQUEST_SENT, CASE_ACKNOWLEDGED, CASE_ASSIGNED,
    ACTION_TAKEN, ASSESSMENT_SAVED, REFERRAL_CREATED, FOLLOWUP_SCHEDULED,
    SLA_BREACHED, CASE_CLOSED,
}

data class ActionEvent(
    val id: EventId,
    val caseToken: CaseToken,
    val type: EventType,
    val actorKind: ActorKind,
    val actorId: ResponderId?,        // null si es SYSTEM
    val occurredAtEpochMillis: Long,
    val labelKey: String,             // catálogo
    val detailKeys: List<String> = emptyList(),
)

data class FollowUpItem(
    val caseToken: CaseToken,
    val nextFollowUpAtEpochMillis: Long,
    val assignee: ResponderId?,
    val overdue: Boolean,
)
```

**Regla:** el timeline es **append-only**. Un evento no se edita ni se borra; una corrección se
registra como evento nuevo. Esto es lo que hace que la traza sea auditable.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Todo evento automático tiene `actorKind = SYSTEM` y `actorId = null` | prueba unitaria |
| 2 | Todo evento humano tiene `actorId` no nulo | restricción de dominio + prueba |
| 3 | El timeline es append-only: no existe endpoint de edición ni borrado | prueba de contrato |
| 4 | La secuencia del brief §26 (registro → patrón → alerta → resumen → solicitud → asignación) se reproduce en orden | prueba de integración con escenario del brief |
| 5 | La vista *"qué falta"* muestra el próximo seguimiento vencido en rojo y con texto | revisión visual + aserción |
| 6 | El timeline no expone notas internas del joven ni contenido del chat | prueba de contrato |
| 7 | La exportación registra quién la generó | prueba de integración con `PR-018` |

---

## Guardrails aplicables

- #9 — *"todo lo que ocurre queda trazado: quién vio qué y cuándo"*. Criterios 1, 2, 3, 7.
- #4 — sin notas internas hacia el joven.
- #5 — el timeline describe acciones, no contenido de la conversación.

---

## Referencia visual

`ProTimelineScreen.tsx` — la secuencia de horas del brief §26. `ProSidebar.tsx` — el ítem
*"Seguimientos"*.

---

## Dependencias

- **Bloqueado por:** `PR-013`, `PR-009`, `PR-018`.
- **Bloquea a:** `PR-017`, `PR-020`.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿Cuánto tiempo se conserva el timeline? | política de retención del portal, no definida |
| — | ¿Un profesional ve el timeline completo de casos que no son suyos? | propuesta: sí, es un equipo; confirmar con la ONG |
