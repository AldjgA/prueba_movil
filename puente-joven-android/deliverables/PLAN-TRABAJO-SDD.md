# Plan de trabajo SDD — Puente Joven

**Fecha:** 2026-09-29
**Autor:** revisión externa del plan
**Alcance:** `puente-joven-android` (APK juvenil) y su relación con el prototipo web
**Estado:** propuesta para revisión. No sustituye a `DESIGN.md` ni a `BACKEND_INTEGRATION.md`.

---

## 0. Por qué este documento

El plan original (`TASK-001` … `TASK-009`) se escribió **antes** de que existiera código.
Ahora hay 8.634 líneas de Kotlin, un build verde y un emulador operativo. Eso permite
leer el plan contra la realidad y detectar tres cosas que el plan no refleja:

1. **Tareas que faltan** (huecos funcionales reales, no mejoras).
2. **Tareas mal dimensionadas** (una tarea con tres features dentro no es paralelizable).
3. **Vacíos de especificación** que nadie ha cerrado y que bloquean la ejecución.

Además, en SDD el orden importa: **primero la especificación, después el código.**
Hoy las especificaciones de tarea **no están en el repositorio**, lo que rompe el
modelo: un agente no puede implementar contra un criterio de aceptación que no puede leer.

---

## 1. Estado verificado

### 1.1 Lo que está hecho

| Módulo | Líneas | Estado |
|---|---|---|
| `:app` | 583 | ✅ NavHost tipado, Hilt, MainActivity |
| `:core:model` | 714 | ✅ Entidades de dominio completas |
| `:core:common` | 279 | ✅ `AppResult`, `UiError`, `Clock` |
| `:core:designsystem` | 3.679 | ✅ Tema, componentes, motion, accesibilidad |
| `:core:navigation` | 112 | ✅ 17 rutas `@Serializable` |
| `:core:data` | 1.941 | ⚠️ 10 contratos definidos, implementación **en memoria** |
| `:core:security` | 738 | ✅ Keystore AES-256-GCM, PBKDF2, cifrado F1–F6 |
| `:feature:auth` | 1.040 | ✅ Entry, Login |
| `:feature:onboarding` | 688 | ⚠️ Falta el desvío a las dos rutas |
| `:feature:home` | 938 | ✅ Inicio del joven |

Verificado además: `BUILD SUCCESSFUL` (189 tareas, 0 errores), APK de 18 MB instalado
y ejecutándose en emulador API 35 con aceleración WHPX.

### 1.2 Lo que el plan dice que falta

`README.md` resume así: *"TASK-003…009 | Sesión privada, conversación, señales,
herramientas, solicitud de apoyo, backend, calidad"*. Siete tareas en una línea.

El mapa real, reconstruido desde `PuenteJovenNavHost.kt` y `settings.gradle.kts`:

| TASK | Alcance real | Módulo | Estado |
|---|---|---|---|
| 003 | Sesión privada, cifrado, retención | `:core:security` + `:core:data` | ✅ salvo persistencia |
| 004 | Conversación + chequeo contextual | `feature:conversation` ❌ | ⏳ |
| 005 | Señales + mapa + nivel de atención | `feature:signals` ❌ | ⏳ |
| 006 | Herramientas + reporte + recorrido | `feature:tools`/`report` ❌ | ⏳ |
| 007 | Consentimiento + solicitud de apoyo | `feature:sharing` ❌ | ⏳ |
| 008 | Backend | `:core:network` ❌ | ⏳ parcial |
| 009 | Calidad | — | ⏳ |

---

## 2. Huecos detectados

### 2.1 Bloqueo crítico: no hay persistencia

`LocalPuenteRepository` (857 líneas) guarda **todo en `MutableStateFlow`, en memoria**.
Lo único durable es `SecureLocalStore` (EncryptedSharedPreferences), y solo para el
derivado del PIN y el marcador de clave.

Consecuencia: **el chat, las respuestas de chequeo, las herramientas completadas, los
resúmenes y los consentimientos se pierden al morir el proceso.** La app no puede
demostrar el producto: "Mi recorrido" no puede mostrar nada longitudinal si cada
arranque empieza de cero.

Lo confirma el propio informe de corrección: *"Persistencia local (DataStore, dos
almacenes) — siguiente paso según lo acordado."*

