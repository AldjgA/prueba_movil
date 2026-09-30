/**
 * PR-012 · Pruebas de los criterios de aceptación 1 a 7.
 * (El criterio 8, «tomar caso», se prueba en la cola y en la superficie HTTP.)
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Directory, DEMO_SEED } from "../../directory/index.ts";
import { CaseQueue, SYSTEM_ACTOR, humanActor } from "../../queue/index.ts";
import { buildTodayBoard } from "../../home/todayBoard.ts";
import { ALERT_FILTERS, ALERT_PREDICATES, buildAlertPage } from "../alerts.ts";

const START = 1_700_000_000_000;
const MINUTO = 60_000;

function makeReloj(inicio = START) {
  let ahora = inicio;
  return {
    clock: { nowEpochMillis: () => ahora },
    avanzar: (ms: number) => {
      ahora += ms;
    },
    ahora: () => ahora,
  };
}

function makeEntorno() {
  const reloj = makeReloj();
  const directory = new Directory({ clock: reloj.clock });
  for (const perfil of DEMO_SEED) {
    directory.upsert(perfil as unknown as Record<string, unknown>, null);
  }
  const queue = new CaseQueue({ directory, clock: reloj.clock });
  return { queue, directory, reloj };
}

interface CasoSpec {
  readonly token: string;
  readonly origen: "VERDE" | "AMARILLO" | "ROJO";
  readonly categoria: "MEDIO" | "ALTO";
  readonly minutosAtras: number;
  readonly asignarA?: string;
}

function sembrar(entorno: ReturnType<typeof makeEntorno>, specs: readonly CasoSpec[]): void {
  for (const spec of specs) {
    entorno.queue.enqueue(
      {
        caseToken: spec.token,
        originLevel: spec.origen,
        rulesetVersion: "r1",
        category: null,
        receivedAtEpochMillis: START - spec.minutosAtras * MINUTO,
      },
      `k-${spec.token}`,
    );
    entorno.queue.markClassified(spec.token, spec.categoria);
    entorno.queue.enqueueForRouting(spec.token);
    if (spec.asignarA !== undefined) {
      entorno.queue.assign(spec.token, spec.asignarA, SYSTEM_ACTOR);
    }
  }
}

const pagina = (
  entorno: ReturnType<typeof makeEntorno>,
  extra: Partial<Parameters<typeof buildAlertPage>[0]> = {},
) =>
  buildAlertPage({
    queue: entorno.queue,
    directory: entorno.directory,
    nowEpochMillis: entorno.reloj.ahora(),
    outOfHours: false,
    ...extra,
  });

const PSICOLOGA = DEMO_SEED[0]?.id ?? "demo-psicologa-trauma";

// ---------------------------------------------------------------------------
// Criterio 1 — los seis filtros del brief §23
// ---------------------------------------------------------------------------
test("criterio 1: existen los seis filtros del brief §23", () => {
  assert.deepEqual([...ALERT_FILTERS], [
    "ALL",
    "RED",
    "YELLOW",
    "UNASSIGNED",
    "IN_FOLLOWUP",
    "REFERRED",
  ]);
  assert.deepEqual(Object.keys(ALERT_PREDICATES).sort(), [...ALERT_FILTERS].sort());
});

test("criterio 1b: cada filtro devuelve un conjunto coherente", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-ROJO-SIN", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 },
    { token: "C-AMARILLO-ASIGNADO", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 200, asignarA: PSICOLOGA },
    { token: "C-AMARILLO-SIN", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
  ]);

  assert.equal(pagina(entorno, { filter: "ALL" }).total, 3);
  assert.equal(pagina(entorno, { filter: "RED" }).total, 1);
  assert.equal(pagina(entorno, { filter: "YELLOW" }).total, 2);
  assert.equal(pagina(entorno, { filter: "UNASSIGNED" }).total, 2);
  assert.equal(pagina(entorno, { filter: "IN_FOLLOWUP" }).total, 0, "ninguno está aceptado");
});

test("criterio 1c: IN_FOLLOWUP recoge los casos aceptados", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-ACEPTADO", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 100, asignarA: PSICOLOGA },
    { token: "C-EN-COLA", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
  ]);
  entorno.queue.accept("C-ACEPTADO", PSICOLOGA, humanActor(PSICOLOGA));

  const enSeguimiento = pagina(entorno, { filter: "IN_FOLLOWUP" });
  assert.deepEqual(enSeguimiento.rows.map((r) => r.caseToken), ["C-ACEPTADO"]);
});

test("criterio 1d: «Derivados» está vacío y es correcto (no hay estado DERIVADO)", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 }]);

  const derivados = pagina(entorno, { filter: "REFERRED" });
  assert.equal(derivados.total, 0);
  assert.equal(derivados.counts["REFERRED"], 0);
});

// ---------------------------------------------------------------------------
// Criterio 2 — «Rojo» filtra por nivel del joven, NO por categoría
// ---------------------------------------------------------------------------
test("criterio 2: el filtro RED usa youthLevel, no category", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    // ROJO para el joven, pero MEDIO operativamente (el LLM no lo subió).
    { token: "C-ROJO-MEDIO", origen: "ROJO", categoria: "MEDIO", minutosAtras: 40 },
    // AMARILLO para el joven, pero ALTO operativamente.
    { token: "C-AMARILLO-ALTO", origen: "AMARILLO", categoria: "ALTO", minutosAtras: 40 },
  ]);

  const rojos = pagina(entorno, { filter: "RED" });
  assert.deepEqual(rojos.rows.map((r) => r.caseToken), ["C-ROJO-MEDIO"]);

  const amarillos = pagina(entorno, { filter: "YELLOW" });
  assert.deepEqual(amarillos.rows.map((r) => r.caseToken), ["C-AMARILLO-ALTO"]);
});

test("criterio 2b: la fila lleva LOS DOS ejes, separados", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", origen: "ROJO", categoria: "MEDIO", minutosAtras: 40 }]);

  const row = pagina(entorno).rows[0];
  assert.equal(row?.youthLevel, "ROJO", "el nivel de reglas del APK");
  assert.equal(row?.category, "MEDIO", "la categoría operativa del LLM");
  // Son ejes distintos y la fila no los mezcla.
  assert.notEqual(row?.youthLevel, row?.category);
});

// ---------------------------------------------------------------------------
// Criterio 3 — UNASSIGNED
// ---------------------------------------------------------------------------
test("criterio 3: UNASSIGNED equivale a no tener responsable", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-SIN", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
    { token: "C-CON", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10, asignarA: PSICOLOGA },
  ]);

  const sin = pagina(entorno, { filter: "UNASSIGNED" });
  assert.deepEqual(sin.rows.map((r) => r.caseToken), ["C-SIN"]);
  assert.ok(sin.rows.every((r) => r.assigneeId === null));
  assert.equal(sin.rows[0]?.assigneeName, null);
});

test("criterio 3b: el responsable lleva el nombre del profesional, no del joven", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10, asignarA: PSICOLOGA },
  ]);

  const row = pagina(entorno).rows[0];
  assert.equal(row?.assigneeId, PSICOLOGA);
  assert.equal(row?.assigneeName, "Ana López");
});

// ---------------------------------------------------------------------------
// Criterio 4 — sin identidad del joven
// ---------------------------------------------------------------------------
test("criterio 4: ninguna fila expone identidad del joven", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C-1", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 }]);

  const serializado = JSON.stringify(pagina(entorno));
  for (const prohibido of ["profileId", "profile_id", "alias", "youthId", "deviceKey", "idempotencyKey"]) {
    assert.ok(!serializado.includes(prohibido), `no debe contener "${prohibido}"`);
  }
});

// ---------------------------------------------------------------------------
// Criterio 5 — orden por urgencia, estable
// ---------------------------------------------------------------------------
test("criterio 5: el orden por defecto es urgencia y es estable", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-RECIENTE", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 1 },
    { token: "C-ROJO-SIN", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 },
    { token: "C-VIEJO-INCUMPLIDO", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 900 },
  ]);

  const primera = pagina(entorno).rows.map((r) => r.caseToken);
  const segunda = pagina(entorno).rows.map((r) => r.caseToken);

  assert.deepEqual(primera, segunda, "dos lecturas iguales dan el mismo orden");
  assert.equal(primera[0], "C-ROJO-SIN", "el rojo sin responsable va primero");
});

test("criterio 5b: el orden es EL MISMO que el de PR-011", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-A", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 },
    { token: "C-B", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 900 },
    { token: "C-C", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 5 },
  ]);

  const alertas = pagina(entorno).rows.map((r) => r.caseToken);
  const tablero = buildTodayBoard({
    queue: entorno.queue,
    directory: entorno.directory,
    nowEpochMillis: entorno.reloj.ahora(),
    outOfHours: false,
  }).cards.map((c) => c.caseToken);

  assert.deepEqual(alertas, tablero, "las dos pantallas deben mostrar la misma prioridad");
});

// ---------------------------------------------------------------------------
// Criterio 6 — los contadores cuadran
// ---------------------------------------------------------------------------
test("criterio 6: los contadores por filtro cuadran con la lista", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-ROJO", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 },
    { token: "C-AMARILLO-1", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
    { token: "C-AMARILLO-2", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10, asignarA: PSICOLOGA },
  ]);

  const board = pagina(entorno);
  assert.equal(board.counts["ALL"], 3);
  assert.equal(board.counts["RED"], 1);
  assert.equal(board.counts["YELLOW"], 2);
  assert.equal(board.counts["UNASSIGNED"], 2);

  // Y el total de cada filtro coincide con su contador.
  for (const filtro of ALERT_FILTERS) {
    assert.equal(pagina(entorno, { filter: filtro }).total, board.counts[filtro], filtro);
  }
});

test("criterio 6b: los contadores respetan la búsqueda", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "PJ-001", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 },
    { token: "PJ-002", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
    { token: "OTRO-1", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
  ]);

  const board = pagina(entorno, { search: "PJ-" });
  assert.equal(board.counts["ALL"], 2);
  assert.equal(board.total, 2);
});

// ---------------------------------------------------------------------------
// Criterio 7 — el incumplimiento se marca de forma explícita
// ---------------------------------------------------------------------------
test("criterio 7: un caso incumplido se marca con dato Y con patrón, no solo con color", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 900 }]);

  const row = pagina(entorno).rows[0];
  // El portal pinta el color a partir de esto, pero también el texto del patrón.
  assert.equal(row?.slaBreached, true);
  assert.ok(row?.patternKeys.includes("pattern.sla_incumplido"));
});

// ---------------------------------------------------------------------------
// Búsqueda y paginación
// ---------------------------------------------------------------------------
test("la búsqueda filtra por caseToken sin distinguir mayúsculas", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "PJ-047", origen: "ROJO", categoria: "ALTO", minutosAtras: 40 },
    { token: "PJ-032", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 },
  ]);

  assert.deepEqual(pagina(entorno, { search: "pj-047" }).rows.map((r) => r.caseToken), ["PJ-047"]);
  assert.deepEqual(pagina(entorno, { search: "032" }).rows.map((r) => r.caseToken), ["PJ-032"]);
  assert.equal(pagina(entorno, { search: "no-existe" }).total, 0);
});

test("la paginación reparte sin perder ni repetir filas", () => {
  const entorno = makeEntorno();
  sembrar(
    entorno,
    Array.from({ length: 7 }, (_, i) => ({
      token: `C-${String(i).padStart(2, "0")}`,
      origen: "AMARILLO" as const,
      categoria: "MEDIO" as const,
      minutosAtras: 10 + i,
    })),
  );

  const p1 = pagina(entorno, { pageSize: 3, page: 1 });
  const p2 = pagina(entorno, { pageSize: 3, page: 2 });
  const p3 = pagina(entorno, { pageSize: 3, page: 3 });

  assert.equal(p1.total, 7);
  assert.equal(p1.rows.length, 3);
  assert.equal(p2.rows.length, 3);
  assert.equal(p3.rows.length, 1);

  const todos = [...p1.rows, ...p2.rows, ...p3.rows].map((r) => r.caseToken);
  assert.equal(new Set(todos).size, 7, "sin repetidos");
});

test("una página fuera de rango se ajusta en vez de devolver vacío", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", origen: "AMARILLO", categoria: "MEDIO", minutosAtras: 10 }]);

  const board = pagina(entorno, { pageSize: 10, page: 99 });
  assert.equal(board.page, 1);
  assert.equal(board.rows.length, 1);
});

test("pageSize se acota para no permitir volcar toda la tabla", () => {
  const entorno = makeEntorno();
  const board = pagina(entorno, { pageSize: 100_000 });
  assert.equal(board.pageSize, 100);
});

// ---------------------------------------------------------------------------
// Casos cerrados
// ---------------------------------------------------------------------------
test("un caso cerrado no aparece en ninguna alerta", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", origen: "ROJO", categoria: "ALTO", minutosAtras: 100 }]);
  entorno.queue.close("C", humanActor(PSICOLOGA), "CONSENT_WITHDRAWN");

  assert.equal(pagina(entorno).total, 0);
});
