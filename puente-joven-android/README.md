# Puente Joven La Paz — MVP Android

App Android de apoyo emocional estructurado para adolescentes de 13 a 18 años de
La Paz (Bolivia) que atraviesan separación/divorcio parental.

**No es terapia. No diagnostica. No es un chat generativo abierto.**
Es acompañamiento estructurado basado en reglas + derivación a apoyo humano.

> Esta app es **exclusivamente Puente Joven**. **Puente Red** (panel profesional) es
> un sistema web/tablet separado y no se referencia desde aquí.

---

## Estado del MVP

| Fase | Contenido | Estado |
|---|---|---|
| TASK-001 | Fundación Android (módulos, navegación tipada, Hilt, contratos) | ✅ |
| TASK-002 | Sistema visual Compose (tema, componentes, galería) | ✅ |
| TASK-003…009 | Sesión privada, conversación, señales, herramientas, solicitud de apoyo, backend, calidad | ⏳ pendientes |

La app **no se conecta a ningún backend todavía**. La capa de datos usa una
implementación local con fixtures sintéticos, sustituible por un adaptador remoto
mediante Hilt sin tocar UI ni casos de uso.

---

## Módulos

```
:app                        Composición, NavHost tipado, MainActivity
:core:model                 Entidades de dominio puras (sin Android)
:core:common                AppResult, UiError, Clock, DispatcherProvider, FeatureUiState
:core:designsystem          Sistema visual: tema, componentes, formas, motion
:core:navigation            AppDestination tipado + AppNavigator
:core:data                  Contratos de repositorio + implementación local (fixtures)
:core:security              Contratos de cifrado local (PassThrough de demostración)
:feature:auth               Entry, Login (sesión local)
:feature:onboarding         Encuadre, privacidad, expectativas
:feature:home               Inicio del joven
```

### Flujo de dependencias

```
Composable Route → ViewModel → UseCase → Repository interface → Local implementation
                                                              (fixtures ahora, backend después)
```

- `:core:model` y `:core:common` **no dependen de Android**.
- `:app` no contiene reglas de negocio ni fixtures de pantalla.
- Ninguna feature recibe el `NavController`: dependen de `AppNavigator`.

---

## Navegación tipada

Todas las rutas son tipos `@Serializable` en `:core:navigation`. **Está prohibido
usar strings sueltos de navegación.**

`EntryRoute` → `LoginRoute` → `OnboardingRoute` → `HomeRoute`

Destinos completos del grafo joven (los pendientes montan `PlaceholderScreen`):
`ConversationRoute`, `ContextCheckRoute`, `SignalsRoute`, `SituationMapRoute`,
`AttentionRoute`, `ToolsRoute`, `ToolDetailRoute`, `PersonalReportRoute`,
`JourneyRoute`, `SummaryReviewRoute`, `ConsentRoute`, `SupportRequestStatusRoute`,
`ProfileRoute`.

Tras el login y el onboarding se usa `navigateAndClearStack`: "atrás" no vuelve a
credenciales.

---

## Contratos de repositorio

Definidos en `:core:data` (`repository/Repositories.kt`). Todo devuelve
`AppResult<T>` o `Flow<T>`.

| Interfaz | Responsabilidad |
|---|---|
| `YouthRepository` | Perfil local, creación de sesión, bloqueo |
| `ConversationRepository` | Conversación estructurada (cifrada) |
| `ContextCheckRepository` | Chequeo contextual guiado |
| `SignalsRepository` | Señales, mapa de situación, prioridad preliminar |
| `ToolsRepository` | Herramientas breves y sus finalizaciones |
| `ReportRepository` | Reporte personal y recorrido |
| `SharingRepository` | Resumen compartible y consentimiento |
| `SupportRepository` | Solicitudes de apoyo y su estado visible |

### Sustitución por backend

El único punto a cambiar está en `core/data/di/DataModule.kt`:

```kotlin
@Binds
abstract fun bindYouthRepository(impl: LocalPuenteRepository): YouthRepository
```

Se reemplaza `LocalPuenteRepository` por el adaptador remoto (o un `DataStore` que
combine local + remoto). **No se toca UI ni casos de uso.**

> No se escriben URLs, endpoints, credenciales ni llamadas HTTP por anticipado
> (guardrail #8).

---

## Sistema visual

Ver **[DESIGN.md](DESIGN.md)** — fuente única de verdad del diseño.

Resumen: paleta índigo/teal/lavanda del MVP web, tipografía Fraunces + Manrope +
DM Mono **empaquetada**, formas orgánicas blob, movimiento con reducción
respetada y estados de prioridad que **nunca** se comunican solo con color.

---

## Requisitos

| Componente | Versión |
|---|---|
| JDK | 17 |
| Gradle | 8.14 (wrapper incluido) |
| AGP | 8.7.3 |
| Kotlin | 2.0.21 |
| Compose BOM | 2024.12.01 |
| compileSdk / targetSdk | 35 |
| minSdk | 26 |
| JVM target | 17 |

---

## Compilar

```bash
# JDK 17 obligatorio
export JAVA_HOME="/c/Program Files/Java/jdk-17"

# Requiere platforms/android-35 y build-tools/35.0.x en el SDK
./gradlew :app:assembleDebug

# Pruebas unitarias
./gradlew test

# Pruebas instrumentadas (requiere dispositivo/emulador)
./gradlew :app:connectedDebugAndroidTest
```

El SDK se configura en `local.properties` (`sdk.dir`).

---

## Privacidad y seguridad

- `allowBackup=false` y reglas de extracción de datos que excluyen **todo** del
  backup en nube y de la transferencia entre dispositivos.
- **Sin permisos de red**: la app no se conecta a ningún servicio.
- Sin analítica, sin crash reporting, sin telemetría.
- El contenido del joven se cifra localmente antes de almacenarse
  (`LocalCipher`).
- Los errores usan claves de recurso, nunca datos personales.

> `PassThroughLocalCipher` **no cifra**: es una implementación de demostración que
> debe sustituirse por KeyStore/AES-GCM antes de manejar datos reales.

---

## Guardrails (resumen)

1. Verde/amarillo/rojo = **prioridad preliminar de revisión**, nunca diagnóstico.
2. La app no contiene Puente Red ni navega a ninguna superficie profesional.
3. No hay chat generativo libre, diagnóstico ni manejo autónomo de crisis.
4. Las alertas reales solo se activan con guardia humana y protocolo aprobado.
5. El chat personal es privado y localmente cifrado.
6. Los datos de demostración nunca se mezclan con datos reales.
