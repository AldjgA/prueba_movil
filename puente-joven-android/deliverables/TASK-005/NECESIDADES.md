# NECESIDADES — TASK-005

**Agente:** B — APK juvenil · **Fecha:** 2026-09-30 · **Spec:** `specs/TASK-005-senales-mapa-nivel.md`
**Rama:** `agente/B-juvenil` · **Estado de la spec:** ✅ **Aprobada** (`REVISION-B-POR-A.md` §1)

> Código entregado: `feature/signals/**` (3 pantallas, motor de reglas, 3 ficheros de prueba).
> Verificado con el mismo arnés que `TASK-004` (ver §9).

---

## 0. 🔴 Dos hallazgos que no son de ingeniería — necesitan decisión antes del piloto

### 0.1 🔴 El APK **no puede detectar** tres de los seis criterios de rojo de `PR-001` §4.3

`PR-001` §4.3 define el rojo como: *ideación suicida activa · plan · intento reciente ·
autolesión · abuso · peligro inmediato.*

De esos seis, **el APK solo puede detectar tres**:

| Criterio | ¿Tiene fuente en el APK? |
|---|---|
| `peligro_inmediato` | ✅ `check.safety = no` |
| `abuso` | ✅ `check.violence = physical` |
| `autolesion` | ⚠️ solo por una señal `SELF_HARM` — **y nadie emite esa señal hoy** |
| `ideacion_activa` | ❌ **ninguna** |
| `plan_estructurado` | ❌ **ninguna** |
| `intento_reciente` | ❌ **ninguna** |