**TASK-003 no está cerrada.** La lógica de cifrado y retención sí; el almacenamiento, no.

### 2.2 Pantallas del prototipo sin tarea asignada

El prototipo web tiene 14 pantallas del joven. Tres no tienen ruta ni tarea en Android:

| Pantalla web | Líneas | Qué es | Brief |
|---|---|---|---|
| `HelpSomeoneScreen` | 197 | **Ruta B completa**: escucha, valida, evita, pregunta, observa, acompaña, busca ayuda | §18–19 |
| `RouteScreen` | 170 | "Mis próximos pasos" | §6 |
| `ReferralScreen` | 176 | Derivación y recursos | §27 |

La Ruta B es el hueco más grave: el brief dice literalmente
*"ESTA RUTA DEBE TENER SU PROPIA ESTRUCTURA. NO reutilizar el flujo de «Me está
pasando algo»."* Es un segundo producto dentro del producto y hoy no existe.

### 2.3 Desajustes de especificación

| # | Especificado | Implementado |
|---|---|---|
| a | Brief §32: 5 pestañas (`Inicio`, `Hablar`, `Mi recorrido`, `Herramientas`, `Perfil`) | 4 pestañas: `Inicio`, `Hablar`, `Recorrido`, **`Ayudar`** |
| b | Brief §14: 6 herramientas breves con nombres concretos | 3 en fixtures: `breathe`, `write`, `listen` |
| c | Brief §5 pantalla 3: *"¿Cómo quieres usar Puente?"* con las **dos rutas** | `feature:onboarding` no menciona rutas ni "ayudar" |
| d | Brief §4: opción *"Entrar en modo demo"* (alias Alex) | No encontrado |
| e | Brief §13: nivel ROJO = *"necesita apoyo humano prioritario"* | Sin protocolo: no se especifica qué ve el joven ni quién responde |

### 2.4 Deuda de consistencia (importante antes de paralelizar)

- **i18n inconsistente.** `RevocationReason` usa `labelResKey` (clave de recurso), pero
  `AttentionLevel.labelOf()` devuelve literales en español hardcodeados.
  `:app` tiene 1 string; `:core:designsystem`, 26.
  Si no se fija un criterio **antes** de repartir trabajo, cada agente lo hará distinto
  y habrá que reescribir el copy de todas las features.
- **`ProfileRoute` huérfano.** La ruta existe, el NavHost dice "TASK-003", pero TASK-003
  se cerró y la pantalla sigue en placeholder. No hay módulo `feature:profile`.
- **Sin CI.** No hay `.github/workflows`. Con 41 pruebas unitarias y un guard de módulos
  (`ModuleGraphGuardTest`), la ausencia de CI es coste puro.

---

## 3. Re-planificación

Criterio de rediseño: **una tarea = un módulo `feature:*` = un dueño = un worktree.**
Lo que el plan viejo empaquetaba junto se separa; lo que faltaba se añade.

### Ola 0 — Desbloqueo (secuencial, bloquea todo)

| ID | Tarea | Entregable | Por qué bloquea |
|---|---|---|---|
| **TASK-000** | **Especificaciones SDD** | Plantilla de spec + una spec por tarea con criterios de aceptación verificables + matriz de trazabilidad + resolución de §5 | Un agente no puede implementar contra criterios que no puede leer |
| **TASK-00A** | **Contrato de integración** | Documento que congela los 5 archivos compartidos y define el mecanismo de "declaración de necesidades" | Sin esto, 7 agentes editan los mismos ficheros |

### Ola 1 — Paralelo (7 vías simultáneas)

| ID | Tarea | Módulo nuevo | Depende de |
|---|---|---|---|
| **TASK-003b** | **Persistencia local (DataStore, dos almacenes)** | `:core:data` (dueño: integrador) | — |
| **TASK-004** | Conversación + chequeo contextual | `feature:conversation` | contratos ✅ |
| **TASK-005** | Señales + mapa de situación + atención | `feature:signals` | contratos ✅ |
| **TASK-006a** | Herramientas breves *(separada del 006 viejo)* | `feature:tools` | contratos ✅ |
| **TASK-006b** | Reporte personal + recorrido *(separada)* | `feature:report` | contratos ✅ |
| **TASK-007** | Consentimiento + resumen + solicitud de apoyo | `feature:sharing` | contratos ✅ |
| **TASK-008** | **Ruta B: "Quiero ayudar a alguien"** *(hueco)* | `feature:help` | contratos ✅ |
| **TASK-009** | **Perfil, privacidad y ajustes** *(huérfano)* | `feature:profile` | contratos ✅ |

