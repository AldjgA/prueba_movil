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

**Núcleo de seguridad implementado y probado**, y **ya enganchado** a
`src/routes/profesional.js`:

| Ruta | Guardia |
|---|---|
| `GET /profesional` | — (marcador de vida) |
| `POST /profesional/auth/login` | — (emite el token opaco) |
| `POST /profesional/auth/logout` | sesión viva |
| `GET /profesional/session` | sesión viva · devuelve las acciones permitidas del rol |
| `GET /profesional/auditoria` | `VIEW_AUDIT_LOG` (solo `supervisor`) |

El resto de `/profesional/**` responde `501` hasta `PR-011`…`PR-017`.
**Verificado de extremo a extremo**: el servidor arranca (`node src/main.js`) y las rutas
responden. `npm test`: **177/177 en verde**.

**Pendiente de este PR:** la **interfaz** de login (`puente-red/portal/auth`), que se hará al
montar el portal.

---

## 9. 🆕 Necesidades surgidas al enganchar las rutas

### 9.1 Añadir las variables de demostración a `.env.example` (**archivo de A**)

`backend/.env.example` es de A, así que **no lo he editado**. Faltan cuatro variables que mi
adaptador de demostración necesita:

```
# --- Portal profesional (PR-010) — SOLO DEMOSTRACIÓN ---
PUENTE_DEMO_EMAIL=demo@puentered.org
PUENTE_DEMO_PASSWORD=          # si está vacía, NADIE entra (fail closed)
PUENTE_DEMO_ROLE=supervisor
PUENTE_DEMO_INSTITUTION=ong-demo
```

**No hay contraseña por defecto a propósito**: un adaptador de demo con credenciales
adivinables es peor que no tener demo.

### 9.2 Alineación de nombres de variables (hecha por C)

Mi `classification/config.ts` usaba un prefijo `PUENTE_*` propio. **Lo he alineado a la
convención de `src/shared/config.js`**: `CLASSIFIER_MODE`, `GOOGLE_GENAI_API_KEY`,
`CLASSIFIER_MODEL`, `CLASSIFIER_TIMEOUT_MS`… Habría sido **dos superficies de configuración
para el mismo proceso**.

**Aviso para A:** si añade configuración nueva, que sea en `shared/config.js`, y el núcleo se
alinea.

### 9.3 El adaptador real de Supabase Auth sigue pendiente

`AuthPort` está definido y probado; el adaptador de demostración funciona. Falta el de
**Supabase Auth**, que necesita el cliente de `src/shared/**` (de A). Requisitos: rol **como
claim del token** (no consultado a la base en cada petición), **claim de institución**,
**expiración con refresco** (`REVISION-C` §5.2) y usuario demo.

### 9.4 🆕 Creé `test/profesional.test.js` — confirmar propiedad

El reparto de `CONTRATO-DE-INTEGRACION.md` §1.1 no menciona `test/`. He creado
`test/profesional.test.js` (nuevo, no toca el `smoke.test.js` de A) porque es el sitio natural
para las pruebas de ruta y `node --test` las descubre desde la raíz. **Si A prefiere otra
ubicación, lo muevo.**

### 9.5 ⚠️ Dos bugs de diseño que encontraron mis propias pruebas

1. **`resolve` del registro de sesiones marcaba actividad**, así que **la inactividad no se
   detectaba nunca** — el propio acceso que se quiere medir reiniciaba el reloj. Ahora `resolve`
   es sin efectos y `touch` es explícito, y solo se llama tras comprobar que la sesión vive.
2. **Las rutas no pasaban sumidero de auditoría**, así que `GET /auditoria` devolvía siempre
   vacío. El `AuthService` se construía con el sumidero nulo por defecto.

Ambos están corregidos y fijados con pruebas.
