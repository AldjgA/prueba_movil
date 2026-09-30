/**
 * PR-011 · Carga del tablero y reloj de la interfaz.
 *
 * Dos cosas distintas, y conviene no confundirlas:
 *
 * - **`useTodayBoard`**: pide el tablero al servidor. Decide **qué** tarjetas hay y **en qué
 *   orden** (eso lo decide el servidor, no el portal).
 * - **`useTicker`**: solo mueve el reloj para que el tiempo esperando avance **sin volver a
 *   pedir el tablero** (criterio 3). No cambia la lista ni el orden.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createHomeApi, type HomeApi, type TodayBoard } from "./api.ts";

/** Cada cuánto se vuelve a pedir el tablero. El orden puede cambiar (llega un caso nuevo). */
export const REFRESH_EVERY_MS = 30_000;

/** Cada cuánto se mueve el reloj de la interfaz. Solo afecta al texto del tiempo esperando. */
export const TICK_EVERY_MS = 20_000;

export interface TodayBoardState {
  readonly board: TodayBoard | null;
  readonly cargando: boolean;
  /** Mensaje para el profesional. `null` si no hay problema. */
  readonly error: string | null;
  recargar(): void;
}

export function useTodayBoard(
  token: string | null,
  options: { readonly api?: HomeApi; readonly refreshEveryMs?: number } = {},
): TodayBoardState {
  const api = options.api ?? createHomeApi();
  const refreshEveryMs = options.refreshEveryMs ?? REFRESH_EVERY_MS;

  const [board, setBoard] = useState<TodayBoard | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const recargar = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (token === null) {
      setBoard(null);
      return undefined;
    }

    let vivo = true;
    setCargando(true);

    const pedir = async () => {
      const resultado = await api.board(token);
      if (!vivo) return;
      setCargando(false);
      if (resultado === null) {
        // No se distingue "sesión caducada" de "red caída" a propósito: el portal no debe
        // inventar un diagnóstico que no tiene. El mensaje invita a reintentar.
        setError("No se pudo cargar el tablero. Comprueba tu conexión e inténtalo de nuevo.");
        return;
      }
      setError(null);
      setBoard(resultado);
    };

    void pedir();
    const temporizador = setInterval(() => void pedir(), refreshEveryMs);

    return () => {
      vivo = false;
      clearInterval(temporizador);
    };
  }, [api, token, refreshEveryMs, nonce]);

  return { board, cargando, error, recargar };
}

/**
 * Reloj de la interfaz: devuelve el instante actual y lo actualiza cada `everyMs`.
 * Es lo que hace que «Esperando: 18 min» pase a «19 min» sin recargar.
 */
export function useTicker(everyMs: number = TICK_EVERY_MS): number {
  const [ahora, setAhora] = useState(() => Date.now());
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    const temporizador = setInterval(() => {
      if (montado.current) setAhora(Date.now());
    }, everyMs);
    return () => {
      montado.current = false;
      clearInterval(temporizador);
    };
  }, [everyMs]);

  return ahora;
}
