# TASK-003b · Persistencia local (DataStore)

**Estado:** Borrador · **Autor:** Agente A — Núcleo y contratos · **Revisor:** (pendiente)
**Fecha:** 2026-09-30
**Ola:** 1 · **Depende de:** `TASK-003`, `TASK-021` · **Bloquea:** `TASK-004`…`TASK-011`, `TASK-025` (**S2**)

---

## 1. Contexto

`LocalPuenteRepository` guarda **todo en `MutableStateFlow`, en memoria**. Lo único durable es
`SecureLocalStore` (EncryptedSharedPreferences) y solo para el derivado del PIN y el marcador de
clave. Consecuencia: **el chat, las respuestas, las herramientas, los resúmenes y los
consentimientos se pierden al morir el proceso.**

La app **no puede demostrar el producto**: "Mi recorrido" no puede mostrar nada longitudinal si
cada arranque empieza de cero. **TASK-003 no está cerrada**: la lógica de cifrado y retención sí;
el almacenamiento, no.

---

## 2. Alcance

### Dentro
- Persistir **todo** el estado local del joven en **dos almacenes DataStore**.
- Mantener el cifrado en reposo de los tres campos de texto libre.
- Que la retención (`purgeExpired`) y el borrado (`deleteAllLocalContent`) **persistan** su efecto.
- Versionado del esquema de almacenamiento.

### Fuera
- Multi-perfil (`TASK-025`) — esta tarea persiste **un** perfil; el aislamiento entre perfiles es de `TASK-025`.
- Sincronización con backend (`TASK-013`).
- Migración de datos reales: **no hay** datos previos que migrar (hoy todo es en memoria).

---

## 3. Módulo y propiedad

- Módulo: **`:core:data`** (dueño: **A**).
- Archivos: `core/data/.../local/**` (nuevo `PuenteLocalStore`), `LocalPuenteRepository.kt`, `build.gradle.kts` de `:core:data`.
- **`:core:model` no se toca** (ver §4.2).

## 4. Diseño

### 4.1 Dos almacenes (Preferences DataStore)

| Almacén | Fichero | Contenido | Por qué separado |
|---|---|---|---|
| **Sesión** | `puente_session.preferences_pb` | perfil, `lastChatAccessEpochMillis`, contador de ids, `schemaVersion` | Es **pequeño y se lee al arrancar**; decide si hay perfil sin cargar el contenido |
| **Contenido** | `puente_content.preferences_pb` | conversación, respuestas, completamientos, resúmenes, notas, consentimientos, solicitudes, accesos | Es **el grueso** y lo que la retención destruye |

Cada almacén guarda **un snapshot JSON** bajo su clave raíz. Escritura = reemplazo del snapshot
completo: simple y atómico, suficiente para la escala de la demo (≤5 usuarios, `TASK-021`).

### 4.2 Serialización: **DTOs en `:core:data`**, no `@Serializable` en el dominio

`:core:model` es **Kotlin puro** y sus tipos no son serializables. **No se anotan**:
- Mantener el dominio **libre** de la librería de serialización.
- Que el **formato de almacenamiento evolucione** sin tocar los modelos de dominio.
- Evitar la serialización polimórfica del `sealed interface ShareScopeEntry`.

En su lugar, `:core:data` define **DTOs de persistencia** y **mappers explícitos** campo a campo
(misma regla que `BACKEND_INTEGRATION.md` §3: **prohibido** copiar con reflection).

Los **ids** (value classes) se persisten por su `value`. Los **enums** por su `name`.
`ShareScopeEntry` se codifica como `{tipo, key}`.

### 4.3 Cifrado: se conserva intacto

El cifrado ocurre **antes** de llegar al almacén. El snapshot guarda **sobres**, nunca texto en
claro. `LocalCipher` sigue siendo el único camino para el texto libre del joven (chat, reflexión
de herramienta, nota de resumen).

### 4.4 Versionado y arranque

- `schemaVersion` en el almacén de sesión.
- **Sin migraciones en el MVP**: si la versión no coincide, se trata como almacén **vacío** y se
  registra un evento (no hay datos de producción que perder).
- Al arrancar, el repositorio **carga el snapshot** de forma perezosa y expone el mismo `Flow`.

### 4.5 Retención y borrado

- `purgeExpired(now)` **modifica el estado y lo persiste** en la misma operación.
- `deleteAllLocalContent()` limpia **los dos** almacenes, además del `SecureLocalStore` y el
  material de claves (comportamiento actual, que se conserva).

---

## 5. Contratos de datos

**No cambia** ninguna interfaz de `Repositories.kt`: la persistencia es interna a `:core:data`.
Se añade un colaborador interno:

```kotlin
/** Snapshot persistente del estado local. Interno a :core:data. */
interface PuenteLocalStore {
    suspend fun readSession(): SessionSnapshot?
    suspend fun writeSession(snapshot: SessionSnapshot)
    suspend fun readContent(): ContentSnapshot?
    suspend fun writeContent(snapshot: ContentSnapshot)
    suspend fun clearAll()
}
```

Con dos implementaciones: **DataStore** (producción) e **en memoria** (pruebas de JVM, sin
Android). El repositorio recibe `PuenteLocalStore` por constructor, igual que hoy recibe
`SecureLocalStore`.

---

## 6. Criterios de aceptación (verificables)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Tras **recrear** el repositorio sobre el mismo almacén, el perfil, el chat y los consentimientos siguen ahí | prueba unitaria (store en memoria) |
| 2 | El **texto libre nunca** se escribe en claro en el snapshot | prueba unitaria (inspección del JSON) |
| 3 | `deleteAllLocalContent()` deja **los dos** almacenes vacíos | prueba unitaria |
| 4 | `purgeExpired()` **persiste** su efecto (lo purgado no reaparece tras recrear) | prueba unitaria |
| 5 | Un `schemaVersion` desconocido **no revienta**: arranca vacío | prueba unitaria |
| 6 | Las pruebas existentes (`RetentionPurgeTest`, `LocalContentEncryptionTest`) siguen **verdes** | `./gradlew :core:data:test` |

---

## 7. Guardrails aplicables

- `TASK-021`: sin respaldo automático del contenido (`allowBackup`), y **sin PII en logs**.
- El chat completo nunca sale del dispositivo.
- Los consentimientos **no** se purgan solos (siguen la regla actual); solo se destruyen con borrado manual.
- `RetentionPolicy` se lee de la política, nunca de un literal.

## 8. Referencia visual

`—`. Es infraestructura de datos.

---

## 9. Dependencias

- **Bloquea a:** todas las features de B (`TASK-004`…`TASK-011`), que sin esto no son demostrables.
- **Bloqueado por:** `TASK-021` (decide qué se guarda y cómo).
- **Relacionada:** `TASK-025` (reutiliza el mismo diseño de almacén, por perfil).

---

## 10. Preguntas abiertas

| # | Pregunta |
|---|---|
| **Q1** | ¿El contador de ids se persiste o se deriva del contenido al arrancar? (persistirlo es más simple) |
| **Q2** | ¿Se aplica **cifrado también a los metadatos** (fechas, claves) o solo al texto libre? |
| **Q3** | ¿`FLAG_SECURE` y el resto de `TASK-021` §9 entran en esta tarea o en la de UI? |

---

## 11. Definition of Done

- [ ] Spec **Aprobada** por otro agente
- [ ] `./gradlew :core:data:test` en verde
- [ ] Los 6 criterios de §6 con su prueba
- [ ] El snapshot **no** contiene texto libre en claro
- [ ] `NECESIDADES.md` entregado a A (no hay, si no se toca ningún archivo compartido)
