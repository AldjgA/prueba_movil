# Informe — TASK-001 + TASK-002 · gstack-designer

> **Entrega:** fundación Android (Kotlin + Compose + MVVM + Hilt + navegación tipada)
> y sistema visual fiel al MVP web, para la app **Puente Joven La Paz**.
> **Resultado de compilación REAL y verificado:** APK generado, 17 tests unitarios en verde.

---

## 1. Resultado de compilación (REAL, no estimado)

Entorno: JDK 17 (`C:/Program Files/Java/jdk-17`), Gradle 8.14, Android SDK en `C:/adt/sdk`
(se aceptaron licencias y AGP instaló `platforms/android-35` + `build-tools/34.0.0`).

| Comando | Resultado |
|---|---|
| `./gradlew :app:assembleDemoDebug` | ✅ **BUILD SUCCESSFUL in 2m 38s** (249 tareas) |
| `./gradlew :app:compileDemoDebugKotlin` | ✅ **BUILD SUCCESSFUL** (154 tareas, 0 errores) |
| `./gradlew :core:data :feature:auth :feature:home :feature:onboarding testDebugUnitTest` | ✅ **BUILD SUCCESSFUL in 2m 42s** |
| Errores de compilación Kotlin (`e:`) | **0** |

### Artefactos producidos

```
app/build/outputs/apk/demo/debug/app-demo-debug.apk      18.732.753 B (~18 MB)
app/build/outputs/apk/remote/debug/app-remote-debug.apk  18.732.749 B (~18 MB)
```

> El flavor `remote` fue añadido por `gstack-product-reviewer` (TASK-008).
> **Guardrail #5/#8:** ese flavor NO debe activar red ni datos reales hasta que se
> aprueben contratos y privacidad. En el MVP el backend no existe.

### Tests unitarios: 17/17 en verde

| Clase | Tests | Fallos |
|---|---|---|
| `feature.auth.login.LoginViewModelTest` | 6 | 0 |
| `feature.home.HomeViewModelTest` | 5 | 0 |
| `feature.onboarding.OnboardingViewModelTest` | 6 | 0 |

---

## 2. Arquitectura (TASK-001)

### Módulos Gradle reales (10)

```
:app
:core:model          entidades de dominio + IDs tipados (value classes)
:core:common         AppResult, UiError, Clock, DispatcherProvider, FeatureUiState
:core:designsystem   PuenteTheme + componentes + tokens
:core:navigation     AppDestination (rutas @Serializable, SIN strings sueltos)
:core:data           interfaces de repositorio + LocalPuenteRepository + Hilt
:core:security       LocalCipher (cifrado local del chat)
:feature:auth        Entry / Login
:feature:onboarding  Onboarding
:feature:home        Home joven
```

### Patrón por feature (obligatorio, cumplido)

`<Nombre>Route.kt`, `<Nombre>Screen.kt`, `<Nombre>ViewModel.kt`, `<Nombre>UiState.kt`,
`<Nombre>UiAction.kt`, `<Nombre>Effect.kt`, `domain/`, `test/`.

- **MVVM + Flow:** `StateFlow<UiState>` + `Channel<Effect>` para eventos one-shot.
- **Navegación tipada:** `AppDestination` (sealed + `@Serializable`). PROHIBIDO strings.
- **DI:** Hilt 2.52 + KSP. El seam de sustitución remota es `RepositoryModule`.
- **Config:** `compileSdk`/`targetSdk` 35, `minSdk` 26, JVM 17, `allowBackup=false`.

### Grafo de navegación

`Entry → Login → Onboarding → Home` (+ placeholders del resto del grafo joven).

---

## 3. Capa de datos — sin backend

Contratos de repositorio (interfaz) + implementación local de demostración inyectable.
Sustituir por adaptador remoto NO cambia la firma.

