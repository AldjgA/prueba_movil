# Puente Red — entregables del Agente C

**Producto:** Portal profesional / Puente Red
**Agente:** C (`PLAN-3-AGENTES.md` §4.1)
**Rama:** `agente/C-red` (rebasada sobre `main`)
**Estado:** Fase 0 **cerrada, aprobada y mergeada** (PR #1, `c979e4f`). Fase 1 pendiente del esqueleto del backend.

---

## 1. Dónde está cada cosa (cambió el 2026-09-30)

A publicó `TASK-000`, que fija la **plantilla y la ubicación** de las specs. C migró las suyas.

| Artefacto | Ubicación |
|---|---|
| **Las 18 specs de C** | `specs/PR-005-*.md` … `specs/TASK-020-*.md` ← **movidas aquí** |
| Plantilla oficial | `specs/_PLANTILLA-SPEC.md` (de A) |
| Matriz de trazabilidad | `specs/MATRIZ-TRAZABILIDAD.md` (de A; C actualizó sus filas) |
| Contrato de integración | `CONTRATO-DE-INTEGRACION.md` (de A) |
| Arquitectura de Puente Red | `puente-red/deliverables/PR-000-ARQUITECTURA-PUENTE-RED.md` |
| Declaración de necesidades | `puente-red/deliverables/PR-000/NECESIDADES.md` (formato del contrato §2) |
| Informe de revisión de A | `puente-red/deliverables/REVISION-A.md` |
| **Revisión de A sobre la Fase 0 de C** | `REVISION-C.md` (raíz) — veredicto **"Aprobada con hallazgos"** |

## 2. Las 18 specs

| Ola | Specs |
|---|---|
| **R1** (backend de triaje) | `PR-005`, `PR-006`, `PR-007`, `PR-008`, `PR-009` |
| **R2** (portal) | `PR-010`, `PR-011`, `PR-012`, `PR-013`, `PR-014`, `PR-015`, `PR-016`, `PR-017` |
| **R3** (transversal) | `PR-018`, `PR-019`, `PR-020` |
| Transversales | `TASK-019`, `TASK-020` |

Todas **✅ Aprobadas** por A (`REVISION-C.md`). La Fase 0 queda cerrada y mergeada en `main`
(PR #1, `c979e4f`).

## 3. Stack decidido por A (`PR-INFRA-RECOMENDACION`)

| Capa | Decisión |
|---|---|
| API | **Go** (o Node/Bun + Hono). **Sin framework JVM** — 256 MB no lo admite |
| Portal | **TypeScript + React + Vite** (reutiliza el prototipo `Pro*`) |
| Base de datos | **Supabase** (Postgres + RLS + Realtime), `sa-east-1` |
| Auth profesional | **Supabase Auth** |
| LLM | **Google GenAI** — ⚠️ capa de pago obligatoria antes de datos reales |
| Escala | **Demo, ≤5 usuarios recurrentes, sin datos reales ni sintéticos** |

## 4. Reglas que C respeta

- **Un worktree por agente** (`PLAN-3-AGENTES.md` §2.1, `CONTRATO-DE-INTEGRACION.md` §4). Nota: C
  trabajó sobre la rama en el checkout principal por ser el único agente activo; cuando A y B
  corran en paralelo, cada uno necesita su worktree.
- **Los 7 archivos compartidos no se editan**: se declaran (`NECESIDADES.md`).
- **`core/designsystem/**` congelado.**
- **A es el único que hace merge.**
- **Nada de red fuera de la API Joven** (`PR-003` §10).

## 5. Bloqueos

### ✅ Cerrados

| Bloqueo | Cómo se cerró |
|---|---|
| Firma clínica de `PR-001` §5–7 | **firmado** (confirmado por el dueño). A deja constancia en `REVISION-C.md` §5.5: `PR-001` §5–§7 es **fuente de verdad vinculante** aunque el fichero siga rotulado `BORRADOR` |
| Gemini de pago antes de casos reales | **asegurado** → resuelto el requisito de `PR-INFRA` §4 |
| `PR-000` rev. 2, `P10`, reparto del backend, fixtures | ✅ **ratificados** (`REVISION-C.md` §4 y §5.3) |
| Las 18 specs | ✅ **aprobadas** (`REVISION-C.md`) |
| Hallazgos F1–F4 | de **A** (`REVISION-C.md` §6); ninguno exige rehacer una spec de C |

### ⏳ Abiertos — bloquean el arranque de la Fase 1

| Bloqueo | Quién lo cierra |
|---|---|
| **El backend no existe**: `puente-red/backend/` no tiene módulo. `backend/main` y `shared/**` son de A → **C no puede compilar `backend/core/**`** | A |
| ⚠️ **Go no está instalado** (solo Node v22.22.2). C propone **Node/Bun + Hono** (`PR-INFRA` §3 lo permite) | A |
| P11 (responsable legal) — también `TASK-021` Q3 | legal |
| P12 y la revocación vs derivación en curso | legal |
| F1 (proyección de estados) y F2/F4 (guarda de secretos y CI para `puente-red/**`) | A (`TASK-014`) |
