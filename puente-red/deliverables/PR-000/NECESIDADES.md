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

### 7.1 🆕 Reparto del árbol `puente-red/backend/` — **requiere ratificación de A**

`PR-003` §1 decide **una API con dos superficies**, lo que convierte `puente-red/backend/` en un
**árbol compartido A+C**. `PLAN-3-AGENTES.md` §2.2 no lo preveía (sus 6 archivos —ahora 7— son
todos del APK). Propuesta de C, en `PR-000` §1.1:

| Ruta | Dueño |
|---|---|
| `backend/routes/joven/**` | **A** |
| `backend/routes/profesional/**` | **C** |
| `backend/core/**` | **C** |
| `backend/shared/**` (modelos, cliente Supabase, middleware, `contratoVersion`) | **A** |
| `backend/main`, despliegue | **A** |

**Sin este reparto, A y C editan el mismo árbol sin regla** — que es exactamente el riesgo #2 de
`PLAN-3-AGENTES.md` §8.

### 7.2 Tablas y RLS que C necesita crear en Supabase

`casos`, `caso_correlacion`, `audit_event` las define `PR-004` §4 (**A**). C necesita además:
`responders`, `responder_load`, `referrals`, `support_services`, `call_appointments` — con RLS por
rol (`PR-010`) y aislamiento por institución si hay multi-tenant (Q8 abierto).

### 7.3 Ubicación de las fixtures del contrato

C propone que vivan en `PR-003` (**A**), con C como consumidor (`specs/PR-020` §3).

### 7.4 CI de las pruebas de contrato

`TASK-014` (**A**) define el CI. Las pruebas de `PR-020` deben correr **sin** compilar el APK y
Puente Red juntos (`specs/PR-020` criterio 10).

---

## 8. Lo que A ya cerró ✅

`PR-003` (contrato), `PR-004` (ingesta, decisiones cerradas el 2026-09-30: `deviceKey` = Keystore,
ingesta acepta `ROJO`+`AMARILLO`, `sessionToken` sin caducidad, `caseToken` = ULID), `PR-002`
(plegado en `PR-003` §7), `TASK-000` (plantilla), `TASK-00A` (contrato de integración),
`PR-INFRA-RECOMENDACION`, y `PR-001` autorizado.

## 9. Preguntas que C necesita que A cierre

| # | Pregunta | Bloquea |
|---|---|---|
| 1 | ¿`RESUELTO` y `CERRADO` son dos estados o uno? (`PR-003` §3.1 los escribe `RESUELTO→CERRADO`) | `PR-009`, `PR-015` |
| 2 | ¿El `sessionToken` sin caducidad es aceptable también para el portal, o solo para el APK? | `PR-010`, `PR-020` |
| 3 | ¿A ratifica el reparto de §7.1? | arrancar la Fase 1 |
| 4 | ¿A acepta `PR-000` rev. 2 (stack, `P10` web desktop-first)? | arrancar la Fase 1 |

## 10. Lo que C se compromete a NO tocar

Los **7 archivos** de `CONTRATO-DE-INTEGRACION.md` §1 · `core/designsystem/**` ·
`puente-red/backend/routes/joven/**` · `puente-red/backend/shared/**` · todo `puente-joven-android/`.

---

## 11. Estado de sincronización

C sigue en **Fase 0**. Entrega: **18 specs en `specs/`** (plantilla oficial), `PR-000` rev. 2,
`REVISION-A.md` y esta declaración.
**C no construye** hasta que (a) A ratifique `PR-000` y el reparto del backend, (b) las specs sean
revisadas por A y B (`PLAN-3-AGENTES.md` §3.0.3–0.4), y (c) se cierre `PR-001` con firma clínica.
