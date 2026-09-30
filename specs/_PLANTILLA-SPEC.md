# Plantilla de especificación SDD — Puente Joven

**Tarea:** `TASK-000` · **Autor:** Agente A — Núcleo y contratos · **Fecha:** 2026-09-30
**Uso:** copiar el bloque de §3 a `specs/<ID>-<slug>.md` y rellenarlo.
**Regla:** esta plantilla la cambia **solo A**. Si falta un campo, se pide; no se improvisa.

> En SDD **primero se escribe la spec y otro agente la revisa**. Nadie construye hasta que su
> spec está **Aprobada** (Fase 0 del `PLAN-3-AGENTES.md`).

---

## 1. Cómo se usa

1. Copia el bloque de §3 a `specs/<ID>-<slug>.md` (ej. `specs/TASK-004-conversacion.md`).
2. Rellena **todas** las secciones. Si algo no aplica, escribe `—` y di por qué.
3. Pide revisión: **la spec la revisa otro agente** (revisión cruzada).
4. Solo cuando pasa a **Aprobada** se puede construir.

## 2. Reglas de la casa (aplican a toda spec)

| # | Regla | Origen |
|---|---|---|
| 1 | Identificadores de código en **inglés**; copy de producto en **español** | P11 |
| 2 | Todo texto visible va por **recurso** (`strings.xml`), nunca literal en Kotlin | P6 |
| 3 | Cada criterio de aceptación dice **cómo** se verifica (unitaria / instrumentada / RLS / revisión visual) | SDD |
| 4 | Los **6 archivos compartidos** no se editan: se **declaran** en `NECESIDADES.md` (ver `CONTRATO-DE-INTEGRACION.md`) | TASK-00A |
| 5 | Guardrails vinculantes: verde/amarillo/rojo = **prioridad preliminar, nunca diagnóstico**; la IA no diagnostica | `PR-001` §2 |
| 6 | Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`) | Guardrails #5/#8 |

---

## 3. Plantilla (copiar desde aquí)

```markdown
# <ID> · <Título>

**Estado:** Borrador | En revisión | Aprobada
**Autor:** <agente> · **Revisor:** <otro agente>
**Fecha:** YYYY-MM-DD
**Ola:** <0|1|2|3> · **Depende de:** <IDs> · **Bloquea:** <IDs>

## 1. Contexto
Por qué existe esta tarea y a qué parte del producto sirve.

## 2. Alcance
### Dentro
- …
### Fuera
- … (explícito: lo que NO se debe tocar)

## 3. Módulo y propiedad
- Módulo: `feature:<nombre>` (o `core:<nombre>`)
- Dueño: <agente>
- Archivos compartidos que necesita **declarar** (no editar): …

## 4. Contratos de datos
- Interfaces de `Repositories.kt` que consume: …
- Métodos **nuevos** que necesita (se declaran en `NECESIDADES.md`): …

## 5. Criterios de aceptación (verificables)
| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | … | unitaria / instrumentada / RLS / revisión visual |

## 6. Guardrails aplicables
Qué restricciones de producto son vinculantes aquí (`PR-001` §2, `PR-003` §9).

## 7. Referencia visual
Pantalla(s) del prototipo web (`Propuesta UX_UI Puente Joven/`) y qué se reutiliza del design system.

## 8. Dependencias
- Bloquea: …
- Bloqueado por: …
- Specs relacionadas: …

## 9. Preguntas abiertas
…

## 10. Definition of Done
- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`./gradlew assembleDemoDebug`)
- [ ] Pruebas de los criterios de aceptación en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado
- [ ] Sin secretos ni endpoints hardcodeados (`ModuleGraphGuardTest`)
```

---

## 4. Notas para quien rellena

- **No dupliques** lo que ya vive en un contrato: si toca la frontera Joven↔Red, referencia
  `PR-003` en vez de redefinirlo.
- **Los criterios de aceptación son el corazón.** Un criterio sin forma de verificarse no es un
  criterio: es un deseo.
- Si detectas que la spec depende de algo no decidido, **no lo inventes**: abre una pregunta
  abierta (§9) y avisa a A.
