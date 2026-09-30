# REVISION-B · Revisión del Agente B sobre `PLAN-3-AGENTES.md` y la Fase 0 de A

**Fecha:** 2026-09-30 · **Autor:** Agente B — APK juvenil
**Origen:** rama `agente/B-juvenil` (creada en `3771535`, sobre `main` con `TASK-003b` y `TASK-025` ya integrados)
**Alcance de esta revisión:** el plan de 3 agentes, el contrato de integración, la plantilla de spec
y las specs de A. **No** reviso la cola de C: ya tiene su `REVISION-C.md`.
**Veredicto:** el plan es correcto en su estructura y B puede arrancar. Hay **10 hallazgos**, de los
cuales **3 son bloqueantes para B** (H1, H5, H6) y **1 es un conflicto de propiedad no resuelto** (H7).

---

## 1. Qué asumo como Agente B

| Dimensión | Valor |
|---|---|
| Rol | Toda la experiencia del adolescente (un producto, un relato, una voz) |
| Tareas | 14 (`TASK-004`…`TASK-011`, `TASK-015`…`TASK-018`, `TASK-024`) |
| Módulos que crea | `conversation`, `signals`, `tools`, `report`, `sharing`, `help`, `profile`, `nextsteps`, `referral` |
| Worktree | `C:/Users/Aldjg/WorkBuddy AI/cosa/pj-agenteB` (rama `agente/B-juvenil`) ✅ creado |
| Prohibido | editar los 7 archivos compartidos y `core/designsystem/**`; tocar `main`; compilar fuera de mi worktree |
| Fase 0 | 14 specs — **entregadas con esta revisión** |

---

## 2. Lo que el plan acierta (y quiero que conste)

1. **El corte A/B/C es el correcto.** B es un producto coherente, no un cajón de tareas sueltas: la
   secuencia `Hablar → Señales → Nivel → Herramienta → Reporte → Recorrido → Apoyo` es un solo
   relato y debe tener una sola voz. Repartirla entre agentes la habría roto.
2. **§2.1 (un worktree por agente) está bien fundado.** No lo discuto; el precedente de
   `NoSuchFileException` en KSP es suficiente.
3. **§2.3 (declaración de necesidades) es la pieza que hace viable el paralelismo.** Sin ella, el
   modelo de 3 agentes es una promesa. Con ella, A es un cuello de botella **gestionable**.
4. **`TASK-012` como validación narrativa de un solo dueño** es la mitigación correcta del riesgo #4
   del plan. Un relato roto entre 9 módulos no lo detecta ninguna prueba unitaria.

---

## 3. Hallazgos

### H1 · 🔴 `PuenteBottomNavigation.kt` está congelado, pero el plan encarga a B cambiar la barra

`PLAN-3-AGENTES.md` §4.1 (nota final) dice: *"B también implementa la barra de 5 pestañas (decisión
P3)"*. Pero esa barra vive en
`core/designsystem/src/main/kotlin/bo/puentejoven/core/designsystem/component/PuenteBottomNavigation.kt`,
y `core/designsystem/**` está **congelado** (§2.2 y §2.4). Además §4.1 de
`PLAN-TRABAJO-SDD.md` §10.4 lo confirma: *"`PuenteBottomNavigation` pasa de 4 a 5 destinos"*.

**Es una contradicción directa entre dos reglas del mismo plan.** B no puede cumplir las dos.
Opciones (la decisión es de A, que es el dueño del design system):

| Opción | Qué implica | Coste |
|---|---|---|
| **a) A parametriza** la barra (recibe la lista de destinos por parámetro) y B la alimenta | El componente deja de tener los 4 destinos hardcodeados; pasa a ser agnóstico | Bajo, una sola vez |
| **b) A hace el cambio** a 5 destinos y B no lo toca | Rompe "una tarea = un módulo = un dueño", pero respeta la congelación | Nulo para B |
| **c) Se descongela solo ese fichero** para B | Contradice §2.4 y abre la puerta a que se descongele cualquier cosa | Alto (precedente malo) |

