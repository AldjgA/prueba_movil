# Puente Red — entregables del Agente C

**Producto:** Portal profesional / Puente Red
**Agente:** C (`PLAN-3-AGENTES.md` §4.1)
**Rama:** `agente/C-red`
**Estado:** Fase 0 — especificación. **Nada construido todavía.**

---

## Qué hay aquí

Este directorio contiene la **Fase 0** del Agente C: las specs de sus 18 tareas, más la spec
fundacional que el plan no preveía.

| Documento | Qué es |
|---|---|
| `PR-000-ARQUITECTURA-PUENTE-RED.md` | Fundacional: dónde vive el portal, stack, frontera con el APK, `P10` resuelto |
| `PR-000/NECESIDADES.md` | Declaración de necesidades a A (§2.3 del plan) |
| `PR-005/SPEC.md` … `PR-020/SPEC.md` | 16 specs de la cola de C |
| `TASK-019/SPEC.md`, `TASK-020/SPEC.md` | Las 2 tareas transversales de C |

**Total: 18 specs + 1 fundacional + 1 declaración.**

## Orden de lectura sugerido

1. `PR-000-ARQUITECTURA-PUENTE-RED.md` — sin esto, las demás heredan supuestos contradictorios.
2. `PR-000/NECESIDADES.md` — lo que C necesita de A.
3. Backend (R1): `PR-005` → `PR-006` → `PR-007` → `PR-008` → `PR-009`.
4. Portal (R2): `PR-010` → `PR-011` → `PR-012` → `PR-013` → `PR-014` → `PR-015` → `PR-016` → `PR-017`.
5. Transversal (R3): `PR-018` → `PR-019` → `PR-020`.
6. Evaluación: `TASK-019` → `TASK-020`.

## Estado por spec

| Spec | Ola | Estado | Bloqueo principal |
|---|---|---|---|
| PR-000 | — | propuesta | ratificación de A |
| PR-005 | R1 | spec | `PR-001` §5–6 firmado |
| PR-006 | R1 | spec | `PR-001` §5–6 firmado |
| PR-007 | R1 | spec | `PR-001` §7; P7 (nº de profesionales) |
| PR-008 | R1 | spec | P6 (pesos) |
| PR-009 | R1 | spec | P8/P9 (guardia) |
| PR-010 | R2 | spec | Q8 (multi-institución) |
| PR-011 | R2 | spec | — |
| PR-012 | R2 | spec | — |
| PR-013 | R2 | spec | `PR-003` (A) |
| PR-014 | R2 | spec | — |
| PR-015 | R2 | spec | retención del timeline |
| PR-016 | R2 | spec | consentimiento para derivar a tercero |
| PR-017 | R2 | spec | `k` anonimato con piloto pequeño |
| PR-018 | R3 | spec | P11 (responsable legal) |
| PR-019 | R3 | spec | `PR-003` (A); P12 |
| PR-020 | R3 | spec | `PR-003` (A) |
| TASK-019 | R3 | spec | P8 (¿hay guardia?) |
| TASK-020 | R3 | spec | Q7 (piloto) |

## Reglas que C respeta

- **Un worktree por agente** (`PLAN-3-AGENTES.md` §2.1). Nota: C ha trabajado sobre la rama
  `agente/C-red` en el checkout principal porque es el único agente activo; cuando A y B corran
  en paralelo, cada uno necesita su worktree.
- **Propiedad exclusiva** (§2.2): C solo escribe bajo `puente-red/`.
- **Declaración de necesidades** (§2.3): ver `PR-000/NECESIDADES.md`.
- **A es el único que hace merge** (§2.3).
