<!-- Declaración de necesidades del Agente C al Agente A (PLAN-3-AGENTES.md §2.3) -->

# NECESIDADES · Agente C → Agente A

**De:** Agente C (Portal profesional / Puente Red)
**Para:** Agente A (Núcleo, contratos e integración)
**Fecha:** 2026-09-30 · **Rama:** `agente/C-red`

---

## 1. Contratos que C consume (bloqueantes)

| Necesidad | Tarea de A | Bloquea a C |
|---|---|---|
| Plantilla de spec definitiva | `TASK-000` | forma final de las 18 specs de C (hoy usan la de `PLAN-TRABAJO-SDD.md` §6) |
| Contrato de integración (5 archivos + mecanismo de declaración) | `TASK-00A` | cómo C declara y cómo A integra |
| **Contrato de datos Joven ↔ Red, versionado** | `PR-003` | `PR-004`, `PR-019`, `PR-020` |
| Ingesta del reporte y **emisión de `caseToken`** + tabla `caseToken ↔ ProfileId` con auditoría | `PR-004` | todo el backend de C |
| Modelo de amenaza de privacidad (contexto de divorcio) | `TASK-021` | qué se guarda y qué se comparte (`PR-018`) |
| Multi-perfil en dispositivo compartido | `TASK-025` | el vínculo `caseToken ↔ ProfileId` hoy asume 1 perfil por instalación |

## 2. Preguntas que C necesita que A cierre

| # | Pregunta | Bloquea a C |
|---|---|---|
| — | ¿Dónde viven las fixtures del contrato: en `PR-003` (A) o en `PR-020` (C)? C propone en A, con C como consumidor | `PR-020` |
| — | ¿Quién es el dueño del **transporte** del paquete de alerta (el "componente intermedio" de `PLAN-PUENTE-RED.md` §4)? Hoy no tiene dueño | `PR-004`, `PR-020` |
| — | ¿El formato de serialización del paquete es `kotlinx.serialization` (como sugiere `BACKEND_INTEGRATION.md` §3)? | `PR-004`, `PR-020` |
| — | ¿A acepta la propuesta de arquitectura de `PR-000` (directorio `puente-red/`, stack portal TS/React + backend Kotlin/Ktor, `P10` = web desktop-first)? | las 18 specs de C |

## 3. Cambios que C pide a A en archivos de A

**Ninguno en esta fase.** Toda la Fase 0 de C son documentos bajo `puente-red/`.
Si `PR-003` acaba exigiendo un tipo nuevo en `:core:model`, C lo declarará aquí y **no** lo
editará (regla §2.2 de `PLAN-3-AGENTES.md`).

## 4. Lo que C se compromete a NO tocar

`settings.gradle.kts` · `app/build.gradle.kts` · `PuenteJovenNavHost.kt` ·
`feature/home/HomeScreen.kt` · `core/data/repository/Repositories.kt` ·
`core/data/local/LocalPuenteRepository.kt` · `core/designsystem/**` · cualquier archivo de
`puente-joven-android/`.

---

## 5. Nota de sincronización

C está en **Fase 0** (§3 de `PLAN-3-AGENTES.md`). Entrega 18 specs + esta declaración.
**C no construye nada** hasta que A publique el contrato de integración (`TASK-00A`) y las specs
de C sean revisadas por A y B (§3.0.3 y §3.0.4).
