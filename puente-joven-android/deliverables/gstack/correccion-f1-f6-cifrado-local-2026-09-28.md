# Corrección de los defectos F1–F6 de cifrado local

**Fecha:** 2026-09-28
**Alcance:** `core:security`, `core:data`, `core:model`
**Motivo:** veredicto del oficial de seguridad `APROBAR CON CONDICIONES` sobre TASK-003.
**Estado:** implementado · 41 pruebas unitarias en verde · verificación independiente en curso

---

## 1. Qué se corrigió

| # | Defecto | Corrección | Archivo |
|---|---------|-----------|---------|
| **F1** | `appendPuenteMessage` guardaba el turno de la app **en claro** | Pasa por `encryptStored()` igual que los mensajes del joven | `local/LocalPuenteRepository.kt` |
| **F1b** | `ShareableSummary.note` (texto libre) también iba en claro | Se guarda cifrada en `summaryNotesState`, aparte; el resumen almacenado lleva `note = null` | mismo archivo |
| **F2** | `ToolCompletion.reflection` en claro | Cifrada al escribir; se devuelve en claro al llamador | mismo archivo |
| **F3** | No había descifrado al leer: la UI habría mostrado sobres | Descifrado solo en la frontera de lectura: `observeActiveConversation()`, `observeCompletions()`, `getPersonalReport()`, `observeSummaries()` | mismo archivo + `repository/Repositories.kt` |
| **F4** | `purgeExpired` solo vaciaba `conversationState` | Purga respuestas, herramientas, resúmenes, borradores y accesos vencidos | mismo archivo + `model/RetentionPolicy.kt` |
| **F5** | `LocalCipher` no podía destruir claves | `destroyKeyMaterial()` / `ensureKeyMaterial()`; `deleteAllLocalContent()` destruye, `createProfile()` rearma | `security/LocalCipher.kt`, `security/KeystoreAesGcmLocalCipher.kt` |
| **F6** | `secretKey()` **regeneraba en silencio** si faltaba el alias | Marcador durable `content.key.present` distingue primer arranque de clave perdida; ante pérdida `isSecure = false` y falla explícito | `security/KeystoreAesGcmLocalCipher.kt`, `security/SecureLocalStore.kt` |

---

## 2. Decisiones que conviene revisar

**a) Las tres fronteras de cifrado.** El joven escribe texto libre en tres sitios: el chat, la reflexión de cada herramienta y la nota del resumen. Los tres pasan ahora por `encryptStored()` / `decryptStored()`. Antes solo uno.

**b) La nota del resumen va en un mapa aparte.** `SummaryNote` valida `MAX_LENGTH = 500` en su constructor, y un sobre cifrado en Base64 no cabe ahí. Por eso la nota se guarda en `summaryNotesState` (cifrada, indexada por id de resumen) y dentro del `ShareableSummary` almacenado queda `note = null`. Al purgar o borrar un resumen, su nota se elimina con él: no quedan notas huérfanas.

**c) Ventanas de purga, todas leídas de `RetentionPolicy`** (ningún literal 90 suelto):

| Contenido | Ventana | Desde |
|-----------|---------|-------|
| Chat (mensajes) | `chatRetentionDays` = 90 | último **acceso** |
| Respuestas de contexto | `reportRetentionDays` = 90 | su marca de tiempo |
| Herramientas completadas | `reportRetentionDays` = 90 | su marca de tiempo |
| Resúmenes | `draftRetentionDays` = 7 | creación |
| Solicitudes en DRAFT | `draftRetentionDays` = 7 | última actualización |
| Accesos temporales concedidos | propia `expiresAtEpochMillis` | — |

**Excepción deliberada: los consentimientos no se purgan automáticamente.** Son la evidencia de que un acceso fue autorizado y no contienen texto libre; solo se destruyen con `deleteAllLocalContent()`. Si la institución decide otra cosa, es un cambio de una línea en `purgeExpired()`.

**d) F6: pérdida de clave ≠ primer arranque.** Antes, si el Keystore se vaciaba, `secretKey()` creaba una clave nueva y la app seguía como si nada, dejando el contenido viejo irrecuperable sin avisar. Ahora hay un marcador durable (`content.key.present`) en el almacén cifrado:
- sin marcador y sin alias → primer arranque, se crea la clave;
- con marcador y sin alias → **clave perdida**: `isSecure = false`, las operaciones fallan con `IllegalStateException`, no se regenera a escondidas.

Rearmar es explícito: `createProfile()` → `prepareCipher()`, que destruye el rastro viejo y prepara material nuevo.

**e) Degradación honesta al leer.** Si el material de claves ya no está, `decryptStored()` devuelve el marcador neutro `"Contenido no disponible"` en lugar de filtrar el sobre o propagar una excepción con datos.

---

## 3. Pruebas

Nuevas: `core/data/src/test/.../LocalContentEncryptionTest.kt` (8) y el doble `TestAesGcmCipher.kt`.

`TestAesGcmCipher` cifra de verdad (AES-256-GCM sobre JVM, no un stub) y permite destruir el material de claves, algo imposible con Android Keystore en un test de JVM. Registra además cada texto plano que entra al cifrador, lo que permite demostrar que **el contenido pasó por el cifrador**, no solo que la lectura devuelve algo legible.

Lo que queda demostrado:

1. Los turnos de la app se cifran (F1).
2. La reflexión de la herramienta se cifra (F2).
3. La nota del resumen se cifra (F1b).
4. Ida y vuelta real en chat, herramientas y resúmenes (F3).
5. El reporte personal trae reflexiones legibles (F3).
6. La purga cubre respuestas, herramientas y resúmenes (F4).
7. Borrar todo destruye el material de claves y lo cifrado antes no vuelve (F5).
8. Sin clave, la lectura no filtra el sobre (degradación honesta).

**Totales:** 41 pruebas, 0 fallos, 0 errores
(8 `LocalContentEncryption` · 4 `RetentionPurge` · 5 `PinHasher` · 8 `LoginViewModel` · 5 `HomeViewModel` · 6 `OnboardingViewModel` · 5 `ModuleGraphGuard`).

---

## 4. Pendiente

- Confirmar longitud del PIN: el spec dice **6** dígitos, la maqueta web y la implementación previa decían 4. Se aplicó 6 mediante `PinPolicy.LENGTH`, con reversión de una línea. **Sigue sin confirmarse.**
- Persistencia local (DataStore, dos almacenes) — siguiente paso según lo acordado.
