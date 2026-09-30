# TASK-011 · Derivación y directorio

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 2 · **Depende de:** `TASK-006b`, `TASK-007` · **Bloquea:** `TASK-012`

## 1. Contexto

`ReferralScreen.tsx` (176 líneas) es la tercera pantalla del prototipo sin tarea ni ruta en Android
(`PLAN-TRABAJO-SDD` §2.2). El brief §27 define un módulo de derivaciones con 6 estados (*pendiente ·
contactado · derivado · atención iniciada · seguimiento · cerrado*) y el §28 un directorio de apoyo
con 5 categorías (*psicología · salud · protección · orientación escolar · servicios comunitarios*).

**Dos reglas del brief que gobiernan esta tarea:**

1. **"El MVP puede utilizar datos ficticios."**
2. **"No inventar servicios oficiales reales."**

La segunda es la importante. Un directorio con números de teléfono **inventados** que parezcan reales
es peligroso: un adolescente en crisis puede llamar a un número que no existe. Y publicar números
reales sin acuerdo con esas instituciones es peor. Por eso esta tarea tiene una restricción de
contenido dura, no un simple aviso.

## 2. Alcance

### Dentro
- **Módulo nuevo** `feature:referral` con estructura propia.
- **Rutas nuevas**: `ReferralRoute` (derivación) y `DirectoryRoute` (directorio).
- **Directorio de apoyo** por categorías (brief §28), con datos **declaradamente ficticios** y
  **marcados como tales en la UI** mientras el MVP esté en demo (Q7: *"nada de datos de verdad"*).
- **Estado de una derivación** con los 6 estados del brief §27, mostrando servicio, fecha,
  responsable, tiempo y estado.
- Enlace desde el recorrido (brief §16) y desde los próximos pasos (`TASK-010`).

### Fuera
- El **motor de derivación** (emparejar caso ↔ profesional) → `PR-008` (**C**). El APK **no deriva**:
  muestra el estado de lo que el backend resolvió.
- El **directorio del portal profesional** → `PR-007` (**C**). Ver §9 Q1: hay que decidir si el
  directorio juvenil y el profesional son el mismo dato.
- Llamadas telefónicas, deep links a apps externas o marcador del sistema: si el joven quiere llamar,
  el flujo de emergencia de `TASK-015` es el sitio, y ahí las normas son otras.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:referral`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:referral")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:referral"))`
  3. `AppDestination.kt` → **RUTAS NUEVAS `ReferralRoute`, `DirectoryRoute`**
  4. `PuenteJovenNavHost.kt` → montar ambas rutas
  5. `feature/home/HomeScreen.kt` → sin entrada directa (se llega desde recorrido y próximos pasos)
  6. `Repositories.kt` → **contrato nuevo**: ver §4
  7. `LocalPuenteRepository.kt` → implementación del contrato nuevo

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `SupportRepository` | `observeRequests()`, `observeRequest(requestId)` (la derivación nace de una solicitud) |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- **Contrato nuevo `ReferralRepository`** — `[nuevo]`:

```kotlin
/** Directorio de apoyo y estado de derivaciones. El APK NO deriva: solo muestra. */
interface ReferralRepository {
    /** Directorio por categoría. Datos FICTICIOS declarados mientras el MVP sea demo. */
    suspend fun directory(): AppResult<List<SupportResource>>
    /** Derivaciones del joven, con su estado visible. */
    fun observeReferrals(): Flow<List<Referral>>
}
```

  - Necesita **dos modelos nuevos** en `:core:model`: `SupportResource` (categoría, nombre, tipo de
    contacto, `isFictional`) y `Referral` (servicio, fecha, responsable, `ReferralState`).
  - **Eso toca `:core:model`, que no tiene dueño asignado** (`REVISION-B.md` H6/H7).
  - **Alternativa sin tocar `:core:model`:** los recursos del directorio son **fixtures de la feature**
    (no cruzan ninguna frontera, no se persisten, no se comparten) y el estado de la derivación se
    **deriva** de `SupportRequestState` + `stateNote`, que ya existen. **B prefiere esta segunda**:
    el directorio no es un dato del joven, es contenido de la app; y el estado de la derivación ya
    está modelado. Reduce la tarea a UI + fixtures y **no toca `:core:model`**. La decisión es de A.

- **Sin** acceso a `SharingRepository`: esta pantalla **no** amplía nada compartido.

