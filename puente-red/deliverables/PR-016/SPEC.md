# PR-016 · Módulo de derivaciones y directorio de apoyo

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-008`, `PR-013`, `PR-014`
**Bloquea a:** `PR-017` (el funnel de atención se alimenta de las derivaciones)

---

## Contexto

Una derivación es el acto de sacar un caso del circuito interno y ponerlo en manos de un
servicio externo (salud, protección, orientación escolar, servicios comunitarios). El brief §27
pide un **módulo propio** con estados; el brief §28 pide además un **directorio de apoyo** con
categorías.

Son dos piezas pero un solo flujo: el directorio es la lista de a dónde se puede derivar, y el
módulo de derivaciones es el registro de a dónde se derivó y qué pasó.

**Nota de alcance:** esto es la derivación **externa**. La asignación **interna** de un caso a un
profesional es `PR-008`/`PR-009`.

---

## Alcance

### Dentro

**A. Módulo de derivaciones (brief §27).** Estados exactos:

```
PENDING → CONTACTED → REFERRED → CARE_STARTED → FOLLOW_UP → CLOSED
```

- Por derivación: **servicio, fecha, responsable, tiempo, estado**.
- Registro del **motivo** y de la **respuesta del servicio externo**.
- Recordatorios de seguimiento (enlaza con `PR-015`).
- Trazabilidad completa (`PR-018`).

**B. Directorio de apoyo (brief §28).** Categorías exactas:

```
PSICOLOGÍA · SALUD · PROTECCIÓN · ORIENTACIÓN ESCOLAR · SERVICIOS COMUNITARIOS
```

- Ficha de servicio: nombre, categoría, zona, contacto, horario, requisitos, accesibilidad.
- **Datos ficticios en el MVP** (brief §28: *"No inventar servicios oficiales reales"*), con
  marca visible de que son de demostración.
- Búsqueda y filtro por categoría y zona.

### Fuera

- La derivación **interna**: `PR-008`, `PR-009`.
- El campo "derivación" de la valoración profesional: `PR-014` (aquí se materializa).
- Cualquier contacto automático con el servicio externo: todo es manual.

---

## Módulo y propiedad

- Módulo: `puente-red/portal/referrals` + `puente-red/backend/directory-services`
- Dueño: **C**.

```
listServices(category?, zone?) -> List<SupportService>
createReferral(session, caseToken, serviceId, motive) -> Referral
advanceReferral(session, referralId, to: ReferralState) -> Referral
```

---

## Contratos de datos

```kotlin
enum class ReferralState {
    PENDING, CONTACTED, REFERRED, CARE_STARTED, FOLLOW_UP, CLOSED
}

enum class ServiceCategory {
    PSYCHOLOGY, HEALTH, PROTECTION, SCHOOL_GUIDANCE, COMMUNITY_SERVICES
}

data class SupportService(
    val id: ServiceId,
    val name: String,
    val category: ServiceCategory,
    val zone: String,
    val contact: String,
    val schedule: String?,
    val requirements: String?,
    val isFictional: Boolean = true,   // MVP
)

data class Referral(
    val id: ReferralId,
    val caseToken: CaseToken,
    val serviceId: ServiceId,
    val state: ReferralState,
    val motiveKey: String,
    val responsibleId: ResponderId,
    val createdAtEpochMillis: Long,
    val stateChangedAtEpochMillis: Long,
    val responseNote: String? = null,
)
```

**Invariante:** una derivación `CLOSED` es terminal. Si hay que reabrir, se crea una nueva
derivación enlazada —igual que el timeline, la historia no se reescribe.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Los 6 estados del brief §27 existen y la máquina de estados no permite saltos | prueba de máquina de estados |
| 2 | Las 5 categorías del brief §28 existen y filtran correctamente | prueba de integración |
| 3 | Todo servicio del MVP está marcado `isFictional = true` y la UI lo declara | prueba sobre seed + revisión visual |
| 4 | Una derivación siempre tiene un `responsibleId` humano | restricción de dominio + prueba |
| 5 | Toda transición de estado queda en el timeline (`PR-015`) y en auditoría (`PR-018`) | prueba de integración |
| 6 | El módulo calcula *"tiempo"* desde la creación hasta el estado actual | prueba unitaria |
| 7 | Reabrir una derivación cerrada crea una nueva, no muta la anterior | prueba de contrato |
| 8 | La derivación no expone identidad del joven al servicio externo en el MVP | prueba de contrato |

---

## Guardrails aplicables

- #2 — derivar es un acto humano; el sistema no deriva solo.
- Brief §28 — datos ficticios; prohibido inventar servicios oficiales reales.
- #9 — trazabilidad de cada transición.
- #3 — sin identidad del joven en el MVP.

---

## Referencia visual

`ProSidebar.tsx` — los ítems *"Derivaciones"* y *"Directorio"*. El brief §27 lista los estados y
los campos; el diseño debe respetar esa nomenclatura.

---

## Dependencias

- **Bloqueado por:** `PR-008`, `PR-013`, `PR-014`.
- **Bloquea a:** `PR-017` (el funnel *"¿cuántas derivaciones se completan?"* sale de aquí).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿La ONG tiene convenios reales con servicios? | si los hay, el directorio deja de ser ficticio y hay que validar los datos |
| — | ¿Se registra el consentimiento del joven para derivar a un tercero? | **crítico**: hoy el brief §27 no lo menciona; debe reconciliarse con `PR-019` |
| P12 | ¿Qué ocurre si el joven revoca el consentimiento con una derivación en curso? | `PR-019` |
