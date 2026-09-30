# HANDOFF — Refactor de CheckCatalog a 10 dimensiones (checkpoint incompleto)

**Fecha:** 2026-09-30
**Rama:** `agente/B-juvenil`
**Último commit estable antes de este checkpoint:** `900beea`
**Objetivo del checkpoint:** dejar en el remoto todo lo hecho para que otro agente pueda terminarlo sin
reconstruir el análisis ni perder cambios.

> ⚠️ **Este checkpoint NO está verificado ni debe presentarse como integrado.** Quedó a mitad del
> refactor de `CheckCatalog`; hay cambios de API entre `:core:model`, `feature:conversation` y
> `feature:signals`. El siguiente agente debe partir de este commit, leer §2–§5 y compilar antes de
> continuar con `TASK-006a`.

---

## 1. Decisión del usuario que inició este trabajo

El dueño del producto eligió **"10 dimensiones"**, no las 5 del prototipo. La decisión responde a
un hallazgo documentado en `REVISION-CHECKCATALOG.md`:

- El brief §9 y `TASK-004` criterio #4 exigen **10 dimensiones**.
- A había publicado `CheckCatalog` con las **5** del prototipo.
- Con solo 5, `abuso` (rojo) perdía su única fuente (`violence = physical`) y `acoso` —que A acababa
de añadir a `MotivoCatalog` como caso central del brief— nacía **inalcanzable**.

**No reducir de nuevo a 5.** Mantener las 5 del prototipo tal cual y completar con:

```
bullying · family · violence · support · substance
```

El contrato ya fue actualizado en `PR-003-CONTRATO-DATOS-JOVEN-RED.md` §4.3 dentro de este
checkpoint. `CheckCatalog.kt` también está ampliado a 10, con pruebas nuevas.

---

## 2. Cambios ya hechos (sin verificar)

### 2.1 Documentación / contrato

- **Nuevo:** `REVISION-CHECKCATALOG.md`
  - explica por qué las 5 eran incompatibles con `PR-001` §4.3;
  - la decisión del usuario ya está tomada (10 dimensiones);
  - es útil como trazabilidad, no volver a debatir 5 vs 10.
- **Modificado:** `PR-003-CONTRATO-DATOS-JOVEN-RED.md` §4.3
  - tabla de 10 claves/opciones;
  - aclara que `safety` es la única pregunta del formulario que sube a rojo por sí sola, pero
    `violence = physical` también puede subir por el motivo `abuso`;
  - `skip` es válido en toda pregunta;
  - declara explícitamente que `ideacion_activa`, `plan_estructurado`, `intento_reciente` siguen
    sin fuente y requieren decisión clínica.

### 2.2 `:core:model`

- **Modificado:** `CheckCatalog.kt`
  - 10 preguntas y sus opciones cerradas;
  - `OPTION_SKIP = "skip"`, aceptado en cualquier pregunta;
  - `emotions` es la única multi-selección;
  - constantes de `MotivoCatalog` para que `feature:signals` deje de duplicar motivos.
- **Modificado:** `CheckCatalogTest.kt`
  - prueba que cubre las 10 dimensiones;
  - prueba que `acoso` y `abuso` tienen pregunta fuente;
  - prueba que `skip` es válido en todas;
  - prueba de multi-selección.

### 2.3 `feature:conversation`

Refactor iniciado para que **consuma** `CheckCatalog` en vez de declarar `check.*` localmente:

- `GuidedScriptCatalog.kt` fue reescrito:
  - claves/opciones vienen de `CheckCatalog`;
  - el copy se mapea a `strings.xml` local;
  - `CheckQuestion` tiene `isMultiSelect`;
  - la prueba de catálogo obliga a que cada clave/opción del core tenga copy local.
- `strings.xml` reescrito con copy de las 10 preguntas y opciones canónicas.
- `ContextCheckUseCase` cambió de `optionKey: String` a `optionKeys: Set<String>`:
  - multi-selección se persiste como **varias filas `ContextResponse`** con la misma pregunta;
  - `skip` no se combina con otras opciones;
  - valida contra `CheckCatalog`.
- `ContextCheckUiAction`/`ContextCheckUiState`/`ContextCheckViewModel` y `ContextCheckScreen` están
  en refactor para selección múltiple.

### 2.4 `feature:signals`

- `AttentionRuleset.kt` reescrito para tomar:

```kotlin
answers: Map<String, Set<String>>
```

  y claves de `CheckCatalog`, en lugar de sus propios `CheckKey`/`CheckOption`.
- `AttentionCatalog.kt` deja de duplicar `MotivoCatalog`; conserva solo `SignalCatalog` + el mapeo
  señal → motivo.
- `ObserveSignalsUseCase` agrupa `ContextResponse` por pregunta en conjuntos de opciones.
- `AttentionRulesetTest.kt` reescrito contra el catálogo canónico:
  - prueba `acoso`, `abuso`, acumulación y las 3 carencias clínicas;
  - prueba `D2` (un rojo no se degrada);
  - prueba multi-selección de emociones.

