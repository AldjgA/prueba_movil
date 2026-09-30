/**
 * PR-008 · API pública del paquete `routing`.
 *
 * `PR-009` (cola) consume `RoutingEngine.propose` para pasar el caso de `EN_COLA` a
 * `ASIGNADO`. El motor **propone**; el paso a `ACEPTADO` es humano.
 */

export { PROVISIONAL_CATALOG, REASON, REASON_KEYS, ROUTING_CATALOG_VERSION, TRADEOFF, TRADEOFF_KEYS } from "./catalog.ts";
export type { ReasonKey, RoutingCatalog, TradeoffKey } from "./catalog.ts";

export {
  DEFAULT_EQUITY_THRESHOLDS,
  DEFAULT_WEIGHTS,
  WEIGHTS_VERSION,
  median,
} from "./weights.ts";
export type { EquityThresholds, RoutingWeights } from "./weights.ts";

export { ENGINE_VERSION, ROUTING_REASON, ROUTING_TRADEOFF, RoutingEngine, SYSTEM_CLOCK } from "./routingEngine.ts";
export type { RoutingEngineDeps } from "./routingEngine.ts";

export type {
  Candidate,
  Clock,
  RoutingContext,
  RoutingOutcome,
  RoutingProposal,
} from "./types.ts";
