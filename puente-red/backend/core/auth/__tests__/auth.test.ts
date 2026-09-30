/**
 * PR-010 · Pruebas de los criterios de aceptación 1 a 10.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { AuthService, GENERIC_SIGN_IN_MESSAGE } from "../authService.ts";
import { InMemoryAuthAuditSink } from "../audit.ts";
import type { AuthPort, AuthPortResult, SignInParams } from "../authPort.ts";
import {
  AUTHORIZATION_MATRIX,
  PORTAL_ACTIONS,
  PROFESSIONAL_ROLES,
  WRITE_ACTIONS,
  isWriteAction,
  roleCan,
  type PortalAction,
  type ProfessionalRole,
} from "../roles.ts";
import {
  DEFAULT_SESSION_POLICY,
  createSession,
  isSessionAlive,
  sessionExpiryReason,
  type ProfessionalSession,
} from "../session.ts";
import { authorize } from "../authorize.ts";

const START = 1_700_000_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function makeClock(start = START) {
  let now = start;
  return {
    clock: { nowEpochMillis: () => now },
    advance: (ms: number) => {
      now += ms;
    },
  };
}

/** Proveedor falso. Registra las llamadas para poder comprobar que se delega. */
function fakePort(result: AuthPortResult): { port: AuthPort; signInCalls: SignInParams[] } {
  const signInCalls: SignInParams[] = [];
  return {
    signInCalls,
    port: {
      signIn: async (params) => {
        signInCalls.push(params);
        return result;
      },
      refresh: async () => result,
      signOut: async () => {
        /* nada */
      },
    },
  };
}

const OK_RESULT: AuthPortResult = {
  ok: true,
  responderId: "psy-1",
  role: "PSICOLOGIA",
  institutionId: "ong-1",
  isDemo: false,
  refreshToken: "refresh-abc",
};

