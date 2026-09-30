# PR-000 · Arquitectura y ubicación de Puente Red

**Agente:** C — Portal profesional / Puente Red
**Fecha:** 2026-09-30 · **Revisión 2** (reconciliada con `PR-003` / `PR-004` / `PR-INFRA-RECOMENDACION`, publicados por A)
**Estado:** propuesta de la Fase 0. **Requiere ratificación de A** (§3.0.3 de `PLAN-3-AGENTES.md`).
**Plantilla:** la propuesta en `PLAN-TRABAJO-SDD.md` §6, hasta que A publique la definitiva (`TASK-000`).

> ⚠️ **La revisión 1 de este documento proponía backend Kotlin/Ktor y una frontera "sin red".
> Ambas cosas quedaron obsoletas el 2026-09-30** (`PR-INFRA-RECOMENDACION` §3 y `PR-003` §10).
> Esta revisión 2 las corrige. Ver §9 para el registro de cambios.

---

## 0. Por qué existe este documento

`PLAN-3-AGENTES.md` §9 dice que la primera acción de C es redactar las specs de `PR-005` a
`PR-020`. Pero había un vacío previo que ninguna de esas specs puede cerrar por su cuenta: dónde
vive Puente Red, con qué stack y con qué frontera. Este documento lo fija **una vez** y cada
spec lo referencia.

---

## 1. Decisión: dónde vive

Puente Red vive en **este repositorio**, en `puente-red/`, con **una salvedad nueva** que
introduce `PR-003` §1: el backend **no es solo de C**.

```
prueba_movil/
├── puente-joven-android/         ← APK juvenil (A y B). Red acotada a la API Joven.
├── Propuesta UX_UI Puente Joven/  ← prototipo web (referencia visual de ambos productos)
└── puente-red/                   ← Puente Red
    ├── portal/                   ← portal profesional. Dueño: C.
    ├── backend/                  ← UNA API, DOS superficies (PR-003 §1). Dueño: A + C.
    │   ├── routes/joven/         ← Contratos A/B. Dueño: A (PR-004, TASK-013)
    │   ├── routes/profesional/   ← Superficie profesional. Dueño: C (PR-010…PR-017)
    │   └── core/                 ← clasificador, características, derivación, cola.
    │                                Dueño: C (PR-005…PR-009)
    └── deliverables/             ← specs y reportes
```

### 1.1 Punto de coordinación nuevo (declarado a A)

`PR-003` §1 decide **una sola API con dos grupos de rutas**. Eso convierte `puente-red/backend/`
en un **árbol compartido entre A y C** — algo que `PLAN-3-AGENTES.md` §2.2 no preveía (sus 6
archivos compartidos son todos del APK).

**Propuesta de reparto**, a ratificar por A:

| Ruta | Dueño | Regla |
|---|---|---|
| `backend/routes/joven/**` | **A** | C solo lee |
| `backend/routes/profesional/**` | **C** | A solo lee |
| `backend/core/**` | **C** | Es el pipeline de triaje (`PR-005`–`PR-009`) |
| `backend/shared/**` (modelos, cliente Supabase, middleware, `contratoVersion`) | **A** | C declara cambios, no los aplica |
| `backend/main`, configuración de despliegue | **A** | — |

Sin este reparto, A y C editan el mismo árbol sin regla, que es exactamente el riesgo #2 de
`PLAN-3-AGENTES.md` §8.

---

## 2. Frontera entre los dos productos (guardrail #6, **actualizado**)

`PR-003` §10 **modifica el guardrail #6**: el APK juvenil **ya no es "sin red"**. Habla con la
**API Joven** del backend compartido. Lo que se mantiene es que **no conoce ni navega al panel
profesional**, y que las superficies están separadas por contrato y por permisos.

| Regla | Verificación |
|---|---|
| `puente-red/` **no** se compila en el APK juvenil | `ModuleGraphGuardTest` (reescrito por A en `TASK-013`) |
| El APK habla **solo** con `/joven`, nunca con `/profesional` | prueba de contrato (`PR-020`) + guard de rutas |
| Ningún contrato profesional se compila en el APK | revisión de imports en CI |
| La separación de datos se hace en **RLS de Postgres**, no en el código | `PR-003` §1, `PR-INFRA` §2 |

**Consecuencia de diseño:** el paquete de alerta sigue siendo un **documento serializado**
(Contrato A de `PR-003` §4), no un tipo compartido. El APK lo produce; el backend lo consume.

---

## 3. Decisión: stack (**corregido**)

`PR-INFRA-RECOMENDACION` §3 descarta un framework JVM: **256 MB no lo admiten**. Mi propuesta
anterior (Kotlin + Ktor) queda **retirada**.

