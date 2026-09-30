/**
 * PR-005 · API pública del paquete `classification`.
 *
 * `PR-009` (cola) consume `ClassificationService` desde aquí. El resto del núcleo no debe
 * importar archivos internos.
 */

export type {
  AuthorizedSummary,
  CaseState,
  CaseTransition,
  ClassificationOutcome,
  ClassificationProposal,
  Clock,
  IngestedReport,
  OriginLevel,
  ProfessionalCategory,
} from "./types.ts";

export { CATALOG_VERSION, PROVISIONAL_CATALOG, RATIONALE, RATIONALE_KEYS } from "./catalog.ts";
export type { RationaleCatalog, RationaleKey } from "./catalog.ts";

export { DEFAULT_CONFIG, loadConfigFromEnv } from "./config.ts";
export type { ClassifierConfig, EnvLike } from "./config.ts";

export {
  LlmProviderError,
  assertNoIdentityInPayload,
} from "./llmPort.ts";
export type {
  LlmClassificationRequest,
  LlmClassificationResponse,
  LlmClassifierPort,
} from "./llmPort.ts";

export { PROMPT_VERSION, SYSTEM_INSTRUCTIONS, buildPrompt } from "./prompt.ts";

export { GoogleGenAiClassifier } from "./genaiAdapter.ts";
export type { FetchLike, GenAiAdapterOptions } from "./genaiAdapter.ts";

export { ClassificationService, SYSTEM_CLOCK, hashInput } from "./classificationService.ts";
export type { ClassificationServiceDeps } from "./classificationService.ts";
