# PR-017 · Observatorio y reportes agregados

**Agente:** C · **Ola:** R2 · **Depende de:** `PR-011`, `PR-012`, `PR-015`, `PR-016`
**Bloquea a:** `TASK-020` (el marco de evaluación consume estas métricas)

---

## Contexto

El brief §29 define **tres niveles** de reporte. Dos ya tienen dueño en el ecosistema:

| Nivel | Quién lo ve | Dónde vive |
|---|---|---|
| 1. Reporte personal | El adolescente | **APK juvenil** (B, `feature:report`) |
| 2. Reporte de seguimiento | Equipo autorizado | `PR-015` (timeline) |
| 3. **Reporte comunitario** | Agregado/anónimo | **este documento** |

El brief §30 pide además una sección *"Observatorio Puente"*, separada de los casos
individuales, que responda preguntas concretas. Y el brief §30 lo cierra con una regla:
*"NO gráficos decorativos."*

**Por qué importa más de lo que parece:** Ball et al. 2026 (citado en `COMPARACION` §4.3)
advierte que *"el abandono es alto; el proyecto debe medir implementación y no solo resultados
clínicos"*. El observatorio es la pieza que hace eso medible.

---

## Alcance

### Dentro

**A. Observatorio** (brief §30) con las cinco preguntas exactas:

1. ¿Qué situaciones están aumentando?
2. ¿Dónde aparecen?
3. ¿Cuántos casos reciben respuesta?
4. ¿Cuánto tardamos en responder?
5. ¿Cuántas derivaciones se completan?

**B. Visualizaciones** (brief §30), cada una con un propósito declarado:

| Tipo | Para qué |
|---|---|
| Líneas | Tendencias temporales |
| Barras | Comparaciones entre categorías |
| Heatmap | Patrones por zona/tiempo |
| Funnel | Flujo de atención (recibido → respondido → derivado → cerrado) |
| Timeline | Evolución del periodo |
| Distribuciones | Tiempos de respuesta |

**C. Reporte comunitario** (brief §29.3): tendencias, temas frecuentes, barreras de acceso,
abandono, demanda de apoyo.

**D. Garantía de anonimato del agregado:**
- **k-anonimato mínimo** (propuesta: `k = 5`). Ningún corte con menos de 5 casos se muestra.
- Prohibido incluir nombres o conversaciones individuales (brief §29.3).
- Suprimir cortes que, cruzados, permitan reidentificar.

### Fuera

- El reporte personal: es del APK (B).
- El reporte de seguimiento por caso: `PR-015`.
- La auditoría de accesos: `PR-018`.

---

## Módulo y propiedad

- Módulo: `puente-red/portal/observatory` + `puente-red/backend/analytics`
- Dueño: **C**.

```
communityReport(period, dimensions) -> CommunityReport   // con supresión k
```

---

## Contratos de datos

```kotlin
data class CommunityReport(
    val period: Period,
    val trends: List<TrendSeries>,          // por SituationType y tiempo
    val byZone: List<ZoneBucket>,           // heatmap
    val funnel: Funnel,                     // recibido→respondido→derivado→cerrado
    val responseTimeDistribution: Distribution,
    val referralCompletion: CompletionRate,
    val kAnonymityThreshold: Int,           // 5
    val suppressedBuckets: Int,             // cuántos cortes se ocultaron por k
    val generatedAtEpochMillis: Long,
)

data class Funnel(
    val received: Int,
    val acknowledged: Int,
    val taken: Int,
    val referred: Int,
    val closed: Int,
)
```

**Regla de supresión:** todo bucket con `count < k` se agrega a `"otros"` o se omite, y
`suppressedBuckets` lo declara. La UI **no** debe poder reconstruir el dato suprimido sumando
otros cortes.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Las cinco preguntas del brief §30 tienen una respuesta visible en la sección | revisión visual |
| 2 | Ningún bucket con menos de `k = 5` casos es visible | prueba con dataset de buckets pequeños |
| 3 | La UI declara cuántos cortes se suprimieron | prueba de contrato + revisión |
| 4 | Ninguna visualización expone datos individuales ni conversaciones | prueba de contrato |
| 5 | El funnel del brief §30 cuadra con `PR-009` y `PR-016` | prueba de integración |
| 6 | Solo roles autorizados (`PR-010`) acceden al observatorio | prueba de autorización |
| 7 | Cada gráfico tiene una pregunta asociada; no hay gráficos sin propósito | revisión visual (regla del brief §30) |
| 8 | Las métricas distinguen *implementación* de *resultado clínico* | revisión de catálogo de métricas |

---

## Guardrails aplicables

- Brief §29.3 — agregado y anónimo; sin nombres ni conversaciones.
- Brief §30 — *"NO gráficos decorativos"*.
- #1 — los niveles se muestran como prioridad de revisión, no como gravedad clínica.
- Ball et al. 2026 — medir implementación, no solo resultado.
- P11 — el responsable legal del tratamiento de datos de menores debe aprobar los cortes.

---

## Referencia visual

`ObservatoryScreen.tsx` y `ProVisualizationsScreen.tsx` — el lenguaje de visualización ya
existe en el prototipo; el brief §37 prohíbe rediseñarlo. `ProSidebar.tsx` — los ítems
*"Reportes"* y *"Observatorio"*.

---

## Dependencias

- **Bloqueado por:** `PR-011`, `PR-012`, `PR-015`, `PR-016`.
- **Bloquea a:** `TASK-020` (marco de evaluación de 7 dimensiones).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| — | ¿`k = 5` es suficiente para La Paz con un piloto pequeño? | con pocos casos, casi todo se suprime y el observatorio queda vacío; hay que decidirlo con la ONG |
| P11 | ¿Quién aprueba los cortes desde el punto de vista legal? | requisito de cumplimiento |
| Q7 | ¿El piloto de 8-12 semanas condiciona el periodo de reporte? | define la granularidad temporal |
