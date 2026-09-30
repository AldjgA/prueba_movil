/**
 * PR-009 · Pruebas de los criterios de aceptación 1 a 10.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Directory, type ResponderProfile } from "../../directory/index.ts";
import { CaseQueue, InMemoryCaseAuditSink, InMemoryCaseStore } from "../index.ts";
import { ALLOWED_TRANSITIONS, CASE_STATES, canTransition, type CaseState } from "../states.ts";
import { SYSTEM_ACTOR, humanActor } from "../types.ts";

const START = 1_700_000_000_000;
const MINUTE = 60_000;

/** Reloj controlable: sin esto, probar el SLA sería cuestión de suerte. */
function makeClock(start = START): { clock: { nowEpochMillis(): number }; advance(ms: number): void } {
  let now = start;
  return {
    clock: { nowEpochMillis: () => now },
    advance: (ms: number) => {
      now += ms;
    },
  };
}

const PSY: ResponderProfile = {
  id: "psy-1",
  kind: "PSYCHOLOGIST",
  displayName: "Ana López",
  role: "PSICOLOGIA",
  specialties: ["BULLYING"],
  ageBandsServed: ["15-16"],
  languages: ["ES"],
  zone: "CENTRO",
  maxCategory: "ALTO",
  onCall: false,
  active: true,
  isFictional: true,
};

function makeQueue(): {
  queue: CaseQueue;
  audit: InMemoryCaseAuditSink;
  advance(ms: number): void;
} {
  const { clock, advance } = makeClock();
  const directory = new Directory({ clock });
  directory.upsert(PSY as unknown as Record<string, unknown>, null);

  const audit = new InMemoryCaseAuditSink();
  const queue = new CaseQueue({
    directory,
    store: new InMemoryCaseStore(),
    audit,
    clock,
  });

  return { queue, audit, advance };
}

/** Lleva un caso hasta `ACEPTADO` por el camino feliz. */
function toAccepted(queue: CaseQueue, token = "CASE-1", category: "MEDIO" | "ALTO" = "MEDIO"): void {
  queue.enqueue({ caseToken: token, originLevel: "AMARILLO", rulesetVersion: "r1", category: null }, `key-${token}`);
  queue.markClassified(token, category);
  queue.enqueueForRouting(token);
  queue.assign(token, PSY.id, SYSTEM_ACTOR);
  queue.accept(token, PSY.id, humanActor("psy-1"));
}

// ---------------------------------------------------------------------------
// Criterio 1 — la máquina tiene exactamente los estados de PR-003 §3.1
// ---------------------------------------------------------------------------
test("criterio 1: los estados son exactamente los de PR-003 §3.1", () => {
  assert.deepEqual([...CASE_STATES], [
    "RECIBIDO",
    "CLASIFICADO",
    "EN_COLA",
    "ASIGNADO",
    "ACEPTADO",
    "CONTACTO_HABILITADO",
    "EN_CURSO",
    "RESUELTO",
    "CERRADO",
  ]);
  assert.deepEqual(Object.keys(ALLOWED_TRANSITIONS).sort(), [...CASE_STATES].sort());
});

test("criterio 1b: no se puede saltar de RECIBIDO a ACEPTADO", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "ROJO", rulesetVersion: "r1", category: "ALTO" }, "k");

  const result = queue.accept("C", PSY.id, humanActor("psy-1"));
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "ILLEGAL_TRANSITION");
});

test("criterio 1c: CERRADO es terminal", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  queue.close("C", SYSTEM_ACTOR, "CONSENT_WITHDRAWN");

  for (const state of CASE_STATES) {
    assert.equal(canTransition("CERRADO", state), false, `CERRADO no debe ir a ${state}`);
  }
});

