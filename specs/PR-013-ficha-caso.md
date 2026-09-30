# PR-013 · Ficha de caso estructurada (7 secciones)

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-003` §4, `PR-006`, `PR-009`, `PR-014` · **Bloquea:** `PR-015`, `PR-016`

---

## 1. Contexto

El brief §24 es tajante: *"No mostrar toda la conversación. Crear una FICHA ESTRUCTURADA."* La
ficha es el documento de trabajo del profesional: lo que necesita saber para decidir, sin acceso
al chat.

Las 7 secciones están fijadas por el brief §24 y se implementan tal cual. La ficha **repite el
encuadre del guardrail #1**: lo que muestra es *organización* de señales, no diagnóstico.

---

## 2. Alcance

### Dentro
Las **7 secciones** del brief §24, en este orden:

| # | Sección | Fuente |
|---|---|---|
| 1 | **Motivo registrado** | `PR-004` / `PR-006` |
| 2 | **Evolución longitudinal** | `PR-006` + historial de `PR-009` |
| 3 | **Señales observadas** | `PR-006` (`SignalTag`) |
| 4 | **Factores protectores** | `PR-006` (`ProtectiveFactor`) |
| 5 | **Herramientas utilizadas en Puente** | las entradas `Tool` del **`scope` autorizado** del Contrato A |
| 6 | **Resumen autorizado** | Contrato A (`PR-003` §4), solo el scope consentido |
| 7 | **Historial de acciones** | `PR-015` (timeline) |

- Encabezado con `caseToken` (**ULID**), `categoria` (MEDIO/ALTO), banda de edad y fecha.
- Panel lateral de estado: nivel de atención, tiempo esperando, estado, responsable, consentimiento.
- CTA *"Tomar caso"* → transición humana de `PR-009`.
- Enlace a *"Abrir ficha de acompañamiento"* → `PR-014`.
- **Bloqueo explícito:** la sección 6 muestra **solo** el scope autorizado; lo no autorizado dice
  *"No autorizado para compartir"*, no se omite en silencio.

> ⚠️ **Corrección por el hallazgo K3 de B.** La sección 5 **no tiene campo propio** en el Contrato A
> (`PR-003` §4): las herramientas solo pueden llegar **dentro del `scope` autorizado**
> (`ShareScopeEntry.Tool(key)`) y **solo si el joven las autorizó**.
>
> Consecuencia: **la sección 5 estará vacía en la mayoría de los casos**, y eso es correcto. El
> criterio 3 (*"No autorizado para compartir"*) **aplica explícitamente aquí**. Pedir herramientas
> fuera del scope sería una ampliación del contrato y rompería `PR-003` §9.1.

### Fuera
- **La conversación completa.** Prohibido por guardrail #5 y brief §24.
- Las notas internas: van en `PR-014`, visualmente separadas.
- Editar la valoración profesional: `PR-014`.
- Ver la identidad del joven: no existe en el portal.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/case`
- Dueño: **C**
- Stack: **TypeScript + React + Vite**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type CaseFicha struct {
    CaseToken        string
    Category         ProfessionalCategory
    YouthLevel       string
    AgeBand          string
    RegisteredAt     time.Time
    Section1Motive   MotiveView
    Section2Evolution []EvolutionPoint // { Date, LabelKey, IntensityBand }
    Section3Signals  []SignalView
    Section4ProtectiveFactors []ProtectiveFactorView
    Section5ToolsUsed []ToolUsageView
    Section6AuthorizedSummary AuthorizedSummaryView
    Section7ActionHistory []ActionEvent
    Status           CaseStatusView
}

type AuthorizedSummaryView struct {
    Items               []SummaryItemView
    NotAuthorizedMarkers []string // p. ej. "conversación completa"
}
```

**Regla dura:** `Section6` se construye **exclusivamente** desde el `ResumenAutorizado`. No hay
acceso a la conversación en esta capa: si el dato no está autorizado, el servicio no lo tiene.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | La ficha renderiza las 7 secciones, siempre, en el orden del brief §24 | revisión visual + esquema |
| 2 | La sección 6 nunca contiene texto de la conversación no autorizada | contrato: el payload no incluye el campo |
| 3 | Lo no autorizado se muestra como *"No autorizado para compartir"*, no se omite | unitaria |
| 4 | La ficha no contiene nombre, alias ni identidad del joven | contrato |
| 5 | *"Tomar caso"* requiere actor humano y registra trazabilidad | integración con `PR-009` |
| 6 | La sección 2 grafica la evolución con banda cualitativa, no con score | revisión visual + aserción de tipo |
| 7 | El encabezado repite el encuadre de prioridad preliminar (guardrail #1) | revisión de copy |
| 8 | La ficha es de solo lectura salvo `takeCase` | contrato |

---

## 6. Guardrails aplicables

- `PR-001` §2 — encuadre de prioridad preliminar repetido en la ficha.
- **`PR-003` §9.7** — sin identidad del joven.
- **`PR-003` §9.2** — el chat completo nunca entra. Criterios 2 y 3.
- #4 — las notas internas no llegan al joven (viven en `PR-014`).
- Brief §24 — las 7 secciones.

---

## 7. Referencia visual

`ProCaseScreen.tsx` — encabezado `PJ-032 · AMARILLO · Patrón creciente`, *"EVOLUCIÓN DEL CASO"*,
*"SEÑALES REGISTRADAS"*, *"FACTORES PROTECTORES"*, *"APOYO REALIZADO EN PUENTE"*, *"RESUMEN
AUTORIZADO POR EL ADOLESCENTE"*, panel *"ESTADO DEL CASO"*, CTA *"Tomar caso"*.
`ProCaseFichaScreen.tsx` — la ficha de 7 secciones.

---

## 8. Dependencias

- **Bloquea:** `PR-015`, `PR-016`.
- **Bloqueado por:** `PR-003` ✅, `PR-006`, `PR-009`, `PR-014`.
- **Specs relacionadas:** `PR-014`, `PR-015`.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿Se permite exportar/imprimir la ficha? | decisión de privacidad: propuesta, no en el MVP |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`npm run build`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