### Ola 2 — Cierre del grafo (paralelo, 3 vías)

| ID | Tarea | Módulo | Nota |
|---|---|---|---|
| **TASK-010** | **Próximos pasos / Ruta** *(hueco)* | `feature:nextsteps` | Referencia: `RouteScreen` |
| **TASK-011** | **Derivación y directorio** *(hueco)* | `feature:referral` | Referencia: `ReferralScreen` |
| **TASK-012** | **Integración narrativa end-to-end** | — | Un solo dueño valida la secuencia completa |

### Ola 3 — Secuencial

| ID | Tarea | Nota |
|---|---|---|
| **TASK-013** | Backend y contratos remotos (ex TASK-008) | Los DTOs mapean entidades de 004–011; `BACKEND_INTEGRATION.md` prohíbe inferirlos antes |
| **TASK-014** | Calidad: CI, pruebas instrumentadas, accesibilidad (ex TASK-009) | Cierra sobre código congelado |

**Resultado:** de 7 tareas pendientes a **15**, con **10 ejecutables en paralelo** en las olas 1 y 2.

---

## 4. Diseño de paralelización

### 4.1 Regla de oro: un worktree por agente

**No es opcional.** El informe del propio equipo documenta que varios procesos Gradle
concurrentes sobre el mismo workspace provocaban `NoSuchFileException` en KSP y
*"Unable to delete directory … files open"*; tuvieron que aislar build dirs con
`isolate-build.init.gradle` y usar una copia aparte (`.verify-designer/`).

```bash
git worktree add ../pj-004 -b task/004-conversation
git worktree add ../pj-005 -b task/005-signals
# …una rama por tarea
```

### 4.2 Propiedad de archivos

| Archivo | Dueño | Regla |
|---|---|---|
| `settings.gradle.kts` | Integrador | Solo él añade `include(":feature:X")` |
| `app/build.gradle.kts` | Integrador | Solo él añade `implementation(project(...))` |
| `PuenteJovenNavHost.kt` | Integrador | Solo él sustituye placeholders |
| `feature/home/HomeScreen.kt` | Integrador | Solo él añade enlaces de entrada |
| `Repositories.kt` | Integrador | Congelado; cambios requieren solicitud |
| `LocalPuenteRepository.kt` | Integrador | Dueño único (persistencia + métodos nuevos) |
| `core/designsystem/**` | Congelado | Si falta un componente, se pide, no se improvisa |
| `feature/<tu-modulo>/**` | Agente | Propiedad exclusiva |

**Mecanismo:** cada agente escribe sus necesidades en
`deliverables/<task-id>/NECESIDADES.md` (módulo, ruta, método de repositorio, componente).
El integrador los aplica. Ningún agente toca los archivos compartidos.

### 4.3 Orden de integración

1. Integrador aplica la declaración de necesidades de cada tarea.
2. Agente rebasa su rama sobre `main` ya integrado.
3. Integrador compila y ejecuta `test` una vez por tarea (serializado, nunca en paralelo).
4. Merge.

---

## 5. Vacíos y preguntas abiertas

### 5.1 Bloqueantes — sin respuesta no se puede planificar

| # | Pregunta | Impacto |
|---|---|---|
| **P1** | **¿Existen las specs originales de TASK-003…009 en algún sitio, o hay que escribirlas?** Se citan `DECISIONES_PRODUCTO_Y_SEGURIDAD.md` y `TASK-003_SESION_PRIVADA_Y_DATOS_LOCALES.md`, y ninguna está en el repo. | Bloquea TASK-000 y, con ella, toda la Ola 1 |
| **P2** | **¿La persistencia local entra en el MVP?** Hoy todo se pierde al cerrar la app. | Define si TASK-003b existe y si el producto es demostrable |
| **P3** | **Barra inferior: ¿4 pestañas (implementado) o 5 (brief §32)?** Y si son 5, ¿`Ayudar` sale de la barra o convive con `Herramientas` y `Perfil`? | Afecta a Home, Profile, Tools y Help a la vez |
| **P4** | **¿La Ruta B "Quiero ayudar" entra en el APK juvenil del MVP?** El brief la trata como flujo de primera clase; el código no la tiene. | Es una tarea completa nueva (TASK-008) |
| **P5** | **¿Qué ve el joven cuando el nivel es ROJO?** No hay protocolo especificado: ni pantalla, ni texto, ni a quién se avisa, ni en cuánto tiempo. Los guardrails exigen guardia humana y protocolo aprobado. | Bloquea el cierre de TASK-005 y TASK-007. Es una decisión clínica, no técnica |