| Capa | Decisión (de A) | Fuente |
|---|---|---|
| **API** | **Go** (`net/http`, `chi`) — o **Node/Bun + Hono** si el equipo prefiere TS | `PR-INFRA` §3 |
| **Portal** | **TypeScript + React + Vite** (reutiliza el prototipo `Pro*`) | `PR-000` §4, brief §37 |
| **Base de datos** | **Supabase** (Postgres + RLS + Realtime), región **`sa-east-1`** | `PR-INFRA` §5 |
| **Auth de profesionales** | **Supabase Auth** | `PR-003` Q9, `PR-INFRA` §2 |
| **LLM** | **Google GenAI** (llamado desde la API) | `PR-003` §13 |
| **Canal in-app** | **Supabase Realtime** — **baja prioridad** (R2) | `PR-003` §6.2 |
| **Servidor** | **0.1 vCPU / 256 MB, sin cold start**. La API solo **orquesta** | `PR-INFRA` §2 |

**Idea clave de A:** el servidor no hace trabajo pesado. BD, auth, realtime y LLM viven fuera;
la API valida, llama y escribe. Con eso 256 MB alcanzan.

> **Nota:** mi propuesta de backend Kotlin tenía como argumento "compartir vocabulario de dominio
> con el APK". `PR-003` lo resuelve mejor: el vocabulario compartido es el **contrato versionado**
> (`contratoVersion`), no el lenguaje. La corrección de A es la correcta.

---

## 4. `P10` (web / tablet / ambos) — propuesta de C, **no ratificada por A**

El brief §34 pide *desktop-first*; `ProSidebar.tsx` es una barra lateral de escritorio.

**Propuesta de C (sin objeción de A):** **web responsive, desktop-first**, ancho mínimo 1024 px.
Sin app nativa de tablet en el MVP.

**Nota:** `PR-003` §13 fija el alcance en **demo de ≤5 usuarios recurrentes**. A esa escala, el
portal se usa en un navegador de escritorio; una app de tablet no aporta y sí cuesta.

---

## 5. Mapa de propiedad (Agente C)

| Ruta | Dueño |
|---|---|
| `puente-red/portal/**` | **C** |
| `puente-red/backend/routes/profesional/**` | **C** |
| `puente-red/backend/core/**` | **C** |
| `puente-red/deliverables/**` | **C** |
| `puente-red/backend/routes/joven/**`, `backend/shared/**`, despliegue | **A** |
| `puente-joven-android/**` | **A y B** — C solo lee |
| `core/designsystem/**` | congelado (A). C **no** lo reutiliza: el portal tiene su propio lenguaje (brief §34) |

**Nota sobre el design system:** brief §34 — ambos productos comparten marca, colores y
tipografía, **no** estructura. C extrae los tokens del prototipo a
`puente-red/portal/src/design/tokens` y **no** importa `:core:designsystem` (Android/Compose,
además congelado).

---

## 6. Declaración de necesidades a A

<!-- puente-red/deliverables/PR-000/NECESIDADES.md — ver allí el detalle -->

**Resuelto por A el 2026-09-30** ✅: `PR-003` (contrato Joven↔Red), `PR-004` (ingesta y
`caseToken`), identidad y anonimato (`PR-003` §7, sustituye a `PR-002`), guardia 24/7 (**no
existe**, Q8), proveedor LLM (**Google GenAI**, Q12), auth profesional (**Supabase Auth**, Q9).

**Sigue pendiente** ⏳:

| Necesidad | Tarea de A | Bloquea a C |
|---|---|---|
| Plantilla de spec definitiva | `TASK-000` | forma final de las 18 specs de C |
| Contrato de integración (mecanismo de declaración) | `TASK-00A` | cómo C declara y cómo A integra |
| **Reparto de `puente-red/backend/`** (§1.1) | ratificación | que C no pise a A en el mismo árbol |
| Modelo de amenaza de privacidad (divorcio) | `TASK-021` | qué se guarda (`PR-018`) |
| Multi-perfil en dispositivo compartido | `TASK-025` | el vínculo `caseToken ↔ ProfileId` |
| `ModuleGraphGuardTest` reescrito | `TASK-013` | `PR-020` verifica contra él |

---

## 7. Guardrails vinculantes para `puente-red/`

**Actualizados según `PR-003` §7 y §9.** Los cambios respecto de la revisión 1 van marcados.

1. Verde/amarillo/rojo es **prioridad preliminar de revisión**, nunca diagnóstico.
2. **La IA no diagnostica ni decide sola.** El LLM propone; el psicólogo **acepta**.
3. 🆕 **El joven ve los datos del profesional desde `ACEPTADO`** (R5), y **no antes**.
4. 🆕 **El joven no tiene canal de contacto salvo que el psicólogo lo inicie** (R1). Que vea los
   datos **no** le da canal.
