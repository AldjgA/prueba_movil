# PR-003 · Contrato de datos Joven ↔ Red

**Fecha:** 2026-09-30 · **Actualizado:** 2026-09-30 (segunda ronda: R1–R5)
**Autor:** Agente A — Núcleo y contratos
**Ola:** R0 (gobernanza y especificación) · **Punto de sincronización:** S3
**Depende de:** `PR-002` (identidad) · **Bloquea:** `PR-004` (ingesta), `TASK-013` (contratos remotos), toda la cola de C
**Estado:** **decisiones cerradas** (2026-09-30) — listo para el punto de sincronización **S3**

> ⚠️ **Este contrato cambia dos guardrails vigentes** (§10): el APK juvenil deja de ser
> *sin red*, y el joven pasa a ver datos del profesional **tras la aceptación**.
> Es un cambio de arquitectura deliberado del dueño del producto. Léase §10 antes de aprobar.

---

## 0. Decisiones de origen

### 0.1 Primera ronda (2026-09-30)

| # | Decisión | Consecuencia en este contrato |
|---|---|---|
| **D1** | Los dos productos comparten **un mismo backend**, pero se **gestionan de forma independiente** | §1: una plataforma, dos superficies de API con ciclo de vida propio |
| **D2** | Al backend se le dan **los criterios** de lo que debe llevar el reporte | §4: el esquema del reporte es un contrato del backend; el APK lo cumple |
| **D3** | El backend **genera** el caso y **registra la transacción en la BD**; al resolverse, **se correlaciona** | §3: máquina de estados + tabla de correlación |
| **D4** | El APK del joven **accede a la información del psicólogo que aceptó el caso**, y **puede contactarlo** | §5 y §6 |

### 0.2 Segunda ronda (2026-09-30) — respuestas a Q1–Q5

| # | Respuesta del usuario | Cómo queda en el contrato |
|---|---|---|
| **R1** | "Sigue siendo **anónimo**: solo tiene el **contacto** si el psicólogo **quiere comunicarse** con el joven" | El joven **permanece seudónimo** hacia el profesional. El **canal de contacto** se habilita **solo cuando el psicólogo lo inicia** (§6.2) |
| **R2** | "El canal está bien, pero **colócalo como baja prioridad** de momento" | El canal in-app queda como **baja prioridad** (fuera del camino crítico del MVP) |
| **R3** | Servidor **0.1 vCPU / 256 MB sin cold start**; **una sola API** + **Google GenAI** (LLM) + **Supabase** (BD) | §13 + documento `PR-INFRA-RECOMENDACION.md` |
| **R4** | "De momento **pierde la cuenta**; después se verán mejoras" | **Sin recuperación de cuenta en el MVP.** Limitación aceptada y documentada (§11) |
| **R5** | "La revelación es **al Joven** desde la Red; cuando el psicólogo acepta **se muestran los datos al joven**" | Revelación **unidireccional Red → Joven**, al pasar a `ACEPTADO` (§7) |

**Conciliación R1 + R5** (léase con atención, es sutil):
- Al **aceptar**, el joven **ve los datos del psicólogo** (quién es: nombre visible, rol, especialidad) — R5.
- La **posibilidad de contactarlo** (canal bidireccional) **no** se abre con la aceptación: se abre **solo si el psicólogo decide comunicarse** — R1.
- Es decir: **identidad sí al aceptar; canal solo a iniciativa del psicólogo.**

### 0.3 Tercera ronda (2026-09-30) — respuestas a Q6–Q9

| # | Respuesta del usuario | Cómo queda |
|---|---|---|
| **Q6** | "Solo será **demostrativo**; el servidor no aguanta más de **5 usuarios recurrentes**" | Alcance = **demo/piloto de ≤5 usuarios**. Las capas gratuitas bastan (§13) |
| **Q7** | "Es demostrativo, así que sí: **nada de datos de verdad**; pero **no cargar datos sintéticos aún**" | Demo **sin datos reales ni sintéticos**. La capa gratuita de Gemini es admisible **solo por eso** (§13) |
| **Q8** | "**No** hay guardia 24/7; por ahora no" | Nivel rojo **honesto**: emergencia + números reales, **sin** prometer contacto inmediato (§15) |
| **Q9** | Profesionales con **Supabase Auth** | §1 y §13 |