**Restricción de contenido (no negociable):** el campo `isFictional` (o su equivalente) debe existir
**si** el directorio se modela; si el directorio son fixtures de la feature, la marca de ficción es
**copy obligatorio** en la pantalla (§5 criterio #3).

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | El directorio cubre las **5 categorías** del brief §28 | unitaria |
| 2 | **Ningún dato del directorio es un servicio real**: no hay teléfonos, direcciones ni nombres de instituciones reales bolivianas | revisión de contenido contra la lista del brief §28 (*"no inventar servicios oficiales reales"*) |
| 3 | La pantalla **declara explícitamente** que los datos son de ejemplo mientras el MVP sea demo | revisión visual + `grep` del recurso de copy |
| 4 | La derivación muestra los **6 estados** del brief §27 | instrumentada |
| 5 | La derivación muestra servicio, fecha, responsable, tiempo y estado | instrumentada |
| 6 | **El APK no deriva**: no existe lógica de emparejamiento caso ↔ profesional en el módulo | `grep` de lógica de matching en `feature/referral/**` (debe ser 0) |
| 7 | La pantalla **no abre el marcador** ni lanza un `Intent` externo | `grep` de `Intent`/`ACTION_DIAL`/`tel:` (debe ser 0) |
| 8 | No se muestran datos del profesional individual antes de `ACEPTADO` (`PR-003` R5) | unitaria (estado previo a `ACEPTADO` ⇒ sin datos del profesional) |
| 9 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 10 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **Brief §28 — no inventar servicios oficiales reales** | Criterios #2 y #3. Es la restricción que define la tarea |
| **Q7 — demo sin datos reales ni sintéticos** | El directorio es **contenido de ejemplo**, no un dataset poblado |
| **`PR-003` §6.3 — lo que la app NO muestra nunca** | Criterio #8: el estado interno del caso y la carga del profesional no se muestran |
| **`PR-003` R5 — identidad del profesional solo desde `ACEPTADO`** | Criterio #8 |
| **#4 — la IA no diagnostica** | El directorio no sugiere «el profesional adecuado para tu caso»: lista recursos |
| **`PR-001` P5 — honestidad de cobertura** | Un recurso del directorio no puede presentarse como disponible si no lo está; de ahí la marca de ficción |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Prototipo: `ReferralScreen.tsx` (176 líneas).
- Brief §27 (estados de derivación), §28 (directorio y 5 categorías).
- Design system: **`ResourceCard` ya existe** (`component/PuenteActions.kt`) y es exactamente el
  componente del directorio. También `SummaryCard`, `InfoBadge` (marca de dato de ejemplo),
  `EditorialHeader`, `PuenteStates`.

## 8. Dependencias

- **Bloquea:** `TASK-012` (cierre del ciclo narrativo).
- **Bloqueado por:** `TASK-006b` (recorrido), `TASK-007` (la derivación nace de una solicitud), y las
  decisiones de A sobre el contrato nuevo y las 2 rutas nuevas.
- **Specs relacionadas:** `TASK-010`, `TASK-016`, `PR-007` (C, directorio profesional),
  `PR-008` (C, motor de derivación), `PR-016` (C, derivaciones del portal).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **Frontera con C.** ¿El directorio que ve el joven (`TASK-011`) y el directorio del portal (`PR-007`) son **el mismo dato** servido por el backend, o dos cosas distintas? Si son el mismo, ¿quién es dueño del catálogo y de su marca de ficción? | A | **Bloquea el modelo de datos** |
| **Q2** | ¿Se aprueba **fixtures de la feature** (sin tocar `:core:model`) o el contrato nuevo `ReferralRepository`? | A | Bloquea el arranque |
| Q3 | El brief §27 describe los 6 estados de derivación **para Puente Red**. ¿El joven ve los mismos 6 o una proyección reducida (como `SupportRequestState` tiene 7)? | A / C | Criterio #4 |
| Q4 | ¿El directorio es accesible **sin** haber pedido apoyo (consulta libre), o solo después de una solicitud? | producto | Entrada en el grafo |
| Q5 | Cuando el MVP deje de ser demo, ¿quién valida los recursos reales y con qué acuerdo institucional? | ONG / legal | Fuera del alcance del agente, pero hay que registrarlo |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 y Q2 resueltas** por A
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)

---

## 11. Addendum — corrección tras revisar la cola de C (2026-09-30)

Al revisar `PR-016` encontré que **el directorio ya tiene dueño: C**, y que mi §4 apuntaba al lado
equivocado. Ver `REVISION-C-POR-B.md` hallazgo **K7**.

**Lo que dice `PR-016`:**

- §3: el catálogo vive en `puente-red/backend/core/directory-services` — **dueño C**.
- §4: `SupportService` ya tiene los campos que yo iba a inventar, incluido **`IsFictional bool`**.
- §2.B: las **5 categorías** son las mismas del brief §28 (`PSICOLOGIA · SALUD · PROTECCION ·
  ORIENTACION_ESCOLAR · SERVICIOS_COMUNITARIOS`).
- §2 «Fuera»: el canal de contacto es de `PR-003` §6.2, ola posterior.

**Corrección a §4 (contrato de datos):**

| Antes (mi propuesta) | Ahora (corregido) |
|---|---|
| Fixtures locales en `feature:referral` | **Se consume del backend.** El directorio es de C |
| Sin contrato nuevo | Contrato nuevo `DirectoryRepository` que **envuelve la llamada al endpoint `/joven`** — pero **lo define A**, porque es borde con `:core:network` (`TASK-013`) |

**Consecuencia en dependencias:** `TASK-011` pasa de «Ola 2 sin red» a **bloqueada por `TASK-013`**
(`:core:network`, de A) igual que `TASK-016`. Se puede construir la UI contra un doble local, pero
**no se puede cerrar** hasta que A publique la capa de red y el endpoint.

**Consecuencia en Q1:** queda **resuelta** — el directorio es **uno solo**, de C, servido por el
backend. Lo que sigue siendo de B es la **pantalla del joven** y la **marca de ficción visible**
(criterio #3), que el brief §28 exige en la superficie que ve el adolescente.

**Consecuencia en Q2:** la alternativa «fixtures locales» queda **descartada** por duplicación. Dos
directorios con el mismo contenido y dos marcas de ficción distintas es exactamente el patrón que
`PLAN-PUENTE-RED.md` §2.4 prohíbe para el consentimiento.

**Lo que NO cambia:** los criterios de aceptación #2 (ningún servicio real), #3 (declaración de
datos de ejemplo), #6 (el APK no deriva) y #7 (sin marcador ni `Intent` externo) siguen vigentes y
son más importantes que nunca: ahora el dato **viene de fuera** y la app debe seguir siendo honesta
sobre él.
