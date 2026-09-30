# PR-018 · Auditoría, trazabilidad y cumplimiento (quién vio qué y cuándo)

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R3 · **Depende de:** `PR-004` §4.3, `PR-009`, `PR-010`, `PR-013`, `PR-014`, `PR-015`, `PR-016` · **Bloquea:** `PR-020`, `TASK-020`

---

## 1. Contexto

El resumen ejecutivo §4 lo pide literalmente: *"con registro de quién consultó cada caso"*. El
guardrail #9 lo eleva a principio: *"todo lo que ocurre queda trazado: quién vio qué y cuándo"*.

Hay además una razón legal dura: se tratan datos de **menores** en situación de riesgo, en Bolivia.
`PLAN-PUENTE-RED.md` §6 P11 pregunta quién es el responsable legal —esa pregunta sigue abierta—,
pero con independencia de la respuesta, un sistema sin auditoría no es defendible ante una familia,
una ONG ni una autoridad.

**La auditoría no es una pantalla: es una propiedad del sistema.**

---

## 2. Alcance

### Dentro
- **Registro de acceso a casos**: quién, qué caso, qué secciones vio, cuándo.
- **Registro de escritura**: quién escribió valoración, notas, derivación, y cuándo.
- **Registro de autenticación**: logins, fallos, cierres, revocaciones (`PR-010`, Supabase Auth).
- **Registro de decisiones automatizadas**: clasificación (`PR-005`), extracción (`PR-006`),
  propuesta de asignación (`PR-008`), con sus versiones.
- **Inmutabilidad**: el log es *append-only*; no se edita ni se borra desde la aplicación.
- **Retención** explícita y política de purga, con reloj inyectable (mismo patrón que
  `RetentionRepository` del APK).
- **Sin contenido sensible**: un evento nunca guarda texto del chat, notas internas ni el resumen
  autorizado. Guarda **referencias y metadatos** (`metadataWithoutSensitiveContent` en el APK).
- **Visor de auditoría** para `SUPERVISION`.
- **Exportación** para autoridad competente, con marca de quién exportó.

### Fuera
- La proyección hacia el joven: `PR-019`.
- El timeline visible del caso: `PR-015` (vista de negocio; la auditoría es la capa probatoria,
  distinta y más completa).
- Cualquier análisis agregado: `PR-017`.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/audit` + `puente-red/portal/audit`
- Dueño: **C**
- **Persistencia:** tabla **`audit_event`** de `PR-004` §4.3, en **Supabase**, con **RLS**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type AuditAction string
const (
    ActionLoginSuccess        AuditAction = "LOGIN_SUCCESS"
    ActionLoginFailure        AuditAction = "LOGIN_FAILURE"
    ActionLogout              AuditAction = "LOGOUT"
    ActionCaseViewed          AuditAction = "CASE_VIEWED"
    ActionCaseSectionViewed   AuditAction = "CASE_SECTION_VIEWED"
    ActionAssessmentSaved     AuditAction = "ASSESSMENT_SAVED"
    ActionNoteWritten         AuditAction = "NOTE_WRITTEN"
    ActionCaseTaken           AuditAction = "CASE_TAKEN"
    ActionStateChanged        AuditAction = "STATE_CHANGED"
    ActionReferralCreated     AuditAction = "REFERRAL_CREATED"
    ActionReferralAdvanced    AuditAction = "REFERRAL_ADVANCED"
    ActionAutomatedDecision   AuditAction = "AUTOMATED_DECISION_RECORDED"
    ActionExportGenerated     AuditAction = "EXPORT_GENERATED"
    ActionConsentRevoked      AuditAction = "CONSENT_REVOKED"
    ActionCorrelationRead     AuditAction = "CORRELATION_READ" // PR-004 §4.2
)

type AuditEvent struct {
    ID            string
    Action        AuditAction
    ActorKind     string  // SYSTEM | HUMAN
    ActorID       *string // nil si SYSTEM
    CaseToken     *string
    SectionKey    *string
    AutomatedVersionRef *VersionRef // modelVersion/promptVersion/engineVersion
    OccurredAt    time.Time
    MetadataWithoutSensitiveContent map[string]string
}
```

**Regla de oro:** si un campo pudiera contener texto del joven, **no se guarda aquí**. La
auditoría prueba **que** se accedió, no **qué** se leyó.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Toda lectura de un caso genera `CASE_VIEWED` con actor e instante | integración por endpoint |
| 2 | Toda escritura profesional genera un evento | integración |
| 3 | Toda decisión automatizada registra su `VersionRef` | integración |
| 4 | El log es append-only: no hay endpoint de edición ni borrado | contrato |
| 5 | Ningún evento contiene texto del chat, notas internas ni el resumen | contrato: búsqueda de subcadenas prohibidas |
| 6 | Solo `SUPERVISION` puede consultar el log | autorización |
| 7 | La purga respeta la política y es demostrable con reloj inyectable | unitaria |
| 8 | Un export registra quién lo generó y con qué filtros | integración |
| 9 | Es imposible acceder a un caso sin generar evento | contrato sobre el router |
| 10 | Toda lectura de `caso_correlacion` deja un `CORRELATION_READ` | integración con `PR-004` §4.2 |
| 11 | El acceso al log está aislado por **RLS** | RLS |

---

## 6. Guardrails aplicables

- **#9 / `PR-003` §9.9`** — quién vio qué y cuándo. Es el objeto de esta spec.
- **`PR-003` §9.7`** — el log nunca contiene identidad del joven (no existe en el portal).
- **`PR-003` §9.2`** — nunca guarda el chat.
- P10 (`PR-001`) — *"todo lo que ocurre queda trazado"*.
- P11 — la política de retención debe aprobarla una persona.
- `PR-INFRA` §6 — sin PII de menores en los logs.

---

## 7. Referencia visual

`ProSidebar.tsx` — *"Configuración"*. **No hay pantalla de auditoría en el prototipo**: es una
pantalla nueva y debe **extender** el lenguaje visual (brief §37), no inventar uno.

---

## 8. Dependencias

- **Bloquea:** `PR-020`, `TASK-020`, cumplimiento legal.
- **Bloqueado por:** `PR-004` §4.3 ✅, `PR-009`, `PR-010`, y el resto del portal.
- **Relacionada:** **`TASK-021`** — sus amenazas **T4** (requerimiento judicial) y **T8** (el
  profesional ve más de lo autorizado) son el encargo de seguridad que esta spec implementa; su
  **Q3** es la misma P11 de §9.
- **Specs relacionadas:** `PR-015` (timeline de negocio), `PR-019`.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| **P11** | ¿Quién es el responsable legal del tratamiento de datos de menores en Bolivia? | ⏳ define retención y formato de export |
| — | ¿Cuánto tiempo se conserva la auditoría? | propuesta: más que el contenido; confirmar |
| — | ¿El joven puede solicitar saber quién accedió a su caso? | derecho de acceso; hoy no está modelado |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...` + `npm run build`) y pasa lint
- [ ] Pruebas de los 11 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
