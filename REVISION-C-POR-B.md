# REVISION-C-POR-B · Revisión del Agente B sobre la Fase 0 del Agente C

**Fecha:** 2026-09-30 · **Autor:** Agente B — APK juvenil
**Origen:** rama `agente/C-red` (`49fbe0a`) · **Base de la revisión:** `main` = `a106ed8`
**Alcance:** las 18 specs de C (`PR-005`…`PR-020`, `TASK-019`, `TASK-020`) y `PR-000` rev. 2.
**Veredicto:** ✅ **Aprobada con hallazgos.** El trabajo de C es de alta calidad y no requiere
rehacerse. **7 de mis 10 hallazgos son de la frontera Joven↔Red** — es decir, cosas que ni A ni C
pueden ver solos, porque solo se ven desde el lado del APK.

> **Por qué reviso esto.** `MATRIZ-TRAZABILIDAD.md` §4 y `puente-red/deliverables/REVISION-A.md` §7
> dicen literalmente que las 18 specs *"esperan la revisión de **A y B**"*. C ya hizo su parte
> (`REVISION-A.md`). Esta es la mía.

---

## 1. Lo que C hizo bien (y quiero que conste)

1. **`PR-019` §5 es la joya de la cola.** Los 6 casos límite de revocación son exactamente los que
   un revisor descuidado no habría escrito, y el caso 5 (*"el psicólogo no decide comunicarse: el
   joven ve los datos pero no tiene canal. Es un estado válido y frecuente"*) es la conciliación
   R1/R5 entendida de verdad, no repetida.
2. **La regla de las fixtures negativas** (`PR-020` §3: *"una invariante sin prueba negativa no está
   protegida"*) es la misma que adopté para `TASK-018`. Que dos agentes lleguen a ella por separado
   significa que es la correcta.
3. **`PR-020` criterio 12** (el APK nunca llama a `/profesional`, el portal nunca llama a `/joven`)
   convierte una frontera de arquitectura en una prueba ejecutable. Es lo que faltaba.
4. **`PR-006` §4 `ConfidenceBand`** (banda cualitativa en vez de porcentaje) protege el brief §15
   por diseño, no por disciplina del programador. Buen criterio.
5. **`PR-017` §2.E y `TASK-020` §2** resolvieron el modo demo con honestidad: `IsDemoData = true` y
   `baseline = null` en vez de inventar datos. Es coherente con Q7 y con `PR-001` P5.
6. **C no tocó nada del APK.** Las 18 specs declaran *"Archivos compartidos que necesita declarar:
   ninguno"*. La regla de §2.2 del plan se respetó al pie de la letra.

---

## 2. Hallazgos de frontera Joven ↔ Red

Son los que justifican que B revise esta cola. Todos están **verificados contra el código del APK**,
no deducidos de la lectura.

### K1 · 🔴 El vocabulario de señales no coincide entre el APK y el backend

| Lado | Vocabulario | Fuente |
|---|---|---|
| **APK** | `SignalKey("frequency")`, `SignalKey("isolation")` — minúsculas | `DemoFixtures.kt:56,100` (verificado) |
| **Backend** | `SignalTag` = `SLEEP \| ISOLATION \| SCHOOL_IMPACT \| SUBSTANCE_USE \| SELF_HARM \| ANXIETY` — mayúsculas | `PR-006` §4 |
| **Contrato** | *"`motivo` son **CLAVES de catálogo**, nunca texto libre"* | `PR-003` §4 |

`PR-006` §2 extrae del `ResumenAutorizado`, y el `scope` del resumen son claves que **emite el APK**
(`ShareScopeEntry.Signal(key)`). **No existe ninguna tabla de correspondencia en ningún documento.**

Consecuencia: el extractor de C recibiría `"isolation"` y esperaría `ISOLATION`; `"frequency"` no
tiene equivalente en `SignalTag` en absoluto (es una *dimensión de análisis* del brief §10, no un
tipo de señal). **Esto rompe `TASK-015` (B) y `PR-006` (C) a la vez.**

**Propuesta de B:** el catálogo de claves es **contrato de A** (`PR-003`), y debe declarar:
(a) la lista cerrada de claves de señal, (b) su forma canónica (¿minúsculas?), (c) la tabla
APK↔backend si los dos vocabularios se mantienen a propósito. B no lo inventa.

### K2 · 🔴 El catálogo de `motivo` no existe en ningún documento

`PR-003` §4 exige que el reporte lleve `"motivo": ["ideacion_activa", "…"]` y prohíbe el texto libre.
`PR-005` §9 dice que el catálogo de `RationaleKeys` lo define *"el clínico, en `PR-001`"* — pero
`PR-001` §4.3 da **criterios** en prosa (*"ideación suicida activa, plan, intento reciente…"*), **no
una lista de claves**.

**B no puede emitir el campo `motivo` de `TASK-015` sin ese catálogo.** No es un detalle: es el
campo que le dice al equipo *por qué* se disparó la alerta.

**Propuesta de B:** A publica el catálogo como parte de `PR-003` (es su contrato), derivado de
`PR-001` §4.3, y lo versiona junto a `rulesetVersion`. Si el clínico aún no lo ha cerrado, se declara
**provisional y versionado** en vez de dejarlo indefinido — así `TASK-015` puede construirse sin
inventar y el cambio de catálogo es un cambio de versión, no un rediseño.

### K3 · 🟠 `PR-013` sección 5 («Herramientas utilizadas») no tiene fuente en el Contrato A

`PR-013` §2 pone como fuente de la sección 5: *"paquete de alerta (`TASK-015`, de B)"*. Pero el
Contrato A (`PR-003` §4) tiene exactamente estos campos: `contratoVersion`, `caseToken`,
`origenNivel`, `rulesetVersion`, `motivo[]`, `respuestasChequeo[]`, `resumenAutorizado{scope,nota}`,
`consentimiento{…}`, `creadoEn`. **No hay ningún campo de herramientas.**

Las herramientas solo pueden llegar **dentro del `scope` autorizado** (`ShareScopeEntry.Tool(key)`),
y solo **si el joven las autorizó**. Es decir: la sección 5 estará **vacía** en la mayoría de los
casos, y eso es correcto — pero `PR-013` la presenta como si el dato siempre existiera.

**Propuesta de B:** `PR-013` §2 debe decir *"sección 5 = las entradas `Tool` del `scope`
autorizado"*, y su criterio 3 (*"lo no autorizado se muestra como «No autorizado para compartir»"*)
debe aplicar explícitamente aquí. Si C quiere herramientas fuera del scope, **es una ampliación del
contrato** y va contra `PR-003` §9.1.

### K4 · 🟠 `respuestasChequeo` viaja en el Contrato A y nadie lo consume

`PR-003` §4 lo define en el payload. `PR-005` §4 (`IngestedReport`) **no lo tiene**. `PR-006` §2
dice que extrae *"del `ResumenAutorizado`"*, no de las respuestas. `PR-013` no lo menciona.

O el campo sobra, o falta en los consumidores. **B lo va a enviar** (`TASK-015`) y no quiero enviar
un campo que nadie lee — es superficie de exposición sin contrapartida, y el chequeo contextual
(brief §9) es justamente la fuente estructurada más limpia que tiene el sistema.

**Propuesta de B:** que `PR-006` §2 lo consuma explícitamente como entrada (son claves de catálogo,
sin texto libre, y son la señal más fiable porque el joven las declaró). Si se decide no usarlo,
que se **quite del contrato** en vez de dejarlo viajando.

### K5 · 🟠 El Contrato B no tiene campo para «fuera de horario», y `PR-009` §6 lo necesita

`PR-009` §6 dice, correctamente: *"Fuera de horario el caso queda `EN_COLA` y el joven ve emergencia
+ números reales. La cola marca `fuera_de_horario` para que `PR-011`/`PR-012` no pinten un SLA
incumplido como si hubiera alguien."*

Pero el `YouthVisibleCaseStatus` de `PR-009` §4 (que es el Contrato B) tiene: `CaseToken`,
`ContratoVersion`, `Estado`, `Categoria`, `ActualizadoEn`, `Psicologo`, `CanalContacto`,
`MensajesNoLeidos`. **No hay `fuera_de_horario`.** Y `PR-011` §5 lo usa.

Consecuencia para `TASK-016` (B): **no puedo ser honesto con el tiempo** sin ese campo, y `PR-001`
§9 exige que la fila *"Fuera de horario: Igual + aviso de cobertura"* se muestre. `PR-001` P5
prohíbe prometer lo que no se cumple; sin el campo, la app no sabe si prometer o no.

**Propuesta de B:** añadir `fueraDeHorario: boolean` al Contrato B. Es un campo booleano que evita
que el APK tenga que **inferir el horario del equipo** (que sería una copia local de una regla de
negocio ajena, y se desincronizaría el primer día).

### K6 · 🟠 `rol` y `especialidad`: dos vocabularios y ningún copy

| Documento | Definición |
|---|---|
| `PR-003` §6.1 (Contrato C) | `rol` ∈ {`psicologo`, `trabajador_social`, `orientador`, `supervisor`} — minúsculas, español |
| `PR-020` criterio 3 | los mismos cuatro valores en minúsculas |
| **`PR-007` §4** | `ProfessionalRole` = `PSICOLOGIA \| TRABAJO_SOCIAL \| ORIENTACION \| SUPERVISION` — **mayúsculas y con otro significado** |
| `PR-007` §4 | `Specialty` = `TRAUMA \| GRIEF \| BULLYING \| FAMILY \| SUBSTANCE` |
| `PR-009` §4 | `PublicProfessional.Rol` es un `string` sin restricción |

Hay **dos problemas distintos**:

1. **Los valores no coinciden.** `PSICOLOGIA` (una disciplina) no es `psicologo` (un rol). C tiene
   dos vocabularios para el mismo campo.
2. **Nadie define el copy visible.** Y este es el que me toca a mí: `TASK-016` (B) **muestra
   `rol` y `especialidad` al adolescente desde `ACEPTADO`** (R5). Si el contrato entrega
   `BULLYING` y `TRABAJO_SOCIAL`, la app le mostraría **claves de enum en mayúsculas a un chico de
   15 años**. Eso no es un detalle de estilo: es incumplir la regla de la casa #2 y el brief.

**Propuesta de B:** A fija en `PR-003` §6.1 (a) la forma canónica de `rol`, (b) si `especialidad` es
clave cerrada o texto libre, y (c) **dónde vive el copy visible**. Si son claves, B necesita el
catálogo de etiquetas en `strings.xml` del APK; si es texto libre, hay que decidir quién lo escribe
y con qué revisión (no puede llegar texto generado a una superficie del joven — `PR-001` §6.2).

### K7 · 🟠 El directorio tiene dos dueños y mi `TASK-011` apuntaba al lado equivocado

`PR-016` §3 asigna el directorio de apoyo a **C**, en `puente-red/backend/core/directory-services`,
con `SupportService.IsFictional` incluido, y `PR-016` §2.B fija las mismas 5 categorías del brief §28.

Mi `TASK-011` §4 proponía **fixtures locales en la feature** para no tocar `:core:model`. Con lo que
dice `PR-016`, eso crearía **dos directorios con el mismo contenido y dos marcas de ficción
distintas** — exactamente el tipo de duplicación que `PLAN-PUENTE-RED.md` §2.4 prohíbe para el
consentimiento.

**Propuesta de B:** el directorio es **de C**, servido por el backend, y `TASK-011` lo **consume**
(lo que convierte `TASK-011` en dependiente de `TASK-013`). Corrijo mi spec en consecuencia
(ver §5). Lo que **sí** queda de B es la **pantalla** y la **marca de ficción visible**, que el
brief §28 exige en la superficie del joven.

---

## 3. Hallazgos de proceso

### K8 · 🟠 Las specs de C están desfasadas respecto a `REVISION-C.md`: revisarlas así reabre lo cerrado

`PR-009` §9 y `PR-020` §9 siguen preguntando *"¿`RESUELTO` y `CERRADO` son dos estados o uno?
⏳ aclarar con A"*. **A ya lo respondió** en `REVISION-C.md` §5.1: *"**Dos.** … Un caso puede cerrarse
sin resolverse (el joven revoca)."*

Igual con las SLAs: `PR-009` §9 marca *"✅ cerrado: `PR-001` firmado"*, pero `REVISION-C.md` §5.5
dice que **A no sabe si el clínico ajustó valores** al firmar.

Es decir: **la cola de C en `49fbe0a` es anterior a la revisión de A** (`66edb68`). C tiene razón en
§7 de su `REVISION-A.md` al decir que espera la revisión, pero conviene que quede escrito que
**C debe rebasar y aplicar F1–F4 antes** de que B revise en detalle, o los dos revisores
re-litigaremos preguntas ya cerradas.

**Propuesta de B:** que A marque en `MATRIZ-TRAZABILIDAD.md` §4 qué specs de C ya incorporan
`REVISION-C.md` y cuáles no. Hoy no se puede saber leyéndolas.

### K9 · 🟡 `PR-018` cita un campo del APK que no existe

`PR-018` §2 dice: *"Guarda **referencias y metadatos** (`metadataWithoutSensitiveContent` en el
APK)."* **Verificado: ese identificador no aparece en ningún `.kt` del repositorio.** No existe.

La idea es correcta y es la misma que apliqué en `TASK-017` (`AdverseEvent` no admite texto libre).
Solo hay que quitar la cita, o sustituirla por el nombre real cuando `TASK-017` lo publique.

### K10 · 🟡 C trata `PR-001` como fuente cerrada; A dice que no sabe si se ajustó

`PR-005` §9 marca P4 y P5 como *"✅ cerrado por la firma de `PR-001`"*; `PR-009` §2 usa los SLAs de
`PR-001` §7 como valores confirmados; `PR-007` §8 declara la tarea *"✅ desbloqueada"* por esa firma.

`REVISION-C.md` §5.5 es más prudente: *"la firma existe fuera del repo… **si el clínico ajustó algún
valor al firmar, hay que publicarlos**"*. C no ha hecho nada malo —usar `PR-001` como fuente de
verdad es lo que se le pidió— pero **el riesgo es asimétrico**: si los valores cambiaron, C construye
sobre números equivocados y B construye su `TASK-005` sobre los mismos. Conviene que A publique los
valores firmados antes de que ninguno de los dos empiece.

---

## 4. Respuestas a lo que C me pide

| Petición de C | Respuesta de B |
|---|---|
| `PR-020` §8: *"B confirma que `TASK-015`/`TASK-016` las producen y consumen"* | **Confirmado, con dos salvedades.** `TASK-015` produce el Contrato A **salvo `motivo`** (K2: falta el catálogo) y **salvo la forma canónica de las claves** (K1). `TASK-016` consume el Contrato B **salvo `fuera_de_horario`** (K5) y **salvo el copy de `rol`/`especialidad`** (K6). Con esas cuatro cosas resueltas, encajan sin cambios |
| `PR-020` criterio 8 (los 7 `SupportRequestState` con mapeo, sin huérfanos) | Es **F1 de `REVISION-C.md`**, asignado a A. **B lo consume, no lo define.** `TASK-016` §9 Q1 lo declara como bloqueante de su cierre |
| `PR-019` §8: la correlación `caseToken ↔ ProfileId` debe soportar multi-perfil | **Confirmado y agradecido.** `TASK-025` ya permite varios `ProfileId` por instalación; que la correlación lo soporte es coherente. Añado la nota a `TASK-016` |
| `PR-020` §3: ¿las fixtures viven en A o en C? | **En A.** Son fixtures del contrato, y el contrato es `PR-003` (A). Ya lo ratificó `REVISION-C.md` §5.3. B solo las consumirá desde `TASK-018` |
| `PR-016` §2: el canal de contacto queda *"candidato a ola posterior a esta"* | **Confirmado.** Es la evidencia que faltaba para mi `REVISION-B.md` H4: `TASK-024` **no** entra en el MVP |

---

## 5. Correcciones a mis propias specs (por esta revisión)

Revisar a C me obligó a corregir tres de mis specs. Las he actualizado:

| Spec | Qué corregí | Motivo |
|---|---|---|
| `TASK-011` | El directorio **no** es fixture local: se **consume** del backend (`PR-016`), y `TASK-011` pasa a depender de `TASK-013` | K7 |
| `TASK-015` | `motivo` queda marcado como **bloqueado por el catálogo** (K2) y las claves de señal como **bloqueadas por la forma canónica** (K1) | K1, K2 |
| `TASK-016` | Se declara la necesidad de `fueraDeHorario` (K5) y el **catálogo de copy** de `rol`/`especialidad` (K6) | K5, K6 |

---

## 6. Lo que ratifico sin cambios

- **`PR-000` rev. 2** y el reparto del árbol `puente-red/backend/` (ya ratificado por A en
  `REVISION-C.md` §5.3). B no toca nada de ese árbol.
- **`PR-005`, `PR-006`, `PR-008`, `PR-010`, `PR-011`, `PR-012`, `PR-014`, `PR-015`, `PR-017`,
  `PR-018`, `TASK-019`, `TASK-020`**: sin objeciones de mi parte. No tengo información desde el APK
  que las contradiga, y en varios casos (`PR-017`, `TASK-020`) me alegra que hayan resuelto el modo
  demo con honestidad.
- **`PR-019`** y **`PR-020`**: ratificadas con las salvedades de K3–K6, que son de contrato, no de
  diseño.

---

## 7. Siguiente paso

1. **A** decide K1, K2, K5 y K6 (son de `PR-003`, su contrato) y añade la tabla de correspondencia de
   claves de señal.
2. **C** rebasa sobre `main` y aplica `REVISION-C.md` F1–F4 + los hallazgos K3, K4, K9.
3. **B** actualiza `TASK-011`, `TASK-015`, `TASK-016` (hecho) y espera a que A publique `PR-003`
   revisado para cerrar `TASK-015`.
4. Ninguno de los tres construye hasta que las specs estén aprobadas (§3 del plan).

---

## 8. Nota final

De los 10 hallazgos, **7 (K1–K7) no los podría haber encontrado ni A ni C**: son cosas que solo se
ven mirando el APK desde dentro —qué claves emite de verdad, qué campos necesita la pantalla, qué
vocabulario hay en las fixtures. Eso confirma que la revisión cruzada del plan §3 no es burocracia:
es la única forma de detectar esta clase de fallo antes de que se convierta en un bug de integración.
