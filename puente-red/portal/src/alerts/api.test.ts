/**
 * PR-012 · Pruebas del cliente del centro de alertas.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createAlertsApi, type FetchLike } from "./api.ts";

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

const PAGINA = {
  rows: [
    {
      caseToken: "PJ-047",
      category: "MEDIO",
      youthLevel: "ROJO",
      reason: "HIGH_WAITING",
      reasons: ["HIGH_WAITING", "UNASSIGNED"],
      motiveKey: "motive.seguridad_prioritaria",
      patternKeys: ["pattern.esperando_sin_acuse"],
      waitingSinceEpochMillis: 1_700_000_000_000,
      waitingMillis: 2_400_000,
      assigneeId: null,
      assigneeName: null,
      state: "EN_COLA",
      slaBreached: true,
      outOfHours: false,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  filter: "ALL",
  search: null,
  counts: { ALL: 1, RED: 1, YELLOW: 0, UNASSIGNED: 1, IN_FOLLOWUP: 0, REFERRED: 0 },
  generatedAtEpochMillis: 1_700_002_400_000,
  outOfHours: false,
  demoData: true,
};

// ---------------------------------------------------------------------------
// Frontera
// ---------------------------------------------------------------------------
test('criterio 12: el cliente solo construye rutas /profesional', async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(PAGINA));
  const api = createAlertsApi({ fetchImpl });

  await api.page("tok");
  await api.takeCase("tok", "PJ-047");

  for (const llamada of llamadas) {
    assert.ok(llamada.url.startsWith("/profesional/"), llamada.url);
    assert.ok(!llamada.url.includes("/joven"));
  }
});

test("el token viaja en la cabecera", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(PAGINA));
  await createAlertsApi({ fetchImpl }).page("token-abc");

  const cabeceras = llamadas[0]?.init?.headers as Record<string, string> | undefined;
  assert.equal(cabeceras?.["authorization"], "Bearer token-abc");
});

// ---------------------------------------------------------------------------
// Filtros y paginación: los aplica el SERVIDOR
// ---------------------------------------------------------------------------
test("el filtro se manda al servidor, no se filtra en memoria", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(PAGINA));
  await createAlertsApi({ fetchImpl }).page("tok", { filter: "UNASSIGNED" });

  assert.equal(llamadas[0]?.url, "/profesional/alertas?filtro=UNASSIGNED");
});

test("búsqueda y paginación viajan como query", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(PAGINA));
  await createAlertsApi({ fetchImpl }).page("tok", {
    filter: "RED",
    search: "PJ-0",
    page: 2,
    pageSize: 10,
  });

  const url = String(llamadas[0]?.url);
  assert.ok(url.includes("filtro=RED"));
  assert.ok(url.includes("busqueda=PJ-0"));
  assert.ok(url.includes("pagina=2"));
  assert.ok(url.includes("tamano=10"));
});

test("sin filtros no se añade query", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(PAGINA));
  await createAlertsApi({ fetchImpl }).page("tok");
  assert.equal(llamadas[0]?.url, "/profesional/alertas");
});

// ---------------------------------------------------------------------------
// Parseo
// ---------------------------------------------------------------------------
test("parsea las filas conservando los dos ejes separados", async () => {
  const { fetchImpl } = fakeFetch(json(PAGINA));
  const page = await createAlertsApi({ fetchImpl }).page("tok");

  const fila = page?.rows[0];
  assert.equal(fila?.caseToken, "PJ-047");
  assert.equal(fila?.youthLevel, "ROJO", "nivel de reglas del APK");
  assert.equal(fila?.category, "MEDIO", "categoría del LLM");
  assert.equal(fila?.slaBreached, true);
  assert.deepEqual(fila?.patternKeys, ["pattern.esperando_sin_acuse"]);
});

test("parsea los contadores por filtro", async () => {
  const { fetchImpl } = fakeFetch(json(PAGINA));
  const page = await createAlertsApi({ fetchImpl }).page("tok");

  assert.equal(page?.counts["RED"], 1);
  assert.equal(page?.counts["YELLOW"], 0);
  assert.equal(page?.total, 1);
  assert.equal(page?.demoData, true);
});

test("una fila malformada se descarta sin romper la página", async () => {
  const { fetchImpl } = fakeFetch(json({ ...PAGINA, rows: [{ sinToken: 1 }, PAGINA.rows[0], null] }));
  const page = await createAlertsApi({ fetchImpl }).page("tok");

  assert.equal(page?.rows.length, 1);
  assert.equal(page?.rows[0]?.caseToken, "PJ-047");
});

test("valores ausentes no producen NaN ni undefined", async () => {
  const { fetchImpl } = fakeFetch(json({ rows: [{ caseToken: "C" }] }));
  const page = await createAlertsApi({ fetchImpl }).page("tok");

  const fila = page?.rows[0];
  assert.equal(fila?.waitingMillis, 0);
  assert.equal(fila?.slaBreached, false);
  assert.equal(fila?.category, null);
  assert.equal(fila?.assigneeName, null);
  assert.deepEqual(fila?.reasons, []);
  assert.equal(page?.page, 1);
});

test("una respuesta rechazada devuelve null", async () => {
  const { fetchImpl } = fakeFetch(json({ error: "unauthorized" }, 401));
  assert.equal(await createAlertsApi({ fetchImpl }).page("malo"), null);
});

test("un fallo de red devuelve null sin romper", async () => {
  const { fetchImpl } = fakeFetch(() => Promise.reject(new Error("sin red")));
  assert.equal(await createAlertsApi({ fetchImpl }).page("tok"), null);
});

// ---------------------------------------------------------------------------
// Tomar caso
// ---------------------------------------------------------------------------
test("tomar caso hace POST a la ruta del caso", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json({ caseToken: "PJ-047", estado: "ACEPTADO" }));
  const resultado = await createAlertsApi({ fetchImpl }).takeCase("tok", "PJ-047");

  assert.equal(llamadas[0]?.url, "/profesional/casos/PJ-047/tomar");
  assert.equal(llamadas[0]?.init?.method, "POST");
  assert.equal(resultado.ok, true);
  assert.equal(resultado.ok === true ? resultado.estado : null, "ACEPTADO");
});

test("tomar caso codifica el identificador en la ruta", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json({ estado: "ACEPTADO" }));
  await createAlertsApi({ fetchImpl }).takeCase("tok", "PJ 047/../x");
  assert.equal(llamadas[0]?.url, "/profesional/casos/PJ%20047%2F..%2Fx/tomar");
});

test("un rechazo al tomar devuelve el motivo del servidor", async () => {
  const { fetchImpl } = fakeFetch(json({ error: "no_se_pudo_tomar", reason: "DEMO_READ_ONLY" }, 403));
  const resultado = await createAlertsApi({ fetchImpl }).takeCase("tok", "PJ-047");

  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false ? resultado.status : null, 403);
  assert.equal(resultado.ok === false ? resultado.reason : null, "DEMO_READ_ONLY");
});

test("un fallo de red al tomar no rompe", async () => {
  const { fetchImpl } = fakeFetch(() => Promise.reject(new Error("sin red")));
  const resultado = await createAlertsApi({ fetchImpl }).takeCase("tok", "PJ-047");
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false ? resultado.status : null, 0);
});
