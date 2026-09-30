/**
 * PR-007 · Pruebas de los criterios de aceptación 1 a 8.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Directory, ZERO_LOAD_SOURCE } from "../directory.ts";
import { InMemoryAuditSink } from "../audit.ts";
import { DEMO_SEED, seedIsEntirelyFictional } from "../seed.ts";
import type { Clock, LoadSource, ResponderProfile } from "../types.ts";

const FIXED_CLOCK: Clock = { nowEpochMillis: () => 1_700_000_000_000 };
const AT = new Date(FIXED_CLOCK.nowEpochMillis()).toISOString();

function makeDirectory(deps: { audit?: InMemoryAuditSink; loads?: LoadSource } = {}): {
  directory: Directory;
  audit: InMemoryAuditSink;
} {
  const audit = deps.audit ?? new InMemoryAuditSink();
  const directory = new Directory({
    audit,
    loads: deps.loads ?? ZERO_LOAD_SOURCE,
    clock: FIXED_CLOCK,
  });
  return { directory, audit };
}

function seedDirectory(): { directory: Directory; audit: InMemoryAuditSink } {
  const ctx = makeDirectory();
  for (const profile of DEMO_SEED) {
    ctx.directory.upsert(profile as unknown as Record<string, unknown>, null);
  }
  return ctx;
}

const BASE: ResponderProfile = {
  id: "r-1",
  kind: "PSYCHOLOGIST",
  displayName: "Profesional de prueba",
  role: "psicologo",
  specialties: ["trauma"],
  ageBandsServed: ["15-16"],
  languages: ["ES"],
  zone: "CENTRO",
  maxCategory: "ALTO",
  onCall: false,
  active: true,
  isFictional: false,
};

// ---------------------------------------------------------------------------
// Criterio 1 — D5: un CAPACITATED_STAFF nunca puede tener maxCategory = ALTO
// ---------------------------------------------------------------------------
test("criterio 1: se rechaza un CAPACITATED_STAFF con maxCategory ALTO", () => {
  const { directory } = makeDirectory();

  const result = directory.upsert({
    ...BASE,
    id: "staff-1",
    kind: "CAPACITATED_STAFF",
    maxCategory: "ALTO",
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "KIND_CATEGORY_MISMATCH");
  // Y no se ha guardado nada: un rechazo silencioso sería el fallo.
  assert.equal(directory.get("staff-1"), null);
});

test("criterio 1b: un CAPACITATED_STAFF con maxCategory MEDIO sí se acepta", () => {
  const { directory } = makeDirectory();
  const result = directory.upsert({
    ...BASE,
    id: "staff-2",
    kind: "CAPACITATED_STAFF",
    maxCategory: "MEDIO",
  });
  assert.equal(result.ok, true);
});

test("criterio 1c: un PSYCHOLOGIST con maxCategory MEDIO es válido (subconjunto)", () => {
  const { directory } = makeDirectory();
  const result = directory.upsert({ ...BASE, id: "psy-1", kind: "PSYCHOLOGIST", maxCategory: "MEDIO" });
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Criterio 2 — listEligible con ALTO nunca devuelve personal capacitado
// ---------------------------------------------------------------------------
test("criterio 2: con categoría ALTO solo aparecen psicólogos", () => {
  const { directory } = seedDirectory();

  const eligible = directory.listEligible({ category: "ALTO" });

  assert.ok(eligible.length > 0);
  for (const profile of eligible) {
    assert.equal(profile.kind, "PSYCHOLOGIST", `${profile.id} no debería ser elegible para ALTO`);
  }
  assert.ok(!eligible.some((p) => p.kind === "CAPACITATED_STAFF"));
});

test("criterio 2b: con categoría MEDIO sí aparece el personal capacitado", () => {
  const { directory } = seedDirectory();
  const eligible = directory.listEligible({ category: "MEDIO" });
  assert.ok(eligible.some((p) => p.kind === "CAPACITATED_STAFF"));
  assert.equal(eligible.length, DEMO_SEED.length);
});

// ---------------------------------------------------------------------------
// Criterio 3 — todos los perfiles de la demo son ficticios
// ---------------------------------------------------------------------------
test("criterio 3: toda la siembra de demostración está marcada como ficticia", () => {
  assert.equal(seedIsEntirelyFictional(), true);
  for (const profile of DEMO_SEED) {
    assert.equal(profile.isFictional, true, `${profile.id} debe ser ficticio`);
  }
});

test("criterio 3b: la siembra tiene ambos tipos de respondedor (D5 demostrable)", () => {
  const kinds = new Set(DEMO_SEED.map((p) => p.kind));
  assert.ok(kinds.has("PSYCHOLOGIST"));
  assert.ok(kinds.has("CAPACITATED_STAFF"));
});

// ---------------------------------------------------------------------------
// Criterio 4 — toda modificación genera auditoría
// ---------------------------------------------------------------------------
test("criterio 4: crear, actualizar y cambiar de estado dejan evento de auditoría", () => {
  const { directory, audit } = makeDirectory();

  directory.upsert({ ...BASE, id: "r-9" }, "supervisor-1");
  assert.equal(audit.count(), 1);
  assert.equal(audit.events()[0]?.action, "RESPONDER_CREATED");
  assert.equal(audit.events()[0]?.actorId, "supervisor-1");
  assert.equal(audit.events()[0]?.at, AT);

  directory.upsert({ ...BASE, id: "r-9", displayName: "Otro nombre" }, "supervisor-1");
  assert.equal(audit.events()[1]?.action, "RESPONDER_UPDATED");

  directory.setActive("r-9", false, "supervisor-1");
  assert.equal(audit.events()[2]?.action, "RESPONDER_DEACTIVATED");

  directory.setActive("r-9", true, "supervisor-1");
  assert.equal(audit.events()[3]?.action, "RESPONDER_ACTIVATED");

  assert.equal(audit.count(), 4);
});

test("criterio 4b: un upsert rechazado NO genera evento (no hubo cambio)", () => {
  const { directory, audit } = makeDirectory();
  directory.upsert({ ...BASE, id: "bad", kind: "CAPACITATED_STAFF", maxCategory: "ALTO" });
  assert.equal(audit.count(), 0);
});

test("criterio 4c: el evento de auditoría no contiene datos sensibles", () => {
  const { directory, audit } = makeDirectory();
  directory.upsert({ ...BASE, id: "r-9" }, "supervisor-1");

  const serialized = JSON.stringify(audit.events()[0]);
  assert.ok(!serialized.includes("Profesional de prueba"), "no debe guardar el nombre");
  assert.ok(!serialized.includes("trauma"), "no debe guardar las especialidades");
});

// ---------------------------------------------------------------------------
// Criterio 5 — un respondedor inactivo no es elegible
// ---------------------------------------------------------------------------
test("criterio 5: un respondedor inactivo desaparece de listEligible", () => {
  const { directory } = seedDirectory();
  const target = DEMO_SEED[0] as ResponderProfile;

  assert.ok(directory.listEligible({ category: "ALTO" }).some((p) => p.id === target.id));

  directory.setActive(target.id, false, "supervisor-1");

  assert.ok(!directory.listEligible({ category: "ALTO" }).some((p) => p.id === target.id));
  assert.ok(!directory.listEligible({ category: "MEDIO" }).some((p) => p.id === target.id));
});

test("criterio 5b: setActive sobre un respondedor inexistente se rechaza", () => {
  const { directory } = makeDirectory();
  const result = directory.setActive("no-existe", false, "supervisor-1");
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "UNKNOWN_RESPONDER");
});

// ---------------------------------------------------------------------------
// Criterio 6 — el perfil no almacena documento ni domicilio
// ---------------------------------------------------------------------------
test("criterio 6: las claves desconocidas del perfil se descartan", () => {
  const { directory } = makeDirectory();

  const result = directory.upsert({
    ...BASE,
    id: "r-pii",
    documento: "12345678",
    direccion: "Calle Falsa 123",
    telefono: "71234567",
    cedula: "ABC-123",
  });

  assert.equal(result.ok, true);
  const stored = directory.get("r-pii") as ResponderProfile;
  const keys = Object.keys(stored).sort();

  assert.deepEqual(keys, [
    "active",
    "ageBandsServed",
    "displayName",
    "id",
    "isFictional",
    "kind",
    "languages",
    "maxCategory",
    "onCall",
    "role",
    "specialties",
    "zone",
  ]);

  const serialized = JSON.stringify(stored);
  assert.ok(!serialized.includes("12345678"));
  assert.ok(!serialized.includes("Calle Falsa"));
  assert.ok(!serialized.includes("71234567"));
  assert.ok(!serialized.includes("ABC-123"));
});

// ---------------------------------------------------------------------------
// Criterio 7 — la carga se deriva de la cola, no se edita
// ---------------------------------------------------------------------------
test("criterio 7: la carga viene de la fuente externa y no del perfil", () => {
  const loads: LoadSource = {
    loadFor: (responderId) => ({
      responderId,
      openCases: 7,
      casesTakenLast7Days: 3,
      avgAckLatencyMinutes: 12,
    }),
  };
  const { directory } = makeDirectory({ loads });

  // Un intento de fijar la carga en el upsert se ignora: el perfil no la tiene.
  const result = directory.upsert({
    ...BASE,
    id: "r-load",
    load: { openCases: 0 },
    openCases: 0,
  });
  assert.equal(result.ok, true);
  assert.ok(!Object.keys(result.ok === true ? result.profile : {}).includes("load"));
  assert.ok(!Object.keys(result.ok === true ? result.profile : {}).includes("openCases"));

  // Y la lectura viene de la fuente.
  const load = directory.load("r-load");
  assert.equal(load.openCases, 7);
  assert.equal(load.casesTakenLast7Days, 3);
});

// ---------------------------------------------------------------------------
// Criterio 8 — los campos públicos son los únicos que ve el joven
// ---------------------------------------------------------------------------
test("criterio 8: publicView devuelve EXACTAMENTE los tres campos del Contrato C", () => {
  const { directory } = seedDirectory();
  const view = directory.publicView("demo-psicologa-trauma");

  assert.notEqual(view, null);
  assert.deepEqual(Object.keys(view as object).sort(), [
    "especialidad",
    "nombreVisible",
    "rol",
  ]);
  assert.deepEqual(view, {
    nombreVisible: "Ana López",
    rol: "psicologo",
    especialidad: "trauma",
  });
});

test("criterio 8b: publicView no filtra id, zona, tipo ni categoría máxima", () => {
  const { directory } = seedDirectory();
  const serialized = JSON.stringify(directory.publicView("demo-personal-capacitado"));

  for (const leaked of ["demo-personal-capacitado", "MIRAFLORES", "CAPACITATED_STAFF", "MEDIO"]) {
    assert.ok(!serialized.includes(leaked), `publicView no debe exponer "${leaked}"`);
  }
});

test("criterio 8c: publicView devuelve el rol y la especialidad CANÓNICOS de PR-003 §6.1", () => {
  const { directory } = makeDirectory();
  const roles = ["psicologo", "trabajador_social", "orientador", "supervisor"] as const;

  for (const role of roles) {
    directory.upsert({ ...BASE, id: `r-${role}`, role });
    // Sin tabla de conversión: el vocabulario interno ES el del contrato (hallazgo K6 de B).
    assert.equal(directory.publicView(`r-${role}`)?.rol, role);
  }
});

test("criterio 8d: publicView de un respondedor inexistente devuelve null", () => {
  const { directory } = makeDirectory();
  assert.equal(directory.publicView("no-existe"), null);
});

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------
test("la validación rechaza valores fuera del vocabulario", () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ["sin id", { ...BASE, id: "" }, "MISSING_ID"],
    ["sin nombre", { ...BASE, displayName: "  " }, "MISSING_DISPLAY_NAME"],
    ["tipo desconocido", { ...BASE, kind: "VOLUNTARIO" }, "UNKNOWN_KIND"],
    ["rol desconocido", { ...BASE, role: "MEDICINA" }, "UNKNOWN_ROLE"],
    ["especialidad desconocida", { ...BASE, specialties: ["ASTROLOGIA"] }, "UNKNOWN_SPECIALTY"],
    ["idioma desconocido", { ...BASE, languages: ["EN"] }, "UNKNOWN_LANGUAGE"],
    ["banda desconocida", { ...BASE, ageBandsServed: ["19-20"] }, "UNKNOWN_AGE_BAND"],
    ["zona desconocida", { ...BASE, zone: "SANTA_CRUZ" }, "UNKNOWN_ZONE"],
    ["categoría desconocida", { ...BASE, maxCategory: "CRITICO" }, "UNKNOWN_CATEGORY"],
  ];

  for (const [label, input, expected] of cases) {
    const { directory } = makeDirectory();
    const result = directory.upsert(input);
    assert.equal(result.ok, false, label);
    assert.equal(result.ok === false && result.reason, expected, label);
  }
});

// ---------------------------------------------------------------------------
// Determinismo y filtros
// ---------------------------------------------------------------------------
test("listEligible devuelve siempre el mismo orden (determinista)", () => {
  const a = seedDirectory().directory.listEligible({ category: "MEDIO" });
  const b = seedDirectory().directory.listEligible({ category: "MEDIO" });
  assert.deepEqual(a.map((p) => p.id), b.map((p) => p.id));
});

test("los filtros de emparejamiento acotan la lista", () => {
  const { directory } = seedDirectory();

  const bySpecialty = directory.listEligible({ category: "MEDIO", specialties: ["duelo"] });
  assert.deepEqual(bySpecialty.map((p) => p.id), ["demo-psicologo-familia"]);

  const byZone = directory.listEligible({ category: "MEDIO", zone: "MIRAFLORES" });
  assert.deepEqual(byZone.map((p) => p.id), ["demo-personal-capacitado"]);

  const byLanguage = directory.listEligible({ category: "MEDIO", languages: ["QU"] });
  assert.deepEqual(byLanguage.map((p) => p.id), ["demo-personal-capacitado"]);

  const byAge = directory.listEligible({ category: "ALTO", ageBand: "13-14" });
  assert.deepEqual(byAge.map((p) => p.id), ["demo-psicologa-trauma"]);
});
