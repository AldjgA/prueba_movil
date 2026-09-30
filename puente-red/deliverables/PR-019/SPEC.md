# PR-019 · Consentimiento y revocación cross-producto

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-003` (contrato Joven↔Red, de A), `PR-009`, `PR-016`
**Bloquea a:** `PR-020`

---

## Contexto

Este es el punto donde los dos productos se tocan, y donde la promesa del proyecto se puede
romper en silencio.

El APK ya modela el consentimiento con cuidado: `ConsentRecord`, `ShareableSummary` con `scope`
cerrado (`ShareScopeEntry`), la invariante **`consent.scope ⊆ summary.scope`** y
`RevocationReason` con tres motivos (`CONSENT_WITHDRAWN`, `CLOSED_BY_TEAM`, `WINDOW_EXPIRED`).
`PLAN-PUENTE-RED.md` §2.4 lo dice: *"Inventar un segundo mecanismo de compartición rompería la
invariante"*.

Esta spec define **cómo Puente Red respeta ese consentimiento**, sin crear un mecanismo
paralelo.

---

## Alcance

### Dentro

- Consumir el `AuthorizedSummary` y el `ConsentRecord` **tal como los emite el APK** (vía
  `PR-003` y `PR-004`). No re-interpretarlos, no ampliarlos.
- Verificar en el borde que `consent.scope ⊆ summary.scope` **antes** de admitir el caso. Si no
  se cumple, **rechazar la ingesta** con error explícito (nunca ampliar en silencio).
- **Revocación** (`P12`): distinguir con honestidad dos cosas distintas:
  - **bloquear accesos futuros** — se puede y se hace;
  - **borrar lo que ya se leyó** — no se promete, y la UI lo dice.
- Proyección del estado hacia el joven (`YouthVisibleCaseStatus` de `PR-009`) coherente con la
  revocación: al revocar, el joven deja de ver *"una persona está revisando"*.
- Mapeo de `RevocationReason` a copy del portal, sin inventar estados nuevos.
- Trazabilidad de la revocación en `PR-018`.

### Fuera

- **Crear** consentimiento: lo crea el joven, en el APK. Puente Red solo lo consume.
- Ampliar el scope: prohibido por diseño.
- Renombrar `SupportRequestState` o `RevocationReason`: son contrato estable del APK.
- Decidir si la revocación borra retroactivamente: es `P12`, decisión legal pendiente.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/consent`
- Dueño: **C**.

```
admitReport(AuthorizedSummary, ConsentRecord) -> AdmissionResult   // verifica la invariante
applyRevocation(caseToken, RevocationReason) -> Unit
```

---

## Contratos de datos

Se consumen los tipos del APK **sin modificarlos** (`PR-003` los versiona):

```kotlin
// Tipos de referencia, definidos en :core:model del APK (no se redefinen aquí)
// ConsentRecord(id, youthId, summaryId, scope: Set<ShareScopeEntry>, granted, recordedAt, revokedAt?)
// ShareableSummary(id, youthId, createdAt, scope: Set<ShareScopeEntry>, note?)
// RevocationReason { CONSENT_WITHDRAWN, CLOSED_BY_TEAM, WINDOW_EXPIRED }

sealed interface AdmissionResult {
    data class Admitted(val caseToken: CaseToken) : AdmissionResult
    data class Rejected(val reason: AdmissionRejection) : AdmissionResult
}

enum class AdmissionRejection {
    SCOPE_EXCEEDS_SUMMARY,   // viola consent.scope ⊆ summary.scope
    CONSENT_NOT_GRANTED,
    CONSENT_REVOKED,
    SUMMARY_VERSION_UNSUPPORTED,
}
```

**Regla dura:** `SCOPE_EXCEEDS_SUMMARY` **nunca** se "arregla" recortando o ampliando en el
servidor. Se rechaza y se alerta: es un fallo del emisor o un intento de ampliación.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un `AuthorizedSummary` con `scope` mayor que el `ConsentRecord` se rechaza | prueba unitaria |
| 2 | El rechazo por scope no amplía ni recorta nada | prueba: el payload rechazado no se persiste |
| 3 | Tras `CONSENT_WITHDRAWN`, el caso deja de ser visible para nuevos accesos | prueba de integración con `PR-009` |
| 4 | Tras revocar, el joven ve un mensaje coherente, no *"una persona lo está revisando"* | prueba de integración con `PR-019`↔`PR-009` |
| 5 | La UI distingue *"bloquear futuros accesos"* de *"borrar"* con texto honesto | revisión de copy |
| 6 | Los tres `RevocationReason` del APK se mapean sin inventar estados | prueba de tabla de mapeo |
| 7 | Toda revocación queda en auditoría | prueba de integración con `PR-018` |
| 8 | Puente Red no puede crear un `ConsentRecord` | prueba de contrato (no existe el endpoint) |

---

## Guardrails aplicables

- Invariante del proyecto — `consent.scope ⊆ summary.scope`. Criterios 1, 2.
- #4/#5 — el chat completo nunca sale; solo lo autorizado.
- Honestidad (DECISIONES §4.3) — distinguir *revocar* de *borrar*. Criterio 5.
- #9 — la revocación queda auditada.
- Brief §17 y §31 — el joven autoriza antes de que salga nada.

---

## Referencia visual

En el portal: el panel *"Consentimiento: Autorizado"* de `ProCaseScreen.tsx`. En el APK (de B):
el flujo *"Revisar resumen → Editar / Autorizar / Cancelar"* del brief §17.

---

## Dependencias

- **Bloqueado por:** `PR-003` (contrato de datos, de A) y `PR-004` (ingesta, de A).
- **Bloquea a:** `PR-020`.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| **P12** | ¿La revocación del joven puede eliminar lo que un profesional ya leyó? | el brief §17 y `RevocationReason` ya distinguen bloquear de borrar; falta la decisión legal |
| P3 | ¿El profesional ve el alias al aceptar el caso? | cambia qué expone la proyección |
| — | ¿La revocación detiene una derivación externa en curso? | no está resuelto en `PR-016`; **crítico** |
