# `@puente-red/core` — núcleo del backend

**Dueño:** Agente C · **Producto:** Puente Red · **Superficie:** API Profesional
**Runtime:** **Node ≥ 22.18** (o Bun) · **Sin build step** · **Sin dependencias**

---

## Qué es

El núcleo del pipeline de triaje de Puente Red. Aquí viven las tareas `PR-005` … `PR-009`:

| Tarea | Carpeta | Estado |
|---|---|---|
| `PR-005` Clasificador LLM | `classification/` | ✅ implementado |
| `PR-006` Extracción de características | `features/` | ✅ implementado |
| `PR-007` Directorio de profesionales | `directory/` | ✅ implementado |
| `PR-008` Motor de derivación | `routing/` | ✅ implementado |
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
npm test          # 84 pruebas: PR-005 (22) + PR-006 (18) + PR-007 (21) + PR-008 (23)
```

> **Limitación del type stripping:** no se pueden usar `enum`, `namespace` ni *parameter
> properties*. Por eso los "enums" son uniones de literales + objetos `as const`. Los imports
> llevan extensión `.ts` explícita.
>
> **Nota sobre `node --test`:** en esta versión hay que pasar un **glob**, no un directorio
> (`node --test "features/**/*.test.ts"`).

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

## `features/` — PR-006, extracción de características

Arquitectura en **dos capas**, y el orden importa:

1. **Extracción base determinista** (`mapping.ts`): una **tabla** de claves de catálogo →
   vocabulario cerrado. Reproducible y auditable — el clínico puede corregirla sin tocar
   código de IA.
2. **Enriquecimiento opcional por LLM** (`extractionPort.ts`): deduce características de la
   **nota ya redactada**. Si falla o hay timeout, **la extracción base sigue en pie**.

### Decisiones que este módulo hace cumplir

- **Sin texto libre en la salida.** Todo campo es un valor de un vocabulario cerrado o `null`.
  Es una propiedad del **tipo**, no una promesa de estilo. Un modelo que devuelve prosa ve su
  texto descartado.
- **Redacción antes del modelo.** `redactForModel` convierte la edad exacta en **banda**,
  y elimina institución, teléfono, correo y usuario. La edad exacta nunca llega al proveedor
  ni al resultado.
- **Procedencia explícita.** `DECLARED` (el joven lo afirmó) vs `EXTRACTED` (se dedujo).
  Una característica declarada **no** se degrada al fusionar.
- **Orden por vocabulario.** La salida **no** depende del orden en que el modelo devolvió las
  claves; sin eso, no sería reproducible.
- **Normalización de acentos.** `sueño`, `SUEÑO` y `sueno` son la misma clave.

⚠️ **Provisional:** la tabla de mapeo (`mapping.ts`) y el vocabulario (`vocabulary.ts`) se
derivan de las dimensiones ya escritas en el repo (brief §9, resumen §4.1). El clínico las
valida en `PR-001` §5.

---

## `directory/` — PR-007, directorio de respondedores

**El directorio no es un directorio de psicólogos.** La decisión **D5** establece respuesta
escalonada por gravedad, así que hay **dos tipos de respondedor** con **nivel máximo** distinto.

### Decisiones que este módulo hace cumplir

- **D5 es una restricción de datos, no de UI.** Un `CAPACITATED_STAFF` con `maxCategory = ALTO`
  se **rechaza** en el `upsert` — no se corrige en silencio. Y `listEligible` con categoría
  `ALTO` **nunca** devuelve personal capacitado.
- **Lista blanca de campos.** `projectProfile` descarta cualquier clave desconocida: aunque el
  llamante pase `documento` o `direccion`, no se guardan. El perfil no tiene dónde meterlas.
- **Contrato C con exactamente tres campos.** `publicView` devuelve solo
  `nombreVisible`, `rol` y `especialidad`. Ni el `id`, ni la zona, ni el tipo, ni la categoría
  máxima salen de aquí.
- **La carga no se edita.** `ResponderLoad` se **lee** de una `LoadSource` externa (la cola,
  `PR-009`); un intento de fijarla en el `upsert` se ignora.
- **Toda modificación se audita**, y el evento **no** guarda contenido sensible (ni el nombre
  ni las especialidades): solo acción, objetivo, actor y momento.
- **Un rechazo no genera evento**, porque no hubo cambio.

⚠️ **Provisional:** especialidades, zonas e idiomas (`PR-001` §7).
**Datos de la demo ficticios** (brief §28, `PR-003` Q7): tres perfiles, todos `isFictional`.

---

## `routing/` — PR-008, motor de derivación

**Propone, no asigna.** `RoutingProposal` no tiene campo `assignee`: el acto de tomar el caso
es humano (`ACEPTADO`). Es el guardrail #2 puesto en código, y no una promesa de estilo.

### Dos decisiones que conviene entender antes de tocarlo

1. **D5 se aplica dos veces.** El directorio ya la hace cumplir, y el motor añade una segunda
   barrera. Si alguien sustituye el directorio por otro que no la respete, un caso `ALTO`
   sigue sin llegar a personal capacitado.
2. **La equidad es una regla de ORDEN, no solo un peso.** Primero se ordena por **banda de
   carga** (0: ≤ mediana · 1: ≤ 2× · 2: > 2×) y después por puntuación. Si fuera solo un peso,
   un respondedor perfectamente emparejado pero desbordado podría seguir siendo el primero — y
   eso es justo lo que `PLAN-PUENTE-RED.md` §3.3 prohíbe.

### Otras decisiones

- **Cobertura honesta:** `ALTO` + fuera de horario + nadie de guardia →
  `REQUIRES_ON_CALL_ESCALATION`. No se asigna a quien no está (`PR-003` §15).
- **Sin elegibles no es un error:** el resultado es `NO_ELIGIBLE_RESPONDER` con motivo, y el
  caso **no** se queda sin ruta.
- **Orden reproducible:** banda → puntuación → `id`. El tercer criterio evita que dos
  respondedores empatados salgan en orden distinto.
- **Pesos versionados**, no constantes: cambiarlos exige `weightsVersion` nueva.
- **`FICTIONAL_PROFILE`** como contrapartida: una propuesta sobre datos de demostración **no**
  es operativa, y el portal tiene que poder decirlo.

### ⚠️ Dos cosas declaradas, no inventadas

- **`protectiveCoverage` vale 0.** La spec lista un peso para *"factores protectores ya
  cubiertos por el respondedor"*, pero **no define su semántica** y no hay en el contrato
  ningún vínculo respondedor↔factores protectores. El peso queda **declarado y configurable**
  para que el clínico lo active al responder **P6**. Inventarlo habría sido inventar una regla
  de triaje.
- **Idioma y zona solo puntúan si el caso los declara.** El Contrato A (`PR-003` §4) **no los
  trae**: son datos que el joven tendría que declarar y hoy no declara. El motor no se los
  inventa; si no llegan, esos pesos no se aplican.

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
| El **vocabulario de características** y su **tabla de mapeo** | `PR-001` §5 (clínico). Hoy son **provisionales** |
| La **metodología del prompt** | `PR-001` §6 (clínico). Hoy implementa solo lo cerrado |
| El **esqueleto de `backend/`** (`main`, `shared`, despliegue) | Agente A |
| La **guarda de secretos para `puente-red/**`** | `TASK-014` (A) — hallazgo F2 |
