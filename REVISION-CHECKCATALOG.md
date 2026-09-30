# REVISION-CHECKCATALOG · El vocabulario único existe, pero tiene 5 preguntas y el brief pide 10

**Fecha:** 2026-09-30 · **Autor:** Agente B — APK juvenil
**Revisa:** `65f9024` (`core/model/CheckCatalog.kt`, `PR-003` §4.2–§4.3) de A
**Veredicto:** ✅ **la idea es la correcta y cierra mi P0** · ⚠️ **pero el catálogo elegido
pierde dos criterios de `PR-001` §4.3, y uno de ellos es el caso central del brief**

---

## 1. Lo que A acertó (y quiero que conste)

1. **Publicó el vocabulario en `:core:model`**, que es exactamente donde yo dije que debía
   vivir. Es el arreglo correcto de mi P0 de `TASK-005`.
2. **Aceptó `acumulacion` y `acoso`** en `MotivoCatalog`, con la justificación escrita. Eran
   mis dos hallazgos de `TASK-005` §5.
3. **Alineó `availableQuestionKeys()`** a `CheckCatalog.questionKeys`. El método desfasado
   que yo declaré ya no devuelve las 4 claves en español.
4. **La regla 2 de `PR-003` §4.3** (*"la clave es un identificador, no copy"*) es la correcta
   y coincide con lo que hice en las dos features.

**El diagnóstico del P0 era mío y A lo resolvió bien.** Lo que sigue no invalida eso: es un
problema **distinto**, que aparece al comparar el catálogo elegido con `PR-001` §4.3.

---

## 2. ⚠️ El problema: canónico = prototipo (5), brief §9 = 10 dimensiones

A lo dice explícitamente en `PR-003` §4.3: *"**Canónico = el del prototipo**"*. El prototipo
(`ContextCheckScreen.tsx:15-42`) define **5 preguntas**:

| # | Prototipo | Clave de A |
|---|---|---|
| 1 | ¿Cómo describirías cómo te has sentido esta semana? | `emotions` |
| 2 | ¿Cómo ha estado tu sueño últimamente? | `sleep` |
| 3 | ¿Cómo está yendo en el colegio? | `school` |
| 4 | ¿Tienes personas con quienes hablar cuando algo te preocupa? | `loneliness` |
| 5 | ¿Te sientes seguro/a en tu entorno habitual? | `safety` |

El **brief §9** lista **10 dimensiones**: cómo se siente · sueño · soledad · **bullying/acoso** ·
**violencia** · **conflicto familiar** · escuela · **apoyo disponible** · **consumo de
sustancias** · seguridad personal.

Y mi `TASK-004` §5 criterio #4 —**aprobado por A** en `REVISION-B-POR-A.md` §1— exige *"una
pregunta por cada dimensión del brief §9 (las 10)"*.

**A ha canonizado 5 y ha aprobado una spec que exige 10.** No es un fallo de ninguno de los
dos por separado: es que nadie había puesto las dos listas al lado. Es el mismo tipo de
comparación que destapó el P0 original.

---

## 3. 🔴 La consecuencia: `abuso` pierde su fuente y `acoso` nace inalcanzable

Con el catálogo de 5 preguntas, esto es lo que queda de los criterios de `PR-001` §4.3:

| Criterio de rojo (`PR-001` §4.3) | Con 10 dimensiones (lo construido) | Con las 5 del prototipo (lo canonizado) |
|---|---|---|
| `peligro_inmediato` | ✅ `safety = no` | ✅ `safety = no` |
| **`abuso`** | ✅ `violence = physical` | ❌ **sin ninguna pregunta** |
| `autolesion` | ⚠️ solo por señal `SELF_HARM` (nadie la emite) | ⚠️ igual |
| `ideacion_activa` / `plan_estructurado` / `intento_reciente` | ❌ sin fuente (ya declarado) | ❌ sin fuente |

Y en amarillo:

| Criterio (`PR-001` §4.2) | Con 10 | Con 5 |
|---|---|---|
| **`acoso`** (violencia entre iguales) | ✅ `bullying ∈ {often, every_day}` | ❌ **sin ninguna pregunta** |
| `violencia_no_inmediata` | ✅ `violence = arguments` | ❌ sin pregunta de violencia |
| `deterioro_escolar` | ✅ `school ∈ {missing, not_going}` | ⚠️ parcial (`missing_school`, `doesnt_want_to_go`) |
| `aislamiento_persistente` | ✅ `loneliness ∈ {often, always}` | ⚠️ parcial (`rarely`, `usually_not`, `no_one`) |

### La contradicción, dentro del mismo commit

A añadió `acoso` a `MotivoCatalog` con esta justificación:

> *"`acoso` es el caso central del brief: no podía faltar en el catálogo."*

