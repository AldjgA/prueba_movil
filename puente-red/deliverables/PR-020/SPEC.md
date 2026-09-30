# PR-020 · Pruebas de contrato entre los dos productos

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-003` (contratos A/B/C, de A), `PR-004`, `PR-019`
**Bloquea a:** `S5` (integración final) y el criterio de avance del MVP
**Reconciliado:** 2026-09-30 — **reescrito** sobre los contratos reales de `PR-003` §4–§6

---

## Contexto

Los dos productos comparten **un backend** pero se **gestionan de forma independiente**
(`PR-003` §1): dos superficies de API con ciclo de vida propio. El APK habla **solo** con
`/joven`; el portal **solo** con `/profesional`.

Eso significa que la frontera **no la protege el compilador**: la protegen el contrato versionado
(`PR-003`) y estas pruebas. Sin ellas, la primera modificación de cualquiera de los dos lados
rompe la integración, y —peor— puede romper una invariante de privacidad sin que nadie lo note.

---

## 1. Qué se verifica (los tres contratos de `PR-003`)

### Contrato A — Reporte (Joven → Backend) · `PR-003` §4

- `POST /joven/casos` acepta un paquete emitido por el APK (`TASK-015`, de B).
- El cuerpo **no contiene** `ProfileId`, alias, MAC ni identificador de dispositivo.
- `motivo` son **claves de catálogo**, nunca texto libre.
- `resumenAutorizado.scope` es cerrado y **no excede** el `consentimiento.scope`.
- `contratoVersion` viaja y una versión no soportada produce **rechazo explícito**.

### Contrato B — Estado del caso (Backend → Joven) · `PR-003` §5

- `psicologo` es `null` **hasta** `ACEPTADO` y **no nulo desde** `ACEPTADO` (R5).
- `canalContacto` es `null` **hasta** `CONTACTO_HABILITADO` (R1).
- 🆕 **Independencia:** que `psicologo` no sea nulo **no** implica que `canalContacto` lo sea.
- Los estados mapean a `SupportRequestState` del APK sin huérfanos.

### Contrato C — Datos del psicólogo · `PR-003` §6.1

- `nombreVisible`, `rol`, `especialidad` — **nunca** datos personales del profesional.
- `rol` ∈ {`psicologo`, `trabajador_social`, `orientador`, `supervisor`}.

### Invariantes de privacidad · `PR-003` §9 (las 10)

Se prueban **una por una**, con fixture negativa. Destacadas:

| Invariante | Prueba |
|---|---|
| `consent.scope ⊆ summary.scope` | fixture con scope excedido → **debe fallar** |
| El chat completo nunca entra en el reporte | búsqueda de subcadenas del chat en el payload |
| El `ProfileId` nunca viaja junto al contenido | aserción de exclusión |
| El LLM no degrada un rojo | entrada `ROJO` → salida siempre `ALTO` |
| El joven no ve datos del profesional antes de `ACEPTADO` | Contrato B con estado `EN_COLA` → `psicologo == null` |
| El joven no tiene canal salvo iniciativa del psicólogo | `ACEPTADO` sin `CONTACTO_HABILITADO` → `canalContacto == null` |
| El joven nunca revela identidad al profesional | el payload de `/profesional` no contiene `ProfileId` ni alias |
| El flujo rojo funciona offline | el APK muestra emergencia y encola sin red |
| Ningún contrato profesional se compila en el APK | `ModuleGraphGuardTest` (de A, `TASK-013`) |

---

## 2. Versionado

- `contratoVersion` en cada petición y respuesta (`PR-003` §8).
- Cambio incompatible → versión mayor nueva; el backend sostiene la anterior durante la ventana
  de actualización del APK.
- `rulesetVersion`, `modelVersion` y `promptVersion` son **trazabilidad**, no versionado.
- 🆕 Una fixture por versión soportada; un cambio incompatible en `PR-003` **rompe el CI**.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/contract-tests` (dueño: **C**, en coordinación con A y B)
- **Ubicación de las fixtures:** propuesta de C — **en `PR-003` (A)**, con C como consumidor.
  Pendiente de confirmación (ver `NECESIDADES.md`).

```
contract-tests/
  fixtures/
    contrato-a.v1.json               // válido
    contrato-a.v1-nopii.json         // sin PII: debe pasar
    contrato-a.v1-con-profileid.json // DEBE FALLAR
    contrato-a.v1-scope-excedido.json// DEBE FALLAR
    contrato-a.v1-version-mala.json  // DEBE FALLAR
    contrato-b.v1-en-cola.json       // psicologo == null
    contrato-b.v1-aceptado.json      // psicologo != null, canalContacto == null
    contrato-b.v1-contacto.json      // canalContacto != null
    contrato-c.v1.json
```

**Regla de las fixtures negativas:** por cada invariante hay al menos una fixture que la viola y
una prueba que exige el rechazo. Una invariante sin prueba negativa **no está protegida**.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un Contrato A válido es admitido por `PR-004` | prueba de contrato |
| 2 | Un paquete con `ProfileId` o alias es rechazado | prueba negativa |
| 3 | Un paquete con `scope > consent` es rechazado | prueba negativa |
| 4 | `psicologo` nulo en todo estado anterior a `ACEPTADO` | prueba de contrato |
| 5 | 🆕 `psicologo` no nulo y `canalContacto` nulo en `ACEPTADO` | prueba de contrato (R1 vs R5) |
| 6 | `canalContacto` no nulo solo desde `CONTACTO_HABILITADO` | prueba de contrato |
| 7 | `ProfileId` y `caseToken` nunca aparecen juntos en un payload | aserción de exclusión |
| 8 | Los 7 `SupportRequestState` del APK tienen mapeo, sin huérfanos | prueba de tabla |
| 9 | Una `contratoVersion` no soportada produce rechazo explícito | prueba de contrato |
| 10 | Las pruebas corren en CI **sin** compilar APK y Puente Red juntos | prueba de configuración de CI |
| 11 | Un cambio incompatible en `PR-003` hace fallar el CI antes del merge | prueba de mutación |
| 12 | 🆕 El APK nunca llama a `/profesional` y el portal nunca llama a `/joven` | prueba de rutas permitidas |

---

## Guardrails aplicables

- **`PR-003` §9** — las 10 invariantes. Criterios 2–8, 12.
- #6 actualizado — superficies separadas, red acotada a la API Joven. Criterio 12.
- `PLAN-PUENTE-RED.md` §4 — *"el contrato se define una vez y se versiona"*. Criterios 9, 11.

---

## Referencia visual

Ninguna. Es una spec de calidad.

---

## Dependencias

- **Bloqueado por:** `PR-003` ✅ (contratos A/B/C), `PR-004` ✅, `PR-019` ✅.
- **Bloquea a:** `S5` y el criterio de avance del MVP.
- **Coordinación:** A publica las fixtures del contrato y reescribe `ModuleGraphGuardTest`
  (`TASK-013`); B confirma que `TASK-015`/`TASK-016` las producen y consumen.

---

## Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Las fixtures viven en A (`PR-003`) o en C (`PR-020`)? | propuesta de C: en A |
| — | ¿El `sessionToken` caduca? ¿Cómo se renueva? (Q3 de `PR-004`) | ⏳ abierto — afecta a las pruebas de Contrato A |
| — | ¿`RESUELTO` y `CERRADO` son estados distintos o uno solo? | ⏳ aclarar con A |
