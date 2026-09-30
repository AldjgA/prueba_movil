# NECESIDADES — TASK-004

**Agente:** B — APK juvenil · **Fecha:** 2026-09-30 · **Spec:** `specs/TASK-004-conversacion-chequeo.md`
**Rama:** `agente/B-juvenil` · **Estado de la spec:** ✅ **Aprobada** (`REVISION-B-POR-A.md` §1)

> Código entregado: `feature/conversation/**` (14 ficheros Kotlin + `strings.xml`).
> **Verificado**: compila y **20 pruebas unitarias en verde** (ver §9). Aun así, **no se
> integra** hasta que A aplique §1–§3: el módulo no está en `settings.gradle.kts`.
> Nada de lo de abajo está aplicado: B no ha tocado ningún archivo compartido.

---

## 1. Módulo nuevo

```
include(":feature:conversation")
```

## 2. Dependencia de build (la aplica A)

`app/build.gradle.kts`:

```
implementation(project(":feature:conversation"))
```

## 3. Rutas del NavHost a sustituir

`PuenteJovenNavHost.kt` — los dos placeholders por las pantallas reales:

| Ruta del grafo | Pantalla | Nota de import |
|---|---|---|
| `ConversationRoute` | `bo.puentejoven.feature.conversation.ConversationRoute` | **colisiona de nombre** con `core:navigation.ConversationRoute`: hay que aliasar, como ya se hace con `HomeRoute as HomeScreenRoute` |
| `ContextCheckRoute` | `bo.puentejoven.feature.conversation.ContextCheckRoute` | ídem; la ruta tipada ya trae `conversationId`, y el ViewModel lo lee del `SavedStateHandle` con la clave `conversationId` |

```
ConversationRoute            → ConversationScreenRoute(navigator)
ContextCheckRoute            → ContextCheckScreenRoute(navigator)
```

## 4. Entrada desde Home

**No hace falta nada nuevo.** `HomeViewModel` ya traduce `StartConversation` a
`ConversationRoute` (`HomeViewModel.kt:79`). La Ruta A entra por ahí.

⚠️ **Pero hay un conflicto que sí hay que resolver:** hoy `HomeUiAction.OpenHelpSomeone`
también navega a `ConversationRoute`, con este comentario:

```kotlin
// "Ayudar a alguien" se resuelve dentro de la conversación estructurada:
// no existe una superficie profesional en esta app (guardrail #6).
```

Eso era correcto cuando `TASK-008` no tenía spec. **Ya no lo es**: `TASK-008` define
`feature:help` con estructura propia, y el brief §18 prohíbe explícitamente reutilizar el
flujo de la Ruta A. Cuando A aplique D2 (contrato de Home), la tarjeta «Quiero ayudar a
alguien» debe apuntar a `HelpRoute`, **no** a `ConversationRoute`. Lo dejo declarado para
que no se pierda entre los dos cambios.

## 5. Métodos de repositorio

### 5.1 `LocalPuenteRepository.appendPuenteMessage` — **falta una validación**

`TASK-004` criterio #2 exige que **ningún turno de Puente se cree sin `promptId`**.
Hoy la implementación **acepta `promptId = ""`** (`LocalPuenteRepository.kt:745-763`): no
hay comprobación.

```
appendPuenteMessage(conversationId, content, promptId)   [EXISTENTE — falta validar]
  → si promptId.isBlank() ⇒ AppResult.Failure(UiError.Validation(technical = "blank promptId"))
```

Motivo: `promptId` es lo que hace auditable un turno de la app (guardrail #3: sin modelo
de lenguaje, todo turno nace de una plantilla). Un turno sin `promptId` es indistinguible
de contenido generado, y es exactamente lo que el guardrail prohíbe.

### 5.2 `ContextCheckRepository.availableQuestionKeys()` — **está desfasado**

Hoy devuelve cuatro claves **en español, inventadas antes de que existieran las specs**:

```kotlin
"hoy_como_estas", "donde_ocurre", "cada_cuanto", "con_quien_puedes_contar"
```

El catálogo real vive en `GuidedScriptCatalog` (10 dimensiones del brief §9, claves
`check.feelings`, `check.sleep`, …) y **no coincide con esas cuatro**. `TASK-004` **no
consume** ese método, para no tener dos fuentes de verdad.

**Dos salidas, la decisión es de A:**

| Opción | Qué implica |
|---|---|
| **(a) Alinear** `availableQuestionKeys()` al catálogo canónico | El método vuelve a ser útil; pero obliga a `:core:data` a conocer claves de la feature |
| **(b) Retirar** el método del contrato | Menos superficie; `TASK-005` leería las respuestas guardadas, no el catálogo |

