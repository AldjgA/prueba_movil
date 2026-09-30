<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-007

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-007-directorio-profesionales.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es un paquete dentro de `puente-red/backend/core/directory/`
(dueño: **C**).

## 2. Dependencia de build (la aplica A)

**—** Sin dependencia con el APK.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`. El **Contrato C** (`PR-003` §6.1) sale por la API Joven,
no por el APK.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado.

## 7. Otros

### 7.1 Sin necesidades nuevas respecto de `PR-005`

Todo lo que C necesita de A sigue declarado en
`puente-red/deliverables/PR-005/NECESIDADES.md` §7.2. **Este módulo no añade ninguna.**

### 7.2 🆕 Tablas de Supabase que este módulo necesita

`responders` y `responder_load` (ya declaradas en `PR-000/NECESIDADES.md` §7.2). Detalle:

| Tabla | Notas |
|---|---|
| `responders` | PK = `auth.users.id` (**Supabase Auth**, `PR-003` Q9). Columnas = los 12 campos de `ResponderProfile`. **Sin** columnas de documento ni domicilio |
| `responder_load` | **Derivada**: se calcula desde la cola, no se escribe a mano |

**RLS:** el portal lee `responders` según rol (`PR-010`); solo `SUPERVISION` escribe
(`MANAGE_DIRECTORY`). La **API Joven** solo puede leer la proyección pública de los
respondedores de casos en `ACEPTADO` o posterior.

### 7.3 Nota de diseño que A debería conocer

`directory/` **no importa** tipos de `classification/` ni de `features/`. Declara su propio
`ProfessionalCategory` y su propio `AgeBand`, estructuralmente idénticos. Mismo criterio que
`PR-006`: que un cambio en un módulo no pueda romper otro.

**Recomendación a futuro:** si el vocabulario compartido sigue creciendo (`PR-008` y `PR-009`
lo van a necesitar), puede merecer la pena un módulo `backend/core/domain/` con los tipos de
valor comunes. C lo aplicaría, pero **no lo hace por iniciativa propia** para no refactorizar
código ya revisado.

### 7.4 Decisión de alcance que conviene confirmar

La siembra de la demo tiene **tres** perfiles ficticios, no una lista larga. Motivo: `PR-003`
Q7 (la demo no usa datos reales ni sintéticos) y el brief §28 (*"no inventar servicios
oficiales reales"*). Un directorio de treinta perfiles daría a entender que hay treinta
profesionales reales detrás.

Si la ONG prefiere más perfiles para la demostración, es una decisión suya — pero conviene que
la demo **declare** que son ficticios.

### 7.5 ⚠️ Pendiente del clínico (no de A)

Especialidades, zonas e idiomas (`DIRECTORY_VOCABULARY_VERSION`) se derivan de
`PLAN-PUENTE-RED.md` §3.3 y del brief §28. El clínico los valida en `PR-001` §7, junto con la
**formación mínima del personal capacitado** (pregunta 9 de `PR-001` §13).

---

## 8. Estado

`PR-007` **implementado y probado**: 21 pruebas propias (61 en total en el paquete), cubriendo
los 8 criterios de aceptación.

**Bloqueado para integrarse en un servicio real** por lo mismo que `PR-005` (§7.1): el
esqueleto de `backend/`.