### 5.2 Importantes — afectan al diseño de las features

| # | Pregunta |
|---|---|
| **P6** | **i18n: ¿`strings.xml` o literales en Kotlin?** Hoy está mezclado (`RevocationReason` usa claves, `AttentionLevel` usa literales). Hay que decidirlo antes de repartir trabajo. |
| **P7** | **Herramientas breves: ¿3 (fixtures) o 6 (brief §14)?** Si son 6, ¿con qué nombres y qué guion cada una? |
| **P8** | **¿Entra el "modo demo" (alias Alex) del brief §4?** |
| **P9** | **¿"Mis próximos pasos" es pantalla propia o sección del Home?** |
| **P10** | **¿`ProfileRoute` es tarea propia (TASK-009) o parte de TASK-003?** El NavHost apunta a TASK-003, que ya se cerró. |
| **P11** | **¿Se mantiene la convención de nombres?** Los modelos usan identificadores en inglés y copy en español. Confirmarlo evita que un agente lo invierta. |
| **P12** | **¿Puente Red está fuera de alcance de este repo?** El brief §20–33 lo especifica entero (8 pantallas) y el prototipo web lo implementa, pero el APK juvenil lo excluye por guardrail. ¿Se planifica en otro sitio o se abandona? |
| **P13** | **PIN: ¿6 dígitos (spec) o 4 (maqueta)?** Abierto desde el 28. `PinPolicy.LENGTH` está en 6. |

### 5.3 Gobernanza — no son decisiones técnicas

| # | Pregunta |
|---|---|
| **P14** | **¿Quién aprueba `RetentionPolicy` y `PinPolicy`?** Son decisiones legales y clínicas, no de ingeniería. Hoy están fijadas por defecto en el código. |
| **P15** | **¿Quién es el responsable del protocolo de crisis?** El nivel rojo y el flujo de apoyo humano necesitan un dueño con criterio clínico. |
| **P16** | **¿Quién valida la política de retención contra la normativa boliviana aplicable a menores?** |
| **P17** | **¿Se acepta que el chat cifrado sea irrecuperable si se pierde la clave?** Es la decisión de diseño actual (F6); implica que un joven que pierde el teléfono pierde su historial. |

---

## 6. Anexo — Plantilla de especificación (propuesta)

Para que TASK-000 sea ejecutable, esta es la plantilla que propongo usar:

```markdown
# TASK-0XX · <Título>

## Contexto
Por qué existe esta tarea y a qué parte del producto sirve.

## Alcance
### Dentro
- …
### Fuera
- … (explícito: lo que un agente NO debe tocar)

## Módulo y propiedad
- Módulo: `feature:<nombre>`
- Archivos compartidos que necesita declarar: …

## Contratos de datos
Interfaces de `Repositories.kt` que consume. Métodos nuevos que necesita.

## Criterios de aceptación (verificables)
| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | … | prueba unitaria / instrumentada / revisión visual |

## Guardrails aplicables
Qué restricciones de producto son vinculantes aquí.

## Referencia visual
Pantalla(s) del prototipo web y qué se reutiliza del design system.

## Dependencias
Bloquea / bloqueado por.

## Preguntas abiertas
…
```

---

## 7. Decisiones tomadas (2026-09-29)

