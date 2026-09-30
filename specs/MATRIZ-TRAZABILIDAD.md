# Matriz de trazabilidad — Puente Joven

**Tarea:** `TASK-000` (parte de trazabilidad) · **Autor:** Agente A · **Fecha:** 2026-09-30
**Propósito:** una sola tabla que dice **qué tarea existe, de quién es, en qué módulo vive y si
tiene spec**. Es el índice del proyecto; si algo no está aquí, no existe.

**Convención de nombres:** identificadores de código en inglés, copy en español (P11).
**Estados de spec:** `—` sin empezar · `⏳` borrador · `🔍` en revisión · `✅` aprobada.

---

## 1. Hecho (base)

| ID | Qué | Módulo | Estado |
|---|---|---|---|
| `TASK-001` | Fundación (módulos, nav tipada, Hilt, contratos) | `:app` | ✅ código |
| `TASK-002` | Sistema visual Compose | `:core:designsystem` | ✅ código |
| `TASK-003` | Sesión privada, cifrado, retención, perfil | `:core:security` + `:core:data` | ⚠️ código **sin persistencia** → ver `TASK-003b` |

---

## 2. Agente A — Núcleo y contratos (13)

| ID | Tarea | Producto | Módulo | Spec |
|---|---|---|---|---|
| `TASK-000` | Plantilla SDD + matriz de trazabilidad | juvenil | `specs/` | ✅ `_PLANTILLA-SPEC.md` |
| `TASK-00A` | Contrato de integración | juvenil | `CONTRATO-DE-INTEGRACION.md` | ✅ |
| `TASK-021` | Modelo de amenaza de privacidad | juvenil | `specs/TASK-021-...md` | ⏳ |
| `TASK-003b` | Persistencia local (DataStore) | juvenil | `:core:data` | ✅ código · `specs/TASK-003b-...md` |
| `TASK-025` | Multi-perfil en dispositivo compartido | juvenil | `:core:data` | ✅ código (datos) · UI en `TASK-009` |
| `PR-001` | Protocolo de crisis | Red | `PR-001-PROTOCOLO-DE-CRISIS.md` | ✅ (autorizado) |
| `PR-002` | Modelo de identidad y anonimato | Red | `PLAN-PUENTE-RED.md` §2.5 | ✅ (plegado en `PR-003`/`PR-004`) |
| `PR-003` | Contrato de datos Joven ↔ Red | Red | `PR-003-CONTRATO-DATOS-JOVEN-RED.md` | ✅ |
| `PR-004` | Ingesta y emisión de `caseToken` | Red | `PR-004-INGESTA-Y-CASETOKEN.md` | ✅ |
| `TASK-023` | Auditoría de consultas | juvenil | doc | ⏳ |
| `TASK-013` | Backend y contratos remotos | juvenil | `:core:network` | ⏳ |
| `TASK-014` | CI y calidad | juvenil | CI | ⏳ |
| `TASK-012` | Integración narrativa end-to-end | juvenil | transversal | ⏳ |

## 3. Agente B — APK juvenil (14)

**Actualizado por B el 2026-09-30:** las 14 specs están redactadas con la plantilla de `TASK-000`.
13 pasan a **🔍 en revisión**; `TASK-024` queda en **🔒 borrador con puerta** (ver `REVISION-B.md` H4).

| ID | Tarea | Módulo | Spec |
|---|---|---|---|
| `TASK-004` | Conversación + chequeo contextual | `feature:conversation` | ✅ aprobada · 🔨 código entregado (`deliverables/TASK-004/NECESIDADES.md`) |
| `TASK-005` | Señales + mapa + nivel de atención | `feature:signals` | ✅ aprobada · 🔨 código entregado (`deliverables/TASK-005/NECESIDADES.md`) |
| `TASK-006a` | Herramientas: sueño · respiración · plan de apoyo | `feature:tools` | 🔍 `specs/TASK-006a-herramientas-breves.md` |
| `TASK-006b` | Reporte personal + recorrido | `feature:report` | 🔍 `specs/TASK-006b-reporte-recorrido.md` |
| `TASK-007` | Consentimiento + resumen + solicitud de apoyo | `feature:sharing` | 🔍 `specs/TASK-007-consentimiento-solicitud.md` |
| `TASK-008` | Ruta B «Quiero ayudar a alguien» | `feature:help` | 🔍 `specs/TASK-008-ruta-b-quiero-ayudar.md` |
| `TASK-009` | Perfil y privacidad (cierra la UI de `TASK-025`) | `feature:profile` | 🔍 `specs/TASK-009-perfil-privacidad.md` |
| `TASK-010` | Próximos pasos | `feature:nextsteps` | 🔍 `specs/TASK-010-proximos-pasos.md` |
| `TASK-011` | Derivación y directorio | `feature:referral` | 🔍 `specs/TASK-011-derivacion-directorio.md` |
| `TASK-015` | Paquete de alerta roja | `feature:signals` | 🔍 `specs/TASK-015-paquete-alerta-roja.md` |
| `TASK-016` | Estado del caso rojo | `feature:sharing` | 🔍 `specs/TASK-016-estado-caso-rojo.md` |
| `TASK-017` | Registro de eventos adversos | `:core:audit` | 🔍 `specs/TASK-017-eventos-adversos.md` |
| `TASK-018` | Suite de prueba de seguridad | transversal | 🔍 `specs/TASK-018-suite-seguridad.md` |
| `TASK-024` | Canal de audio | por decidir | 🔒 `specs/TASK-024-canal-audio.md` |

