# PR-008 · Motor de derivación escalonado por gravedad y equidad

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R1 · **Depende de:** `PR-005`, `PR-006`, `PR-007` · **Bloquea:** `PR-009`, `PR-016`

---

## 1. Contexto

Con las características del caso (`PR-006`) y el directorio (`PR-007`), este servicio produce una
**propuesta de asignación**: a qué respondedor debería ir el caso.

Aquí aterrizan dos decisiones: **D5** (escalonado por gravedad) y **equidad** — el plan §3.3 exige
que *"la carga no se concentre en dos personas"*.

**Este motor no asigna.** Propone. La asignación efectiva ocurre cuando un profesional **acepta**
(`PR-009`), que es la validación humana obligatoria del guardrail #2.

---

## 2. Alcance

### Dentro
- Puntuar respondedores elegibles contra las características del caso.
- Aplicar el **filtro duro de D5** antes de puntuar: `ALTO` → solo `PSYCHOLOGIST`.
- Aplicar **equidad**: penalizar carga alta y concentración reciente.
- Aplicar **cobertura**: si no hay `OnCall` y el caso es `ALTO`, marcar
  `REQUIRES_ON_CALL_ESCALATION` en vez de asignar fuera de horario.
- Devolver lista ordenada con **motivo explicable** por candidato (claves de catálogo).
- Registrar `EngineVersion` y `WeightsVersion`.
- Sin elegibles → vacío con motivo `NO_ELIGIBLE_RESPONDER`, **nunca** un caso sin ruta.

### Fuera
- Asignar el caso. Propone; el profesional acepta.
- Notificar al joven (guardrail #3).
- Decidir la derivación **externa**: es `PR-016`.
- Reclasificar la categoría: es `PR-005`.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/routing`
- Dueño: **C**
- Runtime: **Go** (o Node/Bun)
- Archivos compartidos que necesita declarar: **ninguno**.

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna**.
- Métodos nuevos que necesita: **ninguno del APK**.

```go
type Candidate struct {
    ResponderID  string
    Score        int      // 0..100, interno; NO se muestra como "probabilidad"
    ReasonKeys   []string // claves de catálogo, explicables
    TradeoffKeys []string // p. ej. "carga_alta", "fuera_de_horario"
}

type RoutingOutcome string // PROPOSED | NO_ELIGIBLE_RESPONDER | REQUIRES_ON_CALL_ESCALATION

type RoutingProposal struct {
    CaseToken     string
    Outcome       RoutingOutcome
    Candidates    []Candidate // ordenada; el primero es el recomendado
    EngineVersion string
    WeightsVersion string
    ProposedAt    time.Time
}
```

**Pesos (propuesta inicial, versionada — no constantes en código):**

| Factor | Peso |
|---|---|
| Especialidad coincide con `SituationType` | 30 |
| Banda de edad servida | 20 |
| Idiomas y zona | 15 |
| Factores protectores ya cubiertos | 10 |
| **Penalización por carga** | −25 |
| **Penalización por concentración reciente** | −15 |

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Con `category = ALTO`, ningún `CAPACITATED_STAFF` aparece en `Candidates` | unitaria |
| 2 | Sin elegibles, `Outcome = NO_ELIGIBLE_RESPONDER` y la cola recibe el caso igual | integración con `PR-009` |
| 3 | Sin `OnCall` y caso `ALTO` → `REQUIRES_ON_CALL_ESCALATION` | unitaria |
| 4 | La propuesta es **determinista** con los mismos pesos e insumos | unitaria de repetibilidad |
| 5 | Un respondedor con carga 3× la mediana nunca es el primero si hay alternativa | unitaria de equidad |
| 6 | Toda propuesta lleva `EngineVersion` y `WeightsVersion` | aserción de esquema |
| 7 | `ReasonKeys` y `TradeoffKeys` salen de catálogo, no son texto libre | aserción de tipo |
| 8 | El motor nunca asigna: no existe endpoint que fije `assignee` | contrato (ausencia de API) |

---

## 6. Guardrails aplicables

- **D5** — el escalonado es un filtro **duro**, no un peso blando. Criterio 1.
- #2 — propone, no asigna. Criterio 8.
- P5 (`PR-001`) — si no hay a quién derivar, se dice; no se finge cobertura.
- **`PR-003` §15** — sin guardia 24/7: `REQUIRES_ON_CALL_ESCALATION` es el resultado honesto
  fuera de horario.
- Equidad — criterios 5 y 6.

---

## 7. Referencia visual

`ProWorkspaceScreen.tsx` (*"casos esperando"*, *"casos sin responsable"*, *"Responsable: Sin
asignar"*). `ProCaseScreen.tsx` (*"Próxima acción: Asignar profesional"*).

---

## 8. Dependencias

- **Bloquea:** `PR-009`, `PR-016`.
- **Bloqueado por:** `PR-005`, `PR-006`, `PR-007` (todos en revisión).
- **Specs relacionadas:** `PR-009` (cola y SLA).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| P6 | ¿Qué significa "el más apropiado"? ¿Qué atributos pesan? | define los pesos; hoy es propuesta |
| — | ¿Cuántos respondedores reales? | acotado: demo ≤5 (Q6) |
| — | ¿Se confirman los pesos con la ONG? | `WeightsVersion` existe precisamente para cambiarlos |

---

## 10. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Compila (`go build ./...`) y pasa lint
- [ ] Pruebas de los 8 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado (si aplica)
- [ ] Sin secretos ni endpoints hardcodeados
- [ ] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)