5. 🆕 **El profesional nunca ve la identidad del joven**: el joven es **seudónimo** (R1).
6. **Las notas internas profesionales no llegan al joven** (brief §25).
7. **El chat completo nunca entra en el reporte.**
8. **El rojo lo determinan reglas, nunca el LLM** (D2). El LLM solo **sube** categoría.
9. **Trazabilidad obligatoria**: `rulesetVersion` (APK), `modelVersion` + `promptVersion` (LLM).
10. **No se recomiendan tratamientos farmacológicos** (resumen §5).
11. **Todo acceso a un caso queda auditado**: quién vio qué y cuándo (`PR-018`).
12. 🆕 **Sin guardia 24/7** (Q8): ninguna superficie promete contacto inmediato. El rojo muestra
    instrucciones de emergencia y **números de crisis reales**.
13. 🆕 **Alcance demostrativo** (Q6/Q7): **sin datos reales ni sintéticos**. Una demo que simula
    una respuesta clínica inexistente está prohibida por `PR-001` §8.
14. 🆕 **La capa gratuita de Gemini no admite datos reales de menores** (`PR-INFRA` §4): bloqueo
    legal, no técnico. Antes de cualquier caso real hay que pasar a la capa de pago.

---

## 8. Preguntas abiertas (actualizado)

| # | Pregunta | Estado | Bloquea |
|---|---|---|---|
| P7 | ¿Cuántos profesionales reales? | **acotado**: demo ≤5 usuarios (Q6) | `PR-007`, `PR-008` |
| P8 | ¿Guardia 24/7? | ✅ **resuelto: no existe** | — |
| P9 | ¿Caso ALTO fuera de horario? | ✅ **resuelto por Q8**: emergencia + números reales | — |
| Q12 | ¿Proveedor LLM y no-reentrenamiento? | ⚠️ **parcial**: Google GenAI; **capa de pago obligatoria** antes de datos reales | `PR-005` |
| P11 | ¿Responsable legal del tratamiento de menores? | ⏳ abierto | `PR-018` |
| P12 | ¿La revocación elimina lo ya leído? | ⏳ abierto | `PR-019` |
| Q2 (PR-004) | ¿La ingesta acepta amarillo o solo rojo? | ⏳ abierto | `PR-005` |

---

## 9. Registro de cambios de esta revisión

| # | Cambio | Origen | Specs afectadas |
|---|---|---|---|
| 1 | Backend **Kotlin/Ktor → Go (o Node/Bun)** | `PR-INFRA` §3 | `PR-000`, todas |
| 2 | Frontera "sin red" → **red acotada a la API Joven** | `PR-003` §10 | `PR-000`, `PR-020` |
| 3 | **Una API, dos superficies**; árbol compartido A+C | `PR-003` §1 | `PR-000`, `PR-009`, `PR-018` |
| 4 | BD **Supabase** + RLS + Realtime; auth **Supabase Auth** | `PR-003` §13, Q9 | `PR-010`, `PR-018` |
| 5 | LLM **Google GenAI**; **capa de pago** antes de datos reales | `PR-003` §13, `PR-INFRA` §4 | `PR-005` |
| 6 | Máquina de estados **en español** (`RECIBIDO`…`CERRADO`) | `PR-003` §3.1 | `PR-009`, `PR-011`, `PR-012`, `PR-015` |
| 7 | **Joven ve datos del psicólogo desde `ACEPTADO`**; canal solo a iniciativa del psicólogo | `PR-003` §5–§7 (R1/R5) | `PR-007`, `PR-009`, `PR-019`, `PR-020` |
| 8 | **Sin guardia 24/7** | `PR-003` §15 (Q8) | `PR-009`, `PR-011`, `PR-019`, `TASK-019` |
| 9 | **Sin datos reales ni sintéticos**; demo ≤5 usuarios | `PR-003` §13 (Q6/Q7) | `PR-005`, `PR-007`, `PR-017`, `TASK-020` |
| 10 | Canal de contacto **baja prioridad**, ola posterior a `PR-016` | `PR-003` §6.2 (R2) | `PR-016`, `PR-019` |
| 11 | **Sin recuperación de cuenta** en el MVP | `PR-003` §11 (R4) | `PR-019` |
| 12 | `caseToken` = **ULID**; `contratoVersion` viaja en cada petición | `PR-004` §3, §8 | `PR-009`, `PR-020` |

---

## 10. Orden de las 18 specs (sin cambios de orden)

R1: `PR-005` → `PR-006` → `PR-007` → `PR-008` → `PR-009`.
R2: `PR-010` → `PR-011` → `PR-012` → `PR-013` → `PR-014` → `PR-015` → `PR-016` → `PR-017`.
R3: `PR-018` → `PR-019` → `PR-020`. Transversales: `TASK-019`, `TASK-020`.

## 11. Fuera del alcance de C

Todo el APK juvenil (A y B) · la firma clínica de `PR-001` (persona) · el co-diseño con
adolescentes, `TASK-022` (persona / ONG) · la contratación del proveedor LLM (ONG / legal).