// ---------------------------------------------------------------------------
// Criterio 2 — toda transición deja evento con actor e instante
// ---------------------------------------------------------------------------
test("criterio 2: cada transición genera un evento con actor e instante", () => {
  const { queue, audit } = makeQueue();
  toAccepted(queue);

  assert.equal(audit.count(), 5);
  const actions = audit.events().map((e) => e.action);
  assert.deepEqual(actions, [
    "CASE_ENQUEUED",
    "STATE_CHANGED",
    "STATE_CHANGED",
    "STATE_CHANGED",
    "STATE_CHANGED",
  ]);

  const accepted = audit.events().at(-1);
  assert.equal(accepted?.from, "ASIGNADO");
  assert.equal(accepted?.to, "ACEPTADO");
  assert.equal(accepted?.actorKind, "HUMAN");
  assert.equal(accepted?.actorId, "psy-1");
  assert.equal(accepted?.at, new Date(START).toISOString());
});

test("criterio 2b: un evento del sistema no tiene actorId", () => {
  const { queue, audit } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");

  const first = audit.events()[0];
  assert.equal(first?.actorKind, "SYSTEM");
  assert.equal(first?.actorId, null);
});

test("criterio 2c: una transición rechazada NO deja evento", () => {
  const { queue, audit } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  const before = audit.count();

  queue.accept("C", PSY.id, humanActor("psy-1")); // ilegal desde RECIBIDO

  assert.equal(audit.count(), before);
});

// ---------------------------------------------------------------------------
// Criterio 3 — el joven no ve al profesional antes de ACEPTADO
// ---------------------------------------------------------------------------
test("criterio 3: psicologo es null en todo estado anterior a ACEPTADO", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: null }, "k");

  const steps: Array<[CaseState, () => void]> = [
    ["RECIBIDO", () => {}],
    ["CLASIFICADO", () => void queue.markClassified("C", "MEDIO")],
    ["EN_COLA", () => void queue.enqueueForRouting("C")],
    ["ASIGNADO", () => void queue.assign("C", PSY.id, SYSTEM_ACTOR)],
  ];

  for (const [expected, step] of steps) {
    step();
    const view = queue.projectForYouth("C");
    assert.equal(view?.estado, expected);
    assert.equal(view?.psicologo, null, `en ${expected} el joven no debe ver al profesional`);
  }

  queue.accept("C", PSY.id, humanActor("psy-1"));
  const accepted = queue.projectForYouth("C");
  assert.deepEqual(accepted?.psicologo, {
    nombreVisible: "Ana López",
    rol: "psicologo",
    especialidad: "bullying",
  });
});

// ---------------------------------------------------------------------------
// Criterio 4 — canal solo desde CONTACTO_HABILITADO
// ---------------------------------------------------------------------------
test("criterio 4: canalContacto es null hasta CONTACTO_HABILITADO", () => {
  const { queue } = makeQueue();
  toAccepted(queue);

  // ACEPTADO: ve al profesional, pero NO tiene canal (R1 vs R5).
  const accepted = queue.projectForYouth("CASE-1");
  assert.notEqual(accepted?.psicologo, null);
  assert.equal(accepted?.canalContacto, null);

  queue.openContactChannel("CASE-1", humanActor("psy-1"));
  assert.equal(queue.projectForYouth("CASE-1")?.canalContacto, "IN_APP");

  queue.startWork("CASE-1", humanActor("psy-1"));
  assert.equal(queue.projectForYouth("CASE-1")?.canalContacto, "IN_APP");
});

test("criterio 4b: ACEPTADO → EN_CURSO sin canal es un camino válido", () => {
  const { queue } = makeQueue();
  toAccepted(queue);

  const result = queue.startWork("CASE-1", humanActor("psy-1"));
  assert.equal(result.ok, true);
  assert.equal(queue.projectForYouth("CASE-1")?.estado, "EN_CURSO");
  // El psicólogo trabaja el caso sin abrir el canal: el canal es baja prioridad (R2), y el
  // canal es un HECHO, no algo que se deduzca del estado.
  assert.equal(queue.projectForYouth("CASE-1")?.canalContacto, null);
  assert.equal(queue.get("CASE-1")?.contactChannelOpenedAtEpochMillis, null);
});

test("criterio 4c: al cerrar el caso el canal deja de estar disponible", () => {
  const { queue } = makeQueue();
  toAccepted(queue);
  queue.openContactChannel("CASE-1", humanActor("psy-1"));
  assert.equal(queue.projectForYouth("CASE-1")?.canalContacto, "IN_APP");

  queue.close("CASE-1", humanActor("psy-1"), "CONSENT_WITHDRAWN");
  assert.equal(queue.projectForYouth("CASE-1")?.canalContacto, null);
});

