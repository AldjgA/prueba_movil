# PR-010 · Autenticación profesional y roles

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-000` §3–4, `PR-007` (perfiles), `PR-003` §1
**Bloquea a:** todo el portal (`PR-011`–`PR-017`), `PR-018` (la auditoría necesita saber quién)
**Reconciliado:** 2026-09-30 — **la autenticación se delega en Supabase Auth** (`PR-003` Q9)

---

## Contexto

El portal maneja datos de menores en situación de riesgo. La autenticación no es una pantalla de
login: es la **raíz de la trazabilidad**. Sin identidad de profesional fiable, `PR-018`
(*"quién vio qué y cuándo"*) no puede cumplirse y el guardrail #11 se cae.

El brief §20 exige un login **propio**, distinto del adolescente, con **selector de rol**:
Psicología · Trabajo social · Orientación · Supervisión.

**Cambio de la revisión 2:** `PR-003` Q9 y `PR-INFRA` §2 deciden **no reinventar la
autenticación**. Se usa **Supabase Auth** y la autorización se apoya en **RLS de Postgres**.
Mi revisión 1 especificaba un esquema de sesión propio; queda retirado.

---

## Alcance

### Dentro

- Login con **correo institucional + contraseña** vía **Supabase Auth** (brief §20).
- **Rol** del profesional como *claim* en el usuario de Supabase + fila en el directorio
  (`PR-007`), entre los cuatro del brief §20.
- **Autorización por rol**, aplicada en dos capas:
  1. **RLS de Postgres** — la separación de datos se hace en la BD, no en el código
     (`PR-INFRA` §2);
  2. **guardia en la API** — ningún endpoint de `/profesional` se ejecuta sin rol válido.
- Sesión con expiración y cierre por inactividad.
- **Modo demo** (brief §20, `demo@puentered.org`) que opera **solo con datos ficticios** y no
  puede escribir en datos reales. Con `PR-003` Q7 (demo sin datos), el modo demo es el modo
  **por defecto** del MVP.
- Registro de cada inicio de sesión y fallo en `audit_event` (`PR-018`).

### Fuera

- El modelo de perfil de respondedor: `PR-007` (aquí se consume el rol).
- El alta/baja de profesionales: administración del directorio (`PR-007`).
- El login del adolescente: es del APK, de B. **No se reutiliza** (brief §20). Son superficies
  distintas (`/joven` vs `/profesional`, `PR-003` §1).
- 2FA: fuera del MVP (la sesión se diseña para admitirlo).

---

## Módulo y propiedad

- Módulo: `puente-red/portal/auth` (dueño: **C**) + guardia en `puente-red/backend/routes/profesional`
- Proveedor: **Supabase Auth** (no se implementa el almacén de credenciales)

```
authenticate(email, password) -> ProfessionalSession   // delega en Supabase Auth
authorize(session, action, resource) -> Decision       // RLS + guardia de ruta
```

---

## Contratos de datos

```go
type ProfessionalRole string

const (
    RolePsicologia   ProfessionalRole = "PSICOLOGIA"
    RoleTrabajoSocial ProfessionalRole = "TRABAJO_SOCIAL"
    RoleOrientacion  ProfessionalRole = "ORIENTACION"
    RoleSupervision  ProfessionalRole = "SUPERVISION"
)

type ProfessionalSession struct {
    ResponderID string           // mapea a auth.users.id de Supabase
    Role        ProfessionalRole
    IssuedAt    time.Time
    ExpiresAt   time.Time
    IsDemo      bool
}

type PortalAction string