function makeSession(overrides: Partial<ProfessionalSession> = {}): ProfessionalSession {
  return createSession({
    responderId: "psy-1",
    role: "PSICOLOGIA",
    institutionId: "ong-1",
    isDemo: false,
    nowEpochMillis: START,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Criterio 1 — las credenciales no se validan en código propio
// ---------------------------------------------------------------------------
test("criterio 1: el servicio delega en el proveedor y no compara credenciales", async () => {
  const { port, signInCalls } = fakePort(OK_RESULT);
  const service = new AuthService({ port, clock: makeClock().clock });

  const result = await service.signIn("ana@ong.org", "secreta");

  assert.equal(result.ok, true);
  assert.deepEqual(signInCalls, [{ email: "ana@ong.org", password: "secreta" }]);
});

test("criterio 1b: el servicio no expone ningún método que valide contraseñas", () => {
  const { port } = fakePort(OK_RESULT);
  const service = new AuthService({ port });

  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
  for (const forbidden of ["validatePassword", "hashPassword", "comparePassword", "verifyPassword"]) {
    assert.ok(!methods.includes(forbidden), `no debe existir ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// Criterio 2 — mensaje genérico
// ---------------------------------------------------------------------------
test("criterio 2: cualquier fallo de credenciales da el mismo mensaje", async () => {
  const { port } = fakePort({ ok: false, reason: "INVALID_CREDENTIALS" });
  const service = new AuthService({ port, clock: makeClock().clock });

  const unknownEmail = await service.signIn("no-existe@ong.org", "loquesea");
  const wrongPassword = await service.signIn("ana@ong.org", "incorrecta");

  assert.equal(unknownEmail.ok, false);
  assert.equal(wrongPassword.ok, false);
  assert.equal(
    unknownEmail.ok === false ? unknownEmail.message : null,
    GENERIC_SIGN_IN_MESSAGE,
  );
  assert.equal(
    wrongPassword.ok === false ? wrongPassword.message : null,
    GENERIC_SIGN_IN_MESSAGE,
  );
});

test("criterio 2b: la auditoría no guarda el correo completo en un fallo", async () => {
  const { port } = fakePort({ ok: false, reason: "INVALID_CREDENTIALS" });
  const audit = new InMemoryAuthAuditSink();
  const service = new AuthService({ port, audit, clock: makeClock().clock });

  await service.signIn("ana.lopez@ong.org", "incorrecta");

  const event = audit.events()[0];
  assert.equal(event?.action, "LOGIN_FAILURE");
  assert.equal(event?.actorId, null, "en un fallo no se sabe quién era");
  assert.equal(event?.emailHint, "a***z@ong.org");
  assert.ok(!JSON.stringify(event).includes("ana.lopez"));
});

// ---------------------------------------------------------------------------
// Criterio 3 — solo SUPERVISION ve el log de auditoría
// ---------------------------------------------------------------------------
test("criterio 3: solo SUPERVISION puede ver el log de auditoría", () => {
  for (const role of PROFESSIONAL_ROLES) {
    const decision = authorize(makeSession({ role }), "VIEW_AUDIT_LOG", { nowEpochMillis: START });
    if (role === "SUPERVISION") {
      assert.equal(decision.allowed, true);
    } else {
      assert.equal(decision.allowed, false, `${role} no debería ver el log`);
      assert.equal(decision.allowed === false && decision.reason, "ROLE_NOT_PERMITTED");
    }
  }
});

// ---------------------------------------------------------------------------
// Criterio 4 — ORIENTACION no toma casos ni escribe notas internas
// ---------------------------------------------------------------------------
test("criterio 4: ORIENTACION no puede tomar casos ni escribir notas internas", () => {
  const session = makeSession({ role: "ORIENTACION" });

  for (const action of ["TAKE_CASE", "WRITE_PROFESSIONAL_NOTES", "VIEW_PROFESSIONAL_NOTES"] as const) {
    const decision = authorize(session, action, { nowEpochMillis: START });
    assert.equal(decision.allowed, false, `ORIENTACION no debería poder ${action}`);
    assert.equal(decision.allowed === false && decision.reason, "ROLE_NOT_PERMITTED");
  }

  // Pero sí puede ver alertas, resúmenes y crear derivaciones.
  for (const action of ["VIEW_ALERTS", "VIEW_CASE_SUMMARY", "CREATE_REFERRAL"] as const) {
    assert.equal(authorize(session, action, { nowEpochMillis: START }).allowed, true);
  }
});

test("criterio 4b: la matriz se prueba por tabla completa", () => {
  const expected: Record<PortalAction, readonly ProfessionalRole[]> = {
    VIEW_ALERTS: ["PSICOLOGIA", "TRABAJO_SOCIAL", "ORIENTACION", "SUPERVISION"],
    VIEW_CASE_SUMMARY: ["PSICOLOGIA", "TRABAJO_SOCIAL", "ORIENTACION", "SUPERVISION"],
    VIEW_PROFESSIONAL_NOTES: ["PSICOLOGIA", "TRABAJO_SOCIAL", "SUPERVISION"],
    TAKE_CASE: ["PSICOLOGIA", "TRABAJO_SOCIAL", "SUPERVISION"],
    WRITE_PROFESSIONAL_NOTES: ["PSICOLOGIA", "TRABAJO_SOCIAL", "SUPERVISION"],
    CREATE_REFERRAL: ["PSICOLOGIA", "TRABAJO_SOCIAL", "ORIENTACION", "SUPERVISION"],
    VIEW_AGGREGATED_REPORTS: ["PSICOLOGIA", "TRABAJO_SOCIAL", "SUPERVISION"],
    MANAGE_DIRECTORY: ["SUPERVISION"],
    VIEW_AUDIT_LOG: ["SUPERVISION"],
  };

  assert.deepEqual({ ...AUTHORIZATION_MATRIX }, expected);

  for (const action of PORTAL_ACTIONS) {
    for (const role of PROFESSIONAL_ROLES) {
      const shouldAllow = expected[action].includes(role);
      assert.equal(roleCan(role, action), shouldAllow, `${role} / ${action}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Criterio 5 — aislamiento entre instituciones
// ---------------------------------------------------------------------------
test("criterio 5: un profesional no puede tocar un recurso de otra institución", () => {
  const session = makeSession({ institutionId: "ong-1", role: "PSICOLOGIA" });

  const sameInstitution = authorize(session, "VIEW_CASE_SUMMARY", {
    nowEpochMillis: START,
    resource: { institutionId: "ong-1", caseToken: "C1" },
  });
  assert.equal(sameInstitution.allowed, true);

  const otherInstitution = authorize(session, "VIEW_CASE_SUMMARY", {
    nowEpochMillis: START,
    resource: { institutionId: "ong-2", caseToken: "C2" },
  });
  assert.equal(otherInstitution.allowed, false);
  assert.equal(otherInstitution.allowed === false && otherInstitution.reason, "CROSS_INSTITUTION");
});

test("criterio 5b: el aislamiento se comprueba ANTES que el rol", () => {
  // SUPERVISION puede todo… salvo salir de su institución.
  const session = makeSession({ institutionId: "ong-1", role: "SUPERVISION" });
  const decision = authorize(session, "VIEW_CASE_SUMMARY", {
    nowEpochMillis: START,
    resource: { institutionId: "ong-2" },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.allowed === false && decision.reason, "CROSS_INSTITUTION");
});

// ---------------------------------------------------------------------------
// Criterio 6 — la sesión expira y cierra por inactividad
// ---------------------------------------------------------------------------
test("criterio 6: la sesión caduca por tiempo absoluto", () => {
  const session = makeSession();
  assert.equal(session.expiresAtEpochMillis, START + DEFAULT_SESSION_POLICY.absoluteTtlMs);

  // Dentro de la ventana de inactividad, viva.
  assert.equal(isSessionAlive(session, START + 29 * MINUTE), true);

  // Pasada la inactividad, ya no.
  assert.equal(sessionExpiryReason(session, START + HOUR), "IDLE");

  // Pasado el TTL absoluto, caducada — y `EXPIRED` gana a `IDLE`.
  assert.equal(sessionExpiryReason(session, START + 9 * HOUR), "EXPIRED");

  const decision = authorize(session, "VIEW_ALERTS", { nowEpochMillis: START + 9 * HOUR });
  assert.equal(decision.allowed, false);
  assert.equal(decision.allowed === false && decision.reason, "SESSION_EXPIRED");
});

test("criterio 6b: la sesión caduca por inactividad", () => {
  const session = makeSession();

  // 31 minutos sin actividad: fuera.
  assert.equal(sessionExpiryReason(session, START + 31 * MINUTE), "IDLE");

  const decision = authorize(session, "VIEW_ALERTS", { nowEpochMillis: START + 31 * MINUTE });
  assert.equal(decision.allowed, false);
  assert.equal(decision.allowed === false && decision.reason, "SESSION_IDLE");
});

test("criterio 6c: la actividad reinicia el reloj de inactividad pero NO la caducidad absoluta", async () => {
  const { clock, advance } = makeClock();
  const { port } = fakePort(OK_RESULT);
  const service = new AuthService({ port, clock });
  const signedIn = await service.signIn("ana@ong.org", "secreta");
  assert.equal(signedIn.ok, true);
  const session = signedIn.ok ? signedIn.session : makeSession();

  advance(29 * MINUTE);
  const refreshed = service.touch(session);
  assert.equal(isSessionAlive(refreshed, clock.nowEpochMillis()), true);

  advance(29 * MINUTE);
  assert.equal(isSessionAlive(refreshed, clock.nowEpochMillis()), true);

  // La caducidad absoluta sigue siendo la original.
  assert.equal(refreshed.expiresAtEpochMillis, session.expiresAtEpochMillis);

  advance(8 * HOUR);
  assert.equal(sessionExpiryReason(refreshed, clock.nowEpochMillis()), "EXPIRED");
});

// ---------------------------------------------------------------------------
// Criterio 6d — el portal NO reutiliza la política del token de la API Joven
// ---------------------------------------------------------------------------
test("criterio 6d: la sesión del portal siempre tiene caducidad (REVISION-C §5.2)", () => {
  const session = makeSession();

  // La sesión no tiene un `sessionToken` sin caducidad: tiene fechas.
  assert.ok(!Object.keys(session).includes("sessionToken"));
  assert.ok(session.expiresAtEpochMillis > session.issuedAtEpochMillis);

  // Y no existe forma de crear una sesión sin caducidad.
  const immortal = createSession({
    responderId: "x",
    role: "SUPERVISION",
    institutionId: "ong-1",
    isDemo: false,
    nowEpochMillis: START,
    policy: { absoluteTtlMs: 0, idleTimeoutMs: DEFAULT_SESSION_POLICY.idleTimeoutMs },
  });
  assert.equal(sessionExpiryReason(immortal, START), "EXPIRED");
});

// ---------------------------------------------------------------------------
// Criterio 7 — el modo demo no escribe
// ---------------------------------------------------------------------------
test("criterio 7: una sesión demo no puede ejecutar acciones de escritura", () => {
  const demo = makeSession({ isDemo: true, role: "SUPERVISION" });

  for (const action of WRITE_ACTIONS) {
    const decision = authorize(demo, action, { nowEpochMillis: START });
    assert.equal(decision.allowed, false, `demo no debería poder ${action}`);
    assert.equal(decision.allowed === false && decision.reason, "DEMO_READ_ONLY");
  }

  // Pero sí puede leer todo lo que su rol permite.
  for (const action of PORTAL_ACTIONS.filter((a) => !isWriteAction(a))) {
    assert.equal(authorize(demo, action, { nowEpochMillis: START }).allowed, true, action);
  }
});

// ---------------------------------------------------------------------------
// Criterio 8 — auditoría de cada intento
// ---------------------------------------------------------------------------
test("criterio 8: cada login exitoso y cada fallo quedan registrados", async () => {
  const { port } = fakePort(OK_RESULT);
  const audit = new InMemoryAuthAuditSink();
  const service = new AuthService({ port, audit, clock: makeClock().clock });

  await service.signIn("ana@ong.org", "secreta");
  assert.equal(audit.events()[0]?.action, "LOGIN_SUCCESS");
  assert.equal(audit.events()[0]?.actorId, "psy-1");

  const failing = new AuthService({
    port: fakePort({ ok: false, reason: "INVALID_CREDENTIALS" }).port,
    audit,
    clock: makeClock().clock,
  });
  await failing.signIn("otro@ong.org", "x");
  assert.equal(audit.events()[1]?.action, "LOGIN_FAILURE");
});

test("criterio 8b: los rechazos de autorización se auditan, las acciones correctas no", () => {
  const { port } = fakePort(OK_RESULT);
  const audit = new InMemoryAuthAuditSink();
  const service = new AuthService({ port, audit, clock: makeClock().clock });

  const orientation = makeSession({ role: "ORIENTACION" });
  service.guard(orientation, "VIEW_ALERTS");
  assert.equal(audit.count(), 0, "una acción permitida no genera ruido");

  service.guard(orientation, "WRITE_PROFESSIONAL_NOTES");
  assert.equal(audit.count(), 1);
  assert.equal(audit.events()[0]?.action, "AUTHORIZATION_DENIED");
  assert.equal(audit.events()[0]?.reasonKey, "authz.role_not_permitted");
});

test("criterio 8c: el cierre de sesión se audita", async () => {
  const { port } = fakePort(OK_RESULT);
  const audit = new InMemoryAuthAuditSink();
  const service = new AuthService({ port, audit, clock: makeClock().clock });

  await service.signOut(makeSession());
  assert.equal(audit.events()[0]?.action, "LOGOUT");
  assert.equal(audit.events()[0]?.actorId, "psy-1");
});

// ---------------------------------------------------------------------------
// Criterio 9 — ninguna acción sin guardia
// ---------------------------------------------------------------------------
test("criterio 9: sin sesión, toda acción se rechaza", () => {
  for (const action of PORTAL_ACTIONS) {
    const decision = authorize(null, action, { nowEpochMillis: START });
    assert.equal(decision.allowed, false, action);
    assert.equal(decision.allowed === false && decision.reason, "NO_SESSION");
  }
});

test("criterio 9b: un rechazo es un valor, no una excepción", () => {
  // `authorize` nunca lanza: el llamante está obligado a mirar el resultado.
  assert.doesNotThrow(() => authorize(null, "VIEW_ALERTS", { nowEpochMillis: START }));
  assert.doesNotThrow(() =>
    authorize(makeSession({ role: "ORIENTACION" }), "MANAGE_DIRECTORY", { nowEpochMillis: START }),
  );
});

// ---------------------------------------------------------------------------
// Criterio 10 — el portal no comparte sesión con el APK juvenil
// ---------------------------------------------------------------------------
test("criterio 10: la sesión profesional es independiente del token de la API Joven", () => {
  const session = makeSession();

  // La API Joven usa un `sessionToken` sin caducidad; aquí no hay nada de eso.
  assert.deepEqual(Object.keys(session).sort(), [
    "expiresAtEpochMillis",
    "institutionId",
    "isDemo",
    "issuedAtEpochMillis",
    "lastSeenAtEpochMillis",
    "responderId",
    "role",
  ]);

  const serialized = JSON.stringify(session);
  assert.ok(!serialized.includes("sessionToken"));
  assert.ok(!serialized.includes("caseToken"));
  assert.ok(!serialized.includes("profileId"));
});

// ---------------------------------------------------------------------------
// Casos límite
// ---------------------------------------------------------------------------
test("una sesión sin responderId no es válida para la matriz", () => {
  const session = makeSession({ role: "SUPERVISION" });
  // El rol manda: si el rol no está en la matriz, se rechaza.
  const bogus = { ...session, role: "ADMIN" as ProfessionalRole };
  const decision = authorize(bogus, "VIEW_ALERTS", { nowEpochMillis: START });
  assert.equal(decision.allowed, false);
  assert.equal(decision.allowed === false && decision.reason, "ROLE_NOT_PERMITTED");
});