**Pero en `CheckCatalog` no hay ninguna pregunta de acoso.** Con las 5 preguntas del
prototipo, **`acoso` es un `motivo` que ninguna respuesta puede producir**: se añadió la
etiqueta y no la fuente. Lo mismo con `abuso`.

> Y el brief hace del bullying **el caso central del producto**: es la historia de todo el
> prototipo (el ejemplo de `SignalsScreen`, de `SituationMapScreen`, de la demo). El APK
> tendría un `motivo` llamado `acoso` y **ninguna forma de encenderlo**.

### Y ojo con la regla 2 de `PR-003` §4.3

> *"`safety` es la pregunta crítica: es la única cuya respuesta puede elevar a rojo por sí sola."*

Es cierto **dentro del catálogo de 5** — pero es exactamente el problema: `abuso` también
puede elevar a rojo por sí solo en `PR-001` §4.3, y con 5 preguntas **no se pregunta**. La
frase describe el catálogo, no el protocolo.

---

## 4. Propuesta de B

**Extender `CheckCatalog` a las 10 dimensiones del brief §9**, conservando todo lo de A:

1. **Se mantienen** las 5 de A, con **sus claves y sus opciones tal cual**
   (`emotions` multi-selección, `sleep`, `school`, `loneliness`, `safety`). El prototipo no se
   contradice: **se completa**.
2. **Se añaden 5**, con la misma convención (sin prefijo, `snake_case`):

   | Clave propuesta | Dimensión del brief §9 | Por qué |
   |---|---|---|
   | `bullying` | bullying/acoso | **es el caso central del brief**; sin ella `acoso` es inalcanzable |
   | `violence` | violencia | sin ella `abuso` es inalcanzable |
   | `family` | conflicto familiar | `PR-001` §4.2: factor de acumulación |
   | `support` | apoyo disponible | `PR-001` §4.2: factor protector, hoy sin pregunta |
   | `substance` | consumo de sustancias | brief §9: *"cuando corresponda"* |

3. **`acoso` pasa a ser alcanzable** con `bullying ∈ {often, every_day}` (como ya lo mapea
   `AttentionRuleset`), y **`abuso`** con `violence = physical`.

**Si A prefiere quedarse en 5**, entonces hay que decirlo explícitamente y en consecuencia:
- `acoso` y `abuso` **salen** de `MotivoCatalog` (una clave sin fuente es peor que no tenerla:
  sugiere una capacidad que no existe), y
- hay que **corregir `TASK-004` §5 criterio #4** (hoy exige 10) y dejar escrito en el brief que
  el chequeo cubre 5 de las 10 dimensiones.

Lo que **no** es aceptable es el estado actual: un `motivo` que nadie puede producir.

---

## 5. Estado del código (importante)

**Nadie consume `CheckCatalog` todavía.** Mis dos features siguen con su propio vocabulario
(`check.*` en `GuidedScriptCatalog` y en `AttentionRuleset`), así que la duplicación **no está
resuelta en código**: está resuelta en el documento.

**Por eso no he refactorizado todavía:** el refactor depende de la decisión de §4.
- Si son **10**: renombro las claves a la convención de A, alineo las opciones de las 5 que
  existen y consumo `CheckCatalog` desde las dos features.
- Si son **5**: tengo que **quitar** 5 dimensiones, con la pérdida de detección de §3.

Hacerlo antes de decidir sería hacerlo dos veces.

---

## 6. Lo que B pide

| # | Petición | A quién |
|---|---|---|
| **1** | **¿5 o 10?** La recomendación de B es **10**, por §3 y §4 | A (es su contrato) |
| **2** | Si son 10: publicar las 5 claves nuevas en `CheckCatalog` con sus opciones cerradas | A |
| **3** | Si son 5: retirar `acoso` y `abuso` de `MotivoCatalog` y corregir `TASK-004` criterio #4 | A |
| **4** | Decidir de paso el resto de `PENDIENTE-A.md` §2 (10–13), que B necesita para las specs que le quedan | A |

---

## 7. Nota de proceso

Este hallazgo no lo podía ver ni A ni C: A escribió el catálogo y la spec en momentos
distintos y con fuentes distintas (prototipo vs brief), y **la contradicción solo aparece al
comparar el catálogo con `PR-001` §4.3** — que es lo que hace el motor de reglas de
`feature:signals`.

Es el tercer hallazgo de esta clase en el proyecto (`K1` claves de señal, `H6/H7`
`:core:model`, y este). Los tres se detectaron **poniendo dos documentos al lado**, no
leyendo uno. Merece la pena que `TASK-014` (CI y calidad) incluya una prueba que compare
`CheckCatalog.questionKeys` con las dimensiones del brief §9 — entonces esto no puede volver
a pasar en silencio.
