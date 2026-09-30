# TASK-025 · Multi-perfil en dispositivo compartido

**Estado:** Implementada (2026-09-30) · **Autor:** Agente A — Núcleo y contratos · **Revisor:** (pendiente)
**Fecha:** 2026-09-30
**Implementación (nivel de datos):** `:core:data` — `LocalPuenteRepository`, `PuenteLocalStore`, `PersistenceModels`; `YouthRepository` gana `observeProfiles` / `switchProfile` / `deleteProfile` / `unlockSessionFor`.
**Verificado:** `:core:data:test` → **25 pruebas en verde** (7 nuevas de multi-perfil); `:feature:auth:test`, `:feature:home:test` y `:app:compileDemoDebugKotlin` → `BUILD SUCCESSFUL`.
**Fuera de esta entrega:** la UI de selección/creación de perfil es de `TASK-009` (B) → se declara en `NECESIDADES.md`.
**Ola:** 1 · **Depende de:** `TASK-003b`, `TASK-021` · **Bloquea:** el piloto con dispositivos compartidos

---

## 1. Contexto

La app soporta **un solo perfil por instalación**: `profileState` es un único `MutableStateFlow`.
Si el teléfono es compartido —hermanos, un laboratorio del colegio, un centro comunitario—, el
segundo adolescente **pisa al primero**: su alias, su PIN y su contenido.

En un piloto en La Paz con dispositivos compartidos eso **no es una limitación, es un fallo de
privacidad**. `TASK-021` lo clasifica como la amenaza **T1 (crítica)**: el progenitor o el
hermano lee el chat en un teléfono compartido. **Esta tarea es su mitigación principal.**

**Hallazgo de A (2026-09-30):** `createProfile` genera hoy el perfil con
`ProfileId(DemoFixtures.DEMO_YOUTH_ID)`, un **id constante de demo**. Con un solo perfil no se
nota; con varios, **todos los perfiles compartirían el mismo `ProfileId`** y el aislamiento sería
imposible. Se corrige aquí.

---

## 2. Alcance

### Dentro
- Varios `ProfileId` por instalación, **aislados entre sí**.
- **PIN por perfil** y contenido por perfil.
- Resolución del perfil al desbloquear, sin revelar más de lo necesario.
- Borrado de un perfil **sin** afectar a los demás.
- `ProfileId` **único y opaco** por perfil (no la constante de demo).

### Fuera
- El `caseToken` y la correlación en backend (`PR-003`/`PR-004`): esto es solo el lado local.
- Compartir el dispositivo entre perfiles (no hay "cambio rápido" tipo Netflix).
- Migración de instalaciones de un solo perfil (no hay datos de producción).

---

## 3. Módulo y propiedad

- Módulo: **`:core:data`** (dueño: **A**).
- Archivos: `LocalPuenteRepository.kt`, `PuenteLocalStore` (de `TASK-003b`), y posiblemente
  `core/security` para el **espaciado de nombres** de las claves del PIN.
- UI de selección/creación de perfil: **`feature:profile`** (`TASK-009`, dueño: **B**) → se
  **declara** en `NECESIDADES.md`, no se edita aquí.

## 4. Diseño

### 4.1 Índice de perfiles

En el almacén de **sesión** (`TASK-003b`) se guarda una lista:

```
perfiles: [ { profileId, alias, ageBand, createdAtEpochMillis, iconKey } ]
```

El alias **no** es identificador (invariante D-2): es solo la **clave de búsqueda** que el joven
teclea. La identidad sigue siendo el `ProfileId`.

### 4.2 Aislamiento del contenido

**Una entrada de contenido por perfil**, con el `ProfileId` (opaco) dentro de la clave del
almacén.