// ---------------------------------------------------------------------------
// Criterio 5 — SLA y "sin responsable"
// ---------------------------------------------------------------------------
test("criterio 5: un ALTO sin acuse pasada la ventana queda incumplido y sin responsable", () => {
  const { queue, advance } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "ROJO", rulesetVersion: "r1", category: null }, "k");
  queue.markClassified("C", "ALTO");
  queue.enqueueForRouting("C");

  // A los 4 minutos aún no ha incumplido.
  advance(4 * MINUTE);
  const ok = queue.status("C");
  assert.equal(ok?.ackBreached, false);
  assert.equal(ok?.unassigned, false);

  // A los 6, sí.
  advance(2 * MINUTE);
  const breached = queue.status("C");
  assert.equal(breached?.ackBreached, true);
  assert.equal(breached?.unassigned, true);
});

test("criterio 5b: el SLA se recalcula al conocer la categoría real", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "ROJO", rulesetVersion: "r1", category: null }, "k");
  queue.markClassified("C", "ALTO");

  const ticket = queue.get("C");
  // Sin recalcular, un ALTO tendría 4 horas de margen en vez de 5 minutos.
  assert.equal(ticket?.ackDueAtEpochMillis, START + 5 * MINUTE);
  assert.equal(ticket?.resolveDueAtEpochMillis, START + 30 * MINUTE);
});

test("criterio 5c: un MEDIO tiene las ventanas de PR-001 §7", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: null }, "k");
  queue.markClassified("C", "MEDIO");

  const ticket = queue.get("C");
  assert.equal(ticket?.ackDueAtEpochMillis, START + 4 * 60 * MINUTE);
  assert.equal(ticket?.resolveDueAtEpochMillis, START + 24 * 60 * MINUTE);
});

test("criterio 5d: fuera de horario el reloj del SLA no corre", () => {
  const { queue, advance } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "ROJO", rulesetVersion: "r1", category: null }, "k");
  queue.markClassified("C", "ALTO");
  queue.enqueueForRouting("C");

  advance(60 * MINUTE); // una hora después, de madrugada

  const status = queue.status("C", true);
  assert.equal(status?.outOfHours, true);
  assert.equal(status?.ackBreached, false, "no se puede reprochar no atender sin nadie de turno");
  assert.equal(status?.unassigned, false);
});

test("criterio 5e: el tiempo esperando se mide desde la recepción", () => {
  const { queue, advance } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  advance(90 * MINUTE);
  assert.equal(queue.status("C")?.waitingMillis, 90 * MINUTE);
});

// ---------------------------------------------------------------------------
// Criterio 6 — ACEPTADO exige un actor humano
// ---------------------------------------------------------------------------
test("criterio 6: no se puede aceptar un caso sin actor humano", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  queue.markClassified("C", "MEDIO");
  queue.enqueueForRouting("C");
  queue.assign("C", PSY.id, SYSTEM_ACTOR);

  const bySystem = queue.accept("C", PSY.id, SYSTEM_ACTOR);
  assert.equal(bySystem.ok, false);
  assert.equal(bySystem.ok === false && bySystem.reason, "HUMAN_ACTOR_REQUIRED");
  assert.equal(queue.get("C")?.state, "ASIGNADO");

  const byHuman = queue.accept("C", PSY.id, humanActor("psy-1"));
  assert.equal(byHuman.ok, true);
  assert.equal(byHuman.ok === true && byHuman.ticket.state, "ACEPTADO");
  assert.equal(queue.get("C")?.acceptedAtEpochMillis, START);
});

test("criterio 6b: un actor humano sin identificador se rechaza", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  queue.markClassified("C", "MEDIO");
  queue.enqueueForRouting("C");
  queue.assign("C", PSY.id, SYSTEM_ACTOR);

  const result = queue.accept("C", PSY.id, humanActor("   "));
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "MISSING_ACTOR_ID");
});

