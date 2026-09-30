# PR-008 · Motor de derivación escalonado por gravedad y equidad

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-006` (características), `PR-007` (directorio), `PR-005` (categoría)
**Bloquea a:** `PR-009` (la cola consume la asignación propuesta), `PR-016` (derivaciones externas)

---

## Contexto

Con las características del caso (`PR-006`) y el directorio de respondedores (`PR-007`), este
servicio produce una **propuesta de asignación**: a qué respondedor debería ir el caso.

Es donde aterrizan dos decisiones:

- **D5** — escalonado por gravedad: personal capacitado para medio, psicólogo para alto.
- **Equidad** — `PLAN-PUENTE-RED.md` §3.3 exige que *"la carga no se concentre en dos personas"*.

**Este motor no asigna.** Propone. La asignación efectiva ocurre cuando un profesional **acepta**
el caso (`PR-009` y `PR-012`), que es la validación humana obligatoria del guardrail #2.

---

## Alcance

### Dentro

- Puntuar respondedores elegibles contra las características del caso.
- Aplicar el **filtro duro de D5** antes de puntuar: `HIGH` → solo `PSYCHOLOGIST`.
- Aplicar **criterios de equidad**: penalizar carga alta y concentración reciente.
- Aplicar **cobertura**: si no hay `onCall` y el caso es `HIGH`, marcar
  `requiresOnCallEscalation = true` en vez de asignar a alguien fuera de horario.
- Devolver una lista ordenada con **motivo explicable** por candidato (claves de catálogo).
- Registrar `engineVersion` y los pesos usados en cada propuesta.
- Si no hay ningún elegible: devolver vacío con motivo `NO_ELIGIBLE_RESPONDER` — **nunca** un
  caso sin ruta.

### Fuera

- Asignar el caso. Propone; el profesional acepta.
- Notificar al joven de nada (guardrail #3).
- Decidir la derivación **externa** a un servicio comunitario: eso es `PR-016`.
- Reclasificar la categoría: eso es `PR-005`.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/routing`
- Dueño: **C**.

```
propose(caseFeatures: CaseFeatureSet, category: ProfessionalCategory, loads: List<ResponderLoad>)
    -> RoutingProposal
```

---

## Contratos de datos

```kotlin
data class Candidate(
    val responderId: ResponderId,
    val score: Int,                       // 0..100, interno; NO se muestra como "probabilidad"
    val reasonKeys: List<String>,         // claves de catálogo, explicables
    val tradeoffKeys: List<String>,       // p. ej. "carga_alta", "fuera_de_horario"
)

enum class RoutingOutcome { PROPOSED, NO_ELIGIBLE_RESPONDER, REQUIRES_ON_CALL_ESCALATION }

data class RoutingProposal(
    val caseToken: CaseToken,
    val outcome: RoutingOutcome,
    val candidates: List<Candidate>,      // ordenada; el primero es el recomendado
    val engineVersion: String,
    val weightsVersion: String,
    val proposedAtEpochMillis: Long,
)
```

**Pesos (propuesta inicial, versionada):**

| Factor | Peso | Nota |
|---|---|---|
| Especialidad coincide con `SituationType` | 30 | `PR-006` |
| Banda de edad servida | 20 | |
| Idiomas y zona | 15 | La Paz |
| Factores protectores ya cubiertos por el respondedor | 10 | |
| **Penalización por carga** | −25 | equidad |
| **Penalización por concentración reciente** | −15 | `casesTakenLast7Days` |

Los pesos son **configuración versionada**, no constantes en código. Cambiarlos requiere
`weightsVersion` nuevo y queda auditado.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Con `category = HIGH`, ningún `CAPACITATED_STAFF` aparece en `candidates` | prueba unitaria |
| 2 | Si no hay elegibles, `outcome = NO_ELIGIBLE_RESPONDER` y la cola recibe el caso igual | prueba de integración con `PR-009` |
| 3 | Sin respondedor `onCall` y caso `HIGH`, el resultado es `REQUIRES_ON_CALL_ESCALATION` | prueba unitaria |
| 4 | La propuesta es **determinista** con los mismos pesos e insumos | prueba de repetibilidad |
| 5 | Un respondedor con carga 3× la mediana nunca es el primero si hay alternativa | prueba de equidad con escenario construido |
| 6 | Toda propuesta lleva `engineVersion` y `weightsVersion` | aserción de esquema |
| 7 | Los `reasonKeys` y `tradeoffKeys` salen de catálogo, no son texto libre | aserción de tipo |
| 8 | El motor nunca asigna por sí solo: no existe endpoint que fije `assignee` | prueba de contrato (ausencia de API) |

---

## Guardrails aplicables

- D5 — el escalonado es un filtro duro, no un peso blando. Criterio 1.
- #2 — propone, no asigna. Criterio 8.
- P5 (`PR-001`) — si no hay a quién derivar, se dice; no se finge cobertura.
- Equidad — criterios 5 y 6.

---

## Referencia visual

`ProWorkspaceScreen.tsx` — *"casos esperando"*, *"casos sin responsable"*, *"Responsable: Sin
asignar"*. `ProCaseScreen.tsx` — bloque *"Próxima acción: Asignar profesional"*.

---

## Dependencias

- **Bloqueado por:** `PR-006` y `PR-007`.
- **Bloquea a:** `PR-009` (cola), `PR-016` (derivaciones).
- **Riesgo declarado:** con muy pocos respondedores reales (P7), el motor degenera en "asignar
  al único disponible". Debe declararlo en `tradeoffKeys` en vez de disimularlo.

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| **P6** | ¿Qué significa "el más apropiado"? ¿Qué atributos pesan? | define los pesos; hoy es propuesta |
| P7 | ¿Cuántos respondedores reales? | viabilidad del motor |
| P9 | ¿Qué pasa con un ALTO fuera de horario? | define `REQUIRES_ON_CALL_ESCALATION` vs fallback |