---

## 1. Arquitectura: un backend, dos gestiones

### 1.1 Topología

```
        APK Joven                          Portal profesional
     (Kotlin/Compose)                        (Puente Red)
            │                                      │
            │ HTTPS · API Joven                    │ HTTPS · API Profesional
            │ (token de caso)                      │ (credenciales + rol)
            ▼                                      ▼
     ┌──────────────────────────────────────────────────────┐
     │         UNA API (servidor 0.1 vCPU / 256 MB)         │
     │  ┌────────────────┐        ┌────────────────────┐    │
     │  │  rutas /joven  │        │ rutas /profesional │    │
     │  └───────┬────────┘        └─────────┬──────────┘    │
     │          └──────────┬────────────────┘               │
     │                     ▼                                │
     │   Núcleo común: clasificador LLM · extracción de      │
     │   características · motor de derivación · cola/SLA    │
     └──────────┬───────────────────────────────┬──────────┘
                ▼                               ▼
        Google GenAI (LLM)              Supabase (Postgres + Auth
        llamada desde la API            + RLS + Realtime)
```

### 1.2 Qué significa "mismo backend, gestión independiente"

| Dimensión | API Joven | API Profesional |
|---|---|---|
| Consumidor | APK juvenil | Portal Puente Red |
| Autenticación | sesión local (alias + PIN) → **token de caso** | credenciales profesionales + **roles** |
| Ve la identidad del joven | sí (es su propia sesión) | **no** (el joven es seudónimo — R1) |
| Ve los datos del profesional | **solo desde `ACEPTADO`** | sí (es su panel) |
| Despliegue / versionado | independiente | independiente |
| Puede leer los contratos del otro | **no** | **no** |

Las dos superficies comparten **código desplegado** (una sola API) pero **no** los contratos de
borde: son grupos de rutas separados, con autenticación y permisos distintos.

---

## 2. La frontera: qué cruza y qué no

| Elemento | Joven (APK) | Backend | Profesional (Red) |
|---|---|---|---|
| Permisos de red | **sí, solo contra la API Joven** | — | sí |
| Conoce la existencia del otro producto | **no** (solo ve "tu caso") | sí | sí |
| Identidad del joven | `ProfileId` local | `caseToken` (nunca `ProfileId` junto al contenido) | **seudónimo o nada** (R1) |
| Contenido del reporte | lo produce | lo recibe, clasifica y deriva | lo consume |
| Consentimiento | `ConsentRecord` + `ShareableSummary` | lo valida, no lo crea | lo consume |

**Regla de oro:** el `ProfileId` **nunca** viaja junto al contenido. El backend correlaciona
`caseToken ↔ ProfileId` en una tabla aparte, con acceso restringido y auditoría.

---

## 3. Ciclo de vida del caso (transacción + correlación)

### 3.1 Máquina de estados

