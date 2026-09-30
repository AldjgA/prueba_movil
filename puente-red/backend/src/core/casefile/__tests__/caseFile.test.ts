/**
 * PR-013 · Pruebas de los criterios de aceptación 1, 2, 3, 4, 6 y 7.
 * (Los criterios 5 y 8 se prueban en la superficie HTTP.)
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Directory, DEMO_SEED } from "../../directory/index.ts";
import {
  CaseQueue,
  InMemoryCaseAuditSink,
  SYSTEM_ACTOR,
  humanActor,
  type Expediente,
} from "../../queue/index.ts";
import { CASE_FILE_SECTIONS, ENCUADRE_KEY, NUNCA_AUTORIZADO, buildCaseFicha } from "../caseFile.ts";

const START = 1_700_000_000_000;
const MINUTO = 60_000;

const EXPEDIENTE: Expediente = {
  motivoKeys: ["aislamiento_persistente", "deterioro_escolar"],
  resumenAutorizado: { scope: ["situacion", "frecuencia", "impacto"] },
  consentimiento: { id: "cons-1", scope: ["situacion", "frecuencia", "impacto"], otorgadoEnEpochMillis: START },
  herramientasAutorizadas: ["breathe", "write"],
};

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
  // Con sumidero de auditoría: sin él, la sección 7 saldría vacía.
  const queue = new CaseQueue({
    directory,
    audit: new InMemoryCaseAuditSink(),
    clock: reloj.clock,
  });
  return { queue, directory, reloj };
}

function sembrar(
  entorno: ReturnType<typeof makeEntorno>,
  opciones: { expediente?: Expediente | null; asignarA?: string } = {},
): void {
  entorno.queue.enqueue(
    {
      caseToken: "PJ-032",
      originLevel: "AMARILLO",
      rulesetVersion: "r1",
      category: null,
      receivedAtEpochMillis: START - 40 * MINUTO,
      ...(opciones.expediente === undefined ? { expediente: EXPEDIENTE } : opciones.expediente === null ? {} : { expediente: opciones.expediente }),
    },
    "k-1",
  );
  entorno.queue.markClassified("PJ-032", "MEDIO");
  entorno.queue.enqueueForRouting("PJ-032");
  if (opciones.asignarA !== undefined) {
    entorno.queue.assign("PJ-032", opciones.asignarA, SYSTEM_ACTOR);
  }
}

const ficha = (entorno: ReturnType<typeof makeEntorno>) =>
  buildCaseFicha({
    queue: entorno.queue,
    directory: entorno.directory,
    caseToken: "PJ-032",
    nowEpochMillis: entorno.reloj.ahora(),
    outOfHours: false,
  });

const PSICOLOGA = DEMO_SEED[0]?.id ?? "demo-psicologa-trauma";

// ---------------------------------------------------------------------------
// Criterio 1 — las 7 secciones, siempre, en orden
// ---------------------------------------------------------------------------
test("criterio 1: la ficha devuelve las 7 secciones del brief §24, en su orden", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const resultado = ficha(entorno);
  assert.notEqual(resultado, null);
  assert.deepEqual(
    resultado?.secciones.map((s) => s.seccion),
    [...CASE_FILE_SECTIONS],
  );
  assert.deepEqual(
    resultado?.secciones.map((s) => s.orden),
    [1, 2, 3, 4, 5, 6, 7],
  );
});

test("criterio 1b: las 7 secciones aparecen aunque falten sus fuentes", () => {
  const entorno = makeEntorno();
  sembrar(entorno, { expediente: null });

  const resultado = ficha(entorno);
  assert.equal(resultado?.secciones.length, 7, "omitir una sección haría creer que ya se ha visto");
});

test("criterio 1c: una sección sin fuente dice POR QUÉ, no queda vacía sin más", () => {
  const entorno = makeEntorno();
  sembrar(entorno, { expediente: null });

  const sinFuente = ficha(entorno)?.secciones.filter((s) => !s.disponible) ?? [];
  assert.ok(sinFuente.length > 0);
  for (const seccion of sinFuente) {
    assert.notEqual(
      seccion.motivoNoDisponibleKey,
      null,
      `${seccion.seccion} debe explicar por qué no está`,
    );
  }
});

// ---------------------------------------------------------------------------
// Criterio 2 — la sección 6 no lleva la conversación
// ---------------------------------------------------------------------------
test("criterio 2: la sección 6 solo lleva el scope autorizado", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const resumen = ficha(entorno)?.secciones.find((s) => s.seccion === "RESUMEN_AUTORIZADO");
  assert.deepEqual(resumen?.claveItems, ["situacion", "frecuencia", "impacto"]);
});

test("criterio 2b: la ficha NUNCA lleva el texto de la conversación", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const serializado = JSON.stringify(ficha(entorno));
  for (const prohibido of ["mensaje", "conversation", "message", "chat", "promptId"]) {
    assert.ok(!serializado.includes(prohibido), `no debe contener "${prohibido}"`);
  }
});

// ---------------------------------------------------------------------------
// Criterio 3 — lo no autorizado se muestra, no se omite
// ---------------------------------------------------------------------------
test("criterio 3: lo que nunca se comparte se declara explícitamente", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const resumen = ficha(entorno)?.secciones.find((s) => s.seccion === "RESUMEN_AUTORIZADO");
  assert.deepEqual(resumen?.noAutorizadoKeys, [...NUNCA_AUTORIZADO]);
  assert.ok(resumen?.noAutorizadoKeys.includes("scope.conversacion_completa"));
  assert.ok(resumen?.noAutorizadoKeys.includes("scope.notas_internas"));
});

// ---------------------------------------------------------------------------
// Criterio 4 — sin identidad del joven
// ---------------------------------------------------------------------------
test("criterio 4: la ficha no contiene identidad del joven", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const serializado = JSON.stringify(ficha(entorno));
  // Ojo con la lista: `scope.notas_internas` SÍ aparece, y debe aparecer — es la clave de
  // catálogo que declara lo que nunca se comparte (criterio 3). Lo que no puede aparecer es el
  // contenido de esas notas.
  for (const prohibido of ["profileId", "profile_id", "alias", "youthId", "deviceKey"]) {
    assert.ok(!serializado.includes(prohibido), `no debe contener "${prohibido}"`);
  }
});

test("criterio 4b: el responsable es el profesional, no el joven", () => {
  const entorno = makeEntorno();
  sembrar(entorno, { asignarA: PSICOLOGA });

  const resultado = ficha(entorno);
  assert.equal(resultado?.responsableId, PSICOLOGA);
  assert.equal(resultado?.responsableNombre, "Ana López");
});

// ---------------------------------------------------------------------------
// Criterio 6 — banda cualitativa, nunca un score
// ---------------------------------------------------------------------------
test("criterio 6: la ficha no contiene ninguna puntuación clínica", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const serializado = JSON.stringify(ficha(entorno));
  for (const prohibido of ["score", "probabilidad", "gravedad", "severidad", "riskScore", "porcentaje"]) {
    assert.ok(!serializado.includes(prohibido), `no debe contener "${prohibido}"`);
  }
});

// ---------------------------------------------------------------------------
// Criterio 7 — el encuadre obligatorio
// ---------------------------------------------------------------------------
test("criterio 7: la cabecera lleva el encuadre de prioridad preliminar", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const resultado = ficha(entorno);
  assert.equal(resultado?.encuadreKey, ENCUADRE_KEY);
  assert.equal(resultado?.encuadreKey, "ficha.encuadre.prioridad_preliminar");
});

test("criterio 7b: la ficha lleva LOS DOS ejes separados", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const resultado = ficha(entorno);
  assert.equal(resultado?.youthLevel, "AMARILLO", "nivel de reglas del APK");
  assert.equal(resultado?.categoria, "MEDIO", "categoría operativa del LLM");
});

// ---------------------------------------------------------------------------
// Secciones con fuente
// ---------------------------------------------------------------------------
test("la sección 1 lleva las claves del catálogo canónico de motivo", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const motivo = ficha(entorno)?.secciones.find((s) => s.seccion === "MOTIVO");
  assert.equal(motivo?.disponible, true);
  assert.deepEqual(motivo?.claveItems, ["aislamiento_persistente", "deterioro_escolar"]);
});

test("la sección 5 sale del scope autorizado y puede estar vacía (y eso es un dato)", () => {
  const entorno = makeEntorno();
  sembrar(entorno, {
    expediente: { ...EXPEDIENTE, herramientasAutorizadas: [] },
  });

  const herramientas = ficha(entorno)?.secciones.find((s) => s.seccion === "HERRAMIENTAS");
  assert.equal(herramientas?.disponible, true, "vacía no es lo mismo que no disponible");
  assert.deepEqual(herramientas?.claveItems, []);
});

test("la sección 7 recoge el historial de acciones del caso", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  const historial = ficha(entorno)?.secciones.find((s) => s.seccion === "HISTORIAL");
  assert.equal(historial?.disponible, true);
  // Alta + clasificado + en cola.
  assert.equal(historial?.eventos.length, 3);
  assert.equal(historial?.eventos[0]?.tipo, "RECIBIDO");
  assert.equal(historial?.eventos.at(-1)?.tipo, "EN_COLA");
  assert.ok(historial?.eventos.every((e) => e.actorKind === "SYSTEM"));
});

// ---------------------------------------------------------------------------
// Consentimiento y estado
// ---------------------------------------------------------------------------
test("el consentimiento se refleja en la cabecera", () => {
  const entorno = makeEntorno();
  sembrar(entorno);
  assert.equal(ficha(entorno)?.consentimiento, "AUTORIZADO");

  entorno.queue.close("PJ-032", humanActor(PSICOLOGA), "CONSENT_WITHDRAWN");
  assert.equal(ficha(entorno)?.consentimiento, "REVOCADO");
});

test("sin consentimiento en el expediente, el estado es NO_CONSTA", () => {
  const entorno = makeEntorno();
  sembrar(entorno, { expediente: { ...EXPEDIENTE, consentimiento: null } });
  assert.equal(ficha(entorno)?.consentimiento, "NO_CONSTA");
});

test("criterio 8: se puede tomar mientras esté en cola o asignado", () => {
  const entorno = makeEntorno();
  sembrar(entorno);
  assert.equal(ficha(entorno)?.puedeTomarse, true);

  entorno.queue.assign("PJ-032", PSICOLOGA, SYSTEM_ACTOR);
  assert.equal(ficha(entorno)?.puedeTomarse, true, "asignado todavía se puede tomar");

  entorno.queue.accept("PJ-032", PSICOLOGA, humanActor(PSICOLOGA));
  assert.equal(ficha(entorno)?.puedeTomarse, false, "ya aceptado: no");
});

// ---------------------------------------------------------------------------
// Casos límite
// ---------------------------------------------------------------------------
test("un caso inexistente devuelve null", () => {
  const entorno = makeEntorno();
  assert.equal(
    buildCaseFicha({
      queue: entorno.queue,
      directory: entorno.directory,
      caseToken: "no-existe",
      nowEpochMillis: START,
      outOfHours: false,
    }),
    null,
  );
});

test("la ficha calcula el tiempo esperando al leer", () => {
  const entorno = makeEntorno();
  sembrar(entorno);

  assert.equal(ficha(entorno)?.esperandoMillis, 40 * MINUTO);
  entorno.reloj.avanzar(5 * MINUTO);
  assert.equal(ficha(entorno)?.esperandoMillis, 45 * MINUTO);
});
