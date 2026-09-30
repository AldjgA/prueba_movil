/**
 * PR-011 · Pruebas del cliente del tablero.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createHomeApi, type FetchLike } from "./api.ts";

interface Llamada {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

function fakeFetch(respuesta: Response | (() => Promise<Response>)): {
  fetchImpl: FetchLike;
  llamadas: Llamada[];
} {
  const llamadas: Llamada[] = [];
  return {
    llamadas,
    fetchImpl: async (url, init) => {
      llamadas.push({ url, init });
      return typeof respuesta === "function" ? respuesta() : respuesta;
    },
  };
}

const json = (cuerpo: unknown, status = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });

const TABLERO = {
  cards: [
    {
      caseToken: "C-1",
      category: "ALTO",
      reason: "HIGH_WAITING",
      reasons: ["SLA_BREACHED", "HIGH_WAITING", "UNASSIGNED"],
      motiveKey: "motive.seguridad_prioritaria",
      patternKeys: ["pattern.sla_incumplido"],
      waitingSinceEpochMillis: 1_700_000_000_000,
      waitingMillis: 2_400_000,
      assigneeId: null,
      assigneeName: null,
      state: "EN_COLA",
      slaBreached: true,
      outOfHours: false,
    },
  ],
  waitingCount: 1,
  unassignedCount: 1,
  importantChangeCount: 0,
  generatedAtEpochMillis: 1_700_002_400_000,
  outOfHours: false,
  demoData: true,
};

test("criterio 12: el cliente solo construye rutas /profesional", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(TABLERO));
  await createHomeApi({ fetchImpl }).board("tok");

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0]?.url, "/profesional/home");
  assert.ok(!String(llamadas[0]?.url).includes("/joven"));
});

test("el token viaja en la cabecera", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(TABLERO));
  await createHomeApi({ fetchImpl }).board("token-abc");

  const cabeceras = llamadas[0]?.init?.headers as Record<string, string> | undefined;
  assert.equal(cabeceras?.["authorization"], "Bearer token-abc");
});

test("parsea el tablero y conserva el orden que manda el servidor", async () => {
  const { fetchImpl } = fakeFetch(json(TABLERO));
  const board = await createHomeApi({ fetchImpl }).board("tok");

  assert.notEqual(board, null);
  assert.equal(board?.cards.length, 1);
  assert.equal(board?.cards[0]?.reason, "HIGH_WAITING");
  assert.deepEqual(board?.cards[0]?.reasons, ["SLA_BREACHED", "HIGH_WAITING", "UNASSIGNED"]);
  assert.equal(board?.demoData, true, "el portal debe saber que son datos ficticios");
  assert.equal(board?.unassignedCount, 1);
});

test("el portal NO reordena: respeta el orden recibido", async () => {
  const desordenado = {
    ...TABLERO,
    cards: [
      { ...TABLERO.cards[0], caseToken: "C-PRIMERO" },
      { ...TABLERO.cards[0], caseToken: "C-SEGUNDO" },
      { ...TABLERO.cards[0], caseToken: "C-TERCERO" },
    ],
  };
  const { fetchImpl } = fakeFetch(json(desordenado));
  const board = await createHomeApi({ fetchImpl }).board("tok");

  assert.deepEqual(
    board?.cards.map((c) => c.caseToken),
    ["C-PRIMERO", "C-SEGUNDO", "C-TERCERO"],
  );
});

test("un tablero vacío se parsea correctamente", async () => {
  const { fetchImpl } = fakeFetch(
    json({ cards: [], waitingCount: 0, unassignedCount: 0, importantChangeCount: 0, generatedAtEpochMillis: 1, outOfHours: false, demoData: false }),
  );
  const board = await createHomeApi({ fetchImpl }).board("tok");

  assert.deepEqual(board?.cards, []);
  assert.equal(board?.waitingCount, 0);
});

test("una respuesta rechazada devuelve null (sesión caducada)", async () => {
  const { fetchImpl } = fakeFetch(json({ error: "unauthorized" }, 401));
  assert.equal(await createHomeApi({ fetchImpl }).board("malo"), null);
});

test("un fallo de red devuelve null sin romper", async () => {
  const { fetchImpl } = fakeFetch(() => Promise.reject(new Error("sin red")));
  assert.equal(await createHomeApi({ fetchImpl }).board("tok"), null);
});

test("una tarjeta malformada se descarta, no rompe el tablero", async () => {
  const { fetchImpl } = fakeFetch(
    json({ ...TABLERO, cards: [{ sinToken: true }, TABLERO.cards[0], null, 42] }),
  );
  const board = await createHomeApi({ fetchImpl }).board("tok");

  assert.equal(board?.cards.length, 1);
  assert.equal(board?.cards[0]?.caseToken, "C-1");
});

test("valores ausentes no producen NaN", async () => {
  const { fetchImpl } = fakeFetch(json({ cards: [{ caseToken: "C" }] }));
  const board = await createHomeApi({ fetchImpl }).board("tok");

  const card = board?.cards[0];
  assert.equal(card?.waitingMillis, 0);
  assert.equal(card?.slaBreached, false);
  assert.equal(card?.category, null);
  assert.deepEqual(card?.patternKeys, []);
});
