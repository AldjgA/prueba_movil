# PR-014 · Separación «organizado por Puente» / «valoración profesional»

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-013` · **Bloquea:** `PR-013`, `PR-018`

---

## 1. Contexto

El brief §25 lo marca como **MUY IMPORTANTE**: dos áreas visualmente separadas.

- **ORGANIZADO POR PUENTE** — situación, patrones, frecuencia, evolución, resumen autorizado,
  herramientas utilizadas. Lo produce el sistema.
- **VALORACIÓN PROFESIONAL** — valoración, acción realizada, derivación, próximo seguimiento,
  notas internas. **La IA no llena estos campos automáticamente.**

Esta separación es la implementación visual del guardrail #3 (*"la IA no diagnostica"*) y del
principio *"la IA apoya, no reemplaza"* (Poulsen et al. 2026; M. Li et al. 2026). No es un detalle
estético: es la frontera entre lo que el sistema infiere y lo que una persona afirma.

---

## 2. Alcance

### Dentro
- Dos contenedores visualmente distintos, con encabezados fijos: *"Organizado por Puente"* y
  *"Valoración profesional"*.
- **Campos manuales** (brief §25): valoración; acción realizada; derivación; próximo seguimiento;
  notas internas.
- Marcar cada campo manual con **autor y fecha** (alimenta `PR-018`).
- Garantía estructural: **ningún** campo del bloque profesional se rellena por el sistema.
- Las **notas internas** son invisibles para el joven por diseño (guardrail #4).

### Fuera
- El contenido del bloque "organizado por Puente": viene de `PR-013`.
- La derivación como flujo (estados, servicios): `PR-016` — aquí solo se registra el campo.
- El envío de la valoración al joven: **no existe**. Nada de este bloque sale del portal.
- Los **datos públicos del profesional** que el joven sí ve (`PR-003` §6.1): van en dirección
  contraria y **no** forman parte de este bloque.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/case/professional-assessment`
- Dueño: **C**
- Stack: **TypeScript + React + Vite**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
// Bloque manual. NINGÚN campo tiene valor por defecto generado por el sistema.
type ProfessionalAssessment struct {
    CaseToken        string
    Valuation        *string
    ActionTaken      *string
    Referral         *string   // el detalle vive en PR-016
    NextFollowUpAt   *time.Time
    InternalNotes    *string   // NUNCA visible para el joven
    AuthoredBy       string
    AuthoredAt       time.Time
}

type FichaBlock string
const (
    BlockOrganizedByPuente   FichaBlock = "ORGANIZED_BY_PUENTE"
    BlockProfessionalAssessment FichaBlock = "PROFESSIONAL_ASSESSMENT"
)
```

**Invariante de diseño:** el servicio que sirve `BlockOrganizedByPuente` **no tiene permiso de
escritura** en `ProfessionalAssessment`, y el que escribe la valoración **no genera** contenido.
Son dos servicios con permisos disjuntos.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Los dos bloques tienen encabezados fijos y visualmente distinguibles | revisión visual |
| 2 | Ningún campo de `ProfessionalAssessment` se rellena automáticamente | unitaria: con caso nuevo, todos `nil` |
| 3 | No existe endpoint que escriba en el bloque profesional sin un `ResponderId` | contrato |
| 4 | `InternalNotes` nunca aparece en ningún payload hacia el joven | contrato sobre `PR-019` |
| 5 | Todo guardado de valoración registra autor y fecha | integración con `PR-018` |
| 6 | El bloque "organizado por Puente" es de solo lectura | contrato |
| 7 | Si un campo manual está vacío, se muestra su CTA, no un texto sugerido | revisión visual |

---

## 6. Guardrails aplicables

- **#2 / #3 — la IA no llena la valoración.** Criterios 2, 3 y 6.
- #4 — las notas internas no llegan al joven. Criterio 4.
- Brief §25 — separación explícita y campos manuales exactos.
- **`PR-003` §6.1** — los datos del profesional hacia el joven son otro flujo, no este.

---

## 7. Referencia visual

`ProCaseFichaScreen.tsx` — los dos bloques con encabezado. El brief §25 nombra los campos
textualmente; el diseño debe respetar esa nomenclatura.

---

## 8. Dependencias

- **Bloquea:** `PR-013` (la ficha contiene esta separación), `PR-018`.
- **Bloqueado por:** `PR-013`.
- **Specs relacionadas:** `PR-016` (campo derivación), `PR-019` (notas internas vs revocación).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Las notas internas son editables después de guardar, o inmutables con versiones? | propuesta: inmutables con versiones |
| — | ¿Un `ORIENTACION` puede escribir valoración? | depende de la matriz de `PR-010` (hoy: no) |
| P12 | ¿La revocación del joven afecta a las notas internas ya escritas? | `PR-019` debe responderlo |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`npm run build`) y pasa lint
- [ ] Pruebas de los 7 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
