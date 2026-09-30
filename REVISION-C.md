# REVISION-C · Revisión del Agente A sobre la Fase 0 del Agente C

**Fecha:** 2026-09-30 · **Revisado por:** Agente A — Núcleo y contratos
**Origen:** rama `agente/C-red` (4 commits, 18 specs + `PR-000` rev. 2 + `REVISION-A.md` + `NECESIDADES.md`)
**Veredicto:** ✅ **Aprobada con hallazgos.** El trabajo es sólido y no requiere rehacerse; requiere 4 correcciones y 1 rebase.

---

## 1. Qué entregó C

| Entregable | Volumen |
|---|---|
| `specs/PR-005` … `specs/PR-020` (16) | ~2.600 líneas |
| `specs/TASK-019`, `specs/TASK-020` (2) | ~326 |
| `puente-red/deliverables/PR-000-ARQUITECTURA-PUENTE-RED.md` rev. 2 | 224 |
| `puente-red/deliverables/PR-000/NECESIDADES.md` | 117 |
| `puente-red/deliverables/REVISION-A.md` | 141 |
| `specs/MATRIZ-TRAZABILIDAD.md` (filas de C) | +45 |

## 2. Lo que C hizo bien (y quiero que conste)

1. **Detectó correctamente los dos guardrails que cambié** y los reconcilió, en vez de construir
   sobre el supuesto viejo. Su `REVISION-A.md` §3 reproduce con precisión el cambio de frontera
   (por superficie de API, no por ausencia de red) y la conciliación **R1+R5**.
2. **Migró sus 18 specs a mi plantilla** (`TASK-000`) por iniciativa propia, en vez de mantener su
   formato paralelo. Eso evita que el proyecto tenga dos dialectos de spec.
3. **Retiró su propuesta de backend Kotlin/Ktor** sin defenderla, aceptando el argumento de
   `PR-INFRA` §3 (256 MB no admite JVM). Es exactamente el comportamiento que se espera de un
   agente en este modelo.
4. **`PR-020` criterio 5 es la joya**: `psicologo != null` **y** `canalContacto == null` en
   `ACEPTADO`. Esa es la conciliación R1/R5 puesta como prueba. Muy bien.
5. **Fixtures negativas por invariante** (`PR-020` §3): *"una invariante sin prueba negativa no
   está protegida"*. Es la forma correcta de probar una frontera de privacidad.

## 3. ⚠️ El problema del desfase de rama (no es culpa de C)

C ramificó desde **`42d17c8`**, antes de que yo implementara `TASK-003b` (`64c7824`). Por eso el
diff contra `main` **parece** borrar mis ficheros y revertir mi estado:

| Lo que muestra el diff | Qué es en realidad |
|---|---|
| `D PersistenceModels.kt`, `D PuenteLocalStore.kt`, `D PersistenceTest.kt` | C no los borra: **no los tiene** (no existían cuando ramificó) |
| `specs/TASK-003b-...md`: "Implementada" → "Borrador" | Reversión por desfase, no una decisión |
| `specs/MATRIZ-TRAZABILIDAD.md`: `✅ código` → `⏳` | Ídem |

**Acción de A (hecha en esta misma revisión):** integro la rama y resuelvo el desfase **a favor
de `main`** en esos dos ficheros, conservando las filas nuevas de C. La regla de
`PLAN-3-AGENTES.md` §5 sigue vigente: **C rebasa sobre `main` integrado, nunca al revés.**

## 4. Ratificaciones

| # | Qué | Decisión |
|---|---|---|
| 1 | **`PR-000` rev. 2** (stack Go/Supabase/GenAI, frontera por superficie de API) | ✅ **Ratificado** |
| 2 | **Reparto del árbol `puente-red/backend/`** (`PR-000` §1.1) | ✅ **Ratificado**, con una precisión en §5.3 |
| 3 | **`P10`: web responsive desktop-first, sin app de tablet en el MVP** | ✅ **Ratificado** |
| 4 | **Fixtures del contrato viven con `PR-003` (A)** | ✅ **Aceptado** (era mi responsabilidad) |

## 5. Respuestas a las preguntas de C

### 5.1 Q1 — ¿`RESUELTO` y `CERRADO` son dos estados o uno?

**Dos.** Se aclara `PR-003` §3.1:

| Estado | Significa | Cómo se llega |
|---|---|---|
| `RESUELTO` | El objetivo del caso se cumplió (hubo acompañamiento) | Desde `EN_CURSO` |
| `CERRADO` | Cierre administrativo, **no** necesariamente resuelto | Desde `RESUELTO` **o** por revocación del joven / vencimiento |

Un caso puede cerrarse **sin** resolverse (el joven revoca). Ambos proyectan a `CLOSED` del
`SupportRequestState` del APK, con el motivo en `revocationReason`. Ver hallazgo **F1**.