| # | Pregunta | Decisión | Impacto en el plan |
|---|---|---|---|
| P1 | ¿Existen las specs? | **No. Hay que escribirlas** | TASK-000 pasa de "recuperar" a **redactar desde cero** contra el brief y el prototipo. Es la tarea más grande de la Ola 0 y bloquea la Ola 1 |
| P2 | ¿Persistencia en el MVP? | **Sí, DataStore ahora** | TASK-003b confirmada en Ola 1. Cierra TASK-003 de verdad |
| P3 | Barra inferior: ¿4 o 5? | *(pendiente)* | Afecta a Home, Profile, Tools y Help a la vez |
| P4 | ¿Entra la Ruta B? | **Sí, tarea propia en Ola 1** | TASK-008 confirmada. +1 módulo: `feature:help` |
| P5 | Protocolo de nivel rojo | **Ver §8** | Abre un frente de alcance mayor que todas las features juntas |

---

## 8. Frente nuevo: protocolo de alerta roja

### 8.1 Lo decidido

Cuando el joven llega a prioridad **roja**:

1. El chat genera un **reporte con alerta roja** que se encamina a **Puente Red**
   (confirmado el 2026-09-29: *"la ruta B"* = el **portal profesional**, no la Ruta B del joven).
2. El reporte que ve el profesional **no contiene identificación** del joven.
3. Un **LLM con una metodología** lo revisa y lo **clasifica en dos categorías: medio y alto**.
4. Se **identifican características** del caso.
5. Se **deriva al psicólogo más apropiado**; el profesional **acepta** el caso y coordina.

La identificación del joven se resuelve con **alias + PIN** (ya implementado).
**La MAC del dispositivo no es viable** como identificador: Android no la entrega desde
API 23/24 y es un dato personal problemático. Ver `PLAN-PUENTE-RED.md` §2.2–2.3.

### 8.2 Por qué cambia el alcance del proyecto

Esto **no es una feature del APK juvenil**. Es un subsistema completo:

| Pieza | Dónde vive | Estado |
|---|---|---|
| Generación del paquete de alerta | APK juvenil | Nuevo |
| Clasificación por modelo (medio/alto) | Servidor | Nuevo — requiere backend |
| Extracción de características | Servidor | Nuevo |
| Directorio de psicólogos con perfil | Puente Red | Nuevo |
| Motor de emparejamiento caso ↔ profesional | Puente Red | Nuevo |
| Cola de asignación, SLA y trazabilidad | Puente Red | Nuevo |

Es decir: **es el núcleo de Puente Red**, declarado fuera de alcance por guardrail hasta hoy.
Y `BACKEND_INTEGRATION.md` lista explícitamente estas decisiones como **DIFERIDAS**
(*"no inferir ni codificar todavía"*).

### 8.3 Cuatro tensiones que hay que resolver antes de construirlo

**a) "Anónimo" y "derivar a un psicólogo" se contradicen.**
Si el reporte es realmente anónimo, el profesional no tiene canal de retorno: no puede
avisar al joven de nada. Para que exista seguimiento hace falta un **seudónimo con canal**,
que es exactamente lo que ya modela `SupportRequest`
(`DRAFT → AUTHORIZED → QUEUED → ACKNOWLEDGED → IN_PROGRESS → UPDATE_AVAILABLE → CLOSED`)
con `ConsentRecord` y `ShareableSummary` de alcance cerrado.
**Recomendación: reutilizar ese contrato** en lugar de inventar un reporte anónimo paralelo.
Un segundo mecanismo de compartición rompería la invariante `consent.scope ⊆ summary.scope`.

**b) El guardrail #3 dice "la IA NO diagnostica".**
Un modelo que clasifica en *medio/alto* desde texto libre es, funcionalmente, triaje
automático. No es necesariamente incompatible —clasificar prioridad no es diagnosticar—
pero **exige una decisión explícita y documentada**, revisión clínica y un plan para
cuando el modelo falle, no esté disponible o se equivoque.

**c) El APK juvenil no tiene red por diseño.**
`ModuleGraphGuardTest` **falla a propósito** si alguien añade `:core:network`. Clasificación
y derivación tienen que vivir fuera del APK. El APK solo puede *producir* el paquete y
*mostrar* el estado.

**d) Nadie ha definido el "más apropiado".**
Emparejar caso ↔ profesional exige un perfilado del profesional (especialidad, carga,
disponibilidad, idioma, zona) y criterios de equidad. Es una decisión de producto y de
gobernanza, no de código.

### 8.4 Tareas nuevas (lado juvenil)

