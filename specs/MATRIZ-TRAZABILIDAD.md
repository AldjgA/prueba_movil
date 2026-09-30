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
| `TASK-025` | Multi-perfil en dispositivo compartido | juvenil | `:core:data` | ⏳ `specs/TASK-025-...md` |
| `PR-001` | Protocolo de crisis | Red | `PR-001-PROTOCOLO-DE-CRISIS.md` | ✅ (autorizado) |
| `PR-002` | Modelo de identidad y anonimato | Red | `PLAN-PUENTE-RED.md` §2.5 | ✅ (plegado en `PR-003`/`PR-004`) |
| `PR-003` | Contrato de datos Joven ↔ Red | Red | `PR-003-CONTRATO-DATOS-JOVEN-RED.md` | ✅ |
| `PR-004` | Ingesta y emisión de `caseToken` | Red | `PR-004-INGESTA-Y-CASETOKEN.md` | ✅ |
| `TASK-023` | Auditoría de consultas | juvenil | doc | ⏳ |
| `TASK-013` | Backend y contratos remotos | juvenil | `:core:network` | ⏳ |
| `TASK-014` | CI y calidad | juvenil | CI | ⏳ |
| `TASK-012` | Integración narrativa end-to-end | juvenil | transversal | ⏳ |

## 3. Agente B — APK juvenil (14)

| ID | Tarea | Módulo | Spec |
|---|---|---|---|
| `TASK-004` | Conversación + chequeo contextual | `feature:conversation` | ⏳ |
| `TASK-005` | Señales + mapa + nivel de atención | `feature:signals` | ⏳ |
| `TASK-006a` | Herramientas: sueño · respiración · plan de apoyo | `feature:tools` | ⏳ |
| `TASK-006b` | Reporte personal + recorrido | `feature:report` | ⏳ |
| `TASK-007` | Consentimiento + resumen + solicitud de apoyo | `feature:sharing` | ⏳ |
| `TASK-008` | Ruta B «Quiero ayudar a alguien» | `feature:help` | ⏳ |
| `TASK-009` | Perfil y privacidad | `feature:profile` | ⏳ |
| `TASK-010` | Próximos pasos | `feature:nextsteps` | ⏳ |
| `TASK-011` | Derivación y directorio | `feature:referral` | ⏳ |
| `TASK-015` | Paquete de alerta roja | `feature:signals` | ⏳ |
| `TASK-016` | Estado del caso rojo | `feature:sharing` | ⏳ |
| `TASK-017` | Registro de eventos adversos | transversal | ⏳ |
| `TASK-018` | Suite de prueba de seguridad | calidad | ⏳ |
| `TASK-024` | Canal de audio | transversal | ⏳ |

## 4. Agente C — Portal Puente Red (18)

| ID | Tarea | Spec |
|---|---|---|
| `PR-005` | Clasificador LLM (medio/alto, versionado) | ⏳ |
| `PR-006` | Extracción de características | ⏳ |
| `PR-007` | Directorio de profesionales (dos tipos de respondedor) | ⏳ |
| `PR-008` | Motor de derivación escalonado por gravedad | ⏳ |
| `PR-009` | Cola de asignación, SLA y trazabilidad | ⏳ |
| `PR-010` | Autenticación profesional y roles (Supabase Auth) | ⏳ |
| `PR-011` | Home profesional | ⏳ |
| `PR-012` | Centro de alertas | ⏳ |
| `PR-013` | Ficha de caso (7 secciones) | ⏳ |
| `PR-014` | Separación «organizado por Puente» / «valoración profesional» | ⏳ |
| `PR-015` | Timeline y seguimiento | ⏳ |
| `PR-016` | Derivaciones | ⏳ |
| `PR-017` | Observatorio y reportes agregados | ⏳ |
| `PR-018` | Auditoría y cumplimiento | ⏳ |
| `PR-019` | Consentimiento y revocación cross-producto | ⏳ |
| `PR-020` | Pruebas de contrato entre productos | ⏳ |
| `TASK-019` | Apoyo humano breve telefónico | ⏳ |
| `TASK-020` | Marco de evaluación de 7 dimensiones | ⏳ |

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
