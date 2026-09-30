# REVISION-A · Revisión del Agente A y reconciliación de la cola de C

**Fecha:** 2026-09-30 · **Revisado por:** Agente C
**Origen:** commits de `rabm-dev <rabeizaga@umsa.bo>` publicados **directamente en `main`**
**Resultado:** 6 specs reescritas, 12 con nota de reconciliación, 1 documento nuevo (`PR-000` rev. 2)

---

## 1. Qué publicó A

No creó ramas: publicó **dos commits en `main`** (flujo que `PLAN-3-AGENTES.md` §5 autoriza:
*"A publica en `main`"*).

| Commit | Contenido |
|---|---|
| `942d581` | `PR-003` contrato Joven↔Red (380 líneas), `PR-INFRA-RECOMENDACION` (143), y corrección de guardrails en `PLAN-3-AGENTES.md`, `PLAN-PUENTE-RED.md` y `PLAN-TRABAJO-SDD.md` |
| `5e853ad` | `PR-004` ingesta del reporte y emisión de `caseToken` (157) |

**Rama `agente/C-red`:** rebasada sobre `main` sin conflictos (C solo añade bajo `puente-red/`).

---

## 2. Lo que A **resolvió** de lo que C necesitaba

| Necesidad declarada por C | Estado |
|---|---|
| Contrato de datos Joven ↔ Red versionado (`PR-003`) | ✅ publicado |
| Ingesta del reporte y emisión de `caseToken` (`PR-004`) | ✅ publicado |
| Modelo de identidad y anonimato (`PR-002`) | ✅ **resuelto dentro de `PR-003` §7** — no habrá documento aparte |
| ¿Guardia 24/7? (P8/P9) | ✅ **resuelto: NO existe** (`PR-003` §15, Q8) |
| ¿Proveedor del LLM y no-reentrenamiento? (Q12) | ⚠️ **parcial**: Google GenAI; la capa gratuita **no sirve** para datos reales (`PR-INFRA` §4) |
| Auth de profesionales (Q9) | ✅ **Supabase Auth** |
| ¿Cuántos profesionales reales? (P7) | ✅ **acotado**: demo ≤5 usuarios (Q6) |

---

## 3. ⚠️ Los dos guardrails que A **cambió** (esto invalidaba mis specs)

`PR-003` §10 lo marca con un aviso explícito. Son cambios deliberados del dueño del producto:

### 3.1 El APK juvenil **deja de ser "sin red"**

| Antes | Ahora |
|---|---|
| Guardrail #6: *"el APK no tiene permisos de red"*; `ModuleGraphGuardTest` **falla a propósito** si aparece `:core:network` | El APK **habla con la API Joven** (`/joven`). `:core:network` se permite **solo** en el flavor `remote`. `ModuleGraphGuardTest` se **reescribe** para vigilar que hable **solo** con la API Joven y **nunca** con contratos profesionales |

**Impacto en C:** mi `PR-000` rev. 1 afirmaba una frontera "sin red". **Corregido** en rev. 2: la
frontera ahora se garantiza por **superficie de API** (`/joven` vs `/profesional`) y por contrato,
no por ausencia de red.

### 3.2 El joven **sí ve datos del profesional** (desde `ACEPTADO`)

| Antes | Ahora |
|---|---|
| *"El joven nunca ve la identidad del profesional"* | La ve **desde `ACEPTADO`**: `nombreVisible`, `rol`, `especialidad` (R5). Y **canal de contacto solo si el psicólogo decide comunicarse** (R1) |

**La conciliación R1+R5 es sutil y hay que respetarla literalmente:**
> **identidad sí al aceptar; canal solo a iniciativa del psicólogo.**

**Impacto en C:** `PR-009` (proyección al joven), `PR-019` (consentimiento e identidad) y `PR-020`
(contratos) quedaban **incorrectos**. Los tres fueron **reescritos**.

---

## 4. Cambios de arquitectura que invalidaron mis supuestos

| # | Mi revisión 1 decía | Ahora (de A) | Fuente |
|---|---|---|---|
| 1 | Backend **Kotlin + Ktor** | **Go** (o Node/Bun + Hono). **"Un framework JVM no cabe"** en 256 MB | `PR-INFRA` §3 |
| 2 | Servicios separados por producto | **Una API, dos superficies** (`/joven`, `/profesional`) | `PR-003` §1 |
| 3 | Postgres propio | **Supabase** (Postgres + **RLS** + Realtime), `sa-east-1` | `PR-003` §13, `PR-INFRA` §5 |
| 4 | Auth propia con matriz de roles | **Supabase Auth** + RLS; no reinventar | `PR-003` Q9 |
| 5 | Estados del caso definidos por C (inglés) | **Definidos por A** (`RECIBIDO`…`CERRADO`, español) | `PR-003` §3.1 |
| 6 | `caseToken` sin formato | **ULID**; `contratoVersion` viaja siempre | `PR-004` §3, `PR-003` §8 |

