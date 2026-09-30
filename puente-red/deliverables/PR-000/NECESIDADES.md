<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A (PLAN-3-AGENTES.md §2.3) -->

# NECESIDADES — Agente C (Puente Red)

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-005` … `specs/TASK-020` (18 specs)

> Formato de `CONTRATO-DE-INTEGRACION.md` §2. Los campos que **no aplican a Puente Red** van con
> `—` y su motivo, según `specs/_PLANTILLA-SPEC.md` §1.2.

---

## 1. Módulo nuevo

**—** Puente Red **no crea módulos Gradle**. Vive fuera del APK: `puente-red/portal` (TS/React) y
`puente-red/backend` (Go). Ningún `include(":feature:X")` depende de C.

## 2. Dependencia de build (la aplica A)

**—** No hay dependencia de build entre Puente Red y el APK. La separación es por **superficie de
API** (`/joven` vs `/profesional`), no por módulo (`PR-003` §1).

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK juvenil (`PuenteJovenNavHost.kt`). C no añade rutas allí. Las rutas de
Puente Red viven en su propio router web.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK. El portal no se enlaza desde Inicio (guardrail #6).

## 5. Métodos de repositorio

**—** C **no** consume `Repositories.kt`. Consume los **Contratos A/B/C** de `PR-003` por HTTP.
No se piden métodos nuevos en el APK.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado. El portal usa **tokens propios**
extraídos del prototipo (brief §34: misma marca, distinta estructura).

## 7. Otros (permisos, flags, migraciones)

### 7.1 ✅ Reparto del árbol `puente-red/backend/` — **RATIFICADO** (`REVISION-C.md` §5.3)

`PR-003` §1 decide **una API con dos superficies**, lo que convierte `puente-red/backend/` en un
**árbol compartido A+C**. A lo ratificó y ya está en `CONTRATO-DE-INTEGRACION.md` §1.1:

| Ruta | Dueño |
|---|---|
| `backend/routes/joven/**` | **A** |
| `backend/routes/profesional/**` | **C** |
| `backend/core/**` | **C** |
| `backend/shared/**` (modelos, cliente Supabase, middleware, `contratoVersion`, **fixtures del contrato**) | **A** |
| `backend/main` y configuración de despliegue | **A** |
| `puente-red/portal/**` | **C** |

**Aviso de A (§5.3):** el reparto **no** exime de la regla de declaración. `backend/shared/**` y
`routes/joven/**` son de A: C **declara**, no aplica.

### 7.2 Tablas y RLS que C necesita crear en Supabase

`casos`, `caso_correlacion`, `audit_event` las define `PR-004` §4 (**A**). C necesita además:
`responders`, `responder_load`, `referrals`, `support_services`, `call_appointments` — con RLS por
rol (`PR-010`) y aislamiento por institución si hay multi-tenant (Q8 abierto).

**🆕 `TASK-025` afecta a `caso_correlacion`:** con multi-perfil, una **instalación** puede tener
**varios `ProfileId`**. La correlación `caseToken ↔ ProfileId` debe soportar N perfiles por
dispositivo (y `deleteAllLocalContent()` borra todos). A debe confirmarlo al implementar `TASK-025`.

### 7.3 Ubicación de las fixtures del contrato — ✅ **resuelto**

Viven con `PR-003` (**A**), dentro de `backend/shared/**` (`REVISION-C.md` §5.3). C es consumidor.

### 7.4 CI de las pruebas de contrato

`TASK-014` (**A**) define el CI. Las pruebas de `PR-020` deben correr **sin** compilar el APK y
Puente Red juntos (`specs/PR-020` criterio 10).

---

## 8. Lo que A ya cerró ✅

`PR-003` (contrato), `PR-004` (ingesta, decisiones cerradas el 2026-09-30: `deviceKey` = Keystore,
ingesta acepta `ROJO`+`AMARILLO`, `sessionToken` sin caducidad, `caseToken` = ULID), `PR-002`
(plegado en `PR-003` §7), `TASK-000` (plantilla), `TASK-00A` (contrato de integración),
`PR-INFRA-RECOMENDACION`, `TASK-021` (modelo de amenaza), y las specs de `TASK-003b` y `TASK-025`.

**Fuera del repo, confirmado por el product owner el 2026-09-30:**
- ✅ **`PR-001` tiene firma clínica** → desbloquea `PR-005`, `PR-006`, `PR-007`, `PR-009`, `TASK-019`.
- ✅ **Se usará Gemini de pago** → el bloqueo legal de `PR-INFRA` §4 queda resuelto.

## 9. Respuestas recibidas y preguntas nuevas

### 9.1 Resueltas por `REVISION-C.md` §5 ✅

| # | Pregunta | Respuesta de A |
|---|---|---|
| 1 | ¿`RESUELTO` y `CERRADO` son dos estados o uno? | **Dos** (§5.1). `RESUELTO` = objetivo cumplido; `CERRADO` = cierre **administrativo**, alcanzable desde `RESUELTO` **o** por revocación/vencimiento. Ambos proyectan a `CLOSED`. Incorporado a `PR-009` y `PR-019` |
| 2 | ¿El `sessionToken` sin caducidad vale para el portal? | **No** (§5.2). Es **solo para la API Joven**; el portal usa Supabase Auth con sesión normal que **sí caduca**. Incorporado a `PR-010` |
| 3 | ¿Reparto del árbol del backend? | ✅ **Ratificado** (§5.3), con la precisión de que `backend/shared/**` incluye `contratoVersion` **y las fixtures del contrato**. Ya en `CONTRATO-DE-INTEGRACION.md` §1.1 |
| 4 | ¿`PR-000` rev. 2 y `P10`? | ✅ **Ratificados** (§4) |
| 5 | ¿Publicar `PR-001` firmado? | ⚠️ **A no puede**: el dueño decidió **no modificar ese fichero**. A deja constancia en `REVISION-C.md` §5.5 de que la firma existe y de que `PR-001` §5–§7 es **fuente de verdad vinculante**. C mantiene la postura correcta: **referenciar sin reestatear** |

**Hallazgos F1–F4**: los cuatro son de A (`REVISION-C.md` §6) y **ninguno exige rehacer una spec de C**.

### 9.2 Fase 1 — estado (actualizado 2026-09-30, tras el esqueleto de A)

| # | Pregunta | Estado |
|---|---|---|
| 6 | El backend no existía | ✅ **resuelto**: A creó `puente-red/backend/` (Node 22 + Hono) con `src/core/` para C. Mis módulos se movieron allí y las **151 pruebas pasan juntas** |
| 7 | Runtime | ✅ **resuelto**: Node/Bun + Hono, confirmado por el dueño y materializado por A |
| 8 | Cómo consume `main` a `@puente-red/core` | ✅ **resuelto**: **un solo paquete** (`puente-red-backend`). Mi `package.json` separado se retiró |
| 9 | Guarda de secretos sobre `puente-red/**` | ⚠️ **abierto** — `TASK-014` (A), hallazgo **F2** |
| 10 | Catálogo clínico de `rationaleKeys` | ⚠️ **parcial**: A publicó el catálogo **provisional** de `motivo` (`PR-003` §4.2). El de `rationaleKeys` sigue pendiente |
| **11** | **Flujo de rechazo** (`PR-009` §7.2): `ASIGNADO` no vuelve a `EN_COLA` | ⚠️ **abierto** — `PR-003` §3.1 no lo define |
| **12** | **Idioma y zona** en el Contrato A (`PR-008` §7.2) | ⚠️ **abierto** — el Contrato A no los trae; los pesos no puntúan |
| **13** | **Cliente de Supabase** en `src/shared/**` | ⚠️ **abierto** — sin él no hay persistencia real ni RLS |

### 9.3 Hallazgos de B (`REVISION-C-POR-B.md`) — estado

| # | Hallazgo | Estado |
|---|---|---|
| **K1** | Vocabulario de señales no coincidía | ✅ **resuelto por A** (`PR-003` §4.1, forma canónica). **Aplicado por C**: `PHYSICAL_VIOLENCE`, orden de `SIGNAL_TAGS` |
| **K2** | Catálogo de `motivo` no existía | ✅ **resuelto por A** (`PR-003` §4.2, provisional y versionado). **Aplicado por C** en `mapping.ts` |
| **K3** | `PR-013` sección 5 sin fuente | ✅ **corregido por C** (spec) |
| **K4** | `respuestasChequeo` sin consumidor | ✅ **corregido por C**: `PR-006` lo consume (procedencia `DECLARED`) |
| **K5** | Contrato B sin `fueraDeHorario` | ✅ **resuelto por A**. **Aplicado por C**: la proyección tiene **9 campos** |
| **K6** | Dos vocabularios para `rol`/`especialidad` | ✅ **resuelto por A** (`PR-003` §6.1). **Aplicado por C**: un solo vocabulario, sin tabla de conversión |
| **K7** | Directorio con dos dueños | ✅ B corrigió su `TASK-011`; el directorio es de C (`PR-016`) |
| **K8** | Specs de C desfasadas vs `REVISION-C` | ✅ **corregido por C** antes de esta revisión |
| **K9** | `PR-018` citaba un campo inexistente | ✅ **corregido por C** (spec) |
| **K10** | ¿Se ajustó `PR-001` al firmar? | ✅ **resuelto por A**: el dueño confirmó que **no se ajustó** → el fichero tal como está **es** el texto firmado |

## 10. Lo que C se compromete a NO tocar

Los **7 archivos** de `CONTRATO-DE-INTEGRACION.md` §1 · `core/designsystem/**` ·
`puente-red/backend/routes/joven/**` · `puente-red/backend/shared/**` · todo `puente-joven-android/`.

---

## 11. Estado de sincronización

C sigue en **Fase 0 → Fase 1**. Entrega: **18 specs ✅ Aprobadas** (`REVISION-C.md`),
`PR-000` rev. 2 ✅ ratificado, `REVISION-A.md` y esta declaración.

**Estado (2026-09-30):** PR #1 **mergeado** por A. Los bloqueos clínicos y de proveedor LLM están
cerrados. Lo que falta para construir es el **esqueleto del backend** y la **confirmación del
runtime** (§9.2, preguntas 6 y 7).
