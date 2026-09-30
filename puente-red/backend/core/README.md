# `@puente-red/core` — núcleo del backend

**Dueño:** Agente C · **Producto:** Puente Red · **Superficie:** API Profesional
**Runtime:** **Node ≥ 22.18** (o Bun) · **Sin build step** · **Sin dependencias**

---

## Qué es

El núcleo del pipeline de triaje de Puente Red. Aquí viven las tareas `PR-005` … `PR-009`:

| Tarea | Carpeta | Estado |
|---|---|---|
| `PR-005` Clasificador LLM | `classification/` | ✅ implementado |
| `PR-006` Extracción de características | `features/` | ⏳ |
| `PR-007` Directorio de profesionales | `directory/` | ⏳ |
| `PR-008` Motor de derivación | `routing/` | ⏳ |
| `PR-009` Cola, SLA y trazabilidad | `queue/` | ⏳ |

**Fuera de este paquete** (dueño: Agente A, `CONTRATO-DE-INTEGRACION.md` §1.1):
`backend/routes/joven/**`, `backend/shared/**` (modelos, cliente Supabase, `contratoVersion`,
fixtures del contrato), `backend/main` y el despliegue.

---

## Cómo se ejecuta

No hay `tsc`, ni bundler, ni dependencias: Node **borra los tipos** y ejecuta el `.ts`
directamente (type stripping nativo, estable desde Node 22.18).

```bash
cd puente-red/backend/core
npm test          # 22 pruebas: criterios de aceptación de PR-005
```

> **Limitación del type stripping:** no se pueden usar `enum`, `namespace` ni *parameter
> properties*. Por eso los "enums" son uniones de literales + objetos `as const`. Los imports
> llevan extensión `.ts` explícita.

---

## Decisiones que este paquete hace cumplir

### 1. La regla dura D2 — el rojo nunca se degrada

Si `origenNivel === "ROJO"`, la categoría es `ALTO` y **el proveedor ni se consulta**
(`classificationService.ts`). Hay una **segunda barrera** (`#enforceD2`) por si alguien mueve
la comprobación en el futuro. Se prueba contra un proveedor **hostil** que siempre responde
`MEDIO`, en **1.000 casos generados** (`__tests__/d2Rule.test.ts`).

### 2. Fallback conservador

Timeout, error del proveedor, proveedor ausente o clasificador apagado → **`ALTO`** con
`fallbackApplied = true`. Nunca un caso sin categoría (`PR-001` §10).

### 3. El clasificador está APAGADO por defecto

`DEFAULT_CONFIG.enabled = false`. Encenderlo es una decisión explícita que exige el
proveedor de pago. Así la demo funciona sin LLM y el sistema sigue siendo seguro.

### 4. La salida es una propuesta, no una decisión

`isDegradable` y `fallbackApplied` viajan con la propuesta. La validación humana es el acto
de aceptación del profesional (`ACEPTADO`, `PR-003` §3.1).

### 5. Sin identidad, y sin prosa

- La petición al proveedor **no tiene campo** para `ProfileId`, alias ni MAC; además hay una
  guarda de frontera (`assertNoIdentityInPayload`) que la hace ejecutable.
- `rationaleKeys` son **claves de catálogo**, nunca texto libre. La prosa la renderiza el
  portal. Un resultado del modelo con claves desconocidas se descarta.
- Se guarda el **hash** de la entrada (`inputHash`), no el prompt: auditable sin retener
  contenido (`PR-018`).

---

## Variables de entorno

La clave **nunca** está en el repositorio ni en la configuración: solo su **nombre**.

| Variable | Efecto | Defecto |
|---|---|---|
| `PUENTE_CLASSIFIER_ENABLED` | Enciende el clasificador | `false` |
| `PUENTE_GENAI_API_KEY` | **La clave** del proveedor (la lee el adaptador) | — |
| `PUENTE_GENAI_KEY_ENV_VAR` | Nombre alternativo de la variable de la clave | `PUENTE_GENAI_API_KEY` |
| `PUENTE_CLASSIFIER_MODEL` | `modelVersion` | provisional |
| `PUENTE_CLASSIFIER_PROMPT` | `promptVersion` | provisional |
| `PUENTE_CLASSIFIER_TIMEOUT_MS` | Timeout de la llamada | `8000` |
| `PUENTE_CLASSIFIER_MAX_SPEND_USD` | Tope de gasto diario | `1` |

⚠️ **Proveedor de pago obligatorio** (`PR-INFRA` §4): la capa gratuita de Gemini usa los
prompts para mejorar productos de Google, lo que no cumple la decisión D3
(no-reentrenamiento sobre datos de menores).

---

## Pendiente (declarado, no inventado)

| Qué | Dónde |
|---|---|
| El **catálogo de `rationaleKeys` definitivo** | `PR-001` §5 (clínico). Hoy es **provisional** |
| La **metodología del prompt** | `PR-001` §6 (clínico). Hoy implementa solo lo cerrado |
| El **esqueleto de `backend/`** (`main`, `shared`, despliegue) | Agente A |
| La **guarda de secretos para `puente-red/**`** | `TASK-014` (A) — hallazgo F2 |
