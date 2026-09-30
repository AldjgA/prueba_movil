# PR-020 · Pruebas de contrato entre los dos productos

**Estado:** En revisión
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R3 · **Depende de:** `PR-003` §4–§9, `PR-004`, `PR-019` · **Bloquea:** `S5`

---

## 1. Contexto

Los dos productos comparten **un backend** pero se **gestionan de forma independiente** (`PR-003`
§1): dos superficies de API con ciclo de vida propio. El APK habla **solo** con `/joven`; el portal
**solo** con `/profesional`.

La frontera **no la protege el compilador**: la protegen el contrato versionado (`PR-003`) y estas
pruebas. Sin ellas, la primera modificación de cualquiera de los dos lados rompe la integración, y
—peor— puede romper una invariante de privacidad sin que nadie lo note.

---

## 2. Alcance

### Dentro

**Contrato A — Reporte (Joven → Backend)** · `PR-003` §4
- `POST /joven/casos` acepta un paquete emitido por el APK (`TASK-015`, de B).
- El cuerpo **no contiene** `ProfileId`, alias, MAC ni identificador de dispositivo.
- `motivo` son **claves de catálogo**, nunca texto libre.
- `resumenAutorizado.scope` es cerrado y **no excede** el `consentimiento.scope`.
- `contratoVersion` viaja; versión no soportada → **rechazo explícito**.

**Contrato B — Estado del caso (Backend → Joven)** · `PR-003` §5
- `psicologo` es `null` **hasta** `ACEPTADO` y **no nulo desde** `ACEPTADO` (R5).
- `canalContacto` es `null` **hasta** `CONTACTO_HABILITADO` (R1).
- **Independencia:** que `psicologo` no sea nulo **no** implica que `canalContacto` lo sea.
- Los estados mapean a `SupportRequestState` del APK sin huérfanos.

**Contrato C — Datos del psicólogo** · `PR-003` §6.1
- `nombreVisible`, `rol`, `especialidad` — **nunca** datos personales del profesional.
- `rol` ∈ {`psicologo`, `trabajador_social`, `orientador`, `supervisor`}.

**Invariantes de privacidad** · `PR-003` §9 — se prueban **una por una**, con fixture negativa:

| Invariante | Prueba |
|---|---|
| `consent.scope ⊆ summary.scope` | fixture con scope excedido → **debe fallar** |
| El chat completo nunca entra en el reporte | búsqueda de subcadenas del chat |
| El `ProfileId` nunca viaja junto al contenido | aserción de exclusión |
| El LLM no degrada un rojo | entrada `ROJO` → salida siempre `ALTO` |
| El joven no ve datos del profesional antes de `ACEPTADO` | Contrato B en `EN_COLA` → `psicologo == null` |
| El joven no tiene canal salvo iniciativa del psicólogo | `ACEPTADO` sin `CONTACTO_HABILITADO` → `canalContacto == null` |
| El joven nunca revela identidad al profesional | el payload de `/profesional` no contiene `ProfileId` ni alias |
| El flujo rojo funciona offline | el APK muestra emergencia y encola sin red |
| Ningún contrato profesional se compila en el APK | `ModuleGraphGuardTest` (de A, `TASK-013`) |

### Fuera
- La suite de seguridad del APK con escenarios simulados: `TASK-018`, de B.
- Las pruebas internas de cada producto.
- La firma clínica de `PR-001` (persona).

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/contract-tests`
- Dueño: **C**, en coordinación con A (dueño de `PR-003`) y B (emisor del paquete)
- **Ubicación de las fixtures:** propuesta de C — **en `PR-003` (A)**, con C como consumidor
  (pendiente de confirmación)
- Archivos compartidos que necesita declarar: **ninguno del APK**.

```
contract-tests/
  fixtures/
    contrato-a.v1.json                // válido
    contrato-a.v1-nopii.json          // sin PII: debe pasar
    contrato-a.v1-con-profileid.json  // DEBE FALLAR
    contrato-a.v1-scope-excedido.json // DEBE FALLAR
    contrato-a.v1-version-mala.json   // DEBE FALLAR
    contrato-b.v1-en-cola.json        // psicologo == null
    contrato-b.v1-aceptado.json       // psicologo != null, canalContacto == null
    contrato-b.v1-contacto.json       // canalContacto != null
    contrato-c.v1.json
```

**Regla de las fixtures negativas:** por cada invariante hay al menos una fixture que la viola y
una prueba que exige el rechazo. Una invariante sin prueba negativa **no está protegida**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna** (las pruebas son de borde HTTP).
- Métodos nuevos que necesita: **ninguno del APK**.

**Versionado** (`PR-003` §8):
- `contratoVersion` en cada petición y respuesta.
- Cambio incompatible → versión mayor nueva; el backend sostiene la anterior durante la ventana de
  actualización del APK.
- `rulesetVersion`, `modelVersion` y `promptVersion` son **trazabilidad**, no versionado.
- Una fixture por versión soportada; un cambio incompatible en `PR-003` **rompe el CI**.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un Contrato A válido es admitido por `PR-004` | contrato |
| 2 | Un paquete con `ProfileId` o alias es rechazado | negativa |
| 3 | Un paquete con `scope > consent` es rechazado | negativa |
| 4 | `psicologo` nulo en todo estado anterior a `ACEPTADO` | contrato |
| 5 | `psicologo` no nulo y `canalContacto` nulo en `ACEPTADO` | contrato (R1 vs R5) |
| 6 | `canalContacto` no nulo solo desde `CONTACTO_HABILITADO` | contrato |
| 7 | `ProfileId` y `caseToken` nunca aparecen juntos en un payload | aserción de exclusión |
| 8 | Los 7 `SupportRequestState` del APK tienen mapeo, sin huérfanos | unitaria de tabla |
| 9 | Una `contratoVersion` no soportada produce rechazo explícito | contrato |
| 10 | Las pruebas corren en CI **sin** compilar APK y Puente Red juntos | configuración de CI |
| 11 | Un cambio incompatible en `PR-003` hace fallar el CI antes del merge | mutación |
| 12 | El APK nunca llama a `/profesional` y el portal nunca llama a `/joven` | contrato de rutas permitidas |

---

## 6. Guardrails aplicables

- **`PR-003` §9** — las 10 invariantes. Criterios 2–8, 12.
- **Guardrail #6 actualizado** — superficies separadas; red acotada a la API Joven. Criterio 12.
- `PLAN-PUENTE-RED.md` §4 — *"el contrato se define una vez y se versiona"*. Criterios 9, 11.
- `PR-003` §9.8 — el flujo rojo funciona **offline**. Incluido en las invariantes.

---

## 7. Referencia visual

Ninguna. Es una spec de calidad.

---

## 8. Dependencias

- **Bloquea:** `S5` y el criterio de avance del MVP.
- **Bloqueado por:** `PR-003` ✅, `PR-004` ✅ (decisiones cerradas), `PR-019`.
- **Coordinación:** A publica las fixtures y reescribe `ModuleGraphGuardTest` (`TASK-013`); B
  confirma que `TASK-015`/`TASK-016` las producen y consumen.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Las fixtures viven en A (`PR-003`) o en C (`PR-020`)? | propuesta de C: en A |
| — | ¿`RESUELTO` y `CERRADO` son estados distintos o uno? | ⏳ aclarar con A |
| — | ¿Dónde corre el CI de las pruebas de contrato? | `TASK-014` (A) define CI |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Las 12 pruebas en verde contra las fixtures versionadas
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
