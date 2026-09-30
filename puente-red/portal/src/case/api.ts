/**
 * PR-013 · Cliente de la ficha de caso.
 *
 * Construye rutas **solo** de `/profesional/**` (`PR-020` criterio 12).
 *
 * **El portal no compone la ficha.** Recibe las 7 secciones ya construidas, con sus claves de
 * catálogo. Si el portal decidiera qué secciones mostrar, dos pantallas podrían mostrar fichas
 * distintas del mismo caso.
 */

import { esObjeto, leerJson, listaDeTexto, numero, texto, type FetchLike } from "../api/parse.ts";

export const CASE_FILE_SECTIONS = [
  "MOTIVO",
  "EVOLUCION",
  "SENALES",
  "FACTORES_PROTECTORES",
  "HERRAMIENTAS",
  "RESUMEN_AUTORIZADO",
  "HISTORIAL",
] as const;

export type CaseFileSection = (typeof CASE_FILE_SECTIONS)[number];

export interface FichaEvento {
  readonly tipo: string;
  readonly at: string;
  readonly actorKind: "SYSTEM" | "HUMAN";
}

export interface FichaSeccion {
  readonly seccion: CaseFileSection;
  readonly orden: number;
  readonly tituloKey: string;
  readonly disponible: boolean;
  readonly motivoNoDisponibleKey: string | null;
  readonly claveItems: readonly string[];
  readonly eventos: readonly FichaEvento[];
  /** Lo que el joven **no** autorizó. Se muestra, no se omite (criterio 3). */
  readonly noAutorizadoKeys: readonly string[];
}

export interface CaseFicha {
  readonly caseToken: string;
  readonly categoria: "MEDIO" | "ALTO" | null;
  readonly youthLevel: string;
  readonly estado: string;
  readonly registradoEnEpochMillis: number;
  readonly esperandoMillis: number;
  readonly slaBreached: boolean;
  readonly outOfHours: boolean;
  readonly responsableId: string | null;
  readonly responsableNombre: string | null;
  readonly consentimiento: "AUTORIZADO" | "REVOCADO" | "NO_CONSTA";
  readonly encuadreKey: string;
  readonly secciones: readonly FichaSeccion[];
  readonly puedeTomarse: boolean;
  readonly generadoEnEpochMillis: number;
}

export interface CaseApi {
  ficha(token: string, caseToken: string): Promise<CaseFicha | null>;
}

export interface CaseApiOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: FetchLike;
}

export function createCaseApi(options: CaseApiOptions = {}): CaseApi {
  const baseUrl = options.baseUrl ?? "";
  const doFetch: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));

  return {
    async ficha(token: string, caseToken: string): Promise<CaseFicha | null> {
      let respuesta: Response;
      try {
        respuesta = await doFetch(
          `${baseUrl}/profesional/casos/${encodeURIComponent(caseToken)}`,
          { headers: { authorization: `Bearer ${token}` } },
        );
      } catch {
        return null;
      }
      if (!respuesta.ok) return null;

      const cuerpo = await leerJson(respuesta);
      return cuerpo === null ? null : parseFicha(cuerpo);
    },
  };
}

function parseFicha(raw: Record<string, unknown>): CaseFicha {
  const categoria = raw["categoria"];
  return {
    caseToken: texto(raw["caseToken"]) ?? "",
    categoria: categoria === "ALTO" || categoria === "MEDIO" ? categoria : null,
    youthLevel: texto(raw["youthLevel"]) ?? "",
    estado: texto(raw["estado"]) ?? "",
    registradoEnEpochMillis: numero(raw["registradoEnEpochMillis"]),
    esperandoMillis: numero(raw["esperandoMillis"]),
    slaBreached: raw["slaBreached"] === true,
    outOfHours: raw["outOfHours"] === true,
    responsableId: texto(raw["responsableId"]),
    responsableNombre: texto(raw["responsableNombre"]),
    consentimiento: parseConsentimiento(raw["consentimiento"]),
    encuadreKey: texto(raw["encuadreKey"]) ?? "",
    secciones: Array.isArray(raw["secciones"])
      ? raw["secciones"].map(parseSeccion).filter(esSeccion)
      : [],
    puedeTomarse: raw["puedeTomarse"] === true,
    generadoEnEpochMillis: numero(raw["generadoEnEpochMillis"]),
  };
}

function parseConsentimiento(valor: unknown): "AUTORIZADO" | "REVOCADO" | "NO_CONSTA" {
  if (valor === "AUTORIZADO" || valor === "REVOCADO") return valor;
  return "NO_CONSTA";
}

function parseSeccion(valor: unknown): FichaSeccion | null {
  if (!esObjeto(valor)) return null;
  const seccion = texto(valor["seccion"]);
  if (seccion === null) return null;

  return {
    seccion: seccion as CaseFileSection,
    orden: numero(valor["orden"]),
    tituloKey: texto(valor["tituloKey"]) ?? "",
    disponible: valor["disponible"] === true,
    motivoNoDisponibleKey: texto(valor["motivoNoDisponibleKey"]),
    claveItems: listaDeTexto(valor["claveItems"]),
    eventos: Array.isArray(valor["eventos"]) ? valor["eventos"].map(parseEvento).filter(esEvento) : [],
    noAutorizadoKeys: listaDeTexto(valor["noAutorizadoKeys"]),
  };
}

const esSeccion = (valor: FichaSeccion | null): valor is FichaSeccion => valor !== null;

function parseEvento(valor: unknown): FichaEvento | null {
  if (!esObjeto(valor)) return null;
  const tipo = texto(valor["tipo"]);
  const at = texto(valor["at"]);
  if (tipo === null || at === null) return null;
  return { tipo, at, actorKind: valor["actorKind"] === "HUMAN" ? "HUMAN" : "SYSTEM" };
}

const esEvento = (valor: FichaEvento | null): valor is FichaEvento => valor !== null;
