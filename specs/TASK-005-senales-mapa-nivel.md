# TASK-005 · Señales, mapa de situación y nivel de atención

**Estado:** En revisión
**Autor:** Agente B — APK juvenil · **Revisor:** Agente A — Núcleo y contratos
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-004`, `PR-001` §4 · **Bloquea:** `TASK-006a`, `TASK-015`

> ⚠️ **Bloqueada parcialmente por firma clínica.** `REVISION-C.md` §5.5 establece que la firma de
> `PR-001` existe **fuera del repositorio** y que A no sabe si el clínico ajustó valores. Esta spec
> **referencia** `PR-001` §4/§5 y **no reestatea sus umbrales**. Los umbrales concretos son la
> pregunta abierta Q1.

## 1. Contexto

El brief §10 llama a Puente Signals *"una pieza CENTRAL"*, y §11–§13 añaden tres superficies que no
son una tabla: **explicabilidad** (*"¿Por qué Puente te muestra esto?"*), **mapa de situación**
(constelación de nodos, §12) y **nivel de atención** (§13). Hoy las tres rutas existen
(`SignalsRoute`, `SituationMapRoute`, `AttentionRoute`) y las tres son placeholders.

Lo que hace distinta a esta tarea: **es donde el producto puede fallar éticamente.** Guardrail #4 y
`PR-001` P1: verde/amarillo/rojo es **prioridad preliminar de revisión, nunca diagnóstico**. Toda
superficie que muestre el nivel debe llevar **texto + icono + explicación**, nunca solo color.

## 2. Alcance

### Dentro
- `feature:signals`: pantalla de **señales** con su evidencia (frecuencia, persistencia, cambio,
  acumulación, contexto, apoyo disponible — brief §10).
- **Explicabilidad** (brief §11): antes del nivel, *"¿por qué te muestro esto?"*, con los registros
  concretos que produjeron cada señal.
- **Mapa de situación** (brief §12): nodos de situación · contexto · frecuencia · emociones ·
  pensamientos · impacto · apoyo disponible · cambio familiar. Título: *"Entendamos lo que está
  pasando"* — **nunca** «evaluación psicológica».
- **Nivel de atención** (brief §13) con las tres frases del brief, `labelOf()` y el encuadre
  `isPreliminary = true` / `requiresHumanConfirmation = true`.
- Cálculo del nivel por **reglas deterministas** desde las respuestas del chequeo y las señales
  (decisión D1). El LLM **no** participa (D2: *"el rojo lo determinan las reglas, nunca el LLM"*).

### Fuera
- Clasificación medio/alto del backend → `PR-005` (C).
- Paquete de alerta roja y su encolado → `TASK-015`.
- Herramientas sugeridas por nivel → `TASK-006a`.
- Solicitud de apoyo → `TASK-007`.
- `core/designsystem/**` (congelado) y los 7 archivos compartidos.

## 3. Módulo y propiedad

- Módulo: `feature:signals`
- Dueño: **B**
- Compartidos que **declara**:
  1. `settings.gradle.kts` → `include(":feature:signals")`
  2. `app/build.gradle.kts` → `implementation(project(":feature:signals"))`
  3. `PuenteJovenNavHost.kt` → 3 placeholders (`SignalsRoute`, `SituationMapRoute`, `AttentionRoute`)
  4. `feature/home/HomeScreen.kt` → entrada a señales/nivel (brief §6)
  5. `Repositories.kt` → **posible** método nuevo: ver §4
  6. `AppDestination.kt` → sin cambios

## 4. Contratos de datos

**Consume:**

| Interfaz | Métodos |
|---|---|
| `SignalsRepository` | `observeSignals()`, `observeSituationMap()`, `getAttentionAssessment()` |
| `ContextCheckRepository` | `observeResponses()` (entrada de las reglas) |

**Métodos nuevos que necesita (se declaran en `NECESIDADES.md`):**

- `SignalsRepository.assess(nowEpochMillis: Long): AppResult<AttentionAssessment>` — **`[nuevo]`**.
  Motivo: hoy `getAttentionAssessment()` no recibe instante. Pero el cálculo de nivel depende de
  **persistencia y frecuencia** (brief §10: *"comparar con registros anteriores"*) y toda operación
  temporal del proyecto recibe `nowEpochMillis` inyectable para ser demostrable (`RetentionRepository`
  ya sigue ese patrón, y `TASK-003b` criterio #4 lo exige). Sin el parámetro, el criterio #3 de esta
  spec **no es verificable**.
  - Si A prefiere no tocar la firma, la alternativa es un `Clock` inyectado en la implementación; B
    acepta cualquiera de las dos y **no decide sola**.
- **Sin** método nuevo para el mapa de situación (`observeSituationMap()` es suficiente).

**Decisión de diseño — las reglas viven en la feature, no en el contrato.**
`AttentionAssessment` ya trae `rulesetVersion` (`Models.kt:191`). El motor de reglas (qué combinación
de respuestas y señales produce qué nivel) vive en `feature:signals` como **tabla de reglas
versionada**, y la versión se propaga a `rulesetVersion`. Así el contrato de datos no se toca y el
backend puede recibir el mismo `rulesetVersion` en el reporte (`PR-003` §4).

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | **El nivel nunca se muestra solo por color**: toda superficie con `AttentionLevel` incluye `labelOf()` + icono + explicación | instrumentada (assert sobre el árbol semántico: el nodo del nivel tiene texto y `contentDescription`) |
| 2 | Existe la pantalla de **explicabilidad** y enlaza cada señal con los registros concretos que la produjeron | instrumentada + revisión visual |
| 3 | El cálculo del nivel es **determinista y reproducible**: las mismas respuestas y el mismo instante producen el mismo `AttentionAssessment` con el mismo `rulesetVersion` | unitaria (misma entrada → misma salida, con reloj fijo) |
| 4 | `isPreliminary` es `true` y `requiresHumanConfirmation` es `true` en todo `AttentionAssessment` emitido | unitaria |
| 5 | El copy **no contiene** las palabras prohibidas por `PR-001` §15 (*diagnóstico*, *riesgo suicida*, *gravedad clínica*) aplicadas al sistema | revisión de contenido + `grep` sobre `strings.xml` |
| 6 | **Un ROJO no puede ser degradado**: si la regla produce `RED`, ninguna entrada posterior lo baja a `YELLOW`/`GREEN` (D2) | unitaria (prueba negativa) |
| 7 | La pantalla de nivel muestra **qué cambió, por qué y qué ocurre después** (brief §13), los tres campos del modelo | instrumentada |
| 8 | **Cero literales de copy en Kotlin** | `grep` + revisión |
| 9 | El módulo no depende de `:core:network` | `ModuleGraphGuardTest` |

## 6. Guardrails aplicables

| Guardrail | Cómo aplica aquí |
|---|---|
| **#1 / `PR-001` P1** | Prioridad preliminar de revisión, nunca diagnóstico. Texto + icono + explicación, nunca solo color |
| **#4 — la IA no diagnostica** | Las reglas son deterministas y auditables; no hay modelo de lenguaje en el cálculo |
| **D1** | 3 niveles en el APK por reglas; 2 categorías en el backend por LLM. Esta tarea hace **solo** los 3 niveles |
| **D2 / `PR-001` P2, P3** | El rojo lo determinan reglas; el LLM solo puede **subir**. El criterio #6 lo prueba |
| **`PR-001` §9** | Qué ve el joven en cada nivel (verde: herramientas; amarillo: nivel + opción de apoyo; rojo: emergencia + ruta humana) |
| **`PR-001` §15** | Lenguaje: el sistema *detecta señales* y *activa a una persona*; no valora riesgo |
| **`TASK-021`** | La superficie de señales es la que un familiar con acceso físico leería primero: sin contenido crudo de chat, solo señales agregadas |

## 7. Referencia visual

- Prototipo: `SignalsScreen.tsx`, `SituationMapScreen.tsx`, `AttentionLevelScreen.tsx`.
- Brief §10 (línea temporal de evidencias: *"02 SEP · Comentario aislado"* → *"13 SEP · Dificultad
  para asistir"*), §11 (explicabilidad), §12 (constelación de nodos), §13 (nivel).
- Design system: `SignalChip`, `AttentionCard`, `AttentionDot`, `attentionIcon()`,
  `attentionAccessibilityLabel()`, `EvidenceCard`, `IntensityMeter`, `SummaryCard`, `PuenteOrb`,
  `EditorialHeader`.
- **`attentionIcon()` y `attentionAccessibilityLabel()` ya existen** — se usan tal cual. Es
  exactamente el caso de uso para el que se crearon.

## 8. Dependencias

- **Bloquea:** `TASK-006a` (las herramientas se sugieren según el nivel), `TASK-015` (el paquete de
  alerta roja consume el `AttentionAssessment`).
- **Bloqueado por:** `TASK-004` (respuestas del chequeo), `PR-001` §4/§5 (firma clínica → Q1).
- **Specs relacionadas:** `TASK-015`, `TASK-018` (prueba del invariante «el LLM no degrada»),
  `PR-001` §4–§5, `PR-005` (C).

## 9. Preguntas abiertas

| # | Pregunta | A quién | Impacto |
|---|---|---|---|
| **Q1** | **Los umbrales concretos** (qué combinación de respuestas y señales produce amarillo, y cuál rojo). `PR-001` §4 describe **criterios**, no umbrales. Si el clínico los ajustó al firmar, hay que publicarlos | clínico / dueño | **Bloquea el cierre de la tarea** |
| Q2 | `PR-001` §4.3 deja abierto si el rojo es (a) *señal de alarma* o (b) *peligro inminente observable*. La recomendación de `PR-001` es (a) con lenguaje ajustado: *el sistema avisa, no valora*. ¿Se ratifica? | clínico | Copy de la pantalla roja y criterio #6 |
| Q3 | ¿Cuánto peso tiene la **persistencia** en el nivel? El brief §10 pide comparar con registros anteriores, pero no dice si la antigüedad acumulada puede **por sí sola** subir el nivel | clínico / producto | Diseño de las reglas |
| Q4 | ¿El mapa de situación es una pantalla propia o una vista del mismo dato? El brief lo describe con concepto visual propio («constelación de nodos») | producto | Alcance |
| Q5 | El brief §10 lista 6 dimensiones de análisis (frecuencia, persistencia, cambios, acumulación, contexto, apoyo disponible). ¿Se priorizan o entran las 6 en el MVP? | producto | Alcance del motor de reglas |

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] **Q1 y Q2 resueltas** por el clínico (no por un agente)
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde, incluida la **prueba negativa** del criterio #6
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
- [ ] Cero literales de copy en Kotlin (regla de la casa #2)
