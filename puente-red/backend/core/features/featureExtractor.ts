/**
 * PR-006 · Servicio de extracción de características.
 *
 * Arquitectura en dos capas, y el orden importa:
 *
 * 1. **Extracción base determinista** (`mapping.ts`): mapea las claves de catálogo del caso
 *    al vocabulario cerrado. Es una tabla, así que es reproducible y auditable.
 * 2. **Enriquecimiento opcional por LLM** (`extractionPort.ts`): deduce características de
 *    la nota libre, **ya redactada**. Si falla, la extracción base sigue en pie.
 *
 * A diferencia de `PR-005`, un fallo aquí **no** se convierte en un valor de seguridad: no
 * hay ninguna alarma que preservar. Por eso el fallo se ignora en silencio (pero queda
 * fuera del resultado), en vez de forzar un valor conservador.
 */

import {
  AGE_BANDS,
  DOMAINS,
  PROTECTIVE_FACTORS,
  SIGNAL_TAGS,
  SITUATION_TYPES,
  URGENCY_LEVELS,
  VOCABULARY_VERSION,
  isAgeBand,
  isDomain,
  isProtectiveFactor,
  isSignalTag,
  isSituationType,
  isUrgencyLevel,
  type AgeBand,
  type ConfidenceBand,
  type Domain,
  type ProtectiveFactor,
  type Provenance,
  type SignalTag,
  type SituationType,
  type UrgencyLevel,
} from "./vocabulary.ts";
import { MAPPING_VERSION, hintsForKeys, redactForModel, containsIdentityPattern } from "./mapping.ts";
import type {
  ExtractionRequest,
  ExtractionResponse,
  FeatureExtractionPort,
} from "./extractionPort.ts";
import type { CaseFeature, CaseFeatureSet, Clock, ReportForExtraction } from "./types.ts";

export const EXTRACTOR_VERSION = "feature-extractor/1.0.0";
export const EXTRACTION_PROMPT_VERSION = "extraction-prompt/1.0.0-provisional";

/** Banda de la extracción base: el joven lo declaró. */
const BAND_DECLARED: ConfidenceBand = "HIGH";
/** Banda del enriquecimiento por LLM: deducido, no afirmado. */
const BAND_EXTRACTED: ConfidenceBand = "MEDIUM";

const DECLARED_PROVENANCE: Provenance = "DECLARED";
const EXTRACTED_PROVENANCE: Provenance = "EXTRACTED";

export const SYSTEM_CLOCK: Clock = { nowEpochMillis: () => Date.now() };

export interface FeatureExtractorDeps {
  /** `null` = sin enriquecimiento. La extracción base sigue funcionando. */
  readonly port?: FeatureExtractionPort | null;
  readonly clock?: Clock;
  readonly timeoutMs?: number;
}

export class FeatureExtractor {
  readonly #port: FeatureExtractionPort | null;
  readonly #clock: Clock;
  readonly #timeoutMs: number;

  constructor(deps: FeatureExtractorDeps = {}) {
    this.#port = deps.port ?? null;
    this.#clock = deps.clock ?? SYSTEM_CLOCK;
    this.#timeoutMs = deps.timeoutMs ?? 8_000;
  }

