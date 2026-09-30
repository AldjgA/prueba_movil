# PENDIENTE DE A — inventario al 2026-09-30

**Autor:** Agente A — Núcleo y contratos · **`main`:** `65f9024`
**Criterio:** lo que falta **de mi parte**, ordenado por a quién desbloquea.

---

## 0. 🔴 Bloquea a B ahora mismo (B ya entregó el código; no puede integrarlo)

B tiene `TASK-004` y `TASK-005` **implementados y verificados** (50 pruebas en verde) pero
**sin integrar**, porque todo lo de esta sección es mío.

| # | Qué | Dónde | Por qué lo bloquea |
|---|---|---|---|
| **1** | `include(":feature:conversation")` y `include(":feature:signals")` | `settings.gradle.kts` | Sin esto sus módulos no existen para Gradle |
| **2** | `implementation(project(":feature:conversation"))` y `:feature:signals` | `app/build.gradle.kts` | Sin esto la app no los ve |
| **3** | **5 placeholders → pantallas reales**: `ConversationRoute`, `ContextCheckRoute`, `SignalsRoute`, `SituationMapRoute`, `AttentionRoute` | `PuenteJovenNavHost.kt` | ⚠️ Hay **colisión de nombres** con `:core:navigation`: hay que aliasar, como ya se hace con `HomeRoute as HomeScreenRoute` |
| **4** | **Validar `promptId`** en `appendPuenteMessage` | `LocalPuenteRepository.kt` | Criterio #2 de `TASK-004`: hoy acepta `promptId = ""`. Un turno sin `promptId` es indistinguible de contenido generado — justo lo que prohíbe el guardrail #3 |
| **5** | **D1** · Parametrizar `PuenteBottomNavigation` (descongelado) | `core/designsystem/**` | B necesita la barra de 5 pestañas (P3) |
| **6** | **D2** · Contrato de Home de 6 enlaces **+ corregir `OpenHelpSomeone`** | `feature/home/**` | Hoy `OpenHelpSomeone` navega a `ConversationRoute`; **el brief §18 prohíbe** reutilizar el flujo de la Ruta A. Debe ir a `HelpRoute` |

> Los puntos 1–4 son mecánicos y se hacen en una pasada. El 5 y el 6 son las decisiones que ya
> ratifiqué en `REVISION-B-POR-A.md` §2 y que aún no ejecuté.

---

## 1. Deudas en mis módulos (afectan a B)

| # | Qué | Dónde | Nota |
|---|---|---|---|
| **7** | `DemoFixtures` emite `SignalKey("frequency")`, `"isolation"`… en **minúsculas**, y `PR-003` §4.1 fijó **MAYÚSCULAS** y **retiró `frequency`** (es una dimensión, no una señal) | `:core:data` | B hizo el motor tolerante, pero la fixture sigue mintiendo |
| **8** | **D3** · Los enums exponen **`labelResKey`**, sin literales en español (`AttentionLevel.labelOf`, `SupportRequestState.label`, `TrendDirection.label`) | `:core:model` | `:core:model` es Kotlin puro: no puede tener `strings.xml`. Por eso el literal no es solo inconsistente, es **estructuralmente inevitable** si el enum devuelve texto |
| **9** | Los `label` de las señales (`"Frecuencia"`, `"Aislamiento"`) y **3 sitios de `:feature:home`** (`HomeViewModel`, `HomeScreen`, `ObserveHomeUseCase.greeting()`) incumplen la regla #2 | `:core:data` + `:feature:home` | Lo detectó B. Si la regla no se aplica a lo que ya existe, cada feature nueva decidirá por su cuenta si la cumple |

---

## 2. Decisiones de contrato que aún debo cerrar