**Por qué no hay fuente:** el chequeo contextual (`TASK-004`) sigue el brief §9, que
pregunta por sentirse · sueño · soledad · acoso · violencia · familia · escuela · apoyo ·
consumo · seguridad personal. **Ninguna dimensión es autolesión o ideación.** Y la
conversación es texto libre que **nada lee** (guardrail #3: sin IA en el APK).

**Consecuencia, dicha sin rodeos: un joven puede escribir «quiero morir» en la
conversación y el APK no eleva su prioridad.** El sistema hace exactamente lo que
`PR-001` P4 prohíbe: deja sin activar a la persona que debería activarse.

**Lo que B ha hecho:** no inventar. `MotivoCatalog.unreachableFromApk` declara los tres
criterios como inalcanzables, y una prueba (`AttentionRulesetTest`) **falla si alguna vez
aparecen sin que alguien añada una fuente deliberada**. La carencia es visible en el
código y comprobable en CI, en vez de ser un olvido silencioso.

**Lo que hace falta (decisión clínica, no de ingeniería):** cómo preguntar por
autolesión e ideación en el chequeo. `PR-001` §13 ya tiene la pregunta abierta (¿se
confirma la lista de rojo?) y §9 dice que el sistema *avisa*, no *valora*. Pero **no
existe hoy ninguna vía de aviso** para esos tres criterios. Es el hueco más serio que
he encontrado en el proyecto, y es de los que no se ven leyendo una spec: solo se ve
poniendo al lado «qué exige la regla» y «qué pregunta el formulario».

### 0.2 🔴 La pantalla de rojo **no tiene teléfonos de crisis**, y B no los va a inventar

`PR-001` §9 y `PR-003` §15 exigen que el rojo muestre *"instrucciones de emergencia +
números de crisis reales"*. **B no tiene números reales y no los inventa**: un número
de ayuda inventado en una pantalla de crisis es el peor fallo posible de este producto.

Hoy la pantalla muestra:
- instrucciones que **sí son ciertas sin teléfonos** (*"busca a un adulto de confianza
  que esté cerca, o llama a los servicios de emergencia de tu país"*);
- un aviso explícito de que **los teléfonos de ayuda de la zona no están configurados**;
- el aviso de cobertura honesto: **sin guardia 24/7** (Q8), sin prometer respuesta inmediata.

**Necesidad:** la ONG (o quien corresponda) aporta los **números reales por zona** y
quién los valida. Hasta entonces la pantalla es honesta, no está completa.

---

## 1. Módulo nuevo

```
include(":feature:signals")
```

## 2. Dependencia de build (la aplica A)

`app/build.gradle.kts`:

```
implementation(project(":feature:signals"))
```

## 3. Rutas del NavHost a sustituir

`PuenteJovenNavHost.kt` — los tres placeholders:

| Ruta del grafo | Pantalla | Nota de import |
|---|---|---|
| `SignalsRoute` | `bo.puentejoven.feature.signals.SignalsRoute` | aliasar, como `HomeRoute as HomeScreenRoute` |
| `SituationMapRoute` | `bo.puentejoven.feature.signals.SituationMapRoute` | ídem |
| `AttentionRoute` | `bo.puentejoven.feature.signals.AttentionRoute` | ídem; la ruta tipada trae `assessmentId`, que **hoy no se usa** (ver §6) |

## 4. 🔴 P0 · El vocabulario de claves del chequeo está duplicado y puede derivar en silencio

`AttentionRuleset` interpreta las claves de pregunta y opción de `TASK-004`
(`check.safety`, `check.violence`, `check.bullying`…) y las declara en
`feature/signals/domain/AttentionRuleset.kt` (`CheckKey` / `CheckOption`).

`GuidedScriptCatalog` (`feature:conversation`) las declara **por separado**.

**Es el mismo problema que `REVISION-C-POR-B.md` K1 detectó entre el APK y el backend,
pero ahora dentro del APK.** Y la consecuencia es peor que un error de compilación:
si las dos listas se separan, **la regla deja de dispararse y nada falla**. En el caso
de `check.safety` eso significa **no detectar un peligro inmediato**.

**B no puede arreglarlo solo:** `feature:signals` no depende de `feature:conversation`
(sería una dependencia feature→feature), y `:core:model` —el sitio natural para un
vocabulario compartido— es de A desde D3.

**Propuesta de B (en este orden):**

1. **A publica el vocabulario de claves del chequeo** en `:core:model` (o en un
   `:core:check` si se prefiere no engordar `:core:model`), con la misma forma que
   `PR-003` §4.1 dio a las claves de señal: **lista cerrada, forma canónica, versionada**.
2. `feature:conversation` y `feature:signals` lo consumen; ninguna de las dos lo declara.
3. Una prueba de contrato verifica que las claves del catálogo de preguntas están todas
   en el vocabulario publicado.

Mientras no se haga, B deja la duplicación **documentada y con una prueba que fija la
lista exacta** que el motor espera, para que un cambio en `TASK-004` se note.

## 5. 🔴 P0 · El catálogo de `motivo` no tiene clave para «acumulación» ni para «acoso»

Dos huecos de `PR-003` §4.2, los dos detectados al implementar las reglas:

| Criterio de `PR-001` §4.2 | Clave en `PR-003` §4.2 |
|---|---|
| *"varios factores acumulados"* | ❌ **no existe** |
| *"aislamiento"* | ✅ `aislamiento_persistente` |
| *"violencia no inmediata"* | ✅ `violencia_no_inmediata` |
| *"deterioro escolar"* | ✅ `deterioro_escolar` |
| *"malestar persistente"* | ❌ no existe (se cubre por acumulación) |

**Consecuencia 1 — acumulación:** un caso que sube a amarillo **por acumulación** (tres
factores, ninguno grave) viaja en el reporte con **`motivo` vacío**. El equipo recibe una
alerta amarilla sin saber por qué. B lo ha modelado con `LevelReason.ACCUMULATION` para
que la UI lo explique, pero **eso no viaja al backend**: `PR-003` §4 solo tiene `motivo`.

**Consecuencia 2 — acoso:** el brief hace del bullying el **caso central** del producto
(es el ejemplo de todo el prototipo), y `PR-003` §4.2 **no tiene clave para acoso**. B
mapea `check.bullying ∈ {often, every_day}` → `violencia_no_inmediata`, que es lo más
cercano en `PR-001` §4.2 — pero es una **decisión de mapeo de B**, no un hecho del
contrato, y conviene que A la ratifique o publique una clave propia.

**Propuesta:** A añade `acumulacion_factores` (o equivalente) y valora `acoso` a
`PR-003` §4.2. Es un cambio de catálogo → cambia `rulesetVersion`, no el diseño.

## 6. Métodos de repositorio

### 6.1 `SignalsRepository.getAttentionAssessment()` queda **redundante**

El nivel ya no se lee: se **calcula** (`AttentionRuleset`). El método devuelve hoy
`DemoFixtures.attentionAssessment`, un fixture constante que **no refleja lo que el joven
respondió**. Si alguna pantalla lo consume, mostraría una prioridad inventada.

**Propuesta:** retirarlo del contrato, o —si se quiere conservar para cuando exista
backend— dejarlo como la **proyección remota** y documentar que la fuente local es el
motor de reglas. **B no lo consume.**

### 6.2 **Ningún método nuevo.** Correcto según D4

No existe `assess(nowEpochMillis)`: el motor de reglas vive en la feature y consume lo
que el contrato ya ofrece. Es exactamente la alternativa que A prefirió en D4.

## 7. Datos que hay que corregir en `:core:data` (de A)

### 7.1 Las fixtures de señal siguen con el vocabulario viejo

`DemoFixtures` emite `SignalKey("frequency")`, `SignalKey("isolation")`,
`SignalKey("school_impact")`. `PR-003` §4.1 fijó MAYÚSCULAS y **retiró `frequency`**
(es una dimensión, no una señal).

**B ha hecho el motor tolerante** (`SignalCatalog.canonicalOrNull` normaliza a
mayúsculas y **rechaza** `frequency`), con pruebas. Pero:
- el fixture `frequency` **no aporta nada** al cálculo, aunque el brief §10 lo trate como
  la dimensión más importante. O se convierte en un campo de dimensión, o se retira;
- los `label` de las señales son literales en español en `:core:data`
  (`"Frecuencia"`, `"Aislamiento"`) → misma deuda que `:feature:home` (ver §8).

### 7.2 `AttentionLevel.labelOf` sigue devolviendo literales en español

Es D3, pendiente de A. **B no lo usa** (la pantalla resuelve el nivel con
`AttentionCard` + `attentionAccessibilityLabel` del design system), pero conviene
cerrarlo antes de que otra feature lo consuma.

## 8. Ya declarado en `TASK-004` y sigue vigente

- `appendPuenteMessage` no valida `promptId`.
- `availableQuestionKeys()` está desfasado (4 claves en español).
- `HomeUiAction.OpenHelpSomeone` navega a `ConversationRoute` en vez de a `HelpRoute`.
- `feature:home` incumple la regla #2 (literales en `HomeViewModel`, `HomeScreen`,
  `ObserveHomeUseCase.greeting()`).

## 9. Componentes del design system

**Ninguno nuevo.** Se reutilizan `EditorialHeader`, `AttentionCard`, `AttentionDot`,
`attentionIcon()`, `attentionAccessibilityLabel()`, `SignalChip`, `EvidenceCard`,
`IntensityMeter`, `PuenteStates`, `PuenteActions`.

**Posible petición futura:** el brief §12 describe el mapa de situación como una
**constelación de nodos**. B lo ha resuelto con `IntensityMeter` + tarjetas porque el DS
está congelado y no hay componente de grafo. Si producto quiere la constelación literal,
es una petición de componente a A, no algo que B improvise.

## 10. Verificación hecha por B

Mismo arnés temporal que `TASK-004` (`-c settings-b.gradle.kts` con los dos módulos de B):

```bash
./gradlew -c settings-b.gradle.kts :feature:signals:testDebugUnitTest :feature:conversation:testDebugUnitTest
```

**Resultado:**

```
BUILD SUCCESSFUL

feature:signals
  AttentionRulesetTest         tests="25"  failures="0"  errors="0"
  AttentionViewModelTest       tests="3"   failures="0"  errors="0"
  SignalsViewModelTest         tests="2"   failures="0"  errors="0"

feature:conversation  (sigue en verde, sin regresiones)
  GuidedScriptCatalogTest      tests="7"   failures="0"  errors="0"
  ConversationViewModelTest    tests="7"   failures="0"  errors="0"
  ContextCheckViewModelTest    tests="6"   failures="0"  errors="0"
```

**50 pruebas, 0 fallos** (30 nuevas de `TASK-005` + 20 de `TASK-004`).

**Una prueba falló y encontró un fallo real de diseño, no de código.** La primera versión
de la regla de acumulación trataba «dos señales en ascenso» como **un** factor; la prueba
demostró que el umbral significaba cosas distintas según cuántas señales hubiera. Se
corrigió a **un factor por señal en ascenso**, que es más simple y explicable. Es
exactamente el tipo de ambigüedad que un umbral sin prueba deja pasar.

## 11. Lo que B ha hecho y lo que NO

| Hecho | No hecho (y por qué) |
|---|---|
| `feature/signals/**`: motor de reglas versionado, 3 pantallas, 3 ficheros de prueba | **Integrar**: `include(...)` y el NavHost son de A |
| El invariante **D2 en el APK**: un rojo no se degrada solo, con prueba propia | **Aplicar D1/D2/D3** (barra, Home, i18n de `:core:model`) |
| `strings.xml` con todo el copy — **0 literales en Kotlin** | **Los teléfonos de crisis** (§0.2) y **la fuente de los 3 criterios** (§0.1): no son de ingeniería |
| Carencia declarada **en el código y en una prueba** (`unreachableFromApk`) | **`ModuleGraphGuardTest`**: lo reescribe A en `TASK-013` |
