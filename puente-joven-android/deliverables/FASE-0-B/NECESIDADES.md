# NECESIDADES — Fase 0 del Agente B (lote consolidado)

**Agente:** B — APK juvenil · **Fecha:** 2026-09-30
**Rama:** `agente/B-juvenil` · **Revisión asociada:** `REVISION-B.md`
**Alcance:** declaración **consolidada** de las 14 tareas de B (`TASK-004`…`TASK-011`, `TASK-015`…`TASK-018`,
`TASK-024`).

> **Nota sobre el formato.** `CONTRATO-DE-INTEGRACION.md` §2 define el fichero por tarea
> (`deliverables/<TASK-ID>/NECESIDADES.md`). Este es un **lote consolidado de Fase 0**, para que A
> pueda aplicar todo lo común en **una sola pasada** en lugar de 14. Al empezar cada tarea, B
> entregará además su `NECESIDADES.md` individual con lo específico de esa tarea.
>
> **Nada de lo aquí listado está aplicado.** B no ha tocado ningún archivo compartido.

---

## 0. Bloqueantes que necesitan **decisión** de A (no son aplicables todavía)

Sin estas cinco respuestas, B **no puede empezar `TASK-004`**. Detalle en `REVISION-B.md` §5.

| # | Decisión | Bloquea |
|---|---|---|
| **D1** | `PuenteBottomNavigation.kt` está **congelado** pero el plan encarga a B la barra de 5 pestañas (P3). B propone **parametrizar el componente** (opción a de `REVISION-B.md` H1) | `TASK-004`, `TASK-009`, `TASK-010`, `TASK-011` |
| **D2** | **Contrato de Home completo**: 6 enlaces (2 caminos principales + 4 secundarios), no el ejemplo de 1 tarjeta del contrato | `TASK-004`, `TASK-008`, `TASK-010`, `TASK-011` |
| **D3** | **Dueño y política de `:core:model/**`**: no está en los 7 archivos compartidos ni tiene dueño. Además incumple la regla de i18n #2 (`AttentionLevel.labelOf`, `SupportRequestState.label`, `TrendDirection.label` son literales en español) | `TASK-006a`, `TASK-006b`, `TASK-011`, `TASK-015`, `TASK-017` |
| **D4** | ¿Un **método nuevo** en un `Repository` existente se declara por `NECESIDADES.md`? B asume que sí | `TASK-005`, `TASK-006b`, `TASK-007` |
| **D5** | **Dueño de `TASK-018`** (H3): B la escribe, A la dispara en S5 | `TASK-018` |

---

## 1. Módulos nuevos

`settings.gradle.kts` → `include(...)`:

```
:feature:conversation    (TASK-004)
:feature:signals         (TASK-005, TASK-015)
:feature:tools           (TASK-006a)
:feature:report          (TASK-006b)
:feature:sharing         (TASK-007, TASK-016)
:feature:help            (TASK-008)
:feature:profile         (TASK-009)
:feature:nextsteps       (TASK-010)
:feature:referral        (TASK-011)
:core:audit              (TASK-017)  ← núcleo, no feature. Requiere aprobación (D3/Q1 de TASK-017)
```

## 2. Dependencias de build (las aplica A)

`app/build.gradle.kts` → `implementation(project(...))`:

```
:feature:conversation
:feature:signals
:feature:tools
:feature:report
:feature:sharing
:feature:help
:feature:profile
:feature:nextsteps
:feature:referral
```

`:core:audit` **no** se declara en `:app`: lo consumen las features, no la app.

Dependencias de test que podrían faltar en `TASK-018` (a confirmar por A): `androidx.test`,
`turbine`, `kotlinx-coroutines-test`.

## 3. Rutas nuevas en `AppDestination.kt` (`@Serializable`)

