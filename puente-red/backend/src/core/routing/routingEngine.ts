/**
 * PR-008 · Motor de derivación escalonado por gravedad y equidad.
 *
 * **Qué hace:** con las características del caso (`PR-006`) y el directorio (`PR-007`),
 * produce una **propuesta de asignación** ordenada y explicable.
 *
 * **Qué NO hace:** no asigna. El acto de tomar el caso es humano (`ACEPTADO`, `PR-003`
 * §3.1). Ese es el guardrail #2 puesto en código.
 *
 * Dos decisiones de diseño que conviene entender antes de tocar esto:
 *
 * 1. **D5 se aplica dos veces.** El directorio ya la hace cumplir, y aquí hay una segunda
 *    barrera. Si alguien sustituye el directorio por otro que no la respete, el motor sigue
 *    sin proponer personal capacitado para un caso `ALTO`.
 * 2. **La equidad es una regla de ORDEN, no solo un peso.** Primero se ordena por **banda de
 *    carga** y después por puntuación. Si fuera solo un peso, un respondedor perfectamente
 *    emparejado pero desbordado podría seguir siendo el primero — y eso es exactamente lo que
 *    `PLAN-PUENTE-RED.md` §3.3 prohíbe (*"que la carga no se concentre en dos personas"*).
 */

import {
  Directory,
  type AgeBand,
  type ProfessionalCategory,
  type ResponderId,
  type ResponderLoad,
  type ResponderProfile,
  type Specialty,
} from "../directory/index.ts";
import type { CaseFeatureSet, SituationType } from "../features/index.ts";
import { PROVISIONAL_CATALOG, REASON, TRADEOFF } from "./catalog.ts";
import {
  DEFAULT_EQUITY_THRESHOLDS,
  DEFAULT_WEIGHTS,
  WEIGHTS_VERSION,
  median,
  type EquityThresholds,
  type RoutingWeights,
} from "./weights.ts";
import type { Candidate, Clock, RoutingContext, RoutingOutcome, RoutingProposal } from "./types.ts";

export const ENGINE_VERSION = "routing-engine/1.0.0";

export const SYSTEM_CLOCK: Clock = { nowEpochMillis: () => Date.now() };

/**
 * Tipo de situación → especialidad del respondedor.
 *
 * `SituationType` es vocabulario **propio de `PR-006`** (estilo de código, mayúsculas);
 * `Specialty` es **valor de contrato** (`PR-003` §6.1, minúsculas). La tabla es la frontera
 * entre los dos, y por eso existe.
 *
 * `OTHER` no mapea a ninguna: no se inventa una especialidad para lo que no se entiende.
 */
const SITUATION_TO_SPECIALTY: Partial<Record<SituationType, Specialty>> = {
  BULLYING: "bullying",
  VIOLENCE: "trauma",
  GRIEF: "duelo",
  FAMILY_CONFLICT: "familia",
  SUBSTANCE: "adicciones",
};

export interface RoutingEngineDeps {
  readonly directory: Directory;
  readonly weights?: RoutingWeights;
  readonly thresholds?: EquityThresholds;
  readonly clock?: Clock;
}

/** Banda de equidad. Menor es mejor. Es la clave de orden primaria. */
type EquityBand = 0 | 1 | 2;

interface Scored {
  readonly profile: ResponderProfile;
  readonly load: ResponderLoad;
  readonly band: EquityBand;
  readonly score: number;
  readonly reasonKeys: string[];
  readonly tradeoffKeys: string[];
}

export class RoutingEngine {
  readonly #directory: Directory;
  readonly #weights: RoutingWeights;
  readonly #thresholds: EquityThresholds;
  readonly #clock: Clock;

  constructor(deps: RoutingEngineDeps) {
    this.#directory = deps.directory;
    this.#weights = deps.weights ?? DEFAULT_WEIGHTS;
    this.#thresholds = deps.thresholds ?? DEFAULT_EQUITY_THRESHOLDS;
    this.#clock = deps.clock ?? SYSTEM_CLOCK;
  }

