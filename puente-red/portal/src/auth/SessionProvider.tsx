/**
 * PR-010 · Estado de sesión del portal.
 *
 * ## Dónde vive el token
 *
 * **En memoria, y solo en memoria.** No en `localStorage` ni en `sessionStorage`.
 *
 * Motivo: el portal maneja datos de menores en riesgo, y un token accesible desde el
 * almacenamiento del navegador es accesible para cualquier XSS. El coste es que **recargar
 * la página cierra la sesión** — aceptable, porque la sesión ya tiene 8 h de vida máxima y
 * 30 min de inactividad, y el login es rápido.
 *
 * Si en el futuro se quiere persistir, `sessionStorage` (no `localStorage`) es la opción
 * menos mala, y es una **decisión** que hay que tomar, no un descuido.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createPortalApi, type PortalApi, type SessionView } from "./api.ts";
import { ACTIVITY_EVENTS, createIdleWatcher, type IdleWatcher } from "./idle.ts";

/** 30 minutos, el mismo valor que el servidor (`core/auth/session.ts`). */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export type SessionState = "anonimo" | "autenticando" | "autenticado";

export interface SessionContextValue {
  readonly estado: SessionState;
  readonly sesion: SessionView | null;
  readonly token: string | null;
  /** Mensaje del servidor. `null` si no hubo error. */
  readonly error: string | null;
  /** `true` si el cierre fue por inactividad (para poder decirlo con honestidad). */
  readonly cerradaPorInactividad: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  /** `true` si la sesión permite la acción, **según el servidor**. */
  puede(accion: string): boolean;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  readonly children: ReactNode;
  readonly api?: PortalApi;
  readonly idleTimeoutMs?: number;
}

export function SessionProvider({
  children,
  api,
  idleTimeoutMs = IDLE_TIMEOUT_MS,
}: SessionProviderProps) {
  const cliente = useMemo(() => api ?? createPortalApi(), [api]);

  const [estado, setEstado] = useState<SessionState>("anonimo");
  const [sesion, setSesion] = useState<SessionView | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cerradaPorInactividad, setCerradaPorInactividad] = useState(false);

  const watcherRef = useRef<IdleWatcher | null>(null);

  const limpiar = useCallback(() => {
    watcherRef.current?.stop();
    watcherRef.current = null;
    setToken(null);
    setSesion(null);
    setEstado("anonimo");
  }, []);

  const logout = useCallback(async () => {
    const actual = token;
    limpiar();
    setCerradaPorInactividad(false);
    if (actual !== null) {
      await cliente.logout(actual);
    }
  }, [cliente, limpiar, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setCerradaPorInactividad(false);
      setEstado("autenticando");

      const resultado = await cliente.login(email, password);
      if (!resultado.ok) {
        // El mensaje es **el del servidor**: el portal no compone uno distinto, para que el
        // criterio 2 (mensaje único) no se rompa en el cliente.
        setError(resultado.message);
        setEstado("anonimo");
        return;
      }

      const vista = await cliente.session(resultado.token);
      if (vista === null) {
        setError("La sesión no pudo verificarse. Inténtalo de nuevo.");
        setEstado("anonimo");
        return;
      }

      setToken(resultado.token);
      setSesion(vista);
      setEstado("autenticado");

      const watcher = createIdleWatcher({
        timeoutMs: idleTimeoutMs,
        onIdle: () => {
          setCerradaPorInactividad(true);
          setToken(null);
          setSesion(null);
          setEstado("anonimo");
        },
      });
      watcherRef.current = watcher;
      watcher.start();
    },
    [cliente, idleTimeoutMs],
  );

  // Actividad del usuario: reinicia el reloj de inactividad.
  useEffect(() => {
    if (estado !== "autenticado") return undefined;

    const alHaberActividad = (): void => {
      watcherRef.current?.activity();
    };
    for (const evento of ACTIVITY_EVENTS) {
      globalThis.addEventListener(evento, alHaberActividad);
    }
    return () => {
      for (const evento of ACTIVITY_EVENTS) {
        globalThis.removeEventListener(evento, alHaberActividad);
      }
    };
  }, [estado]);

  // Limpieza al desmontar.
  useEffect(() => () => watcherRef.current?.stop(), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      estado,
      sesion,
      token,
      error,
      cerradaPorInactividad,
      login,
      logout,
      puede: (accion: string) => sesion?.accionesPermitidas.includes(accion) ?? false,
    }),
    [estado, sesion, token, error, cerradaPorInactividad, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const valor = useContext(SessionContext);
  if (valor === null) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  }
  return valor;
}
