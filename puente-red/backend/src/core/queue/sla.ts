/**
 * PR-009 · SLA y cobertura.
 *
 * Los tiempos salen de **`PR-001` §7, firmado** (2026-09-30). No se reestatean como criterio
 * clínico: se **leen** del protocolo, que es la fuente de verdad.
 *
 * **Y hay un matiz que no es cosmético** (`PR-003` §15, Q8): **no hay guardia 24/7**. Por eso
 * el SLA de `ALTO` es un objetivo **en horario**, no una promesa de 24 horas. Fuera de
 * horario, el sistema no puede pintar un SLA incumplido como si hubiera alguien disponible:
 * tiene que decir la verdad.
 */

import type { ProfessionalCategory } from "../directory/index.ts";

export const SLA_VERSION = "sla/1.0.0";

/** Ventanas de SLA, en minutos. Valores de `PR-001` §7 (firmado). */
export interface SlaWindows {
  /** Tiempo máximo hasta el acuse de recibo. */
  readonly ackMinutes: number;
  /** Tiempo máximo hasta la resolución (o hasta el psicólogo, en `ALTO`). */
  readonly resolveMinutes: number;
}

export const DEFAULT_SLA_WINDOWS: Readonly<Record<ProfessionalCategory, SlaWindows>> = {
  ALTO: { ackMinutes: 5, resolveMinutes: 30 },
  MEDIO: { ackMinutes: 4 * 60, resolveMinutes: 24 * 60 },
};

export interface SlaDueDates {
  readonly ackDueAtEpochMillis: number;
  readonly resolveDueAtEpochMillis: number;
}

export function computeSlaDue(
  receivedAtEpochMillis: number,
  category: ProfessionalCategory,
  windows: Readonly<Record<ProfessionalCategory, SlaWindows>> = DEFAULT_SLA_WINDOWS,
): SlaDueDates {
  const window = windows[category];
  const minute = 60_000;
  return {
    ackDueAtEpochMillis: receivedAtEpochMillis + window.ackMinutes * minute,
    resolveDueAtEpochMillis: receivedAtEpochMillis + window.resolveMinutes * minute,
  };
}

/**
 * Estado del SLA en un instante dado.
 *
 * **Se calcula al leer, no se almacena.** Un incumplimiento depende del reloj: guardarlo
 * obligaría a un proceso que recorriera la cola cada minuto, y una lectura con el reloj
 * inyectado es demostrable en pruebas.
 */
export interface SlaStatus {
  readonly ackDueAtEpochMillis: number;
  readonly resolveDueAtEpochMillis: number;
  readonly waitingMillis: number;
  readonly ackBreached: boolean;
  readonly resolveBreached: boolean;
  /** `true` si el caso está sin responsable pasada la ventana de acuse. */
  readonly unassigned: boolean;
  /** `true` si el instante de lectura cae fuera del horario de servicio. */
  readonly outOfHours: boolean;
}

export function computeSlaStatus(params: {
  readonly receivedAtEpochMillis: number;
  readonly category: ProfessionalCategory;
  readonly nowEpochMillis: number;
  readonly acknowledgedAtEpochMillis: number | null;
  readonly hasAssignee: boolean;
  readonly outOfHours: boolean;
  readonly windows?: Readonly<Record<ProfessionalCategory, SlaWindows>>;
}): SlaStatus {
  const due = computeSlaDue(
    params.receivedAtEpochMillis,
    params.category,
    params.windows ?? DEFAULT_SLA_WINDOWS,
  );

  // Fuera de horario el reloj del SLA **no corre**: no se puede reprochar a nadie no haber
  // atendido cuando no había nadie de turno (P5 de `PR-001`).
  const effectiveNow = params.outOfHours
    ? Math.min(params.nowEpochMillis, due.ackDueAtEpochMillis)
    : params.nowEpochMillis;

  const ackBreached =
    params.acknowledgedAtEpochMillis === null && effectiveNow > due.ackDueAtEpochMillis;

  return {
    ackDueAtEpochMillis: due.ackDueAtEpochMillis,
    resolveDueAtEpochMillis: due.resolveDueAtEpochMillis,
    waitingMillis: Math.max(0, params.nowEpochMillis - params.receivedAtEpochMillis),
    ackBreached,
    resolveBreached: !params.outOfHours && params.nowEpochMillis > due.resolveDueAtEpochMillis,
    unassigned: !params.hasAssignee && ackBreached,
    outOfHours: params.outOfHours,
  };
}