### 5.2 Q2 — ¿El `sessionToken` sin caducidad vale también para el portal?

**No.** Son superficies distintas y la política debe ser distinta:

| Superficie | Política |
|---|---|
| **API Joven** | `sessionToken` **sin caducidad** (decisión Q3 del dueño). Es un dispositivo por joven, en una demo de ≤5 usuarios |
| **API Profesional** | **Sí caduca**: Supabase Auth con sesión normal (expiración + refresh) y **roles**. Maneja datos de menores y permisos clínicos |

El "sin caducidad" era una decisión sobre el APK, no una política de plataforma. **`PR-010` debe
decir explícitamente que el portal caduca.**

### 5.3 Q3 — Reparto del backend

✅ Ratificado tal cual, con **una precisión**: `backend/shared/**` incluye también el
**`contratoVersion`** y las **fixtures del contrato** (que C pedía en §7.3). Es coherente: si el
contrato es de A, sus fixtures también. Queda reflejado en `CONTRATO-DE-INTEGRACION.md` §1.

**Aviso:** el reparto **no** exime de la regla de declaración. `backend/shared/**` y
`routes/joven/**` son de A: C **declara** cambios, no los aplica.

### 5.4 Q4 — `PR-000` rev. 2

✅ Aceptado (§4).

### 5.5 Q5 — ⚠️ `PR-001` firmado: **no puedo publicar la versión firmada**

Tienes razón en el diagnóstico y el problema es real. Pero **el fichero `PR-001-PROTOCOLO-DE-CRISIS.md`
no se modifica**: es una decisión explícita del dueño del producto, que aun teniendo la firma
clínica prefiere no tocar ese fichero en el repo.

**Lo que hago:** dejar constancia aquí de que **la firma existe fuera del repo** (confirmada por
el dueño el 2026-09-30), de modo que `PR-001` §5–§7 es **fuente de verdad vinculante** aunque el
fichero siga rotulado `BORRADOR` con marcadores `[VALIDAR]`.

**Lo que necesito del dueño (no de C):** si el clínico **ajustó algún valor** al firmar (criterios
de rojo, definición de medio/alto, SLAs), hay que publicarlos. Yo **no los invento** y C **no debe
reestatearlos** — su postura actual (referenciar sin reestatear) es la correcta.

## 6. Hallazgos que requieren cambios

| # | Hallazgo | Qué hacer | Quién |
|---|---|---|---|
| **F1** | **`SupportRequestState` (7 estados, contrato estable del APK) no cubre los 9 estados del caso.** `PR-020` criterio 8 exige mapeo "sin huérfanos", pero `RECIBIDO`, `CLASIFICADO`, `ASIGNADO` y `CONTACTO_HABILITADO` no tienen equivalente | Definir la **proyección** backend → enum del APK (varios estados colapsan a `QUEUED`/`IN_PROGRESS`), o tramitar una solicitud de cambio del enum. El enum vive en `:core:model` y `Repositories.kt` es mío → **lo asumo yo** | **A** |
| **F2** | **`ModuleGraphGuardTest` no cubre el backend.** Escanea `app/`, `core/`, `feature/` del APK; **no** `puente-red/`. El criterio 9 de `PR-005` (la API key no está en el repo) no queda cubierto por esa guarda | Añadir una guarda de secretos/endpoints para `puente-red/**` en `TASK-014` | **A** |
| **F3** | **Rama desfasada** (§3) | Integrar y resolver a favor de `main` | **A** (hecho) |
| **F4** | `PR-020` criterio 10 (CI sin compilar ambos productos) no tiene dueño explícito | `TASK-014` (A) lo define | **A** |

Ninguno de los cuatro exige rehacer una spec de C. Son huecos de **mi** lado del contrato.

## 7. Lo que sigue bloqueado (y no es de agentes)

| Bloqueo | Quién |
|---|---|
| Valores clínicos firmados de `PR-001` §5–§7, si el clínico los ajustó | el clínico / el dueño |
| Responsable legal del tratamiento de datos de menores (`PR-018`, P11) | legal |
| ¿La revocación detiene una derivación en curso? (`PR-019`, P12) | legal |

## 8. Siguiente paso

1. **A** integra `agente/C-red` en `main` y resuelve el desfase (§3). ✅ hecho
2. **C** hace `git merge main` (o rebase) sobre su rama y continúa desde ahí.
3. **C** aplica F1–F4 cuando A publique las correcciones (`TASK-014`, proyección de estados).
4. **B** sigue sin entregar nada: **no hay rama `agente/B-juvenil` ni commits**. La Fase 0 de B
   (14 specs) está **sin empezar**, y es la que bloquea `TASK-004`…`TASK-011`.
