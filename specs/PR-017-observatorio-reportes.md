# PR-017 · Observatorio y reportes agregados

**Estado:** En revisión
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R2 · **Depende de:** `PR-011`, `PR-012`, `PR-015`, `PR-016` · **Bloquea:** `TASK-020`

---

## 1. Contexto

El brief §29 define **tres niveles** de reporte:

| Nivel | Quién lo ve | Dónde vive |
|---|---|---|
| 1. Reporte personal | El adolescente | **APK juvenil** (B, `feature:report`) |
| 2. Reporte de seguimiento | Equipo autorizado | `PR-015` (timeline) |
| 3. **Reporte comunitario** | Agregado/anónimo | **este documento** |

El brief §30 pide además *"Observatorio Puente"*, separado de los casos individuales, y lo cierra
con una regla: *"NO gráficos decorativos."*

**Por qué importa:** Ball et al. 2026 (citado en `COMPARACION` §4.3) advierte que *"el abandono es
alto; el proyecto debe medir implementación y no solo resultados clínicos"*. El observatorio es la
pieza que hace eso medible.

---

## 2. Alcance

### Dentro

**A. Observatorio** (brief §30) con las cinco preguntas exactas:

1. ¿Qué situaciones están aumentando?
2. ¿Dónde aparecen?
3. ¿Cuántos casos reciben respuesta?
4. ¿Cuánto tardamos en responder?
5. ¿Cuántas derivaciones se completan?

**B. Visualizaciones** (brief §30), cada una con propósito declarado:

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

**D. Anonimato del agregado:**
- **k-anonimato mínimo** (propuesta: `k = 5`). Ningún corte con menos de 5 casos se muestra.
- Prohibido incluir nombres o conversaciones individuales.
- Suprimir cortes que, cruzados, permitan reidentificar.

**E. 🆕 Modo demo sin datos** (`PR-003` Q6/Q7): la demo **no usa datos reales ni sintéticos**. El
observatorio muestra la estructura, las preguntas y los tipos de gráfico con datos ficticios
**etiquetados como tales**, y declara explícitamente que no hay datos reales.

### Fuera
- El reporte personal: es del APK (B).
- El reporte de seguimiento por caso: `PR-015`.
- La auditoría de accesos: `PR-018`.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/portal/observatory` + `puente-red/backend/core/analytics`
- Dueño: **C**
- Stack: **TypeScript + React + Vite** / **Go**; agregación en **Supabase**
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type CommunityReport struct {
    Period                  Period
    Trends                  []TrendSeries
    ByZone                  []ZoneBucket
    Funnel                  Funnel
    ResponseTimeDistribution Distribution
    ReferralCompletion      CompletionRate
    KAnonymityThreshold     int // 5
    SuppressedBuckets       int // cuántos cortes se ocultaron por k
    IsDemoData              bool
    GeneratedAt             time.Time
}

type Funnel struct {
    Received     int
    Acknowledged int
    Taken        int
    Referred     int
    Closed       int
}
```

**Regla de supresión:** todo bucket con `count < k` se agrega a `"otros"` o se omite, y
`SuppressedBuckets` lo declara. La UI **no** debe poder reconstruir el dato suprimido sumando
otros cortes.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Las cinco preguntas del brief §30 tienen respuesta visible | revisión visual |
| 2 | Ningún bucket con menos de `k = 5` casos es visible | unitaria con dataset de buckets pequeños |
| 3 | La UI declara cuántos cortes se suprimieron | contrato + revisión |
| 4 | Ninguna visualización expone datos individuales ni conversaciones | contrato |
| 5 | El funnel cuadra con `PR-009` y `PR-016` | integración |
| 6 | Solo roles autorizados (`PR-010`) acceden al observatorio | autorización |
| 7 | Cada gráfico tiene una pregunta asociada; no hay gráficos sin propósito | revisión visual (brief §30) |
| 8 | Las métricas distinguen *implementación* de *resultado clínico* | revisión de catálogo |
| 9 | 🆕 En modo demo, `IsDemoData = true` y la UI lo declara de forma visible | revisión visual + contrato |

---

## 6. Guardrails aplicables

- Brief §29.3 — agregado y anónimo; sin nombres ni conversaciones.
- Brief §30 — *"NO gráficos decorativos"*.
- `PR-001` §2 — los niveles se muestran como prioridad de revisión, no como gravedad clínica.
- Ball et al. 2026 — medir implementación, no solo resultado.
- **`PR-003` Q6/Q7** — demo ≤5 usuarios, sin datos reales ni sintéticos. Criterio 9.
- P11 — el responsable legal debe aprobar los cortes.

---

## 7. Referencia visual

`ObservatoryScreen.tsx` y `ProVisualizationsScreen.tsx` — el lenguaje de visualización ya existe
en el prototipo; el brief §37 prohíbe rediseñarlo. `ProSidebar.tsx` — *"Reportes"* y
*"Observatorio"*.

---

## 8. Dependencias

- **Bloquea:** `TASK-020`.
- **Bloqueado por:** `PR-011`, `PR-012`, `PR-015`, `PR-016`.
- **Specs relacionadas:** `TASK-020` (marco de evaluación).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| — | ¿`k = 5` es suficiente para un piloto pequeño? | con pocos casos, casi todo se suprime |
| — | ¿Quién aprueba los cortes desde el punto de vista legal? | P11 |
| — | ¿El piloto de 8-12 semanas condiciona el periodo? | define la granularidad temporal |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...` + `npm run build`) y pasa lint
- [ ] Pruebas de los 9 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
