<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-010

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-010-auth-profesional-roles.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es un paquete dentro de `puente-red/backend/core/auth/` (dueño:
**C**). La **interfaz** de login vivirá en `puente-red/portal/auth` (también de C).

## 2. Dependencia de build (la aplica A)

**—** Sin dependencia con el APK.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado. El portal usará tokens propios.

## 7. Otros

### 7.1 🆕 **Necesidad concreta: el proyecto de Supabase Auth**

`PR-003` Q9 decide **Supabase Auth**. Para que `AuthPort` tenga implementación real, A necesita
tener creado:

| Necesidad | Detalle |
|---|---|
| **Proyecto Supabase** en `sa-east-1` | `PR-INFRA` §5. **Se pausa a los ~7 días** sin actividad: hace falta el *ping* diario o el plan Pro |
| **Usuarios de profesionales** con su **rol como claim** | `role` ∈ {PSICOLOGIA, TRABAJO_SOCIAL, ORIENTACION, SUPERVISION}. El rol debe viajar en el token, no consultarse a la base en cada petición |
| **Claim de institución** | `institutionId`. Es lo que hace posible el aislamiento de la §7.3 |
| **Usuario demo** | `demo@puentered.org` con `isDemo = true` (`PR-003` Q7: sin datos reales ni sintéticos) |
| **Política de sesión** | **Expira y se refresca** (`REVISION-C` §5.2). **No** reutilizar el `sessionToken` sin caducidad de la API Joven |
| **Tabla `auth_audit`** | O reutilizar `audit_event` (`PR-004` §4.3) con las acciones `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `AUTHORIZATION_DENIED` |

**Mientras no exista:** el núcleo funciona con un `AuthPort` falso, así que la lógica de
autorización es demostrable hoy. Lo que **no** se puede probar sin Supabase es el aislamiento
real por RLS — el paquete lo verifica en la guardia, pero la barrera de la base de datos es de
A.

### 7.2 🆕 Decisión de C: el núcleo va en `backend/core/auth`, no en el portal

La spec sitúa el módulo en `puente-red/portal/auth`. He puesto el **núcleo de autorización** en
`backend/core/auth` por un motivo concreto: **la guardia protege rutas de la API**, no pantallas.
Si viviera en el portal, la API Profesional dependería del front-end para autorizar — y eso es
exactamente lo que no debe pasar.

`portal/auth` queda para la **interfaz** (login, contexto de sesión, cierre por inactividad en
el cliente). **Aviso a A por si prefiere otra ubicación.**

### 7.3 🆕 El aislamiento entre instituciones necesita una decisión de producto

El código implementa `CROSS_INSTITUTION` y funciona. Pero **falta responder Q8**
(*"¿La ONG es el único operador del panel?"*):

- Si la ONG es el **único** operador, `institutionId` es siempre el mismo y el aislamiento es
  código muerto.
- Si hay **varios**, hay que decidir si un profesional puede ver casos de otra institución
  (p. ej. una derivación entre organizaciones).

**No lo he inventado**: la guardia rechaza por defecto, que es la postura segura.

### 7.4 ⚠️ La matriz de autorización necesita ratificación de la ONG

`AUTHORIZATION_MATRIX` es una **propuesta**. En particular, `ORIENTACION` queda restringida a lo
no clínico (no ve notas internas, no toma casos, no escribe valoración). Si la ONG quiere que
orientación tome casos, es una decisión suya y se cambia **en una línea** — precisamente porque
la matriz es datos.

### 7.5 🆕 El portal necesita dependencias — primer cambio de naturaleza del proyecto

Hasta ahora todo el backend funciona **sin dependencias** (Node ejecuta `.ts` con type stripping).
El portal no puede: necesita **React + Vite**. He comprobado que el registro npm es alcanzable
(`react 19.3.0`, `vite 8.3.1`).

**No lo he montado todavía.** Implica un `package.json` con dependencias reales, un build step y
`node_modules` — y conviene que A lo sepa antes de que aparezca en el repo, porque afecta a
`backend/shared/**` si se decide un workspace npm raíz.

---

## 8. Estado

**Núcleo de seguridad de `PR-010` implementado y probado**: 21 pruebas propias (**135** en total
en el paquete), cubriendo los 10 criterios.

**Pendiente de este PR:** la interfaz de login (`puente-red/portal/auth`), que se hará al montar
el portal.
