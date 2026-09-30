<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-009

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-009-cola-sla-trazabilidad.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es un paquete dentro de `puente-red/backend/core/queue/`
(dueño: **C**).

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

### 7.1 🆕 **Lo que este módulo necesita de A: el cliente de Supabase**

Es la necesidad más concreta de la ola R1. `queue/` accede a la persistencia por el puerto
`CaseStore`; la implementación real es **Supabase** (`PR-003` §13).

| Necesidad | Detalle |
|---|---|
| **Cliente de Supabase en `backend/shared/**`** | Con la `service_role` key **solo en el servidor**. C no puede crearlo: `shared/**` es de A |
| **Tabla `casos`** | Ya definida en `PR-004` §4.1. C necesita además la columna `contact_channel_opened_at` y el `idempotency_key` único |
| **Tabla `audit_event`** | `PR-004` §4.3. C escribe `CASE_ENQUEUED` y `STATE_CHANGED` |
| **Índice único en `idempotency_key`** | Es lo que hace la idempotencia **real**. En memoria funciona; en base de datos necesita la restricción |
| **RLS** | La API Joven solo lee **su** caso (por `caseToken` de la sesión); el portal lee según rol (`PR-010`) |
| **Política de `responder_load`** | Se **deriva** de `casos` (casos abiertos por asignado); no se escribe a mano |

**Mientras no exista:** el módulo funciona con `InMemoryCaseStore`, así que la lógica es
demostrable hoy. Pero **sin el índice único en base de datos, la idempotencia no sobrevive a un
reinicio del servidor**.

### 7.2 ⚠️ **Hueco de contrato declarado** — el flujo de rechazo no existe

`PR-003` §3.1 define el camino hacia adelante, pero **no dice qué pasa si un profesional
asignado rechaza el caso**. Hoy `ASIGNADO` **no** tiene vuelta a `EN_COLA`:

```
EN_COLA → ASIGNADO → ACEPTADO
              └─── ✗  no hay camino de vuelta
```

**Consecuencia:** un caso rechazado se queda en `ASIGNADO` indefinidamente, con un responsable
que no lo quiere. En un equipo de tres personas eso no es un caso raro: es el funcionamiento
normal.

**No he inventado la transición.** Propuesta de C, a decidir por A:

| Opción | Qué implica |
|---|---|
| **A. Añadir `ASIGNADO → EN_COLA`** (recomendada) | El profesional **rechaza** y el caso vuelve a la cola con un motivo de catálogo. Hay que decidir si cuenta como un rechazo del mismo respondedor (para no reproponerlo) |
| **B. Añadir `ASIGNADO → CERRADO`** | Rechazar cierra el caso. **Malo**: un caso rojo rechazado no debería desaparecer |
| **C. Dejarlo como está** | El caso se queda colgado. Requiere que la operación sea manual (un supervisor reasigna a mano) |

**Recomendación de C: opción A**, con un campo `declinedBy` para no volver a proponer el mismo
caso al mismo profesional. Es información que el motor de `PR-008` necesitaría para excluirlo.

### 7.3 Hueco relacionado: `NO_ELIGIBLE_RESPONDER`

`PR-008` puede devolver `NO_ELIGIBLE_RESPONDER` (no hay nadie elegible). `PR-003` §3.1 **tampoco
define** qué estado toma el caso entonces: se queda en `EN_COLA` sin responsable, que es lo
correcto — pero conviene que sea **explícito** en el contrato, porque es la situación que
`PR-001` §8 llama *"el mayor riesgo: generar alertas que la ONG no pueda atender"*.

### 7.4 Nota de diseño

`queue/` **importa `Directory`** de `directory/` para producir el Contrato B (`publicView`). Es
la segunda vez que un módulo compone otros; el patrón se mantiene sin acoplamientos cíclicos.

### 7.5 ⚠️ Pendiente del clínico (no de A)

Los tiempos de SLA (`DEFAULT_SLA_WINDOWS`) son de **`PR-001` §7, firmado**, y se **leen** del
protocolo: no se reestatean aquí. Si el clínico los ajustó al firmar, hay que actualizarlos en un
único sitio.

---

## 8. Estado

`PR-009` **implementado y probado**: 30 pruebas propias (**114** en total en el paquete),
cubriendo los 10 criterios de aceptación.

**Con esto queda cerrada la ola R1 completa** (`PR-005`…`PR-009`).

**Bloqueado para integrarse en un servicio real** por §7.1 (cliente de Supabase) y por el
esqueleto de `backend/`.
