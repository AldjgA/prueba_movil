# PR-013 · Ficha de caso estructurada (7 secciones)

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-006`, `PR-009`, `PR-014`, `PR-003`
**Bloquea a:** `PR-015` (el timeline cuelga de la ficha), `PR-016` (derivar desde la ficha)

---

## Contexto

El brief §24 es tajante: *"No mostrar toda la conversación. Crear una FICHA ESTRUCTURADA."*
La ficha es el documento de trabajo del profesional: lo que necesita saber para decidir, sin
acceso al chat.

Las 7 secciones están fijadas por el brief §24 y se implementan tal cual. La ficha **repite el
encuadre del guardrail #1**: lo que muestra es *organización* de señales, no diagnóstico.

---

## Alcance

### Dentro

Las **7 secciones** del brief §24, en este orden:

| # | Sección | Fuente |
|---|---|---|
| 1 | **Motivo registrado** | `PR-004` / `PR-006` |
| 2 | **Evolución longitudinal** | `PR-006` + historial de `PR-009` |
| 3 | **Señales observadas** | `PR-006` (`SignalTag`) |
| 4 | **Factores protectores** | `PR-006` (`ProtectiveFactor`) |
| 5 | **Herramientas utilizadas en Puente** | paquete de alerta (TASK-015, de B) |
| 6 | **Resumen autorizado** | `AuthorizedSummary` (solo el scope consentido) |
| 7 | **Historial de acciones** | `PR-015` (timeline) |

- Encabezado con `caseToken`, categoría, banda de edad y fecha de registro.
- Panel lateral de estado: nivel de atención, tiempo esperando, estado, responsable,
  consentimiento.
- CTA *"Tomar caso"* → transición humana de `PR-009`.
- Enlace a *"Abrir ficha de acompañamiento"* → `PR-014`.
- Bloqueo explícito: la sección 6 muestra **solo** el scope autorizado; si algo no está en el
  scope, la ficha dice *"No autorizado para compartir"*, no lo omite en silencio.

### Fuera

- **La conversación completa.** Prohibido por guardrail #5 y brief §24.
- Las notas internas: van en `PR-014`, visualmente separadas.
- Editar la valoración profesional: `PR-014`.
- Ver la identidad del joven: no existe en el portal (guardrail #3).

---

## Módulo y propiedad

- Módulo: `puente-red/portal/case`
- Dueño: **C**.

```
loadCase(session, caseToken) -> CaseFicha
takeCase(session, caseToken) -> CaseTicket
```

---

## Contratos de datos

```kotlin
data class CaseFicha(
    val caseToken: CaseToken,
    val category: ProfessionalCategory,
    val youthLevel: AttentionLevel,
    val ageBand: AgeBand,
    val registeredAtEpochMillis: Long,
    val section1Motive: MotiveView,
    val section2Evolution: List<EvolutionPoint>,   // { date, labelKey, intensityBand }
    val section3Signals: List<SignalView>,
    val section4ProtectiveFactors: List<ProtectiveFactorView>,
    val section5ToolsUsed: List<ToolUsageView>,
    val section6AuthorizedSummary: AuthorizedSummaryView, // con marcas de lo NO autorizado
    val section7ActionHistory: List<ActionEvent>,
    val status: CaseStatusView,
)

data class AuthorizedSummaryView(
    val items: List<SummaryItemView>,
    val notAuthorizedMarkers: List<String>, // p. ej. "conversación completa"
)
```

**Regla dura:** `section6` se construye **exclusivamente** desde `AuthorizedSummary`. No hay
acceso a la conversación en esta capa: si el dato no está autorizado, el servicio no lo tiene.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | La ficha renderiza las 7 secciones, siempre, en el orden del brief §24 | revisión visual + prueba de esquema |
| 2 | La sección 6 nunca contiene texto de la conversación no autorizada | prueba de contrato: el payload no incluye el campo |
| 3 | Lo no autorizado se muestra como *"No autorizado para compartir"*, no se omite | prueba unitaria |
| 4 | La ficha no contiene nombre, alias ni identidad del joven | prueba de contrato |
| 5 | *"Tomar caso"* requiere un actor humano y registra trazabilidad | prueba de integración con `PR-009` |
| 6 | La sección 2 grafica la evolución con banda cualitativa, no con score | revisión visual + aserción de tipo |
| 7 | El encabezado repite el encuadre de prioridad preliminar (guardrail #1) | revisión de copy |
| 8 | La ficha es de solo lectura salvo `takeCase` (las notas van en `PR-014`) | prueba de contrato |

---

## Guardrails aplicables

- #1 — encuadre de prioridad preliminar repetido en la ficha.
- #3 — sin identidad del joven.
- #5 — el chat completo nunca entra. Criterios 2 y 3.
- #4 — las notas internas no llegan al joven (viven en `PR-014`, no aquí).
- Brief §24 — las 7 secciones.

---

## Referencia visual

`ProCaseScreen.tsx` — encabezado `PJ-032 · AMARILLO · Patrón creciente`, *"EVOLUCIÓN DEL
CASO"*, *"SEÑALES REGISTRADAS"*, *"FACTORES PROTECTORES"*, *"APOYO REALIZADO EN PUENTE"*,
*"RESUMEN AUTORIZADO POR EL ADOLESCENTE"*, panel *"ESTADO DEL CASO"*, CTA *"Tomar caso"*.
`ProCaseFichaScreen.tsx` — la ficha de 7 secciones.

---

## Dependencias

- **Bloqueado por:** `PR-003` (contrato de datos, de A), `PR-006`, `PR-009`.
- **Bloquea a:** `PR-015`, `PR-016`.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| P3 | ¿El profesional ve el alias? | hoy no; si se decide que sí, cambia la sección 6 y el guardrail #3 |
| — | ¿Se permite exportar/imprimir la ficha? | decisión de privacidad: propuesta, no en el MVP |