> **Nota de B:** `TASK-017` propone módulo propio `:core:audit` porque es transversal y la regla
> *"una tarea = un módulo = un dueño"* no la cubre (`REVISION-B.md` H10). `TASK-024` **no se
> construye** sin decisión del dueño: `PR-003` §6.2 la sitúa fuera del camino crítico del MVP.
>
> **Necesidades declaradas:** `puente-joven-android/deliverables/FASE-0-B/NECESIDADES.md`.
> **Revisión de B sobre el plan y la Fase 0 de A:** `REVISION-B.md` (10 hallazgos, 3 rojos).
> **Revisión de B sobre la Fase 0 de C:** `REVISION-C-POR-B.md` (10 hallazgos, **7 de frontera
> Joven↔Red**). Las specs `TASK-011`, `TASK-015` y `TASK-016` quedan **corregidas** por esa revisión
> (addenda §11 en cada una).

### 3.1 Pendiente de decisión de A (contrato `PR-003`)

| # | Qué | Hallazgo | Bloquea |
|---|---|---|---|
| D6 | Catálogo de `motivo` (no existe en ningún documento) | K2 | `TASK-015` |
| D7 | Forma canónica de las claves de señal (APK `"isolation"` vs backend `ISOLATION`) | K1 | `TASK-015`, `TASK-013` |
| D8 | `fueraDeHorario` en el Contrato B | K5 | `TASK-016` |
| D9 | Copy visible de `rol`/`especialidad` (hoy llegarían claves de enum al adolescente) | K6 | `TASK-016` |

### 3.2 Pendiente de C (tras rebasar sobre `main`)

| # | Qué | Hallazgo |
|---|---|---|
| — | `PR-013` §2: la sección 5 (herramientas) se construye del `scope` autorizado, no del paquete | K3 |
| — | `PR-006`: consumir `respuestasChequeo` o quitarlo del Contrato A | K4 |
| — | `PR-018` §2: `metadataWithoutSensitiveContent` **no existe** en el APK | K9 |
| — | Rebasar y aplicar `REVISION-C.md` F1–F4 (las specs en `49fbe0a` son previas) | K8 |

## 4. Agente C — Portal Puente Red (18)

**Actualizado por C el 2026-09-30:** las 18 specs están **✅ Aprobadas** por A (`REVISION-C.md`,
veredicto "Aprobada con hallazgos"). Se incorporaron sus respuestas de §5 (`RESUELTO`/`CERRADO`,
caducidad de sesión del portal, hallazgos F1 y F2).

