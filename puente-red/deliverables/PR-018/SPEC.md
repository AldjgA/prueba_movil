# PR-018 · Auditoría, trazabilidad y cumplimiento (quién vio qué y cuándo)

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-010`, `PR-009`, `PR-013`, `PR-014`, `PR-015`, `PR-016`
**Bloquea a:** `PR-020`, `TASK-020` (dimensión *Implementación*), cumplimiento legal
**Reconciliado:** 2026-09-30 — (1) el log es la tabla **`audit_event`** definida por `PR-004` §4.3 (quién / cuándo / qué caso / qué acción, **sin** contenido sensible); (2) toda lectura de **`caso_correlacion`** se audita (`PR-004` §4.2); (3) la separación de acceso se apoya en **RLS de Supabase**, no en el código (`PR-INFRA` §2); (4) se añade el evento de **login de profesional** vía Supabase Auth (`PR-010`).

---

## Contexto

El resumen ejecutivo §4 lo pide literalmente: *"con registro de quién consultó cada caso"*.
El guardrail #9 lo eleva a principio: *"todo lo que ocurre queda trazado: quién vio qué y
cuándo"*.

Y hay una razón legal dura: se están tratando datos de **menores** en situación de riesgo, en
Bolivia. `PLAN-PUENTE-RED.md` §6 P11 pregunta quién es el responsable legal del tratamiento —esa
pregunta sigue abierta—, pero con independencia de la respuesta, un sistema sin auditoría no es
defendible ante una familia, una ONG ni una autoridad.

Esta spec es transversal: la auditoría no es una pantalla, es una propiedad del sistema.

---

## Alcance

### Dentro

- **Registro de acceso a casos**: quién, qué caso, qué secciones vio, cuándo.
- **Registro de escritura**: quién escribió valoración, notas, derivación, y cuándo.
- **Registro de autenticación**: logins, fallos, cierres, revocaciones (`PR-010`).
- **Registro de decisiones automatizadas**: clasificación (`PR-005`), extracción (`PR-006`),
  propuesta de asignación (`PR-008`), con sus versiones.
- **Inmutabilidad**: el log es *append-only*; no se edita ni se borra desde la aplicación.
- **Retención** explícita y política de purga, con reloj inyectable (mismo patrón que
  `RetentionRepository` del APK).
- **Sin contenido sensible**: un evento nunca guarda texto del chat, notas internas ni el
  resumen autorizado. Guarda **referencias y metadatos**, igual que
  `metadataWithoutSensitiveContent` en el APK.
- **Visor de auditoría** para `SUPERVISION` (brief §33, *"Configuración"* y el log).
- **Exportación** para una autoridad competente, con marca de quién exportó.

### Fuera

- La proyección hacia el joven: `PR-019`.
- El timeline visible del caso: `PR-015` (es una vista de negocio; la auditoría es la capa
  probatoria, distinta y más completa).
- Cualquier análisis agregado: `PR-017`.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/audit` + `puente-red/portal/audit`
- Dueño: **C**.

```
record(AuditEvent) -> Unit                    // solo escritura, sin lectura de contenido
query(session, filters) -> List<AuditEvent>   // solo SUPERVISION
purgeExpired(nowEpochMillis) -> PurgeResult
```

---

## Contratos de datos

```kotlin
enum class AuditAction {
    LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT,
    CASE_VIEWED, CASE_SECTION_VIEWED,
    ASSESSMENT_SAVED, NOTE_WRITTEN,
    CASE_TAKEN, STATE_CHANGED,
    REFERRAL_CREATED, REFERRAL_ADVANCED,
    AUTOMATED_DECISION_RECORDED,
    EXPORT_GENERATED, CONSENT_REVOKED,
}

data class AuditEvent(
    val id: AuditEventId,
    val action: AuditAction,
    val actorKind: ActorKind,            // SYSTEM | HUMAN
    val actorId: ResponderId?,           // null si SYSTEM
    val caseToken: CaseToken?,           // referencias, no contenido
    val sectionKey: String?,             // p. ej. "section6_authorized_summary"
    val automatedVersionRef: VersionRef?,// modelVersion/promptVersion/engineVersion
    val occurredAtEpochMillis: Long,
    val metadataWithoutSensitiveContent: Map<String, String>,
)
```

**Regla de oro:** si un campo pudiera contener texto del joven, no se guarda aquí. La auditoría
prueba **que** se accedió, no **qué** se leyó.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Toda lectura de un caso genera un `CASE_VIEWED` con actor e instante | prueba de integración por endpoint |
| 2 | Toda escritura profesional genera un evento | prueba de integración |
| 3 | Toda decisión automatizada registra su `VersionRef` | prueba de integración |
| 4 | El log es append-only: no hay endpoint de edición ni borrado | prueba de contrato |
| 5 | Ningún evento contiene texto del chat, notas internas ni el resumen | prueba de contrato: búsqueda de subcadenas prohibidas |
| 6 | Solo `SUPERVISION` puede consultar el log | prueba de autorización |
| 7 | La purga respeta la política y es demostrable con reloj inyectable | prueba unitaria |
| 8 | Un export registra quién lo generó y con qué filtros | prueba de integración |
| 9 | Es imposible acceder a un caso sin generar evento (no hay ruta sin auditoría) | prueba de contrato sobre el router |

---

## Guardrails aplicables

- **#9 — quién vio qué y cuándo.** Es literalmente el objeto de esta spec.
- #3 — el log nunca contiene identidad del joven (no existe en el portal).
- #5 — nunca guarda el chat.
- P10 (`PR-001`) — *"todo lo que ocurre queda trazado"*.
- P11 — pendiente de responsable legal; la política de retención debe aprobarla una persona.

---

## Referencia visual

`ProSidebar.tsx` — *"Configuración"*. No hay pantalla de auditoría en el prototipo: **es una
pantalla nueva** y debe extender el lenguaje visual (brief §37), no inventar uno.

---

## Dependencias

- **Bloqueado por:** `PR-010` (identidad de actor), y por el resto del portal para tener qué
  auditar.
- **Bloquea a:** `PR-020`, `TASK-020` (dimensión de implementación), cumplimiento legal.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| **P11** | ¿Quién es el responsable legal del tratamiento de datos de menores en Bolivia? | define la política de retención y el formato de export |
| — | ¿Cuánto tiempo se conserva la auditoría? | propuesta: más que el contenido; confirmar |
| — | ¿El joven puede solicitar saber quién accedió a su caso? | derecho de acceso; hoy no está modelado |
