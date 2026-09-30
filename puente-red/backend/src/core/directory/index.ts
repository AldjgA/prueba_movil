/**
 * PR-007 · API pública del paquete `directory`.
 *
 * `PR-008` (motor de derivación) consume `Directory.listEligible`; `PR-009` (cola) aporta la
 * `LoadSource`; `PR-013` (ficha) y el portal consumen `publicView` para el Contrato C.
 */

export {
  AGE_BANDS,
  CATEGORY_RANK,
  DIRECTORY_VOCABULARY_VERSION,
  LANGUAGES,
  MAX_CATEGORY_BY_KIND,
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_ROLES,
  RESPONDER_KINDS,
  SPECIALTIES,
  ZONES,
  categoryAtLeast,
  isAgeBand,
  isLanguage,
  isProfessionalCategory,
  isProfessionalRole,
  isResponderKind,
  isSpecialty,
  isZone,
} from "./vocabulary.ts";
export type {
  AgeBand,
  Language,
  ProfessionalCategory,
  ProfessionalRole,
  ResponderKind,
  Specialty,
  Zone,
} from "./vocabulary.ts";

export { InMemoryAuditSink, NOOP_AUDIT_SINK } from "./audit.ts";
export type { AuditSink, DirectoryAuditAction, DirectoryAuditEvent } from "./audit.ts";

export {
  DIRECTORY_VERSION,
  Directory,
  SYSTEM_CLOCK,
  ZERO_LOAD_SOURCE,
} from "./directory.ts";
export type {
  DirectoryRejection,
  LoadSource,
  SetActiveResult,
  UpsertResult,
} from "./directory.ts";

export { DEMO_SEED, seedIsEntirelyFictional } from "./seed.ts";

export type {
  Clock,
  EligibilityQuery,
  PublicProfessional,
  ResponderId,
  ResponderLoad,
  ResponderProfile,
} from "./types.ts";