| Ruta | Tarea | Forma |
|---|---|---|
| `HelpRoute` | `TASK-008` | `data object` (o sub-rutas por paso — ver Q2 de la spec) |
| `NextStepsRoute` | `TASK-010` | `data object` |
| `ReferralRoute` | `TASK-011` | `data object` |
| `DirectoryRoute` | `TASK-011` | `data object` |
| `CaseStatusRoute` | `TASK-016` | `data class CaseStatusRoute(val caseToken: String)` |

**Sin cambios** (ya existen): `ConversationRoute`, `ContextCheckRoute`, `SignalsRoute`,
`SituationMapRoute`, `AttentionRoute`, `ToolsRoute`, `ToolDetailRoute`, `PersonalReportRoute`,
`JourneyRoute`, `SummaryReviewRoute`, `ConsentRoute`, `SupportRequestStatusRoute`, `ProfileRoute`.

## 4. Rutas del NavHost a sustituir (placeholders → pantallas reales)

`PuenteJovenNavHost.kt`:

| Ruta | Tarea | Nota |
|---|---|---|
| `ConversationRoute`, `ContextCheckRoute` | `TASK-004` | |
| `SignalsRoute`, `SituationMapRoute`, `AttentionRoute` | `TASK-005` | |
| `ToolsRoute`, `ToolDetailRoute` | `TASK-006a` | |
| `PersonalReportRoute`, `JourneyRoute` | `TASK-006b` | |
| `SummaryReviewRoute`, `ConsentRoute`, `SupportRequestStatusRoute` | `TASK-007` | |
| `ProfileRoute` | `TASK-009` | ⚠️ la nota actual dice *"Se implementa en TASK-003"*: **está cerrada y es incorrecta**. Corregir a `TASK-009` |

**Rutas nuevas a montar:** `HelpRoute` (008), `NextStepsRoute` (010), `ReferralRoute` +
`DirectoryRoute` (011), `CaseStatusRoute` (016).

## 5. Entradas desde `feature/home/HomeScreen.kt`

Necesita el **contrato de Home** (D2). Propuesta de B, según brief §6 + decisión P3:

| # | Elemento | Destino | Tipo |
|---|---|---|---|
| 1 | Ruta A — «Me está pasando algo» / *"Quiero contar algo que estoy viviendo."* → «Empezar» | `ConversationRoute` | **Principal** |
| 2 | Ruta B — «Quiero ayudar a alguien» / *"Alguien confió en mí y quiero saber cómo acompañarlo."* → «Quiero ayudar» | `HelpRoute` | **Principal** |
| 3 | Mi recorrido | `JourneyRoute` | Secundaria |
| 4 | Herramientas | `ToolsRoute` | Secundaria |
| 5 | Mis próximos pasos | `NextStepsRoute` | Secundaria |
| 6 | Privacidad | `ProfileRoute` | Secundaria |

**Barra de 5 pestañas (P3):** `Inicio · Hablar · Recorrido · Herramientas · Perfil`
→ `HomeRoute`, `ConversationRoute`, `JourneyRoute`, `ToolsRoute`, `ProfileRoute`.
Requiere la decisión **D1**.

## 6. Métodos de repositorio

### 6.1 Nuevos en interfaces **existentes** (`Repositories.kt`) — decisión D4

| Método | Tarea | Estado |
|---|---|---|
| `SignalsRepository.assess(nowEpochMillis: Long): AppResult<AttentionAssessment>` | `TASK-005` | **Propuesto.** Alternativa aceptada por B: `Clock` inyectado en la implementación, sin tocar la firma |
| `ReportRepository.observeJourney(fromEpochMillis: Long?, toEpochMillis: Long?)` | `TASK-006b` | **Propuesto.** Alternativa aceptada: filtrar en la feature |

### 6.2 Contratos **nuevos**

