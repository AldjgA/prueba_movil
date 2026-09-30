# TASK-015 · Paquete de alerta roja (generación local, sin red)

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 2 · **Depende de:** `TASK-005`, `TASK-007`, `PR-003` §4, `PR-004` · **Bloquea:** `TASK-016`

> ⚠️ **Depende de firma clínica.** `PR-001` §4 (criterios de rojo), §8 (cobertura real) y §10 (fallos)
> gobiernan esta tarea. `REVISION-C.md` §5.5 confirma que la firma vive **fuera del repositorio**.
> Esta spec **referencia** §4/§8/§10 y **no los reestatea**. Ver §9 Q1.

## 1. Contexto

Cuando el joven llega a prioridad **roja**, el APK debe hacer dos cosas **a la vez y sin depender la
una de la otra**:

1. **Mostrar de inmediato** instrucciones de emergencia y números de crisis reales.
2. **Producir el paquete de alerta** y encolarlo para enviarlo al backend cuando haya red.

Esta tarea es la **(2)**: la construcción del paquete. La pantalla que el joven ve en rojo es de
`TASK-005` (§13 del brief) y el estado del caso enviado es `TASK-016`.

El principio que la define, de `PR-001` §10 y `PR-003` §9 invariante 8:

> **El flujo rojo del APK funciona offline: muestra emergencia y encola el reporte.**

Y el contrapeso, de `PR-003` §15: **Q8 resolvió que NO hay guardia 24/7.** Por tanto el paquete
**no puede** generar copy que prometa contacto inmediato. `PR-001` P5: *"el sistema nunca promete una
respuesta que no puede dar"*, y `PR-003` §15 avisa de que *"una demo que simula una respuesta clínica
inexistente es exactamente lo que `PR-001` prohíbe"*.

**Consecuencia de diseño:** el paquete lleva **datos**, no promesas. Todo el copy de expectativa vive
en la UI y lo controla `TASK-005`/`TASK-016`.

## 2. Alcance

### Dentro
- **Generación del paquete** según el contrato de `PR-003` §4 (`POST /joven/casos`), como
  **estructura de datos local**:
  - `contratoVersion`, `caseToken` (provisional si offline), `origenNivel` (`"ROJO"`),
    `rulesetVersion`, `motivo[]` (claves de catálogo), `respuestasChequeo[]`,
    `resumenAutorizado { scope, nota }`, `consentimiento { id, scope, otorgadoEn }`, `creadoEn`.
- **Encolado local persistente**: el paquete sobrevive al reinicio y al cierre de la app hasta que se
  envíe. **Sin red, sin reintentos de red, sin `:core:network`.**