| ID | Tarea | Spec |
|---|---|---|
| `PR-005` | Clasificador LLM (medio/alto, versionado) | ✅ `specs/PR-005-clasificador-llm.md` |
| `PR-006` | Extracción de características | ✅ `specs/PR-006-extraccion-caracteristicas.md` |
| `PR-007` | Directorio de profesionales (dos tipos de respondedor) | ✅ `specs/PR-007-directorio-profesionales.md` |
| `PR-008` | Motor de derivación escalonado por gravedad | ✅ `specs/PR-008-motor-derivacion.md` |
| `PR-009` | Cola de asignación, SLA y trazabilidad | ✅ `specs/PR-009-cola-sla-trazabilidad.md` |
| `PR-010` | Autenticación profesional y roles (Supabase Auth) | ✅ `specs/PR-010-auth-profesional-roles.md` |
| `PR-011` | Home profesional | ✅ `specs/PR-011-home-profesional.md` |
| `PR-012` | Centro de alertas | ✅ `specs/PR-012-centro-alertas.md` |
| `PR-013` | Ficha de caso (7 secciones) | ✅ `specs/PR-013-ficha-caso.md` |
| `PR-014` | Separación «organizado por Puente» / «valoración profesional» | ✅ `specs/PR-014-organizado-vs-valoracion.md` |
| `PR-015` | Timeline y seguimiento | ✅ `specs/PR-015-timeline-seguimiento.md` |
| `PR-016` | Derivaciones | ✅ `specs/PR-016-derivaciones.md` |
| `PR-017` | Observatorio y reportes agregados | ✅ `specs/PR-017-observatorio-reportes.md` |
| `PR-018` | Auditoría y cumplimiento | ✅ `specs/PR-018-auditoria-cumplimiento.md` |
| `PR-019` | Consentimiento y revocación cross-producto | ✅ `specs/PR-019-consentimiento-revocacion.md` |
| `PR-020` | Pruebas de contrato entre productos | ✅ `specs/PR-020-pruebas-contrato.md` |
| `TASK-019` | Apoyo humano breve telefónico | ✅ `specs/TASK-019-apoyo-humano-telefonico.md` |
| `TASK-020` | Marco de evaluación de 7 dimensiones | ✅ `specs/TASK-020-marco-evaluacion.md` |

> **Nota de C:** `PR-000` (arquitectura de Puente Red) no es una tarea de la matriz; vive en
> `puente-red/deliverables/PR-000-ARQUITECTURA-PUENTE-RED.md`. **Ratificado por A** en
> `REVISION-C.md` §4 (stack Go/Supabase/GenAI, frontera por superficie de API, `P10` desktop-first),
> junto con el **reparto del árbol `puente-red/backend/`**, ya incorporado a
> `CONTRATO-DE-INTEGRACION.md` §1.1.

## 5. Fuera de agentes (personas)

| ID | Tarea | Quién |
|---|---|---|
| `TASK-022` | Co-diseño con adolescentes | La ONG con el comité de adolescentes |

**Total: 46 tareas** (26 juveniles + 20 Puente Red), según `PLAN-3-AGENTES.md` §7.

---

## 6. Decisiones cerradas (consolidado)

Todas las decisiones de producto y arquitectura, con su fuente. **No reabrir sin pasar por A.**

| # | Decisión | Fuente |
|---|---|---|
| P1 | Las specs **no existían**: se redactan desde cero | `PLAN-TRABAJO-SDD` §7 |
| P2 | Persistencia con **DataStore** en el MVP (`TASK-003b`) | idem |
| P3 | Barra inferior de **5 pestañas** (`Inicio · Hablar · Recorrido · Herramientas · Perfil`) | §10.4 |
| P4 | La **Ruta B «Quiero ayudar»** entra (`feature:help`) | §7 |
| P5 | Protocolo de nivel rojo → `PR-001` | §7 |
| D1 | **Dos capas de clasificación**: 3 niveles en el APK (reglas); 2 categorías en el backend (LLM) | §10 |
| D2 | El LLM **solo sube**; nunca degrada un rojo | §10 |
| D3 | Se usa IA generativa con **cláusula de no-reentrenamiento** | §10 |
| D4 | El MVP incluye **panel de supervisores y directorio** | §10 |
| D5 | Respuesta **escalonada por gravedad** | §10 |
| — | Identidad: `ProfileId` opaco + alias/PIN local + `caseToken`; **la MAC no se usa** | `PLAN-PUENTE-RED` §2.5 |
| — | **Multi-perfil** (`TASK-025`): un solo perfil por instalación era un fallo de privacidad | `PLAN-TRABAJO-SDD` §10.5 |
| Q1 | El joven **sigue seudónimo**; canal solo si el psicólogo lo inicia | `PR-003` §0.2 |
| Q6–Q9 | Demo ≤5 usuarios; sin datos reales ni sintéticos; sin guardia 24/7; Supabase Auth | `PR-003` §0.3 |
| — | **Backend compartido** con dos superficies de API; transacción + correlación en BD | `PR-003` §1, §3 |
| — | `deviceKey` = **Keystore**; ingesta `ROJO`+`AMARILLO`; `caseToken` **ULID**; `sessionToken` sin caducidad | `PR-004` §8 |

---

## 7. Cómo se usa esta matriz

- Cada agente, al escribir una spec, **actualiza su fila** (estado de spec).
- `A` mantiene la coherencia: si dos filas se contradicen, gana esta matriz.
- Cuando una spec se aprueba, se marca `✅` y se enlaza.
