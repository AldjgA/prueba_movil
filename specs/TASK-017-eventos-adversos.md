# TASK-017 · Registro de eventos adversos

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 2 · **Depende de:** `TASK-005`, `TASK-015` · **Bloquea:** `TASK-018`

## 1. Contexto

`PR-001` §11 lo pide con una justificación que viene del resumen ejecutivo: *"el abandono es alto; el
proyecto debe medir implementación y no solo resultados clínicos."* Y `PLAN-TRABAJO-SDD` §10.1 la
sitúa en la **Fase 2 del MVP** como tarea de la comparación con el resumen ejecutivo.

`PR-001` §11 define qué hay que registrar:

- clasificación emitida y **por quién**;
- tiempo hasta el primer contacto humano;
- si hubo respuesta o no;
- **falsos positivos y falsos negativos** detectados;
- cualquier daño o queja.

Y `PR-001` §12 añade las métricas que ese registro debe poder alimentar: alertas revisadas/emitidas,
incidentes, falsos positivos, **falsos negativos** (*"el fallo grave"*), **casos sin respuesta**
(*"el más importante"*) y tiempo hasta contacto humano.

**Nota de encuadre (`PLAN-TRABAJO-SDD` §3):** esta tarea es **transversal**, y eso rompe la regla
*"una tarea = un módulo `feature:*`"*. Por eso esta spec propone un módulo de núcleo propio (§3).

## 2. Alcance

### Dentro
- **Módulo nuevo `:core:audit`** (núcleo, no feature): registro de eventos adversos y de
  trazabilidad mínima.
