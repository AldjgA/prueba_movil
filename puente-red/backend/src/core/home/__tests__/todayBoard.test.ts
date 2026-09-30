/**
 * PR-011 · Pruebas de los criterios de aceptación 1, 2, 3, 4, 5, 7 y 8 del tablero.
 * (El criterio 6, autorización por rol, se prueba en `test/profesional.test.js`.)
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Directory, DEMO_SEED } from "../../directory/index.ts";
import { CaseQueue, SYSTEM_ACTOR, humanActor } from "../../queue/index.ts";
import { buildTodayBoard, MOTIVE, PATTERN } from "../todayBoard.ts";

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
  readonly categoria: "MEDIO" | "ALTO";
  readonly minutosAtras: number;
  readonly asignarA?: string;
}

function sembrar(
  entorno: ReturnType<typeof makeEntorno>,
  specs: readonly CasoSpec[],
): void {
  for (const spec of specs) {
    const recibido = START - spec.minutosAtras * MINUTO;
    entorno.queue.enqueue(
      {
        caseToken: spec.token,
        originLevel: spec.categoria === "ALTO" ? "ROJO" : "AMARILLO",
        rulesetVersion: "r1",
        category: null,
        receivedAtEpochMillis: recibido,
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

const tablero = (entorno: ReturnType<typeof makeEntorno>, outOfHours = false) =>
  buildTodayBoard({
    queue: entorno.queue,
    directory: entorno.directory,
    nowEpochMillis: entorno.reloj.ahora(),
    outOfHours,
  });

const PSICOLOGA = DEMO_SEED[0]?.id ?? "demo-psicologa-trauma";

// ---------------------------------------------------------------------------
// Criterio 1 — un ALTO sin responsable va primero
// ---------------------------------------------------------------------------
test("criterio 1: un caso ALTO sin responsable aparece primero", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-MEDIO-VIEJO", categoria: "MEDIO", minutosAtras: 600 },
    // 40 min: pasado el acuse de un ALTO (5 min), así que está sin responsable de verdad.
    { token: "C-ALTO-NUEVO", categoria: "ALTO", minutosAtras: 40 },
    { token: "C-MEDIO-NUEVO", categoria: "MEDIO", minutosAtras: 1 },
  ]);

  const { cards } = tablero(entorno);

  assert.equal(cards[0]?.caseToken, "C-ALTO-NUEVO");
  assert.equal(cards[0]?.reason, "HIGH_WAITING", "el motivo debe explicar por qué está arriba");
  assert.ok(cards[0]?.reasons.includes("UNASSIGNED"));
  assert.equal(cards[0]?.motiveKey, MOTIVE.SEGURIDAD_PRIORITARIA);
});

test("criterio 1b: un ALTO sin responsable gana a un MEDIO incumplido", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    // MEDIO con el acuse vencido hace mucho (incumplido).
    { token: "C-MEDIO-INCUMPLIDO", categoria: "MEDIO", minutosAtras: 900 },
    // ALTO recién llegado, aún sin responsable.
    { token: "C-ALTO", categoria: "ALTO", minutosAtras: 3 },
  ]);

  const { cards } = tablero(entorno);

  assert.equal(
    cards[0]?.caseToken,
    "C-ALTO",
    "un rojo sin nadie no puede quedar por detrás de un amarillo incumplido",
  );
  assert.equal(cards[1]?.caseToken, "C-MEDIO-INCUMPLIDO");
  assert.equal(cards[1]?.slaBreached, true);
});

// ---------------------------------------------------------------------------
// Criterio 2 — un incumplido aparece aunque sea antiguo
// ---------------------------------------------------------------------------
test("criterio 2: un caso con SLA incumplido aparece aunque sea el más antiguo", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-RECIENTE", categoria: "MEDIO", minutosAtras: 1 },
    { token: "C-ANTIGUO", categoria: "MEDIO", minutosAtras: 5_000 },
  ]);

  const { cards } = tablero(entorno);
  const antiguo = cards.find((c) => c.caseToken === "C-ANTIGUO");

  assert.notEqual(antiguo, undefined);
  assert.equal(antiguo?.slaBreached, true);
  assert.ok(antiguo?.reasons.includes("SLA_BREACHED"));
  assert.ok(antiguo?.patternKeys.includes(PATTERN.SLA_INCUMPLIDO));
  assert.ok(
    cards.indexOf(antiguo as never) < cards.indexOf(cards.find((c) => c.caseToken === "C-RECIENTE") as never),
    "el incumplido debe ir antes que uno reciente sin problema",
  );
});

// ---------------------------------------------------------------------------
// Criterio 3 — el tiempo esperando se calcula al leer
// ---------------------------------------------------------------------------
test("criterio 3: el tiempo esperando se recalcula en cada lectura", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", categoria: "MEDIO", minutosAtras: 10 }]);

  const primera = tablero(entorno).cards[0]?.waitingMillis ?? 0;
  entorno.reloj.avanzar(5 * MINUTO);
  const segunda = tablero(entorno).cards[0]?.waitingMillis ?? 0;

  assert.equal(primera, 10 * MINUTO);
  assert.equal(segunda, 15 * MINUTO);
  assert.equal(segunda - primera, 5 * MINUTO);
});

// ---------------------------------------------------------------------------
// Criterio 4 — estado vacío honesto
// ---------------------------------------------------------------------------
test("criterio 4: sin casos el tablero está vacío y dice cuándo se generó", () => {
  const entorno = makeEntorno();
  const board = tablero(entorno);

  assert.deepEqual(board.cards, []);
  assert.equal(board.waitingCount, 0);
  assert.equal(board.unassignedCount, 0);
  assert.equal(board.generatedAtEpochMillis, START);
  assert.equal(board.demoData, false);
});

test("criterio 4b: un caso cerrado no aparece en el tablero", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", categoria: "ALTO", minutosAtras: 100 }]);
  entorno.queue.close("C", humanActor("demo-psicologa-trauma"), "CONSENT_WITHDRAWN");

  assert.deepEqual(tablero(entorno).cards, []);
});

test("criterio 4c: un caso resuelto tampoco pide atención", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", categoria: "MEDIO", minutosAtras: 100, asignarA: PSICOLOGA }]);
  entorno.queue.accept("C", PSICOLOGA, humanActor(PSICOLOGA));
  entorno.queue.startWork("C", humanActor(PSICOLOGA));
  entorno.queue.resolve("C", humanActor(PSICOLOGA));

  assert.deepEqual(tablero(entorno).cards, []);
});

// ---------------------------------------------------------------------------
// Criterio 5 — sin identidad del joven
// ---------------------------------------------------------------------------
test("criterio 5: ninguna tarjeta contiene identidad del joven", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C-1", categoria: "ALTO", minutosAtras: 40 }]);

  const serializado = JSON.stringify(tablero(entorno));

  for (const prohibido of ["profileId", "profile_id", "alias", "youthId", "deviceKey", "caseTokenHash"]) {
    assert.ok(!serializado.includes(prohibido), `la tarjeta no debe contener "${prohibido}"`);
  }
});

test("criterio 5b: el responsable es el profesional, nunca el joven", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C-1", categoria: "MEDIO", minutosAtras: 10, asignarA: PSICOLOGA }]);

  const card = tablero(entorno).cards[0];
  assert.equal(card?.assigneeId, PSICOLOGA);
  assert.equal(card?.assigneeName, "Ana López");
});

// ---------------------------------------------------------------------------
// Criterio 7 — el contador coincide con PR-009
// ---------------------------------------------------------------------------
test("criterio 7: el contador de «sin responsable» coincide con SlaStatus de PR-009", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-VENCIDO", categoria: "MEDIO", minutosAtras: 600 },
    { token: "C-EN-PLAZO", categoria: "MEDIO", minutosAtras: 2 },
    { token: "C-ASIGNADO", categoria: "MEDIO", minutosAtras: 600, asignarA: PSICOLOGA },
  ]);

  const board = tablero(entorno);
  const esperados = entorno.queue
    .list()
    .filter((t) => entorno.queue.status(t.caseToken)?.unassigned === true).length;

  assert.equal(board.unassignedCount, esperados);
  assert.equal(board.unassignedCount, 1, "solo el vencido y sin responsable");
});

// ---------------------------------------------------------------------------
// Criterio 8 — fuera de horario
// ---------------------------------------------------------------------------
test("criterio 8: fuera de horario no se pinta un SLA incumplido como si hubiera alguien", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [{ token: "C", categoria: "ALTO", minutosAtras: 120 }]);

  const enHorario = tablero(entorno, false).cards[0];
  const fuera = tablero(entorno, true).cards[0];

  assert.equal(enHorario?.slaBreached, true, "en horario, 120 min en un ALTO es un incumplimiento");
  assert.equal(fuera?.slaBreached, false, "fuera de horario el reloj del SLA no corre");
  assert.equal(fuera?.outOfHours, true);
  assert.ok(fuera?.patternKeys.includes(PATTERN.FUERA_DE_HORARIO));
});

// ---------------------------------------------------------------------------
// Determinismo
// ---------------------------------------------------------------------------
test("el orden es reproducible entre dos lecturas con el mismo estado", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-B", categoria: "MEDIO", minutosAtras: 100 },
    { token: "C-A", categoria: "MEDIO", minutosAtras: 100 },
  ]);

  const a = tablero(entorno).cards.map((c) => c.caseToken);
  const b = tablero(entorno).cards.map((c) => c.caseToken);

  assert.deepEqual(a, b);
  // A igualdad de severidad y de tiempo esperando, desempata el caseToken.
  assert.deepEqual(a, ["C-A", "C-B"]);
});

test("el tablero declara si se está demostrando con datos ficticios", () => {
  const entorno = makeEntorno();
  const board = buildTodayBoard({
    queue: entorno.queue,
    directory: entorno.directory,
    nowEpochMillis: START,
    outOfHours: false,
    demoData: true,
  });
  assert.equal(board.demoData, true);
});

test("todas las claves emitidas son de catálogo, nunca prosa", () => {
  const entorno = makeEntorno();
  sembrar(entorno, [
    { token: "C-ALTO", categoria: "ALTO", minutosAtras: 40 },
    { token: "C-MEDIO", categoria: "MEDIO", minutosAtras: 900, asignarA: PSICOLOGA },
  ]);

  for (const card of tablero(entorno).cards) {
    assert.ok(card.motiveKey.startsWith("motive."), card.motiveKey);
    for (const clave of card.patternKeys) {
      assert.ok(clave.startsWith("pattern."), clave);
    }
  }
});
