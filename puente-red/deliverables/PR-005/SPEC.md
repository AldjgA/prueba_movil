# PR-005 · Servicio de clasificación con LLM (medio / alto, versionado)

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-001` §5–6 (firmado), `PR-004` (ingesta), `PR-000` §3
**Bloquea a:** `PR-008` (el motor de derivación consume la categoría), `PR-012` (orden de la cola)

---

## Contexto

Cuando el joven alcanza prioridad preliminar **roja**, el APK genera un paquete de alerta sin
identidad (TASK-015, de B) y lo entrega a Puente Red. Al otro lado, el equipo necesita saber
**cuánta urgencia y carga** tiene ese caso. Ese juicio lo produce este servicio.

Es la pieza que `PLAN-PUENTE-RED.md` §3.2 identifica como la de mayor tensión con el guardrail
#3: un LLM que clasifica texto libre en dos categorías es, funcionalmente, triaje automático.
No es incompatible con el guardrail —priorizar no es diagnosticar— pero **solo si queda escrito
qué significa cada categoría, qué no puede hacer el modelo y quién responde cuando falla**.

Este servicio **no conversa con el adolescente**. Recibe un reporte ya cerrado y autorizado, y
devuelve una categoría. Nunca genera texto que llegue al joven.

---

## Alcance

### Dentro

- Recibir el paquete de alerta ya ingerido (`PR-004`) con su `caseToken`.
- Producir una categoría `MEDIUM` | `HIGH` con justificación estructurada (no texto libre).
- Aplicar la **regla dura D2**: si el nivel del joven es `RED`, la categoría de salida es
  `HIGH` y **no es degradable**.
- Registrar `modelVersion` + `promptVersion` + hash de la entrada en cada resultado.
- Política de fallo: si el modelo no responde o supera el timeout, la categoría es `HIGH` por
  defecto (nunca un caso sin categoría, `PR-001` §10).
- Registrar la salida como propuesta, marcada explícitamente como tal.

### Fuera

- **Diagnosticar, puntuar gravedad clínica o estimar riesgo de vida.** Prohibido por guardrail.
- **Bajar** una categoría. Nunca. Es la regla D2.
- Decidir una derivación (`PR-008`) o cerrar un caso.
- Comunicarse con el joven. Ningún texto de salida es visible para el adolescente.
- Extraer características del caso: eso es `PR-006`, servicio separado y con su propio
  `promptVersion`.
- Recibir `ProfileId`, alias, `YouthAlias` o cualquier identificador personal.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/classification`
- Dueño: **C**. Archivos compartidos que necesita declarar: ninguno del APK.
- Interfaz pública:

```
classify(IngestedReport, RulesetContext) -> ClassificationProposal
```

---

## Contratos de datos

```kotlin
/** Entrada: reporte ya cerrado y autorizado. Sin identidad. */
data class IngestedReport(
    val caseToken: CaseToken,            // emitido por PR-004; NO es ProfileId
    val youthAttentionLevel: AttentionLevel, // verde|amarillo|rojo, calculado por reglas en el APK
    val authorizedSummary: AuthorizedSummary, // scope CERRADO, igual al ShareableSummary
    val submittedAtEpochMillis: Long,
)

enum class ProfessionalCategory { MEDIUM, HIGH }

/**
 * Propuesta del modelo. Es una PROPUESTA: la validación humana es el acto de
 * aceptación del profesional (PR-012/PR-013).
 */
data class ClassificationProposal(
    val caseToken: CaseToken,
    val category: ProfessionalCategory,
    val rationaleKeys: List<String>,     // claves de catálogo, NO texto libre generado
    val modelVersion: String,            // trazabilidad obligatoria (PR-001 §6.3)
    val promptVersion: String,
    val inputHash: String,               // permite auditar sin retener el prompt
    val isDegradable: Boolean,           // false si youthAttentionLevel == RED
    val producedAtEpochMillis: Long,
    val fallbackApplied: Boolean,        // true si se aplicó la política de fallo
)
```

**Regla de la interfaz:** `rationaleKeys` son **claves de catálogo**, no prosa. La prosa se
renderiza en el portal desde el catálogo versionado. Esto evita que el modelo inyecte texto
arbitrario hacia una superficie humana y hace el resultado diffeable y auditable.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un caso con `youthAttentionLevel == RED` sale siempre `HIGH` | prueba unitaria con tabla de casos |
| 2 | **Ninguna** entrada produce `MEDIUM` si la entrada era `RED`, en 1.000 casos generados | prueba de propiedad (property-based) |
| 3 | Toda propuesta lleva `modelVersion`, `promptVersion` e `inputHash` no vacíos | prueba unitaria + aserción de esquema |
| 4 | Si el proveedor lanza timeout, la salida es `HIGH` con `fallbackApplied = true` | prueba con doble (stub) que simula timeout |
| 5 | El modelo nunca recibe `ProfileId` ni alias | prueba de contrato sobre el payload enviado al proveedor |
| 6 | `rationaleKeys` solo contiene claves del catálogo vigente | prueba de validación contra el catálogo |
| 7 | Un prompt no se conserva más allá de la ventana de auditoría definida en `PR-018` | prueba de retención con reloj inyectable |
| 8 | El servicio no puede emitir texto libre en `rationaleKeys` | aserción de tipo: `List<CatalogKey>` |

---

## Guardrails aplicables

- #1 — la categoría es prioridad operativa, **no** diagnóstico.
- #2 — la IA propone; el psicólogo acepta. `isDegradable` protege la alarma.
- D2 — el LLM **solo sube**; nunca baja un rojo. Criterio 1 y 2.
- #6 — el modelo nunca ve identidad. Criterio 5.
- P5 (`PR-001`) — no se promete lo que no se puede cumplir: el fallback es conservador.

---

## Referencia visual

Ninguna directa. El resultado alimenta `ProAlertsScreen.tsx` (badge `ROJO`/`AMARILLO` y el
texto *"Patrón creciente"*) y `ProCaseScreen.tsx` (panel *"Estado del caso"*). El portal nunca
muestra `modelVersion` al profesional de forma prominente, pero debe estar disponible en
`PR-018`.

---

## Dependencias

- **Bloqueado por:** `PR-001` §5 (definición de medio/alto) y §6 (qué puede/no puede el LLM),
  ambos **pendientes de firma clínica**. Sin ellos no se puede escribir el prompt ni el
  catálogo de `rationaleKeys`.
- **Bloqueado por:** `PR-004` (ingesta y `caseToken`), de A.
- **Bloquea a:** `PR-008` (necesita la categoría), `PR-012` (orden por defecto de la cola).

---

## Preguntas abiertas

| # | Pregunta | Impacto |
|---|---|---|
| P4 | ¿"Medio" y "alto" significan urgencia, complejidad o riesgo? | sin esto no existe el prompt |
| P5 | ¿Quién responde si el LLM clasifica mal? ¿Hay revisión humana previa? | política de fallback y de apelación |
| Q12 | ¿Qué proveedor y qué cláusula de no-reentrenamiento? | D3, requisito legal |
| — | ¿Qué catálogo de `rationaleKeys` y quién lo versiona? | propuesta: lo versiona el clínico en `PR-001` |