  async extract(report: ReportForExtraction): Promise<CaseFeatureSet> {
    const now = new Date(this.#clock.nowEpochMillis()).toISOString();

    // ------------------------------------------------------------------
    // 1. Extracción base, determinista.
    // ------------------------------------------------------------------
    const hints = hintsForKeys(report.motivo);

    const situation = firstSituation(hints);
    const domains = collect(hints, "domain", isDomain);
    const signals = collect(hints, "signal", isSignalTag);
    const protectiveFactors = collect(hints, "protective", isProtectiveFactor);
    const urgencyDeclared = firstUrgency(hints);

    // ------------------------------------------------------------------
    // 2. Enriquecimiento opcional desde la nota, ya redactada.
    // ------------------------------------------------------------------
    const note = report.resumenAutorizado.note;
    let enriched: ExtractionResponse | null = null;
    let ageBand: AgeBand | null = null;

    if (typeof note === "string" && note.trim() !== "") {
      const redacted = redactForModel(note);
      ageBand = ageBandFromRedaction(redacted);
      if (this.#port !== null) {
        enriched = await this.#enrich(report, redacted);
      }
    }

    const mergedDomains = merge(domains, enriched?.domains ?? [], isDomain);
    const mergedSignals = merge(signals, enriched?.signalTags ?? [], isSignalTag);
    const mergedProtective = merge(
      protectiveFactors,
      enriched?.protectiveFactors ?? [],
      isProtectiveFactor,
    );

    return {
      caseToken: report.caseToken,
      situation: situation ?? firstFromList(enriched?.situationTypes ?? [], isSituationType),
      domains: mergedDomains,
      signals: mergedSignals,
      protectiveFactors: mergedProtective,
      ageBand,
      urgencyDeclared:
        urgencyDeclared ?? firstFromList(enriched?.urgencyLevels ?? [], isUrgencyLevel),
      extractorVersion: EXTRACTOR_VERSION,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      extractedAt: now,
    };
  }

  async #enrich(report: ReportForExtraction, redactedNote: string): Promise<ExtractionResponse | null> {
    const port = this.#port;
    if (port === null) return null;

    const request: ExtractionRequest = {
      caseToken: report.caseToken,
      redactedNote,
      allowedSituationTypes: [...SITUATION_TYPES],
      allowedDomains: [...DOMAINS],
      allowedSignalTags: [...SIGNAL_TAGS],
      allowedProtectiveFactors: [...PROTECTIVE_FACTORS],
      allowedUrgencyLevels: [...URGENCY_LEVELS],
      promptVersion: EXTRACTION_PROMPT_VERSION,
      vocabularyVersion: VOCABULARY_VERSION,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.#timeoutMs);

    try {
      return await port.extract(request, controller.signal);
    } catch {
      // El enriquecimiento es opcional: un fallo no invalida la extracción base.
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

// ---------------------------------------------------------------------------
// Utilidades deterministas
// ---------------------------------------------------------------------------

type Hint = { readonly kind: string; readonly value: string };

function hintsOfKind(hints: readonly Hint[], kind: string): string[] {
  return hints.filter((h) => h.kind === kind).map((h) => h.value);
}

function firstSituation(hints: readonly Hint[]): CaseFeature<SituationType> | null {
  const value = hintsOfKind(hints, "situation").find(isSituationType);
  return value === undefined
    ? null
    : { value, provenance: DECLARED_PROVENANCE, confidenceBand: BAND_DECLARED };
}

function firstUrgency(hints: readonly Hint[]): CaseFeature<UrgencyLevel> | null {
  const value = hintsOfKind(hints, "urgency").find(isUrgencyLevel);
  return value === undefined
    ? null
    : { value, provenance: DECLARED_PROVENANCE, confidenceBand: BAND_DECLARED };
}

function firstFromList<T extends string>(
  values: readonly string[],
  guard: (v: string) => v is T,
): CaseFeature<T> | null {
  const value = values.find(guard);
  return value === undefined
    ? null
    : { value, provenance: EXTRACTED_PROVENANCE, confidenceBand: BAND_EXTRACTED };
}

/** Recoge valores válidos, deduplicados y en el **orden del vocabulario** (determinista). */
function collect<T extends string>(
  hints: readonly Hint[],
  kind: string,
  guard: (v: string) => v is T,
): CaseFeature<T>[] {
  const values = hintsOfKind(hints, kind).filter(guard);
  return toSortedFeatures(values, guard);
}

function merge<T extends string>(
  base: readonly CaseFeature<T>[],
  extra: readonly string[],
  guard: (v: string) => v is T,
): CaseFeature<T>[] {
  const declared = base.map((f) => f.value);
  const enriched = extra.filter(guard);
  const combined: CaseFeature<T>[] = [
    ...base,
    ...enriched
      .filter((v) => !declared.includes(v))
      .map((value) => ({
        value,
        provenance: EXTRACTED_PROVENANCE,
        confidenceBand: BAND_EXTRACTED,
      })),
  ];
  // Se reordena por vocabulario: el orden de salida **no** debe depender del orden en que
  // el modelo devolvió las claves. Sin esto, la salida no sería reproducible (criterio 7).
  return orderFeaturesByVocabulary(dedupeByIdentity(combined), guard);
}

/** Ordena por la posición en el vocabulario. */
function orderFeaturesByVocabulary<T extends string>(
  features: readonly CaseFeature<T>[],
  _guard: (v: string) => v is T,
): CaseFeature<T>[] {
  return [...features].sort(
    (a, b) => VOCAB_ORDER.indexOf(a.value) - VOCAB_ORDER.indexOf(b.value),
  );
}

/** Orden fijo según la posición en el vocabulario: garantiza salida reproducible. */
function toSortedFeatures<T extends string>(
  values: readonly T[],
  guard: (v: string) => v is T,
): CaseFeature<T>[] {
  const unique: string[] = Array.from(new Set<string>(values));
  const ordered = orderByVocabulary(unique).filter(guard);
  return ordered.map((value) => ({
    value,
    provenance: DECLARED_PROVENANCE,
    confidenceBand: BAND_DECLARED,
  }));
}

const VOCAB_ORDER: readonly string[] = [
  ...DOMAINS,
  ...SIGNAL_TAGS,
  ...PROTECTIVE_FACTORS,
];

function orderByVocabulary(values: readonly string[]): string[] {
  return [...values].sort((a, b) => VOCAB_ORDER.indexOf(a) - VOCAB_ORDER.indexOf(b));
}

function dedupeByIdentity<T extends string>(features: readonly CaseFeature<T>[]): CaseFeature<T>[] {
  const seen = new Set<string>();
  const result: CaseFeature<T>[] = [];
  for (const feature of features) {
    if (!seen.has(feature.value)) {
      seen.add(feature.value);
      result.push(feature);
    }
  }
  return result;
}

/**
 * Recupera la banda de edad del marcador que dejó `redactForModel`.
 * La edad **exacta** nunca llega hasta aquí: se convirtió en banda antes.
 */
export function ageBandFromRedaction(redacted: string): AgeBand | null {
  const match = /\[banda_edad:([^\]]+)\]/.exec(redacted);
  if (match === null) return null;
  const value = match[1];
  if (value !== undefined && (AGE_BANDS as readonly string[]).includes(value)) {
    return value as AgeBand;
  }
  return null;
}

/** Reexportado para que las pruebas puedan comprobar la barrera de identidad. */
export { containsIdentityPattern, MAPPING_VERSION };