**B prefiere (b)**, y añade el motivo de fondo: **las claves de pregunta y opción son
vocabulario compartido entre `TASK-004` (las emite) y `TASK-005` (las interpreta)**. Ese
vocabulario debería declararse una vez —como `PR-003` hizo con las claves de señal
(§4.1)— y no vivir duplicado en `:core:data` y en la feature.

## 6. Componentes del design system

**Ninguno nuevo.** Se reutilizan `EditorialHeader`, `PuenteOrb`, `PuenteActions`
(`PrimaryAction`/`SecondaryAction`/`PuenteButtonState`), `PuenteStates`
(`LoadingState`/`ErrorState`/`EmptyState`), `SignalChip` y los tokens de `PuenteTheme`.

## 7. Otros

| Necesidad | Detalle |
|---|---|
| `ModuleGraphGuardTest` (TASK-013) | Debe cubrir `:feature:conversation` y verificar que **no** depende de `:core:network` |
| `:core:data` — `DemoFixtures.kt` | Sigue emitiendo `SignalKey("frequency")` y `SignalKey("isolation")`. `PR-003` §4.1 retiró `frequency` y fijó MAYÚSCULAS. **Es de A** (`:core:data`): lo necesita `TASK-005`, no `TASK-004`, pero lo declaro aquí para que no se pierda |
| `gradle.properties` | Sigue fuera del control de versiones a propósito. Correcto |

## 8. Observación (no bloquea `TASK-004`)

La regla de la casa #2 dice que ningún texto visible va literal en Kotlin. `:feature:home`
la incumple hoy en tres sitios —`ObserveHomeUseCase.greeting()` (`"Buenos días"`,
`"Hola"`, `"Buenas noches"`), `HomeViewModel` (`"Todavía no hay señales registradas"`,
`"Hay algo que cambió"`) y `HomeScreen` (todos sus títulos)—. D3 cubre `:core:model`, pero
no `:feature:home`, que es de A.

No lo toco (no es mi módulo). Lo dejo anotado porque, si la regla no se aplica a lo que
ya existe, cada feature nueva tendrá que decidir por su cuenta si la cumple.

---

## 9. Verificación hecha por B (y cómo la hizo)

Como `settings.gradle.kts` es de A, B **no podía compilar** su propio módulo. Para no
entregar código sin verificar, usó un **arnés temporal**:

```bash
# 1. copia de settings.gradle.kts + include(":feature:conversation")
# 2. ./gradlew -c settings-b.gradle.kts :feature:conversation:testDebugUnitTest
```

El fichero del arnés **se ha eliminado** (duplicaría la configuración de A y derivaría en
cuanto A añada módulos). Se recrea en un minuto si hace falta.

**Resultado:**

```
> Task :feature:conversation:compileDebugKotlin
> Task :feature:conversation:testDebugUnitTest
BUILD SUCCESSFUL in 58s

ContextCheckViewModelTest    tests="6"  failures="0"  errors="0"
ConversationViewModelTest    tests="7"  failures="0"  errors="0"
GuidedScriptCatalogTest      tests="7"  failures="0"  errors="0"
```

**20 pruebas, 0 fallos.** `kspDebugKotlin` (Hilt) pasa, así que el grafo de inyección del
módulo es correcto.

⚠️ **Detalle de entorno, para A:** el `gradle.properties` **commiteado** apunta a
`C:/Program Files/Java/jdk-17`, que **no existe en esta máquina**; el JDK real está en
`C:/Users/Aldjg/.workbuddy-ai/binaries/jdk/jdk-17.0.20.1+1`. B lo ha ajustado **solo en
local y sin commitear** (como marca la convención del proyecto). Si A compila en su
worktree y falla, es por esto.

## 10. Lo que B ha hecho y lo que NO

| Hecho | No hecho (y por qué) |
|---|---|
| `feature/conversation/**` completo: 4 casos de uso, 2 ViewModels, 2 pantallas, 2 Routes, catálogo del guion, `StringResolver` + Hilt | **Integrar**: `include(...)` y el NavHost son de A |
| `strings.xml` con todo el copy — **0 literales en Kotlin** (criterio #6) | **Aplicar D1/D2** (`PuenteBottomNavigation`, contrato de Home) |
| 3 ficheros de prueba, **20 casos, todos en verde** | **`ModuleGraphGuardTest`**: lo reescribe A en `TASK-013` |

**Cuando A aplique §1–§3, B rebasa y vuelve a ejecutar
`:feature:conversation:testDebugUnitTest` + `:app:compileDemoDebugKotlin` sobre `main`
integrado, y reporta.**
