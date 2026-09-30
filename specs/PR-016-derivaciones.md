# PR-016 · Módulo de derivaciones y directorio de apoyo

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-008`, `PR-013`, `PR-014` · **Bloquea:** `PR-017`

---

## 1. Contexto

Una derivación es el acto de sacar un caso del circuito interno y ponerlo en manos de un servicio
externo (salud, protección, orientación escolar, servicios comunitarios). El brief §27 pide un
**módulo propio** con estados; el brief §28 pide un **directorio de apoyo** con categorías.

Son dos piezas pero un solo flujo: el directorio es la lista de a dónde se puede derivar, y el
módulo es el registro de a dónde se derivó y qué pasó.

**Nota de alcance:** esto es la derivación **externa**. La asignación **interna** de un caso a un
profesional es `PR-008`/`PR-009`.

---

## 2. Alcance

### Dentro

**A. Módulo de derivaciones** (brief §27). Estados exactos:

```
PENDIENTE → CONTACTADO → DERIVADO → ATENCION_INICIADA → SEGUIMIENTO → CERRADO
```

- Por derivación: **servicio, fecha, responsable, tiempo, estado**.
- Registro del **motivo** y de la **respuesta del servicio externo**.
- Recordatorios de seguimiento (enlaza con `PR-015`).
- Trazabilidad completa (`PR-018`).

**B. Directorio de apoyo** (brief §28). Categorías exactas:

```
PSICOLOGIA · SALUD · PROTECCION · ORIENTACION_ESCOLAR · SERVICIOS_COMUNITARIOS
```

- Ficha de servicio: nombre, categoría, zona, contacto, horario, requisitos, accesibilidad.
- **Datos ficticios en la demo** (brief §28: *"No inventar servicios oficiales reales"*), con
  marca visible.
- Búsqueda y filtro por categoría y zona.

### Fuera
- La derivación **interna**: `PR-008`, `PR-009`.
- El campo "derivación" de la valoración profesional: `PR-014` (aquí se materializa).
- **El canal de contacto con el psicólogo**: es `PR-003` §6.2 (opción A, mensajería in-app),
  **baja prioridad** (R2) y candidato a ola **posterior** a esta.
- Cualquier contacto automático con el servicio externo: todo es manual.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/referrals` + `puente-red/backend/core/directory-services`
- Dueño: **C**
- Stack: **TypeScript + React + Vite** / **Go**; persistencia en **Supabase**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type ReferralState string
const (
    ReferralPendiente        ReferralState = "PENDIENTE"
    ReferralContactado       ReferralState = "CONTACTADO"
    ReferralDerivado         ReferralState = "DERIVADO"
    ReferralAtencionIniciada ReferralState = "ATENCION_INICIADA"
    ReferralSeguimiento      ReferralState = "SEGUIMIENTO"
    ReferralCerrado          ReferralState = "CERRADO"
)

type ServiceCategory string
const (
    CategoryPsicologia          ServiceCategory = "PSICOLOGIA"
    CategorySalud               ServiceCategory = "SALUD"
    CategoryProteccion          ServiceCategory = "PROTECCION"
    CategoryOrientacionEscolar  ServiceCategory = "ORIENTACION_ESCOLAR"
    CategoryServiciosComunitarios ServiceCategory = "SERVICIOS_COMUNITARIOS"
)

type SupportService struct {
    ID           string
    Name         string
    Category     ServiceCategory
    Zone         string
    Contact      string
    Schedule     *string
    Requirements *string
    IsFictional  bool // demo
}

type Referral struct {
    ID              string
    CaseToken       string
    ServiceID       string
    State           ReferralState
    MotiveKey       string
    ResponsibleID   string
    CreatedAt       time.Time
    StateChangedAt  time.Time
    ResponseNote    *string
}
```

**Invariante:** una derivación `CERRADO` es terminal. Reabrir crea una **nueva** derivación
enlazada — igual que el timeline, la historia no se reescribe.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Los 6 estados del brief §27 existen y la máquina no permite saltos | unitaria de máquina de estados |
| 2 | Las 5 categorías del brief §28 existen y filtran correctamente | integración |
| 3 | Todo servicio de la demo está marcado `IsFictional = true` y la UI lo declara | unitaria sobre seed + revisión visual |
| 4 | Una derivación siempre tiene un `ResponsibleID` humano | unitaria de dominio |
| 5 | Toda transición queda en el timeline (`PR-015`) y en auditoría (`PR-018`) | integración |
| 6 | El módulo calcula *"tiempo"* desde la creación hasta el estado actual | unitaria |
| 7 | Reabrir una derivación cerrada crea una nueva, no muta la anterior | contrato |
| 8 | La derivación no expone identidad del joven al servicio externo en el MVP | contrato |

---

## 6. Guardrails aplicables

- #2 — derivar es un acto humano; el sistema no deriva solo.
- Brief §28 — datos ficticios; prohibido inventar servicios oficiales reales.
- **#11 / `PR-003` §9.9** — trazabilidad de cada transición.
- **`PR-003` §9.7** — sin identidad del joven.
- `PR-003` Q7 — sin datos reales ni sintéticos.
- ⚠️ **Abierto:** `PR-003` **no** responde si se requiere consentimiento específico para derivar a
  un tercero, ni qué ocurre si el joven revoca con una derivación en curso (ver §9).

---

## 7. Referencia visual

`ProSidebar.tsx` — ítems *"Derivaciones"* y *"Directorio"*. El brief §27 lista los estados y los
campos; el diseño debe respetar esa nomenclatura.

---

## 8. Dependencias

- **Bloquea:** `PR-017`.
- **Bloqueado por:** `PR-008`, `PR-013`, `PR-014`.
- **Specs relacionadas:** `PR-019` (revocación), `PR-015` (timeline).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| **—** | ¿Se registra **consentimiento específico** para derivar a un tercero? | ⏳ **crítico, sin resolver** |
| **—** | ¿La revocación del joven **detiene** una derivación en curso? | ⏳ **crítico, sin resolver** (`PR-019` caso límite 3) |
| — | ¿La ONG tiene convenios reales con servicios? | si los hay, el directorio deja de ser ficticio |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...` + `npm run build`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
