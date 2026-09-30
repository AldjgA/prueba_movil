/**
 * PR-013 · Ficha de caso: las **7 secciones** del brief §24.
 *
 * **Lo que NO hace:** no muestra la conversación. El brief §24 es tajante (*"No mostrar toda la
 * conversación. Crear una FICHA ESTRUCTURADA"*) y el guardrail #5 lo respalda.
 *
 * ## Cómo se trata lo que todavía no existe
 *
 * La ficha **siempre devuelve las 7 secciones, en su orden** (criterio 1). Cuando la fuente de
 * una sección no está disponible, la sección aparece igualmente con
 * `disponible: false` y una **clave de catálogo** que explica por qué.
 *
 * Es la diferencia entre «esta sección no aplica» y «esta sección no está». Omitirla en silencio
 * haría creer al profesional que ya la ha visto.
 *
 * ## Las tres secciones que hoy no tienen fuente
 *
 * | Sección | Fuente | Estado |
 * |---|---|---|
 * | 2 · Evolución longitudinal | `PR-006` + historial | ⚠️ la cola no lleva características |
 * | 3 · Señales observadas | `PR-006` (`SignalTag`) | ⚠️ ídem |
 * | 4 · Factores protectores | `PR-006` (`ProtectiveFactor`) | ⚠️ ídem |
 *
 * Las tres dependen del `CaseFeatureSet` de `PR-006`, que **no llega a la cola**. Está declarado
 * en `deliverables/PR-013/NECESIDADES.md`.
 */

import type { Directory, ProfessionalCategory } from "../directory/index.ts";
import type { CaseQueue, CaseState, CaseTicket } from "../queue/index.ts";

/** Las 7 secciones del brief §24, **en su orden**. */
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

export const TITULO_KEY: Readonly<Record<CaseFileSection, string>> = {
  MOTIVO: "ficha.seccion.motivo",
  EVOLUCION: "ficha.seccion.evolucion",
  SENALES: "ficha.seccion.senales",
  FACTORES_PROTECTORES: "ficha.seccion.factores_protectores",
  HERRAMIENTAS: "ficha.seccion.herramientas",
  RESUMEN_AUTORIZADO: "ficha.seccion.resumen_autorizado",
  HISTORIAL: "ficha.seccion.historial",
};

/** Claves de catálogo que explican por qué una sección no está disponible. */
export const NO_DISPONIBLE = {
  /** La cola no lleva el `CaseFeatureSet` de `PR-006`. */
  CARACTERISTICAS: "ficha.no_disponible.caracteristicas",
  /** La ingesta no trajo el expediente del Contrato A. */
  SIN_EXPEDIENTE: "ficha.no_disponible.sin_expediente",
} as const;

/**
 * Lo que **nunca** se comparte. El brief §24 y el guardrail #5 lo fijan, así que la ficha lo
 * **muestra explícitamente** en vez de omitirlo (criterio 3).
 */
export const NUNCA_AUTORIZADO: readonly string[] = [
  "scope.conversacion_completa",
  "scope.notas_internas",
];

export interface FichaEvento {
  readonly tipo: string;
  readonly at: string; // ISO-8601
  readonly actorKind: "SYSTEM" | "HUMAN";
}

export interface FichaSeccion {
  readonly seccion: CaseFileSection;
  /** 1-based, el orden del brief §24. */
  readonly orden: number;
  readonly tituloKey: string;
  readonly disponible: boolean;
  /** Por qué no está disponible. Clave de catálogo. */
  readonly motivoNoDisponibleKey: string | null;
  /** Contenido, como **claves de catálogo**. El copy lo pone el portal. */
  readonly claveItems: readonly string[];
  /** Solo la sección 7. */
  readonly eventos: readonly FichaEvento[];
  /** Lo que el joven **no** autorizó. Se muestra, no se omite (criterio 3). */
  readonly noAutorizadoKeys: readonly string[];
}

export type ConsentimientoEstado = "AUTORIZADO" | "REVOCADO" | "NO_CONSTA";

export interface CaseFicha {
  readonly caseToken: string;
  readonly categoria: ProfessionalCategory | null;
  readonly youthLevel: string;
  readonly estado: CaseState;
  readonly registradoEnEpochMillis: number;
  readonly esperandoMillis: number;
  readonly slaBreached: boolean;
  readonly outOfHours: boolean;
  readonly responsableId: string | null;
  readonly responsableNombre: string | null;
  readonly consentimiento: ConsentimientoEstado;
  /**
   * **Encuadre obligatorio** (guardrail #1): la prioridad es preliminar, nunca un diagnóstico.
   * La ficha lo repite en la cabecera (criterio 7).
   */
  readonly encuadreKey: string;
  /** Siempre 7, siempre en orden (criterio 1). */
  readonly secciones: readonly FichaSeccion[];
  /** `true` si el caso todavía se puede tomar (`PR-012` criterio 8). */
  readonly puedeTomarse: boolean;
  readonly generadoEnEpochMillis: number;
}

export const ENCUADRE_KEY = "ficha.encuadre.prioridad_preliminar";