  propose(context: RoutingContext): RoutingProposal {
    // ------------------------------------------------------------------
    // 1. Elegibles. El directorio aplica D5 (activos + maxCategory).
    // ------------------------------------------------------------------
    const eligible = this.#directory.listEligible({ category: context.category });

    // ------------------------------------------------------------------
    // 2. Segunda barrera de D5. Defensa en profundidad: si el directorio
    //    cambiara, un caso ALTO seguiría sin llegar a personal capacitado.
    // ------------------------------------------------------------------
    const safe = eligible.filter(
      (profile) => !(context.category === "ALTO" && profile.kind === "CAPACITATED_STAFF"),
    );

    const base = {
      caseToken: context.caseToken,
      engineVersion: ENGINE_VERSION,
      weightsVersion: WEIGHTS_VERSION,
      catalogVersion: PROVISIONAL_CATALOG.version,
      proposedAt: new Date(this.#clock.nowEpochMillis()).toISOString(),
    } as const;

    // ------------------------------------------------------------------
    // 3. Sin elegibles: el caso NO se queda sin ruta. Se declara y escala.
    // ------------------------------------------------------------------
    if (safe.length === 0) {
      return {
        ...base,
        outcome: "NO_ELIGIBLE_RESPONDER",
        candidates: [],
        outcomeKey: TRADEOFF.NO_ON_CALL,
      };
    }

    // ------------------------------------------------------------------
    // 4. Puntuación y bandas de equidad.
    // ------------------------------------------------------------------
    const scored = this.#score(safe, context);

    // ------------------------------------------------------------------
    // 5. Cobertura: ALTO fuera de horario sin nadie de guardia.
    // ------------------------------------------------------------------
    const anyOnCall = safe.some((profile) => profile.onCall);
    const outcome: RoutingOutcome =
      context.category === "ALTO" && context.outOfHours && !anyOnCall
        ? "REQUIRES_ON_CALL_ESCALATION"
        : "PROPOSED";

    return {
      ...base,
      outcome,
      candidates: scored.map((s) => ({
        responderId: s.profile.id,
        score: s.score,
        reasonKeys: s.reasonKeys,
        tradeoffKeys: s.tradeoffKeys,
      })),
      outcomeKey: outcome === "REQUIRES_ON_CALL_ESCALATION" ? TRADEOFF.OUT_OF_HOURS : null,
    };
  }

  // -------------------------------------------------------------------------
  // Interno
  // -------------------------------------------------------------------------

  #score(profiles: readonly ResponderProfile[], context: RoutingContext): Scored[] {
    const loads = profiles.map((profile) => this.#directory.load(profile.id));

    const loadMedian = median(loads.map((l) => l.openCases));
    const concentrationMedian = median(loads.map((l) => l.casesTakenLast7Days));

    const situation = context.features.situation?.value ?? null;
    const wantedSpecialty = situation === null ? null : (SITUATION_TO_SPECIALTY[situation] ?? null);
    const ageBand: AgeBand | null = context.features.ageBand;

    const scored = profiles.map((profile, index) => {
      const load = loads[index] as ResponderLoad;
      return this.#scoreOne(
        profile,
        load,
        wantedSpecialty,
        ageBand,
        loadMedian,
        concentrationMedian,
        context,
      );
    });

    // Orden: banda de equidad → puntuación desc → id asc.
    // El tercer criterio hace la salida **reproducible**: sin él, dos respondedores con la
    // misma puntuación podrían salir en cualquier orden (criterio 4).
    return scored.sort((a, b) => {
      if (a.band !== b.band) return a.band - b.band;
      if (b.score !== a.score) return b.score - a.score;
      return a.profile.id.localeCompare(b.profile.id);
    });
  }

