# TASK-006b · Reporte personal + recorrido

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-005`, `TASK-006a` · **Bloquea:** `TASK-007`, `TASK-010`

## 1. Contexto

El brief §15 y §16 piden dos superficies que en el código actual son una sola ruta cada una y ningún
contenido. Y hay una frase que define el producto entero: **"Este reporte pertenece al adolescente."**

- **Reporte personal** (§15) — título *"Lo que entendimos juntos."* Muestra: lo que ocurrió, cómo te
  sentiste, qué cambió, qué herramienta utilizaste, qué podrías hacer después.
  **NO muestra:** diagnósticos, scores, probabilidades clínicas.
- **Mi recorrido** (§16) — *"No simplemente historial."* Visualiza cómo evolucionó la situación
  (semana 1 → semana 4), permite abrir cada registro y muestra herramientas, próximos pasos y apoyo
  solicitado.

Esta tarea es la que hace que el producto **se sienta longitudinal**. Sin ella, cada sesión es un
episodio aislado y el brief §10 (*"comparar con registros anteriores"*) no tiene dónde mostrarse.

## 2. Alcance

### Dentro
- `feature:report`: pantalla de **reporte personal** con las 5 secciones del brief §15.
- Pantalla de **recorrido** longitudinal con la evolución por semanas y detalle abrible de cada
  entrada (`JourneyEntry` con sus 5 `kind`: conversación, señal, herramienta, nivel, apoyo).
- **Filtro de lenguaje**: ninguna superficie de esta tarea puede mostrar scores, probabilidades ni
  etiquetas diagnósticas.
- Enlace desde el recorrido a las herramientas usadas y al apoyo solicitado (`TASK-007`).

### Fuera
- La construcción del resumen **compartible** → `TASK-007`. Aquí el reporte es **privado**: lo que el
  joven ve sobre sí mismo.
- El cálculo de señales y nivel → `TASK-005`.
- «Mis próximos pasos» como pantalla propia → `TASK-010` (aquí solo se **enlaza**).
- `core/designsystem/**` y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:report`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:report")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:report"))`
  3. `PuenteJovenNavHost.kt` → 2 placeholders (`PersonalReportRoute`, `JourneyRoute`)
  4. `feature/home/HomeScreen.kt` → entrada «Mi recorrido» (brief §6, secundaria)
  5. `Repositories.kt` → **posible** método nuevo: ver §4
  6. `AppDestination.kt` → sin cambios

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `ReportRepository` | `getPersonalReport()`, `observeJourney()` |
| `ToolsRepository` | `observeCompletions()` (detalle de herramientas del recorrido) |
| `SupportRepository` | `observeRequests()` (apoyo solicitado dentro del recorrido) |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- `ReportRepository.observeJourney(fromEpochMillis: Long?, toEpochMillis: Long?): Flow<List<JourneyEntry>>`
  — **`[nuevo]`**. Motivo: el brief §16 pide **evolución por semanas** y permitir **abrir cada
  registro**. `observeJourney()` sin parámetros devuelve todo el histórico; para una vista semanal y
  para paginar el detalle hace falta acotar el rango. Alternativa aceptable: filtrar en la feature y
  no tocar el contrato (con coste de rendimiento en recorridos largos). **B prefiere la primera, pero
  no decide sola** — es un contrato de A.
- **Sin** método nuevo para el reporte personal (`getPersonalReport()` es suficiente).

**Hallazgo que condiciona el recorrido:** `PersonalReport` incluye `journeyHighlights`, y
`JourneyEntry` **no tiene `youthId`** (`Models.kt:244-250`). En un dispositivo con multi-perfil
(`TASK-025`) eso significa que **el filtrado por perfil activo tiene que hacerlo la implementación**,
no el modelo. Lo declaro para que A confirme que `LocalPuenteRepository` ya filtra el recorrido por
perfil; si no, es un **fallo de privacidad entre perfiles** y hay que corregirlo en `:core:data`
(tarea de A), no en esta feature.

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | El reporte personal muestra las **5 secciones** del brief §15 | instrumentada |
| 2 | El reporte **no contiene** scores, porcentajes de probabilidad ni etiquetas diagnósticas | revisión de contenido + `grep` sobre `strings.xml` |
| 3 | El recorrido se agrupa **por semana** y cada entrada se puede abrir con su detalle | instrumentada + revisión visual |
| 4 | El recorrido de un perfil **no muestra entradas de otro perfil** del mismo dispositivo | unitaria (dos perfiles con contenido; cada uno ve solo el suyo) |
| 5 | El reporte y el recorrido **sobreviven al reinicio** | unitaria sobre `LocalPuenteRepository` |
| 6 | El reporte enlaza con «Mis próximos pasos» sin duplicar su contenido | revisión visual |
| 7 | El reporte personal **no es exportable ni compartible** desde esta pantalla (compartir es `TASK-007`) | revisión + `grep` (sin `Intent`/`Share`) |
| 8 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 9 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **Brief §15 — NO diagnósticos, scores ni probabilidades clínicas** | Criterio #2. Es la superficie donde más fácil es violarlo «sin querer» |
| **#1 — prioridad preliminar, nunca diagnóstico** | Si el recorrido muestra un nivel, lo muestra con `labelOf()` + icono + explicación, igual que `TASK-005` |
| **#7 / `PR-001` P6 — no se comparte la conversación completa** | El reporte personal es **privado**; no hay ninguna ruta de salida desde aquí |
| **`TASK-021` §5.1 — familia con acceso físico** | El recorrido es lo primero que leería un familiar. Sin contenido crudo de chat: entradas agregadas y títulos, no transcripciones |
| **Regla de la casa #2** | Copy en `strings.xml` |

## 7. Referencia visual

- Prototipo: `PersonalReportScreen.tsx`, `JourneyScreen.tsx`.
- Brief §15 (*"Lo que entendimos juntos."*) y §16 (semanas 1–4, apertura de registros).
- Design system: `SummaryCard` (secciones del reporte), `EvidenceCard`, `SignalChip`,
  `EditorialHeader`, `PuenteStates`, `AttentionDot`.
- La **línea temporal por semanas** del recorrido es el único punto donde podría faltar un
  componente: si el design system no lo cubre, **se pide a A** (no se improvisa).

## 8. Dependencias

- **Bloquea:** `TASK-007` (el resumen compartible se construye a partir del reporte personal),
  `TASK-010` (los próximos pasos se derivan del recorrido).
- **Bloqueado por:** `TASK-005` (señales y nivel), `TASK-006a` (herramientas completadas).
- **Specs relacionadas:** `TASK-007`, `TASK-010`, `TASK-025` (aislamiento entre perfiles),
  `TASK-003b` (persistencia).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | ¿`LocalPuenteRepository` filtra el recorrido y el reporte por **perfil activo**? `JourneyEntry` no tiene `youthId`, así que el aislamiento depende de la implementación | A | **Bloquea el criterio #4** |
| Q2 | El brief §16 pide *"no simplemente historial"*: ¿la vista semanal es la única, o hay también una vista de lista completa? | producto | Alcance |
| Q3 | ¿El reporte personal se regenera cada vez o es una **instantánea** con fecha (`PersonalReport.generatedAtEpochMillis` sugiere instantánea)? Si es instantánea, ¿se guardan varias? | producto | Modelo |
| Q4 | El brief §15 dice *"Qué podrías hacer después"* — ¿eso es contenido del reporte o un enlace a «Mis próximos pasos» (`TASK-010`)? | producto | Frontera con `TASK-010` |
| Q5 | ¿Cuántas semanas de histórico se muestran por defecto? | producto | Rendimiento + criterio #3 |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 confirmada** por A (aislamiento por perfil)
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluida la de aislamiento entre perfiles
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
