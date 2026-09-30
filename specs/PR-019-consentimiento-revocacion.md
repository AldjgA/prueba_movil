# PR-019 · Consentimiento, identidad y revocación cross-producto

**Estado:** En revisión
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R3 · **Depende de:** `PR-003` §5–§7, `PR-004`, `PR-009`, `PR-016` · **Bloquea:** `PR-020`

---

## 1. Contexto

Este es el punto donde los dos productos se tocan, y donde la promesa del proyecto se puede romper
en silencio.

El APK ya modela el consentimiento con cuidado: `ConsentRecord`, `ShareableSummary` con `scope`
cerrado (`ShareScopeEntry`), la invariante **`consent.scope ⊆ summary.scope`** y `RevocationReason`
con tres motivos (`CONSENT_WITHDRAWN`, `CLOSED_BY_TEAM`, `WINDOW_EXPIRED`). `PLAN-PUENTE-RED.md`
§2.4 lo dice: *"inventar un segundo mecanismo de compartición rompería la invariante"*.

Esta spec define **cómo Puente Red respeta ese consentimiento**, sin crear un mecanismo paralelo.

---

## 2. El modelo de identidad cerrado (`PR-003` §7)

| Relación | Antes | Ahora |
|---|---|---|
| Joven → ve los datos del profesional | nunca | **desde `ACEPTADO`** (R5) |
| Joven → tiene canal para contactarlo | nunca | **solo si el psicólogo inicia** (R1) |
| Profesional → ve la identidad del joven | nunca | **nunca**: el joven es **seudónimo** (R1) |
| Backend → correlaciona | `caseToken ↔ ProfileId` aparte | igual, más `↔ profesionalId` al aceptar |

**La revelación es unidireccional: Red → Joven.** El alias sigue **sin** ser identidad; el
`ProfileId` sigue siendo opaco; el `caseToken` (ULID) sigue siendo el único vínculo.

**Conciliación R1 + R5, al pie de la letra:**
- Al **aceptar**, el joven **ve quién es** el psicólogo (nombre visible, rol, especialidad).
- Eso **no** le da canal. El canal se abre **solo si el psicólogo decide comunicarse**.
- Es decir: **identidad sí al aceptar; canal solo a iniciativa del psicólogo.**

---

## 3. Alcance

### Dentro
- Consumir `AuthorizedSummary` y `ConsentRecord` **tal como los emite el APK** (Contrato A).
- **Validar la invariante `consent.scope ⊆ summary.scope` en la ingesta** — la aplica `PR-004` (A)
  y C la verifica en `PR-020`.
- Exponer en el **Contrato B**: `psicologo` no nulo desde `ACEPTADO`; `canalContacto` nulo hasta
  `CONTACTO_HABILITADO`.
- **Revocación** (P12): distinguir con honestidad **bloquear accesos futuros** de **borrar lo ya
  leído** (esto último no se promete, y la UI lo dice).
- Mapear `RevocationReason` a copy del portal, **sin inventar estados nuevos**.
- Trazabilidad de la revocación en `audit_event` (`PR-018`).
- **Canal de contacto in-app** (Contrato C, `PR-003` §6.2) — **baja prioridad** (R2), fuera del
  camino crítico del MVP. Aquí se especifica su **semántica de consentimiento**, no su construcción.

### Fuera
- **Crear** consentimiento: lo crea el joven, en el APK.
- Ampliar el scope: prohibido por diseño.
- Renombrar `SupportRequestState` o `RevocationReason`: contrato estable del APK.
- Decidir si la revocación borra retroactivamente: es P12, decisión legal pendiente.
- Construir el canal in-app: baja prioridad (R2).

---

## 4. Módulo y propiedad

- Módulo: `puente-red/backend/core/consent`
- Dueño: **C**
- Runtime: **Go**; persistencia en **Supabase** con RLS sobre `caso_correlacion`
- Archivos compartidos que necesita declarar: **ninguno del APK**.

---

## 5. Contratos de datos

- Interfaces de `Repositories.kt` que consume: los **tipos de dominio del APK como referencia**
  (`ConsentRecord`, `ShareableSummary`, `RevocationReason`), **sin redefinirlos**: los versiona
  `PR-003` §4.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type AdmissionResult struct {
    Admitted  bool
    CaseToken *string
    Rejection *AdmissionRejection
}

