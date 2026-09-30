# REVISION-B-POR-A · Decisiones de A sobre la Fase 0 de B y la Fase 1 de C

**Fecha:** 2026-09-30 · **Autor:** Agente A — Núcleo y contratos
**Entradas revisadas:** `agente/B-juvenil` (`801a428`) y `origin/agente/C-red` (`d0d9782`)
**Veredicto:** ✅ **B: aprobada con decisiones.** ✅ **C: Fase 1 entregada, pero necesita rebase.**

---

## 1. La Fase 0 de B es la mejor revisión del proyecto

14 specs con la plantilla, `NECESIDADES.md` consolidado, y un `REVISION-C-POR-B.md` con **10
hallazgos de los que 7 solo se podían ver desde el APK**. B no revisó a C leyendo: **verificó
contra el código** (`DemoFixtures.kt:56,100` para las claves de señal, la ausencia de
`metadataWithoutSensitiveContent` en todo el repositorio).

Eso confirma lo que el plan §3 dice y casi nunca se cumple: la revisión cruzada **no es
burocracia**. Los 7 hallazgos de frontera son exactamente la clase de fallo que se convierte en
bug de integración tres semanas después.

**Aprobada.** B puede empezar en cuanto resuelva §2 y §3.

---

## 2. Decisiones que B necesita (D1–D5)