```
 [APK]  nivel rojo (o amarillo autorizado)
    │
    ├─(offline)─► muestra emergencia + ENCOLA el reporte   ← el rojo nunca depende de la red
    │
    └─(online)──► POST /joven/casos  ──────────────┐
                                                    ▼
                                        ┌────────────────────┐
                                        │ RECIBIDO           │  ← transacción insertada en la BD
                                        └─────────┬──────────┘
                                                  ▼
                                        ┌────────────────────┐
                                        │ CLASIFICADO        │  ← LLM: MEDIO | ALTO (+ versión)
                                        └─────────┬──────────┘
                                                  ▼
                                        ┌────────────────────┐
                                        │ EN_COLA            │  ← motor de derivación
                                        └─────────┬──────────┘
                                                  ▼
                                        ┌────────────────────┐
                                        │ ASIGNADO           │  ← propuesto a un profesional
                                        └─────────┬──────────┘
                                                  ▼
                                        ┌────────────────────┐
                                        │ ACEPTADO           │  ← CORRELACIÓN en la BD (§3.2)
                                        └─────────┬──────────┘     + el joven VE los datos del
                                                  │                  psicólogo (R5)
                                                  ▼
                              ┌───────────────────────────────────┐
                              │ ¿el psicólogo inicia comunicación?│
                              └───────────────┬───────────────────┘
                                     sí ──────┴────── no
                                      ▼              ▼
                        ┌──────────────────┐   (sin canal: el joven
                        │ CONTACTO_HABILIT.│    solo ve los datos)
                        └────────┬─────────┘
                                 ▼
                        ┌──────────────────┐
                        │ EN_CURSO         │  ← canal in-app activo (baja prioridad)
                        └────────┬─────────┘
                                 ▼
                        ┌──────────────────┐
                        │ RESUELTO→CERRADO │
                        └──────────────────┘
```

### 3.2 La transacción y su correlación (decisión D3)

| Momento | Qué pasa en la BD |
|---|---|
| **Generación** (`RECIBIDO`) | Se **inserta la transacción** del caso: `caseToken`, estado, nivel de origen, `rulesetVersion`, marca de tiempo. **Sin identidad.** |
| **Clasificación** | Se anexan `categoria` (MEDIO/ALTO), `modelVersion` y `promptVersion`. El LLM **no puede degradar** un rojo (P3 de `PR-001`). |
| **Resolución de la asignación** (`ACEPTADO`) | Se **correlaciona**: se inserta la fila `caseToken ↔ profesionalId` (y, aparte, `caseToken ↔ ProfileId`) en la tabla restringida. **Ese es el instante en que el joven ve los datos del psicólogo (R5).** |
| **Inicio de contacto** (`CONTACTO_HABILITADO`) | El psicólogo decide comunicarse → se abre el canal in-app (**baja prioridad** — R2). |
| **Cierre** | Se cierra la transacción; la correlación se conserva para auditoría (`TASK-023`, `PR-018`). |

> "Cuando se resuelva se correlaciona con la base de datos" = la aceptación del profesional
> **resuelve la fase de triaje** y es el momento en que la transacción anónima se une a las
> filas que sí tienen identidad. Antes de eso, el caso es anónimo de punta a punta.

---

## 4. Contrato A — Reporte (Joven → Backend)

Los **criterios** del reporte los define el backend (D2); el APK los cumple. El APK **no
inventa campos**.

```
POST /joven/casos                       (API Joven, autenticado con token de caso)

{
  "contratoVersion": "1.0",
  "caseToken": "…",                     // emitido por el backend; provisional si offline
  "origenNivel": "ROJO",                // reglas deterministas del APK
  "rulesetVersion": "…",                // trazabilidad del cálculo local
  "motivo": ["ideacion_activa", "…"],   // CLAVES de catálogo, nunca texto libre
  "respuestasChequeo": [ { "clave": "…", "opcion": "…" } ],
  "resumenAutorizado": { "scope": [ … ], "nota": "…" },   // scope CERRADO
  "consentimiento": { "id": "…", "scope": [ … ], "otorgadoEn": "…" },
  "creadoEn": "…"
}
```

**Nunca viaja en el reporte:** `ProfileId`, alias, MAC, el chat completo ni ningún
identificador de dispositivo. Solo claves de catálogo y lo autorizado por el joven.

### 4.1 Catálogo de claves de señal (K1 — resuelto el 2026-09-30)

**Forma canónica: `SNAKE_CASE` en MAYÚSCULAS.** Es la del backend, que es quien versiona el
catálogo. El APK **debe** emitirlas así.

