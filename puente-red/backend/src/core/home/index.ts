/**
 * PR-011 · API pública del paquete `home`.
 */

export { MOTIVE, PATTERN, buildTodayBoard } from "./todayBoard.ts";
export type {
  AttentionCard,
  AttentionReason,
  BuildTodayBoardParams,
  MotiveKey,
  PatternKey,
  TodayBoard,
} from "./todayBoard.ts";

export { CASOS_DEMO, seedDemoCases } from "./demoSeed.ts";
export type { DemoCaseSpec, SeedDemoOptions } from "./demoSeed.ts";

export {
  DEFAULT_SERVICE_WINDOW,
  SERVICE_HOURS_VERSION,
  isOutOfHours,
  isOutOfHoursAt,
  minutesOfDay,
  parseServiceWindow,
} from "./serviceHours.ts";
export type { ParsedWindow, ServiceWindow } from "./serviceHours.ts";
