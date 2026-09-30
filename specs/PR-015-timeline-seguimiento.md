# PR-015 · Timeline operacional y seguimiento

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-003` §3, `PR-004` §4.3, `PR-009`, `PR-013`, `PR-018` · **Bloquea:** `PR-017`, `PR-020`

---

## 1. Contexto

El brief §26 pide un *"timeline operacional"* que muestre **quién hizo qué, cuándo y qué falta**.
Es la memoria del caso: sin ella, cada profesional que retoma un caso empieza de cero, y la
trazabilidad del guardrail #9 se queda en una base de datos que nadie lee.

El ejemplo del brief marca la densidad esperada:

```
13 SEP · 14:10  Registro recibido.
13 SEP · 14:12  Patrón detectado.
13 SEP · 14:14  Alerta amarilla.
13 SEP · 14:20  Resumen autorizado.
13 SEP · 14:21  Solicitud enviada.
13 SEP · 15:05  Caso asignado.
```

---

## 2. Alcance

### Dentro
- Timeline cronológico con **actor, instante y tipo de evento**.
- Eventos automáticos del sistema y **eventos humanos** (asignación, acción, valoración,
  derivación, cierre), visualmente distinguibles.
- Marca de **"qué falta"**: siguiente acción esperada y su vencimiento.
- Filtros por tipo de evento y por actor.
- Vista *"Seguimientos"* (brief §33) agregada: casos con próximo seguimiento vencido o próximo.
- Exportación del historial **con marcas de auditoría** (quién lo generó).

### Fuera
- La proyección hacia el joven: `PR-019`.
- El detalle del caso: `PR-013`.
- Las métricas agregadas: `PR-017`.
- Contenido del chat o notas internas: el timeline describe **acciones**, no contenido.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/timeline`
- Dueño: **C**
- Stack: **TypeScript + React + Vite**; persistencia en **Supabase**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type ActorKind string // SYSTEM | HUMAN

type EventType string
const (
    // Alineados a PR-003 §3.1
    EventRecibido           EventType = "RECIBIDO"
    EventClasificado        EventType = "CLASIFICADO"
    EventEnCola             EventType = "EN_COLA"
    EventAsignado           EventType = "ASIGNADO"
    EventAceptado           EventType = "ACEPTADO"
    EventContactoHabilitado EventType = "CONTACTO_HABILITADO"
    EventEnCurso            EventType = "EN_CURSO"
    EventResuelto           EventType = "RESUELTO"
    EventCerrado            EventType = "CERRADO"
    // Eventos de soporte
    EventPatronDetectado    EventType = "PATRON_DETECTADO"
    EventAlertaEmitida      EventType = "ALERTA_EMITIDA"
    EventResumenAutorizado  EventType = "RESUMEN_AUTORIZADO"
    EventSolicitudEnviada   EventType = "SOLICITUD_ENVIADA"
    EventAccionRealizada    EventType = "ACCION_REALIZADA"
    EventValoracionGuardada EventType = "VALORACION_GUARDADA"
    EventDerivacionCreada   EventType = "DERIVACION_CREADA"
    EventSeguimientoProgramado EventType = "SEGUIMIENTO_PROGRAMADO"
    EventSlaIncumplido      EventType = "SLA_INCUMPLIDO"
)

type ActionEvent struct {
    ID        string
    CaseToken string
    Type      EventType
    ActorKind ActorKind
    ActorID   *string // nil si SYSTEM
    OccurredAt time.Time
    LabelKey  string
    DetailKeys []string
}

type FollowUpItem struct {
    CaseToken        string
    NextFollowUpAt   time.Time
    Assignee         *string
    Overdue          bool
}
```

**Regla:** el timeline es **append-only**. Un evento no se edita ni se borra; una corrección se
registra como evento nuevo. Es lo que hace la traza auditable.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Todo evento automático tiene `ActorKind = SYSTEM` y `ActorID = nil` | unitaria |
| 2 | Todo evento humano tiene `ActorID` no nulo | unitaria de dominio |
| 3 | El timeline es append-only: no existe endpoint de edición ni borrado | contrato |
| 4 | La secuencia del brief §26 se reproduce en orden | integración con escenario del brief |
| 5 | La vista *"qué falta"* muestra el próximo seguimiento vencido en rojo **y** con texto | revisión visual + aserción |
| 6 | El timeline no expone notas internas ni contenido del chat | contrato |
| 7 | La exportación registra quién la generó | integración con `PR-018` |
| 8 | Los `EventType` cubren todos los estados de `PR-003` §3.1 sin huérfanos | unitaria de tabla |

---

## 6. Guardrails aplicables

- **#11 / `PR-003` §9.9** — *"todo cambio de estado queda auditado"*. Criterios 1, 2, 3, 7.
- #4 — sin notas internas hacia el joven.
- **`PR-003` §9.2** — el timeline describe acciones, no contenido de la conversación.
- `PR-004` §4.3 — la tabla de eventos es `audit_event`, sin contenido sensible.

---

## 7. Referencia visual

`ProTimelineScreen.tsx` — la secuencia de horas del brief §26. `ProSidebar.tsx` — el ítem
*"Seguimientos"*.

---

## 8. Dependencias

- **Bloquea:** `PR-017`, `PR-020`.
- **Bloqueado por:** `PR-003` §3 ✅, `PR-004` §4.3 ✅, `PR-009`, `PR-013`, `PR-018`.
- **Specs relacionadas:** `PR-013` (sección 7 de la ficha).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Cuánto tiempo se conserva el timeline? | política de retención del portal, no definida |
| — | ¿Un profesional ve el timeline completo de casos que no son suyos? | propuesta: sí, es un equipo; confirmar con la ONG |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`npm run build`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