| Clave canónica | Etiqueta en el APK | Origen |
|---|---|---|
| `SLEEP` | Sueño alterado | Sarfo 2026 |
| `ANXIETY` | Ansiedad | Sarfo 2026 |
| `ISOLATION` | Aislamiento | Sarfo 2026 |
| `SCHOOL_IMPACT` | Deterioro escolar | Resumen §4 |
| `SUBSTANCE_USE` | Consumo de alcohol | Sarfo 2026 |
| `SELF_HARM` | Autolesión | Resumen §4 |
| `PHYSICAL_VIOLENCE` | Violencia física | Sarfo 2026 |

**Correspondencia con lo que el APK emitía** (verificado en `DemoFixtures.kt`):

| APK emitía | Canónico |
|---|---|
| `sleep` | `SLEEP` |
| `anxiety` | `ANXIETY` |
| `isolation` | `ISOLATION` |
| `school_impact` | `SCHOOL_IMPACT` |
| `substance_use` | `SUBSTANCE_USE` |
| `self_harm` | `SELF_HARM` |
| `frequency` | **retirada** — es una **dimensión de análisis** (brief §10), no un tipo de señal |

> El catálogo lo versiona `PR-006` (`SignalTag`); `PR-003` fija la **forma** y la correspondencia.

### 4.2 Catálogo de `motivo` (K2 — resuelto el 2026-09-30, **provisional**)

Derivado de `PR-001` §4.3. **Provisional y versionado** con `rulesetVersion`: provisional no
significa indefinido — significa que la lista es **cerrada** y cambia de **versión**, no de diseño.

| Clave | Criterio de `PR-001` §4.3 |
|---|---|
| `ideacion_activa` | Ideación suicida activa |
| `plan_estructurado` | Plan |
| `intento_reciente` | Intento reciente |
| `autolesion` | Autolesión |
| `abuso` | Abuso |
| `peligro_inmediato` | Peligro inmediato |
| `violencia_no_inmediata` | Violencia no inmediata (amarillo) |
| `deterioro_escolar` | Deterioro escolar (amarillo) |
| `aislamiento_persistente` | Aislamiento (amarillo) |
| `acumulacion` | **Escalada por acumulación**: varias señales amarillas a la vez, sin que ninguna sea grave por sí sola |
| `acoso` | **Acoso o violencia entre iguales** — el caso central del brief |

> **Pendiente de firma clínica:** el clínico puede ajustar esta lista; al hacerlo **cambia
> `rulesetVersion`**. Hasta entonces es la lista vigente, y B puede emitir `motivo` sin inventar.

> **Por qué `acumulacion` y `acoso` (añadidos el 2026-09-30):** sin `acumulacion`, un amarillo
> disparado por **acumulación** viajaba con `motivo` **vacío** — el equipo no sabría por qué se
> encendió. Y `acoso` es el caso central del brief: no podía faltar en el catálogo.

### 4.3 Catálogo de claves del chequeo (duplicación resuelta el 2026-09-30)

**Un solo vocabulario, una sola fuente.** Verificado: el prototipo (`ContextCheckScreen.tsx`) define
**5 preguntas** y `LocalPuenteRepository.availableQuestionKeys()` devolvía **otras 4**
(`hoy_como_estas`, `donde_ocurre`, `cada_cuanto`, `con_quien_puedes_contar`). Dos vocabularios para
lo mismo: si derivan, **una regla deja de dispararse en silencio**.

**Canónico = el del prototipo.** Se publica en código en `:core:model` (`CheckCatalog`), de modo que
`feature:conversation` y `feature:signals` **consuman la misma constante** en vez de duplicarla.

