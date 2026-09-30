# PR-007 · Directorio de profesionales y modelo de perfil (dos tipos de respondedor)

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-001` §7, `PR-000` §3
**Bloquea a:** `PR-008` (el motor empareja contra este directorio), `PR-010` (roles), `PR-011`

---

## Contexto

*"Derivar al psicólogo más apropiado"* exige que exista un **directorio** con perfiles que
describan a quién sirve cada respondedor. Hoy no existe: `PLAN-PUENTE-RED.md` §3.3 lo llama
*"una caja negra"*.

Y hay un giro que cambia el modelo: la decisión **D5** establece respuesta **escalonada por
gravedad** — personal capacitado para amarillo/medio, psicólogo para rojo/alto. Eso significa
que el directorio **no es un directorio de psicólogos**: es un directorio de **dos tipos de
respondedor**. Esta spec es donde eso se modela.

El brief §28 pide además un *"Directorio de apoyo"* de servicios comunitarios, que es otra cosa
(recursos externos, no personal interno). Este documento cubre el **personal interno**; el
directorio de servicios se especifica en `PR-016`.

---

## Alcance

### Dentro

- Modelo de perfil de respondedor con dos tipos: `CAPACITATED_STAFF` y `PSYCHOLOGIST`.
- Atributos de emparejamiento (`PLAN-PUENTE-RED.md` §3.3):
  - especialidades (trauma, duelo, bullying, familia, adicciones);
  - banda de edad que atiende;
  - idioma(s) — español y, si aplica, aimara/quechua (La Paz);
  - zona geográfica;
  - tipo de respondedor y nivel máximo que puede tomar;
  - carga actual (casos abiertos) y disponibilidad (horario, guardia);
  - estado (activo, vacaciones, inactivo).
- CRUD administrativo del directorio, con auditoría (`PR-018`).
- Reglas de **elegibilidad**: qué casos puede tomar cada tipo (D5).
- Marcar perfiles **ficticios** en el MVP (brief §28: *"No inventar servicios oficiales reales"*).

### Fuera

- El motor de emparejamiento y los criterios de equidad: `PR-008`.
- La autenticación y los roles de sesión: `PR-010` (aquí solo se modela el rol, no el login).
- El directorio de servicios comunitarios externos: `PR-016`.
- Datos personales de los profesionales más allá de lo operativo (no es un CRM de RRHH).

---

## Módulo y propiedad

- Módulo: `puente-red/backend/directory`
- Dueño: **C**.

```
upsertResponder(ResponderProfile) -> ResponderProfile
listEligible(caseFeatures, category) -> List<ResponderProfile>   // usado por PR-008
```

---

## Contratos de datos

```kotlin
enum class ResponderKind { CAPACITATED_STAFF, PSYCHOLOGIST }

enum class Specialty { TRAUMA, GRIEF, BULLYING, FAMILY, SUBSTANCE }

data class ResponderProfile(
    val id: ResponderId,
    val kind: ResponderKind,
    val displayName: String,
    val role: ProfessionalRole,            // PSYCHOLOGY, SOCIAL_WORK, GUIDANCE, SUPERVISION
    val specialties: Set<Specialty>,
    val ageBandsServed: Set<AgeBand>,
    val languages: Set<Language>,
    val zone: String,
    val maxCategory: ProfessionalCategory, // D5: staff→MEDIUM, psychologist→HIGH
    val onCall: Boolean,                   // participa en guardia
    val active: Boolean,
    val isFictional: Boolean = false,      // MVP: datos de demostración
)

/**
 * Carga operativa. Es la base de los criterios de equidad de PR-008.
 * Se calcula desde la cola, no se edita a mano.
 */
data class ResponderLoad(
    val responderId: ResponderId,
    val openCases: Int,
    val casesTakenLast7Days: Int,
    val avgAckLatencyMinutes: Int,
)
```

**Regla D5 codificada:** `maxCategory` es una restricción dura. Un `CAPACITATED_STAFF` con
`maxCategory = MEDIUM` **no puede** recibir un caso `HIGH`. El motor (`PR-008`) lo respeta y
escala a un `PSYCHOLOGIST`.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un `CAPACITATED_STAFF` nunca puede tener `maxCategory = HIGH` | restricción de validación + prueba |
| 2 | `listEligible` con categoría `HIGH` nunca devuelve `CAPACITATED_STAFF` | prueba unitaria |
| 3 | Todo perfil del MVP está marcado `isFictional = true` | prueba sobre el seed |
| 4 | Toda modificación del directorio genera un evento de auditoría | prueba de integración con `PR-018` |
| 5 | Un respondedor `active = false` nunca aparece en `listEligible` | prueba unitaria |
| 6 | El perfil no almacena datos sensibles del profesional (documento, domicilio) | revisión de esquema |
| 7 | `ResponderLoad` se deriva de la cola y no es editable por API | prueba de contrato |

---

## Guardrails aplicables

- D5 — dos tipos de respondedor; el escalonado es una restricción de datos, no solo de UI.
- #2 — el directorio informa la propuesta; el profesional sigue aceptando el caso.
- Brief §28 — datos ficticios en el MVP; prohibido inventar servicios oficiales reales.
- P7 — si hay 2 profesionales reales, el directorio debe decirlo sin fingir capacidad.

---

## Referencia visual

`ProSidebar.tsx` — el ítem *"Directorio"*. `ProCaseScreen.tsx` — el bloque *"Próxima acción:
Asignar profesional"*. `ProWorkspaceScreen.tsx` — el perfil de usuario (*"Ana López ·
Psicología"*) como semilla del modelo.

---

## Dependencias

- **Bloqueado por:** `PR-001` §7 (quién responde y con qué formación mínima — pregunta 9 de
  §13 del protocolo).
- **Bloquea a:** `PR-008` (emparejamiento), `PR-010` (roles), `PR-011` (home profesional).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| **P7** | ¿Cuántos profesionales reales hay detrás del piloto? | un motor de derivación para 2 personas no tiene sentido; el directorio debe declarar la capacidad real |
| P8 | ¿Existe guardia 24/7? ¿Quién entra en `onCall`? | determina si el nivel rojo puede prometer algo |
| — | ¿Idiomas: solo español o también aimara/quechua? | afecta al emparejamiento por zona e idioma |
| — | ¿La ONG es el único operador? (Q8) | define si el directorio es mono-institución o multi-institución |
