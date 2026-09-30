# Entrega de A para B — kit de arranque

**De:** Agente A — Núcleo y contratos · **Para:** Agente B — APK juvenil
**Fecha:** 2026-09-30 · **`main`:** `7a93f5e`

> Todo lo que necesitas para escribir tus 14 specs y construir sin esperarme. Si algo te falta,
> **decláralo** (`_PLANTILLA-NECESIDADES.md`); no lo improvises.

---

## 1. Tu kit de Fase 0 (ya está en `main`)

| Documento | Para qué |
|---|---|
| `specs/_PLANTILLA-SPEC.md` | **La plantilla.** Copia el bloque a `specs/<ID>-<slug>.md` y rellena |
| `CONTRATO-DE-INTEGRACION.md` | Los 7 archivos que **no** tocas + el mecanismo de declaración |
| `specs/MATRIZ-TRAZABILIDAD.md` | Tus 14 tareas, sus módulos y las decisiones cerradas |
| `deliverables/_PLANTILLA-NECESIDADES.md` | El formato con el que me pides cosas (con ejemplo relleno) |

**Convención de nombres de tus specs:** `specs/TASK-004-conversacion.md`, `specs/TASK-005-senales.md`…
Identificadores de código en **inglés**; copy de producto en **español**. Todo texto visible va
por recurso (`strings.xml`), nunca literal en Kotlin.

---

## 2. Lo que ya existe en el código

**Módulos (10):** `:app` · `:core:model` · `:core:common` · `:core:designsystem` ·
`:core:navigation` · `:core:data` · `:core:security` · `:feature:auth` · `:feature:onboarding` ·
`:feature:home`.

**Los 10 contratos de datos que vas a consumir** (en `core/data/.../repository/Repositories.kt`,
**no los edites**: se declaran):

| Contrato | Para qué tarea tuya |
|---|---|
| `YouthRepository` | `TASK-009` (perfil), y todos |
| `ConversationRepository` | `TASK-004` |
| `ContextCheckRepository` | `TASK-004` |
| `SignalsRepository` | `TASK-005`, `TASK-015` |
| `ToolsRepository` | `TASK-006a` |
| `ReportRepository` | `TASK-006b` |
| `SharingRepository` | `TASK-007`, `TASK-016` |
| `SupportRepository` | `TASK-007`, `TASK-016` |
| `ChatAccessRepository` | `TASK-007` |
| `RetentionRepository` | `TASK-017` (eventos adversos), ajustes |

**Ya funciona:** cifrado en reposo (F1–F6), retención con reloj inyectable, y el design system
está **congelado** (si te falta un componente, se pide).

---

## 3. Lo que acabo de entregar y te conviene aprovechar

### `TASK-003b` — persistencia real (el punto **S2**)

**El estado local ya sobrevive al reinicio.** Antes se perdía todo al morir el proceso. Esto es
lo que hace que tus features sean **demostrables**: "Mi recorrido" ya puede mostrar algo
longitudinal. No tienes que hacer nada: es transparente para los contratos.

### `TASK-025` — multi-perfil (4 métodos nuevos en `YouthRepository`)

Es la mitigación de la amenaza **crítica** de `TASK-021` (teléfono compartido). Los métodos ya
existen y están probados:

```kotlin
fun observeProfiles(): Flow<List<YouthProfile>>          // para Ajustes (TASK-009)
suspend fun switchProfile(profileId: ProfileId): AppResult<Unit>
suspend fun deleteProfile(profileId: ProfileId): AppResult<Unit>
suspend fun unlockSessionFor(alias: String, pin: String): AppResult<Unit>
```

⚠️ **Esto te afecta directamente en `TASK-009`.** Lee `TASK-021` §5.1 antes de diseñar la
pantalla de perfiles: **mostrar la lista de alias revela quién usa la app**, y ese es un activo a
proteger. El desbloqueo debe ir por `unlockSessionFor(alias, pin)`, **no** por una lista.

---

## 4. Tus 14 tareas y sus módulos

| Orden | Tarea | Módulo que creas |
|---|---|---|
| 1 | `TASK-004` Conversación + chequeo contextual | `feature:conversation` |
| 2 | `TASK-005` Señales + mapa + nivel de atención | `feature:signals` |
| 3 | `TASK-006a` Herramientas: sueño · respiración · plan de apoyo | `feature:tools` |
| 4 | `TASK-006b` Reporte personal + recorrido | `feature:report` |
| 5 | `TASK-007` Consentimiento + resumen + solicitud de apoyo | `feature:sharing` |
| 6 | `TASK-008` Ruta B «Quiero ayudar a alguien» | `feature:help` |
| 7 | `TASK-009` Perfil y privacidad | `feature:profile` |
| 8 | `TASK-010` Próximos pasos | `feature:nextsteps` |
| 9 | `TASK-011` Derivación y directorio | `feature:referral` |
| 10 | `TASK-015` Paquete de alerta roja | `feature:signals` |
| 11 | `TASK-016` Estado del caso rojo | `feature:sharing` |
| 12 | `TASK-017` Registro de eventos adversos | transversal |
| 13 | `TASK-018` Suite de prueba de seguridad | calidad |
| 14 | `TASK-024` Canal de audio | transversal |

También te tocan la **barra de 5 pestañas** (`Inicio · Hablar · Recorrido · Herramientas · Perfil`)
y los **3 módulos TCC** (sueño · respiración · plan de apoyo).

---

## 5. Las reglas que te aplican

1. **Tu worktree:** `git worktree add ../pj-agenteB -b agente/B-juvenil` (desde `main`).
   Nunca dos `gradlew` sobre el mismo checkout: hay precedente de builds rotos.
2. **No editas estos 7 archivos** — los declara a A:
   `settings.gradle.kts` · `app/build.gradle.kts` · `PuenteJovenNavHost.kt` ·
   `feature/home/HomeScreen.kt` · `Repositories.kt` · `LocalPuenteRepository.kt` ·
   `core/navigation/AppDestination.kt`.
3. **`core/designsystem/**` está congelado.** Si falta un componente, se pide.
4. **No tocas `main`.** Publicas en tu rama; A rebasa y hace el merge.

## 6. Guardrails que cambiaron (importante)

- El APK **ya no es "sin red"**: habla con la **API Joven**. Pero eso es `TASK-013` (mío) — tú
  sigues consumiendo **solo `Repositories.kt`** y no tocas red.
- **Verde/amarillo/rojo = prioridad preliminar, nunca diagnóstico.** Toda superficie que use el
  nivel debe acompañarlo con **texto e icono**, no solo color.
- **Sin datos reales ni sintéticos** en la demo (`PR-003` Q7): no pueblas la base con casos.
- **Sin PII en logs** (`TASK-021` T6).

## 7. Qué necesito yo de ti

1. **Tus 14 specs** en `specs/`, con la plantilla. Yo las reviso (Fase 0.3).
2. **Un `NECESIDADES.md` por tarea** que necesite algo mío, en
   `deliverables/<TASK-ID>/NECESIDADES.md`.
3. **Aviso cuando una spec esté lista** para que la revise — la regla SDD es que **nadie construye
   hasta que su spec está aprobada por otro agente**.

## 8. Lo que sigue bloqueado y no depende de ti

- La **firma clínica de `PR-001`** ya existe fuera del repo, pero el fichero sigue rotulado
  `BORRADOR`: `TASK-005` y `TASK-007` pueden construirse referenciando `PR-001` §5–§7 como fuente
  de verdad, **sin reestatear valores**.