- **Registro de eventos** con los 5 tipos de `PR-001` §11.
- **Regla de contenido dura:** el registro guarda **conteos, claves y marcas de tiempo**, nunca
  contenido. Igual que `RetentionPurgeResult` (*"Ningún método devuelve contenido: solo conteos y
  metadatos. Un resultado de purga se puede registrar sin filtrar texto del chat"*).
- **Detección de eventos que el APK sí puede detectar**: nivel rojo emitido, paquete de alerta
  generado, ausencia de respuesta en la ventana esperada (`PR-001` §7, si el dato existe),
  revocación, borrado manual.
- **Exportación agregada**: el registro debe poder producir un **resumen agregado sin contenido**
  para el marco de evaluación (`TASK-020`, C).

### Fuera
- **Los falsos negativos**: por definición, un falso negativo se detecta **a posteriori y por una
  persona**, no por el APK. El registro debe **aceptar** la marca, no detectarla. `PR-001` §13 Q10 lo
  pregunta al clínico.
- Las métricas del portal profesional y del observatorio → `PR-017` (C).
- La auditoría de consultas a casos (quién vio qué) → `TASK-023` (A, requisito legal).
- Envío a ningún sitio: el registro es **local** hasta que exista backend y acuerdo de datos.
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: **`:core:audit`** (núcleo, no `feature:*`) — propuesta de B, ver §9 Q1.
  - Motivo: es transversal (lo consumen `signals`, `sharing`, `profile`), no tiene pantalla y no debe
    depender de ninguna feature. Un módulo de núcleo es la única forma de que la regla
    *"una tarea = un módulo = un dueño = un worktree"* siga siendo cierta.
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":core:audit")`
  2. `app/build.gradle.kts` → **no** necesita dependencia directa (lo consumen las features)
  3. `core/data` → **el registro se persiste con la infraestructura de `TASK-003b`**: B necesita un
     tercer `DataStore` o un fichero propio. **`PuenteLocalStore` y `LocalPuenteRepository` son de A.**
     Se declara en `NECESIDADES.md`.
  4. `PuenteJovenNavHost.kt`, `HomeScreen.kt`, `AppDestination.kt` → **sin cambios** (sin pantalla)

## 4. Contratos de datos

**Consume:** nada. Es un módulo de escritura.

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- **Contrato nuevo `AdverseEventRepository`** — `[nuevo]`, dentro de `:core:audit`:

```kotlin
/** Registro de eventos adversos y trazabilidad. NUNCA registra contenido. */
interface AdverseEventRepository {
    /** Registra un evento. El tipo de dato impide pasar texto del chat. */
    suspend fun record(event: AdverseEvent): AppResult<Unit>
    /** Eventos en un rango, para el resumen agregado. */
    fun observeEvents(fromEpochMillis: Long, toEpochMillis: Long): Flow<List<AdverseEvent>>
    /** Agregado sin contenido, para el marco de evaluación (TASK-020). */
    suspend fun aggregatedReport(fromEpochMillis: Long, toEpochMillis: Long): AppResult<AdverseEventReport>
}
```

- **Modelo nuevo `AdverseEvent`** con **tipo cerrado** (`sealed interface`) para que añadir un tipo
  nuevo sea una decisión explícita — mismo patrón que `ShareScopeEntry`:

```
sealed interface AdverseEvent {
    val occurredAtEpochMillis: Long
    data class RedLevelEmitted(val rulesetVersion: String, ...) : AdverseEvent
    data class AlertPackageGenerated(val caseToken: String, ...) : AdverseEvent
    data class NoResponseInWindow(val caseToken: String, val expectedByEpochMillis: Long) : AdverseEvent
    data class ConsentRevoked(val reasonKey: String, ...) : AdverseEvent
    data class LocalContentDeleted(...) : AdverseEvent
    data class ReportedHarm(val noteKey: String, ...) : AdverseEvent
}
```

  - **Ninguna variante tiene un campo `String` de texto libre del joven.** El «cualquier daño o queja»
    de `PR-001` §11 se registra con una **clave de catálogo** (`noteKey`), no con texto libre. Esto es
    deliberado y es el criterio #2.
  - Toca `:core:model`, que **no tiene dueño asignado** (`REVISION-B.md` H6/H7). La alternativa sería
    el modelo dentro de `:core:audit`; B la acepta si A prefiere no tocar `:core:model`.

**Dato que necesita de A:** un lugar donde persistir. Si `PuenteLocalStore` (de A) no admite un
tercer almacén, B propone un fichero propio en `:core:audit` con el mismo cifrado de `TASK-003b`.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Existen los **6 tipos de evento** de `PR-001` §11 (+ «daño o queja») | unitaria |
| 2 | **El registro no puede contener contenido**: ninguna variante de `AdverseEvent` tiene un campo de texto libre del joven; el compilador lo garantiza | unitaria (prueba negativa) + revisión del tipo |
| 3 | Se registra **quién emitió la clasificación**: `RedLevelEmitted` lleva `rulesetVersion` y el origen (reglas del APK) | unitaria |
| 4 | Se registra el **tiempo hasta el primer contacto humano** cuando el dato llega del backend; si no llega, el evento queda **abierto**, no se inventa | unitaria |
| 5 | Se puede registrar un **falso positivo** y un **falso negativo** (marca manual, no detección) | unitaria |
| 6 | El registro **sobrevive al reinicio** y está **aislado por perfil** | unitaria sobre el almacén |
| 7 | `aggregatedReport` produce **solo agregados y conteos**, sin ningún campo de contenido | unitaria (assert sobre el tipo `AdverseEventReport`) |
| 8 | El módulo **no depende de ninguna feature** (es núcleo) y **no depende de `:core:network`** | `ModuleGraphGuardTest` + revisión de `build.gradle.kts` |
| 9 | **Cero literales de copy en Kotlin** | `grep` + revisión |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **`PR-001` §11 — eventos adversos** | Criterios #1–#5: los 5 tipos de `PR-001` §11 más «daño o queja» |
| **`PR-001` §12 — métricas de seguridad** | Criterio #7: el agregado debe poder alimentar las 6 métricas de §12 |
| **`PR-001` P10 — todo queda trazado** | *"quién vio qué y cuándo"* |
| **#7 — privacidad / `PR-001` P6** | Criterio #2: el registro **no puede** convertirse en un segundo lugar donde vive el chat |
| **`TASK-021` §5.1** | El registro es dato sensible: cifrado local, sin Auto Backup, aislado por perfil |
| **Q7 — demo sin datos reales** | El registro en demo no se exporta a ningún servicio externo |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

**Ninguna.** Tarea sin superficie: es un módulo de núcleo + persistencia. Su salida se muestra en el
**observatorio** del portal profesional (`PR-017`, C) y en el marco de evaluación (`TASK-020`, C).

## 8. Dependencias

- **Bloquea:** `TASK-018` (la suite de seguridad verifica que el registro no filtra contenido).
- **Bloqueado por:** `TASK-005` (nivel rojo), `TASK-015` (paquete de alerta), y las decisiones de A
  sobre el módulo `:core:audit`, el contrato nuevo y dónde se persiste (§3, §4).
- **Specs relacionadas:** `TASK-018`, `TASK-023` (A, auditoría de consultas — **frontera**: esta
  registra eventos de producto, aquella registra accesos a casos), `TASK-020` (C, marco de
  evaluación), `PR-017` (C, observatorio), `PR-018` (C, auditoría y cumplimiento).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | ¿Se aprueba **`:core:audit` como módulo de núcleo**? Es la propuesta de B para que las tareas transversales (`TASK-017`, y `TASK-024` si entra) tengan módulo, dueño y frontera | A | **Bloquea el arranque** |
| **Q2** | ¿Dónde se persiste el registro: un tercer `DataStore` de A, o un almacén propio de `:core:audit`? | A | **Bloquea el arranque** |
| Q3 | **Frontera con `TASK-023`** (auditoría de consultas, A): ¿el registro de eventos adversos y la auditoría de accesos son **el mismo almacén** o dos? Si son dos, ¿comparten formato? | A | Arquitectura |
| Q4 | El «tiempo hasta el primer contacto humano» solo lo conoce el backend. ¿Cómo llega al APK: en `CaseStatus` (`TASK-016`) o no llega y el evento queda abierto? | A | Criterio #4 |
| Q5 | ¿Con qué **retención** se guarda el registro? `RetentionPolicy` es del contenido del joven; el registro de eventos adversos probablemente tenga otra (más larga, para evaluación). ¿Quién la aprueba? (`PLAN-TRABAJO-SDD` §5.3 P14: decisiones legales) | legal | Política de retención |
| Q6 | ¿El registro se envía al backend para el observatorio (`PR-017`) en el MVP, o vive solo en el dispositivo hasta el piloto? | dueño / legal | Alcance |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 y Q2 resueltas** por A; **Q5** por legal
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluida la **prueba negativa** #2
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