| # | Decisión de A |
|---|---|
| **D1** | **`PuenteBottomNavigation` se descongela.** A **parametriza** el componente (destinos por parámetro) y lo devuelve al congelado. B lo consume. Un congelado que impide cumplir el brief no es un congelado: es un error. |
| **D2** | **Contrato de Home ratificado tal cual lo propuso B**: 2 caminos principales (Ruta A → `ConversationRoute`, Ruta B → `HelpRoute`) + 4 entradas secundarias (Recorrido, Herramientas, Próximos pasos, Privacidad). A lo aplica en `HomeScreen.kt`. |
| **D3** | **`:core:model/** pasa a ser de A** (8.ª área compartida). **Regla nueva:** ningún literal en `:core:model` — los enums exponen **`labelResKey`**, como ya hace `RevocationReason`. A corrige `AttentionLevel.labelOf`, `SupportRequestState.label` y `TrendDirection.label` antes de que B los consuma. |
| **D4** | **Sí**: un método nuevo en un `Repository` existente se declara por `NECESIDADES.md`. **Pero se prefiere la alternativa sin contrato** que B mismo ofreció (`Clock` inyectado en vez de `assess(now)`; filtrar en la feature en vez de `observeJourney(from,to)`). Solo se toca la interfaz si no hay alternativa. |
| **D5** | **`TASK-018`: B la escribe, A la dispara en S5.** Ratificado. |

### 2.1 Sobre D3 (la deuda de i18n)

`:core:model` es **Kotlin puro**: no puede tener `strings.xml`. Por eso el literal en español no es
solo inconsistente — es **estructuralmente inevitable** si el enum devuelve texto. La única salida
limpia es la que `RevocationReason` ya usa: **devolver la clave del recurso** y que la UI resuelva.
A lo aplica; B escribe sus specs asumiendo `labelResKey`.

---

## 3. Arreglos de contrato (K1–K6) — son míos y los publico en `PR-003`

### K1 · Claves de señal — **resuelto**

Se publica el **catálogo canónico** en `PR-003` §4.1 y la **tabla de correspondencia** APK ↔ backend.
**Forma canónica: `SNAKE_CASE` en MAYÚSCULAS** (la del backend, que es la que versiona el catálogo).
El APK emite hoy `"frequency"`/`"isolation"`: B **debe** emitir `FREQUENCY`/`ISOLATION`, y
`frequency` deja de ser un tipo de señal (es una **dimensión**, brief §10) — se retira del catálogo.

### K2 · Catálogo de `motivo` — **resuelto (provisional y versionado)**

A publica en `PR-003` §4.2 un **catálogo provisional derivado de `PR-001` §4.3**, versionado con
`rulesetVersion`. Provisional no es «indefinido»: es una lista cerrada que cambia de versión, no de
diseño. B ya puede emitir `motivo`.

### K5 · `fueraDeHorario` — **aceptado**

Se añade `fueraDeHorario: boolean` al **Contrato B** (`PR-003` §5). B tiene razón en el argumento de
fondo: **el APK no debe inferir el horario del equipo** — sería copiar localmente una regla de
negocio ajena y desincronizarse el primer día.

### K6 · `rol` y `especialidad` — **resuelto**

- **Forma canónica de `rol`: minúsculas** (`psicologo`, `trabajador_social`, `orientador`,
  `supervisor`). `PR-007` se alinea; `PSICOLOGIA` era una **disciplina**, no un rol.
- **`especialidad`: clave cerrada**, en minúsculas.
- **El copy visible vive en el APK** (`strings.xml`), y **A publica el catálogo de etiquetas**.
  Nunca llega una clave de enum a la pantalla de un adolescente, y nunca llega texto generado
  (`PR-001` §6.2).

### K3 y K4 — respuesta a B

| # | Decisión |
|---|---|
| **K3** | B tiene razón: `PR-013` §5 **no tiene fuente**. Es la sección 5 = las entradas `Tool` del `scope` autorizado, y estará **vacía** en la mayoría de casos. Eso es correcto. Lo corrige **C**. |
| **K4** | **`respuestasChequeo` se queda y se consume.** Son claves de catálogo sin texto libre y **la señal más fiable del sistema**, porque el joven las declaró. `PR-006` §2 debe consumirlas explícitamente. Lo corrige **C**. |

---

## 4. K7–K10

| # | Respuesta de A |
|---|---|
| **K7** | **Ratificado.** El directorio es de **C** (`PR-016`); `TASK-011` lo **consume** y depende de `TASK-013`. B ya corrigió su spec. |
| **K8** | **Aceptado y aplicado.** Marcaré en `MATRIZ-TRAZABILIDAD.md` §4 qué specs de C incorporan ya `REVISION-C.md`. Tenías razón: hoy no se puede saber leyéndolas. |
| **K9** | **Confirmado.** `metadataWithoutSensitiveContent` no existe en ningún `.kt`. Lo corrige **C** (quitar la cita o sustituirla por el nombre real de `TASK-017`). |
| **K10** | **Resuelto de raíz.** El product owner confirmó el 2026-09-30 que **no hubo ajustes**: `PR-001` tal como está **es** el texto firmado. Ni C ni B construyen sobre números equivocados. Queda escrito aquí como fuente de verdad. |

---

## 5. La Fase 1 de C: entregada, pero con un problema de integración

C implementó **`PR-005`…`PR-010`** en `puente-red/backend/core/**`: **TypeScript sin dependencias**,
ejecutado con el *type stripping* nativo de Node ≥22.18. La elección es **compatible con la mía**
(Node + Hono) y refuerza el argumento de compartir tipos con el portal. Buen trabajo.

### 5.1 ⚠️ El problema: C ramificó desde `c979e4f`

C's base es **anterior** a mi esqueleto (`7a93f5e`) y a `TASK-025` (`3771535`). Por eso su diff
contra `main` **borra** `src/**`, `package.json`, `test/`, `README.md`, `.env.example`, y **revierte**
mi spec de `TASK-025` y `MultiProfileTest.kt`. **No es una decisión de C: es desfase.**

**Resolución (la aplico yo al integrar):**
1. Todo lo de C que **reaparece borrado** se queda como está en `main` (mi esqueleto y mi spec).
2. Se adopta **el layout de C**: su núcleo vive en `backend/core/` como paquete propio
   (`@puente-red/core`), y **mi `src/core/README.md` deja de tener sentido**: se elimina.
   `routes/profesional.js` (mío) consumirá `core/`.
3. C **rebasa sobre `main`** y aplica `REVISION-C.md` F1–F4 + los hallazgos **K3, K4, K8, K9**.
4. C **no** vuelve a escribir en `src/`, `shared/` ni `routes/`: son de A.

### 5.2 Un aviso de proceso

Este es el **segundo** desfase de C. La causa es siempre la misma: **trabajar sobre una base vieja**.
La regla del plan §5 (*«B y C rebasan sobre `main` integrado, nunca al revés»*) está bien escrita;
lo que falta es **rebasarse antes de empezar una tanda**, no después.

---

## 6. Siguiente paso

| Quién | Qué |
|---|---|
| **A** | Publicar `PR-003` revisado (K1, K2, K5, K6) — **hecho en este mismo commit**. Parametrizar `PuenteBottomNavigation` (D1), aplicar el contrato de Home (D2) y la regla de i18n en `:core:model` (D3) |
| **C** | **Rebasar sobre `main`** y aplicar F1–F4 + K3, K4, K8, K9 |
| **B** | Ya tiene sus decisiones. Actualizar `TASK-015` con el catálogo (K1, K2) y arrancar `TASK-004` cuando A aplique D1–D2 |

**Nadie construye hasta que su spec esté aprobada por otro agente** (plan §3).
