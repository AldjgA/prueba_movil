# PR-019 · Consentimiento, identidad y revocación cross-producto

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-003` (contrato, de A), `PR-009`, `PR-016`
**Bloquea a:** `PR-020`
**Reconciliado:** 2026-09-30 — **reescrito** tras `PR-003` §7 (identidad y anonimato) y §9 (invariantes)

---

## Contexto

Este es el punto donde los dos productos se tocan, y donde la promesa del proyecto se puede
romper en silencio.

El APK ya modela el consentimiento con cuidado: `ConsentRecord`, `ShareableSummary` con `scope`
cerrado (`ShareScopeEntry`), la invariante **`consent.scope ⊆ summary.scope`** y
`RevocationReason` con tres motivos (`CONSENT_WITHDRAWN`, `CLOSED_BY_TEAM`, `WINDOW_EXPIRED`).
`PLAN-PUENTE-RED.md` §2.4 lo dice: *"inventar un segundo mecanismo de compartición rompería la
invariante"*.

**La revisión 1 de esta spec decía que el profesional nunca ve la identidad del joven y que el
joven nunca ve los datos del profesional. `PR-003` §7 cambia ambas cosas** (§2 abajo).

---

## 1. El modelo de identidad cerrado (`PR-003` §7)

| Relación | Antes | Ahora (`PR-003` §7) |
|---|---|---|
| Joven → ve los datos del profesional | nunca | 🆕 **desde `ACEPTADO`** (R5) |
| Joven → tiene canal para contactarlo | nunca | 🆕 **solo si el psicólogo inicia** (R1) |
| Profesional → ve la identidad del joven | nunca | **nunca**: el joven es **seudónimo** (R1) |
| Backend → correlaciona | `caseToken ↔ ProfileId` aparte | igual, más `↔ profesionalId` al aceptar |

**La revelación es unidireccional: Red → Joven.** El alias sigue **sin** ser identidad; el
`ProfileId` sigue siendo opaco; el `caseToken` (ULID) sigue siendo el único vínculo.

**Conciliación R1 + R5, que es sutil y hay que respetarla al pie de la letra:**
- Al **aceptar**, el joven **ve quién es** el psicólogo (nombre visible, rol, especialidad).
- Eso **no** le da canal. El canal se abre **solo si el psicólogo decide comunicarse**.
- Es decir: **identidad sí al aceptar; canal solo a iniciativa del psicólogo.**

---

## Alcance

### Dentro

- Consumir `AuthorizedSummary` y `ConsentRecord` **tal como los emite el APK** (Contrato A de
  `PR-003` §4). No re-interpretarlos, no ampliarlos.
- **Validar la invariante `consent.scope ⊆ summary.scope` en la ingesta** — es responsabilidad
  de `PR-004` (A), y C la verifica en las pruebas de contrato (`PR-020`).
- Exponer en el **Contrato B** (`PR-003` §5):
  - `psicologo` **no nulo desde `ACEPTADO`**;
  - `canalContacto` **nulo hasta `CONTACTO_HABILITADO`**.
- **Revocación** (P12): distinguir con honestidad:
  - **bloquear accesos futuros** — se puede y se hace;
  - **borrar lo que ya se leyó** — no se promete, y la UI lo dice.
- Mapear `RevocationReason` a copy del portal, **sin inventar estados nuevos**.
- Trazabilidad de la revocación en `audit_event` (`PR-018`).
- 🆕 **Canal de contacto in-app** (Contrato C de `PR-003` §6.2) — **baja prioridad** (R2),
  fuera del camino crítico del MVP, candidato a ola posterior a `PR-016`. Aquí se especifica su
  **semántica de consentimiento**, no su construcción.

### Fuera

- **Crear** consentimiento: lo crea el joven, en el APK.
- Ampliar el scope: prohibido por diseño.
- Renombrar `SupportRequestState` o `RevocationReason`: contrato estable del APK.
- Decidir si la revocación borra retroactivamente: es `P12`, decisión legal pendiente.
- Construir el canal in-app: baja prioridad (R2).

---

## 2. Casos límite que la revisión 2 obliga a tratar

| # | Caso | Regla |
|---|---|---|
| 1 | El joven revoca **antes** de `ACEPTADO` | El caso se cierra; el profesional nunca lo vio |
| 2 | El joven revoca **después** de `ACEPTADO` | El psicólogo **ya vio los datos del joven** (seudónimo). La revocación **bloquea accesos futuros**; no des-revela. La UI lo dice con honestidad |
| 3 | El joven revoca con una **derivación externa en curso** | ⏳ **abierto** (P12): ¿se detiene la derivación? Crítico, sin resolver |
| 4 | 🆕 El joven **pierde el dispositivo** | **Pierde la cuenta** (`PR-003` §11, R4). No hay recuperación en el MVP. El caso sigue vivo en el backend; se pierde el vínculo local. Deuda conocida y documentada |
| 5 | 🆕 El psicólogo **no decide** comunicarse | El joven ve los datos pero **no** tiene canal. Es un estado válido y frecuente, no un error |
| 6 | 🆕 El psicólogo **inicia** contacto | `CONTACTO_HABILITADO`; el canal es in-app y mediado (`PR-003` §6.2, opción A recomendada) |

---

## Módulo y propiedad

- Módulo: `puente-red/backend/core/consent` (dueño: **C**)

```
admitReport(AuthorizedSummary, ConsentRecord) -> AdmissionResult
applyRevocation(caseToken, RevocationReason) -> Unit
openContactChannel(caseToken, responderId) -> ChannelState   // baja prioridad (R2)
```

---

## Contratos de datos

Se consumen los tipos del APK **sin modificarlos** (`PR-003` §4 versiona el contrato):

```go
// Tipos de referencia, definidos en :core:model del APK (no se redefinen aquí)
// ConsentRecord(id, youthId, summaryId, scope: Set<ShareScopeEntry>, granted, recordedAt, revokedAt?)
// ShareableSummary(id, youthId, createdAt, scope: Set<ShareScopeEntry>, note?)
// RevocationReason { CONSENT_WITHDRAWN, CLOSED_BY_TEAM, WINDOW_EXPIRED }

