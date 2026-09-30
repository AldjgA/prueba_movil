# PR-010 · Autenticación profesional y roles

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-003` §1, `PR-INFRA` §2, `PR-007` · **Bloquea:** `PR-011`–`PR-017`, `PR-018`

---

## 1. Contexto

El portal maneja datos de menores en riesgo. La autenticación no es una pantalla de login: es la
**raíz de la trazabilidad**. Sin identidad de profesional fiable, `PR-018` (*"quién vio qué y
cuándo"*) no puede cumplirse y el guardrail #11 se cae.

El brief §20 exige un login **propio**, distinto del adolescente, con **selector de rol**:
Psicología · Trabajo social · Orientación · Supervisión.

**`PR-003` Q9 y `PR-INFRA` §2 deciden no reinventar la autenticación:** se usa **Supabase Auth** y
la autorización se apoya en **RLS de Postgres**.

---

## 2. Alcance

### Dentro
- Login con **correo institucional + contraseña** vía **Supabase Auth** (brief §20).
- **Rol** como *claim* del usuario + fila en el directorio (`PR-007`), entre los cuatro del brief.
- **Autorización por rol** en dos capas:
  1. **RLS de Postgres** — la separación se hace en la BD, no en el código (`PR-INFRA` §2);
  2. **guardia en la API** — ninguna ruta de `/profesional` se ejecuta sin rol válido.
- Sesión con **expiración y refresh** vía Supabase Auth.
- ⚠️ **El portal SÍ caduca.** El `sessionToken` **sin caducidad** es una decisión del dueño
  **solo para la API Joven** (un dispositivo por joven, demo de ≤5 usuarios). La API Profesional
  maneja datos de menores y permisos clínicos, así que usa la **sesión normal de Supabase Auth**,
  que expira y se refresca (`REVISION-C.md` §5.2).
- **Modo demo** (`demo@puentered.org`, brief §20) solo con datos ficticios. Con `PR-003` Q7, es el
  modo **por defecto** del MVP.
- Registro de cada login y fallo en `audit_event` (`PR-018`).

### Fuera
- El modelo de perfil de respondedor: `PR-007`.
- El alta/baja de profesionales: administración del directorio (`PR-007`).
- El login del adolescente: es del APK, de B. **No se reutiliza.** Superficies distintas
  (`/joven` vs `/profesional`, `PR-003` §1).
- 2FA: fuera del MVP (la sesión se diseña para admitirlo).

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/auth` (dueño **C**) + guardia en `puente-red/backend/routes/profesional`
- Proveedor: **Supabase Auth** — no se implementa el almacén de credenciales
- Archivos compartidos que necesita declarar: **ninguno del APK**

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type ProfessionalRole string
const (
    RolePsicologia    ProfessionalRole = "PSICOLOGIA"
    RoleTrabajoSocial ProfessionalRole = "TRABAJO_SOCIAL"
    RoleOrientacion   ProfessionalRole = "ORIENTACION"
    RoleSupervision   ProfessionalRole = "SUPERVISION"
)

type ProfessionalSession struct {
    ResponderID string // = auth.users.id de Supabase Auth
    Role        ProfessionalRole
    IssuedAt    time.Time
    ExpiresAt   time.Time
    IsDemo      bool
}