type AdmissionRejection string
const (
    RejectScopeExceedsSummary  AdmissionRejection = "SCOPE_EXCEEDS_SUMMARY"
    RejectConsentNotGranted    AdmissionRejection = "CONSENT_NOT_GRANTED"
    RejectConsentRevoked       AdmissionRejection = "CONSENT_REVOKED"
    RejectContractUnsupported  AdmissionRejection = "CONTRACT_VERSION_UNSUPPORTED"
)
```

**Regla dura:** `SCOPE_EXCEEDS_SUMMARY` **nunca** se "arregla" recortando o ampliando en el
servidor. Se rechaza y se alerta: es un fallo del emisor o un intento de ampliación.

### Casos límite obligatorios

| # | Caso | Regla |
|---|---|---|
| 1 | Revocación **antes** de `ACEPTADO` | El caso se cierra; el profesional nunca lo vio |
| 2 | Revocación **después** de `ACEPTADO` | El psicólogo **ya vio** los datos del joven (seudónimo). Bloquea accesos futuros; **no** des-revela. La UI lo dice con honestidad |
| 3 | Revocación con **derivación externa en curso** | ⏳ **abierto** (crítico, sin resolver) |
| 4 | El joven **pierde el dispositivo** | Pierde la cuenta (`PR-003` §11, R4). El caso sigue vivo en el backend; se pierde el vínculo local. Deuda conocida |
| 5 | El psicólogo **no decide** comunicarse | El joven ve los datos pero **no** tiene canal. Es un estado válido y frecuente |
| 6 | El psicólogo **inicia** contacto | `CONTACTO_HABILITADO`; canal in-app mediado (`PR-003` §6.2, opción A) |

---

## 6. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un `AuthorizedSummary` con `scope` mayor que el `ConsentRecord` se rechaza | unitaria |
| 2 | El rechazo por scope no amplía ni recorta nada | unitaria: el payload rechazado no se persiste |
| 3 | Tras `CONSENT_WITHDRAWN`, el caso deja de ser visible para nuevos accesos | integración con `PR-009` |
| 4 | `Psicologo` es `nil` antes de `ACEPTADO` y no nulo desde `ACEPTADO` | contrato (coincide con `PR-004` criterio 4) |
| 5 | `CanalContacto` es `nil` hasta que el psicólogo lo inicia | contrato |
| 6 | Que el joven vea los datos **no** habilita el canal | contrato (aserción de independencia) |
| 7 | La UI distingue *"bloquear futuros accesos"* de *"borrar"* con texto honesto | revisión de copy |
| 8 | Los tres `RevocationReason` del APK se mapean sin inventar estados | unitaria de tabla de mapeo |
| 9 | Toda revocación queda en `audit_event` | integración con `PR-018` |
| 10 | Puente Red no puede crear un `ConsentRecord` | contrato (no existe el endpoint) |
| 11 | El portal nunca expone el `ProfileId` ni el alias del joven | contrato |

---

## 7. Guardrails aplicables

- **`PR-003` §9.1** — `consent.scope ⊆ summary.scope`. Criterios 1, 2.
- **`PR-003` §9.5** — el joven no ve datos del profesional antes de `ACEPTADO`. Criterio 4.
- **`PR-003` §9.6** — sin canal salvo iniciativa del psicólogo. Criterios 5, 6.
- **`PR-003` §9.7** — el joven nunca revela identidad al profesional. Criterio 11.
- `PR-003` §9.2 — el chat completo nunca sale; solo lo autorizado.
- Honestidad (DECISIONES §4.3) — distinguir *revocar* de *borrar*. Criterio 7.

---

## 8. Dependencias

- **Bloquea:** `PR-020`.
- **Bloqueado por:** `PR-003` ✅, `PR-004` ✅, `PR-009`, `PR-016`.
- **Specs relacionadas:** `PR-016` (derivación y revocación), `PR-018` (auditoría).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| **P12** | ¿La revocación elimina lo que un profesional ya leyó? | ⏳ abierto; el brief §17 y `RevocationReason` ya distinguen bloquear de borrar |
| **—** | ¿La revocación **detiene** una derivación externa en curso? | ⏳ **crítico, sin resolver** |
| — | ¿Cómo se re-vincula una cuenta si el joven pierde el dispositivo? | ⏳ deuda conocida (`PR-003` §11) |
| — | ¿El canal in-app entra en el MVP o se difiere? | R2: **baja prioridad** |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...`) y pasa lint
- [ ] Pruebas de los 11 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
