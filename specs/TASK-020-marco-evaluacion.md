# TASK-020 · Marco de evaluación de 7 dimensiones

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R3 · **Depende de:** `PR-009`, `PR-016`, `PR-017`, `PR-018` · **Bloquea:** evaluación del piloto

---

## 1. Contexto

El resumen ejecutivo define un marco de evaluación de **7 dimensiones**. Ball et al. 2026 lo
justifica con una frase que `COMPARACION` §4.3 cita textualmente: *"La adopción es posible, pero
**el abandono es alto**; el proyecto debe **medir implementación y no solo resultados clínicos**."*

El fracaso más probable de este proyecto no es que el sistema funcione mal, es que nadie lo use. Un
marco que solo mida resultados clínicos no lo detectaría.

Esta spec define **qué se mide, con qué fórmula y de dónde sale cada dato**. Sin esto, el
observatorio (`PR-017`) muestra gráficos sin marco, y el piloto no tiene criterio de éxito.

---

## 2. Alcance

### Dentro
Las **7 dimensiones** del resumen, cada una operacionalizada:

| # | Dimensión | Métrica principal | Fuente |
|---|---|---|---|
| 1 | **Alcance** | jóvenes alcanzados / objetivo del piloto | `PR-004` |
| 2 | **Uso** | sesiones activas, conversaciones iniciadas, herramientas completadas | APK (B) + `PR-004` |
| 3 | **Seguridad** | alertas revisadas / emitidas; falsos positivos; falsos negativos; **casos sin respuesta** | `PR-009`, `PR-018` |
| 4 | **Derivación** | derivaciones completadas / iniciadas; tiempo hasta atención | `PR-016` |
| 5 | **Aceptabilidad** | satisfacción del joven y del equipo; uso del canal de apoyo | `TASK-019`, encuestas |
| 6 | **Resultados preliminares** | cambio en señales entre la primera y la última medición | `PR-006`, APK |
| 7 | **Implementación** | adherencia del equipo, SLAs cumplidos, **abandono** | `PR-009`, `PR-018` |

**Además:**
- Definición explícita de **abandono** (la métrica más importante según Ball et al.): propuesta —
  un joven que no vuelve a abrir la app en 14 días tras iniciar un recorrido.
- **Umbrales de éxito** por dimensión, acordados con la ONG **antes** del piloto.
- Un **tablero de evaluación** que consume `PR-017` sin exponer datos individuales.
- Registro de **línea base**: sin medición previa, "mejoró" no significa nada.
- **🆕 Modo demo** (`PR-003` Q6/Q7): alcance demostrativo ≤5 usuarios, **sin datos reales ni
  sintéticos**. El marco se entrega **definido y listo**, pero **no medible** a esa escala: el
  tablero opera en modo demo y el scorecard declara `baseline = null`.

### Fuera
- La ejecución del piloto y la recolección de encuestas: personas / ONG.
- El co-diseño con adolescentes: `TASK-022` (persona).
- Las visualizaciones: `PR-017`.
- Cualquier métrica que requiera datos que el proyecto decidió no guardar (p. ej. el chat).

---

## 3. Módulo y propiedad

- Módulo: `puente-red/deliverables/evaluation` (documento) + `puente-red/portal/evaluation`
- Dueño: **C** (el marco). La interpretación clínica es de una persona.
- Stack: **TypeScript + React + Vite**; agregación en **Supabase**
- Archivos compartidos que necesita declarar: **ninguno del APK**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type EvaluationDimension string
const (
    DimReach                EvaluationDimension = "REACH"
    DimUsage                EvaluationDimension = "USAGE"
    DimSafety               EvaluationDimension = "SAFETY"
    DimReferral             EvaluationDimension = "REFERRAL"
    DimAcceptability        EvaluationDimension = "ACCEPTABILITY"
    DimPreliminaryOutcomes  EvaluationDimension = "PRELIMINARY_OUTCOMES"
    DimImplementation       EvaluationDimension = "IMPLEMENTATION"
)

type DimensionScore struct {
    Dimension     EvaluationDimension
    Metrics       map[string]float64
    Target        *float64 // umbral acordado antes del piloto
    MeetsTarget   *bool    // nil si no hay umbral definido
    DataSourceKeys []string
}

type EvaluationScorecard struct {
    Period          Period
    Baseline        *Period // nil si no se midió antes
    Scores          []DimensionScore
    AbandonmentRate float64 // métrica destacada
    IsDemoData      bool
    GeneratedAt     time.Time
}
```

**Regla:** toda métrica declara su `DataSourceKeys`. Una métrica que no puede trazarse a una
fuente **no entra** en el marco.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Las 7 dimensiones existen y cada una tiene al menos una métrica | revisión de esquema |
| 2 | Cada métrica declara su fuente y la fuente existe | integración |
| 3 | *Casos sin respuesta* (dimensión Seguridad) es visible y destacada | revisión visual |
| 4 | El abandono se calcula con una definición escrita y única | unitaria con dataset de ejemplo |
| 5 | Los umbrales se cargan como configuración acordada, no como constantes en código | contrato |
| 6 | El tablero no expone datos individuales (respeta `k` de `PR-017`) | contrato |
| 7 | Sin línea base, el sistema lo declara y **no afirma mejoría** | unitaria + revisión de copy |
| 8 | El scorecard es exportable para el informe de la competencia | integración |
| 9 | 🆕 En modo demo, `IsDemoData = true` y la UI lo declara | revisión visual + contrato |

---

## 6. Guardrails aplicables

- Ball et al. 2026 — medir implementación, no solo resultados clínicos.
- `PR-001` §2 — los resultados se expresan como cambio en señales, no como resultado clínico.
- Brief §29.3 — el reporte comunitario es agregado y anónimo.
- **`PR-003` Q6/Q7** — demo ≤5 usuarios, sin datos reales ni sintéticos. Criterio 9.
- P11 — la publicación de métricas con menores requiere aprobación legal.
- P5 (`PR-001`) — no inflar métricas de cobertura.

---

## 7. Referencia visual

`ProVisualizationsScreen.tsx` y `ObservatoryScreen.tsx` — el lenguaje de visualización ya existe;
el marco lo usa, no lo redefine (brief §37).

---

## 8. Dependencias

- **Bloquea:** la evaluación del piloto (Fases 4–5 del resumen).
- **Bloqueado por:** `PR-009`, `PR-016`, `PR-017`, `PR-018`.
- **Coordinación:** los umbrales los acuerda la ONG, no C.

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿El piloto de 8-12 semanas condiciona el alcance? | define el periodo de medición y el tamaño muestral |
| — | ¿Qué se considera "abandono"? (propuesta: 14 días sin abrir) | es la métrica central; debe acordarse |
| — | ¿Quién interpreta clínicamente los resultados preliminares? | no es tarea de un agente |
| P11 | ¿Quién aprueba la publicación de métricas? | cumplimiento |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`npm run build`) y pasa lint
- [ ] Pruebas de los 9 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
