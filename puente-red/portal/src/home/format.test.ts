/**
 * PR-011 · Pruebas del formateo. Lógica pura: sin React, sin navegador.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { etiquetaCategoria, formatWaiting, waitingAt } from "./format.ts";

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

test("waitingAt calcula lo transcurrido y nunca es negativo", () => {
  assert.equal(waitingAt(0, 10 * MINUTO), 10 * MINUTO);
  assert.equal(waitingAt(1_000, 0), 0, "un reloj que retrocede no da negativo");
});

test("formatWaiting usa unidades humanas", () => {
  assert.equal(formatWaiting(0), "ahora");
  assert.equal(formatWaiting(30_000), "ahora", "menos de un minuto es «ahora»");
  assert.equal(formatWaiting(18 * MINUTO), "18 min");
  assert.equal(formatWaiting(59 * MINUTO), "59 min");
  assert.equal(formatWaiting(HORA), "1 h");
  assert.equal(formatWaiting(HORA + 24 * MINUTO), "1 h 24 min");
  assert.equal(formatWaiting(23 * HORA + 59 * MINUTO), "23 h 59 min");
  assert.equal(formatWaiting(24 * HORA), "1 d");
  assert.equal(formatWaiting(2 * 24 * HORA + 3 * HORA), "2 d 3 h");
});

test("formatWaiting tolera valores absurdos sin romper", () => {
  assert.equal(formatWaiting(Number.NaN), "ahora");
  assert.equal(formatWaiting(-5), "ahora");
});

test("el tiempo esperando se puede recalcular sin volver a pedir el tablero", () => {
  // El caso llegó hace 40 min; el tablero se leyó hace 5 min.
  const recibido = 0;
  const leido = 40 * MINUTO;
  const ahora = leido + 5 * MINUTO;

  // Lo que hace el portal: parte del tiempo que ya venía y le suma lo transcurrido.
  const venia = waitingAt(recibido, leido);
  const mostrado = venia + (ahora - leido);

  assert.equal(formatWaiting(venia), "40 min");
  assert.equal(formatWaiting(mostrado), "45 min");
  assert.equal(mostrado, waitingAt(recibido, ahora));
});

test("etiquetaCategoria no inventa vocabulario", () => {
  assert.equal(etiquetaCategoria("ALTO"), "ALTO");
  assert.equal(etiquetaCategoria("MEDIO"), "MEDIO");
  assert.equal(etiquetaCategoria(null), "SIN CLASIFICAR");
  assert.equal(etiquetaCategoria("OTRA"), "SIN CLASIFICAR");
});
