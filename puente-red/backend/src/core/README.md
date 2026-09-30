# `core/` — pipeline de triaje y derivación

**Dueño: Agente C** (`PR-000` §1.1, ratificado en `REVISION-C.md` §5.3).
**Runtime:** Node ≥ 22.18 (type stripping nativo: **sin `tsc`, sin bundler**).

---

## Qué hay aquí

| Tarea | Módulo | Estado | Pruebas |
|---|---|---|---|
| `PR-005` Clasificador LLM (`MEDIO`/`ALTO`, versionado) | `classification/` | ✅ | 22 |
| `PR-006` Extracción de características | `features/` | ✅ | 18 |
| `PR-007` Directorio de profesionales (dos tipos de respondedor) | `directory/` | ✅ | 21 |
| `PR-008` Motor de derivación escalonado por gravedad | `routing/` | ✅ | 23 |
| `PR-009` Cola de asignación, SLA y trazabilidad | `queue/` | ✅ | 30 |
| `PR-010` Autenticación y roles *(núcleo de seguridad)* | `auth/` | ✅ | 21 |

**Ola R1 completa.** De R2, el núcleo de seguridad de `PR-010`. La interfaz del portal
(`PR-010`…`PR-017`) todavía no está montada.

```bash
cd puente-red/backend
npm install       # hono + @hono/node-server
npm test          # 147 pruebas: las 12 del esqueleto de A + las 135 de C
```

> **Nota sobre `node --test`:** descubre `.test.ts` automáticamente desde la raíz del paquete.
> Pasar un **directorio** no funciona en esta versión; hay que pasar un glob o nada.
>
> **Limitación del type stripping:** sin `enum`, sin `namespace` y sin *parameter properties*.
> Por eso los "enums" son uniones de literales + objetos `as const`, y los imports llevan
> extensión `.ts` explícita.

---

## Reglas con A

- `core/` **lee** `src/shared/` (contratos, almacén) pero **no lo modifica**: los cambios se
  **declaran** (`CONTRATO-DE-INTEGRACION.md` §1.1 y §2).
- El clasificador debe poder **desactivarse por configuración** (`CLASSIFIER_MODE=off`) y, en ese
  caso, todo entra como `ALTO` con el caso **sin bloquear** (`PR-005` criterio 5).
- ⚠️ **Gemini de pago obligatorio antes de datos reales de menores** (`PR-INFRA` §4).
- El LLM **solo sube** de categoría; nunca degrada un `ROJO` (`PR-001` P3).
- **Los módulos del núcleo no se importan entre sí** salvo composición explícita (`routing/`
  compone `features/` y `directory/`; `queue/` compone `directory/`). Cada módulo declara sus
  propios tipos de valor para que un cambio en uno no rompa otro.

---

## Decisiones transversales del núcleo

Estas se repiten en varios módulos y conviene no romperlas:

| Decisión | Por qué |
|---|---|
| **La salida es siempre una propuesta, nunca una decisión** | El LLM propone; el psicólogo **acepta**. Es el guardrail #2 puesto en código |
| **Claves de catálogo, nunca prosa** | Evita que un modelo inyecte texto arbitrario hacia una superficie humana |
| **Vocabulario cerrado** | `rationaleKeys`, `SignalTag`, `Specialty`… son conjuntos finitos, no texto |
| **Sin identidad en la salida** | Los identificadores personales no tienen dónde ir: es una propiedad del tipo |
| **Determinismo** | Tablas y orden explícito (`banda → puntuación → id`) en vez de depender del proveedor |
| **Fallback conservador** | Ante fallo, el resultado seguro (`ALTO`), nunca un caso sin categoría |
| **Auditoría sin contenido** | Se prueba **que** se accedió y qué cambió, no **qué** se leyó |

---

## `classification/` — PR-005

- **La regla dura D2**: si el nivel de origen es `ROJO`, la categoría es `ALTO` y **el proveedor
  ni se consulta**. Hay una **segunda barrera** por si alguien mueve la comprobación.