type AdmissionResult struct {
    Admitted bool
    CaseToken *string
    Rejection *AdmissionRejection
}

type AdmissionRejection string

const (
    RejectScopeExceedsSummary AdmissionRejection = "SCOPE_EXCEEDS_SUMMARY"
    RejectConsentNotGranted   AdmissionRejection = "CONSENT_NOT_GRANTED"
    RejectConsentRevoked      AdmissionRejection = "CONSENT_REVOKED"
    RejectContractUnsupported AdmissionRejection = "CONTRACT_VERSION_UNSUPPORTED"
)
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
| 4 | 🆕 `psicologo` es `nil` antes de `ACEPTADO` y no nulo desde `ACEPTADO` | prueba de contrato (coincide con `PR-004` criterio 4) |
| 5 | 🆕 `canalContacto` es `nil` hasta que el psicólogo lo inicia | prueba de contrato |
| 6 | 🆕 Que el joven vea los datos del profesional **no** habilita el canal | prueba de contrato (aserción de independencia) |
| 7 | La UI distingue *"bloquear futuros accesos"* de *"borrar"* con texto honesto | revisión de copy |
| 8 | Los tres `RevocationReason` del APK se mapean sin inventar estados | prueba de tabla de mapeo |
| 9 | Toda revocación queda en `audit_event` | prueba de integración con `PR-018` |
| 10 | Puente Red no puede crear un `ConsentRecord` | prueba de contrato (no existe el endpoint) |
| 11 | 🆕 El portal nunca expone el `ProfileId` ni el alias del joven | prueba de contrato |

---

## Guardrails aplicables

- **Invariante `PR-003` §9.1** — `consent.scope ⊆ summary.scope`. Criterios 1, 2.
- **`PR-003` §9.5** — el joven no ve datos del profesional antes de `ACEPTADO`. Criterio 4.
- **`PR-003` §9.6** — sin canal salvo iniciativa del psicólogo. Criterios 5, 6.
- **`PR-003` §9.7** — el joven nunca revela identidad al profesional. Criterio 11.
- #7 — el chat completo nunca sale; solo lo autorizado.
- Honestidad (DECISIONES §4.3) — distinguir *revocar* de *borrar*. Criterio 7.

---

## Referencia visual

Portal: panel *"Consentimiento: Autorizado"* de `ProCaseScreen.tsx`. APK (de B): flujo
*"Revisar resumen → Editar / Autorizar / Cancelar"* del brief §17. El canal in-app es pantalla
nueva, **baja prioridad**.

---

## Dependencias

- **Bloqueado por:** `PR-003` ✅ y `PR-004` ✅ (publicados por A).
- **Bloquea a:** `PR-020`.

---

## Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| **P12** | ¿La revocación elimina lo que un profesional ya leyó? | ⏳ abierto; el brief §17 y `RevocationReason` ya distinguen bloquear de borrar |
| **—** | ¿La revocación detiene una derivación externa en curso? | ⏳ **crítico, sin resolver** (caso límite 3) |
| — | ¿Cómo se re-vincula una cuenta si el joven pierde el dispositivo? | ⏳ deuda conocida (`PR-003` §11): propuesta a futuro, `caseToken` + verificación humana |
| — | ¿El canal in-app entra en el MVP o se difiere? | R2: **baja prioridad**, ola posterior a `PR-016` |
