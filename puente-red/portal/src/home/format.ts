/**
 * PR-011 · Formateo del tiempo esperando.
 *
 * **Criterio 3:** el tiempo esperando se actualiza **sin recargar**. La forma de conseguirlo sin
 * volver a pedir el tablero es guardar **cuándo se leyó** y sumarle lo transcurrido. Eso hace que
 * el cálculo sea puro y demostrable.
 *
 * El formato es **en español y en unidades humanas**: el prototipo muestra «1h 24 min», no
 * milisegundos.
 */

/** Tiempo esperando en un instante dado, a partir del momento de la lectura. */
export function waitingAt(
  receivedAtEpochMillis: number,
  nowEpochMillis: number,
): number {
  return Math.max(0, nowEpochMillis - receivedAtEpochMillis);
}

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/**
 * Formatea una duración de forma legible.
 *
 * - menos de un minuto → `"ahora"`
 * - menos de una hora → `"18 min"`
 * - menos de un día → `"1 h 24 min"`
 * - a partir de un día → `"2 d 3 h"`
 */
export function formatWaiting(millis: number): string {
  if (!Number.isFinite(millis) || millis < MINUTO) return "ahora";

  if (millis < HORA) {
    return `${Math.floor(millis / MINUTO)} min`;
  }

  if (millis < DIA) {
    const horas = Math.floor(millis / HORA);
    const minutos = Math.floor((millis % HORA) / MINUTO);
    return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
  }

  const dias = Math.floor(millis / DIA);
  const horas = Math.floor((millis % DIA) / HORA);
  return horas === 0 ? `${dias} d` : `${dias} d ${horas} h`;
}

/**
 * Formatea un instante para el pie del tablero.
 * Se usa la hora **local del navegador**; el servidor es quien decide la prioridad.
 */
export function formatHora(epochMillis: number): string {
  const fecha = new Date(epochMillis);
  const hh = String(fecha.getHours()).padStart(2, "0");
  const mm = String(fecha.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Etiqueta legible de una categoría. **El portal no inventa vocabulario nuevo.** */
export function etiquetaCategoria(categoria: string | null): string {
  if (categoria === "ALTO") return "ALTO";
  if (categoria === "MEDIO") return "MEDIO";
  return "SIN CLASIFICAR";
}