| # | Qué | Estado |
|---|---|---|
| **10** | `availableQuestionKeys()`: B propone **retirarlo** del contrato (opción b). Ya lo alineé al `CheckCatalog`, pero él prefiere menos superficie | **Decidir** |
| **11** | `getAttentionAssessment()`: devuelve un **fixture constante** que no refleja lo que el joven respondió. B no lo usa y propone retirarlo | **Decidir** |
| **12** | Los contratos y modelos que B propone: `HelpRepository`, `AlertPackageRepository`, `CaseStatusRepository` (**B dice que debe ser mío**: es el borde con `:core:network`), `ReferralRepository`, `NextStepsRepository`, `AdverseEventRepository`; modelos `AlertPackage`, `AdverseEvent`; y el módulo **`:core:audit`** | **Aprobar o crear** |
| **13** | **Catálogo de etiquetas** de `rol` y `especialidad` (lo prometí en K6): el APK muestra `rol`/`especialidad` al adolescente desde `ACEPTADO`, y las claves nunca pueden llegar crudas a esa pantalla | **Publicar** |

---

## 3. Mis tareas de cola

| Tarea | Ola | Qué | Nota |
|---|---|---|---|
| `TASK-023` | 2 | Auditoría de consultas | — |
| `TASK-013` | 3 | Backend y contratos remotos | Incluye **reescribir `ModuleGraphGuardTest`** (el APK ya no es "sin red") y **F2**: guarda de secretos/endpoints para `puente-red/**`, que hoy **no** cubre nadie |
| `TASK-014` | 3 | CI y calidad | Incluye **F4**: CI de las pruebas de contrato **sin** compilar APK y Puente Red juntos; y hacer **verificable** la regla #2 |
| `TASK-012` | 2 | Integración narrativa end-to-end | La última: necesita a B y C terminados |

---

## 4. Gobernanza y documentos

| # | Qué |
|---|---|
| **14** | **K8**: marcar en `MATRIZ-TRAZABILIDAD.md` §4 **qué specs de C incorporan ya `REVISION-C.md`** y cuáles no. Hoy no se puede saber leyéndolas, y B ya tropezó con eso |
| **15** | `AndroidManifest.xml`: `android:allowBackup="false"` + `dataExtractionRules` sin Auto Backup. Es requisito de `TASK-021` y vive en `app/` (mío). Lo necesita `TASK-009` de B |

---

## 5. Integración (trabajo de merge, no de diseño)

| # | Qué | Estado |
|---|---|---|
| **16** | **`TASK-004` + `TASK-005` de B** (`72f26ee`, `e7979de`) | Implementados y verificados por B; **sin revisar ni integrar**. En cuanto aplique §0, rebasa y yo hago el merge |
| **17** | **La Fase 1 de C** (`PR-005`…`PR-010`) | Entregada, pero **desde una base vieja (`c979e4f`)**: su rama borraría mi esqueleto. **C debe rebasar** antes de que yo integre |

---

## 6. Lo que **no** es mío (para que no se espere de mí)

| Qué | De quién |
|---|---|
| **Los teléfonos de crisis reales** de la pantalla de rojo | La ONG. B no los inventa y hace bien: un número inventado en una pantalla de crisis es el peor fallo posible |
| **La fuente de los 3 criterios de rojo que el APK no puede detectar** (`ideacion_activa`, `plan_estructurado`, `intento_reciente`) | Decisión **clínica**. El chequeo del brief §9 no pregunta por ellos y la conversación es texto libre que nada lee: **un joven puede escribir «quiero morir» y el APK no eleva su prioridad**. B lo declaró en `MotivoCatalog.unreachableFromApk` y lo protegió con una prueba. Es el hueco más serio del proyecto |
| **El desambiguador de alias+PIN repetidos** (`TASK-025` §10 Q1) | Producto |
| **La capa de pago de Gemini** antes de datos reales | Presupuesto |
| **El responsable legal** del tratamiento de datos de menores | Legal |

---

## Orden que propongo

1. **§0 completo** (1–6) — desbloquea a B y son horas, no días.
2. **§1** (7–9) — cierra las deudas que B ya declaró.
3. **§2** (10–13) — decisiones; las necesita B para las specs que le quedan.
4. **§5** (16–17) — integrar lo que ya está hecho y verificado.
5. **§3** (tareas de cola) y **§4** — cuando B y C estén al día.
