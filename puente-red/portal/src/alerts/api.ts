/**
 * PR-012 · Cliente del centro de alertas.
 *
 * Construye rutas **solo** de `/profesional/**` (`PR-020` criterio 12).
 *
 * El filtro se manda al servidor: **el portal no filtra en memoria**. Si filtrara el cliente,
 * los contadores por filtro no cuadrarían con la lista (criterio 6) porque solo vería la página
 * que tiene cargada.
 */

import { esObjeto, leerJson, listaDeTexto, numero, texto, type FetchLike } from "../api/parse.ts";
import type { AttentionReason } from "../home/api.ts";

export const ALERT_FILTERS = [
  "ALL",
  "RED",
  "YELLOW",
  "UNASSIGNED",
  "IN_FOLLOWUP",
  "REFERRED",
] as const;

export type AlertFilter = (typeof ALERT_FILTERS)[number];

export interface AlertRow {
  readonly caseToken: string;
  /** Categoría operativa del LLM. **Eje distinto** del nivel del joven. */
  readonly category: "MEDIO" | "ALTO" | null;
  /** Nivel de reglas del APK: `VERDE | AMARILLO | ROJO`. */
  readonly youthLevel: string;
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

export interface AlertPage {
  readonly rows: readonly AlertRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly filter: AlertFilter;
  readonly search: string | null;
  readonly counts: Readonly<Record<string, number>>;
  readonly generatedAtEpochMillis: number;
  readonly outOfHours: boolean;
  readonly demoData: boolean;
}

export interface AlertQuery {
  readonly filter?: AlertFilter;
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export type TakeCaseResult =
  | { readonly ok: true; readonly estado: string }
  | { readonly ok: false; readonly status: number; readonly reason: string | null };

export interface AlertsApi {
  page(token: string, query?: AlertQuery): Promise<AlertPage | null>;
  takeCase(token: string, caseToken: string): Promise<TakeCaseResult>;
}

export interface AlertsApiOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: FetchLike;
}

export function createAlertsApi(options: AlertsApiOptions = {}): AlertsApi {
  const baseUrl = options.baseUrl ?? "";
  const doFetch: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));

  return {
    async page(token: string, query: AlertQuery = {}): Promise<AlertPage | null> {
      const params = new URLSearchParams();
      if (query.filter !== undefined) params.set("filtro", query.filter);
      if (query.search !== undefined && query.search !== "") params.set("busqueda", query.search);
      if (query.page !== undefined) params.set("pagina", String(query.page));
      if (query.pageSize !== undefined) params.set("tamano", String(query.pageSize));

      const sufijo = params.toString();
      const url = `${baseUrl}/profesional/alertas${sufijo === "" ? "" : `?${sufijo}`}`;

      let respuesta: Response;
      try {
        respuesta = await doFetch(url, { headers: { authorization: `Bearer ${token}` } });
      } catch {
        return null;
      }
      if (!respuesta.ok) return null;

      const cuerpo = await leerJson(respuesta);
      return cuerpo === null ? null : parsePage(cuerpo);
    },

    async takeCase(token: string, caseToken: string): Promise<TakeCaseResult> {
      let respuesta: Response;
      try {
        respuesta = await doFetch(`${baseUrl}/profesional/casos/${encodeURIComponent(caseToken)}/tomar`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        });
      } catch {
        return { ok: false, status: 0, reason: null };
      }

      const cuerpo = await leerJson(respuesta);
      if (!respuesta.ok) {
        return { ok: false, status: respuesta.status, reason: texto(cuerpo?.["reason"]) };
      }
      return { ok: true, estado: texto(cuerpo?.["estado"]) ?? "" };
    },
  };
}

function parsePage(raw: Record<string, unknown>): AlertPage {
  return {
    rows: Array.isArray(raw["rows"]) ? raw["rows"].map(parseRow).filter(esFila) : [],
    total: numero(raw["total"]),
    page: numero(raw["page"], 1),
    pageSize: numero(raw["pageSize"]),
    filter: (texto(raw["filter"]) ?? "ALL") as AlertFilter,
    search: texto(raw["search"]),
    counts: parseCounts(raw["counts"]),
    generatedAtEpochMillis: numero(raw["generatedAtEpochMillis"]),
    outOfHours: raw["outOfHours"] === true,
    demoData: raw["demoData"] === true,
  };
}

function parseRow(valor: unknown): AlertRow | null {
  if (!esObjeto(valor)) return null;
  const caseToken = texto(valor["caseToken"]);
  if (caseToken === null) return null;

  const category = valor["category"];

  return {
    caseToken,
    category: category === "ALTO" || category === "MEDIO" ? category : null,
    youthLevel: texto(valor["youthLevel"]) ?? "",
    reason: (texto(valor["reason"]) ?? "IMPORTANT_CHANGE") as AttentionReason,
    reasons: listaDeTexto(valor["reasons"]) as AttentionReason[],
    motiveKey: texto(valor["motiveKey"]) ?? "",
    patternKeys: listaDeTexto(valor["patternKeys"]),
    waitingSinceEpochMillis: numero(valor["waitingSinceEpochMillis"]),
    waitingMillis: numero(valor["waitingMillis"]),
    assigneeId: texto(valor["assigneeId"]),
    assigneeName: texto(valor["assigneeName"]),
    state: texto(valor["state"]) ?? "",
    slaBreached: valor["slaBreached"] === true,
    outOfHours: valor["outOfHours"] === true,
  };
}

const esFila = (valor: AlertRow | null): valor is AlertRow => valor !== null;

function parseCounts(valor: unknown): Record<string, number> {
  if (!esObjeto(valor)) return {};
  const counts: Record<string, number> = {};
  for (const [clave, v] of Object.entries(valor)) {
    counts[clave] = numero(v);
  }
  return counts;
}