| ID | Tarea | Ola |
|---|---|---|
| **TASK-015** | Generación del paquete de alerta roja (local, sin red) | 2 |
| **TASK-016** | Pantalla de estado del caso rojo (lo que el joven ve) | 2 |

**Todo lo demás** —clasificación, características, directorio, derivación, cola y portal
profesional— pertenece a Puente Red y se planifica por separado en **`PLAN-PUENTE-RED.md`**
(20 tareas propias, 11 paralelizables).

TASK-005 (nivel de atención) y TASK-007 (apoyo humano) quedan **bloqueadas** por `PR-001`
(especificación clínica del protocolo): sin saber qué promete el sistema, no se puede
decidir qué muestra la pantalla.

---

## 9. Resumen ejecutivo (actualizado)

- **El plan juvenil pasa de 9 a 17 tareas.** 8 huecos propios + 2 de desbloqueo (specs y
  contrato de integración) + 2 del protocolo rojo + las 7 originales.
- **Aparece un segundo producto**: Puente Red, con 20 tareas propias
  (`PLAN-PUENTE-RED.md`). Total del proyecto: **37 tareas**.
- **La Ola 1 permite 7 agentes en paralelo** porque los contratos y el design system ya
  están congelados. Es paralelismo real, no teórico.
- **Dos condiciones no negociables**: un worktree por agente (hay precedente documentado de
  builds rotos) y un dueño único para los 5 archivos compartidos.
- **La Ola 0 es más grande de lo que parecía**: hay que *escribir* las specs desde cero (P1)
  antes de repartir trabajo, porque no existen.
- **Riesgo principal**: el protocolo de alerta roja arrastra backend, decisiones clínicas y
  guardrails. Es el 55% del trabajo nuevo y no puede construirse por partes a ciegas.
- **Hallazgo técnico con fecha límite**: la MAC del dispositivo no se puede usar. Hay que
  sustituirla antes de escribir `PR-002`, o el modelo de identidad nace roto.

---

## 10. Decisiones cerradas el 2026-09-29 (tras comparar con el resumen ejecutivo)

Ver `../../COMPARACION-PLAN-VS-RESUMEN-EJECUTIVO.md` para el análisis completo.

| # | Decisión | Consecuencia |
|---|---|---|
| **D1** | **Dos capas de clasificación.** El APK calcula 3 niveles (verde/amarillo/rojo) con reglas deterministas; el backend reclasifica en 2 categorías (medio/alto) con LLM | `TASK-005` implementa los 3 niveles; `PR-005` implementa las 2 categorías. **El rojo lo determinan las reglas, nunca el LLM** |
| **D2** | **El LLM solo puede subir de categoría.** Nunca puede bajar un rojo | Regla de seguridad que debe quedar escrita en `PR-001` y probada en `TASK-018` |
| **D3** | **Se usa IA generativa**, con cláusula de **no-reentrenamiento** sobre datos de menores | La conversación con el joven sigue en reglas auditables. Requiere acuerdo con el proveedor del LLM (`PR-005`) |
| **D4** | **El MVP incluye panel de supervisores y directorio de derivación** | **Puente Red entra en el MVP.** `TASK-011` (derivación) y `PR-011`–`PR-017` suben de ola |
| **D5** | **Respuesta escalonada por gravedad**: personal capacitado para amarillo/medio, psicólogo para rojo/alto | Cambia `PR-007` (perfilado) y `PR-008` (motor de derivación) |

### 10.1 Tareas nuevas que añade la comparación

| ID | Tarea | Ola | Origen |
|---|---|---|---|
| **TASK-017** | Registro de eventos adversos | 2 | Resumen, Fase 2 (MVP) |
| **TASK-018** | Suite de prueba de seguridad con escenarios simulados — **criterio de avance** | 2 | Resumen, Fase 3 |
| **TASK-019** | Apoyo humano breve telefónico (modelo híbrido) | 3 | Bryant et al. 2026 |
| **TASK-020** | Marco de evaluación de 7 dimensiones | 3 | Resumen, Fase 5 |
| **TASK-021** | Modelo de amenaza de privacidad en contexto de divorcio | **0** | Resumen §5 |
| **TASK-022** | Co-diseño con adolescentes | **0** | Resumen, Fase 1 |
| **TASK-023** | Auditoría de consultas a casos | 2 | Resumen §4 |
| **TASK-024** | Canal de audio *(sujeto a decisión)* | 3 | Resumen, Fase 1 |

