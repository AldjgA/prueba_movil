# Puente Red — entregables del Agente C

**Producto:** Portal profesional / Puente Red
**Agente:** C (`PLAN-3-AGENTES.md` §4.1)
**Rama:** `agente/C-red` (rebasada sobre `main` tras la publicación de A)
**Estado:** Fase 0 — especificación **reconciliada**. **Nada construido todavía.**

---

## Qué hay aquí

Fase 0 del Agente C: las specs de sus 18 tareas, la spec fundacional, y la reconciliación con la
revisión del Agente A del 2026-09-30.

| Documento | Qué es |
|---|---|
| **`REVISION-A.md`** | 🆕 Qué publicó A, qué guardrails cambió y cómo se reconcilió cada spec |
| `PR-000-ARQUITECTURA-PUENTE-RED.md` | Fundacional (**rev. 2**): ubicación, stack, frontera, `P10`, reparto del backend |
| `PR-000/NECESIDADES.md` | Declaración de necesidades a A (§2.3), actualizada |
| `PR-005/SPEC.md` … `PR-020/SPEC.md` | 16 specs de la cola de C |
| `TASK-019/SPEC.md`, `TASK-020/SPEC.md` | Las 2 tareas transversales de C |

**Total: 18 specs + 1 fundacional + 1 declaración + 1 informe de revisión.**

## Orden de lectura sugerido

1. **`REVISION-A.md`** — qué cambió A y por qué mis specs se movieron.
2. `PR-000-ARQUITECTURA-PUENTE-RED.md` — sin esto, las demás heredan supuestos contradictorios.
3. `PR-000/NECESIDADES.md` — lo que C necesita de A.
4. Backend (R1): `PR-005` → `PR-006` → `PR-007` → `PR-008` → `PR-009`.
5. Portal (R2): `PR-010` → `PR-011` → `PR-012` → `PR-013` → `PR-014` → `PR-015` → `PR-016` → `PR-017`.
6. Transversal (R3): `PR-018` → `PR-019` → `PR-020`.
7. Evaluación: `TASK-019` → `TASK-020`.

## Stack decidido por A (`PR-INFRA-RECOMENDACION`)

| Capa | Decisión |
|---|---|
| API | **Go** (o Node/Bun + Hono). **Sin framework JVM** — 256 MB no lo admite |
| Portal | **TypeScript + React + Vite** (reutiliza el prototipo `Pro*`) |
| Base de datos | **Supabase** (Postgres + RLS + Realtime), `sa-east-1` |
| Auth profesional | **Supabase Auth** |
| LLM | **Google GenAI** — ⚠️ capa de pago obligatoria antes de datos reales |
| Escala | **Demo, ≤5 usuarios recurrentes, sin datos reales ni sintéticos** |

## Estado por spec

| Spec | Ola | Reconciliación | Bloqueo principal |
|---|---|---|---|
| PR-000 | — | **reescrita (rev. 2)** | ratificación de A |
| PR-005 | R1 | **reescrita** | `PR-001` §5–6 firmado; **Gemini de pago** |
| PR-006 | R1 | nota | `PR-001` §5–6 firmado |
| PR-007 | R1 | nota | `PR-001` §7; P7 (acotado a demo) |
| PR-008 | R1 | nota | P6 (pesos) |
| PR-009 | R1 | **reescrita** | `PR-001` §7 (tiempos) |
| PR-010 | R2 | **reescrita** | Q8 (multi-institución) |
| PR-011 | R2 | nota | — |
| PR-012 | R2 | nota | — |
| PR-013 | R2 | nota | — |
| PR-014 | R2 | nota | — |
| PR-015 | R2 | nota + enum | retención del timeline |
| PR-016 | R2 | nota | consentimiento para derivar a tercero |
| PR-017 | R2 | nota | demo sin datos: nada que agregar |
| PR-018 | R3 | nota | P11 (responsable legal) |
| PR-019 | R3 | **reescrita** | P12; revocación vs derivación en curso |
| PR-020 | R3 | **reescrita** | ubicación de las fixtures |
| TASK-019 | R3 | nota | sin guardia 24/7 → solo en horario |
| TASK-020 | R3 | nota | escala demo: no medible aún |

## Reglas que C respeta

- **Un worktree por agente** (§2.1). Nota: C trabajó sobre la rama en el checkout principal por
  ser el único agente activo; cuando A y B corran en paralelo, cada uno necesita su worktree.
- **Propiedad exclusiva** (§2.2): C escribe solo bajo `puente-red/portal`, `puente-red/backend/core`,
  `puente-red/backend/routes/profesional` y `puente-red/deliverables`.
- **Declaración de necesidades** (§2.3): ver `PR-000/NECESIDADES.md`.
- **A es el único que hace merge** (§2.3).
