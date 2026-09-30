/**
 * PR-008 · Pruebas de los criterios de aceptación 1 a 8.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Directory, type LoadSource, type ResponderProfile } from "../../directory/index.ts";
import type { CaseFeatureSet } from "../../features/index.ts";
import { RoutingEngine } from "../routingEngine.ts";
import { REASON, REASON_KEYS, TRADEOFF, TRADEOFF_KEYS } from "../catalog.ts";
import type { Clock, RoutingContext } from "../types.ts";

const FIXED_CLOCK: Clock = { nowEpochMillis: () => 1_700_000_000_000 };
const AT = new Date(FIXED_CLOCK.nowEpochMillis()).toISOString();

function makeFeatures(overrides: Partial<CaseFeatureSet> = {}): CaseFeatureSet {
  return {
    caseToken: "01J000000000000000000000AA",
    situation: { value: "BULLYING", provenance: "DECLARED", confidenceBand: "HIGH" },
    domains: [],
    signals: [],
    protectiveFactors: [],
    ageBand: "15-16",
    urgencyDeclared: null,
    extractorVersion: "feature-extractor/1.0.0",
    promptVersion: "extraction-prompt/1.0.0-provisional",
    extractedAt: AT,
    ...overrides,
  };
}

function profile(overrides: Partial<ResponderProfile> & { id: string }): ResponderProfile {
  return {
    kind: "PSYCHOLOGIST",
    displayName: `Perfil ${overrides.id}`,
    role: "psicologo",
    specialties: ["trauma"],
    ageBandsServed: ["15-16"],
    languages: ["ES"],
    zone: "CENTRO",
    maxCategory: "ALTO",
    onCall: false,
    active: true,
    isFictional: false,
    ...overrides,
  };
}

function makeEngine(
  profiles: readonly ResponderProfile[],
  loads: Readonly<Record<string, number>> = {},
  concentration: Readonly<Record<string, number>> = {},
): RoutingEngine {
  const loadSource: LoadSource = {
    loadFor: (responderId) => ({
      responderId,
      openCases: loads[responderId] ?? 0,
      casesTakenLast7Days: concentration[responderId] ?? 0,
      avgAckLatencyMinutes: 0,
    }),
  };

  const directory = new Directory({ loads: loadSource, clock: FIXED_CLOCK });
  for (const p of profiles) {
    const result = directory.upsert(p as unknown as Record<string, unknown>, null);
    assert.equal(result.ok, true, `no se pudo sembrar ${p.id}`);
  }

  return new RoutingEngine({ directory, clock: FIXED_CLOCK });
}

function context(overrides: Partial<RoutingContext> = {}): RoutingContext {
  return {
    caseToken: "01J000000000000000000000AA",
    category: "MEDIO",
    features: makeFeatures(),
    outOfHours: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Criterio 1 — con categoría ALTO no aparece personal capacitado
// ---------------------------------------------------------------------------
test("criterio 1: con categoría ALTO ningún CAPACITATED_STAFF aparece en candidates", () => {
  const engine = makeEngine([
    profile({ id: "psy", kind: "PSYCHOLOGIST", maxCategory: "ALTO" }),
    profile({ id: "staff", kind: "CAPACITATED_STAFF", maxCategory: "MEDIO" }),
  ]);

  const proposal = engine.propose(context({ category: "ALTO" }));

  assert.ok(proposal.candidates.length > 0);
  assert.ok(!proposal.candidates.some((c) => c.responderId === "staff"));
});

test("criterio 1b: con categoría MEDIO sí aparece el personal capacitado", () => {
  const engine = makeEngine([
    profile({ id: "psy", kind: "PSYCHOLOGIST", maxCategory: "ALTO" }),
    profile({ id: "staff", kind: "CAPACITATED_STAFF", maxCategory: "MEDIO" }),
  ]);

  const proposal = engine.propose(context({ category: "MEDIO" }));
  const staff = proposal.candidates.find((c) => c.responderId === "staff");

  assert.notEqual(staff, undefined);
  assert.ok(staff?.tradeoffKeys.includes(TRADEOFF.CAPACITATED_STAFF));
});

// ---------------------------------------------------------------------------
// Criterio 2 — sin elegibles se declara, no se rompe
// ---------------------------------------------------------------------------
test("criterio 2: sin elegibles el resultado es NO_ELIGIBLE_RESPONDER, no un error", () => {
  const engine = makeEngine([]);

  const proposal = engine.propose(context({ category: "ALTO" }));

  assert.equal(proposal.outcome, "NO_ELIGIBLE_RESPONDER");
  assert.deepEqual(proposal.candidates, []);
  assert.notEqual(proposal.outcomeKey, null);
});

test("criterio 2b: un respondedor inactivo no cuenta como elegible", () => {
  const engine = makeEngine([profile({ id: "inactivo", active: false })]);
  const proposal = engine.propose(context({ category: "MEDIO" }));
  assert.equal(proposal.outcome, "NO_ELIGIBLE_RESPONDER");
});

// ---------------------------------------------------------------------------
// Criterio 3 — cobertura fuera de horario
// ---------------------------------------------------------------------------
test("criterio 3: ALTO fuera de horario sin nadie de guardia exige escalado", () => {
  const engine = makeEngine([profile({ id: "psy", onCall: false })]);

  const proposal = engine.propose(context({ category: "ALTO", outOfHours: true }));

  assert.equal(proposal.outcome, "REQUIRES_ON_CALL_ESCALATION");
  assert.equal(proposal.outcomeKey, TRADEOFF.OUT_OF_HOURS);
  // Se devuelven los candidatos para que el portal pueda mostrarlos, pero el resultado
  // deja claro que NO se asigna a alguien que no está.
  assert.ok(proposal.candidates.length > 0);
});

test("criterio 3b: el mismo caso en horario sí se propone con normalidad", () => {
  const engine = makeEngine([profile({ id: "psy", onCall: false })]);
  const proposal = engine.propose(context({ category: "ALTO", outOfHours: false }));
  assert.equal(proposal.outcome, "PROPOSED");
});

test("criterio 3c: fuera de horario con alguien de guardia sí se propone", () => {
  const engine = makeEngine([profile({ id: "psy", onCall: true })]);
  const proposal = engine.propose(context({ category: "ALTO", outOfHours: true }));
  assert.equal(proposal.outcome, "PROPOSED");
  assert.ok(proposal.candidates[0]?.reasonKeys.includes(REASON.ON_CALL));
});

test("criterio 3d: un caso MEDIO fuera de horario no exige escalado", () => {
  const engine = makeEngine([profile({ id: "psy", onCall: false })]);
  const proposal = engine.propose(context({ category: "MEDIO", outOfHours: true }));
  assert.equal(proposal.outcome, "PROPOSED");
});

// ---------------------------------------------------------------------------
// Criterio 4 — determinismo
// ---------------------------------------------------------------------------
test("criterio 4: la misma entrada y los mismos pesos dan la misma propuesta", () => {
  const engine = makeEngine(
    [
      profile({ id: "a", specialties: ["bullying"] }),
      profile({ id: "b", specialties: ["duelo"] }),
      profile({ id: "c", specialties: ["familia"] }),
    ],
    { a: 2, b: 1, c: 1 },
  );

  const first = engine.propose(context({ category: "MEDIO" }));
  const second = engine.propose(context({ category: "MEDIO" }));

  assert.deepEqual(first, second);
});

test("criterio 4b: el orden de los candidatos no depende del orden de siembra", () => {
  const engineA = makeEngine([
    profile({ id: "a", specialties: ["duelo"] }),
    profile({ id: "b", specialties: ["bullying"] }),
  ]);
  const engineB = makeEngine([
    profile({ id: "b", specialties: ["bullying"] }),
    profile({ id: "a", specialties: ["duelo"] }),
  ]);

  const a = engineA.propose(context({ category: "MEDIO" }));
  const b = engineB.propose(context({ category: "MEDIO" }));

  assert.deepEqual(a.candidates.map((c) => c.responderId), b.candidates.map((c) => c.responderId));
});

// ---------------------------------------------------------------------------
// Criterio 5 — equidad: la carga manda sobre la puntuación
// ---------------------------------------------------------------------------
test("criterio 5: un respondedor con 3× la mediana de carga nunca es el primero", () => {
  const engine = makeEngine(
    [
      // El mejor emparejamiento posible… pero desbordado.
      profile({ id: "sobrecargado", specialties: ["bullying"], ageBandsServed: ["15-16"] }),
      // Peor emparejamiento, pero libre.
      profile({ id: "libre-1", specialties: ["duelo"], ageBandsServed: ["15-16"] }),
      profile({ id: "libre-2", specialties: ["familia"], ageBandsServed: ["13-14"] }),
    ],
    // mediana = 1 → el umbral "muy alta" es 2 → 6 cae en la peor banda
    { sobrecargado: 6, "libre-1": 1, "libre-2": 1 },
  );

  const proposal = engine.propose(context({ category: "MEDIO" }));

  assert.equal(proposal.candidates[0]?.responderId, "libre-1");
  assert.notEqual(proposal.candidates[0]?.responderId, "sobrecargado");

  const loaded = proposal.candidates.find((c) => c.responderId === "sobrecargado");
  assert.ok(loaded?.tradeoffKeys.includes(TRADEOFF.VERY_HIGH_LOAD));
});

test("criterio 5b: con cargas parejas decide la puntuación", () => {
  const engine = makeEngine(
    [
      profile({ id: "bueno", specialties: ["bullying"], ageBandsServed: ["15-16"] }),
      profile({ id: "regular", specialties: ["duelo"], ageBandsServed: ["13-14"] }),
    ],
    { bueno: 1, regular: 1 },
  );

  const proposal = engine.propose(context({ category: "MEDIO" }));
  assert.equal(proposal.candidates[0]?.responderId, "bueno");
  assert.ok(proposal.candidates[0]?.reasonKeys.includes(REASON.SPECIALTY_MATCH));
  assert.ok(proposal.candidates[0]?.reasonKeys.includes(REASON.AGE_BAND_MATCH));
});

test("criterio 5c: la concentración reciente se penaliza y se declara", () => {
  const engine = makeEngine(
    [profile({ id: "a" }), profile({ id: "b" })],
    { a: 1, b: 1 },
    { a: 5, b: 1 },
  );

  const proposal = engine.propose(context({ category: "MEDIO" }));
  const a = proposal.candidates.find((c) => c.responderId === "a");

  assert.ok(a?.tradeoffKeys.includes(TRADEOFF.RECENT_CONCENTRATION));
});

// ---------------------------------------------------------------------------
// Criterio 6 — trazabilidad
// ---------------------------------------------------------------------------
test("criterio 6: toda propuesta lleva engineVersion, weightsVersion y catalogVersion", () => {
  const engine = makeEngine([profile({ id: "a" })]);
  const proposal = engine.propose(context({ category: "MEDIO" }));

  assert.equal(proposal.engineVersion, "routing-engine/1.0.0");
  assert.equal(proposal.weightsVersion, "routing-weights/1.0.0-provisional");
  assert.equal(proposal.catalogVersion, "routing-catalog/1.0.0-provisional");
  assert.equal(proposal.proposedAt, AT);
});

// ---------------------------------------------------------------------------
// Criterio 7 — claves de catálogo, nunca prosa
// ---------------------------------------------------------------------------
test("criterio 7: todos los motivos y contrapartidas salen del catálogo", () => {
  const engine = makeEngine(
    [profile({ id: "a", specialties: ["bullying"], isFictional: true }), profile({ id: "b" })],
    { a: 3, b: 1 },
    { a: 4, b: 0 },
  );

  const proposal = engine.propose(context({ category: "MEDIO", outOfHours: true }));

  for (const candidate of proposal.candidates) {
    for (const key of candidate.reasonKeys) {
      assert.ok(REASON_KEYS.includes(key), `motivo fuera de catálogo: ${key}`);
    }
    for (const key of candidate.tradeoffKeys) {
      assert.ok(TRADEOFF_KEYS.includes(key), `contrapartida fuera de catálogo: ${key}`);
    }
  }
});

test("criterio 7b: un perfil de demostración se marca como ficticio", () => {
  const engine = makeEngine([profile({ id: "demo", isFictional: true })]);
  const proposal = engine.propose(context({ category: "MEDIO" }));
  assert.ok(proposal.candidates[0]?.tradeoffKeys.includes(TRADEOFF.FICTIONAL_PROFILE));
});

// ---------------------------------------------------------------------------
// Criterio 8 — el motor nunca asigna
// ---------------------------------------------------------------------------
test("criterio 8: la propuesta no tiene ningún campo de asignación", () => {
  const engine = makeEngine([profile({ id: "a" })]);
  const proposal = engine.propose(context({ category: "MEDIO" }));

  assert.ok(!Object.keys(proposal).includes("assignee"));
  assert.ok(!Object.keys(proposal).includes("assignedTo"));
  assert.ok(!Object.keys(proposal).includes("responderId"));

  for (const candidate of proposal.candidates) {
    assert.ok(!Object.keys(candidate).includes("assignee"));
  }

  // Y no existe ningún método que fije la asignación.
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(engine));
  for (const forbidden of ["assign", "takeCase", "setAssignee"]) {
    assert.ok(!methods.includes(forbidden), `el motor no debe exponer ${forbidden}`);
  }
  assert.deepEqual(methods.filter((m) => m !== "constructor"), ["propose"]);
});

// ---------------------------------------------------------------------------
// Emparejamiento por situación
// ---------------------------------------------------------------------------
test("el tipo de situación se traduce a especialidad", () => {
  const engine = makeEngine([
    profile({ id: "trauma", specialties: ["trauma"] }),
    profile({ id: "duelo", specialties: ["duelo"] }),
  ]);

  const violencia = engine.propose(
    context({
      category: "MEDIO",
      features: makeFeatures({
        situation: { value: "VIOLENCE", provenance: "DECLARED", confidenceBand: "HIGH" },
      }),
    }),
  );
  assert.equal(violencia.candidates[0]?.responderId, "trauma");

  const duelo = engine.propose(
    context({
      category: "MEDIO",
      features: makeFeatures({
        situation: { value: "GRIEF", provenance: "DECLARED", confidenceBand: "HIGH" },
      }),
    }),
  );
  assert.equal(duelo.candidates[0]?.responderId, "duelo");
});

test("OTHER no mapea a ninguna especialidad: no se inventa un emparejamiento", () => {
  const engine = makeEngine([profile({ id: "a", specialties: ["trauma"] })]);
  const proposal = engine.propose(
    context({
      category: "MEDIO",
      features: makeFeatures({
        situation: { value: "OTHER", provenance: "DECLARED", confidenceBand: "HIGH" },
      }),
    }),
  );

  assert.equal(proposal.candidates.length, 1);
  assert.ok(!proposal.candidates[0]?.reasonKeys.includes(REASON.SPECIALTY_MATCH));
});

test("sin situación declarada no se puntúa la especialidad", () => {
  const engine = makeEngine([profile({ id: "a", specialties: ["trauma"] })]);
  const proposal = engine.propose(
    context({ category: "MEDIO", features: makeFeatures({ situation: null }) }),
  );
  assert.ok(!proposal.candidates[0]?.reasonKeys.includes(REASON.SPECIALTY_MATCH));
});

// ---------------------------------------------------------------------------
// Idioma y zona: solo puntúan si el caso los declara
// ---------------------------------------------------------------------------
test("idioma y zona no puntúan si el caso no los declara (el Contrato A no los trae)", () => {
  const engine = makeEngine([profile({ id: "a", languages: ["ES", "AY"], zone: "CENTRO" })]);
  const proposal = engine.propose(context({ category: "MEDIO" }));

  assert.ok(!proposal.candidates[0]?.reasonKeys.includes(REASON.LANGUAGE_MATCH));
  assert.ok(!proposal.candidates[0]?.reasonKeys.includes(REASON.ZONE_MATCH));
});

test("idioma y zona sí puntúan cuando el caso los declara", () => {
  const engine = makeEngine([
    profile({ id: "coincide", languages: ["ES", "QU"], zone: "MIRAFLORES" }),
    profile({ id: "no-coincide", languages: ["ES"], zone: "CENTRO" }),
  ]);

  const proposal = engine.propose(
    context({ category: "MEDIO", preferredLanguages: ["QU"], preferredZone: "MIRAFLORES" }),
  );

  assert.equal(proposal.candidates[0]?.responderId, "coincide");
  assert.ok(proposal.candidates[0]?.reasonKeys.includes(REASON.LANGUAGE_MATCH));
  assert.ok(proposal.candidates[0]?.reasonKeys.includes(REASON.ZONE_MATCH));
});

// ---------------------------------------------------------------------------
// Pesos versionados
// ---------------------------------------------------------------------------
test("cambiar los pesos cambia la propuesta (son configuración, no constantes)", () => {
  const profiles = [
    profile({ id: "especialista", specialties: ["bullying"], ageBandsServed: ["13-14"] }),
    profile({ id: "generalista", specialties: ["duelo"], ageBandsServed: ["15-16"] }),
  ];

  const conEspecialidad = new RoutingEngine({
    directory: (() => {
      const d = new Directory({ clock: FIXED_CLOCK });
      for (const p of profiles) d.upsert(p as unknown as Record<string, unknown>, null);
      return d;
    })(),
    clock: FIXED_CLOCK,
  });
  const soloEdad = new RoutingEngine({
    directory: (() => {
      const d = new Directory({ clock: FIXED_CLOCK });
      for (const p of profiles) d.upsert(p as unknown as Record<string, unknown>, null);
      return d;
    })(),
    weights: {
      specialtyMatch: 1,
      ageBandMatch: 100,
      languageMatch: 0,
      zoneMatch: 0,
      onCall: 0,
      protectiveCoverage: 0,
      loadPenalty: 0,
      veryHighLoadPenalty: 0,
      concentrationPenalty: 0,
    },
    clock: FIXED_CLOCK,
  });

  assert.equal(
    conEspecialidad.propose(context({ category: "MEDIO" })).candidates[0]?.responderId,
    "especialista",
  );
  assert.equal(
    soloEdad.propose(context({ category: "MEDIO" })).candidates[0]?.responderId,
    "generalista",
  );
});
