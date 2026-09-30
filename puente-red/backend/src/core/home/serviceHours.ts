/**
 * PR-011 · Horario de servicio.
 *
 * **Por qué existe:** el tablero tiene que ser honesto con los tiempos (`PR-001` P5). Si un caso
 * llega de madrugada y nadie está de turno, el sistema **no puede** pintarlo como un SLA
 * incumplido: sería reprochar a alguien no haber atendido cuando no había nadie.
 *
 * `PR-003` §15 confirmó que **no hay guardia 24/7**, pero **las horas concretas son una decisión
 * de la ONG** que todavía no está tomada. Por eso el horario es **configuración**, con un valor
 * por defecto razonable y documentado como provisional.
 *
 * **Zona horaria:** se usa la hora **local del servidor**. El servidor debe estar en
 * `America/La_Paz`; si no, el horario se calcularía mal. Está declarado en
 * `deliverables/PR-011/NECESIDADES.md`.
 */

export const SERVICE_HOURS_VERSION = "service-hours/1.0.0-provisional";

/** Formato `HH:MM-HH:MM`, en 24 h. */
export type ServiceWindow = string;

/** Provisional: la ONG tiene que confirmarlo. */
export const DEFAULT_SERVICE_WINDOW: ServiceWindow = "08:00-18:00";

export interface ParsedWindow {
  readonly startMinutes: number;
  readonly endMinutes: number;
  /** `true` si la ventana cruza la medianoche (p. ej. `20:00-06:00`). */
  readonly crossesMidnight: boolean;
}

/**
 * Interpreta `HH:MM-HH:MM`. Devuelve `null` si no se entiende — y entonces **se asume fuera de
 * horario**, que es la postura conservadora: mejor no reprochar un incumplimiento que reprocharlo
 * de más.
 */
export function parseServiceWindow(ventana: ServiceWindow): ParsedWindow | null {
  const match = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(ventana.trim());
  if (match === null) return null;

  const [, h1, m1, h2, m2] = match;
  const startMinutes = Number(h1) * 60 + Number(m1);
  const endMinutes = Number(h2) * 60 + Number(m2);

  if (
    Number(h1) > 23 ||
    Number(h2) > 23 ||
    Number(m1) > 59 ||
    Number(m2) > 59 ||
    startMinutes === endMinutes
  ) {
    return null;
  }

  return { startMinutes, endMinutes, crossesMidnight: endMinutes < startMinutes };
}

/**
 * ¿Está fuera del horario de servicio?
 *
 * @param minutosDelDia hora local del servidor, en minutos desde medianoche (0..1439).
 */
export function isOutOfHoursAt(minutosDelDia: number, ventana: ServiceWindow): boolean {
  const parsed = parseServiceWindow(ventana);
  // Ventana ilegible: se asume fuera de horario (conservador).
  if (parsed === null) return true;

  if (parsed.crossesMidnight) {
    return !(minutosDelDia >= parsed.startMinutes || minutosDelDia < parsed.endMinutes);
  }
  return !(minutosDelDia >= parsed.startMinutes && minutosDelDia < parsed.endMinutes);
}

/** Conveniencia: calcula los minutos del día a partir de un instante, en hora **local**. */
export function minutesOfDay(epochMillis: number): number {
  const fecha = new Date(epochMillis);
  return fecha.getHours() * 60 + fecha.getMinutes();
}

export function isOutOfHours(epochMillis: number, ventana: ServiceWindow): boolean {
  return isOutOfHoursAt(minutesOfDay(epochMillis), ventana);
}
