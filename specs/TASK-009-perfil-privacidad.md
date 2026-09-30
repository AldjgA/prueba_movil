# TASK-009 · Perfil, privacidad y ajustes

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-003b`, `TASK-025`, `TASK-021` · **Bloquea:** `TASK-012`

## 1. Contexto

`ProfileRoute` está **huérfano**: la ruta existe (`AppDestination.kt:89`), el NavHost dice
*"Se implementa en TASK-003"* (`PuenteJovenNavHost.kt:197`), y TASK-003 se cerró sin crear el módulo.
No hay `feature:profile`. El brief §32 define qué debe contener: **Privacidad · Datos compartidos ·
Configuración · Cerrar sesión**.

**Esta tarea también cierra un trabajo a medias que el plan no menciona.** `TASK-025` (A) implementó
el **multi-perfil a nivel de datos** —`observeProfiles()`, `switchProfile()`, `deleteProfile()`,
`unlockSessionFor(alias, pin)`— y su propia spec dice que **la UI es de `TASK-009`**. Hoy esas cuatro
operaciones no tienen ninguna superficie: el multi-perfil existe en el repositorio y es invisible
para el usuario. **`TASK-009` es donde el fallo de privacidad de `TASK-025` queda realmente cerrado**
(`TASK-021`: *"multi-perfil obligatorio"* en dispositivos compartidos).

Y hay un dato de producto que gobierna esta pantalla, escrito en la KDoc de `observeProfiles()`:

> ⚠️ **Producto:** mostrar esta lista en la pantalla de entrada revelaría *quién usa la app*, que es
> un activo a proteger (`TASK-021` §5.1). El desbloqueo debe resolverse con `unlockSessionFor`
> (alias + PIN), **no** listando. Este `Flow` es para Ajustes (`TASK-009`), no para el login.

**Lo respeto al pie de la letra:** la lista de perfiles se muestra **solo** aquí, autenticado. Nunca
en la pantalla de entrada.

## 2. Alcance

### Dentro
- **Módulo nuevo** `feature:profile`, que sustituye el placeholder de `ProfileRoute`.
- **Gestión de perfiles del dispositivo** (cierra `TASK-025`): listar perfiles **existentes** (no
  alias en claro si se puede evitar), cambiar de perfil activo, borrar un perfil **sin tocar los
  demás**, y crear uno nuevo.
- **Privacidad** (brief §32): qué se guarda, dónde, por cuánto tiempo, y el estado de retención
  (`RetentionRepository.retentionStatus`).
- **Datos compartidos** (brief §32): qué se ha compartido y con quién, con la opción de **revocar**
  (consume `observeConsents()` y `observeRequests()`).
- **Configuración** (brief §32): preferencias locales, incluidos los `ShareDefaults` del perfil.
- **Cerrar sesión** (brief §32): `lockSession()` — el PIN sigue configurado.
- **Borrado manual** de todo el contenido local (`deleteAllLocalContent()`), con la advertencia de
  que es **irreversible por diseño** (F6).

### Fuera
- La pantalla de **entrada/login** y su desbloqueo por alias+PIN → `feature:auth` (ya existe).
- La lógica de datos del multi-perfil → ya está en `:core:data` (`TASK-025`), **no se reimplementa**.
- La construcción del resumen y el consentimiento → `TASK-007` (aquí solo se **muestra** y se revoca).
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:profile`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:profile")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:profile"))`
  3. `PuenteJovenNavHost.kt` → sustituir el placeholder de `ProfileRoute` (y **corregir la nota**:
     hoy dice *"Se implementa en TASK-003"*, que está cerrada y es incorrecta)
  4. `feature/home/HomeScreen.kt` → entrada «Privacidad» (brief §6, secundaria) + destino **Perfil**
     de la barra de 5 pestañas (decisión P3)
  5. `Repositories.kt` → **sin cambios** (todo lo necesario ya existe tras `TASK-025`)
  6. `AppDestination.kt` → sin cambios
  7. **`app/src/main/AndroidManifest.xml`** → **`android:allowBackup="false"`** y
     `android:dataExtractionRules` sin Auto Backup. Es un requisito de `TASK-021` y **vive en `app/`,
     que es de A**. Lo declaro aquí porque esta es la tarea que lo cierra.

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `YouthRepository` | `observeProfile()`, `observeProfiles()`, `switchProfile(profileId)`, `deleteProfile(profileId)`, `createProfile(alias, ageBand, pin)`, `lockSession()`, `observeSessionUnlocked()`, `isPinConfigured()`, `getRetentionPolicy()` |
| `RetentionRepository` | `retentionStatus(nowEpochMillis)`, `purgeExpired(nowEpochMillis)`, `deleteAllLocalContent()` |
| `SharingRepository` | `observeSummaries()`, `observeConsents()` |
| `SupportRepository` | `observeRequests()` |

**Métodos nuevos que necesita:** **ninguno.** `TASK-025` dejó el contrato completo. Es la primera
tarea de B que **no** necesita nada de A en `Repositories.kt`.

**Hallazgo que afecta a esta pantalla:** `LocalPuenteRepository` siembra
`DemoFixtures.youthProfile` en `profilesState` al construirse (`LocalPuenteRepository.kt:119`), y
`activeProfileIdState` arranca como `DEMO_YOUTH_ID` (`:116`). Solo se retira cuando el joven crea su
primer perfil real (`:339-340`). Por tanto **`observeProfiles()` puede devolver el perfil de demo**.
¿Se lista en Ajustes? Es una decisión de producto (§9 Q1), no un bug: el comentario del código lo
describe como *"un modo de entrada, no un perfil real"*.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | La **lista de perfiles NO aparece en la pantalla de entrada**: el login usa `unlockSessionFor(alias, pin)` y no expone ningún alias existente | revisión visual + `grep` (ninguna referencia a `observeProfiles` en `feature/auth/**`) |
| 2 | Borrar un perfil **no afecta** al contenido de los demás: tras borrar el perfil A, el perfil B conserva conversación, señales y recorrido | unitaria (dos perfiles con contenido; borrar uno; el otro intacto) |
| 3 | Cambiar de perfil **bloquea** el anterior: tras `switchProfile`, `observeSessionUnlocked()` es `false` hasta desbloquear | unitaria |
| 4 | «Cerrar sesión» llama a `lockSession()` y el **PIN sigue configurado** (`isPinConfigured()` sigue `true`) | unitaria |
| 5 | El **borrado manual** exige confirmación explícita y advierte de que es irreversible; tras ejecutarlo, el contenido no se puede recuperar | instrumentada + unitaria |
| 6 | La pantalla de **Datos compartidos** lista los consentimientos y solicitudes, y permite **revocar** sin eliminar el historial | instrumentada |
| 7 | El **estado de retención** se muestra con días restantes y aviso de renovación cuando corresponde (`RetentionStatus`) | instrumentada |
| 8 | `AndroidManifest.xml` tiene Auto Backup **desactivado** | revisión del manifiesto (criterio de `TASK-021`) |
| 9 | Ninguna superficie de Ajustes muestra el alias de **otro** perfil sin que el usuario lo pida explícitamente | revisión visual |
| 10 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 11 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **`TASK-021` §5.1 — familia con acceso físico** | Criterio #1 (no listar alias en el login) y #9. Es la mitigación central del modelo de amenaza |
| **`TASK-021` — multi-perfil obligatorio** | Criterios #2 y #3: cierran el fallo de privacidad en dispositivo compartido |
| **`TASK-021` — sin Auto Backup** | Criterio #8 (manifiesto, de A) |
| **`TASK-003` F6 — el contenido es irrecuperable por diseño** | Criterio #5: el borrado se advierte, no se suaviza |
| **`DECISIONES` §4.3 — revocar ≠ borrar** | Criterio #6: el copy distingue *"revocar futuros accesos"* de *"eliminar lo que una ley obliga a conservar"* |
| **#6 — el APK no expone el panel profesional** | «Datos compartidos» muestra **el estado seguro** de la solicitud, nunca notas internas ni el estado interno del caso |
| **`PR-003` §11 (R4) — perder el dispositivo = perder la cuenta** | Debe decirse en Privacidad con honestidad, sin prometer recuperación |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Brief §32 (contenido de Perfil: Privacidad · Datos compartidos · Configuración · Cerrar sesión).
- Design system: `PuenteSwitch` (preferencias y `ShareDefaults`), `SummaryCard`, `InfoBadge`,
  `EditorialHeader`, `PuenteActions` (acción destructiva), `PuenteStates`, `PuenteBottomNavigation`
  (pestaña «Perfil»).
- **Falta probable:** un patrón de **confirmación destructiva** para el borrado manual. El DS tiene
  `PrimaryAction`/`SecondaryAction`, pero no vi un diálogo de confirmación. Si no existe, **se pide
  a A** — no se improvisa uno con `AlertDialog` suelto.

## 8. Dependencias

- **Bloquea:** `TASK-012` (la integración narrativa valida el ciclo completo, que incluye
  entrada → perfil → cerrar sesión).
- **Bloqueado por:** `TASK-003b` ✅, `TASK-025` ✅ (datos listos), `TASK-021` ✅ (modelo de amenaza).
- **Specs relacionadas:** `TASK-025` (esta tarea cierra su UI), `TASK-021`, `TASK-003b`, `TASK-007`
  (frontera: aquí se revoca, allí se construye), `TASK-018` (la prueba de aislamiento entre perfiles
  es caso obligatorio de la suite).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | ¿El **perfil de demo** (`DemoFixtures.youthProfile`) se lista en Ajustes? Hoy se siembra al construir y solo se retira al crear el primer perfil real | producto | Criterio #9 |
| Q2 | `PIN`: `PinPolicy.LENGTH` está en **6** dígitos y la maqueta mostraba 4 (pregunta P13 de `PLAN-TRABAJO-SDD`, abierta desde el 28). ¿Se confirma 6? | producto / legal | Copy y validación |
| Q3 | ¿Quién aprueba `RetentionPolicy` y `PinPolicy`? `PLAN-TRABAJO-SDD` §5.3 (**P14**) dice que son decisiones legales y clínicas, y hoy están fijadas por defecto en el código. Esta pantalla **muestra** la política: si el valor no está aprobado, está mostrando un número sin respaldo | legal / dueño | Credibilidad de la pantalla |
| Q4 | En un dispositivo compartido, ¿puede un perfil **ver** que existen otros perfiles, o solo se muestra el número («hay 3 perfiles en este dispositivo»)? | producto | Criterio #9 |
| Q5 | ¿«Datos compartidos» debe mostrar también las **solicitudes de acceso al chat** (`ChatAccessRepository`), o solo los consentimientos y solicitudes de apoyo? | producto | Alcance |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 y Q4 resueltas** por producto
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluidas las de aislamiento (#2, #3)
- [ ] `NECESIDADES.md` entregado a A y aplicado (incluido el manifiesto)
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
