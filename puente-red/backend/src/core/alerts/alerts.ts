/**
 * PR-012 · Centro de alertas: lista completa, filtros y paginación.
 *
 * **Qué es:** la lista de todo lo que hay, con filtros. El home (`PR-011`) responde *"¿qué atiendo
 * ahora?"*; esto responde *"¿qué hay en total y cómo lo filtro?"*.
 *
 * **El orden es el mismo que `PR-011`**, y por eso vive en `../triage/urgency.ts`: si cada
 * pantalla tuviera su copia, el mismo caso aparecería con prioridades distintas según dónde se
 * mire.
 *
 * ## El eje que no hay que confundir
 *
 * Hay **dos escalas independientes** (`PLAN-PUENTE-RED.md` §7):
 * - `youthLevel` — `VERDE | AMARILLO | ROJO`, calculado por **reglas** en el APK.
 * - `category` — `MEDIO | ALTO`, propuesto por el **LLM** en el backend.
 *
 * El filtro **«Rojo» filtra por `youthLevel`, NO por `category`** (criterio 2). Un caso puede ser
 * `ROJO` para el joven y `MEDIO` operativamente. Confundir los dos ejes rompería la lectura del
 * tablero.
 */

import type { Directory, ProfessionalCategory } from "../directory/index.ts";
import type { CaseQueue, CaseState } from "../queue/index.ts";
import {
  ESTADOS_EN_SEGUIMIENTO,
  ESTADOS_FUERA_DE_ATENCION,
  compararUrgencia,
  evaluarUrgencia,
  type AttentionReason,
  type MotiveKey,
  type PatternKey,
} from "../triage/urgency.ts";

/** Los seis filtros del brief §23, en su orden. */
export const ALERT_FILTERS = [
  "ALL",
  "RED",
  "YELLOW",
  "UNASSIGNED",
  "IN_FOLLOWUP",
  "REFERRED",
] as const;

export type AlertFilter = (typeof ALERT_FILTERS)[number];

export function isAlertFilter(valor: string): valor is AlertFilter {
  return (ALERT_FILTERS as readonly string[]).includes(valor);
}

/** Nivel preliminar calculado por las **reglas** del APK. Nunca el del LLM. */
export type YouthLevel = "VERDE" | "AMARILLO" | "ROJO";

export interface AlertRow {
  readonly caseToken: string;
  /** `MEDIO | ALTO` — la categoría operativa del LLM. */
  readonly category: ProfessionalCategory | null;
  /** `VERDE | AMARILLO | ROJO` — el nivel de reglas del APK. **Eje distinto.** */
  readonly youthLevel: string;
  readonly reason: AttentionReason;
  readonly reasons: readonly AttentionReason[];
  readonly motiveKey: MotiveKey;
  readonly patternKeys: readonly PatternKey[];
  readonly waitingSinceEpochMillis: number;
  readonly waitingMillis: number;
  readonly assigneeId: string | null;
  readonly assigneeName: string | null;
  readonly state: CaseState;
  readonly slaBreached: boolean;
  readonly outOfHours: boolean;
}

export interface AlertPage {
  readonly rows: readonly AlertRow[];
  /** Total que cumple el filtro **y** la búsqueda, antes de paginar. */
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly filter: AlertFilter;
  readonly search: string | null;
  /** Cuántos casos habría en **cada** filtro, con la búsqueda actual aplicada. */
  readonly counts: Readonly<Record<AlertFilter, number>>;
  readonly generatedAtEpochMillis: number;
  readonly outOfHours: boolean;
  readonly demoData: boolean;
}

