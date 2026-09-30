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

## 11. Addendum — dos bloqueos nuevos tras revisar la cola de C (2026-09-30)

Al revisar `PR-005` y `PR-006` aparecieron **dos cosas que impiden emitir el Contrato A tal como está
escrito**. Ver `REVISION-C-POR-B.md` hallazgos **K1**, **K2** y **K4**.

### B1 · 🔴 El catálogo de `motivo` no existe (K2)

`PR-003` §4 exige `"motivo": ["ideacion_activa", "…"]` con **claves de catálogo**, y `PR-005` §9
delega ese catálogo al clínico *"en `PR-001`"* — pero `PR-001` §4.3 da **criterios en prosa**, no
claves. **Sin el catálogo, `motivo` no se puede emitir.** Y `motivo` es el campo que le dice al
equipo *por qué* se disparó la alerta: no es opcional.

**Propuesta:** A publica el catálogo en `PR-003`, derivado de `PR-001` §4.3, **versionado** junto a
`rulesetVersion`. Si el clínico no lo ha cerrado, se declara provisional y versionado — así un
cambio de catálogo es un cambio de versión, no un rediseño.

### B2 · 🔴 La forma canónica de las claves de señal no coincide (K1)

| Lado | Valor real |
|---|---|
| APK (verificado en `DemoFixtures.kt:56,100`) | `SignalKey("frequency")`, `SignalKey("isolation")` — minúsculas |
| Backend (`PR-006` §4) | `SignalTag` = `SLEEP \| ISOLATION \| SCHOOL_IMPACT \| SUBSTANCE_USE \| SELF_HARM \| ANXIETY` — mayúsculas |

No hay tabla de correspondencia en ningún documento, y `frequency` **no tiene equivalente** en
`SignalTag` (es una dimensión del brief §10, no un tipo de señal). El extractor de C recibiría claves
que no entiende.

**Propuesta:** A fija en `PR-003` (a) la lista cerrada de claves de señal, (b) su forma canónica y
(c) la tabla APK↔backend si los dos vocabularios se mantienen a propósito.

### B3 · 🟠 `respuestasChequeo` viaja y nadie lo consume (K4)

`PR-005` §4 (`IngestedReport`) no lo tiene; `PR-006` §2 extrae *"del `ResumenAutorizado`"*. El
chequeo contextual es la entrada más limpia que tiene el sistema (claves de catálogo, declaradas por
el joven, sin texto libre).

**Propuesta:** que `PR-006` lo consuma explícitamente, o que **se quite del contrato**. Lo que no
debe pasar es que B lo envíe y nadie lo lea: es superficie de exposición sin contrapartida.

### Efecto sobre los criterios de aceptación

- El criterio **#4** (*"`motivo` y `respuestasChequeo` son claves de catálogo"*) sigue siendo
  verificable, pero ahora depende de que el catálogo exista (B1).
- El criterio **#6** (consentimiento válido) **no cambia**.
- Se añade un criterio implícito: las claves emitidas deben pertenecer al catálogo **vigente y
  versionado** que publique A.

**Estado de la spec:** pasa a **bloqueada** hasta que A publique el catálogo (`PR-003`) y la forma
canónica de las claves. No se construye a ciegas.
