# TASK-016 · Estado del caso rojo (lo que el joven ve)

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 2 · **Depende de:** `TASK-015`, `TASK-013` · **Bloquea:** `TASK-012`

> ⚠️ **Bloqueada por `TASK-013`** (`:core:network`, tarea 11 de A). Esta pantalla consume el contrato
> remoto `GET /joven/casos/{caseToken}` de `PR-003` §5. Se puede **construir la UI contra un doble
> local**, pero **no se puede cerrar** hasta que A publique `:core:network`.

## 1. Contexto

Es la pantalla que responde a la pregunta más difícil del producto: **¿qué pasa después de que pido
ayuda?** `PR-001` §9 la describe así: *"Que una persona lo está revisando; nunca notas internas."*

Y `PR-003` §15 la enmarca en el límite más importante del MVP: **no hay guardia 24/7 (Q8)**. Por
tanto esta pantalla tiene que ser **honesta sobre el tiempo**, no tranquilizadora. `PR-001` P5 y
`PR-003` §15: una pantalla de *"estamos contigo"* sin nadie detrás es peor que no mostrarla.

**Dos reglas de revelación que hay que implementar con precisión quirúrgica** (`PR-003` §0.2,
conciliación **R1 + R5**):

| Regla | Qué significa | Cómo se ve |
|---|---|---|
| **R5** | Al **aceptar** el psicólogo, el joven **ve sus datos** (nombre visible, rol, especialidad) | `psicologo != null` desde `ACEPTADO` |
| **R1** | El **canal** de contacto **no** se abre al aceptar: solo si el psicólogo **decide comunicarse** | `canalContacto == null` aunque `estado == ACEPTADO` |

> **Este es el par de campos donde es fácil equivocarse.** Que el joven vea los datos del profesional
> **no** le da canal. `PR-020` (C) lo tiene como criterio de prueba: `psicologo != null` **y**
> `canalContacto == null` en `ACEPTADO`. Lo replico aquí como criterio #3.

## 2. Alcance

### Dentro
- **Módulo** `feature:sharing` (mismo módulo que `TASK-007`; la pantalla es la continuación natural
  del estado de la solicitud).
- **Ruta nueva** `CaseStatusRoute(caseToken)`.
- Proyección de los **9 estados del caso** (`PR-003` §3.1) a los 7 de `SupportRequestState` del APK
  — ver §4: **la proyección es de A** (hallazgo **F1** de `REVISION-C.md` §6), B solo la consume.
- Presentación de: estado, categoría (`MEDIO`/`ALTO`), fecha de actualización, **datos del psicólogo
  desde `ACEPTADO`**, canal **solo desde `CONTACTO_HABILITADO`**, y mensajes no leídos.
- **Aviso de cobertura real**: qué se promete y qué no, con los números de crisis (Q8).
- **Estado offline**: si no hay red, la pantalla muestra el último estado conocido y dice que está
  desactualizado — **nunca** inventa un estado nuevo.

