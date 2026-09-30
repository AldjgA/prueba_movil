# PR-005 · Servicio de clasificación con LLM (medio / alto, versionado)

**Estado:** Aprobada (`REVISION-C.md` — "Aprobada con hallazgos"; incorpora sus respuestas §5)
**Autor:** Agente C · **Revisor:** Agente A
**Fecha:** 2026-09-30
**Ola:** R1 · **Depende de:** `PR-001` §5–6, `PR-003` §3–4, `PR-004` · **Bloquea:** `PR-008`, `PR-012`

---

## 1. Contexto

Cuando el joven alcanza prioridad preliminar roja (o amarilla autorizada — `PR-004` §2.2 acepta
`ROJO` y `AMARILLO`), el APK entrega el **Contrato A** (`PR-003` §4) y el backend inserta la
transacción. Al otro lado, el equipo necesita saber **cuánta urgencia y carga** tiene el caso.
Ese juicio lo produce este servicio.

`PLAN-PUENTE-RED.md` §3.2 identifica esta pieza como la de mayor tensión con el guardrail #3: un
LLM que clasifica texto libre es, funcionalmente, triaje automático. Solo es admisible si queda
escrito qué significa cada categoría, qué no puede hacer el modelo y quién responde cuando falla.

Este servicio **no conversa con el adolescente**. Recibe un reporte ya cerrado y autorizado, y
devuelve una categoría.

---

## 2. Alcance

### Dentro
- Consumir el caso en estado `RECIBIDO` (`PR-003` §3.1).
- Producir `MEDIO` | `ALTO` con justificación **estructurada** (claves de catálogo, no prosa).
- Aplicar **D2 / P3 de `PR-001`**: si `OrigenNivel == ROJO`, la salida es `ALTO` y **no es
  degradable**. El LLM **solo sube**.
- Transicionar a `CLASIFICADO` y anexar `categoria`, `modelVersion`, `promptVersion` a `casos`.
- **Política de fallo:** timeout o error → `ALTO` con `FallbackApplied = true`.
- **Proveedor: Google GenAI**, llamado desde la API (nunca desde el APK).
- **Tope de gasto y rate limiting** (`PR-INFRA` §6).

### Fuera
- Diagnosticar, puntuar gravedad clínica o estimar riesgo de vida.
- **Bajar** una categoría.
- Decidir una derivación (`PR-008`) o cerrar un caso.
- Generar texto visible para el joven.
- Extraer características: es `PR-006`.
- Recibir `ProfileId`, alias o MAC. Solo `caseToken`.

### Requisito legal del proveedor LLM — ✅ **resuelto el 2026-09-30**

**Decisión del product owner: se usará Gemini de pago**, que no entrena con los datos enviados.

`PR-INFRA-RECOMENDACION` §4 (verificado el 2026-09-30) documenta el motivo de la restricción:

| Capa de Gemini | ¿Google usa los prompts para mejorar sus productos? |
|---|---|
| **Gratuita** | **Sí** — es una **condición de uso**, no un opt-out configurable |
| **De pago / Vertex AI** | **No** |

**La capa gratuita sigue prohibida con datos reales de menores** (no cumple la decisión D3 de
no-reentrenamiento). La de pago está **aprobada**.

**Implicación de diseño (se mantiene):** el clasificador debe poder **desactivarse por
configuración** y devolver `ALTO` por defecto cuando no haya proveedor habilitado. Así el sistema
sigue siendo seguro aunque el LLM falle, se apague o se agote el tope de gasto.

---

## 3. Módulo y propiedad

- Módulo: `puente-red/backend/core/classification`
- Dueño: **C**
- Runtime: **Go** (o Node/Bun + Hono) — `PR-INFRA` §3. **Sin framework JVM.**
- Archivos compartidos que necesita declarar: **ninguno** (no toca el APK ni `backend/shared`, de A).

---

## 4. Contratos de datos

- Interfaces de `Repositories.kt` que consume: **ninguna** (Puente Red no usa el APK).
- Métodos nuevos que necesita (se declaran en `NECESIDADES.md`): **ninguno del APK**.

```go
type IngestedReport struct {
    CaseToken       string   // ULID (PR-004 §3)
    ContratoVersion string
    OrigenNivel     string   // VERDE | AMARILLO | ROJO (reglas del APK)
    RulesetVersion  string
    Motivo          []string // CLAVES de catálogo
    ResumenAutorizado Summary // scope CERRADO
    CreadoEn        time.Time
}

type ProfessionalCategory string
const (
    CategoryMedio ProfessionalCategory = "MEDIO"
    CategoryAlto  ProfessionalCategory = "ALTO"
)

type ClassificationProposal struct {
    CaseToken       string
    Category        ProfessionalCategory
    RationaleKeys   []string // claves de catálogo, NO texto libre
    ModelVersion    string
    PromptVersion   string
    InputHash       string
    IsDegradable    bool     // false si OrigenNivel == ROJO
    ProducedAt      time.Time
    FallbackApplied bool
}
```

`RationaleKeys` son **claves de catálogo**; la prosa se renderiza en el portal desde un catálogo
versionado. Evita que el modelo inyecte texto arbitrario hacia una superficie humana.

---

