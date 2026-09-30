/**
 * PR-006 · API pública del paquete `features`.
 *
 * `PR-008` (motor de derivación) y `PR-013` (ficha de caso, secciones 3 y 4) consumen
 * `FeatureExtractor` desde aquí.
 */

export type {
  AgeBand,
  ConfidenceBand,
  Domain,
  FeatureVocabulary,
  ProtectiveFactor,
  Provenance,
  SignalTag,
  SituationType,
  UrgencyLevel,
} from "./vocabulary.ts";

export {
  AGE_BANDS,
  CONFIDENCE_BANDS,
  DOMAINS,
  PROVISIONAL_VOCABULARY,
  PROTECTIVE_FACTORS,
  PROVENANCES,
  SIGNAL_TAGS,
  SITUATION_TYPES,
  URGENCY_LEVELS,
  VOCABULARY_VERSION,
} from "./vocabulary.ts";

export {
  KEY_TO_FEATURES,
  MAPPING_VERSION,
  containsIdentityPattern,
  hintsForKeys,
  redactForModel,
} from "./mapping.ts";
export type { FeatureHint, FeatureKind } from "./mapping.ts";

export { ExtractionProviderError } from "./extractionPort.ts";
export type {
  ExtractionRequest,
  ExtractionResponse,
  FeatureExtractionPort,
} from "./extractionPort.ts";

export {
  EXTRACTOR_VERSION,
  EXTRACTION_PROMPT_VERSION,
  FeatureExtractor,
  SYSTEM_CLOCK,
  ageBandFromRedaction,
} from "./featureExtractor.ts";
export type { FeatureExtractorDeps } from "./featureExtractor.ts";

export type { CaseFeature, CaseFeatureSet, Clock, ReportForExtraction } from "./types.ts";
