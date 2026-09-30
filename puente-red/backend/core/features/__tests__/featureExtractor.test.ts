/**
 * PR-006 · Pruebas de los criterios de aceptación 1, 2, 3, 4, 5, 6 y 7.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { FeatureExtractor, EXTRACTOR_VERSION, EXTRACTION_PROMPT_VERSION } from "../featureExtractor.ts";
import {
  DOMAINS,
  PROTECTIVE_FACTORS,
  SIGNAL_TAGS,
  SITUATION_TYPES,
  URGENCY_LEVELS,
} from "../vocabulary.ts";
import type { FeatureExtractionPort } from "../extractionPort.ts";
import type { Clock, ReportForExtraction } from "../types.ts";

const FIXED_CLOCK: Clock = { nowEpochMillis: () => 1_700_000_000_000 };

/** Texto con todo lo que NO debe salir del extractor. */
const PII_NOTE =
  "Tengo 15 años y voy al Colegio San Andrés. Mi correo es ana@ejemplo.bo y mi celu es 71234567. @ana_sw";

function makeReport(overrides: Partial<ReportForExtraction> = {}): ReportForExtraction {
  return {
    caseToken: "01J000000000000000000000AA",
    motivo: ["aislamiento", "deterioro_escolar"],
    resumenAutorizado: { scope: ["situacion", "impacto"] },
    ...overrides,
  };
}

function spyPort(response: {
  situationTypes?: readonly string[];
  domains?: readonly string[];
  signalTags?: readonly string[];
  protectiveFactors?: readonly string[];
  urgencyLevels?: readonly string[];
}): { port: FeatureExtractionPort; seen: string[] } {
  const seen: string[] = [];
  return {
    seen,
    port: {
      extract: async (request) => {
        seen.push(request.redactedNote);
        return {
          situationTypes: response.situationTypes ?? [],
          domains: response.domains ?? [],
          signalTags: response.signalTags ?? [],
          protectiveFactors: response.protectiveFactors ?? [],
          urgencyLevels: response.urgencyLevels ?? [],
        };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Criterio 1 — solo valores del vocabulario cerrado
// ---------------------------------------------------------------------------
test("criterio 1: toda característica pertenece al vocabulario cerrado", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(
    makeReport({ motivo: ["aislamiento", "sueno", "amiga_cercana", "donde_ocurre_colegio"] }),
  );

  assert.ok(result.situation === null || (SITUATION_TYPES as readonly string[]).includes(result.situation.value));
  for (const f of result.domains) assert.ok((DOMAINS as readonly string[]).includes(f.value));
  for (const f of result.signals) assert.ok((SIGNAL_TAGS as readonly string[]).includes(f.value));
  for (const f of result.protectiveFactors) {
    assert.ok((PROTECTIVE_FACTORS as readonly string[]).includes(f.value));
  }
  if (result.urgencyDeclared !== null) {
    assert.ok((URGENCY_LEVELS as readonly string[]).includes(result.urgencyDeclared.value));
  }
});

test("criterio 1b: las claves desconocidas se ignoran sin romper", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(
    makeReport({ motivo: ["clave_que_no_existe", "aislamiento", "otra_inventada"] }),
  );
  assert.deepEqual(result.signals.map((f) => f.value), ["ISOLATION"]);
});

// ---------------------------------------------------------------------------
// Criterio 2 — ninguna característica contiene texto libre del reporte
// ---------------------------------------------------------------------------
test("criterio 2: el resultado no contiene texto libre del reporte", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(
    makeReport({ resumenAutorizado: { scope: ["situacion"], note: PII_NOTE } }),
  );

  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes("San Andrés"), "no debe aparecer la institución");
  assert.ok(!serialized.includes("ana@ejemplo.bo"), "no debe aparecer el correo");
  assert.ok(!serialized.includes("71234567"), "no debe aparecer el teléfono");
  assert.ok(!serialized.includes("@ana_sw"), "no debe aparecer el usuario");
  assert.ok(!serialized.includes("Tengo 15"), "no debe aparecer el texto crudo");
});

