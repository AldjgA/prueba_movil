# TASK-020 · Marco de evaluación de 7 dimensiones

**Agente:** C · **Ola:** R3 · **Depende de:** `PR-017`, `PR-018`, `PR-009`, `PR-016`
**Bloquea a:** la evaluación del piloto (Fase 4–5 del resumen ejecutivo)

---

## Contexto

El resumen ejecutivo define un marco de evaluación de **7 dimensiones**. Ball et al. 2026 lo
justifica con una frase que `COMPARACION` §4.3 cita textualmente: *"La adopción es posible, pero
**el abandono es alto**; el proyecto debe **medir implementación y no solo resultados
clínicos**."*

Es decir: el fracaso más probable de este proyecto no es que el sistema funcione mal, es que
nadie lo use. Un marco que solo mida resultados clínicos no lo detectaría.

Esta spec define **qué se mide, con qué fórmula y de dónde sale cada dato**. Sin esto, el
observatorio (`PR-017`) muestra gráficos sin marco, y el piloto no tiene criterio de éxito.

---

## Alcance

### Dentro

Las **7 dimensiones** del resumen, cada una con métricas operacionalizadas:

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

- Definición explícita de **abandono** (la métrica más importante según Ball et al.): propuesta
  — un joven que no vuelve a abrir la app en 14 días tras iniciar un recorrido.
- **Umbrales de éxito** por dimensión, acordados con la ONG **antes** del piloto (no después).
- Un **tablero de evaluación** que consume `PR-017` sin exponer datos individuales.
- Registro de **línea base**: sin medición previa, "mejoró" no significa nada.

### Fuera

- La ejecución del piloto y la recolección de encuestas: personas / ONG.
- El co-diseño con adolescentes: `TASK-022` (persona).
- Las visualizaciones: `PR-017`.
- Cualquier métrica que requiera datos que el proyecto decidió no guardar (p. ej. contenido del
  chat).

---

## Módulo y propiedad

- Módulo: `puente-red/deliverables/evaluation` (documento) + `puente-red/portal/evaluation`
- Dueño: **C** (el marco). La interpretación clínica es de una persona.

```
evaluate(period) -> EvaluationScorecard   // 7 dimensiones, con supresión k (PR-017)
```

---

## Contratos de datos

```kotlin
enum class EvaluationDimension {
    REACH, USAGE, SAFETY, REFERRAL, ACCEPTABILITY, PRELIMINARY_OUTCOMES, IMPLEMENTATION
}

data class DimensionScore(
    val dimension: EvaluationDimension,
    val metrics: Map<String, Double>,     // nombre → valor
    val target: Double?,                  // umbral acordado antes del piloto
    val meetsTarget: Boolean?,            // null si no hay umbral definido
    val dataSourceKeys: List<String>,     // trazabilidad de cada métrica
)

data class EvaluationScorecard(
    val period: Period,
    val baseline: Period?,                // línea base; null si no se midió antes
    val scores: List<DimensionScore>,
    val abandonmentRate: Double,          // métrica destacada
    val generatedAtEpochMillis: Long,
)
```

**Regla:** toda métrica declara su `dataSourceKeys`. Una métrica que no puede trazarse a una
fuente no entra en el marco.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Las 7 dimensiones existen y cada una tiene al menos una métrica | revisión del esquema |
| 2 | Cada métrica declara su fuente y la fuente existe | prueba de integración |
| 3 | *Casos sin respuesta* (dimensión Seguridad) es visible y destacada | revisión visual |
| 4 | El abandono se calcula con una definición escrita y única | prueba unitaria con dataset de ejemplo |
| 5 | Los umbrales se cargan como configuración acordada, no como constantes en código | prueba de contrato |
| 6 | El tablero no expone datos individuales (respeta `k` de `PR-017`) | prueba de contrato |
| 7 | Sin línea base, el sistema lo declara y no afirma mejoría | prueba unitaria + revisión de copy |
| 8 | El scorecard es exportable para el informe de la competencia | prueba de integración |

---

## Guardrails aplicables

- Ball et al. 2026 — medir implementación, no solo resultados clínicos.
- #1 — los resultados se expresan como cambio en señales, no como resultado clínico.
- Brief §29.3 — el reporte comunitario es agregado y anónimo.
- P11 — la publicación de métricas con menores requiere aprobación legal.
- P5 (`PR-001`) — no inflar métricas de cobertura.

---

## Referencia visual

`ProVisualizationsScreen.tsx` y `ObservatoryScreen.tsx` — el lenguaje de visualización ya
existe; el marco lo usa, no lo redefine (brief §37).

---

## Dependencias

- **Bloqueado por:** `PR-017`, `PR-018`, `PR-009`, `PR-016`.
- **Bloquea a:** la evaluación del piloto (Fases 4–5 del resumen).
- **Coordinación:** los umbrales los acuerda la ONG, no C.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| Q7 | ¿El piloto de 8-12 semanas condiciona el alcance? | define el periodo de medición y el tamaño muestral |
| — | ¿Qué se considera "abandono"? (propuesta: 14 días sin abrir) | es la métrica central; debe acordarse |
| — | ¿Quién interpreta clínicamente los resultados preliminares? | no es tarea de un agente |
| P11 | ¿Quién aprueba la publicación de métricas? | cumplimiento |
