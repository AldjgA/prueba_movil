/**
 * PR-010 · Cierre de sesión por inactividad.
 *
 * El servidor ya expira la sesión por inactividad (`core/auth/session.ts`, 30 min). Esto es
 * la **contrapartida en el cliente**, y no es redundante: sin ella, el profesional vería una
 * pantalla con datos de un caso hasta que la siguiente petición fallara. En un centro
 * comunitario con un portátil desatendido, esa diferencia importa.
 *
 * La **decisión** es pura (`remainingMs`) y el **temporizador** está inyectado, así que se
 * puede probar sin esperar en tiempo real.
 */

export interface Scheduler {
  setInterval(handler: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

export const browserScheduler: Scheduler = {
  setInterval: (handler, ms) => globalThis.setInterval(handler, ms),
  clearInterval: (handle) => {
    globalThis.clearInterval(handle as ReturnType<typeof setInterval>);
  },
};

/** Milisegundos que faltan para considerarse inactivo. Nunca negativo. */
export function remainingMs(
  lastActivityMs: number,
  nowMs: number,
  timeoutMs: number,
): number {
  return Math.max(0, timeoutMs - (nowMs - lastActivityMs));
}

export function isIdle(lastActivityMs: number, nowMs: number, timeoutMs: number): boolean {
  return remainingMs(lastActivityMs, nowMs, timeoutMs) === 0;
}

export interface IdleWatcherOptions {
  readonly timeoutMs: number;
  readonly onIdle: () => void;
  readonly now?: () => number;
  /** Cada cuánto se comprueba. No hace falta precisión de milisegundos. */
  readonly checkEveryMs?: number;
  readonly scheduler?: Scheduler;
}

export interface IdleWatcher {
  /** Marca actividad del usuario. */
  activity(): void;
  start(): void;
  stop(): void;
  remainingMs(): number;
}

export const DEFAULT_CHECK_EVERY_MS = 15_000;

export function createIdleWatcher(options: IdleWatcherOptions): IdleWatcher {
  const now = options.now ?? (() => Date.now());
  const scheduler = options.scheduler ?? browserScheduler;
  const checkEveryMs = options.checkEveryMs ?? DEFAULT_CHECK_EVERY_MS;

  let lastActivity = now();
  let handle: unknown = null;
  let fired = false;

  const stop = (): void => {
    if (handle !== null) {
      scheduler.clearInterval(handle);
      handle = null;
    }
  };

  const tick = (): void => {
    if (fired) return;
    if (isIdle(lastActivity, now(), options.timeoutMs)) {
      // Se dispara **una sola vez**: un cierre de sesión repetido no aporta nada.
      fired = true;
      stop();
      options.onIdle();
    }
  };

  return {
    activity(): void {
      lastActivity = now();
      fired = false;
    },
    start(): void {
      stop();
      lastActivity = now();
      fired = false;
      handle = scheduler.setInterval(tick, checkEveryMs);
    },
    stop,
    remainingMs(): number {
      return remainingMs(lastActivity, now(), options.timeoutMs);
    },
  };
}

/** Eventos que cuentan como actividad. Deliberadamente **no** incluye `mousemove`: */
/** el ratón sobre una ventana desatendida no significa que haya alguien. */
export const ACTIVITY_EVENTS = ["keydown", "pointerdown", "focus"] as const;
