/**
 * PR-010 · Pruebas del cierre por inactividad.
 *
 * El temporizador está **inyectado**, así que no se espera en tiempo real.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createIdleWatcher, isIdle, remainingMs, type Scheduler } from "./idle.ts";

const MINUTO = 60_000;
const TIMEOUT = 30 * MINUTO;

/** Reloj y temporizador controlables: la prueba no depende del tiempo real. */
function makeEntorno(inicio = 1_700_000_000_000) {
  let ahora = inicio;
  let tick: (() => void) | null = null;
  let intervalo: number | null = null;

  const scheduler: Scheduler = {
    setInterval: (handler, ms) => {
      tick = handler;
      intervalo = ms;
      return 1;
    },
    clearInterval: () => {
      tick = null;
    },
  };

  return {
    now: () => ahora,
    avanzar: (ms: number) => {
      ahora += ms;
    },
    scheduler,
    /** Dispara una comprobación del vigilante. */
    disparar: () => tick?.(),
    intervalo: () => intervalo,
    hayTimer: () => tick !== null,
  };
}

// ---------------------------------------------------------------------------
// Lógica pura
// ---------------------------------------------------------------------------
test("remainingMs descuenta el tiempo transcurrido y nunca es negativo", () => {
  assert.equal(remainingMs(0, 0, TIMEOUT), TIMEOUT);
  assert.equal(remainingMs(0, 10 * MINUTO, TIMEOUT), 20 * MINUTO);
  assert.equal(remainingMs(0, 40 * MINUTO, TIMEOUT), 0);
});

test("isIdle solo cuando se agota el plazo", () => {
  assert.equal(isIdle(0, TIMEOUT - 1, TIMEOUT), false);
  assert.equal(isIdle(0, TIMEOUT, TIMEOUT), true);
});

// ---------------------------------------------------------------------------
// Vigilante
// ---------------------------------------------------------------------------
test("no cierra antes de tiempo", () => {
  const entorno = makeEntorno();
  let cerro = false;

  const watcher = createIdleWatcher({
    timeoutMs: TIMEOUT,
    now: entorno.now,
    scheduler: entorno.scheduler,
    onIdle: () => {
      cerro = true;
    },
  });
  watcher.start();

  entorno.avanzar(29 * MINUTO);
  entorno.disparar();

  assert.equal(cerro, false);
  assert.equal(watcher.remainingMs(), MINUTO);
});

test("cierra al agotarse el plazo de inactividad", () => {
  const entorno = makeEntorno();
  let cerro = false;

  const watcher = createIdleWatcher({
    timeoutMs: TIMEOUT,
    now: entorno.now,
    scheduler: entorno.scheduler,
    onIdle: () => {
      cerro = true;
    },
  });
  watcher.start();

  entorno.avanzar(31 * MINUTO);
  entorno.disparar();

  assert.equal(cerro, true);
});

test("la actividad reinicia el reloj", () => {
  const entorno = makeEntorno();
  let cerro = false;

  const watcher = createIdleWatcher({
    timeoutMs: TIMEOUT,
    now: entorno.now,
    scheduler: entorno.scheduler,
    onIdle: () => {
      cerro = true;
    },
  });
  watcher.start();

  entorno.avanzar(29 * MINUTO);
  watcher.activity();
  entorno.avanzar(29 * MINUTO);
  entorno.disparar();

  assert.equal(cerro, false, "la actividad debe haber reiniciado el reloj");
});

test("onIdle se dispara UNA sola vez", () => {
  const entorno = makeEntorno();
  let veces = 0;

  const watcher = createIdleWatcher({
    timeoutMs: TIMEOUT,
    now: entorno.now,
    scheduler: entorno.scheduler,
    onIdle: () => {
      veces += 1;
    },
  });
  watcher.start();

  entorno.avanzar(31 * MINUTO);
  entorno.disparar();
  entorno.disparar();
  entorno.disparar();

  assert.equal(veces, 1, "un cierre repetido no aporta nada");
});

test("stop cancela el temporizador", () => {
  const entorno = makeEntorno();
  let cerro = false;

  const watcher = createIdleWatcher({
    timeoutMs: TIMEOUT,
    now: entorno.now,
    scheduler: entorno.scheduler,
    onIdle: () => {
      cerro = true;
    },
  });
  watcher.start();
  assert.equal(entorno.hayTimer(), true);

  watcher.stop();
  assert.equal(entorno.hayTimer(), false);

  entorno.avanzar(60 * MINUTO);
  entorno.disparar();
  assert.equal(cerro, false);
});

test("comprueba periódicamente, no en cada milisegundo", () => {
  const entorno = makeEntorno();
  createIdleWatcher({
    timeoutMs: TIMEOUT,
    now: entorno.now,
    scheduler: entorno.scheduler,
    onIdle: () => {},
    checkEveryMs: 15_000,
  }).start();

  assert.equal(entorno.intervalo(), 15_000);
});
