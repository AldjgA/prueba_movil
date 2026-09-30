/**
 * PR-005 · Criterio de aceptación 2 (property-based):
 *
 *   "Ninguna entrada produce MEDIO si el origen era ROJO, en 1.000 casos generados."
 *
 * Se ejecuta contra un proveedor **hostil**: uno que siempre responde `MEDIO`. Es la forma
 * correcta de probar la regla D2 — no basta con que el modelo se porte bien; el sistema
 * tiene que ser incapaz de degradar una alarma aunque el modelo lo intente.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { ClassificationService } from "../classificationService.ts";
import { DEFAULT_CONFIG } from "../config.ts";
import { RATIONALE, RATIONALE_KEYS } from "../catalog.ts";
import type { LlmClassifierPort } from "../llmPort.ts";
import type { Clock, IngestedReport, OriginLevel } from "../types.ts";

const FIXED_CLOCK: Clock = { nowEpochMillis: () => 1_700_000_000_000 };
const TOTAL_CASES = 1_000;

/** PRNG determinista (mulberry32): la prueba debe ser reproducible, no aleatoria de verdad. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORIGINS: readonly OriginLevel[] = ["VERDE", "AMARILLO", "ROJO"];
const SCOPES = ["situacion", "frecuencia", "impacto", "apoyo_disponible", "cambios_observados"];

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

function randomReport(rand: () => number, forcedOrigin?: OriginLevel): IngestedReport {
  const motivoCount = 1 + Math.floor(rand() * 3);
  const motivo: string[] = [];
  for (let i = 0; i < motivoCount; i += 1) {
    motivo.push(pick(rand, RATIONALE_KEYS));
  }
  const scopeCount = 1 + Math.floor(rand() * SCOPES.length);
  const scope = SCOPES.slice(0, scopeCount);

  return {
    caseToken: `01J${Math.floor(rand() * 1e12).toString(36).toUpperCase().padStart(10, "0")}`,
    contratoVersion: "1.0",
    origenNivel: forcedOrigin ?? pick(rand, ORIGINS),
    rulesetVersion: `ruleset/1.${Math.floor(rand() * 5)}.0`,
    motivo,
    resumenAutorizado: { scope },
    creadoEn: new Date(FIXED_CLOCK.nowEpochMillis()).toISOString(),
  };
}

/** Proveedor hostil: siempre intenta degradar a MEDIO. */
const hostilePort: LlmClassifierPort = {
  classify: async () => ({ category: "MEDIO", rationaleKeys: [RATIONALE.PERSISTENCIA] }),
};

test(`criterio 2: 1.000 casos con origen ROJO nunca salen MEDIO (proveedor hostil)`, async () => {
  const rand = mulberry32(20260930);
  const service = new ClassificationService({
    port: hostilePort,
    config: { ...DEFAULT_CONFIG, enabled: true },
    clock: FIXED_CLOCK,
  });

  let altoCount = 0;
  for (let i = 0; i < TOTAL_CASES; i += 1) {
    const report = randomReport(rand, "ROJO");
    const { proposal } = await service.classify(report);

    assert.equal(
      proposal.category,
      "ALTO",
      `caso ${i} (${report.caseToken}) salió ${proposal.category} con origen ROJO`,
    );
    assert.equal(proposal.isDegradable, false, `caso ${i} no puede ser degradable`);
    assert.ok(
      proposal.rationaleKeys.includes(RATIONALE.ORIGEN_ROJO_NO_DEGRADABLE),
      `caso ${i} debe justificar la no-degradabilidad`,
    );
    altoCount += 1;
  }

  assert.equal(altoCount, TOTAL_CASES);
});

test("criterio 2b: 1.000 casos de origen mixto — ROJO siempre ALTO, el resto sin restricción", async () => {
  const rand = mulberry32(1);
  const service = new ClassificationService({
    port: hostilePort,
    config: { ...DEFAULT_CONFIG, enabled: true },
    clock: FIXED_CLOCK,
  });

  let rojos = 0;
  let noRojos = 0;

  for (let i = 0; i < TOTAL_CASES; i += 1) {
    const report = randomReport(rand);
    const { proposal } = await service.classify(report);

    if (report.origenNivel === "ROJO") {
      rojos += 1;
      assert.equal(proposal.category, "ALTO");
      assert.equal(proposal.isDegradable, false);
    } else {
      noRojos += 1;
      // El proveedor hostil pide MEDIO y, al no haber rojo, se respeta.
      assert.equal(proposal.category, "MEDIO");
      assert.equal(proposal.isDegradable, true);
    }
  }

  assert.ok(rojos > 0 && noRojos > 0, "el generador debe producir ambos grupos");
  assert.equal(rojos + noRojos, TOTAL_CASES);
});

test("criterio 2c: el rojo no se degrada ni con el proveedor caído", async () => {
  const failing: LlmClassifierPort = {
    classify: async () => {
      throw new Error("caído");
    },
  };
  const service = new ClassificationService({
    port: failing,
    config: { ...DEFAULT_CONFIG, enabled: true },
    clock: FIXED_CLOCK,
  });

  const { proposal } = await service.classify(randomReport(mulberry32(7), "ROJO"));

  assert.equal(proposal.category, "ALTO");
  assert.equal(proposal.isDegradable, false);
  // Un rojo ni siquiera pasa por el fallback: se resuelve antes de llamar al proveedor.
  assert.equal(proposal.fallbackApplied, false);
});
