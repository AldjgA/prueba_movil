<!-- Formato de CONTRATO-DE-INTEGRACION.md §2 · Declaración de necesidades del Agente C al Agente A -->

# NECESIDADES — PR-005

**Agente:** C · **Fecha:** 2026-09-30 · **Spec:** `specs/PR-005-clasificador-llm.md`

> Los campos que no aplican a Puente Red van con `—` y su motivo
> (`specs/_PLANTILLA-SPEC.md` §1.2).

---

## 1. Módulo nuevo

**—** No es un módulo Gradle. Es un paquete Node: `puente-red/backend/core/` (dueño: **C**,
`CONTRATO-DE-INTEGRACION.md` §1.1).

## 2. Dependencia de build (la aplica A)

**—** No hay dependencia entre el APK y este paquete.

## 3. Ruta nueva en el NavHost

**—** El NavHost es del APK.

## 4. Entrada desde Home

**—** `feature/home/HomeScreen.kt` es del APK.

## 5. Métodos de repositorio

**—** C no consume `Repositories.kt`. Consume el **Contrato A** (`PR-003` §4) por HTTP.

## 6. Componentes del design system

**—** `core/designsystem/**` es Compose y está congelado.

## 7. Otros

### 7.1 ✅ Runtime confirmado: Node/Bun

El dueño confirmó el **2026-09-30** el runtime **Node/Bun + Hono** para el backend, que
`PR-INFRA` §3 ya permitía. Motivo: **Go no está instalado** en la máquina de desarrollo, y Node
sí (v22.22.2). Ventaja añadida: un solo lenguaje con el portal (TypeScript).

**Nota técnica:** Node ≥ 22.18 ejecuta `.ts` con *type stripping* nativo → **sin `tsc`, sin
bundler y sin dependencias**. El paquete se prueba con `node --test`.

### 7.2 🆕 Lo que C ha creado, y lo que necesita de A

**C creó** (dentro de su árbol `backend/core/**`): `package.json` y el módulo
`classification/` completo, con 22 pruebas en verde.

**C necesita de A** (todo dentro de `backend/shared/**` o `backend/main`, que son suyos):

| # | Necesidad | Por qué |
|---|---|---|
| 1 | El **esqueleto de `backend/`**: `main` (servidor Hono/Fastify) y `shared/**` | C no puede exponer nada sin el servidor, y `main`/`shared` son de A |
| 2 | **Cómo se consume `@puente-red/core`** desde `main`: ¿workspace npm, `file:` o ruta relativa? | define si C añade o no un `package.json` raíz (hoy C solo tiene el suyo en `backend/core/`) |
| 3 | **Cliente de Supabase** en `shared/**` | `PR-009` (cola) y `PR-010` (auth) lo necesitan |
| 4 | Que la **guarda de secretos de `TASK-014`** cubra `puente-red/backend/core/**` | hallazgo **F2**: `ModuleGraphGuardTest` no escanea `puente-red/`. El criterio 9 de `PR-005` depende de esto |
| 5 | Las **fixtures del contrato** (`PR-020`) en `backend/shared/**` | C es consumidor |

### 7.3 Contrato de variables de entorno

Documentado en `backend/core/README.md`. Resumen: la clave **nunca** está en el repositorio ni
en la configuración, solo su **nombre** (`PUENTE_GENAI_API_KEY`). El adaptador la lee del
entorno en el momento de la llamada.

### 7.4 ⚠️ Pendiente del clínico (no de A)

El **catálogo de `rationaleKeys`** y la **metodología del prompt** son de `PR-001` §5–§6. Hoy
están marcados **`provisional`** en `catalog.ts` y `prompt.ts`, derivados solo de lo que ya
está escrito en el repo (resumen ejecutivo §4 y `PLAN-PUENTE-RED.md` §7). Cuando se publique el
catálogo clínico, `CATALOG_VERSION` y `PROMPT_VERSION` suben de versión.

---

## 8. Estado

`PR-005` **implementado y probado**: 22/22 pruebas en verde, incluida la property-based de
1.000 casos con proveedor hostil (criterio 2).

**Bloqueado para integrarse en un servicio real** por §7.2 (esqueleto de `backend/`).
