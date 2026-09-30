# Contrato de integración — Puente Joven

**Tarea:** `TASK-00A` · **Autor:** Agente A — Núcleo y contratos · **Fecha:** 2026-09-30
**Ola:** 0 (bloqueante) · **Punto de sincronización:** S1
**Propósito:** congelar los archivos que **todos** necesitan y definir la única vía por la que
un agente puede pedir cambios en ellos.

> **Sin este contrato, varios agentes editan los mismos ficheros y hay conflicto garantizado.**
> Es la razón por la que existe el rol de A.

---

## 1. Archivos compartidos y su dueño

**Dueño único: A.** Nadie más los edita, ni en su rama ni en su worktree.

| # | Archivo | Qué controla |
|---|---|---|
| 1 | `settings.gradle.kts` | `include(":feature:X")` |
| 2 | `app/build.gradle.kts` | `implementation(project(...))`, flavours |
| 3 | `app/.../navigation/PuenteJovenNavHost.kt` | montaje de rutas |
| 4 | `feature/home/.../HomeScreen.kt` | enlaces de entrada desde Inicio |
| 5 | `core/data/.../repository/Repositories.kt` | **contratos** de datos |
| 6 | `core/data/.../local/LocalPuenteRepository.kt` | implementación local + persistencia |
| 7 | `core/navigation/.../AppDestination.kt` | **rutas tipadas** (`@Serializable`) |

**Congelado (no se edita, se pide):** `core/designsystem/**`.

> **Hallazgo de A (2026-09-30):** el plan listaba **6** archivos, pero **faltaba
> `AppDestination.kt`**. Añadir una ruta nueva lo toca, así que también es de A. **Son 7.**

### 1.1 Árbol del backend compartido (añadido el 2026-09-30)

`PR-003` §1 decide **una API con dos superficies**, lo que convierte `puente-red/backend/` en un
árbol **compartido entre A y C** — algo que `PLAN-3-AGENTES.md` §2.2 no preveía (sus 7 archivos
son todos del APK). Reparto **ratificado** en `REVISION-C.md` §5.3:

| Ruta | Dueño | Regla |
|---|---|---|
| `backend/routes/joven/**` | **A** | C solo lee |
| `backend/routes/profesional/**` | **C** | A solo lee |
| `backend/core/**` | **C** | Pipeline de triaje (`PR-005`–`PR-009`) |
| `backend/shared/**` (modelos, cliente Supabase, middleware, `contratoVersion`, fixtures del contrato) | **A** | C declara cambios, no los aplica |
| `backend/main` y configuración de despliegue | **A** | — |
| `puente-red/portal/**` | **C** | Portal profesional |

**La regla de declaración de §2 aplica igual aquí:** un agente no edita lo que no es suyo.

---

## 2. Mecanismo: declaración de necesidades

Un agente **no edita** los archivos de §1. Los **declara** en
`deliverables/<TASK-ID>/NECESIDADES.md`, con este formato:

```markdown
# NECESIDADES — <TASK-ID>

**Agente:** <B|C> · **Fecha:** YYYY-MM-DD · **Spec:** specs/<archivo>.md

## 1. Módulo nuevo
:feature:conversation

## 2. Dependencia de build (la aplica A)
implementation(project(":feature:conversation"))

## 3. Ruta nueva en el NavHost
ConversationRoute → ConversationScreen(navigator)

## 4. Entrada desde Home
Tarjeta "Me está pasando algo" → ConversationRoute

## 5. Métodos de repositorio
- ConversationRepository.appendYouthMessage(...)   [nuevo]
- YouthRepository.observeProfile()                   [existente, sin cambios]

## 6. Componentes del design system
- (si falta alguno, se pide; NO se improvisa uno nuevo)

## 7. Otros (permisos, flags, migraciones)
```

**Regla:** si una necesidad no está declarada, no existe. A no adivina.

---

## 3. Flujo de integración (orden estricto)

1. **B o C** escribe su `NECESIDADES.md` en su worktree.
2. **A** lo revisa y lo aplica **en su worktree** (rama `agente/A-nucleo`).
3. **A** avisa ("listo").
4. **B o C** **rebasa (rebase)** su rama sobre `main` ya integrado.
5. **A** compila y ejecuta `test` **una vez por tarea** (serializado, nunca en paralelo).
6. **A** hace el **merge**. Es el único que hace merge.

```
B/C: NECESIDADES.md ──► A aplica ──► A avisa ──► B/C rebasa sobre main ──► A compila+test ──► merge
```

**Nunca al revés.** B y C no tocan `main` directamente.

---

## 4. Reglas de no-colisión

1. **Un worktree por agente** (`../pj-agenteA`, `../pj-agenteB`, `../pj-agenteC`). Nunca dos
   `gradlew` sobre el mismo checkout: hay precedente de builds rotos (`NoSuchFileException` en KSP).
2. **Nunca editar los 7 archivos de §1** — ni "un cambio pequeño".
3. **`core/designsystem/**` está congelado.** Si falta un componente, se pide a A.
4. **Nada de red fuera de la API Joven.** El APK habla **solo** con la API Joven (`PR-003` §10);
   `:core:network` se añade **solo** en el flavour `remote`. `ModuleGraphGuardTest` vigila esto.
5. **`gradle.properties` no se commitea**: lleva la ruta del JDK de esta máquina.

---

## 5. Relación con los otros contratos

| Necesidad | Dónde está el contrato |
|---|---|
| Qué cruza entre el APK y Puente Red | `PR-003` |
| Cómo se ingesta un reporte y se emite el `caseToken` | `PR-004` |
| Cómo se escribe una spec | `specs/_PLANTILLA-SPEC.md` |
| Qué tarea existe y de quién es | `specs/MATRIZ-TRAZABILIDAD.md` |

---

## 6. Criterios de aceptación de este contrato

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Ningún agente distinto de A ha modificado los 7 archivos de §1 | revisión de `git log` por archivo |
| 2 | Toda feature nueva tiene su `NECESIDADES.md` | revisión de `deliverables/<ID>/` |
| 3 | No hay dos ramas escribiendo el mismo archivo compartido | revisión de `git diff` antes del merge |
| 4 | El merge a `main` lo hace solo A | historial de `main` |
