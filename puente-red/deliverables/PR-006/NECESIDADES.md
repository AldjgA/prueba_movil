<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-006

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-006-extraccion-caracteristicas.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es un paquete dentro de `puente-red/backend/core/features/`
(dueño: **C**).

## 2. Dependencia de build (la aplica A)

**—** Sin dependencia con el APK.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`. Consume el **Contrato A** (`PR-003` §4) por HTTP.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado.

## 7. Otros

### 7.1 Sin necesidades nuevas respecto de `PR-005`

Todo lo que C necesita de A ya está declarado en
`puente-red/deliverables/PR-005/NECESIDADES.md` §7.2 (esqueleto de `backend/`, cómo consume
`main` a `@puente-red/core`, cliente de Supabase, guarda de secretos de `TASK-014` sobre
`puente-red/**`, fixtures del contrato). **Este módulo no añade ninguna.**

### 7.2 Nota de diseño que A debería conocer

`features/` **no importa** tipos de `classification/`. Declara su propia entrada
(`ReportForExtraction`), que es un **subconjunto estructural del Contrato A**. Motivo: que un
cambio en `PR-005` no pueda romper `PR-006`. Un `IngestedReport` es asignable sin conversión.

Si A prefiere un tipo compartido único para el Contrato A dentro de `backend/core/`, es una
decisión suya y C la aplica — pero hoy los dos módulos son independientes a propósito.

### 7.3 ⚠️ Pendiente del clínico (no de A)

La **tabla de mapeo** (`mapping.ts`, `MAPPING_VERSION`) y el **vocabulario cerrado**
(`vocabulary.ts`, `VOCABULARY_VERSION`) se derivan de las dimensiones ya escritas en el repo
(brief §9 y resumen ejecutivo §4.1). Están marcados `provisional`. El clínico los valida en
`PR-001` §5 junto con el catálogo de `PR-005`.

### 7.4 Lo que este módulo NO hace, por diseño

- No puntúa gravedad ni riesgo (guardrail #2).
- No decide derivaciones (`PR-008`).
- No lee nada del chat no autorizado: solo el `ResumenAutorizado`.
- No infiere características no declaradas ni usa texto libre en la salida.

---

## 8. Estado

`PR-006` **implementado y probado**: 18 pruebas propias (40 en total en el paquete), cubriendo
los 7 criterios de aceptación.

**Bloqueado para integrarse en un servicio real** por lo mismo que `PR-005` (§7.1): el
esqueleto de `backend/`.
