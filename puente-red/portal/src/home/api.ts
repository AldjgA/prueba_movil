/**
 * PR-011 · Cliente del tablero.
 *
 * Igual que `auth/api.ts`, construye rutas **solo** de `/profesional/**` (`PR-020` criterio 12).
 *
 * El portal **no ordena** las tarjetas ni decide su prioridad: las recibe ordenadas. Si las
 * ordenara el cliente, la prioridad dependería de la pantalla que la muestra.
 */

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type AttentionReason =
  | "HIGH_WAITING"
  | "UNASSIGNED"
  | "IMPORTANT_CHANGE"
  | "SLA_AT_RISK"
  | "SLA_BREACHED";

export interface AttentionCard {
  readonly caseToken: string;
  readonly category: "MEDIO" | "ALTO" | null;
  readonly reason: AttentionReason;
  readonly reasons: readonly AttentionReason[];
  readonly motiveKey: string;
  readonly patternKeys: readonly string[];
  readonly waitingSinceEpochMillis: number;
  readonly waitingMillis: number;
  readonly assigneeId: string | null;
  readonly assigneeName: string | null;
  readonly state: string;
  readonly slaBreached: boolean;
  readonly outOfHours: boolean;
}

export interface TodayBoard {
  readonly cards: readonly AttentionCard[];
  readonly waitingCount: number;
  readonly unassignedCount: number;
  readonly importantChangeCount: number;
  readonly generatedAtEpochMillis: number;
  readonly outOfHours: boolean;
  /** `true` si el servidor está demostrando con casos ficticios (`PR-003` Q7). */
  readonly demoData: boolean;
}

export interface HomeApi {
  board(token: string): Promise<TodayBoard | null>;
}

export interface HomeApiOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: FetchLike;
}

export function createHomeApi(options: HomeApiOptions = {}): HomeApi {
  const baseUrl = options.baseUrl ?? "";
  const doFetch: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));

  return {
    async board(token: string): Promise<TodayBoard | null> {
      let respuesta: Response;
      try {
        respuesta = await doFetch(`${baseUrl}/profesional/home`, {
          headers: { authorization: `Bearer ${token}` },
        });
      } catch {
        return null;
      }
      if (!respuesta.ok) return null;

      let cuerpo: unknown;
      try {
        cuerpo = await respuesta.json();
      } catch {
        return null;
      }
      if (cuerpo === null || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return null;

      return parseBoard(cuerpo as Record<string, unknown>);
    },
  };
}

function parseBoard(raw: Record<string, unknown>): TodayBoard {
  return {
    cards: Array.isArray(raw["cards"]) ? raw["cards"].map(parseCard).filter(noNulo) : [],
    waitingCount: numero(raw["waitingCount"]),
    unassignedCount: numero(raw["unassignedCount"]),
    importantChangeCount: numero(raw["importantChangeCount"]),
    generatedAtEpochMillis: numero(raw["generatedAtEpochMillis"]),
    outOfHours: raw["outOfHours"] === true,
    demoData: raw["demoData"] === true,
  };
}

function parseCard(valor: unknown): AttentionCard | null {
  if (valor === null || typeof valor !== "object" || Array.isArray(valor)) return null;
  const raw = valor as Record<string, unknown>;
  const caseToken = texto(raw["caseToken"]);
  if (caseToken === null) return null;

  return {
    caseToken,
    category: raw["category"] === "ALTO" || raw["category"] === "MEDIO" ? raw["category"] : null,
    reason: (texto(raw["reason"]) ?? "IMPORTANT_CHANGE") as AttentionReason,
    reasons: listaDeTexto(raw["reasons"]) as AttentionReason[],
    motiveKey: texto(raw["motiveKey"]) ?? "",
    patternKeys: listaDeTexto(raw["patternKeys"]),
    waitingSinceEpochMillis: numero(raw["waitingSinceEpochMillis"]),
    waitingMillis: numero(raw["waitingMillis"]),
    assigneeId: texto(raw["assigneeId"]),
    assigneeName: texto(raw["assigneeName"]),
    state: texto(raw["state"]) ?? "",
    slaBreached: raw["slaBreached"] === true,
    outOfHours: raw["outOfHours"] === true,
  };
}

const noNulo = <T>(valor: T | null): valor is T => valor !== null;

function numero(valor: unknown): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" ? valor : null;
}

function listaDeTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
}
