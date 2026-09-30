# Puente Red — entregables del Agente C

**Producto:** Portal profesional / Puente Red
**Agente:** C (`PLAN-3-AGENTES.md` §4.1)
**Rama:** `agente/C-red` (rebasada sobre `main`)
**Estado:** Fase 0 — especificación **reconciliada y migrada a la plantilla oficial**. Nada construido.

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

## 2. Las 18 specs

| Ola | Specs |
|---|---|
| **R1** (backend de triaje) | `PR-005`, `PR-006`, `PR-007`, `PR-008`, `PR-009` |
| **R2** (portal) | `PR-010`, `PR-011`, `PR-012`, `PR-013`, `PR-014`, `PR-015`, `PR-016`, `PR-017` |
| **R3** (transversal) | `PR-018`, `PR-019`, `PR-020` |
| Transversales | `TASK-019`, `TASK-020` |

Todas en estado **🔍 En revisión** — esperan la revisión cruzada de A y B (`PLAN-3-AGENTES.md`
§3.0.3–0.4). **Nadie construye hasta que estén Aprobadas.**

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

### ✅ Cerrados el 2026-09-30

| Bloqueo | Cómo se cerró |
|---|---|
| Firma clínica de `PR-001` §5–7 | **firmado** (confirmado por el product owner) → desbloquea `PR-005`, `PR-006`, `PR-007`, `PR-009`, `TASK-019` |
| Gemini de pago antes de casos reales | **asegurado** → resuelto el requisito de `PR-INFRA` §4 |

### ⏳ Abiertos

| Bloqueo | Quién lo cierra |
|---|---|
| **Publicar `PR-001` firmado en `main`** — el repo lo tiene como `BORRADOR` con marcadores `[VALIDAR]` | A |
| Ratificación de `PR-000` rev. 2 y del reparto del backend | A |
| Revisión cruzada de las 18 specs | A y B |
| P11 (responsable legal de datos de menores) — también `TASK-021` Q3 | legal |
| P12 y la revocación vs derivación en curso | legal |
| ¿`RESUELTO` y `CERRADO` son dos estados o uno? | A |