> **Cambio respecto a la revisión inicial (implementación, 2026-09-30).** Se había propuesto
> **un fichero por perfil** (`puente_content_<profileId>.preferences_pb`). Se descartó: los
> `DataStore` creados dinámicamente **no se pueden cerrar ni borrar con seguridad**, y borrar un
> perfil dejaría el fichero abierto. El aislamiento se garantiza igual porque **la API del
> almacén obliga a decir de qué perfil** (`readContent(profileId)`): no existe "un filtro que
> alguien pueda olvidar".

### 4.3 PIN por perfil

Las claves del `SecureLocalStore` se **espacian por perfil**:
`pin.salt.<profileId>`, `pin.hash.<profileId>`, `pin.iterations.<profileId>`.

Así dos perfiles pueden tener PINes distintos y **el derivado de uno no sirve para el otro**.

### 4.4 Resolución al desbloquear (y la tensión de privacidad)

Mostrar una **lista de alias** en la pantalla de entrada revelaría **quién usa la app** — que es
justo uno de los activos de `TASK-021` §5.1. Por eso:

- **No se muestra una lista.** El joven teclea **alias + PIN**.
- El sistema busca los perfiles con ese alias y verifica el PIN **contra cada uno**.
- Si dos perfiles comparten alias **y** PIN, hace falta un desambiguador → §10 Q1.

### 4.5 Borrado

`deleteAllLocalContent()` sigue borrando **todo** (todos los perfiles). Se añade la operación de
borrar **un** perfil: contenido + claves + entrada del índice, sin tocar los demás.

---

## 5. Contratos de datos

**No cambia** ninguna interfaz de `Repositories.kt`. Se añaden métodos internos al repositorio
(no públicos del contrato) para crear/listar/borrar perfiles, y `TASK-009` (B) los consumirá por
la UI → **se declara en `NECESIDADES.md`**.

Si finalmente hiciera falta un método nuevo en `YouthRepository`, se **declara** y lo aplica A
(`CONTRATO-DE-INTEGRACION.md` §2).

---

## 6. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Crear un segundo perfil **no** modifica el primero | prueba unitaria |
| 2 | El PIN del perfil A **no** desbloquea el perfil B | prueba unitaria |
| 3 | El contenido del perfil A **no** es visible desde el perfil B | prueba unitaria |
| 4 | Borrar el perfil A **conserva** el B | prueba unitaria |
| 5 | Cada perfil recibe un `ProfileId` **único y opaco** (no la constante de demo) | prueba unitaria |
| 6 | La pantalla de entrada **no** lista los alias existentes | revisión visual |
| 7 | `deleteAllLocalContent()` borra **todos** los perfiles y sus claves | prueba unitaria |

---

## 7. Guardrails aplicables

- `TASK-021` T1 (mitigación principal) y el activo "la existencia misma de la app".
- El alias **nunca** es identidad (invariante D-2).
- `consent.scope ⊆ summary.scope` se mantiene **por perfil**.

## 8. Referencia visual

`—` aquí. La UI de perfiles es de `TASK-009` (`feature:profile`, B).

---

## 9. Dependencias

- **Bloqueado por:** `TASK-003b` (necesita el almacén) y `TASK-021` (decide el aislamiento).
- **Bloquea:** el piloto con dispositivos compartidos; parte de `TASK-009`.
- **Relacionada:** `TASK-009` (perfil y privacidad, B).

---

## 10. Preguntas abiertas

| # | Pregunta |
|---|---|
| **Q1** | Si dos perfiles comparten **alias y PIN**, ¿cómo se desambigua? **Implementado:** se desbloquea el **primero que verifica** (`unlockSessionFor`). El desambiguador real (p. ej. un `iconKey` elegido al crear) queda pendiente |
| **Q2** | ¿Hay un **límite** de perfiles por instalación? (¿3? ¿5?) |
| **Q3** | ¿El perfil se puede **eliminar** desde la app o solo desde ajustes? |

---

## 11. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] Los 7 criterios de §6 con su prueba
- [ ] `ProfileId` deja de ser la constante de demo
- [ ] `NECESIDADES.md` entregado a A con lo que necesite `TASK-009`
- [ ] `./gradlew :core:data:test` en verde