export interface BuildAlertPageParams {
  readonly queue: CaseQueue;
  readonly directory: Directory;
  readonly nowEpochMillis: number;
  readonly outOfHours: boolean;
  readonly filter?: AlertFilter;
  /** Búsqueda por `caseToken`. */
  readonly search?: string;
  /** 1-based. */
  readonly page?: number;
  readonly pageSize?: number;
  readonly demoData?: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Predicados de cada filtro. **En datos, no en una cadena de `if`**: así se pueden probar por
 * tabla y no se olvida ninguno.
 */
export const ALERT_PREDICATES: Readonly<Record<AlertFilter, (row: AlertRow) => boolean>> = {
  ALL: () => true,
  // Criterio 2: por NIVEL DEL JOVEN, no por categoría del LLM.
  RED: (row) => row.youthLevel === "ROJO",
  YELLOW: (row) => row.youthLevel === "AMARILLO",
  UNASSIGNED: (row) => row.assigneeId === null,
  IN_FOLLOWUP: (row) => ESTADOS_EN_SEGUIMIENTO.includes(row.state),
  /**
   * ⚠️ **Siempre vacío hoy, y es correcto.**
   *
   * «Derivados» filtraría por el estado `DERIVADO`, que **no existe** en la máquina de estados
   * de `PR-003` §3.1. Las derivaciones son `PR-016` y todavía no tienen estado propio.
   *
   * No se ha inventado un estado ni se ha reutilizado `RESUELTO`: eso haría que «derivado»
   * significara otra cosa. Declarado en `deliverables/PR-012/NECESIDADES.md`.
   */
  REFERRED: () => false,
};

export function buildAlertPage(params: BuildAlertPageParams): AlertPage {
  const filter = params.filter ?? "ALL";
  const pageSize = clamp(params.pageSize ?? DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const busqueda = params.search?.trim().toLowerCase() ?? null;

  // 1. Todos los casos que piden atención, con su urgencia evaluada.
  const evaluados = params.queue
    .list()
    .filter((t) => !ESTADOS_FUERA_DE_ATENCION.includes(t.state))
    .map((ticket) => {
      const urgencia = evaluarUrgencia({
        ticket,
        status: params.queue.status(ticket.caseToken, params.outOfHours),
        outOfHours: params.outOfHours,
        nowEpochMillis: params.nowEpochMillis,
      });

      const responsableId = ticket.assignee ?? ticket.proposedAssignee;
      const row: AlertRow = {
        caseToken: ticket.caseToken,
        category: ticket.category,
        youthLevel: ticket.originLevel,
        reason: urgencia.reason,
        reasons: urgencia.reasons,
        motiveKey: urgencia.motiveKey,
        patternKeys: urgencia.patternKeys,
        waitingSinceEpochMillis: ticket.receivedAtEpochMillis,
        waitingMillis: urgencia.waitingMillis,
        assigneeId: responsableId,
        assigneeName:
          responsableId === null ? null : (params.directory.get(responsableId)?.displayName ?? null),
        state: ticket.state,
        slaBreached: urgencia.slaBreached,
        outOfHours: params.outOfHours,
      };

      return { row, severity: urgencia.severity };
    });

  // 2. Orden por urgencia (el MISMO que PR-011).
  evaluados.sort((a, b) =>
    compararUrgencia(
      { caseToken: a.row.caseToken, waitingMillis: a.row.waitingMillis, severity: a.severity },
      { caseToken: b.row.caseToken, waitingMillis: b.row.waitingMillis, severity: b.severity },
    ),
  );
  const todas = evaluados.map((e) => e.row);

  // 3. La búsqueda se aplica ANTES de contar: los contadores deben cuadrar con lo que se ve.
  const buscadas =
    busqueda === null ? todas : todas.filter((row) => row.caseToken.toLowerCase().includes(busqueda));

  const counts = Object.fromEntries(
    ALERT_FILTERS.map((f) => [f, buscadas.filter(ALERT_PREDICATES[f]).length]),
  ) as Record<AlertFilter, number>;

  const filtradas = buscadas.filter(ALERT_PREDICATES[filter]);
  const total = filtradas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const pagina = clamp(params.page ?? 1, 1, totalPaginas);
  const desde = (pagina - 1) * pageSize;

  return {
    rows: filtradas.slice(desde, desde + pageSize),
    total,
    page: pagina,
    pageSize,
    filter,
    search: params.search?.trim() ?? null,
    counts,
    generatedAtEpochMillis: params.nowEpochMillis,
    outOfHours: params.outOfHours,
    demoData: params.demoData === true,
  };
}

function clamp(valor: number, minimo: number, maximo: number): number {
  if (!Number.isFinite(valor)) return minimo;
  return Math.max(minimo, Math.min(maximo, Math.trunc(valor)));
}
