<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-011

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-011-home-profesional.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es `puente-red/backend/src/core/home/` y
`puente-red/portal/src/home/` (dueño: **C**).

## 2. Dependencia de build (la aplica A)

**—** Sin dependencia con el APK.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado. El portal usa tokens propios
(`portal/src/design/tokens.ts`, extraídos del prototipo).

## 7. Otros

### 7.1 ⚠️ **Hueco de integración: la cola no se alimenta de `/joven/casos`**

`PR-011` lee del **`CaseQueue`** (`PR-009`). Pero el endpoint de ingesta del APK
(`POST /joven/casos`, de A, `PR-004`) escribe en **`InMemoryStore`** (`src/shared/store.js`), que
es **otro almacén**.

**Consecuencia:** hoy un reporte que llega del APK **no aparece** en el tablero del portal. Cada
mitad funciona y la unión no existe.

**Lo que necesito de A** (es su lado: `routes/joven/**` y `shared/**`):

| Opción | Qué implica |
|---|---|
| **A. `routes/joven.js` escribe en el `CaseQueue`** (recomendada) | El `CaseQueue` es el dueño de la máquina de estados (`PR-003` §3.1). La ingesta crea el caso y lo deja en `RECIBIDO`; el pipeline de C hace el resto |
| **B. Un adaptador en `shared/**`** | Alguien tiene que traducir entre los dos almacenes, y ese alguien es A |

**Lo que he hecho mientras tanto:** el `CaseQueue` se instancia dentro de `createProfesionalRoutes`
con **almacén en memoria**, y el tablero es **demostrable** con casos ficticios (opt-in). Pero
**no persistente**: reiniciar el servidor vacía la cola.

### 7.2 ⚠️ `IMPORTANT_CHANGE` no es derivable todavía

El criterio de la spec incluye *"casos `MEDIO` con cambio importante observado"* como tercera
prioridad. **El `CaseTicket` no lleva esa información**: los patrones de señal vienen de `PR-006`
y de la comparación longitudinal (`TASK-005`, de B), y nada de eso llega a la cola.

**Lo que he hecho:** el motivo existe en el tipo y tiene su hueco en el orden, pero **no se emite**
hoy. No lo he inventado a partir de datos que no tengo.

**Lo que hace falta:** que el caso lleve sus `patternKeys` de señal (o un indicador de cambio)
desde `PR-006`/`PR-004` hasta la cola. Es una **ampliación del contrato** (`PR-003` §4), de A.

**Mientras tanto**, las `patternKeys` que emite el tablero son las **derivables del SLA**
(`pattern.sla_incumplido`, `pattern.esperando_sin_acuse`, `pattern.sla_en_riesgo`,
`pattern.fuera_de_horario`) y están marcadas como provisionales.

### 7.3 ⚠️ El horario de servicio es provisional y depende de la zona del servidor

`core/home/serviceHours.ts` calcula `fueraDeHorario` con la **hora local del servidor**.

| Punto | Detalle |
|---|---|
| **Valor por defecto** | `08:00-18:00`, configurable con `PUENTE_HORARIO_SERVICIO` |
| **Es provisional** | `PR-003` §15 confirmó que **no hay guardia 24/7**, pero **las horas son una decisión de la ONG** que sigue sin tomarse |
| **⚠️ Zona horaria** | El servidor **debe** estar en `America/La_Paz`. Si está en UTC, el horario se calcula mal y el portal mentiría sobre la cobertura. **A debe confirmarlo en el despliegue** |

### 7.4 Casos ficticios: **opt-in y apagados por defecto**

`PR-003` Q7 es explícito (*"no cargar datos sintéticos aún"*), así que:

- **Por defecto el tablero está VACÍO**, y ese estado vacío es el correcto (criterio 4).
- Solo se siembra con `PUENTE_DEMO_CASOS=on`, y entonces el tablero se marca **`demoData: true`**
  para que el portal lo declare en pantalla.

Un tablero con casos inventados que no se anuncia es peor que un tablero vacío: haría creer que
hay trabajo real pendiente.

### 7.5 El orden lo decide el servidor, no el portal

El portal **no reordena** las tarjetas: recibe el orden del servidor. Si ordenara el cliente, la
prioridad dependería de la pantalla que la muestra. Hay una prueba que lo fija.

---

## 8. Estado

**Implementado y probado:**

| Qué | Resultado |
|---|---|
| `core/home/` (tablero, horario, siembra) | 14 pruebas |
| `portal/src/home/` (cliente y formateo) | 14 pruebas |
| Ruta `GET /profesional/home` | 6 pruebas de superficie |
| **Backend completo** | **196/196 en verde** |
| **Portal** | **34/34 en verde** + build correcto |
| **Extremo a extremo** | El portal sirve la app y proxya `/profesional/**`; `/profesional/home` sin token → 401 |

⚠️ **La interfaz no se ha verificado visualmente** (no hay navegador en el entorno). Lo verificado
es que compila, que la lógica es correcta y que la conexión funciona.
