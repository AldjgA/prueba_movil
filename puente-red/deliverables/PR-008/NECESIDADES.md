<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-008

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-008-motor-derivacion.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es un paquete dentro de `puente-red/backend/core/routing/`
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

### 7.1 Sin necesidades de infraestructura nuevas

Todo lo que C necesita de A sigue declarado en
`puente-red/deliverables/PR-005/NECESIDADES.md` §7.2. Este módulo no añade tablas ni
endpoints propios: lee el directorio y escribe la propuesta, que consume `PR-009`.

### 7.2 ⚠️ **Petición de cambio de contrato** — el Contrato A no trae idioma ni zona

**Es la primera vez que un módulo de C pide un cambio en `PR-003`.** Lo hago por escrito, como
manda `CONTRATO-DE-INTEGRACION.md` §2, y **no** he tocado nada del contrato.

**El problema:** `PLAN-PUENTE-RED.md` §3.3 lista **idioma** y **zona geográfica** entre los
atributos de emparejamiento, y `PR-008` les asigna 15 puntos. Pero el **Contrato A**
(`PR-003` §4) no incluye ni el idioma del joven ni su zona:

```
POST /joven/casos
{ contratoVersion, caseToken, origenNivel, rulesetVersion, motivo,
  respuestasChequeo, resumenAutorizado, consentimiento, creadoEn }
```

Ninguno de esos campos los aporta.

**Lo que he hecho mientras tanto:** el motor acepta `preferredLanguages` y `preferredZone` como
**opcionales** y **solo puntúa si llegan**. Si no llegan, esos 15 puntos no se aplican. El motor
**no se inventa un emparejamiento** que el contrato no respalda.

**Lo que necesito de A — tres opciones, en orden de preferencia de C:**

| Opción | Qué implica | Coste |
|---|---|---|
| **A. Añadir dos campos opcionales al Contrato A** (`idiomaPreferido`, `zona`) | El APK los declara en el chequeo contextual (`TASK-004`, de B). Sin ellos, el emparejamiento por idioma y zona **no existe** | Bajo: dos campos opcionales, sin romper compatibilidad |
| **B. Quitar idioma y zona de `PR-008`** | Se ajusta `PLAN-PUENTE-RED.md` §3.3 y los pesos | Bajo, pero **se pierde** un criterio de equidad territorial real en La Paz (aimara/quechua, El Alto) |
| **C. Dejarlo como está** | Los pesos existen y nunca puntúan | Nulo, pero queda una funcionalidad declarada que no funciona |

**Recomendación de C: opción A**, con los dos campos **opcionales** para no romper la
compatibilidad del contrato ya cerrado.

> Nota: la **zona del joven** es un dato con sensibilidad. Si A prefiere no pedirla, el
> emparejamiento por zona debe caer con ella — pero entonces conviene **quitarlo del plan** en
> vez de dejarlo como peso muerto.

### 7.3 ⚠️ Pendiente del clínico (no de A)

- **P6** — *"¿Qué significa 'el más apropiado'? ¿Qué atributos pesan?"* — sigue abierta. Los
  pesos actuales son una **propuesta**, no un dato clínico.
- Por eso el peso `protectiveCoverage` vale **0**: la spec lo lista, pero **no define su
  semántica**. Está declarado y configurable para cuando P6 se responda.

### 7.4 Nota de diseño

`routing/` es el **primer módulo que compone otros dos**: importa `CaseFeatureSet` de
`features/` y `Directory`/`ResponderProfile` de `directory/`. Eso es intencionado — el motor
existe para combinar ambos.

Si A decide crear un módulo `backend/core/domain/` con los tipos de valor compartidos (ver
`deliverables/PR-007/NECESIDADES.md` §7.3), este es el módulo que más se beneficiaría.

---

## 8. Estado

`PR-008` **implementado y probado**: 23 pruebas propias (84 en total en el paquete), cubriendo
los 8 criterios de aceptación.

**Bloqueado para integrarse en un servicio real** por lo mismo que `PR-005` (§7.1): el
esqueleto de `backend/`.

**Pendiente de decisión de A:** §7.2 (idioma y zona en el Contrato A).