### Fuera
- La generación del paquete → `TASK-015`.
- El envío y la capa de red → `TASK-013` (A).
- El canal de contacto efectivo (mensajería) → `TASK-024` (baja prioridad, ver esa spec).
- El panel profesional y el estado interno del caso → **no existe en el APK** (guardrail #6).
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:sharing`
- Dueño: **B**
- Compartidos que **declara**:
  1. `AppDestination.kt` → **RUTA NUEVA `CaseStatusRoute(caseToken: String)`**
  2. `PuenteJovenNavHost.kt` → montar la ruta
  3. `feature/home/HomeScreen.kt` → sin entrada directa (se llega desde `TASK-015`/`TASK-007`)
  4. `Repositories.kt` → **contrato nuevo**: ver §4
  5. `settings.gradle.kts` / `app/build.gradle.kts` → **sin cambios** (el módulo ya existe por
     `TASK-007`)

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `SupportRepository` | `observeRequest(requestId)` (el estado local, base del offline) |
| **`CaseStatusRepository`** (nuevo) | ver abajo |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- **Contrato nuevo `CaseStatusRepository`** — `[nuevo]`. **Debe ser de A**, porque es el borde con
  `:core:network` y define qué cruza la frontera Joven↔Red (`PR-003` §5). B lo **consume**, no lo
  define:

```kotlin
/** Estado del caso según la API Joven (PR-003 §5). Solo lectura. */
interface CaseStatusRepository {
    /** Estado remoto, o el último conocido si no hay red (marcado como desactualizado). */
    fun observeCaseStatus(caseToken: String): Flow<CaseStatus>
}
```

  - `CaseStatus` necesitaría modelo nuevo: `caseToken`, `estado`, `categoria`, `actualizadoEn`,
    `psicologo` (nullable), `canalContacto` (nullable), `mensajesNoLeidos`, **`isStale`**.
  - **La proyección de los 9 estados del caso a `SupportRequestState` es de A** (`REVISION-C.md` F1).
    B **no la inventa**: la consume y, si no existe, `TASK-016` queda bloqueada.
  - **El campo `isStale` es una propuesta de B** y no está en `PR-003` §5. Motivo: sin él, la
    pantalla no puede distinguir «estado real» de «último estado conocido» y **mentiría por omisión**
    cuando no hay red. A lo ratifica o propone otra vía.

- **Sin** acceso a `ChatAccessRepository` aquí: el canal de contacto es `TASK-024`.

**Regla de frontera:** ningún contrato profesional se compila en el APK (`PR-003` §9 invariante 10).
`CaseStatus` solo tiene los campos de §5 — **no** el estado interno del caso, **no** la carga del
profesional, **no** notas internas.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Antes de `ACEPTADO`, **no se muestran datos del psicólogo**: `psicologo == null` ⇒ la sección no existe en la UI | unitaria + instrumentada |
| 2 | Desde `ACEPTADO`, **sí** se muestran nombre visible, rol y especialidad (R5) | instrumentada |
| 3 | **En `ACEPTADO` sin comunicación iniciada: `psicologo != null` Y `canalContacto == null`.** La pantalla muestra los datos **sin** ofrecer canal | unitaria (el par de `PR-020` criterio 5, replicado) |
| 4 | El canal de contacto aparece **solo** desde `CONTACTO_HABILITADO` (R1) | unitaria |
| 5 | **Sin red**: se muestra el último estado conocido **marcado como desactualizado**; nunca se inventa un estado | unitaria + instrumentada |
| 6 | La pantalla **no muestra** notas internas, estado interno del caso ni carga del profesional | `grep` + revisión (sin campos de ese tipo en `CaseStatus`) |
| 7 | El copy **no promete contacto inmediato** (no hay guardia 24/7) e incluye los números de crisis | revisión de contenido |
| 8 | El joven **no revela su identidad**: la pantalla no muestra ningún dato identificativo propio (alias incluido) en un contexto que pudiera salir del dispositivo | revisión |
| 9 | El APK **no compila ningún contrato profesional** | `ModuleGraphGuardTest` (versión reescrita por `TASK-013`) |
| 10 | **Cero literales de copy en Kotlin** | `grep` + revisión |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **`PR-003` R5 + R1 (conciliación)** | Criterios #1–#4. Es la regla más fácil de implementar mal |
| **`PR-003` §6.3 — lo que la app NO muestra nunca** | Criterio #6 |
| **`PR-003` §15 / Q8 — sin guardia 24/7** | Criterio #7: honestidad sobre el tiempo |
| **`PR-001` P5** | *"El sistema nunca promete una respuesta que no puede dar"* |
| **`PR-001` §9 — fila «Reporte enviado»** | *"Que una persona lo está revisando; nunca notas internas"* |
| **#6 — el APK no expone el panel profesional** | Criterio #9 |
| **`PR-003` §9 invariantes 5, 6, 7, 10** | No ver datos antes de `ACEPTADO`; no tener canal sin que el psicólogo lo inicie; el joven sigue seudónimo; ningún contrato profesional en el APK |
| **`PR-003` §8 — versionado** | La respuesta lleva `contratoVersion`; la app tolera una versión mayor conocida |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Brief §13 (nivel rojo) y §17 (después de autorizar).
- `PR-001` §9, filas «Rojo», «Reporte enviado» y «Fuera de horario».
- Design system: `SummaryCard`, `InfoBadge` (aviso de cobertura y de desactualizado), `AttentionCard`,
  `EditorialHeader`, `PuenteStates` (estado sin conexión), `ResourceCard` (números de crisis).
- **`PuenteStates` tiene `ErrorState`/`EmptyState`**: el estado «desactualizado» probablemente encaja
  en `InfoBadge` o `ErrorState` sin crear nada. Si no encaja, **se pide a A**.

## 8. Dependencias

- **Bloquea:** `TASK-012` (la secuencia narrativa termina aquí).
- **Bloqueado por:** `TASK-015` (el paquete y su `caseToken`), **`TASK-013`** (A: `:core:network`, la
  proyección de estados de F1, y el `ModuleGraphGuardTest` reescrito), `PR-003` ✅.
- **Specs relacionadas:** `TASK-015`, `TASK-007` (el estado local de la solicitud), `TASK-024`
  (el canal), `PR-020` (C, pruebas de contrato entre productos), `PR-018` (C, auditoría).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **La proyección de los 9 estados del caso a `SupportRequestState`** (hallazgo **F1** de `REVISION-C.md`, asignado a A). Sin ella, esta pantalla no se puede cerrar | A | **Bloquea el cierre** |
| **Q2** | ¿Se aprueba `CaseStatusRepository` + `CaseStatus` (con `isStale`)? Es el borde con `:core:network` | A | **Bloquea el arranque** |
| Q3 | ¿Con qué frecuencia se refresca el estado? `PR-003` §5 es un `GET` sin política de refresco. Un polling agresivo en un servidor de 0.1 vCPU es inviable | A | Consumo y UX |
| Q4 | Cuando el estado es `RESUELTO → CERRADO`, ¿la pantalla desaparece del grafo, se archiva o queda accesible desde el recorrido? `REVISION-C.md` §5.1 aclara que son **dos** estados | A / producto | Ciclo de vida de la ruta |
| Q5 | ¿`mensajesNoLeidos` se muestra si no hay canal (`canalContacto == null`)? Sería incoherente, pero el campo viene en el contrato de §5 | A | Criterio #3 |
| Q6 | Si el backend devuelve una `contratoVersion` mayor que la soportada, ¿la app avisa, degrada o bloquea? `PR-003` §8 dice que el backend sostiene la anterior, pero no define el comportamiento del cliente | A | Robustez |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 y Q2 resueltas** por A; **`TASK-013` publicada** (`:core:network` + guarda reescrita)
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluida la del **par R1/R5** (criterio #3)
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