> Sobre el punto 1: mi argumento para Kotlin era "compartir vocabulario de dominio con el APK".
> `PR-003` lo resuelve mejor — el vocabulario compartido es el **contrato versionado**, no el
> lenguaje. La corrección de A es la correcta y la acepto sin objeción.

---

## 5. Reconciliación spec por spec

### Reescritas (cambio estructural)

| Spec | Qué cambió |
|---|---|
| **`PR-000`** | Stack (Go, Supabase, GenAI), frontera por API en vez de por red, árbol de backend **compartido A+C** (nuevo punto de coordinación), guardrails actualizados, registro de cambios |
| **`PR-005`** | Proveedor **Google GenAI**; ⚠️ **capa de pago obligatoria** antes de datos reales (`PR-INFRA` §4); clasificador **desactivable** por configuración; transición a `CLASIFICADO`; `contratoVersion` |
| **`PR-009`** | Máquina de estados de `PR-003` §3.1; `YouthVisibleCaseStatus` ahora con `psicologo` (desde `ACEPTADO`) y `canalContacto` (desde `CONTACTO_HABILITADO`); **sin guardia 24/7**; ULID |
| **`PR-010`** | **Supabase Auth** en vez de auth propia; autorización en **RLS + guardia de ruta**; superficies separadas |
| **`PR-019`** | Modelo de identidad R1/R5 completo; **6 casos límite** nuevos; invariantes de `PR-003` §9; R4 (pérdida de cuenta); R2 (canal baja prioridad) |
| **`PR-020`** | Pruebas sobre los **Contratos A/B/C reales**; invariante de **independencia** `psicologo` vs `canalContacto`; superficies `/joven` y `/profesional`; versionado |

### Con nota de reconciliación

| Spec | Cambio |
|---|---|
| `PR-006` | Sin cambios estructurales; el `motivo` del Contrato A ya viene como claves de catálogo |
| `PR-007` | Supabase Auth; expone los **campos públicos** del Contrato C; sin datos sintéticos (Q7) |
| `PR-008` | Sin cambios de diseño; `EN_COLA → ASIGNADO` propuesto, `ACEPTADO` humano |
| `PR-011` | Estados de `PR-003`; `fuera_de_horario`; estado vacío como caso normal (demo sin datos) |
| `PR-012` | `origenNivel` (Rojo/Amarillo) vs categoría (`MEDIO`/`ALTO`); estados nuevos |
| `PR-013` | Sección 6 desde Contrato A; sección 7 con estados nuevos; `caseToken` ULID |
| `PR-014` | Sin cambios; precisión sobre el Contrato C en dirección contraria |
| `PR-015` | `EventType` reescrito a los estados de `PR-003` §3.1; `audit_event` |
| `PR-016` | El canal in-app **no** es este módulo (R2, ola posterior); consentimiento para derivar sigue abierto |
| `PR-017` | ⚠️ **Modo demo sin datos**: la demo no tiene nada que agregar (Q7) |
| `PR-018` | Tabla `audit_event` de `PR-004` §4.3; RLS; login de profesional |
| `TASK-019` | **Sin guardia 24/7**: solo en horario; baja prioridad (R2); al final de la cola |
| `TASK-020` | Marco listo pero **no medible** a escala demo (Q6/Q7) |

---

## 6. Lo que sigue bloqueado para C

| Bloqueo | Qué falta | Quién |
|---|---|---|
| `PR-005`, `PR-006`, `PR-007`, `PR-009` | **Firma clínica de `PR-001`** §5–7 (qué es medio/alto, quién responde, tiempos) | psicólogo |
| `PR-005` | **Capa de pago de Gemini** antes de cualquier caso real | ONG / presupuesto |
| `PR-018` | **Responsable legal** del tratamiento de datos de menores (P11) | legal |
| `PR-019` | **P12**: ¿la revocación borra lo ya leído? Y: ¿detiene una derivación en curso? | legal |
| Todas | **Plantilla de spec definitiva** (`TASK-000`) y **contrato de integración** (`TASK-00A`) | A |
| `PR-020` | Ubicación de las **fixtures** del contrato | A |
| Backend | **Reparto del árbol `puente-red/backend/`** (nuevo, ver `PR-000` §1.1) | A |

---

## 7. Conclusión

A entregó **más que insumos: entregó una revisión de arquitectura** que corrige tres supuestos
míos (stack, frontera, identidad). El contrato es sólido y está cerrado (§14 de `PR-003`: *"no
quedan decisiones abiertas"*), pero **C no puede construir todavía**:

- Sigue vigente la regla SDD (§3): **nadie construye hasta que su spec esté aprobada por otro
  agente**. `PR-000` rev. 2 y las 18 specs esperan la revisión de A y B.
- Persisten bloqueos **clínicos** (`PR-001`) y **legales** (P11, P12, Gemini de pago) que no son
  de un agente.

**Siguiente paso de C:** esperar la revisión de A sobre las 18 specs y sobre `PR-000` rev. 2, y
la ratificación del reparto del backend.