`TASK-021` es de Ola 0 porque condiciona el diseño del reporte: si el contenido puede usarse
como arma en una disputa de custodia, cambia qué se guarda y qué se comparte.

### 10.2 Conteo actualizado

| | Antes | Ahora |
|---|---|---|
| Tareas del APK juvenil | 17 | **25** |
| Tareas de Puente Red | 20 | **20** (reordenadas) |
| **Total** | **37** | **45** |

### 10.3 Lo que sigue bloqueado

- `TASK-005` y `TASK-007` siguen bloqueadas por `PR-001` (protocolo clínico firmado).
- `PR-002` sigue bloqueado por el sustituto de la MAC.
- **P3** (barra inferior: ¿4 o 5 pestañas?) sigue sin respuesta y afecta a cuatro módulos.
- **Q5**: ¿cuáles son los 3 módulos TCC del MVP? Hay 8 candidatos en el resumen y no elige.
- **Q6**: la Ruta B entra (decidido), pero el resumen no la menciona — hay que alinear el
  vocabulario si el resumen va a la competencia.

### 10.4 Decisiones cerradas el 2026-09-29 (tercera ronda)

| # | Decisión | Impacto |
|---|---|---|
| **P3** | **5 pestañas**: `Inicio · Hablar · Recorrido · Herramientas · Perfil` | Se vuelve al brief §32. «Ayudar» pasa a ser camino principal del Home, con más protagonismo que en una barra. `PuenteBottomNavigation` pasa de 4 a 5 destinos |
| **Q5** | **3 módulos TCC del MVP**: sueño · respiración/regulación · plan de apoyo | `TASK-006a` implementa estos tres. Atacan las tres señales que Sarfo 2026 marca como prioritarias: sueño alterado, ansiedad y aislamiento |
| **PR-002** | **La MAC era para desambiguar alias+PIN** ("pueden existir personas con el mismo nombre y clave") | **Resuelto sin MAC.** Ver §10.5 |
| **PR-001** | **Borrador redactado** | `../../PR-001-PROTOCOLO-DE-CRISIS.md`. Pendiente solo de firma clínica |

### 10.5 PR-002 resuelto: la identidad nunca fue el alias

El requisito real era: *"puede ser que existan personas con el mismo nombre y clave"*. Es
decir, el problema no era el dispositivo — era que **alias y PIN se estaban usando como
identidad**.

El código ya prohíbe eso: `YouthAlias` es un tipo distinto de `ProfileId` precisamente para que
nadie los confunda, y su KDoc dice que *"el alias no identifica de forma estable"*.

**Resolución:**

| Necesidad | Mecanismo | Estado |
|---|---|---|
| Identidad única de la persona | `ProfileId` opaco (UUID) generado en el primer arranque y guardado en `SecureLocalStore` | Ya existe el tipo; falta persistirlo |
| Desbloqueo local | Alias + PIN | Ya implementado |
| Vínculo con el reporte anónimo | `caseToken` emitido por el backend; la tabla `caseToken ↔ ProfileId` vive aparte, con acceso restringido y auditoría | Nuevo (`PR-004`) |

Dos adolescentes con el mismo alias y el mismo PIN **son personas distintas** porque tienen
`ProfileId` distintos. El alias no entra nunca en el reporte.

**Hallazgo nuevo que destapa esto:** la app soporta **un solo perfil por instalación**
(`profileState` es un único `MutableStateFlow`). Si el teléfono es compartido —hermanos, un
laboratorio del colegio, un centro comunitario—, el segundo adolescente pisa al primero. En un
piloto en La Paz con dispositivos compartidos eso es un fallo de privacidad, no una limitación.

| ID | Tarea | Ola |
|---|---|---|
| **TASK-025** | **Multi-perfil en dispositivo compartido** (varios `ProfileId` por instalación, con aislamiento entre ellos) | 1 |

### 10.6 Conteo actualizado

| | Antes | Ahora |
|---|---|---|
| Tareas del APK juvenil | 25 | **26** |
| Tareas de Puente Red | 20 | **20** |
| **Total** | **45** | **46** |

