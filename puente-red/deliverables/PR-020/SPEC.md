# PR-020 · Pruebas de contrato entre los dos productos

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-003` (contrato, de A), `PR-004`, `PR-019`
**Bloquea a:** `S5` (integración final) y el criterio de avance del MVP

---

## Contexto

Los dos productos no deben conocerse. El APK no puede importar `:core:network`
(`ModuleGraphGuardTest` falla a propósito), y ningún contrato de Puente Red puede compilarse en
el APK (guardrail #6).

Eso significa que la frontera entre ellos **no la protege el compilador**: la protege un
contrato versionado (`PR-003`, de A) y estas pruebas. Sin ellas, la primera modificación de
cualquiera de los dos lados rompe la integración en producción, y —peor— puede romper una
invariante de privacidad sin que nadie lo note.

Esta es la spec que convierte *"el contrato se define una vez y se versiona"*
(`PLAN-PUENTE-RED.md` §4) en algo verificable.

---

## Alcance

### Dentro

**A. Pruebas de contrato sobre el paquete de alerta** (APK → Red):

- Un paquete emitido por el APK (`TASK-015`, de B) es aceptado por la ingesta (`PR-004`).
- El paquete **no contiene** `ProfileId`, alias, `YouthAlias` ni MAC.
- El paquete contiene un `caseToken` válido y una `AuthorizedSummary` con scope cerrado.
- Una versión de contrato no soportada produce un rechazo explícito, no una aceptación parcial.

**B. Pruebas de contrato sobre el estado del caso** (Red → APK):

- La proyección `YouthVisibleCaseStatus` (`PR-009`) mapea a `SupportRequestState` sin huérfanos.
- La proyección **no contiene** `assignee`, `ResponderId`, notas internas ni identidad.
- Los 7 estados del APK (`DRAFT`…`CLOSED`) tienen mapeo definido.

**C. Pruebas de invariantes de privacidad:**

- `consent.scope ⊆ summary.scope` se verifica en el borde (`PR-019`).
- El chat completo nunca aparece en ningún payload cross-producto.
- El `caseToken` y el `ProfileId` nunca viajan juntos en el mismo payload.

**D. Versionado:**

- Un cambio incompatible en `PR-003` rompe estas pruebas **antes** del merge.
- Cada prueba declara qué versión del contrato verifica.

### Fuera

- La suite de seguridad del APK con escenarios simulados: es `TASK-018`, de B.
- Las pruebas internas de cada producto.
- La firma clínica de `PR-001` (persona).

---

## Módulo y propiedad

- Módulo: `puente-red/backend/contract-tests`
- Dueño: **C**, en coordinación con A (dueño de `PR-003`) y B (emisor del paquete).
- Ubicación: **el contrato y sus fixtures viven donde decida A** en `PR-003`; C aporta el lado
  consumidor y las aserciones negativas.

```
verifyInboundAlert(packageFixture) -> AdmissionResult
verifyOutboundStatus(projection) -> ApkStateMapping
```

---

## Contratos de datos

Fixtures versionados, uno por versión soportada del contrato:

```
contract-tests/
  fixtures/
    alert-package.v1.json        // válido
    alert-package.v1-nopii.json  // sin PII: debe pasar
    alert-package.v1-withpid.json// con ProfileId: DEBE FALLAR
    alert-package.v1-badscope.json// scope > consent: DEBE FALLAR
    status-projection.v1.json
```

**Regla de las fixtures negativas:** por cada invariante de privacidad hay al menos una fixture
que la viola y una prueba que exige el rechazo. Una invariante sin prueba negativa no está
protegida.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un paquete válido del APK es admitido por `PR-004` | prueba de contrato |
| 2 | Un paquete con `ProfileId` o alias es rechazado | prueba negativa |
| 3 | Un paquete con `scope > consent` es rechazado | prueba negativa |
| 4 | `caseToken` y `ProfileId` nunca aparecen juntos en un payload | prueba de contrato (aserción de exclusión) |
| 5 | Los 7 `SupportRequestState` tienen mapeo, sin huérfanos | prueba de tabla |
| 6 | `YouthVisibleCaseStatus` no contiene campos de identidad ni notas | prueba de contrato |
| 7 | Una versión de contrato no soportada produce rechazo explícito | prueba de contrato |
| 8 | Las pruebas corren en CI **sin** compilar el APK ni Puente Red juntos | prueba de configuración de CI |
| 9 | Un cambio incompatible en `PR-003` hace fallar el CI antes del merge | prueba de mutación: alterar la fixture y ver el fallo |

---

## Guardrails aplicables

- **#6 — ningún contrato de Puente Red se compila en el APK.** Criterio 8.
- #3/#5 — sin identidad del joven, sin chat completo. Criterios 2, 4, 6.
- Invariante `consent.scope ⊆ summary.scope`. Criterio 3.
- `PLAN-PUENTE-RED.md` §4 — *"el contrato se define una vez y se versiona"*. Criterios 7, 9.

---

## Referencia visual

Ninguna. Es una spec de calidad.

---

## Dependencias

- **Bloqueado por:** `PR-003` (contrato, de A), `PR-004`, `PR-019`.
- **Bloquea a:** `S5` y el criterio de avance del MVP.
- **Coordinación:** requiere que A publique las fixtures del contrato y que B confirme que
  `TASK-015` las produce.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿Dónde viven las fixtures del contrato: en A o en C? | propuesta: en `PR-003` (A), con C como consumidor |
| — | ¿El transporte real (quién mueve el paquete del APK a Red) ya está decidido? | `PLAN-PUENTE-RED.md` §4 dice que lo hace "un componente intermedio, no la app"; sigue sin dueño |