type PortalAction string
const (
    ActionViewAlerts            PortalAction = "VIEW_ALERTS"
    ActionViewCaseSummary       PortalAction = "VIEW_CASE_SUMMARY"
    ActionViewProfessionalNotes PortalAction = "VIEW_PROFESSIONAL_NOTES"
    ActionTakeCase              PortalAction = "TAKE_CASE"
    ActionWriteProfessionalNotes PortalAction = "WRITE_PROFESSIONAL_NOTES"
    ActionCreateReferral        PortalAction = "CREATE_REFERRAL"
    ActionViewAggregatedReports PortalAction = "VIEW_AGGREGATED_REPORTS"
    ActionManageDirectory       PortalAction = "MANAGE_DIRECTORY"
    ActionViewAuditLog          PortalAction = "VIEW_AUDIT_LOG"
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

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Las credenciales **no** se validan en código propio: todo pasa por Supabase Auth | revisión + contrato |
| 2 | Contraseña incorrecta → mensaje genérico, sin revelar si el correo existe | unitaria |
| 3 | Ningún rol distinto de `SUPERVISION` ve el log de auditoría | autorización por tabla |
| 4 | `ORIENTACION` no puede tomar casos ni escribir notas internas | autorización |
| 5 | Un profesional de una institución no lee casos de otra | **RLS** |
| 6 | Toda sesión expira y el portal cierra por inactividad | unitaria con reloj inyectable |
| 6b | La política de sesión del portal **no** reutiliza el `sessionToken` sin caducidad de la API Joven | revisión + contrato (`REVISION-C.md` §5.2) |
| 7 | Una sesión `IsDemo` no puede escribir sobre datos reales | autorización + integración |
| 8 | Cada login exitoso y cada fallo quedan en `audit_event` | integración con `PR-018` |
| 9 | Ninguna acción de `/profesional` se ejecuta sin `authorize()` previo | contrato (sin rutas sin guardia) |
| 10 | El portal **no** comparte sesión ni token con el APK juvenil | revisión |

---

## 6. Guardrails aplicables

- #11 — la autenticación es la raíz de *"quién vio qué y cuándo"*. Criterio 8.
- Brief §20 — login propio; no reutilizar el adolescente. Criterio 10.
- **`PR-003` §1** — superficies separadas: `/joven` (token de caso) vs `/profesional`
  (credenciales + rol). Criterios 1, 10.
- `PR-INFRA` §2 — la separación se hace en **RLS**, no en el código. Criterio 5.
- `PR-003` Q7 — la demo no usa datos reales. Criterio 7.
- `PR-003` §9.7 — el profesional nunca ve la identidad del joven (todos los roles).

---

## 7. Referencia visual

`ProLoginScreen.tsx` — *"PUENTE RED · Centro profesional de acompañamiento"*, correo y contraseña,
selector de rol, CTA *"Entrar a Puente Red"*, demo `demo@puentered.org`.
`ProSidebar.tsx` — bloque de usuario y *"Cerrar sesión"*.

---

## 8. Dependencias

- **Bloquea:** `PR-011`–`PR-017`, `PR-018`.
- **Bloqueado por:** `PR-003` §1 ✅, `PR-INFRA` §2 ✅, `PR-007`.
- **Specs relacionadas:** `PR-018` (auditoría).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| Q8 | ¿La ONG es el único operador del panel? | ⏳ define multi-institución (afecta a RLS) |
| — | ¿Se confirma la matriz, en especial para *Orientación*? | ⏳ ONG |
| — | ¿Alta manual por supervisión o auto-registro con aprobación? | ⏳ ONG |
| — | ¿2FA en el MVP? | propuesta: diferir, dejar la sesión preparada |

---

## 10. Definition of Done

- [x] Spec **Aprobada** por otro agente (`REVISION-C.md`)
- [x] Compila y pasa pruebas — `npm test`: **135/135 en verde** (21 de este módulo)
- [x] Pruebas de los 10 criterios en verde (**núcleo de seguridad**)
- [ ] `NECESIDADES.md` entregado a A y aplicado — **entregado**
  (`deliverables/PR-010/NECESIDADES.md`)
- [x] Sin secretos ni endpoints hardcodeados
- [x] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
- [x] **Interfaz de login** (`puente-red/portal/`) — **implementada**

### Estado de implementación (2026-09-30)

**Completo.** Núcleo de seguridad en `puente-red/backend/src/core/auth/`, rutas en
`puente-red/backend/src/routes/profesional.js` e **interfaz en `puente-red/portal/`**.

**Verificado:**
- `npm test` en el backend: **177/177 en verde** (21 de este módulo, + 20 de la superficie).
- `npm test` en el portal: **20/20 en verde** (lógica pura, sin React).
- `npm run build` del portal: **correcto** (`tsc` + `vite build` → `dist/`).
- **Extremo a extremo**: el backend arranca y el portal sirve la app y **proxya
  `/profesional/**`** a la API (`/profesional` → 200, `/profesional/session` sin token → 401).

**Rutas de la superficie `/profesional`:**

| Ruta | Guardia |
|---|---|
| `GET /profesional` | — (marcador de vida) |
| `POST /profesional/auth/login` | — (emite token opaco) |
| `POST /profesional/auth/logout` | sesión viva |
| `GET /profesional/session` | sesión viva · devuelve **las acciones permitidas del rol** |
| `GET /profesional/auditoria` | `VIEW_AUDIT_LOG` (solo `supervisor`) |

El resto responde `501` hasta `PR-011`…`PR-017`.

**Decisiones del portal que afectan a la seguridad:**
- El **token vive solo en memoria** (no en `localStorage`): un token accesible desde el
  almacenamiento del navegador es accesible para cualquier XSS.
- La **matriz no se replica** en el cliente: el servidor devuelve `accionesPermitidas` y el
  portal la lee. Una sola fuente de verdad.
- `src/auth/api.ts` es el **único** archivo que construye rutas de API → la frontera de
  `PR-020` criterio 12 se audita leyendo un archivo, y hay una prueba que lo comprueba.
- El portal **no compone** mensajes de error de credenciales: usa el del servidor, para no
  romper el criterio 2 desde el cliente.
- Un **fallo de red** no se presenta como un fallo de credenciales.
- El portal **declara el entorno de demostración** (`PR-001` §8).

**Provisional, pendiente del clínico (`PR-001` §5–§6):** el catálogo de `rationaleKeys` y la
metodología del prompt.

**Pendiente de A:** el adaptador real de Supabase Auth (necesita el cliente de `src/shared/**`),
las cuatro variables de demostración en `.env.example`, y la guarda de secretos de `TASK-014`
sobre `puente-red/**`.

Lo que hace verificables los criterios:

- **Criterio 1:** el servicio **delega** en el puerto (se comprueba que la llamada llega con las
  credenciales) y una prueba verifica que **no existe** ningún método de validación de
  contraseñas en el servicio.
- **Criterio 2:** un correo inexistente y una contraseña incorrecta producen **el mismo** mensaje
  y el **mismo** `reasonKey`. El correo se guarda **enmascarado** en la auditoría
  (`a***z@ong.org`).
- **Criterios 3 y 4:** se prueba la **matriz completa** (9 acciones × 4 roles) contra la tabla
  esperada, no solo casos sueltos.
- **Criterio 5:** el aislamiento entre instituciones se comprueba **antes** que el rol; se prueba
  que `SUPERVISION` tampoco puede salir de su institución.
- **Criterio 6:** dos relojes. A los 29 min la sesión vive; a los 60 está **inactiva**; a las 9 h
  está **caducada** (y `EXPIRED` gana a `IDLE`).
- **Criterio 6d:** `ProfessionalSession` **no tiene** campo `sessionToken`; se comprueba con
  `Object.keys`, y una política de TTL 0 produce caducidad inmediata.
- **Criterio 7:** las 4 acciones de escritura con sesión demo se rechazan; las 5 de lectura se
  permiten.
- **Criterio 8:** login correcto, fallido, cierre de sesión y **rechazo de autorización** dejan
  evento; una acción permitida **no** genera ruido.
- **Criterio 9:** sin sesión, las 9 acciones se rechazan con `NO_SESSION`; y `authorize`
  **nunca lanza** (un rechazo es un valor, no una excepción).
- **Criterio 10:** la sesión profesional no comparte ningún campo con la del APK (ni
  `sessionToken`, ni `caseToken`, ni `profileId`).
