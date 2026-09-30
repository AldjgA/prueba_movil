/**
 * PR-013 · Pruebas del cliente de la ficha.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createCaseApi, type FetchLike } from "./api.ts";

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
  new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });

const FICHA = {
  caseToken: "PJ-032",
  categoria: "MEDIO",
  youthLevel: "AMARILLO",
  estado: "EN_COLA",
  registradoEnEpochMillis: 1_700_000_000_000,
  esperandoMillis: 2_400_000,
  slaBreached: false,
  outOfHours: false,
  responsableId: null,
  responsableNombre: null,
  consentimiento: "AUTORIZADO",
  encuadreKey: "ficha.encuadre.prioridad_preliminar",
  secciones: [
    {
      seccion: "MOTIVO",
      orden: 1,
      tituloKey: "ficha.seccion.motivo",
      disponible: true,
      motivoNoDisponibleKey: null,
      claveItems: ["aislamiento_persistente"],
      eventos: [],
      noAutorizadoKeys: [],
    },
    {
      seccion: "EVOLUCION",
      orden: 2,
      tituloKey: "ficha.seccion.evolucion",
      disponible: false,
      motivoNoDisponibleKey: "ficha.no_disponible.caracteristicas",
      claveItems: [],
      eventos: [],
      noAutorizadoKeys: [],
    },
    {
      seccion: "RESUMEN_AUTORIZADO",
      orden: 6,
      tituloKey: "ficha.seccion.resumen_autorizado",
      disponible: true,
      motivoNoDisponibleKey: null,
      claveItems: ["situacion"],
      eventos: [],
      noAutorizadoKeys: ["scope.conversacion_completa", "scope.notas_internas"],
    },
    {
      seccion: "HISTORIAL",
      orden: 7,
      tituloKey: "ficha.seccion.historial",
      disponible: true,
      motivoNoDisponibleKey: null,
      claveItems: [],
      eventos: [{ tipo: "RECIBIDO", at: "2026-09-30T04:00:00.000Z", actorKind: "SYSTEM" }],
      noAutorizadoKeys: [],
    },
  ],
  puedeTomarse: true,
  generadoEnEpochMillis: 1_700_002_400_000,
};

test('criterio 12: el cliente solo construye rutas /profesional', async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(FICHA));
  await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");

  assert.equal(llamadas[0]?.url, "/profesional/casos/PJ-032");
  assert.ok(!String(llamadas[0]?.url).includes("/joven"));
});

test("el token viaja en la cabecera", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(FICHA));
  await createCaseApi({ fetchImpl }).ficha("token-abc", "PJ-032");

  const cabeceras = llamadas[0]?.init?.headers as Record<string, string> | undefined;
  assert.equal(cabeceras?.["authorization"], "Bearer token-abc");
});

test("codifica el identificador en la ruta", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json(FICHA));
  await createCaseApi({ fetchImpl }).ficha("tok", "PJ 032/x");
  assert.equal(llamadas[0]?.url, "/profesional/casos/PJ%20032%2Fx");
});

test("parsea la ficha y conserva el orden de las secciones que manda el servidor", async () => {
  const { fetchImpl } = fakeFetch(json(FICHA));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");

  assert.notEqual(ficha, null);
  assert.deepEqual(ficha?.secciones.map((s) => s.seccion), [
    "MOTIVO",
    "EVOLUCION",
    "RESUMEN_AUTORIZADO",
    "HISTORIAL",
  ]);
  assert.equal(ficha?.secciones[0]?.orden, 1);
  assert.deepEqual(ficha?.secciones[0]?.claveItems, ["aislamiento_persistente"]);
});

test("parsea los dos ejes separados y el encuadre", async () => {
  const { fetchImpl } = fakeFetch(json(FICHA));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");

  assert.equal(ficha?.youthLevel, "AMARILLO");
  assert.equal(ficha?.categoria, "MEDIO");
  assert.equal(ficha?.encuadreKey, "ficha.encuadre.prioridad_preliminar");
});

test("una sección no disponible conserva su motivo", async () => {
  const { fetchImpl } = fakeFetch(json(FICHA));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");

  const evolucion = ficha?.secciones.find((s) => s.seccion === "EVOLUCION");
  assert.equal(evolucion?.disponible, false);
  assert.equal(evolucion?.motivoNoDisponibleKey, "ficha.no_disponible.caracteristicas");
});

test("lo no autorizado se parsea y NO se descarta", async () => {
  const { fetchImpl } = fakeFetch(json(FICHA));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");

  const resumen = ficha?.secciones.find((s) => s.seccion === "RESUMEN_AUTORIZADO");
  assert.deepEqual(resumen?.noAutorizadoKeys, [
    "scope.conversacion_completa",
    "scope.notas_internas",
  ]);
});

test("parsea los eventos del historial", async () => {
  const { fetchImpl } = fakeFetch(json(FICHA));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");

  const historial = ficha?.secciones.find((s) => s.seccion === "HISTORIAL");
  assert.equal(historial?.eventos.length, 1);
  assert.equal(historial?.eventos[0]?.tipo, "RECIBIDO");
  assert.equal(historial?.eventos[0]?.actorKind, "SYSTEM");
});

test("un consentimiento desconocido se trata como NO_CONSTA", async () => {
  const { fetchImpl } = fakeFetch(json({ ...FICHA, consentimiento: "LO_QUE_SEA" }));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");
  assert.equal(ficha?.consentimiento, "NO_CONSTA");
});

test("una sección malformada se descarta sin romper la ficha", async () => {
  const { fetchImpl } = fakeFetch(json({ ...FICHA, secciones: [{ sinSeccion: 1 }, ...FICHA.secciones, null] }));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032");
  assert.equal(ficha?.secciones.length, 4);
});

test("valores ausentes no producen NaN ni undefined", async () => {
  const { fetchImpl } = fakeFetch(json({ caseToken: "C" }));
  const ficha = await createCaseApi({ fetchImpl }).ficha("tok", "C");

  assert.equal(ficha?.esperandoMillis, 0);
  assert.equal(ficha?.categoria, null);
  assert.equal(ficha?.consentimiento, "NO_CONSTA");
  assert.equal(ficha?.puedeTomarse, false);
  assert.deepEqual(ficha?.secciones, []);
});

test("una ficha rechazada devuelve null", async () => {
  const { fetchImpl } = fakeFetch(json({ error: "caso_no_encontrado" }, 404));
  assert.equal(await createCaseApi({ fetchImpl }).ficha("tok", "NO-EXISTE"), null);
});

test("un fallo de red devuelve null sin romper", async () => {
  const { fetchImpl } = fakeFetch(() => Promise.reject(new Error("sin red")));
  assert.equal(await createCaseApi({ fetchImpl }).ficha("tok", "PJ-032"), null);
});
