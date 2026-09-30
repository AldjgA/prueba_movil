# PR-010 · Autenticación profesional y roles

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-000` §3–4 (stack y `P10`), `PR-007` (roles)
**Bloquea a:** todo el portal (`PR-011`–`PR-017`), `PR-018` (la auditoría necesita saber quién)

---

## Contexto

El portal profesional maneja datos de menores en situación de riesgo. La autenticación no es
una pantalla de login: es la **raíz de la trazabilidad**. Sin identidad de profesional fiable,
`PR-018` (*"quién vio qué y cuándo"*) no puede cumplirse, y el guardrail #9 se cae.

El brief §20 exige un login **propio**, distinto del adolescente, con **selector de rol**:
Psicología · Trabajo social · Orientación · Supervisión. El brief §33 pide además *"Perfil
profesional"* y *"Cerrar sesión"* en la navegación.

`P10` (¿web, tablet o ambos?) está resuelto en `PR-000` §4 como **web desktop-first**; esta spec
asume esa decisión.

---

## Alcance

### Dentro

- Login con **correo institucional + contraseña** (brief §20). Sin alias, sin PIN.
- **Selector/identificación de rol** entre los cuatro del brief §20.
- Sesión con expiración, cierre por inactividad y revocación administrativa.
- **Autorización por rol**: qué puede ver y hacer cada rol.
- Modo **demo** (`demo@puentered.org`, brief §20) que opera solo con datos ficticios y no puede
  escribir en datos reales.
- Registro de cada inicio de sesión en auditoría (`PR-018`).
- Segundo factor **fuera del MVP**, pero la sesión se diseña para admitirlo.

### Fuera

- El modelo de perfil de respondedor: `PR-007` (aquí se consume el rol, no se define el perfil).
- La gestión de altas/bajas de profesionales: es administración del directorio (`PR-007`).
- El login del adolescente: es del APK juvenil, de B. **No se reutiliza** (brief §20).
- Recuperación de contraseña por SMS (no hay teléfono verificado en el MVP).

---

## Módulo y propiedad

- Módulo: `puente-red/portal/auth` + `puente-red/backend/auth`
- Dueño: **C**.

```
authenticate(email, password, role) -> ProfessionalSession
authorize(session, action, resource) -> Decision
```

---

## Contratos de datos

```kotlin
enum class ProfessionalRole { PSYCHOLOGY, SOCIAL_WORK, GUIDANCE, SUPERVISION }

data class ProfessionalSession(
    val responderId: ResponderId,
    val role: ProfessionalRole,
    val issuedAtEpochMillis: Long,
    val expiresAtEpochMillis: Long,
    val isDemo: Boolean,
)

/** Matriz de autorización. Es la tabla que PR-018 audita. */
enum class PortalAction {
    VIEW_ALERTS, VIEW_CASE_SUMMARY, VIEW_PROFESSIONAL_NOTES,
    TAKE_CASE, WRITE_PROFESSIONAL_NOTES, CREATE_REFERRAL,
    VIEW_AGGREGATED_REPORTS, MANAGE_DIRECTORY, VIEW_AUDIT_LOG,
}
```

**Matriz de autorización propuesta:**

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

> **[VALIDAR]** La matriz es una propuesta. *Orientación* queda restringida a lo no clínico por
> prudencia; si la ONG quiere que orientación pueda tomar casos, es una decisión suya.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Una contraseña incorrecta devuelve un mensaje genérico, sin revelar si el correo existe | prueba unitaria |
| 2 | Ningún rol distinto de `SUPERVISION` puede ver el log de auditoría | prueba de autorización por tabla |
| 3 | `GUIDANCE` no puede tomar casos ni escribir notas internas | prueba de autorización |
| 4 | Toda sesión expira y el portal cierra sesión por inactividad | prueba con reloj inyectable |
| 5 | Una sesión `isDemo` no puede ejecutar acciones de escritura sobre datos reales | prueba de autorización + prueba de integración |
| 6 | Cada login exitoso y cada fallo quedan registrados en auditoría | prueba de integración con `PR-018` |
| 7 | Ninguna acción del portal se ejecuta sin `authorize()` previo | prueba de contrato (no hay endpoints sin guardia) |
| 8 | El portal **no** comparte credenciales ni sesión con el APK juvenil | revisión: no hay cookie ni token compartido |

---

## Guardrails aplicables

- #9 — la autenticación es la raíz de *"quién vio qué y cuándo"*. Criterio 6.
- Brief §20 — login propio; no reutilizar el adolescente. Criterio 8.
- Brief §20 — modo demo con datos ficticios. Criterio 5.
- #3 — el profesional nunca ve la identidad del joven (no depende del rol; aplica a todos).

---

## Referencia visual

`ProLoginScreen.tsx` — *"PUENTE RED · Centro profesional de acompañamiento"*, campos correo y
contraseña, selector de rol, CTA *"Entrar a Puente Red"*, demo `demo@puentered.org`.
`ProSidebar.tsx` — bloque de usuario (*"Ana López · Psicología"*) y *"Cerrar sesión"*.

---

## Dependencias

- **Bloqueado por:** `PR-000` §4 (`P10` resuelto como web desktop-first).
- **Bloquea a:** `PR-011`–`PR-017` (todo el portal) y `PR-018`.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| Q8 | ¿La ONG es el único operador del panel? | define si hay multi-institución y, con ella, multi-tenant |
| — | ¿Se confirma la matriz de autorización, en especial para *Orientación*? | seguridad operativa |
| — | ¿Alta de profesionales manual por supervisión o auto-registro con aprobación? | flujo de administración |
| — | ¿Se exige 2FA en el MVP o se difiere? | propuesta: diferir, pero dejar la sesión preparada |
