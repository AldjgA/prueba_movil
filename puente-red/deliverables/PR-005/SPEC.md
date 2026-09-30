# PR-005 · Servicio de clasificación con LLM (medio / alto, versionado)

**Agente:** C · **Ola:** R1 · **Depende de:** `PR-001` §5–6 (firmado), `PR-004` (ingesta), `PR-003` §3–4, `PR-INFRA` §4
**Bloquea a:** `PR-008` (el motor de derivación consume la categoría), `PR-012` (orden de la cola)
**Reconciliado:** 2026-09-30 con `PR-003` / `PR-004` / `PR-INFRA-RECOMENDACION`

---

## Contexto

Cuando el joven alcanza prioridad preliminar **roja** (o amarilla autorizada — ver pregunta Q2 de
`PR-004`), el APK entrega el **Contrato A** (`PR-003` §4) y el backend inserta la transacción.
Al otro lado, el equipo necesita saber **cuánta urgencia y carga** tiene el caso. Ese juicio lo
produce este servicio.

Es la pieza que `PLAN-PUENTE-RED.md` §3.2 identifica como la de mayor tensión con el guardrail
#3: un LLM que clasifica texto libre en dos categorías es, funcionalmente, triaje automático.
Solo es admisible si queda escrito qué significa cada categoría, qué no puede hacer el modelo y
quién responde cuando falla.

Este servicio **no conversa con el adolescente**. Recibe un reporte ya cerrado y autorizado, y
devuelve una categoría. Nunca genera texto que llegue al joven.

---

## Alcance

### Dentro

- Consumir el caso en estado `RECIBIDO` (máquina de estados de `PR-003` §3.1).
- Producir `MEDIO` | `ALTO` con justificación **estructurada** (claves de catálogo, no prosa).
- Aplicar la **regla dura D2 / P3 de `PR-001`**: si `origenNivel == ROJO`, la salida es `ALTO`
  y **no es degradable**. El LLM **solo sube**.
- Transicionar el caso a `CLASIFICADO` y anexar `categoria`, `modelVersion` y `promptVersion`
  a la fila de `casos` (`PR-004` §4.1).
- **Política de fallo:** timeout o error del proveedor → `ALTO` con `fallbackApplied = true`.
  Nunca un caso sin categoría (`PR-001` §10).
- **Proveedor: Google GenAI**, llamado desde la API (nunca desde el APK — `PR-INFRA` §6).
- **Tope de gasto y rate limiting** configurados (`PR-INFRA` §6).

### Fuera

- **Diagnosticar, puntuar gravedad clínica o estimar riesgo de vida.** Prohibido por guardrail.
- **Bajar** una categoría. Nunca.
- Decidir una derivación (`PR-008`) o cerrar un caso.
- Comunicarse con el joven. Ningún texto de salida es visible para el adolescente.
- Extraer características del caso: eso es `PR-006`.
- Recibir `ProfileId`, alias, MAC ni ningún identificador. Solo el `caseToken` (ULID).

---

## ⚠️ Bloqueo legal que condiciona esta tarea

`PR-INFRA-RECOMENDACION` §4, verificado el 2026-09-30:

| Capa de Gemini | ¿Google usa los prompts para mejorar sus productos? |
|---|---|
| **Gratuita** | **Sí** — es una condición de uso, no un opt-out configurable |
| **De pago / Vertex AI** | **No** |

**Consecuencia:** la capa gratuita **no cumple** la decisión D3 (no-reentrenamiento sobre datos
de menores). Por lo tanto:

| Fase | Capa admitida |
|---|---|
| **Demo / desarrollo** — **sin datos reales ni sintéticos** (`PR-003` Q7) | gratuita ✅ |
| **Cualquier caso real de un menor** | **de pago** ⚠️ **bloqueante** |

**Implicación de diseño:** el clasificador debe poder **desactivarse por configuración** y
devolver `ALTO` por defecto cuando no hay proveedor habilitado. Así la demo funciona sin LLM y
el sistema sigue siendo seguro.

---

## Módulo y propiedad

- Módulo: `puente-red/backend/core/classification` (dueño: **C**)
- Runtime: **Go** (o Node/Bun + Hono) — `PR-INFRA` §3. **Sin framework JVM.**
- Interfaz pública:

```
classify(IngestedReport, RulesetContext) -> ClassificationProposal
```

---

## Contratos de datos