const (
    ActionViewAlerts          PortalAction = "VIEW_ALERTS"
    ActionViewCaseSummary     PortalAction = "VIEW_CASE_SUMMARY"
    ActionViewProfessionalNotes PortalAction = "VIEW_PROFESSIONAL_NOTES"
    ActionTakeCase            PortalAction = "TAKE_CASE"
    ActionWriteProfessionalNotes PortalAction = "WRITE_PROFESSIONAL_NOTES"
    ActionCreateReferral      PortalAction = "CREATE_REFERRAL"
    ActionViewAggregatedReports PortalAction = "VIEW_AGGREGATED_REPORTS"
    ActionManageDirectory     PortalAction = "MANAGE_DIRECTORY"
    ActionViewAuditLog        PortalAction = "VIEW_AUDIT_LOG"
)
```

**Matriz de autorización propuesta** (a ratificar por la ONG):

| Acción | Psicología | Trabajo social | Orientación | Supervisión |
|---|---|---|---|---|
| Ver alertas | ✅ | ✅ | ✅ | ✅ |
| Ver resumen autorizado | ✅ | ✅ | ✅ | ✅ |
| Ver notas internas | ✅ | ✅ | ❌ | ✅ |
| Tomar caso | ✅ | ✅ | ❌ | ✅ |
| Escribir notas internas | ✅ | ✅ | ❌ | ✅ |
| Crear derivación | ✅ | ✅ | ✅ | ✅ |
| Ver reportes agregados | ✅ | ✅ | ❌ | ✅ |
| Gestionar directorio | ❌ | ❌ | ❌ | ✅ |
| Ver log de auditoría | ❌ | ❌ | ❌ | ✅ |

> **[VALIDAR]** *Orientación* queda restringida a lo no clínico por prudencia. Si la ONG quiere
> que orientación tome casos, es su decisión.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Las credenciales **no** se almacenan ni validan en código propio: todo pasa por Supabase Auth | revisión de arquitectura + prueba de contrato |
| 2 | Una contraseña incorrecta devuelve mensaje genérico, sin revelar si el correo existe | prueba unitaria |
| 3 | Ningún rol distinto de `SUPERVISION` puede ver el log de auditoría | prueba de autorización por tabla |
| 4 | `ORIENTACION` no puede tomar casos ni escribir notas internas | prueba de autorización |
| 5 | Un profesional de una institución **no** puede leer casos de otra (RLS) | prueba de RLS |
| 6 | Toda sesión expira y el portal cierra por inactividad | prueba con reloj inyectable |
| 7 | Una sesión `IsDemo` no puede escribir sobre datos reales | prueba de autorización + integración |
| 8 | Cada login exitoso y cada fallo quedan en `audit_event` | prueba de integración con `PR-018` |
| 9 | Ninguna acción de `/profesional` se ejecuta sin `authorize()` previo | prueba de contrato (no hay rutas sin guardia) |
| 10 | El portal **no** comparte sesión ni token con el APK juvenil | revisión: superficies y credenciales distintas |

---

## Guardrails aplicables

- #11 — la autenticación es la raíz de *"quién vio qué y cuándo"*. Criterio 8.
- Brief §20 — login propio; no reutilizar el adolescente. Criterio 10.
- `PR-003` §1 — **superficies separadas**: `/joven` (token de caso) vs `/profesional`
  (credenciales + rol). Criterios 1, 10.
- `PR-INFRA` §2 — la separación se hace en **RLS**, no en el código. Criterio 5.
- `PR-003` Q7 — la demo no usa datos reales. Criterio 7.
- #5 (`PR-003` §9.7) — el profesional nunca ve la identidad del joven (aplica a todos los roles).

---

## Referencia visual

`ProLoginScreen.tsx` — *"PUENTE RED · Centro profesional de acompañamiento"*, correo y
contraseña, selector de rol, CTA *"Entrar a Puente Red"*, demo `demo@puentered.org`.
`ProSidebar.tsx` — bloque de usuario y *"Cerrar sesión"*.

---

## Dependencias

- **Bloqueado por:** `PR-003` §1 ✅ (superficies separadas), `PR-INFRA` §2 ✅ (Supabase Auth).
- **Bloquea a:** `PR-011`–`PR-017`, `PR-018`.

---

## Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| Q8 | ¿La ONG es el único operador del panel? | ⏳ define si hay multi-institución / multi-tenant (afecta a RLS) |
| — | ¿Se confirma la matriz, en especial para *Orientación*? | ⏳ ONG |
| — | ¿Alta manual por supervisión o auto-registro con aprobación? | ⏳ ONG |
| — | ¿2FA en el MVP? | propuesta: diferir, dejar la sesión preparada |