| Contrato | Tarea | Estado |
|---|---|---|
| `HelpRepository` | `TASK-008` | **Propuesto** — borrador en la spec §4. Aprobación de A requerida |
| `AlertPackageRepository` | `TASK-015` | **Propuesto** — borrador en la spec §4 |
| `CaseStatusRepository` | `TASK-016` | **Propuesto, pero debe ser de A**: es el borde con `:core:network` (`PR-003` §5) |
| `ReferralRepository` | `TASK-011` | **Propuesto**, con alternativa sin contrato (fixtures de la feature) |
| `NextStepsRepository` | `TASK-010` | **Propuesto**, con alternativa sin contrato (cálculo en la feature) |
| `AdverseEventRepository` | `TASK-017` | **Propuesto**, dentro de `:core:audit` |

### 6.3 **Sin cambios** (B solo consume)

`YouthRepository` (completo tras `TASK-025`), `ConversationRepository`, `ContextCheckRepository`,
`ToolsRepository`, `SharingRepository`, `SupportRepository`, `ChatAccessRepository`,
`RetentionRepository`.

## 7. Modelos nuevos en `:core:model` — requiere D3

| Modelo | Tarea | Motivo |
|---|---|---|
| `AlertPackage` | `TASK-015` | **El tipo garantiza el invariante**: sin campo para `ProfileId`, alias, dispositivo ni chat |
| `AdverseEvent` (`sealed interface`) | `TASK-017` | Tipo cerrado; ninguna variante admite texto libre del joven |
| `SupportResource`, `Referral` | `TASK-011` | **Alternativa sin modelo nuevo**: fixtures de la feature + proyección de `SupportRequestState` |
| `NextStep` | `TASK-010` | **Alternativa sin modelo nuevo**: cálculo en la feature |

## 8. Componentes del design system

**Ninguno nuevo solicitado por ahora.** Se reutilizan: `EditorialHeader`, `PuenteOrb`,
`PuenteActions`, `PuenteStates`, `SignalChip`, `AttentionCard`, `AttentionDot`, `attentionIcon()`,
`attentionAccessibilityLabel()`, `EvidenceCard`, `IntensityMeter`, `SummaryCard`, `ResourceCard`,
`PuenteSwitch`, `InfoBadge`, `PuenteBottomNavigation`.

**Se pedirán a A si al implementar se confirma que faltan** (no se improvisan):

| Posible hueco | Tarea |
|---|---|
| Patrón de **confirmación destructiva** (borrado manual irreversible) | `TASK-009` |
| **Línea temporal por semanas** del recorrido | `TASK-006b` |
| **Estado «desactualizado / sin conexión»** (si no encaja en `InfoBadge`/`ErrorState`) | `TASK-016` |
| **Parametrización de `PuenteBottomNavigation`** (decisión D1) | `TASK-004`, `TASK-009` |

## 9. Otros (permisos, flags, manifiesto)

| Necesidad | Tarea | Nota |
|---|---|---|
| `AndroidManifest.xml`: `android:allowBackup="false"` + `dataExtractionRules` sin Auto Backup | `TASK-009` | Requisito de `TASK-021`. **Vive en `app/`, que es de A** |
| Persistencia del registro de eventos adversos | `TASK-017` | Decidir: tercer `DataStore` de A, o almacén propio de `:core:audit` |
| `strings.xml` nuevos por feature | todas | Cada feature trae el suyo; **ningún copy en `:core:model`** (ver D3) |
| Permiso de red | — | **B no lo necesita.** Ningún módulo de B depende de `:core:network` |

---

## 10. Recordatorio de las prohibiciones que B respeta

1. B **no** edita los 7 archivos compartidos (`settings.gradle.kts`, `app/build.gradle.kts`,
   `PuenteJovenNavHost.kt`, `HomeScreen.kt`, `Repositories.kt`, `LocalPuenteRepository.kt`,
   `AppDestination.kt`).
2. B **no** edita `core/designsystem/**`.
3. B **no** toca `main`.
4. B **compila solo en su worktree** (`pj-agenteB`), nunca en `prueba_movil` ni en `pj-agenteA`.
5. B **no** añade `:core:network` a ningún módulo suyo.
