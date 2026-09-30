/**
 * PR-005 · Pruebas de los criterios de aceptación 1, 3, 4, 5, 6, 7, 8 y 10.
 * El criterio 2 (property-based) vive en `d2Rule.test.ts`.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { ClassificationService, hashInput } from "../classificationService.ts";
import { DEFAULT_CONFIG, type ClassifierConfig } from "../config.ts";
import { PROVISIONAL_CATALOG, RATIONALE } from "../catalog.ts";
import { assertNoIdentityInPayload, type LlmClassifierPort, type LlmClassificationRequest, type LlmClassificationResponse } from "../llmPort.ts";
import { buildPrompt } from "../prompt.ts";
import type { Clock, IngestedReport } from "../types.ts";

const FIXED_CLOCK: Clock = { nowEpochMillis: () => 1_700_000_000_000 };

const NOTE = "texto privado del joven que no debe salir del servidor";

function makeReport(overrides: Partial<IngestedReport> = {}): IngestedReport {
  return {
    caseToken: "01J000000000000000000000AA",
    contratoVersion: "1.0",
    origenNivel: "AMARILLO",
    rulesetVersion: "ruleset/1.0.0",
    motivo: [RATIONALE.AISLAMIENTO],
    resumenAutorizado: { scope: ["situacion", "frecuencia"], note: NOTE },
    creadoEn: "2026-09-30T00:00:00.000Z",
    ...overrides,
  };
}

function config(overrides: Partial<ClassifierConfig> = {}): ClassifierConfig {
  return { ...DEFAULT_CONFIG, enabled: true, timeoutMs: 1_000, ...overrides };
}

/** Puerto espía: registra la petición que recibe. */
function spyPort(response: LlmClassificationResponse): {
  port: LlmClassifierPort;
  calls: LlmClassificationRequest[];
} {
  const calls: LlmClassificationRequest[] = [];
  return {
    calls,
    port: {
      classify: async (request) => {
        calls.push(request);
        return response;
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Criterio 1 — un caso con OrigenNivel ROJO sale siempre ALTO
// ---------------------------------------------------------------------------
test("criterio 1: origen ROJO produce ALTO y no es degradable", async () => {
  const { port, calls } = spyPort({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const outcome = await service.classify(makeReport({ origenNivel: "ROJO" }));

  assert.equal(outcome.proposal.category, "ALTO");
  assert.equal(outcome.proposal.isDegradable, false);
  assert.equal(outcome.proposal.fallbackApplied, false);
  // Y lo más importante: el modelo NO llega a decidir sobre un rojo.
  assert.equal(calls.length, 0, "el proveedor no debe ser consultado cuando el origen es ROJO");
});

// ---------------------------------------------------------------------------
// Criterio 3 — trazabilidad obligatoria
// ---------------------------------------------------------------------------
test("criterio 3: toda propuesta lleva modelVersion, promptVersion e inputHash", async () => {
  const { port } = spyPort({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const { proposal } = await service.classify(makeReport());

  assert.ok(proposal.modelVersion.length > 0);
  assert.ok(proposal.promptVersion.length > 0);
  assert.match(proposal.inputHash, /^[0-9a-f]{64}$/);
  assert.equal(proposal.producedAt, new Date(FIXED_CLOCK.nowEpochMillis()).toISOString());
});

test("criterio 3b: el hash es estable y distingue entradas distintas", () => {
  const a = hashInput(makeReport());
  const b = hashInput(makeReport());
  const c = hashInput(makeReport({ origenNivel: "ROJO" }));
  assert.equal(a, b);
  assert.notEqual(a, c);
});

// ---------------------------------------------------------------------------
// Criterio 4 — timeout → ALTO con fallbackApplied
// ---------------------------------------------------------------------------
test("criterio 4: un timeout del proveedor produce ALTO con fallbackApplied", async () => {
  const hanging: LlmClassifierPort = {
    classify: (_request, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new Error("abortado"));
        });
      }),
  };
  const service = new ClassificationService({
    port: hanging,
    config: config({ timeoutMs: 20 }),
    clock: FIXED_CLOCK,
  });

  const { proposal } = await service.classify(makeReport());

  assert.equal(proposal.category, "ALTO");
  assert.equal(proposal.fallbackApplied, true);
  assert.deepEqual(proposal.rationaleKeys, [RATIONALE.FALLBACK_CONSERVADOR]);
});

test("criterio 4b: un error del proveedor también produce el fallback conservador", async () => {
  const failing: LlmClassifierPort = {
    classify: async () => {
      throw new Error("proveedor caído");
    },
  };
  const service = new ClassificationService({ port: failing, config: config(), clock: FIXED_CLOCK });

  const { proposal } = await service.classify(makeReport());
  assert.equal(proposal.category, "ALTO");
  assert.equal(proposal.fallbackApplied, true);
});

// ---------------------------------------------------------------------------
// Criterio 5 — clasificador apagado: ALTO y el caso no se bloquea
// ---------------------------------------------------------------------------
test("criterio 5: con el clasificador apagado la salida es ALTO y el caso no se bloquea", async () => {
  const { port, calls } = spyPort({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] });
  const service = new ClassificationService({
    port,
    config: config({ enabled: false }),
    clock: FIXED_CLOCK,
  });

  const outcome = await service.classify(makeReport());

  assert.equal(outcome.proposal.category, "ALTO");
  assert.equal(outcome.proposal.fallbackApplied, true);
  assert.equal(calls.length, 0);
  // El caso sí transiciona: no queda atascado en RECIBIDO.
  assert.equal(outcome.transition.to, "CLASIFICADO");
});

test("criterio 5b: sin proveedor configurado (port null) también hay fallback", async () => {
  const service = new ClassificationService({ port: null, config: config(), clock: FIXED_CLOCK });
  const { proposal } = await service.classify(makeReport());
  assert.equal(proposal.category, "ALTO");
  assert.equal(proposal.fallbackApplied, true);
});

// ---------------------------------------------------------------------------
// Criterio 6 — el modelo nunca recibe ProfileId ni alias
// ---------------------------------------------------------------------------
test("criterio 6: la petición al proveedor no contiene ningún identificador personal", async () => {
  const { port, calls } = spyPort({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  await service.classify(makeReport());

  assert.equal(calls.length, 1);
  const serialized = JSON.stringify(calls[0]);
  for (const forbidden of ["profileId", "profile_id", "alias", "youthId", "deviceKey", "mac"]) {
    assert.ok(
      !serialized.toLowerCase().includes(forbidden.toLowerCase()),
      `la petición no debe contener "${forbidden}"`,
    );
  }
});

test("criterio 6b: la guarda de frontera rechaza un payload con identidad", () => {
  assert.throws(() => {
    assertNoIdentityInPayload({ contents: [], profileId: "abc" });
  }, /identificador prohibido/);

  assert.throws(() => {
    assertNoIdentityInPayload({ contents: [], alias: "Alex" });
  }, /identificador prohibido/);

  // Un payload legítimo pasa sin ruido.
  assert.doesNotThrow(() => {
    assertNoIdentityInPayload({ contents: [], caseToken: "01J..." });
  });
});

test("criterio 6c: el prompt no incluye el alias ni el ProfileId", () => {
  const prompt = buildPrompt({
    caseToken: "01J000000000000000000000AA",
    origenNivel: "AMARILLO",
    motivo: [RATIONALE.AISLAMIENTO],
    authorizedScope: ["situacion"],
    modelVersion: "m",
    promptVersion: "p",
    catalogVersion: "c",
    allowedRationaleKeys: PROVISIONAL_CATALOG.keys,
  });
  assert.ok(prompt.includes("01J000000000000000000000AA"));
  assert.ok(!/profileId|alias/i.test(prompt));
});

// ---------------------------------------------------------------------------
// Criterio 7 — rationaleKeys solo del catálogo vigente
// ---------------------------------------------------------------------------
test("criterio 7: se descartan las claves que no están en el catálogo", async () => {
  const { port } = spyPort({
    category: "MEDIO",
    rationaleKeys: [RATIONALE.PERSISTENCIA, "clave_inventada_por_el_modelo", RATIONALE.PERSISTENCIA],
  });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const { proposal } = await service.classify(makeReport());

  assert.deepEqual(proposal.rationaleKeys, [RATIONALE.PERSISTENCIA]);
});

test("criterio 7b: si el modelo solo devuelve claves inválidas, se aplica el fallback", async () => {
  const { port } = spyPort({ category: "MEDIO", rationaleKeys: ["inventada"] });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const { proposal } = await service.classify(makeReport());
  assert.equal(proposal.fallbackApplied, true);
  assert.equal(proposal.category, "ALTO");
});

// ---------------------------------------------------------------------------
// Criterio 8 — el prompt no se retiene: solo se guarda el hash
// ---------------------------------------------------------------------------
test("criterio 8: la propuesta no retiene el contenido del resumen, solo su hash", async () => {
  const { port } = spyPort({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const { proposal } = await service.classify(makeReport());
  const serialized = JSON.stringify(proposal);

  assert.ok(!serialized.includes(NOTE), "la propuesta no debe contener la nota del joven");
  assert.ok(!serialized.includes("situacion"), "la propuesta no debe contener el scope en claro");
  assert.match(proposal.inputHash, /^[0-9a-f]{64}$/);
});

// ---------------------------------------------------------------------------
// Criterio 10 — transición RECIBIDO → CLASIFICADO
// ---------------------------------------------------------------------------
test("criterio 10: la clasificación produce la transición RECIBIDO → CLASIFICADO", async () => {
  const { port } = spyPort({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const { transition } = await service.classify(makeReport());

  assert.equal(transition.from, "RECIBIDO");
  assert.equal(transition.to, "CLASIFICADO");
  assert.equal(transition.at, new Date(FIXED_CLOCK.nowEpochMillis()).toISOString());
});

// ---------------------------------------------------------------------------
// Camino normal
// ---------------------------------------------------------------------------
test("camino normal: un amarillo puede clasificarse como MEDIO", async () => {
  const { port } = spyPort({
    category: "MEDIO",
    rationaleKeys: [RATIONALE.PERSISTENCIA, RATIONALE.ACUMULACION_DE_FACTORES],
  });
  const service = new ClassificationService({ port, config: config(), clock: FIXED_CLOCK });

  const { proposal } = await service.classify(makeReport());

  assert.equal(proposal.category, "MEDIO");
  assert.equal(proposal.isDegradable, true);
  assert.equal(proposal.fallbackApplied, false);
  assert.deepEqual(proposal.rationaleKeys, [
    RATIONALE.PERSISTENCIA,
    RATIONALE.ACUMULACION_DE_FACTORES,
  ]);
});