test("criterio 2b: ni siquiera con un proveedor que devuelve prosa se filtra texto", async () => {
  const { port } = spyPort({
    signalTags: ["ISOLATION", "texto libre que el modelo se inventó", "SLEEP"],
    domains: ["Colegio San Andrés"],
  });
  const extractor = new FeatureExtractor({ port, clock: FIXED_CLOCK });

  // Con nota: es lo que activa el enriquecimiento por LLM.
  const result = await extractor.extract(
    makeReport({
      resumenAutorizado: { scope: ["situacion"], note: "Casi no duerme y está muy sola." },
    }),
  );

  // La prosa y la institución se descartan; solo sobreviven valores del vocabulario,
  // ordenados por vocabulario (no por el orden que devolvió el modelo).
  assert.deepEqual(result.signals.map((f) => f.value), ["SLEEP", "ISOLATION", "SCHOOL_IMPACT"]);
  assert.deepEqual(result.domains, []);
});

// ---------------------------------------------------------------------------
// Criterio 3 — nunca nombre, edad exacta ni institución
// ---------------------------------------------------------------------------
test("criterio 3: la nota llega al modelo REDACTADA", async () => {
  const { port, seen } = spyPort({ signalTags: ["ANXIETY"] });
  const extractor = new FeatureExtractor({ port, clock: FIXED_CLOCK });

  await extractor.extract(
    makeReport({ resumenAutorizado: { scope: ["situacion"], note: PII_NOTE } }),
  );

  assert.equal(seen.length, 1);
  const redacted = seen[0] as string;
  assert.ok(!redacted.includes("15 años"), "la edad exacta no debe llegar al modelo");
  assert.ok(redacted.includes("[banda_edad:15-16]"), "debe llegar la banda");
  assert.ok(!redacted.includes("San Andrés"), "la institución no debe llegar al modelo");
  assert.ok(!redacted.includes("ana@ejemplo.bo"));
  assert.ok(!redacted.includes("71234567"));
  assert.ok(!redacted.includes("@ana_sw"));
});

test("criterio 3b: la banda de edad se recupera de la redacción, nunca la edad exacta", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(
    makeReport({ resumenAutorizado: { scope: ["situacion"], note: "Tengo 15 años." } }),
  );
  assert.equal(result.ageBand, "15-16");
});

test("criterio 3c: sin nota no hay banda de edad (nunca se inventa)", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(makeReport());
  assert.equal(result.ageBand, null);
});

// ---------------------------------------------------------------------------
// Criterio 4 — procedencia declarada vs extraída
// ---------------------------------------------------------------------------
test("criterio 4: se distingue lo DECLARED de lo EXTRACTED", async () => {
  const { port } = spyPort({ signalTags: ["ANXIETY"] });
  const extractor = new FeatureExtractor({ port, clock: FIXED_CLOCK });

  const result = await extractor.extract(
    makeReport({
      motivo: ["aislamiento"],
      resumenAutorizado: { scope: ["situacion"], note: "Se siente muy ansiosa." },
    }),
  );

  const isolation = result.signals.find((f) => f.value === "ISOLATION");
  const anxiety = result.signals.find((f) => f.value === "ANXIETY");

  assert.equal(isolation?.provenance, "DECLARED");
  assert.equal(isolation?.confidenceBand, "HIGH");
  assert.equal(anxiety?.provenance, "EXTRACTED");
  assert.equal(anxiety?.confidenceBand, "MEDIUM");
});

test("criterio 4b: una característica declarada no se degrada a extraída al fusionar", async () => {
  const { port } = spyPort({ signalTags: ["ISOLATION"] });
  const extractor = new FeatureExtractor({ port, clock: FIXED_CLOCK });

  const result = await extractor.extract(
    makeReport({
      motivo: ["aislamiento"],
      resumenAutorizado: { scope: ["situacion"], note: "Está muy sola." },
    }),
  );

  assert.equal(result.signals.length, 1);
  assert.equal(result.signals[0]?.provenance, "DECLARED");
});

// ---------------------------------------------------------------------------
// Criterio 5 — versiones de trazabilidad
// ---------------------------------------------------------------------------
test("criterio 5: toda extracción lleva extractorVersion y promptVersion", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(makeReport());

  assert.equal(result.extractorVersion, EXTRACTOR_VERSION);
  assert.equal(result.promptVersion, EXTRACTION_PROMPT_VERSION);
  assert.ok(result.extractorVersion.length > 0);
  assert.ok(result.promptVersion.length > 0);
  assert.equal(result.extractedAt, new Date(FIXED_CLOCK.nowEpochMillis()).toISOString());
});