```go
// Entrada: Contrato A ya ingerido por PR-004. Sin identidad.
type IngestedReport struct {
    CaseToken      string   // ULID emitido por el backend
    ContratoVersion string
    OrigenNivel    string   // VERDE | AMARILLO | ROJO (reglas del APK)
    RulesetVersion string   // trazabilidad del cálculo local
    Motivo         []string // CLAVES de catálogo
    ResumenAutorizado Summary // scope CERRADO
    CreadoEn       time.Time
}

type ProfessionalCategory string

const (
    CategoryMedio ProfessionalCategory = "MEDIO"
    CategoryAlto  ProfessionalCategory = "ALTO"
)

// Propuesta del modelo. La validación humana es el acto de aceptación (ACEPTADO).
type ClassificationProposal struct {
    CaseToken      string
    Category       ProfessionalCategory
    RationaleKeys  []string // claves de catálogo, NO texto libre
    ModelVersion   string
    PromptVersion  string
    InputHash      string
    IsDegradable   bool     // false si OrigenNivel == ROJO
    ProducedAt     time.Time
    FallbackApplied bool
}
```

**Regla de la interfaz:** `RationaleKeys` son **claves de catálogo**. La prosa se renderiza en
el portal desde un catálogo versionado. Esto evita que el modelo inyecte texto arbitrario hacia
una superficie humana y hace el resultado auditable.

---

## Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un caso con `OrigenNivel == ROJO` sale siempre `ALTO` | prueba unitaria con tabla de casos |
| 2 | **Ninguna** entrada produce `MEDIO` si el origen era `ROJO`, en 1.000 casos generados | prueba de propiedad |
| 3 | Toda propuesta lleva `ModelVersion`, `PromptVersion` e `InputHash` no vacíos | prueba unitaria + aserción de esquema |
| 4 | Si el proveedor lanza timeout, la salida es `ALTO` con `FallbackApplied = true` | prueba con doble (stub) que simula timeout |
| 5 | Con el clasificador **desactivado**, la salida es `ALTO` y el caso no se bloquea | prueba de configuración |
| 6 | El modelo nunca recibe `ProfileId` ni alias | prueba de contrato sobre el payload enviado al proveedor |
| 7 | `RationaleKeys` solo contiene claves del catálogo vigente | prueba de validación contra el catálogo |
| 8 | Un prompt no se conserva más allá de la ventana de auditoría (`PR-018`) | prueba de retención con reloj inyectable |
| 9 | La API key de Gemini **no** está en el repositorio ni en el APK | revisión + `ModuleGraphGuardTest` de A |
| 10 | El servicio transiciona `RECIBIDO → CLASIFICADO` y anexa versión al caso | prueba de integración con `PR-009` |

---

## Guardrails aplicables

- #1 — la categoría es prioridad operativa, **no** diagnóstico.
- #2 — la IA propone; el psicólogo acepta. `IsDegradable` protege la alarma.
- **D2 / `PR-003` §9.4** — el LLM **solo sube**; nunca baja un rojo.
- #6 / `PR-003` §9.10 — el modelo nunca ve identidad.
- **`PR-INFRA` §4** — capa gratuita prohibida con datos reales de menores.
- **`PR-003` Q7** — la demo no carga datos reales ni sintéticos.
- P5 (`PR-001`) — el fallback es conservador; no se promete lo que no se puede cumplir.

---

## Referencia visual

Ninguna directa. El resultado alimenta `ProAlertsScreen.tsx` (badge `ROJO`/`AMARILLO`,
*"Patrón creciente"*) y `ProCaseScreen.tsx` (*"Estado del caso"*). El portal no muestra
`ModelVersion` al profesional de forma prominente, pero debe estar disponible en `PR-018`.

---

## Dependencias

- **Bloqueado por:** `PR-001` §5 (definición de medio/alto) y §6, **pendientes de firma clínica**.
- **Bloqueado por:** `PR-004` (ingesta y `caseToken`) — ✅ **publicado por A el 2026-09-30**.
- **Bloqueado por:** `PR-003` (Contrato A) — ✅ **publicado**.
- **Bloquea a:** `PR-008`, `PR-012`.

---

## Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| P4 | ¿"Medio" y "alto" significan urgencia, complejidad o riesgo? | ⏳ sin firmar |
| P5 | ¿Quién responde si el LLM clasifica mal? | ⏳ sin firmar |
| Q12 | Proveedor y no-reentrenamiento | ⚠️ **parcial**: Google GenAI; **capa de pago obligatoria** antes de datos reales |
| Q2 (`PR-004`) | ¿La ingesta acepta amarillo además de rojo? | ⏳ abierto |
| — | ¿Qué catálogo de `RationaleKeys` y quién lo versiona? | propuesta: el clínico, en `PR-001` |