test("criterio 6c: no se puede asignar a un respondedor inexistente", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  queue.markClassified("C", "MEDIO");
  queue.enqueueForRouting("C");

  const result = queue.assign("C", "no-existe", SYSTEM_ACTOR);
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "UNKNOWN_RESPONDER");
});

// ---------------------------------------------------------------------------
// Criterio 7 — idempotencia
// ---------------------------------------------------------------------------
test("criterio 7: dos envíos con la misma clave producen un solo caso", () => {
  const { queue, audit } = makeQueue();
  const input = { caseToken: "C", originLevel: "ROJO", rulesetVersion: "r1", category: "ALTO" as const };

  const first = queue.enqueue(input, "idem-1");
  const second = queue.enqueue(input, "idem-1");

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(queue.list().length, 1);
  assert.equal(audit.count(), 1, "el reintento no debe generar un segundo alta");
  assert.equal(
    first.ok === true ? first.ticket.caseToken : null,
    second.ok === true ? second.ticket.caseToken : null,
  );
});

test("criterio 7b: una clave vacía se rechaza", () => {
  const { queue } = makeQueue();
  const result = queue.enqueue(
    { caseToken: "C", originLevel: "ROJO", rulesetVersion: "r1", category: "ALTO" },
    "  ",
  );
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "MISSING_IDEMPOTENCY_KEY");
});

test("criterio 7c: claves distintas producen casos distintos", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C1", originLevel: "ROJO", rulesetVersion: "r1", category: "ALTO" }, "k1");
  queue.enqueue({ caseToken: "C2", originLevel: "ROJO", rulesetVersion: "r1", category: "ALTO" }, "k2");
  assert.equal(queue.list().length, 2);
});

// ---------------------------------------------------------------------------
// Criterio 8 — CERRADO no vuelve atrás
// ---------------------------------------------------------------------------
test("criterio 8: un caso CERRADO no vuelve a estados anteriores", () => {
  const { queue } = makeQueue();
  toAccepted(queue);
  queue.close("CASE-1", humanActor("psy-1"), "CONSENT_WITHDRAWN");

  assert.equal(queue.get("CASE-1")?.state, "CERRADO");
  assert.equal(queue.startWork("CASE-1", humanActor("psy-1")).ok, false);
  assert.equal(queue.resolve("CASE-1", humanActor("psy-1")).ok, false);
  assert.equal(queue.close("CASE-1", humanActor("psy-1")).ok, false);
});

// ---------------------------------------------------------------------------
// Criterio 9 — la proyección no filtra nada interno
// ---------------------------------------------------------------------------
test("criterio 9: la proyección al joven tiene exactamente ocho campos", () => {
  const { queue } = makeQueue();
  toAccepted(queue);

  const view = queue.projectForYouth("CASE-1");
  assert.notEqual(view, null);
  assert.deepEqual(Object.keys(view as object).sort(), [
    "actualizadoEn",
    "canalContacto",
    "caseToken",
    "categoria",
    "contratoVersion",
    "estado",
    "mensajesNoLeidos",
    "psicologo",
  ]);
});

test("criterio 9b: la proyección no expone estado interno, carga ni notas", () => {
  const { queue } = makeQueue();
  toQueueWithNote(queue);

  const serialized = JSON.stringify(queue.projectForYouth("CASE-1"));
  for (const leaked of [
    "proposedAssignee",
    "assignee",
    "idempotencyKey",
    "rulesetVersion",
    "originLevel",
    "openCases",
    "avgAckLatencyMinutes",
    "contactChannelOpenedAtEpochMillis",
    "ackDueAtEpochMillis",
    "resolveDueAtEpochMillis",
    "internalNotes",
    "nota interna",
    "psy-1",
  ]) {
    assert.ok(!serialized.includes(leaked), `la proyección no debe contener "${leaked}"`);
  }
});