**Recomiendo (a).** Es la única que respeta la congelación **y** deja a B dueño de su navegación.
**B no empieza `TASK-004` hasta que A responda.**

### H2 · 🔴 El contrato de entrada desde Home no existe

`CONTRATO-DE-INTEGRACION.md` §2 da un ejemplo de `NECESIDADES.md` con **una** tarjeta
(*"Me está pasando algo" → ConversationRoute*). Pero con la barra de 5 pestañas y el brief §6, Home
tiene que exponer: **2 caminos principales** (Ruta A / Ruta B) + **4 secundarios** (Mi recorrido ·
Herramientas · Mis próximos pasos · Privacidad). Eso son **6 enlaces**, no uno.

El ejemplo del contrato se está leyendo como si fuera el contrato entero. **Necesito que A publique
el contrato de Home completo** (qué tarjetas, en qué orden, a qué destino va cada una) antes de
`TASK-004`. Si no, B diseñará la navegación contra un ejemplo.

### H3 · 🔴 `TASK-018` tiene dos dueños según el plan

- §4.1 (cola de B, fila 13): **`TASK-018` es de B**.
- §5 (tabla de sincronización, **S5**): *"Todo integrado → `TASK-018` suite de seguridad. **Quién
  avisa: A**"*.

**Propuesta de B:** B **escribe** la suite (es la única que puede, porque conoce los 9 módulos);
A **la dispara** en S5 sobre el árbol integrado. Que el plan lo diga así y se acabe la ambigüedad.

### H4 · 🟠 `TASK-024` (canal de audio) no puede ser una tarea de Ola 1

`PLAN-TRABAJO-SDD.md` §10.1 la marca *"sujeto a decisión"*. Y `PR-003` §6.2 resuelve que el canal de
contacto es **baja prioridad, fuera del camino crítico del MVP**, y lo sitúa *"candidato a ola
posterior a `PR-016`"* — es decir, **después** de la tarea 12 de C. `PLAN-3-AGENTES.md` la pone como
posición 14 de B, sin marca de bloqueo.

**No la puedo especificar como MVP.** Entrego su spec como **Borrador con puerta explícita** (§9):
qué haría falta para activarla y por qué no entra ahora. Si el dueño quiere que entre, hay que
decirlo y entonces cambia también `PR-003` §6.2.

### H5 · 🟠 `TASK-005` y `TASK-007` están bloqueadas por una firma que vive fuera del repo

`REVISION-C.md` §5.5 es explícito: la firma clínica de `PR-001` **existe fuera del repositorio** y
**A no sabe si el clínico ajustó valores** (criterios de rojo, medio/alto, SLAs). El fichero sigue
rotulado `BORRADOR` con marcadores `[VALIDAR]`.

Consecuencia para B: **no puedo cerrar** `TASK-005` (criterios de nivel) ni `TASK-007` (qué promete
el flujo de apoyo) sin esos valores. **No los invento.** Las entrego con los umbrales como pregunta
abierta y referenciando `PR-001` §4/§5/§7 **sin reestatear** sus valores (la postura que
`REVISION-C.md` §5.5 marca como correcta).

### H6 · 🟠 La regla de i18n (#2) se contradice con `:core:model`, que no tiene dueño

`specs/_PLANTILLA-SPEC.md` §2 regla 2: *"Todo texto visible va por recurso (`strings.xml`), nunca
literal en Kotlin"*. Estado real medido hoy:

| Fichero | `<string>` | Veredicto |
|---|---|---|
| `app/src/main/res/values/strings.xml` | 1 | — |
| `core/designsystem/src/main/res/values/strings.xml` | 26 | — |
| **`core/model/.../Models.kt`** | 0 | **incumple la regla** |

