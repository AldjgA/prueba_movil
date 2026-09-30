/**
 * PR-010 · Cliente de la API Profesional.
 *
 * **Regla de la frontera (`PR-020` criterio 12):** el portal habla **solo** con
 * `/profesional/**`. Nunca con `/joven/**`. Este módulo es el **único** sitio del portal que
 * construye rutas de API, así que esa regla se puede auditar leyendo un archivo.
 *
 * **La matriz de autorización no se replica aquí.** El servidor devuelve
 * `accionesPermitidas` en `/profesional/session`, y el portal se limita a leerla. Duplicar la
 * matriz en el cliente crearía dos fuentes de verdad que se desincronizarían.
 */

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Vista de la sesión tal como la devuelve el servidor. */
export interface SessionView {
  readonly rol: string;
  readonly institucion: string;
  readonly esDemo: boolean;
  readonly emitidaEn: string;
  readonly expiraEn: string;
  readonly accionesPermitidas: readonly string[];
}

export interface LoginSuccess {
  readonly ok: true;
  readonly token: string;
  readonly rol: string;
  readonly institucion: string;
  readonly esDemo: boolean;
  readonly expiraEn: string;
}

export interface LoginFailure {
  readonly ok: false;
  readonly status: number;
  /** Mensaje **del servidor**. Nunca se compone aquí un mensaje distinto. */
  readonly message: string;
  /** Clave de catálogo del motivo, para diagnóstico. */
  readonly reason: string | null;
}

export type LoginResult = LoginSuccess | LoginFailure;

export interface PortalApi {
  login(email: string, password: string): Promise<LoginResult>;
  session(token: string): Promise<SessionView | null>;
  logout(token: string): Promise<void>;
}

export interface PortalApiOptions {
  /** Base de la API. Vacío = mismo origen (el proxy de Vite en desarrollo). */
  readonly baseUrl?: string;
  readonly fetchImpl?: FetchLike;
}

/** Mensaje de respaldo si el servidor no devuelve uno. **Genérico a propósito.** */
const FALLBACK_MESSAGE = "No se pudo iniciar sesión.";

export function createPortalApi(options: PortalApiOptions = {}): PortalApi {
  const baseUrl = options.baseUrl ?? "";
  const doFetch: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));

  const url = (path: string): string => `${baseUrl}/profesional${path}`;

  return {
    async login(email: string, password: string): Promise<LoginResult> {
      let respuesta: Response;
      try {
        respuesta = await doFetch(url("/auth/login"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        // Fallo de red: el portal **no** inventa un mensaje de credenciales.
        return { ok: false, status: 0, message: "No hay conexión con el servidor.", reason: null };
      }

      const cuerpo = await leerJson(respuesta);
      if (!respuesta.ok) {
        return {
          ok: false,
          status: respuesta.status,
          message: textoDe(cuerpo, "message") ?? FALLBACK_MESSAGE,
          reason: textoDe(cuerpo, "reason"),
        };
      }

      const token = textoDe(cuerpo, "token");
      const expiraEn = textoDe(cuerpo, "expiraEn");
      if (token === null || expiraEn === null) {
        return { ok: false, status: respuesta.status, message: FALLBACK_MESSAGE, reason: null };
      }

      return {
        ok: true,
        token,
        expiraEn,
        rol: textoDe(cuerpo, "rol") ?? "",
        institucion: textoDe(cuerpo, "institucion") ?? "",
        esDemo: cuerpo?.["esDemo"] === true,
      };
    },

    async session(token: string): Promise<SessionView | null> {
      let respuesta: Response;
      try {
        respuesta = await doFetch(url("/session"), {
          headers: { authorization: `Bearer ${token}` },
        });
      } catch {
        return null;
      }
      if (!respuesta.ok) return null;

      const cuerpo = await leerJson(respuesta);
      const rol = textoDe(cuerpo, "rol");
      if (rol === null) return null;

      return {
        rol,
        institucion: textoDe(cuerpo, "institucion") ?? "",
        esDemo: cuerpo?.["esDemo"] === true,
        emitidaEn: textoDe(cuerpo, "emitidaEn") ?? "",
        expiraEn: textoDe(cuerpo, "expiraEn") ?? "",
        accionesPermitidas: listaDeTexto(cuerpo?.["accionesPermitidas"]),
      };
    },

    async logout(token: string): Promise<void> {
      try {
        await doFetch(url("/auth/logout"), {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        });
      } catch {
        // Cerrar sesión en el cliente no debe fallar por red: el token se descarta igual.
      }
    },
  };
}

async function leerJson(respuesta: Response): Promise<Record<string, unknown> | null> {
  try {
    const cuerpo: unknown = await respuesta.json();
    return cuerpo !== null && typeof cuerpo === "object" && !Array.isArray(cuerpo)
      ? (cuerpo as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function textoDe(cuerpo: Record<string, unknown> | null, clave: string): string | null {
  const valor = cuerpo?.[clave];
  return typeof valor === "string" ? valor : null;
}

function listaDeTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === "string") : [];
}