| Clave de pregunta | Pregunta (copy, vive en el APK) | Opciones (claves cerradas) |
|---|---|---|
| `emotions` | ¿Cómo describirías cómo te has sentido esta semana? | `sad` · `anxious` · `angry` · `confused` · `exhausted` · `lonely` · `fine` · `dont_know` |
| `sleep` | ¿Cómo ha estado tu sueño últimamente? | `sleeps_well` · `hard_to_sleep` · `sleeps_too_much` · `nightmares` · `varies` |
| `school` | ¿Cómo está yendo en el colegio? | `fine` · `so_so` · `struggling` · `missing_school` · `doesnt_want_to_go` |
| `loneliness` | ¿Tienes personas con quienes hablar cuando algo te preocupa? | `several` · `one_or_two` · `rarely` · `usually_not` · `no_one` |
| `safety` | ¿Te sientes seguro/a en tu entorno habitual? | `yes` · `no` |

**Reglas:**

1. **La clave es un identificador, no copy.** El texto de la pregunta y de las opciones **nunca**
   viaja en el contrato: vive en `strings.xml` del APK (regla de la casa #2).
2. **`safety` es la pregunta crítica**: es la única cuya respuesta puede elevar a rojo por sí sola.
   Que su clave sea estable es lo que garantiza que **no se pierda un peligro inmediato**.
3. `emotions` admite **selección múltiple**; las otras cuatro, una sola.
4. El catálogo se versiona con `rulesetVersion`: añadir o quitar una clave **es** un cambio de
   versión, no un ajuste de copy.

---

## 5. Contrato B — Estado del caso (Backend → Joven)

```
GET /joven/casos/{caseToken}            (API Joven)

{
  "caseToken": "…",
  "estado": "ACEPTADO",
  "categoria": "ALTO",                  // MEDIO|ALTO; nunca degradable
  "actualizadoEn": "…",
  "psicologo": { … } | null,            // NO NULO DESDE estado >= ACEPTADO (R5)
  "canalContacto": "IN_APP" | null,     // NO NULO SOLO desde CONTACTO_HABILITADO (R1)
  "fueraDeHorario": false,              // K5: el APK NO infiere el horario del equipo
  "mensajesNoLeidos": 0
}
```

**`fueraDeHorario` (añadido el 2026-09-30 — hallazgo K5 de B).** Sin él, el APK tendría que
**inferir el horario del equipo** para ser honesto con los tiempos (`PR-001` P5 / §9). Eso sería
copiar localmente una regla de negocio ajena, y se desincronizaría el primer día.

**Reglas duras:**
- `psicologo` es `null` hasta `ACEPTADO`; desde `ACEPTADO` **sí** se muestra (R5).
- `canalContacto` es `null` hasta que el **psicólogo decide comunicarse** (R1). Que el joven
  vea los datos del profesional **no** le da canal.

---

## 6. Contrato C — Contacto con el psicólogo

### 6.1 Datos del psicólogo (desde `ACEPTADO`)

```
{
  "nombreVisible": "…",        // nombre profesional de contacto (no datos personales)
  "rol": "psicologo",          // psicologo | trabajador_social | orientador | supervisor
  "especialidad": "trauma"     // clave cerrada, minúsculas
}
```

**Forma canónica (K6 — resuelto el 2026-09-30):**

- **`rol` en minúsculas.** `PR-007` se alinea: `PSICOLOGIA` era una **disciplina**, no un rol.
- **`especialidad` es clave cerrada**, en minúsculas (`trauma`, `duelo`, `bullying`, `familia`,
  `adicciones`).
- **El copy visible vive en el APK** (`strings.xml`), y **A publica el catálogo de etiquetas**.
  Nunca llega una clave de enum a la pantalla de un adolescente; nunca llega texto generado
  (`PR-001` §6.2).

### 6.2 Canal de contacto — **baja prioridad** (R2), gated por el psicólogo (R1)

| Opción | Cómo funciona | Valoración |
|---|---|---|
| **A. Mensajería en la app** | Hilo mediado y trazable; el profesional inicia, el joven responde | **Recomendada.** No expone datos personales; mantiene el anonimato del joven |
| **B. Llamada programada** | Se agenda una franja | Complemento válido |
| **C. Teléfono directo** | Se muestra el número del profesional | **Desaconsejada** |

**Prioridad:** el canal es **baja prioridad** — fuera del camino crítico del MVP. Se documenta
ahora y se construye después (candidato a ola posterior a `PR-016`).

### 6.3 Lo que la app del joven NO muestra nunca

- El estado interno del caso, la carga del profesional ni las notas internas (guardrail Red §7).
- **La identidad del joven hacia el profesional** (R1: el joven es seudónimo).
- Cualquier dato que no venga del backend.

---

## 7. Identidad y anonimato (ref. `PR-002`) — cerrado

| Relación | Antes | Ahora |
|---|---|---|
| Joven → ve los datos del profesional | nunca | **desde `ACEPTADO`** (R5) |
| Joven → tiene canal para contactarlo | nunca | **solo si el psicólogo inicia** (R1) |
| Profesional → ve la identidad del joven | nunca | **nunca**: el joven es **seudónimo** (R1) |
| Backend → correlaciona | `caseToken ↔ ProfileId` aparte | igual, más `↔ profesionalId` al aceptar |

La revelación es **unidireccional: Red → Joven** (R5). El alias sigue **sin** ser identidad; el
`ProfileId` sigue siendo opaco; el `caseToken` sigue siendo el único vínculo.

---

## 8. Versionado del contrato

- `contratoVersion` viaja en cada petición y respuesta.
- Cambios incompatibles → nueva versión mayor; el backend sostiene la anterior durante la
  ventana de actualización del APK.
- `rulesetVersion`, `modelVersion` y `promptVersion` son trazabilidad, **no** versionado.

---

## 9. Invariantes que no se pueden romper

1. `consent.scope ⊆ summary.scope`.
2. El chat completo nunca entra en el reporte.
3. El `ProfileId` nunca viaja junto al contenido; solo el `caseToken`.
4. El LLM **no degrada** un rojo; solo puede subir.
5. El joven **no** ve datos del profesional antes de `ACEPTADO`.
6. El joven **no** tiene canal de contacto salvo que el psicólogo lo inicie.
7. El joven **nunca** revela su identidad al profesional en el MVP (seudónimo).
8. El flujo rojo del APK **funciona offline**: muestra emergencia y encola el reporte.
9. Todo cambio de estado queda auditado.
10. Ningún contrato profesional se compila en el APK: las superficies siguen separadas.

---

## 10. ⚠️ Impacto en los guardrails vigentes

| Guardrail | Estado | Qué cambia |
|---|---|---|
| **#6 — "El APK juvenil no tiene red"** | **SE MODIFICA** | El APK **sí** necesita red, pero **solo** contra la **API Joven** |
| **Red §7.3 — "el joven nunca ve la identidad del profesional"** | **SE MODIFICA** | Se muestran sus datos **desde `ACEPTADO`** (R5) |
| **`ModuleGraphGuardTest`** | **DEBE ACTUALIZARSE** | Hoy **falla a propósito** si existe `:core:network`. Hay que permitir la red en el flavor `remote` y seguir prohibiendo endpoints y contratos profesionales (`TASK-013`) |
| **`BACKEND_INTEGRATION.md` §2 (DIFERIDAS)** | **SE ACTIVA PARCIALMENTE** | Protocolo, versionado, idempotencia y autenticación se definen aquí; hosting y secretos siguen diferidos |
| **`PR-001` §10 — "el APK no depende de la red para el rojo"** | **SE MANTIENE** | Offline-first: el rojo se muestra y se encola |

**Consecuencia técnica inmediata:** el APK pasa de "sin red" a "red acotada a la API Joven".
Obliga a crear `:core:network` (o un `:core:sync` estrecho) y a **reescribir**
`ModuleGraphGuardTest` para vigilar lo correcto: que el APK hable **solo** con la API Joven.

---

## 11. Limitación aceptada: pérdida de cuenta (R4)

Si el joven **pierde el dispositivo**, **pierde la cuenta**. No hay recuperación en el MVP.

- Es coherente con la decisión F6: el contenido local es irrecuperable por diseño.
- El **caso ya enviado al backend no se pierde** (vive en la BD); lo que se pierde es el
  vínculo local (`ProfileId` + clave) para volver a verlo.
- Queda registrado como **deuda conocida**, no como olvido. Mejoras futuras: re-vinculación
  por `caseToken` + verificación humana.

---

## 12. Lo que este contrato desbloquea

- `PR-004` (ingesta y emisión de `caseToken`).
- `TASK-013` (backend y contratos remotos) — recibe los DTOs y la guarda a reescribir.
- `TASK-015` / `TASK-016` (paquete de alerta y estado del caso, lado juvenil).
- Toda la cola de C (`PR-005`…`PR-020`) — **punto de sincronización S3**.

---

## 13. Infraestructura del backend (R3)

Detalle completo en **`PR-INFRA-RECOMENDACION.md`**. Resumen:

| Pieza | Elección | Nota |
|---|---|---|
| API | **una sola**, sin estado, en el servidor de 256 MB | Runtime **Go** o **Node/Bun**; un framework JVM **no cabe** |
| LLM | **Google GenAI**, llamado desde la API | ⚠️ **La capa gratuita usa los datos para mejorar Google** → solo para la demo; datos reales exigen **capa de pago** |
| Base de datos | **Supabase** (Postgres + RLS + Realtime) | ⚠️ Free **se pausa tras ~7 días** sin actividad |
| Auth de profesionales | **Supabase Auth** (Q9) | No reinventarla |

**Escala (Q6):** alcance **demostrativo, ≤5 usuarios recurrentes**. Con ese volumen las capas
gratuitas (Gemini + Supabase + servidor) son suficientes; **no** hace falta dimensionar para más.

**Sin datos (Q7):** la demo **no usa datos reales** y, por ahora, **tampoco sintéticos**. Se
muestra el flujo y la UI; no se puebla la base con casos. Por eso la capa gratuita de Gemini es
admisible **en esta fase**.

---

## 14. Estado del contrato

**Todas las preguntas (Q1–Q9) están cerradas.** No quedan decisiones abiertas de este contrato.
`PR-003` queda listo para publicarse en el punto de sincronización **S3** (desbloquea a C).

Pendiente de gobernanza (no bloquea): confirmar el texto exacto de los Términos de Servicio de
Gemini sobre el uso de datos — ver §4 de `PR-INFRA-RECOMENDACION.md`.

---

## 15. Nota: qué es la "guardia 24/7" (respuesta a Q8)

**Guardia 24/7** = si hay **personas de turno las 24 horas, todos los días**, para recibir y
atender una alerta roja **en el momento en que se produce**.

Importa por el principio P5 de `PR-001`: **el sistema nunca promete una respuesta que no puede
dar.** De esa respuesta depende qué muestra la pantalla de rojo:

| ¿Hay guardia 24/7? | Qué puede mostrar la app en rojo |
|---|---|
| **Sí** | "Una persona te contactará en breve" + contacto humano inmediato |
| **No** | Instrucciones de emergencia + **números de crisis reales** + "tu caso lo revisará una persona en [horario]" |

**Resuelto (Q8, 2026-09-30): NO hay guardia 24/7.** Se adopta la fila **"No"** de la tabla: la
pantalla de rojo muestra **instrucciones de emergencia y números de crisis reales**, y **no**
promete contacto inmediato. Una pantalla de "estamos contigo" sin nadie detrás es peor que no
mostrarla (P5).

⚠️ **Aviso de demo:** si el despliegue es demostrativo y **no hay ninguna persona real
atendiendo**, hay que decirlo en la propia app. Una demo que simula una respuesta clínica
inexistente es exactamente lo que `PR-001` prohíbe.
