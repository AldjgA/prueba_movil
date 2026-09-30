/**
 * Ayudantes de parseo de respuestas de la API.
 *
 * **Por qué existe:** `auth/api.ts`, `home/api.ts` y `alerts/api.ts` comparten la misma
 * desconfianza hacia lo que llega por la red. Tener tres copias de `numero()` sería tres sitios
 * donde arreglar el mismo fallo — y una donde olvidarlo.
 *
 * **Principio:** el portal **no confía** en la forma de la respuesta. Un campo ausente o de otro
 * tipo no debe producir `NaN` ni `undefined` colándose en la interfaz.
 */

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Lee el cuerpo como objeto JSON. Devuelve `null` si no lo es. */
export async function leerJson(respuesta: Response): Promise<Record<string, unknown> | null> {
  try {
    const cuerpo: unknown = await respuesta.json();
    return cuerpo !== null && typeof cuerpo === "object" && !Array.isArray(cuerpo)
      ? (cuerpo as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function numero(valor: unknown, respaldo = 0): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : respaldo;
}

export function texto(valor: unknown): string | null {
  return typeof valor === "string" ? valor : null;
}

export function booleano(valor: unknown): boolean {
  return valor === true;
}

export function listaDeTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
}

/** Descarta los `null` de un `map` de parseo. */
export const noNulo = <T>(valor: T | null): valor is T => valor !== null;

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}