- **Fallback conservador**: timeout, error, proveedor ausente o clasificador apagado → `ALTO`.
- **Apagado por defecto** (`enabled: false`): encenderlo exige el proveedor de pago.
- Se guarda el **hash** de la entrada, no el prompt: auditable sin retener contenido.
- Se prueba contra un proveedor **hostil** que siempre responde `MEDIO`, en **1.000 casos**.

## `features/` — PR-006

- **Extracción base determinista** (tabla) + **enriquecimiento opcional por LLM**. Si el LLM
  falla, la base sigue en pie.
- **`redactForModel`** convierte la edad exacta en **banda** y elimina institución, teléfono,
  correo y usuario **antes** de que el texto llegue al proveedor.
- **`DECLARED` vs `EXTRACTED`**, con bandas de confianza distintas.
- Normalización de acentos: `sueño`, `SUEÑO` y `sueno` son la misma clave.
- Las claves de señal y de `motivo` son las **canónicas de `PR-003` §4.1 y §4.2**.

## `directory/` — PR-007

- **D5 como restricción de datos**: un `CAPACITATED_STAFF` con `maxCategory = ALTO` se
  **rechaza** y **no se guarda**.
- **Lista blanca de campos**: el perfil no tiene dónde meter documento ni domicilio.
- **Contrato C con exactamente tres campos**; `publicView` usa los valores **canónicos** del
  contrato (`psicologo`, `trauma`…) — un solo vocabulario, sin tabla de conversión.
- **La carga no se edita**: se lee de una `LoadSource` externa.

## `routing/` — PR-008

- **D5 se aplica dos veces** (directorio + segunda barrera).
- **La equidad es una regla de ORDEN**, no solo un peso: banda de carga → puntuación → `id`.
  Si fuera solo un peso, un respondedor desbordado y perfectamente emparejado podría ser el
  primero.
- **Cobertura honesta**: `ALTO` fuera de horario sin guardia → `REQUIRES_ON_CALL_ESCALATION`.
- **`FICTIONAL_PROFILE`** como contrapartida: una propuesta sobre datos de demo no es operativa.

## `queue/` — PR-009

- **`ACEPTADO` exige un actor humano**; el sistema no puede aceptar.
- **La proyección al joven tiene campos exactos**: el estado interno, la carga y las notas
  internas no tienen dónde ir.
- **El SLA se calcula al leer**, no se almacena, y **se recalcula al clasificar** (si no, un
  `ALTO` tendría 4 horas de margen en vez de 5 minutos).
- **Fuera de horario el reloj del SLA no corre.**
- **El canal es un HECHO, no un estado**: se guarda `contactChannelOpenedAtEpochMillis`.

## `auth/` — PR-010 (núcleo)

- **La matriz de autorización es DATOS**, no una cadena de `if`: se prueba por tabla completa.
- **Las credenciales no se validan aquí**: todo pasa por `AuthPort` (Supabase Auth).
- **Un único mensaje** para cualquier fallo de credenciales: distinguirlos convertiría el login
  en un **oráculo** para averiguar qué correos existen.
- **Dos relojes de sesión**: caducidad absoluta (8 h) e inactividad (30 min).
- **`authorize` nunca lanza**: un rechazo es un **valor**.
- La **interfaz** de login vivirá en `puente-red/portal/`, aún sin montar.

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

---

## Pendiente (declarado, no inventado)

| Qué | Dónde |
|---|---|
| **Catálogo de `rationaleKeys`** definitivo | `PR-001` §5. Hoy **provisional** (`catalog.ts`) |
| **Vocabulario y tabla de mapeo** de características | `PR-001` §5. Hoy **provisionales** |
| **Metodología del prompt** | `PR-001` §6. Hoy implementa solo lo cerrado |
| **Cliente de Supabase** en `src/shared/**` | Agente A |
| **Guarda de secretos** sobre `puente-red/**` | `TASK-014` (A) — hallazgo F2 |
| **Interfaz del portal** | `PR-010`…`PR-017` |