- **Validación de lo que NO puede viajar** (ver §5 criterio #3): el paquete es un tipo cerrado que
  **no tiene** campos para `ProfileId`, alias, MAC ni contenido de chat.
- **Trazabilidad local** de la generación (para `TASK-017`: clasificación emitida y por quién).
- **Generación provisional de `caseToken`** cuando no hay red, con la regla de que el backend lo
  confirma o lo reemplaza al recibirlo (`PR-004`).

### Fuera
- **El envío.** `POST /joven/casos` es `TASK-013` (A, `:core:network`). Aquí se **produce y encola**.
- La pantalla de emergencia y el copy de qué va a pasar → `TASK-005` (§13) y `TASK-016`.
- La clasificación medio/alto → `PR-005` (C).
- La derivación → `PR-008` (C).
- **Cualquier dependencia de red.** Es la regla de esta tarea.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:signals` (**mismo módulo que `TASK-005`** — la generación del paquete es una
  capacidad de la feature de señales, no una pantalla nueva).
- Dueño: **B**
- Compartidos que **declara**:
  1. `Repositories.kt` → **contrato nuevo**: ver §4
  2. `LocalPuenteRepository.kt` → implementación + **la cola persistente**
  3. `settings.gradle.kts`, `app/build.gradle.kts`, `PuenteJovenNavHost.kt`, `HomeScreen.kt`,
     `AppDestination.kt` → **sin cambios** (no hay ruta nueva: es un caso de uso, no una pantalla)
  4. `:core:model` → **modelo nuevo `AlertPackage`** (ver §4). Toca `:core:model`, que no tiene dueño
     asignado (`REVISION-B.md` H6/H7).

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `SignalsRepository` | `getAttentionAssessment()` (el `origenNivel` y el `rulesetVersion`) |
| `ContextCheckRepository` | `observeResponses()` (las `respuestasChequeo`) |
| `SharingRepository` | `observeSummaries()`, `observeConsents()` (el `resumenAutorizado` y el `consentimiento`) |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- **Contrato nuevo `AlertPackageRepository`** — `[nuevo]`:

```kotlin
/**
 * Paquete de alerta roja. Se produce y se encola SIN RED.
 * El envío es responsabilidad de :core:network (TASK-013).
 */
interface AlertPackageRepository {
    /** Construye y encola el paquete. Idempotente por caseToken. */
    suspend fun enqueue(assessmentId: AssessmentId, nowEpochMillis: Long): AppResult<AlertPackage>
    /** Paquetes pendientes de envío. Sobrevive al reinicio. */
    fun observePending(): Flow<List<AlertPackage>>
    /** Marca un paquete como enviado (lo llama TASK-013, no esta tarea). */
    suspend fun markSent(caseToken: String, serverCaseToken: String): AppResult<Unit>
}
```

- **Modelo nuevo `AlertPackage`** en `:core:model` — **con la garantía de privacidad en el tipo**:
  sus campos son `caseToken`, `origenNivel`, `rulesetVersion`, `motivoKeys`, `respuestas`,
  `resumenAutorizado`, `consentimientoId`, `creadoEnEpochMillis`, `estado`. **No tiene campo para
  `ProfileId`, alias, dispositivo ni contenido de chat.** El invariante 3 de `PR-003` §9
  (*"el `ProfileId` nunca viaja junto al contenido"*) queda así **imposible de violar por accidente**:
  no hay dónde ponerlo.

  > **Nota de diseño:** esto es el mismo patrón que `ShareScopeEntry` (`sealed interface`) usa para
  > proteger el alcance del resumen. Se aplica aquí a la frontera del reporte. **Es el argumento
  > principal para justificar tocar `:core:model`** — la alternativa (un `Map<String, Any>` o un DTO
  > en la feature) pierde la garantía del compilador y B la rechaza.

- **Sin** `:core:network`. Verificable por `ModuleGraphGuardTest`.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | **El rojo funciona sin red**: con la red deshabilitada, el paquete se genera y queda en `observePending()` | instrumentada (o unitaria con la capa de red ausente) |
| 2 | El paquete **sobrevive al reinicio** del proceso: un paquete encolado sigue en `observePending()` tras cerrar y reabrir | unitaria sobre `LocalPuenteRepository` |
| 3 | **El paquete no contiene identidad**: no hay ningún campo con `ProfileId`, alias, MAC, id de dispositivo ni contenido de chat | unitaria (prueba negativa) + revisión del modelo |
| 4 | El paquete **no contiene texto libre del chat**: `motivo` y `respuestasChequeo` son **claves de catálogo**, no transcripciones | unitaria (assert sobre el tipo: `motivoKeys` son `SignalKey`/claves, no `String` libre) |
| 5 | El paquete lleva `rulesetVersion` del assessment que lo originó | unitaria |
| 6 | El paquete lleva el `scope` **cerrado** del resumen y el consentimiento asociado; si el consentimiento no existe o no está otorgado, **no se genera** | unitaria (prueba negativa) |
| 7 | `enqueue` es **idempotente por `caseToken`**: llamarlo dos veces con el mismo assessment no crea dos paquetes | unitaria |
| 8 | Con red ausente se genera un **`caseToken` provisional** y el modelo marca que es provisional | unitaria |
| 9 | El copy asociado **no promete contacto inmediato** (no hay guardia 24/7 — Q8) | revisión de contenido |
| 10 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **`PR-003` §9 invariante 8 / `PR-001` §10** | El flujo rojo **funciona offline** (criterios #1, #2) |
| **`PR-003` §9 invariante 2** | *"El chat completo nunca entra en el reporte"* (criterio #4) |
| **`PR-003` §9 invariante 3** | *"El `ProfileId` nunca viaja junto al contenido"* (criterio #3) |
| **`PR-003` §9 invariante 1** | `consent.scope ⊆ summary.scope` (criterio #6) |
| **`PR-003` §4** | *"Nunca viaja en el reporte: `ProfileId`, alias, MAC, el chat completo ni ningún identificador de dispositivo"* |
| **`PR-003` §15 / Q8** | Sin guardia 24/7 ⇒ el paquete **no promete** contacto inmediato (criterio #9) |
| **`PR-001` P5** | Honestidad de cobertura |
| **`PR-001` §11 / `TASK-017`** | La generación queda trazada localmente |
| **`TASK-021`** | El paquete encolado es un dato sensible en el dispositivo: se persiste cifrado y sin Auto Backup |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

**Ninguna.** Esta tarea no tiene superficie propia: es un caso de uso + persistencia. Las pantallas
que lo consumen son `TASK-005` (emergencia, nivel rojo) y `TASK-016` (estado del caso).

Referencias de contexto: brief §13 (*ROJO: "Esto necesita apoyo humano prioritario."*), `PR-001` §9
(fila «Rojo» y fila «Fuera de horario»).

## 8. Dependencias

- **Bloquea:** `TASK-016` (el estado del caso es la continuación del paquete).
- **Bloqueado por:** `TASK-005` (el assessment), `TASK-007` (resumen + consentimiento),
  `PR-003` ✅, `PR-004` ✅, `PR-001` §4/§8/§10 (firma clínica → Q1), y la decisión de A sobre
  `AlertPackageRepository` + `AlertPackage` en `:core:model` (§4).
- **Specs relacionadas:** `TASK-016`, `TASK-013` (A, el envío), `TASK-017` (registro del evento),
  `PR-004` (ingesta y emisión de `caseToken`), `PR-005`/`PR-008` (C).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **Criterios de rojo y cobertura real.** `PR-001` §4 lista criterios y §8 exige honestidad de cobertura; si el clínico los ajustó al firmar, hay que publicarlos. El paquete debe llevar el `origenNivel` correcto | clínico / dueño | **Bloquea el cierre** |
| **Q2** | ¿Se aprueba `AlertPackageRepository` + `AlertPackage` en `:core:model`? Es la única forma de que el invariante «sin identidad» lo garantice el compilador | A | **Bloquea el arranque** |
| Q3 | **`sessionToken` sin caducidad** (deuda de seguridad ya anotada, Q3 de `PR-004`). Antes de datos reales debe ser al menos revocable. ¿Se aborda aquí o en `TASK-013`? | A | Seguridad del envío |
| Q4 | Si el joven genera **varios** paquetes rojos (varios episodios), ¿se encolan todos o solo el más reciente? | producto / clínico | Modelo de la cola |
| Q5 | ¿Qué pasa con un paquete encolado **cuando el joven borra todo el contenido local** (`deleteAllLocalContent`, `TASK-009`)? ¿Se borra también lo pendiente de enviar? | producto / legal | Frontera con `TASK-009` |
| Q6 | `PR-001` §10 pregunta cómo se recupera el vínculo si el joven pierde el dispositivo, y `PR-003` §11 (R4) acepta que **pierde la cuenta**. ¿El paquete encolado debe sobrevivir de alguna forma, o se pierde con el dispositivo? | clínico / producto | Criterio #2 |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 resuelta** por el clínico; **Q2** por A
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluidas las **pruebas negativas** #3, #4 y #6
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)

---

## 11. Addendum — bloqueos resueltos por A el 2026-09-30

Los dos bloqueos que detecté al revisar la cola de C **están resueltos** en `PR-003` revisado
(`58e557f`, ver `REVISION-B-POR-A.md` §3). Esta sección sustituye al addendum anterior.

### B1 · ✅ Catálogo de `motivo` publicado (`PR-003` §4.2)

**Provisional y versionado** con `rulesetVersion` — que es exactamente lo que propuse: una lista
**cerrada** que cambia de **versión**, no de diseño. El APK ya puede emitir `motivo` sin inventar.

| Clave | Criterio de `PR-001` §4.3 |
|---|---|
| `ideacion_activa` | Ideación suicida activa |
| `plan_estructurado` | Plan |
| `intento_reciente` | Intento reciente |
| `autolesion` | Autolesión |
| `abuso` | Abuso |
| `peligro_inmediato` | Peligro inmediato |
| `violencia_no_inmediata` | Violencia no inmediata (amarillo) |
| `deterioro_escolar` | Deterioro escolar (amarillo) |
| `aislamiento_persistente` | Aislamiento (amarillo) |

**Efecto en esta spec:** `motivoKeys` se tipa como **clave del catálogo vigente**, y el paquete
lleva el `rulesetVersion` que corresponde. Si el clínico ajusta la lista, **cambia la versión** y el
paquete lo refleja sin rediseño. El criterio #4 pasa a ser verificable de verdad.

### B2 · ✅ Forma canónica de las claves de señal (`PR-003` §4.1)

**Forma canónica: `SNAKE_CASE` en MAYÚSCULAS.** Catálogo cerrado:

`SLEEP` · `ANXIETY` · `ISOLATION` · `SCHOOL_IMPACT` · `SUBSTANCE_USE` · `SELF_HARM` ·
`PHYSICAL_VIOLENCE`

`frequency` queda **retirada**: es una **dimensión de análisis** (brief §10), no un tipo de señal.
El APK emitía `"frequency"` en las fixtures; deja de ser válido.

**Efecto en esta spec:** las claves que emite `motivo` y el `scope` del resumen autorizado deben
pertenecer a este catálogo. La verificación pasa de «clave de catálogo» a «clave de **este**
catálogo, en **esta** forma».

**Efecto colateral declarado a A (nuevo ítem en `NECESIDADES.md`):** `DemoFixtures.kt` sigue
emitiendo `SignalKey("frequency")` y `SignalKey("isolation")` en minúsculas. Es `:core:data`, y no
está claro si `DemoFixtures.kt` es de A (como `LocalPuenteRepository.kt`) o no. **B no lo toca**: se
declara.

### B3 · ✅ `respuestasChequeo` se queda y se consume (K4)

A resolvió que **se queda**: son claves de catálogo sin texto libre y *"la señal más fiable del
sistema, porque el joven las declaró"*. `PR-006` §2 debe consumirlas explícitamente (lo corrige C).
Esta spec sigue emitiéndolas.

### B4 · ✅ `PR-001` no se ajustó al firmar (K10)

El product owner confirmó que **el fichero tal como está es el texto firmado**. Se cierra la Q1 en su
parte de «¿cambió algo?»: **no**. Lo que sigue abierto es solo si el clínico quiere añadir criterios
nuevos, y eso es un cambio de `rulesetVersion`, no un bloqueo.

**Estado de la spec:** **desbloqueada** en sus dos bloqueos. Queda pendiente únicamente la decisión
de A sobre `AlertPackageRepository` + `AlertPackage` (Q2) y el envío de `TASK-013`.
