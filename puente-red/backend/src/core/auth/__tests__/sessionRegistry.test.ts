/**
 * PR-010 · Pruebas del registro de sesiones.
 *
 * El bug que estas pruebas fijan: si `resolve` marcara actividad, **la inactividad no se
 * detectaría nunca** — el propio acceso que se quiere medir reiniciaría el reloj.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { InMemorySessionRegistry } from "../sessionRegistry.ts";
import { DEFAULT_SESSION_POLICY, createSession } from "../session.ts";

const START = 1_700_000_000_000;
const MINUTE = 60_000;

function makeReloj(start = START) {
  let ahora = start;
  return {
    clock: { nowEpochMillis: () => ahora },
    avanzar: (ms: number) => {
      ahora += ms;
    },
  };
}

function makeRegistry(start = START) {
  const { clock, avanzar } = makeReloj(start);
  const registry = new InMemorySessionRegistry({ clock });
  const session = createSession({
    responderId: "psy-1",
    role: "psicologo",
    institutionId: "ong-1",
    isDemo: false,
    nowEpochMillis: start,
  });
  return { registry, session, avanzar, clock };
}

test("emite un token opaco y lo resuelve", () => {
  const { registry, session } = makeRegistry();
  const token = registry.emit(session);

  assert.ok(token.length >= 32, "el token debe ser largo y aleatorio");
  assert.ok(!token.includes("psy-1"), "el token NO debe derivar del responderId");
  assert.equal(registry.resolve(token)?.responderId, "psy-1");
  assert.equal(registry.count(), 1);
});

test("dos emisiones producen tokens distintos", () => {
  const { registry, session } = makeRegistry();
  assert.notEqual(registry.emit(session), registry.emit(session));
});

test("un token desconocido no resuelve", () => {
  const { registry } = makeRegistry();
  assert.equal(registry.resolve("no-existe"), null);
  assert.equal(registry.touch("no-existe"), null);
  assert.equal(registry.revoke("no-existe"), false);
});

test("⚠️ resolve NO marca actividad: la inactividad se sigue detectando", () => {
  const { registry, session, avanzar } = makeRegistry();
  const token = registry.emit(session);

  avanzar(31 * MINUTE);

  // Resolver repetidamente no debe rejuvenecer la sesión.
  registry.resolve(token);
  registry.resolve(token);
  const resuelta = registry.resolve(token);

  assert.equal(
    resuelta?.lastSeenAtEpochMillis,
    START,
    "resolve no puede tocar lastSeenAt, o el reloj de inactividad nunca dispara",
  );
  assert.equal(registry.purgeExpired(START + 31 * MINUTE), 1);
});

test("touch SÍ marca actividad y es explícito", () => {
  const { registry, session, avanzar } = makeRegistry();
  const token = registry.emit(session);

  avanzar(29 * MINUTE);
  const tocada = registry.touch(token);

  assert.equal(tocada?.lastSeenAtEpochMillis, START + 29 * MINUTE);
  assert.equal(registry.purgeExpired(START + 40 * MINUTE), 0, "29 min después sigue viva");
});

test("revoke invalida el token", () => {
  const { registry, session } = makeRegistry();
  const token = registry.emit(session);

  assert.equal(registry.revoke(token), true);
  assert.equal(registry.resolve(token), null);
  assert.equal(registry.count(), 0);
});

test("purgeExpired elimina solo las caducadas", () => {
  const { registry, session, avanzar, clock } = makeRegistry();
  const viejo = registry.emit(session);
  avanzar(20 * MINUTE);
  const nuevo = registry.emit({ ...session, lastSeenAtEpochMillis: clock.nowEpochMillis() });

  avanzar(15 * MINUTE); // el viejo lleva 35 min (caducado), el nuevo 15 (vivo)

  assert.equal(registry.purgeExpired(clock.nowEpochMillis()), 1);
  assert.equal(registry.resolve(viejo), null);
  assert.equal(registry.resolve(nuevo)?.responderId, "psy-1");
});

test("la caducidad absoluta también purga", () => {
  const { registry, session, avanzar } = makeRegistry();
  const token = registry.emit(session);

  avanzar(DEFAULT_SESSION_POLICY.absoluteTtlMs + MINUTE);
  assert.equal(registry.purgeExpired(START + DEFAULT_SESSION_POLICY.absoluteTtlMs + MINUTE), 1);
  assert.equal(registry.resolve(token), null);
});
