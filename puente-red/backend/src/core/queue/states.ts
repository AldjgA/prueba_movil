/**
 * PR-009 · Máquina de estados del caso.
 *
 * **Los estados NO los define este módulo.** Los fija `PR-003` §3.1 y aquí solo se
 * implementan, con los nombres tal cual (sin traducir: son valores de contrato).
 *
 * Aclaración de `REVISION-C.md` §5.1, que sí es una decisión de diseño y no un detalle:
 * `RESUELTO` y `CERRADO` son **dos** estados distintos.
 * - `RESUELTO` — el objetivo del caso se cumplió.
 * - `CERRADO` — cierre **administrativo**, que puede ocurrir **sin** resolverse (revocación
 *   del joven o vencimiento).
 *
 * Un caso puede cerrarse sin resolverse, y eso no es un error: es el camino de la revocación.
 */

export const CASE_STATES = [
  "RECIBIDO",
  "CLASIFICADO",
  "EN_COLA",
  "ASIGNADO",
  "ACEPTADO",
  "CONTACTO_HABILITADO",
  "EN_CURSO",
  "RESUELTO",
  "CERRADO",
] as const;

export type CaseState = (typeof CASE_STATES)[number];

/**
 * Transiciones permitidas.
 *
 * `CERRADO` se alcanza desde **cualquier** estado no terminal, porque `REVISION-C.md` §5.1
 * autoriza el cierre por revocación o vencimiento en cualquier momento. `CERRADO` es
 * terminal: no aparece como origen de nada.
 *
 * **`ACEPTADO → EN_CURSO` sin pasar por `CONTACTO_HABILITADO` es deliberado.** El canal
 * in-app es **baja prioridad** (`PR-003` §6.2, R2) y el psicólogo puede trabajar el caso sin
 * abrirlo. Sin esta transición, un caso aceptado cuyo profesional decide no usar el canal
 * **no tendría forma de avanzar** — que es el caso más frecuente.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<CaseState, readonly CaseState[]>> = {
  RECIBIDO: ["CLASIFICADO", "CERRADO"],
  CLASIFICADO: ["EN_COLA", "CERRADO"],
  EN_COLA: ["ASIGNADO", "CERRADO"],
  ASIGNADO: ["ACEPTADO", "CERRADO"],
  ACEPTADO: ["CONTACTO_HABILITADO", "EN_CURSO", "CERRADO"],
  CONTACTO_HABILITADO: ["EN_CURSO", "CERRADO"],
  EN_CURSO: ["RESUELTO", "CERRADO"],
  RESUELTO: ["CERRADO"],
  CERRADO: [],
};

/** Estados a partir de los cuales el joven ve los datos del profesional (R5). */
export const STATES_WITH_PROFESSIONAL_VISIBLE: readonly CaseState[] = [
  "ACEPTADO",
  "CONTACTO_HABILITADO",
  "EN_CURSO",
  "RESUELTO",
  "CERRADO",
];

/**
 * Estados desde los que el canal in-app **puede** estar abierto.
 *
 * ⚠️ Esto **no** decide si el joven tiene canal: eso lo dice el hecho
 * `contactChannelOpenedAtEpochMillis` del ticket. Se conserva solo como documentación del
 * flujo de `PR-003` §3.1.
 */
export const STATES_WITH_CONTACT_CHANNEL: readonly CaseState[] = [
  "CONTACTO_HABILITADO",
  "EN_CURSO",
];

export function isCaseState(value: string): value is CaseState {
  return (CASE_STATES as readonly string[]).includes(value);
}

export function canTransition(from: CaseState, to: CaseState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminal(state: CaseState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0;
}

/** Orden numérico del estado, útil para diagnóstico. No usar para validar transiciones. */
export function stateOrder(state: CaseState): number {
  return CASE_STATES.indexOf(state);
}