`YouthRepository`, `ConversationRepository`, `ContextCheckRepository`, `SignalsRepository`,
`ToolsRepository`, `ReportRepository`, `SharingRepository`, `SupportRepository`,
`ChatAccessRepository` (este último añadido por TASK-008 del compañero).

Sin URLs, endpoints ni credenciales. Los datos son `DemoFixtures` sintéticas
(guardrail #8: nunca datos reales).

---

## 4. Sistema visual (TASK-002)

**`PuenteTheme`** con tokens exactos del MVP web:

- **Color:** índigo `#5B5CF0` y 18 tokens más (`PuentePalette`).
- **Tipografía:** Fraunces (display), Manrope (sans), DM Mono (labels
  `tracking-widest` mayúsculas). Fuentes **empaquetadas** en
  `core/designsystem/src/main/res/font/` (TTF reales, sin descarga en runtime).
- **Formas:** `BlobShape` (blob-1/2/3 con los porcentajes exactos del CSS) como
  `Shape` de Compose vía `createOutline`.
- **Movimiento:** `PuenteMotion` respeta `Settings.Global.ANIMATOR_DURATION_SCALE`.

**Componentes** (nombres exactos):

`PuenteOrb`, `EditorialHeader`, `PrimaryAction`, `SecondaryAction`, `SignalChip`,
`AttentionCard`, `EvidenceCard`, `SummaryCard`, `PuenteBottomNavigation`,
`LoadingState`, `ErrorState`, `EmptyState` + `PuenteDesignSystemGallery` (galería interna).

**Accesibilidad:** touch targets 48dp, semántica de iconos, contraste, escalado de fuente,
respeto de animación reducida. Guardrail de color: **verde/amarillo/rojo = «prioridad
preliminar de revisión», NUNCA diagnóstico**, y nunca color sin texto + icono + explicación.

**Guardrail #6:** Puente Red NO existe. Ninguna pantalla lo referencia ni navega a él.

---

## 5. Incidencias resueltas durante la verificación

1. **`Conflicting overloads` en `:core:data`** — `SupportRepository.observeRequests()`
   y `ChatAccessRepository.observeRequests()` colisionaban (misma firma, distinto retorno;
   la JVM no distingue por tipo de retorno) al implementarlos la misma clase.
   → Renombrado `ChatAccessRepository.observeChatAccessRequests()` (sin consumidores
   afectados). Documentado en KDoc.
2. **`:core:navigation` — `Unresolved reference 'serialization'`** → añadido
   `api(libs.kotlinx.serialization.json)` al build del módulo + versión en el catálogo.
3. **`EvidenceCard` / `PlaceholderScreen` / `PuenteActions`** — imports y clases de valor
   ausentes en previews → corregidos.
4. **`testInstrumentationRunner` ausente en `:core:designsystem`** → declarado para que
   `DesignSystemAccessibilityTest` pueda ejecutarse (cambio solo de variante `androidTest`;
   no afecta al APK).
5. **Races de build en Windows (infraestructura, no código):** varios procesos Gradle/java
   concurrentes sobre el mismo workspace y el `gradlew --stop` externo provocaban
   «Unable to delete directory … files open» y `NoSuchFileException` en KSP. Se verificó la
   compilación completa aislando los directorios de build
   (`isolate-build.init.gradle`) y bloqueando la tarea de forma serial. **Con esto el build
   terminó limpio.** El APK es real.

---

## 6. Trabajo pendiente / coordinación

1. `connectedAndroidTest` (instrumentadas: `NavigationFlowTest`,
   `DesignSystemAccessibilityTest`) requiere emulador/dispositivo. No ejecutado aún.
2. Aclarar en el flavor `remote` de `:app` que **no debe activar red ni datos reales**
   hasta aprobar contratos y privacidad (guardrails #5 y #8).
3. Limpiar artefactos temporales de verificación (`isolate-build.init.gradle`,
   `.isolated-build/`, `build-check.sh`) antes de cerrar: son andamios de build,
   no parte del entregable.
