<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-012

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-012-centro-alertas.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es `puente-red/backend/src/core/alerts/` y
`puente-red/portal/src/alerts/` (dueño: **C**).

## 2. Dependencia de build (la aplica A)

**—** Sin dependencia con el APK.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado.

## 7. Otros

### 7.1 🔴 **El backend no comprueba tipos, y ya ha escondido un bug**

Este es el hallazgo más importante de esta tarea, y **afecta a todo el backend**.

Node ejecuta los `.ts` **borrando los tipos sin revisarlos**. Consecuencia: un error de tipos
**no falla al construir ni al probar** — se convierte en un bug de ejecución.

**Pasó de verdad, dos veces:**

1. En `PR-011` pasé una tarjeta **sin el campo `severity`** a la función de comparación. El
   resultado fue `undefined - undefined = NaN`, y `sort` **no ordenó nada**. Los criterios 1 y 2
   de `PR-011` quedaron sin cumplir **sin que nada fallara**: solo lo cazó una prueba que
   comprobaba el orden.
2. Al revisar, aparecieron **tres claves duplicadas** en `KEY_TO_FEATURES` (`deterioro_escolar`,
   `autolesion`, `ideacion_activa`). En un literal de objeto **gana la última**, así que el
   catálogo canónico quedaba sobrescrito en silencio.

**Lo que he hecho** (sin tocar los archivos de A):

- `puente-red/backend/tsconfig.json` — configuración de comprobación, sin emitir.
- Se ejecuta con `../portal/node_modules/.bin/tsc -p tsconfig.json` (reutiliza el TypeScript del
  portal; el backend no tiene dependencias).
- **Está limpio**: cero errores. Y encontró los 4 problemas de arriba.

**Lo que necesito de A** (su `package.json`):

```jsonc
// devDependencies
"typescript": "^7",
"@types/node": "^24",
// scripts
"typecheck": "tsc -p tsconfig.json"
```

Y que `typecheck` entre en el CI de `TASK-014`. **Mientras el backend no compruebe tipos, cada
cambio es una apuesta** — y en un sistema de triaje clínico eso no es aceptable.

### 7.2 ⚠️ El filtro «Derivados» no puede funcionar todavía

El brief §23 pide un filtro **«Derivados»**. No existe el estado `DERIVADO` en la máquina de
estados de `PR-003` §3.1, y las derivaciones son `PR-016`.

**Lo que he hecho:** el filtro **existe** (los 6 del brief están), pero devuelve **siempre vacío**,
y el portal lo explica en su estado vacío: *"Todavía no hay derivaciones: el módulo es PR-016"*.

**Lo que NO he hecho:** inventar un estado `DERIVADO` ni reutilizar `RESUELTO`. Eso haría que
«derivado» significara otra cosa.

**Lo que hace falta:** que A decida si `PR-016` añade un estado a la máquina (y entonces hay que
ver cómo encaja con `RESUELTO`/`CERRADO`) o si las derivaciones viven **fuera** del ciclo del caso.

### 7.3 ⚠️ La sesión de demostración no puede tomar casos

`PR-012` criterio 8 exige que «tomar caso» funcione. Pero la sesión de demostración es de **solo
lectura** (`PR-010` criterio 7, `PR-003` Q7), así que la guardia la rechaza con `DEMO_READ_ONLY`.

**Es correcto y está probado**, pero significa que **la demo no puede demostrar el criterio 8**.
Las pruebas usan una sesión **real** (`isDemo: false`).

**Decisión que necesita la ONG:** si el despliegue va a ser **solo** una demostración con datos
ficticios, tiene sentido permitir escrituras en ese entorno. Hoy no se permite.

### 7.4 El orden se comparte con `PR-011`, no se copia

La spec de `PR-012` exige el orden *"igual que `PR-011`"*. La lógica vive en
`backend/src/core/triage/urgency.ts` y **la usan las dos pantallas**. Hay una prueba que compara
el orden de las dos y exige que coincidan.

Si cada pantalla tuviera su copia, el mismo caso aparecería con **prioridades distintas** según
dónde se mire — y en un sistema de triaje eso es peor que no ordenar.

### 7.5 El portal no filtra en memoria

El filtrado, los contadores y la paginación los hace el **servidor**. Si filtrara el cliente, los
contadores por filtro no cuadrarían con la lista (criterio 6), porque solo tendría la página
cargada.

Un filtro desconocido se rechaza con **400** en vez de ignorarse: silenciarlo haría creer que el
portal está filtrando cuando en realidad muestra todo.

---

## 8. Estado

**Implementado y probado:**

| Qué | Resultado |
|---|---|
| `core/alerts/` (filtros, contadores, paginación) | 19 pruebas |
| `core/triage/urgency.ts` (orden compartido con `PR-011`) | cubierto por ambas suites |
| `CaseQueue.takeCase` (el único camino para tomar un caso) | 6 pruebas |
| `portal/src/alerts/` (cliente) | 15 pruebas |
| Rutas `GET /alertas` y `POST /casos/:token/tomar` | 8 pruebas de superficie |
| **Backend completo** | **231/231 en verde** + `tsc` limpio |
| **Portal** | **49/49 en verde** + build correcto |

**Verificado de extremo a extremo:** el portal sirve la app y proxya `/profesional/**`.

⚠️ **La interfaz no se ha verificado visualmente** (no hay navegador en el entorno).