export interface BuildCaseFichaParams {
  readonly queue: CaseQueue;
  readonly directory: Directory;
  readonly caseToken: string;
  readonly nowEpochMillis: number;
  readonly outOfHours: boolean;
}

/** Devuelve `null` si el caso no existe. */
export function buildCaseFicha(params: BuildCaseFichaParams): CaseFicha | null {
  const ticket = params.queue.get(params.caseToken);
  if (ticket === null) return null;

  const status = params.queue.status(params.caseToken, params.outOfHours);
  const responsableId = ticket.assignee ?? ticket.proposedAssignee;

  return {
    caseToken: ticket.caseToken,
    categoria: ticket.category,
    youthLevel: ticket.originLevel,
    estado: ticket.state,
    registradoEnEpochMillis: ticket.receivedAtEpochMillis,
    esperandoMillis: status?.waitingMillis ?? 0,
    slaBreached: (status?.ackBreached ?? false) || (status?.resolveBreached ?? false),
    outOfHours: params.outOfHours,
    responsableId,
    responsableNombre:
      responsableId === null ? null : (params.directory.get(responsableId)?.displayName ?? null),
    consentimiento: estadoConsentimiento(ticket),
    encuadreKey: ENCUADRE_KEY,
    secciones: construirSecciones(ticket, params),
    puedeTomarse: ticket.state === "EN_COLA" || ticket.state === "ASIGNADO",
    generadoEnEpochMillis: params.nowEpochMillis,
  };
}

function construirSecciones(ticket: CaseTicket, params: BuildCaseFichaParams): FichaSeccion[] {
  const expediente = ticket.expediente;

  // 1 · Motivo registrado — del catálogo canónico de `PR-003` §4.2.
  const motivo: FichaSeccion = {
    seccion: "MOTIVO",
    orden: 1,
    tituloKey: TITULO_KEY.MOTIVO,
    disponible: expediente !== null && expediente.motivoKeys.length > 0,
    motivoNoDisponibleKey: expediente === null ? NO_DISPONIBLE.SIN_EXPEDIENTE : null,
    claveItems: expediente?.motivoKeys ?? [],
    eventos: [],
    noAutorizadoKeys: [],
  };

  // 2, 3 y 4 · Dependen del `CaseFeatureSet` de `PR-006`, que no llega a la cola.
  const sinCaracteristicas = (
    seccion: CaseFileSection,
    orden: number,
  ): FichaSeccion => ({
    seccion,
    orden,
    tituloKey: TITULO_KEY[seccion],
    disponible: false,
    motivoNoDisponibleKey: NO_DISPONIBLE.CARACTERISTICAS,
    claveItems: [],
    eventos: [],
    noAutorizadoKeys: [],
  });

  // 5 · Herramientas: las entradas `Tool` del scope autorizado (hallazgo K3 de B).
  const herramientas: FichaSeccion = {
    seccion: "HERRAMIENTAS",
    orden: 5,
    tituloKey: TITULO_KEY.HERRAMIENTAS,
    // Estar vacía **es** un dato: el joven no autorizó ninguna herramienta.
    disponible: expediente !== null,
    motivoNoDisponibleKey: expediente === null ? NO_DISPONIBLE.SIN_EXPEDIENTE : null,
    claveItems: expediente?.herramientasAutorizadas ?? [],
    eventos: [],
    noAutorizadoKeys: [],
  };

  // 6 · Resumen autorizado: SOLO el scope consentido.
  const resumen: FichaSeccion = {
    seccion: "RESUMEN_AUTORIZADO",
    orden: 6,
    tituloKey: TITULO_KEY.RESUMEN_AUTORIZADO,
    disponible: expediente !== null,
    motivoNoDisponibleKey: expediente === null ? NO_DISPONIBLE.SIN_EXPEDIENTE : null,
    claveItems: expediente?.resumenAutorizado.scope ?? [],
    eventos: [],
    // Criterio 3: lo que nunca se comparte se **dice**, no se omite.
    noAutorizadoKeys: NUNCA_AUTORIZADO,
  };

  // 7 · Historial de acciones, de los eventos de la cola.
  const eventos = params.queue.eventsFor(ticket.caseToken);
  const historial: FichaSeccion = {
    seccion: "HISTORIAL",
    orden: 7,
    tituloKey: TITULO_KEY.HISTORIAL,
    disponible: eventos.length > 0,
    motivoNoDisponibleKey: null,
    claveItems: [],
    eventos: eventos.map((evento) => ({
      tipo: evento.to,
      at: evento.at,
      actorKind: evento.actorKind,
    })),
    noAutorizadoKeys: [],
  };

  return [
    motivo,
    sinCaracteristicas("EVOLUCION", 2),
    sinCaracteristicas("SENALES", 3),
    sinCaracteristicas("FACTORES_PROTECTORES", 4),
    herramientas,
    resumen,
    historial,
  ];
}

function estadoConsentimiento(ticket: CaseTicket): ConsentimientoEstado {
  if (ticket.revocationReason === "CONSENT_WITHDRAWN") return "REVOCADO";
  if (ticket.expediente?.consentimiento == null) return "NO_CONSTA";
  return "AUTORIZADO";
}
