<!-- Declaración de necesidades del Agente C al Agente A (PLAN-3-AGENTES.md §2.3) -->

# NECESIDADES · Agente C → Agente A

**De:** Agente C (Portal profesional / Puente Red)
**Para:** Agente A (Núcleo, contratos e integración)
**Fecha:** 2026-09-30 · **Actualizado:** 2026-09-30 (tras la publicación de A) · **Rama:** `agente/C-red`

---

## 0. Estado: la mitad está resuelta ✅

A publicó en `main` (`942d581`, `5e853ad`) el contrato Joven↔Red, la ingesta y una revisión de
guardrails. Detalle completo en **`../REVISION-A.md`**.

### Resuelto ✅

| Necesidad | Quién lo cerró |
|---|---|
| Contrato de datos Joven ↔ Red versionado | `PR-003` |
| Ingesta del reporte y emisión de `caseToken` | `PR-004` |
| Modelo de identidad y anonimato | `PR-003` §7 (sustituye a `PR-002`) |
| ¿Guardia 24/7? | `PR-003` §15: **no existe** |
| Proveedor del LLM | `PR-003` §13: **Google GenAI** |
| Auth de profesionales | `PR-003` Q9: **Supabase Auth** |
| Escala del MVP | `PR-003` Q6: **demo ≤5 usuarios** |

---

## 1. Lo que C sigue necesitando de A ⏳

| # | Necesidad | Tarea de A | Bloquea a C |
|---|---|---|---|
| 1 | **Plantilla de spec definitiva** — mis 18 specs usan la de `PLAN-TRABAJO-SDD.md` §6 | `TASK-000` | forma final de las 18 specs |
| 2 | **Contrato de integración** (mecanismo de declaración de necesidades) | `TASK-00A` | cómo C declara y cómo A integra |
| 3 | 🆕 **Reparto del árbol `puente-red/backend/`** — `PR-003` §1 crea **una API con dos superficies**, así que el backend es un árbol **compartido A+C**, algo que `PLAN-3-AGENTES.md` §2.2 no preveía | ratificación de `PR-000` §1.1 | que C no pise a A en el mismo árbol |
| 4 | **Ratificación de `PR-000` rev. 2** (stack Go/Supabase/GenAI, `P10` web desktop-first, reparto del backend) | revisión | arrancar la Fase 1 |
| 5 | **Modelo de amenaza de privacidad** (contexto de divorcio) | `TASK-021` | qué se guarda y qué se comparte (`PR-018`) |
| 6 | **Multi-perfil en dispositivo compartido** | `TASK-025` | el vínculo `caseToken ↔ ProfileId` asume 1 perfil por instalación |
| 7 | **`ModuleGraphGuardTest` reescrito** para vigilar la API Joven (no la ausencia de red) | `TASK-013` | `PR-020` verifica contra él |

## 2. Preguntas que C necesita que A cierre

| # | Pregunta | Bloquea a C |
|---|---|---|
| 1 | ¿Dónde viven las **fixtures del contrato**: en `PR-003` (A) o en `PR-020` (C)? C propone **en A**, con C como consumidor | `PR-020` |
| 2 | ¿`RESUELTO` y `CERRADO` son **dos estados** o uno? El diagrama de `PR-003` §3.1 los escribe como `RESUELTO→CERRADO` | `PR-009`, `PR-015` |
| 3 | ¿El `sessionToken` **caduca**? ¿Cómo se renueva sin que el servidor conozca alias+PIN? (Q3 de `PR-004`) | `PR-020`, Contrato A |
| 4 | ¿La ingesta acepta **amarillo** además de rojo? (Q2 de `PR-004`) | `PR-005` |
| 5 | ¿El `deviceKey` es clave del **Keystore** o un secreto simple? (Q1 de `PR-004`) | `PR-004`/registro |
| 6 | ¿`caseToken` **ULID** confirmado? (`PR-004` §3 lo asume; su Q4 aún lo lista como abierto) | `PR-009` |

## 3. Cambios que C pide a A en archivos de A

**Ninguno en esta fase.** Todo lo de C vive bajo `puente-red/`.
Si `PR-003` exige un tipo nuevo en `:core:model`, C lo declarará aquí y **no** lo editará (§2.2).

## 4. Lo que C se compromete a NO tocar

`settings.gradle.kts` · `app/build.gradle.kts` · `PuenteJovenNavHost.kt` ·
`feature/home/HomeScreen.kt` · `core/data/repository/Repositories.kt` ·
`core/data/local/LocalPuenteRepository.kt` · `core/designsystem/**` · `puente-red/backend/routes/joven/**` ·
`puente-red/backend/shared/**` · cualquier archivo de `puente-joven-android/`.

---

## 5. Nota de sincronización

C sigue en **Fase 0** (§3 de `PLAN-3-AGENTES.md`). Entrega **18 specs + `PR-000` rev. 2 +
`REVISION-A.md`**.
**C no construye** hasta que (a) A ratifique `PR-000` y el reparto del backend, (b) las specs de
C sean revisadas por A y B (§3.0.3–0.4), y (c) se cierre `PR-001` con firma clínica.