`core:model` contiene copy visible en español **hardcodeado**: `AttentionLevel.labelOf()`
(*"Prioridad preliminar: verde"*), `SupportRequestState(val label)` (*"Borrador"*, *"En cola de
revisión"*…), `TrendDirection(val label, val arrow)` (*"En aumento"*…), `BriefTool.label`,
`Signal.label`, `AttentionAssessment.title`. En cambio `RevocationReason` y `ChatAccessPurpose` **sí**
usan `labelResKey`. **El propio repositorio ya tiene las dos convenciones a la vez.**

Y el problema de fondo: **`core/model/**` no está en la lista de 7 archivos compartidos ni tiene
dueño asignado en §2.2.** Es un módulo de núcleo que B necesita tocar para cumplir la regla #2 y no
puede. **Necesito una decisión de A**: o se añade `core/model/**` a la lista de congelados y A hace
la migración a `labelResKey`, o se asigna a alguien. Mientras no se decida, B escribe su copy nuevo
por recurso (cumpliendo la regla) y **no toca el copy heredado**.

### H7 · 🟠 `:core:model` no aparece en la lista de 7 ficheros, pero B y C lo necesitan

Es el mismo hueco que H6 visto desde otro ángulo. `PLAN-3-AGENTES.md` §2.2 lista ficheros **del
APK**; `CONTRATO-DE-INTEGRACION.md` §1.1 añadió el árbol del backend, pero **nadie añadió
`:core:model`, `:core:common`, `:core:security` ni `:core:navigation`** (solo su `AppDestination.kt`).

B va a necesitar, con alta probabilidad: `HelpRepository` (Ruta B no tiene contrato de datos),
`NextSteps` (no hay modelo), `Referral`/`Resource` (el DS tiene `ResourceCard` pero no hay modelo) y
`AdverseEvent` (`TASK-017`). **Eso significa tocar `:core:model` y `Repositories.kt`.** Declararé cada
uno, pero conviene que A fije la regla **antes** de que llegue el primer bloqueo.

### H8 · 🟡 El catálogo de herramientas tiene dos fuentes incompatibles

- `PLAN-TRABAJO-SDD.md` §10.4 (**Q5**): *"3 módulos TCC del MVP: sueño · respiración/regulación ·
  plan de apoyo"*.
- Brief §14: **6** herramientas, con nombres concretos.
- Fixtures actuales: **3 distintas** (`breathe`, `write`, `listen`).

**Ninguna de las tres coincide.** Q5 define **módulos**; el brief define **títulos de herramienta**;
las fixtures son un tercer conjunto. Entrego `TASK-006a` con el catálogo como pregunta abierta y un
mapeo propuesto, sin cerrarlo.

### H9 · 🟡 `TASK-009` cierra el trabajo que `TASK-025` dejó a medias, y el plan no lo dice

`TASK-025` (A) implementó el multi-perfil **a nivel de datos**; su propia spec dice que la UI es de
`TASK-009`. `PLAN-3-AGENTES.md` §4.1 lista `TASK-009` sin mencionarlo. **Si nadie lo escribe, se
pierde.** Lo asumo explícitamente en `TASK-009` §1 y lo dejo trazado.

Nota de verificación: el bug que se anotó el 2026-09-30 (`createProfile` usando
`DemoFixtures.DEMO_YOUTH_ID`) **ya está corregido** en `LocalPuenteRepository.kt:331-340` — el id es
un `UUID.randomUUID()` y el perfil de demo se retira de la lista al crear el primero real. Lo que
**sigue** ahí es que `DemoFixtures.youthProfile` se siembra en `profilesState` al construir, así que
`observeProfiles()` devuelve el perfil de demo. Es una decisión de producto para `TASK-009` (¿el modo
demo se lista en Ajustes?), no un bug.

### H10 · 🟡 Las tareas "transversales" rompen la regla "una tarea = un módulo"

`PLAN-TRABAJO-SDD.md` §3 fija el criterio *"una tarea = un módulo `feature:*` = un dueño = un
worktree"*. Pero `TASK-017` (eventos adversos) y `TASK-024` (canal de audio) son **transversales**:
no tienen módulo. Sin módulo no hay dueño claro ni frontera de compilación.

**Propuesta de B:** `TASK-017` → módulo propio `:core:audit` (B), con la regla de que **nunca
registra contenido** (solo conteos y metadatos, igual que `RetentionRepository`). `TASK-024` queda
pendiente de H4.

---

## 4. Revisión de la Fase 0 de A

Reviso los cuatro artefactos que A ha publicado. **No encuentro nada que obligue a rehacerlos.**

### 4.1 `specs/_PLANTILLA-SPEC.md` — ✅ con 1 corrección

| # | Observación | Gravedad |
|---|---|---|
| 1 | **Regla 4 dice "los 6 archivos compartidos"** (línea 26). `CONTRATO-DE-INTEGRACION.md` §1 dice **7** y su §1 documenta explícitamente que faltaba `AppDestination.kt`. La plantilla no se actualizó. | 🟡 corregir |
| 2 | La regla 4 no menciona el árbol `puente-red/backend/**` de `CONTRATO-DE-INTEGRACION.md` §1.1. A un agente que solo lea la plantilla le falta esa mitad del contrato. | 🟡 sugerir |
| 3 | El §3 (plantilla) es **completo y usable**. Las 10 secciones cubren lo que un implementador necesita. Los criterios de aceptación con columna "cómo se verifica" son lo que hace que esto sea SDD y no una lista de deseos. | ✅ |
| 4 | Sugerencia: añadir a la plantilla una sección **"Archivos compartidos que NO se tocan"** explícita, para que el implementador no tenga que deducirla de §3. | 🟢 sugerir |

### 4.2 `CONTRATO-DE-INTEGRACION.md` — ✅ ratificado

Correcto y suficiente para B. El flujo de §3 (`NECESIDADES.md → A aplica → A avisa → B rebasa → A
compila → merge`) es claro y el orden estricto está bien explicado. **Ratifico §1, §1.1, §2, §3 y §4.**

Dos precisiones que necesito (no son defectos, son huecos para B):

1. El **contrato de Home** completo (H2).
2. Qué pasa si B necesita un método **nuevo** en un `Repository` existente: ¿se declara igual? El
   contrato dice que `Repositories.kt` "solo cambia por solicitud escrita" (§2.4 del plan) y el
   formato de §2 tiene un apartado 5 "Métodos de repositorio" con la marca `[nuevo]` — asumo que
   **sí**, pero quiero confirmación porque implica que B **no** puede compilar su módulo hasta que A
   publique el método.

### 4.3 `TASK-021` (modelo de amenaza) — ✅ con 1 observación

El adversario principal (*la familia con acceso físico*, riesgo de custodia) es la lectura correcta y
coincide con lo que el brief y el resumen ejecutivo describen. Dos cosas para B:

- **Fuerza el multi-perfil** → confirma que `TASK-009` debe entregar la UI de perfiles (H9).
- **"Sin Auto Backup"**: es una decisión de `AndroidManifest.xml`, que vive en `app/`, **de A**. La
  declaro en `NECESIDADES.md` de `TASK-009`; no la puedo aplicar.
- Observación menor: el modelo de amenaza **no cubre al propio profesional** como actor con acceso.
  `PR-003` §6.3 lo mitiga (el joven es seudónimo, no ve notas internas), pero el modelo de amenaza
  del APK debería decirlo explícitamente para que `TASK-018` pueda probarlo.

### 4.4 `TASK-003b` y `TASK-025` — ✅ verificadas

Leí el código, no solo la spec. Confirmo:

- `PersistenceModels.kt` + `PuenteLocalStore.kt` existen y `LocalPuenteRepository` los usa.
- `TASK-025`: `unlockSessionFor(alias, pin)`, `observeProfiles()`, `switchProfile`, `deleteProfile`
  están implementados y el `ProfileId` de un perfil nuevo es un `UUID` (ya no la constante de demo).
- La KDoc de `observeProfiles()` **advierte de no listar perfiles en el login** — bien, y lo respeto
  en `TASK-009`: la lista de perfiles solo aparece en Ajustes, nunca en la pantalla de entrada.

**Consecuencia operativa para B:** la persistencia existe, así que `TASK-004` puede ser demostrable
desde el primer día. Es el desbloqueo que necesitaba.

---

## 5. Lo que necesito de A antes de construir (bloqueantes)

| # | Necesidad | Bloquea |
|---|---|---|
| **1** | Decisión sobre `PuenteBottomNavigation.kt` (H1) | `TASK-004`, `TASK-009`, `TASK-010`, `TASK-011` |
| **2** | Contrato de Home completo: 6 enlaces (H2) | `TASK-004`, `TASK-008`, `TASK-010`, `TASK-011` |
| **3** | Dueño y política de `:core:model/**` (H6/H7) | `TASK-006a`, `TASK-006b`, `TASK-011`, `TASK-017` |
| **4** | Rutas nuevas en `AppDestination.kt`: `HelpRoute`, `NextStepsRoute`, `ReferralRoute`, `DirectoryRoute` | `TASK-008`, `TASK-010`, `TASK-011` |
| **5** | Confirmar que un método **nuevo** en un `Repository` existente se declara por `NECESIDADES.md` | `TASK-006b`, `TASK-007` |

Ninguna de las cinco exige que A rehaga trabajo. Las cinco son aplicables en una sola pasada.

---

## 6. Lo que sigue bloqueado y no es de agentes

| Bloqueo | Quién | Afecta a |
|---|---|---|
| Valores clínicos firmados de `PR-001` §4/§5/§7 (si el clínico los ajustó) | clínico / dueño | `TASK-005`, `TASK-007`, `TASK-015`, `TASK-016` |
| ¿Entra el canal de audio en el MVP? | dueño | `TASK-024` (H4) |
| ¿Hay guardia fuera de horario? (Q8 dice que **no**) | dueño | `TASK-015`, `TASK-016` — ya resuelto: la pantalla roja es **honesta** |

---

## 7. Estado de la Fase 0 de B

| Entregable | Estado |
|---|---|
| `specs/TASK-004-conversacion-chequeo.md` | ⏳ En revisión |
| `specs/TASK-005-senales-mapa-nivel.md` | ⏳ En revisión |
| `specs/TASK-006a-herramientas-breves.md` | ⏳ En revisión |
| `specs/TASK-006b-reporte-recorrido.md` | ⏳ En revisión |
| `specs/TASK-007-consentimiento-solicitud.md` | ⏳ En revisión |
| `specs/TASK-008-ruta-b-quiero-ayudar.md` | ⏳ En revisión |
| `specs/TASK-009-perfil-privacidad.md` | ⏳ En revisión |
| `specs/TASK-010-proximos-pasos.md` | ⏳ En revisión |
| `specs/TASK-011-derivacion-directorio.md` | ⏳ En revisión |
| `specs/TASK-015-paquete-alerta-roja.md` | ⏳ En revisión |
| `specs/TASK-016-estado-caso-rojo.md` | ⏳ En revisión |
| `specs/TASK-017-eventos-adversos.md` | ⏳ En revisión |
| `specs/TASK-018-suite-seguridad.md` | ⏳ En revisión |
| `specs/TASK-024-canal-audio.md` | 🔒 Borrador **con puerta** (H4) |
| `puente-joven-android/deliverables/FASE-0-B/NECESIDADES.md` | ⏳ declarado |
| `specs/MATRIZ-TRAZABILIDAD.md` (filas de B) | ✅ actualizado |

**13 specs en revisión + 1 en borrador con puerta.** Ninguna se construye hasta que A apruebe
(§3 de `PLAN-3-AGENTES.md`).

---

## 8. Siguiente paso

1. **A** responde a los 5 bloqueantes de §5 (una sola pasada).
2. **A** revisa las 14 specs y aplica `FASE-0-B/NECESIDADES.md`.
3. **B** rebasa `agente/B-juvenil` sobre `main` integrado y arranca `TASK-004`.
4. **B** entrega el `NECESIDADES.md` por tarea al empezar cada una (§2 del contrato), no solo el
   consolidado de Fase 0.

---

## 9. Nota sobre el uso de esta revisión

Igual que `REVISION-C.md`, esto **no** es un documento de bloqueo: es una lista de trabajo. Los
hallazgos H1–H10 son de B hacia A, no juicios sobre el plan, que en su estructura es correcto. La
prueba de que el modelo funciona es que los tres hallazgos rojos son de **frontera** (quién toca qué),
no de **contenido**: el reparto de producto está bien hecho.