## 5. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Un caso con `OrigenNivel == ROJO` sale siempre `ALTO` | unitaria (tabla de casos) |
| 2 | Ninguna entrada produce `MEDIO` si el origen era `ROJO`, en 1.000 casos | unitaria (property-based) |
| 3 | Toda propuesta lleva `ModelVersion`, `PromptVersion` e `InputHash` | unitaria + aserción de esquema |
| 4 | Timeout del proveedor → `ALTO` con `FallbackApplied = true` | unitaria con stub |
| 5 | Con el clasificador **desactivado**, la salida es `ALTO` y el caso no se bloquea | unitaria de configuración |
| 6 | El modelo nunca recibe `ProfileId` ni alias | contrato sobre el payload enviado al proveedor |
| 7 | `RationaleKeys` solo contiene claves del catálogo vigente | unitaria contra el catálogo |
| 8 | Un prompt no se conserva más allá de la ventana de auditoría (`PR-018`) | unitaria con reloj inyectable |
| 9 | La API key de Gemini **no** está en el repositorio ni en el APK | revisión + la **guarda de secretos para `puente-red/**`** que define `TASK-014`. ⚠️ **No vale `ModuleGraphGuardTest`**: solo escanea `app/`, `core/` y `feature/` (`REVISION-C.md` **F2**) |
| 10 | El servicio transiciona `RECIBIDO → CLASIFICADO` y anexa versión | integración con `PR-009` |

---

## 6. Guardrails aplicables

- `PR-001` §2 — verde/amarillo/rojo es **prioridad preliminar, nunca diagnóstico**.
- #2 — la IA propone; el psicólogo acepta. `IsDegradable` protege la alarma.
- **D2 / `PR-003` §9.4** — el LLM **solo sube**; nunca baja un rojo.
- **`PR-003` §9.10** — el modelo nunca ve identidad.
- **`PR-INFRA` §4** — ✅ **resuelto (2026-09-30): se usará Gemini de pago**, que no usa los prompts
  para mejorar productos de Google. La capa gratuita queda **prohibida** con datos reales de menores.
- **`PR-003` Q7** — la demo no carga datos reales ni sintéticos.

---

## 7. Referencia visual

`ProAlertsScreen.tsx` (badge `ROJO`/`AMARILLO`, *"Patrón creciente"`) y `ProCaseScreen.tsx`
(*"Estado del caso"*). El portal no muestra `ModelVersion` de forma prominente; está disponible
en `PR-018`. No se reutiliza `core/designsystem` (es Compose y está congelado).

---

## 8. Dependencias

- **Bloquea:** `PR-008`, `PR-012`.
- **Bloqueado por:** — ✅ **desbloqueada.** `PR-001` §5–6 **firmado clínicamente** (2026-09-30);
  `PR-004` ✅; `PR-003` ✅; Gemini de pago ✅.
- **Specs relacionadas:** `PR-006` (extracción), `PR-009` (cola).

---

## 9. Preguntas abiertas

| # | Pregunta | Estado |
|---|---|---|
| P4 | ¿"Medio" y "alto" significan urgencia, complejidad o riesgo? | ✅ **cerrado por la firma de `PR-001`** — el valor vive en `PR-001` §5; esta spec no lo reestatea |
| P5 | ¿Quién responde si el LLM clasifica mal? | ✅ **cerrado por `PR-001` §10** (fallback a `ALTO`, sin caso sin categoría) |
| Q12 | Proveedor y no-reentrenamiento | ✅ **cerrado: Google GenAI de pago** (2026-09-30) |
| — | ¿Qué catálogo de `RationaleKeys` y quién lo versiona? | ⏳ el clínico, en `PR-001` |

---

## 10. Definition of Done

- [x] Spec **Aprobada** por otro agente (`REVISION-C.md`)
- [x] Compila y pasa pruebas — `npm test` en `puente-red/backend/core`: **22/22 en verde**
- [x] Pruebas de los 10 criterios en verde
- [ ] `NECESIDADES.md` entregado a A y aplicado — **entregado** (`deliverables/PR-005/NECESIDADES.md`); **pendiente de aplicar** por A (esqueleto de `backend/`)
- [x] Sin secretos ni endpoints hardcodeados (la clave solo por nombre de variable de entorno)
- [x] Ningún contrato profesional compilado en el APK (`PR-003` §9.10)

### Estado de implementación (2026-09-30)

**Implementado** en `puente-red/backend/core/classification/` (dueño: C) con **Node ≥ 22.18**,
sin dependencias ni build step. 22 pruebas, incluidas:

- la **property-based de 1.000 casos** con proveedor hostil que siempre responde `MEDIO`
  (criterio 2) — el rojo nunca sale degradado;
- el **timeout** con proveedor colgado (criterio 4);
- la **guarda de frontera** de identidad (criterio 6);
- el **filtrado de claves** fuera de catálogo (criterio 7);
- que la propuesta **no retiene** el contenido del resumen, solo su hash (criterio 8).

**Provisional, pendiente del clínico (`PR-001` §5–§6):** el catálogo de `rationaleKeys`
(`catalog.ts`) y la metodología del prompt (`prompt.ts`). Ambos están marcados `provisional` y
solo codifican lo que ya está cerrado en el repo.

**Pendiente de A:** el esqueleto de `backend/` (`main`, `shared/**`) y la guarda de secretos de
`TASK-014` sobre `puente-red/**`.
