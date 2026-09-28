# Nota de integración de backend — Puente Joven La Paz

**Estado:** la aplicación está PREPARADA para integrar un backend, pero **ninguna conexión real está habilitada**.
**Referencia:** TASK-008 criterio #8; CR-001; `DECISIONES_PRODUCTO_Y_SEGURIDAD.md` §7.
**Fecha:** 2026-09-28

---

## 1. Punto de sustitución

La fuente de datos se sustituye en **un solo lugar**:

```
core/data/src/main/kotlin/bo/puentejoven/core/data/di/DataModule.kt
  RepositoryModule  →  @Binds ... : LocalPuenteRepository
```

Todas las features consumen interfaces (`YouthRepository`, `ConversationRepository`,
`ContextCheckRepository`, `SignalsRepository`, `ToolsRepository`, `ReportRepository`,
`SharingRepository`, `SupportRepository`, `ChatAccessRepository`), nunca la
implementación. Sustituir el binding no toca Composables, ViewModels ni casos de uso.

## 2. Decisiones DIFERIDAS (no inferir ni codificar todavía)

Se toman antes de activar una conexión real:

1. proveedor, hosting, región y operación del backend;
2. REST, GraphQL u otro protocolo;
3. URL base, certificados, credenciales, secretos y estrategia de configuración;
4. identidad, recuperación de cuenta, sesiones y autenticación del joven;
5. contratos API finales, versionado, paginación, idempotencia y reintentos;
6. política de sincronización offline, conflictos, retención, auditoría e incidentes.

## 3. DTOs de borde PENDIENTES

No existe todavía `:core:network`. Cuando se apruebe el backend, se crearán DTOs y
mappers explícitos para:

| DTO de borde | Contrato de dominio | Notas |
|---|---|---|
| `YouthProfileDto` | `YouthProfile` | Alias ≠ ID; no serializar alias como identificador. |
| `ConversationDto` | `Conversation` / `ConversationMessage` | El chat se cifra en local; revisar cifrado en tránsito y en reposo. |
| `ContextResponseDto` | `ContextResponse` | Claves de catálogo tipadas. |
| `SignalEvidenceDto` | `SignalEvidence` | Evidencia factual, sin interpretación. |
| `AttentionAssessmentDto` | `AttentionAssessment` | **Obligatorio `rulesetVersion`** (TASK-008 #3). |
| `ToolCompletionDto` | `ToolCompletion` | — |
| `PersonalReportDto` | `PersonalReport` | No incluye notas profesionales (no existen en Joven). |
| `ShareableSummaryDto` | `ShareableSummary` | Scope CERRADO; el mapper no debe ampliarlo. |
| `ConsentRecordDto` | `ConsentRecord` | Estado de revocación (`revokedAt`). |
| `SupportRequestDto` | `SupportRequest` | Estados + `revocationReason`. |
| `RuleSetDto` | (fixture local hoy) | Reglas versionadas; sustitución remota diferida. |
| `AuditEventDto` | — | Sin contenido sensible (`metadataWithoutSensitiveContent`). |
| `ChatAccessRequestDto` / `ChatAccessGrantDto` | `ChatAccessRequest` / `ChatAccessGrant` | Scope tipado. |

**Regla del mapper:** campo a campo, explícito. Prohibido copiar el DTO completo al
dominio con reflection/genéricos: eso es lo que permite que un cambio de DTO amplíe
los datos autorizados sin una solicitud de cambio aprobada.

**Formato de serialización:** `kotlinx.serialization` (ya presente en el catálogo de
versiones y usado por `:core:navigation`). No es una decisión diferida.

## 4. Rutas futuras mínimas (borrador, no vincular)

Ver `DECISIONES_PRODUCTO_Y_SEGURIDAD.md` §7 para el detalle. No implementar
endpoints antes de aprobar backend.

## 5. Barrera de compilación

El flavour `demo` (por defecto) **no** depende de `:core:network`. El módulo de red
nacerá cuando se apruebe el backend y se añadirá **solo** al flavour `remote`. La
prueba `app/src/test/.../ModuleGraphGuardTest.kt` falla si esto se rompe.

## 6. Invariantes que la integración futura NO puede romper

1. `consent.scope ⊆ summary.scope` (nunca consentir más de lo resumido).
2. El chat completo nunca entra en el resumen ni se comparte por defecto.
3. El alias nunca es un ID; los IDs de dominio son opacos.
4. Los 10 contratos estables no se renombran sin una solicitud de cambio aprobada.
5. Ningún contrato de Puente Red se compila en el APK juvenil.
6. La retención local se lee de `RetentionPolicy`, no de una constante.
7. `AttentionAssessment` siempre lleva `rulesetVersion`.
