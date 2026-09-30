# PR-014 · Separación «organizado por Puente» / «valoración profesional»

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-013`
**Bloquea a:** `PR-013` (la ficha contiene esta separación), `PR-018` (audita quién escribió qué)

---

## Contexto

El brief §25 lo marca como **MUY IMPORTANTE**: dos áreas visualmente separadas.

- **ORGANIZADO POR PUENTE** — situación, patrones, frecuencia, evolución, resumen autorizado,
  herramientas utilizadas. Lo produce el sistema.
- **VALORACIÓN PROFESIONAL** — valoración, acción realizada, derivación, próximo seguimiento,
  notas internas. **La IA no llena estos campos automáticamente.**

Esta separación es la implementación visual del guardrail #3 (*"la IA no diagnostica"*) y del
principio *"la IA apoya, no reemplaza"* (Poulsen et al. 2026; M. Li et al. 2026). No es un
detalle estético: es la frontera entre lo que el sistema infiere y lo que una persona afirma.

---

## Alcance

### Dentro

- Dos contenedores visualmente distintos en la ficha, con encabezados fijos:
  *"Organizado por Puente"* y *"Valoración profesional"*.
- **Campos manuales** de valoración profesional (brief §25):
  - Valoración;
  - Acción realizada;
  - Derivación;
  - Próximo seguimiento;
  - Notas internas.
- Marcar cada campo manual con **autor y fecha** (alimenta `PR-018`).
- Garantía estructural: **ningún** campo del bloque profesional se rellena por el sistema. Si un
  campo está vacío, se muestra vacío con su CTA, no con un valor sugerido.
- Las **notas internas** son invisibles para el joven por diseño (guardrail #4).

### Fuera

- El contenido del bloque "organizado por Puente": viene de `PR-013`.
- La derivación como flujo (estados, servicios): `PR-016` — aquí solo se registra el campo.
- El envío de la valoración al joven: **no existe**. Nada de este bloque sale del portal.

---

## Módulo y propiedad

- Módulo: `puente-red/portal/case/professional-assessment`
- Dueño: **C**.

```
saveProfessionalAssessment(session, caseToken, assessment) -> ProfessionalAssessment
```

---

## Contratos de datos

```kotlin
/**
 * Bloque manual. NINGÚN campo tiene valor por defecto generado por el sistema.
 * Todos son nullable y vacíos hasta que una persona los escribe.
 */
data class ProfessionalAssessment(
    val caseToken: CaseToken,
    val valuation: String?,
    val actionTaken: String?,
    val referral: String?,          // el detalle vive en PR-016
    val nextFollowUpAtEpochMillis: Long?,
    val internalNotes: String?,     // NUNCA visible para el joven
    val authoredBy: ResponderId,
    val authoredAtEpochMillis: Long,
)

enum class FichaBlock { ORGANIZED_BY_PUENTE, PROFESSIONAL_ASSESSMENT }
```

**Invariante de diseño:** el servicio que sirve `FichaBlock.ORGANIZED_BY_PUENTE` **no tiene
permiso de escritura** en `ProfessionalAssessment`, y el que escribe la valoración **no genera**
contenido. Son dos servicios con permisos disjuntos.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Los dos bloques tienen encabezados fijos y visualmente distinguibles | revisión visual |
| 2 | Ningún campo de `ProfessionalAssessment` se rellena automáticamente | prueba: con caso nuevo, todos son `null` |
| 3 | No existe endpoint que escriba en el bloque profesional sin un `ResponderId` | prueba de contrato |
| 4 | `internalNotes` nunca aparece en ningún payload hacia el joven | prueba de contrato sobre `PR-019` |
| 5 | Todo guardado de valoración registra autor y fecha | prueba de integración con `PR-018` |
| 6 | El bloque "organizado por Puente" es de solo lectura | prueba de contrato |
| 7 | Si un campo manual está vacío, se muestra su CTA, no un texto sugerido | revisión visual |

---

## Guardrails aplicables

- **#2/#3 — la IA no llena la valoración.** Criterios 2, 3 y 6.
- #4 — las notas internas no llegan al joven. Criterio 4.
- Brief §25 — separación explícita y campos manuales exactos.

---

## Referencia visual

`ProCaseFichaScreen.tsx` — los dos bloques con encabezado. El brief §25 nombra los campos
textualmente; el diseño debe respetar esa nomenclatura.

---

## Dependencias

- **Bloqueado por:** `PR-013`.
- **Bloquea a:** `PR-018` (auditoría de escritura profesional), `PR-016` (el campo derivación).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿Las notas internas son editables después de guardar, o inmutables con versiones? | propuesta: inmutables con versiones; alimenta mejor la auditoría |
| — | ¿Un `GUIDANCE` puede escribir valoración? | depende de la matriz de `PR-010` (hoy: no) |
| P12 | ¿La revocación del joven afecta a las notas internas ya escritas? | `PR-019` debe responderlo |