  #scoreOne(
    profile: ResponderProfile,
    load: ResponderLoad,
    wantedSpecialty: Specialty | null,
    ageBand: AgeBand | null,
    loadMedian: number,
    concentrationMedian: number,
    context: RoutingContext,
  ): Scored {
    const w = this.#weights;
    const t = this.#thresholds;
    const outOfHours = context.outOfHours;

    let score = 0;
    const reasonKeys: string[] = [];
    const tradeoffKeys: string[] = [];

    // --- Motivos ---------------------------------------------------------
    if (wantedSpecialty !== null && profile.specialties.includes(wantedSpecialty)) {
      score += w.specialtyMatch;
      reasonKeys.push(REASON.SPECIALTY_MATCH);
    }
    if (ageBand !== null && profile.ageBandsServed.includes(ageBand)) {
      score += w.ageBandMatch;
      reasonKeys.push(REASON.AGE_BAND_MATCH);
    }
    // Idioma y zona solo puntúan si el caso los declara. El Contrato A todavía no los trae,
    // así que en la práctica no se aplican: el motor no se inventa un emparejamiento.
    if (
      context.preferredLanguages !== undefined &&
      context.preferredLanguages.length > 0 &&
      context.preferredLanguages.some((language) => profile.languages.includes(language))
    ) {
      score += w.languageMatch;
      reasonKeys.push(REASON.LANGUAGE_MATCH);
    }
    if (context.preferredZone !== undefined && profile.zone === context.preferredZone) {
      score += w.zoneMatch;
      reasonKeys.push(REASON.ZONE_MATCH);
    }
    if (profile.onCall) {
      score += w.onCall;
      reasonKeys.push(REASON.ON_CALL);
    }
    score += w.protectiveCoverage; // 0 hasta que se responda P6

    // --- Equidad: banda de orden + penalización de puntuación ------------
    const band = equityBand(load.openCases, loadMedian, t);

    if (band === 2) {
      score += w.veryHighLoadPenalty;
      tradeoffKeys.push(TRADEOFF.VERY_HIGH_LOAD);
      tradeoffKeys.push(TRADEOFF.HIGH_LOAD);
    } else if (band === 1) {
      score += w.loadPenalty;
      tradeoffKeys.push(TRADEOFF.HIGH_LOAD);
    } else if (load.openCases === 0) {
      reasonKeys.push(REASON.LOW_LOAD);
    }

    if (concentrationMedian > 0 && load.casesTakenLast7Days > concentrationMedian * t.concentrationMultiplier) {
      score += w.concentrationPenalty;
      tradeoffKeys.push(TRADEOFF.RECENT_CONCENTRATION);
    }

    // --- Contexto --------------------------------------------------------
    if (outOfHours) tradeoffKeys.push(TRADEOFF.OUT_OF_HOURS);
    if (!profile.onCall && outOfHours) tradeoffKeys.push(TRADEOFF.NO_ON_CALL);
    if (profile.kind === "CAPACITATED_STAFF") tradeoffKeys.push(TRADEOFF.CAPACITATED_STAFF);

    // Los perfiles de demostración se marcan: una propuesta sobre datos ficticios NO es
    // operativa, y el portal tiene que poder decirlo.
    if (profile.isFictional) tradeoffKeys.push(TRADEOFF.FICTIONAL_PROFILE);

    return {
      profile,
      load,
      band,
      score: clamp(score, 0, 100),
      reasonKeys: dedupe(reasonKeys),
      tradeoffKeys: dedupe(tradeoffKeys),
    };
  }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function equityBand(
  openCases: number,
  loadMedian: number,
  thresholds: EquityThresholds,
): EquityBand {
  // Si nadie tiene carga, todos están en la mejor banda.
  if (loadMedian <= 0) return openCases > 0 ? 1 : 0;

  if (openCases > loadMedian * thresholds.veryHighLoadMultiplier) return 2;
  if (openCases > loadMedian * thresholds.highLoadMultiplier) return 1;
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dedupe(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

/** Reexportado para que `PR-009` pueda etiquetar el motivo de escalado. */
export { TRADEOFF as ROUTING_TRADEOFF, REASON as ROUTING_REASON };

/** Alias de tipo útil para el portal. */
export type { ResponderId, ProfessionalCategory, CaseFeatureSet };