---

## 3. Qué está incompleto / probable estado de compilación

**No se ejecutó ningún build después del refactor.** El último build exitoso fue antes de estos cambios:

```text
:core:model:test + :feature:conversation:compileDebugKotlin + :feature:signals:compileDebugKotlin
BUILD SUCCESSFUL
```

Con el checkpoint actual, deben arreglarse/actualizarse los tests y probablemente imports antes de
volver a compilar.

### 3.1 Tests de `feature:conversation` que seguro hay que actualizar

`ContextCheckViewModelTest.kt` aún usa la API vieja:

```kotlin
ContextCheckUiAction.Decide(questionKey = ..., optionKey = ...)
```

Ahora es:

```kotlin
ContextCheckUiAction.Decide(questionKey = ..., optionKeys = setOf(...))
```

Actualizar todos los casos de `Decide` a `optionKeys = setOf("...")`.

**Añadir pruebas obligatorias:**

1. `emotions` admite seleccionar al menos dos opciones y, tras confirmar, persiste dos
   `ContextResponse` con `questionKey = emotions`.
2. `skip` avanza y persiste `optionKey = skip`.
3. `skip` + otra opción se rechaza.
4. Una pregunta de una sola opción reemplaza la selección anterior.

### 3.2 Tests de `feature:signals` que seguro hay que actualizar

Los tests viejos pasaban `Map<String, String>` a `AttentionRuleset.evaluate`; ahora deben ser
`Map<String, Set<String>>`. El fichero principal (`AttentionRulesetTest.kt`) fue reescrito, pero
revisar también `AttentionViewModelTest.kt` y `SignalsViewModelTest.kt` por cualquier respuesta vieja
grabada en el repositorio.

### 3.3 Revisión necesaria de `ContextCheckViewModel`

Se añadió `selectedOptions`. Revisar visual y funcionalmente:

- multi-select (`emotions`) → toca chips y confirma con botón;
- single-select → el chip decide de inmediato;
- cuando llega la siguiente pregunta, la selección se limpia;
- no permitir confirmar un conjunto vacío;
- el error conserva la selección, para reintentar.

### 3.4 Revisión de reglas clínicas / de producto

**No tocar a ciegas:**

- `ideacion_activa`, `plan_estructurado`, `intento_reciente` siguen sin fuente. Se deja declarado
  y probado; no inventar una pregunta sin decisión clínica.
- Los teléfonos de crisis reales siguen pendientes de la ONG. No inventar números.
- El umbral de acumulación sigue en `AttentionRuleset.ACCUMULATION_THRESHOLD = 3`, una decisión de
  ingeniería versionada, no una validación clínica.

---

## 4. Orden seguro para el siguiente agente

1. Ejecutar:

```bash
cd "C:/Users/Aldjg/WorkBuddy AI/cosa/pj-agenteB/puente-joven-android"
./gradlew :core:model:test :feature:conversation:testDebugUnitTest :feature:signals:testDebugUnitTest
```

2. Arreglar primero **los errores de compilación de tests** (la API cambió a `optionKeys`).
3. Añadir las cuatro pruebas obligatorias de §3.1.
4. Repetir los tres tests de módulo hasta verde.
5. Solo después intentar `:app:assembleDemoDebug`.
   - El Security Center bloquea intermitentemente `C:\Users\Aldjg\.gradle\caches\8.14\transforms\**`.
   - Si bloquea, **no es un error de código**; no insistir en un bucle. Los builds de módulo son más
     fiables. Pedir al usuario que ejecute el build completo si hace falta.
6. Revisar `git diff`, commitear el refactor como una unidad y entonces seguir con `TASK-006a`.

---

## 5. Convenciones que no se deben romper

- `:core:model/**` es de A. El usuario pidió guardar el checkpoint; cualquier agente que continúe
  debe revisar este cambio con A antes de fusionar a `main`.
- Copy visible → `strings.xml`; ningún literal nuevo en Kotlin.
- No editar `core/designsystem/**`.
- No añadir `:core:network` en features.
- Un rojo no se degrada solo (`AttentionRuleset.enforceNoDegrade`).
- La pantalla juvenil **no muestra** claves de `motivo`.
- `frequency` no es señal; `SignalCatalog.canonicalOrNull` la rechaza.
- `gradle.properties` queda modificado solo para el JDK local en este worktree y **no se debe
  commitear**.

---

## 6. Estado Git al crear este handoff

Hay cambios sin commitear en:

```text
PR-003-CONTRATO-DATOS-JOVEN-RED.md
REVISION-CHECKCATALOG.md
puente-joven-android/core/model/CheckCatalog.kt
puente-joven-android/core/model/CheckCatalogTest.kt
puente-joven-android/feature/conversation/** (catálogo, use case, UI, estado, tests, strings)
puente-joven-android/feature/signals/** (reglas, catálogos, use case, tests)
```

Se deben incluir todos **excepto** `puente-joven-android/gradle.properties`.