function toQueueWithNote(queue: CaseQueue): void {
  queue.enqueue({ caseToken: "CASE-1", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  queue.markClassified("CASE-1", "MEDIO");
  queue.enqueueForRouting("CASE-1");
  queue.assign("CASE-1", PSY.id, SYSTEM_ACTOR);
}

// ---------------------------------------------------------------------------
// Criterio 10 — contratoVersion viaja siempre
// ---------------------------------------------------------------------------
test("criterio 10: la proyección lleva contratoVersion", () => {
  const { queue } = makeQueue();
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  assert.equal(queue.projectForYouth("C")?.contratoVersion, "1.0");
});

test("criterio 10b: la versión de contrato es configurable", () => {
  const { clock } = makeClock();
  const directory = new Directory({ clock });
  const queue = new CaseQueue({ directory, clock, contratoVersion: "1.1" });
  queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");
  assert.equal(queue.projectForYouth("C")?.contratoVersion, "1.1");
});

// ---------------------------------------------------------------------------
// RESUELTO vs CERRADO
// ---------------------------------------------------------------------------
test("cerrar no es resolver: un caso puede cerrarse sin resolverse", () => {
  const { queue } = makeQueue();
  toAccepted(queue);

  // Revocación directa desde ACEPTADO: no pasa por RESUELTO.
  const result = queue.close("CASE-1", humanActor("psy-1"), "CONSENT_WITHDRAWN");

  assert.equal(result.ok, true);
  const ticket = queue.get("CASE-1");
  assert.equal(ticket?.state, "CERRADO");
  assert.equal(ticket?.revocationReason, "CONSENT_WITHDRAWN");
  assert.equal(ticket?.closedAtEpochMillis, START);
});

test("el camino completo hasta CERRADO pasando por RESUELTO", () => {
  const { queue } = makeQueue();
  toAccepted(queue);

  queue.openContactChannel("CASE-1", humanActor("psy-1"));
  queue.startWork("CASE-1", humanActor("psy-1"));
  queue.resolve("CASE-1", humanActor("psy-1"));
  queue.close("CASE-1", humanActor("psy-1"));

  assert.equal(queue.get("CASE-1")?.state, "CERRADO");
  assert.equal(queue.get("CASE-1")?.revocationReason, null);
});

test("una revocación puede cerrar el caso desde cualquier estado no terminal", () => {
  for (const state of CASE_STATES) {
    if (state === "CERRADO") continue;
    const { queue } = makeQueue();
    queue.enqueue({ caseToken: "C", originLevel: "AMARILLO", rulesetVersion: "r1", category: "MEDIO" }, "k");

    // Se lleva el caso hasta el estado objetivo.
    if (state !== "RECIBIDO") queue.markClassified("C", "MEDIO");
    if (!["RECIBIDO", "CLASIFICADO"].includes(state)) queue.enqueueForRouting("C");
    if (!["RECIBIDO", "CLASIFICADO", "EN_COLA"].includes(state)) {
      queue.assign("C", PSY.id, SYSTEM_ACTOR);
    }
    if (!["RECIBIDO", "CLASIFICADO", "EN_COLA", "ASIGNADO"].includes(state)) {
      queue.accept("C", PSY.id, humanActor("psy-1"));
    }
    if (["CONTACTO_HABILITADO", "EN_CURSO", "RESUELTO"].includes(state)) {
      queue.openContactChannel("C", humanActor("psy-1"));
    }
    if (["EN_CURSO", "RESUELTO"].includes(state)) queue.startWork("C", humanActor("psy-1"));
    if (state === "RESUELTO") queue.resolve("C", humanActor("psy-1"));

    assert.equal(queue.get("C")?.state, state, `no se alcanzó ${state}`);
    assert.equal(queue.close("C", SYSTEM_ACTOR, "WINDOW_EXPIRED").ok, true, `no se cerró desde ${state}`);
    assert.equal(queue.get("C")?.state, "CERRADO");
  }
});

// ---------------------------------------------------------------------------
// Casos inexistentes
// ---------------------------------------------------------------------------
test("operar sobre un caso inexistente se rechaza sin romper", () => {
  const { queue } = makeQueue();
  assert.equal(queue.get("no-existe"), null);
  assert.equal(queue.status("no-existe"), null);
  assert.equal(queue.projectForYouth("no-existe"), null);
  assert.equal(queue.markClassified("no-existe", "MEDIO").ok, false);
  assert.equal(queue.close("no-existe", SYSTEM_ACTOR).ok, false);
});
