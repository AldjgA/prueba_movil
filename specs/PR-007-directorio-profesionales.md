# PR-007 · Directorio de profesionales y modelo de perfil (dos tipos de respondedor)

**Estado:** En revisión
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R1 · **Depende de:** `PR-001` §7, `PR-003` Q9, `PR-000` §3 · **Bloquea:** `PR-008`, `PR-010`, `PR-011`

---

## 1. Contexto

*"Derivar al psicólogo más apropiado"* exige un **directorio** con perfiles que describan a quién
sirve cada respondedor. Hoy no existe: `PLAN-PUENTE-RED.md` §3.3 lo llama *"una caja negra"*.

La decisión **D5** añade un giro: respuesta **escalonada por gravedad** — personal capacitado para
amarillo/medio, psicólogo para rojo/alto. El directorio **no es un directorio de psicólogos**: es
un directorio de **dos tipos de respondedor**, y aquí es donde eso se modela.

El brief §28 pide además un *"Directorio de apoyo"* de servicios comunitarios, que es **otra
cosa** (recursos externos, no personal interno): se especifica en `PR-016`.

---

## 2. Alcance

### Dentro
- Modelo de perfil con dos tipos: `CAPACITATED_STAFF` y `PSYCHOLOGIST`.
- Atributos de emparejamiento (`PLAN-PUENTE-RED.md` §3.3): especialidades; banda de edad servida;
  idiomas (español y, si aplica, aimara/quechua); zona; tipo y nivel máximo; carga y
  disponibilidad; estado.
- 🆕 **Campos públicos** que el joven ve desde `ACEPTADO` (`PR-003` §6.1, Contrato C):
  `nombreVisible`, `rol`, `especialidad`. Son un subconjunto público, nunca datos personales.
- CRUD administrativo con auditoría (`PR-018`).
- Reglas de **elegibilidad** por tipo (D5).
- Marcar perfiles **ficticios** en la demo (brief §28).

### Fuera
- El motor de emparejamiento y la equidad: `PR-008`.
- La autenticación y los roles de sesión: `PR-010` (aquí se modela el rol, no el login).
- El directorio de servicios comunitarios externos: `PR-016`.
- Datos personales del profesional más allá de lo operativo (no es un CRM de RRHH).

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/directory`
- Dueño: **C**
- **Identidad:** `ResponderId` mapea a `auth.users.id` de **Supabase Auth** (`PR-003` Q9). **No se
  implementa almacén de credenciales.**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type ResponderKind string // CAPACITATED_STAFF | PSYCHOLOGIST
type Specialty string     // TRAUMA | GRIEF | BULLYING | FAMILY | SUBSTANCE
type ProfessionalRole string // PSICOLOGIA | TRABAJO_SOCIAL | ORIENTACION | SUPERVISION

type ResponderProfile struct {
    ID             string  // = auth.users.id de Supabase Auth
    Kind           ResponderKind
    DisplayName    string
    Role           ProfessionalRole
    Specialties    []Specialty
    AgeBandsServed []string
    Languages      []string
    Zone           string
    MaxCategory    ProfessionalCategory // D5: staff→MEDIO, psychologist→ALTO
    OnCall         bool
    Active         bool
    IsFictional    bool
}

type ResponderLoad struct {
    ResponderID        string
    OpenCases          int
    CasesTakenLast7Days int
    AvgAckLatencyMin   int
}
```

**Regla D5 codificada:** `MaxCategory` es una restricción **dura**. Un `CAPACITATED_STAFF` con
`MaxCategory = MEDIO` **no puede** recibir un caso `ALTO`; `PR-008` lo respeta y escala.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un `CAPACITATED_STAFF` nunca puede tener `MaxCategory = ALTO` | unitaria de validación |
| 2 | `listEligible` con categoría `ALTO` nunca devuelve `CAPACITATED_STAFF` | unitaria |
| 3 | Todo perfil de la demo está marcado `IsFictional = true` | unitaria sobre el seed |
| 4 | Toda modificación del directorio genera un evento de auditoría | integración con `PR-018` |
| 5 | Un respondedor `Active = false` nunca aparece en `listEligible` | unitaria |
| 6 | El perfil no almacena documento ni domicilio del profesional | revisión de esquema |
| 7 | `ResponderLoad` se deriva de la cola y no es editable por API | contrato |
| 8 | Los campos públicos (`DisplayName`, `Role`, `Specialty`) son los únicos visibles al joven | contrato contra Contrato C |

---

## 6. Guardrails aplicables

- **D5** — dos tipos de respondedor; el escalonado es una restricción de **datos**, no solo de UI.
- #2 — el directorio informa la propuesta; el profesional sigue aceptando el caso.
- **`PR-003` §6.1** — lo único que el joven ve del profesional son los campos públicos.
- Brief §28 — datos ficticios en la demo; prohibido inventar servicios oficiales reales.
- `PR-003` Q7 — sin datos reales ni sintéticos.

---

## 7. Referencia visual

`ProSidebar.tsx` (ítem *"Directorio"*). `ProCaseScreen.tsx` (*"Próxima acción: Asignar
profesional"*). `ProWorkspaceScreen.tsx` (perfil de usuario *"Ana López · Psicología"*) como
semilla del modelo.

---

## 8. Dependencias

- **Bloquea:** `PR-008`, `PR-010`, `PR-011`.
- **Bloqueado por:** `PR-001` §7 (**firma clínica pendiente**: quién responde y con qué formación);
  `PR-003` Q9 ✅ (Supabase Auth).
- **Specs relacionadas:** `PR-006`, `PR-016`.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| P7 | ¿Cuántos profesionales reales hay detrás del piloto? | acotado: demo ≤5 usuarios (Q6) |
| Q8 | ¿La ONG es el único operador? | ⏳ define si hay multi-institución |
| — | ¿Idiomas: solo español o también aimara/quechua? | afecta al emparejamiento por zona e idioma |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