// ---------------------------------------------------------------------------
// Criterio 6 — entrada vacía → resultado vacío, no error
// ---------------------------------------------------------------------------
test("criterio 6: un resumen vacío produce un resultado vacío, no un error", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(
    makeReport({ motivo: [], resumenAutorizado: { scope: [] } }),
  );

  assert.equal(result.situation, null);
  assert.deepEqual(result.domains, []);
  assert.deepEqual(result.signals, []);
  assert.deepEqual(result.protectiveFactors, []);
  assert.equal(result.ageBand, null);
  assert.equal(result.urgencyDeclared, null);
  assert.equal(result.caseToken, "01J000000000000000000000AA");
});

test("criterio 6b: una nota vacía no invoca al proveedor", async () => {
  const { port, seen } = spyPort({ signalTags: ["ANXIETY"] });
  const extractor = new FeatureExtractor({ port, clock: FIXED_CLOCK });

  await extractor.extract(makeReport({ resumenAutorizado: { scope: [], note: "   " } }));
  assert.equal(seen.length, 0);
});

// ---------------------------------------------------------------------------
// Criterio 7 — determinismo
// ---------------------------------------------------------------------------
test("criterio 7: la misma entrada y versión producen el mismo resultado", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const report = makeReport({
    motivo: ["sueno", "aislamiento", "amiga_cercana", "donde_ocurre_colegio"],
  });

  const first = await extractor.extract(report);
  const second = await extractor.extract(report);

  assert.deepEqual(first, second);
});

test("criterio 7b: el orden de salida es estable aunque cambie el orden de entrada", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });

  const a = await extractor.extract(makeReport({ motivo: ["aislamiento", "sueno"] }));
  const b = await extractor.extract(makeReport({ motivo: ["sueno", "aislamiento"] }));

  assert.deepEqual(a.signals, b.signals);
});

test("criterio 7c: el orden de salida NO depende del orden que devuelve el modelo", async () => {
  const report = makeReport({
    motivo: ["aislamiento"],
    resumenAutorizado: { scope: ["situacion"], note: "Texto con algo que leer." },
  });

  const first = new FeatureExtractor({
    port: spyPort({ signalTags: ["ANXIETY", "SLEEP"] }).port,
    clock: FIXED_CLOCK,
  });
  const second = new FeatureExtractor({
    port: spyPort({ signalTags: ["SLEEP", "ANXIETY"] }).port,
    clock: FIXED_CLOCK,
  });

  const a = await first.extract(report);
  const b = await second.extract(report);

  assert.deepEqual(a.signals, b.signals);
  assert.deepEqual(a.signals.map((f) => f.value), ["SLEEP", "ISOLATION", "ANXIETY"]);
});

// ---------------------------------------------------------------------------
// Tolerancia a fallos del enriquecimiento
// ---------------------------------------------------------------------------
test("un fallo del proveedor no invalida la extracción base", async () => {
  const failing: FeatureExtractionPort = {
    extract: async () => {
      throw new Error("proveedor caído");
    },
  };
  const extractor = new FeatureExtractor({ port: failing, clock: FIXED_CLOCK });

  const result = await extractor.extract(
    makeReport({
      motivo: ["aislamiento"],
      resumenAutorizado: { scope: ["situacion"], note: "Algo que el modelo debería leer." },
    }),
  );

  assert.deepEqual(result.signals.map((f) => f.value), ["ISOLATION"]);
});

test("un timeout del proveedor no invalida la extracción base", async () => {
  const hanging: FeatureExtractionPort = {
    extract: (_request, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(new Error("abortado"));
        });
      }),
  };
  const extractor = new FeatureExtractor({ port: hanging, clock: FIXED_CLOCK, timeoutMs: 20 });

  const result = await extractor.extract(
    makeReport({
      motivo: ["sueno"],
      resumenAutorizado: { scope: ["situacion"], note: "Texto cualquiera." },
    }),
  );

  assert.deepEqual(result.signals.map((f) => f.value), ["SLEEP"]);
});

// ---------------------------------------------------------------------------
// Mapeo
// ---------------------------------------------------------------------------
test("el mapeo reconoce sinónimos, mayúsculas y acentos", async () => {
  const extractor = new FeatureExtractor({ clock: FIXED_CLOCK });
  const result = await extractor.extract(
    makeReport({ motivo: ["Acoso", "  SUEÑO  ", "evita_recreo", "AUTOLESIÓN"] }),
  );
  assert.equal(result.situation?.value, "BULLYING");
  // "sueño" y "autolesión" se normalizan a "sueno" y "autolesion".
  // Orden por vocabulario: SLEEP · SCHOOL_IMPACT · SELF_HARM.
  assert.deepEqual(result.signals.map((f) => f.value), ["SLEEP", "SCHOOL_IMPACT", "SELF_HARM"]);
});
