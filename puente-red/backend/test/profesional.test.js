import { Hono } from 'hono';
import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthService, InMemorySessionRegistry } from '../src/core/auth/index.ts';
import { createProfesionalRoutes } from '../src/routes/profesional.js';

/**
 * PR-010 · Pruebas de la superficie `/profesional`.
 *
 * Se prueba `createProfesionalRoutes` directamente sobre una app de Hono, sin abrir puerto y
 * sin tocar `src/app.js` (de A): `app.request(...)` es suficiente.
 */

const PASSWORD = 'contrasena-de-prueba';
const EMAIL = 'demo@puentered.org';
const START = 1_700_000_000_000;
const MINUTE = 60_000;

function makeReloj(start = START) {
  let ahora = start;
  return {
    clock: { nowEpochMillis: () => ahora },
    avanzar: (ms) => {
      ahora += ms;
    },
  };
}

/** App de prueba con el adaptador de demostración y credenciales en el entorno inyectado. */
function makeApp({ env, authService, clock } = {}) {
  const reloj = clock ?? makeReloj().clock;
  const app = new Hono();
  app.route(
    '/profesional',
    createProfesionalRoutes({
      env: env ?? { PUENTE_DEMO_PASSWORD: PASSWORD, PUENTE_DEMO_EMAIL: EMAIL },
      authService,
      registry: new InMemorySessionRegistry({ clock: reloj }),
      clock: reloj,
    }),
  );
  return app;
}

async function login(app, password = PASSWORD) {
  const respuesta = await app.request('/profesional/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password }),
  });
  return { respuesta, cuerpo: await respuesta.json() };
}

const conToken = (token) => ({ headers: { authorization: `Bearer ${token}` } });

// ---------------------------------------------------------------------------
// Marcador de vida
// ---------------------------------------------------------------------------
test('la superficie profesional responde y declara su estado', async () => {
  const app = makeApp();
  const respuesta = await app.request('/profesional');
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.equal(cuerpo.superficie, 'profesional');
  assert.equal(cuerpo.estado, 'pr-010');
});

// ---------------------------------------------------------------------------
// Criterio 1 y 2 — login
// ---------------------------------------------------------------------------
test('criterio 1: sin contraseña configurada NADIE entra (fail closed)', async () => {
  const app = makeApp({ env: {} });
  const { respuesta, cuerpo } = await login(app);

  assert.equal(respuesta.status, 401);
  assert.equal(cuerpo.error, 'unauthorized');
});

test('un login correcto devuelve un token opaco y la caducidad', async () => {
  const app = makeApp();
  const { respuesta, cuerpo } = await login(app);

  assert.equal(respuesta.status, 200);
  assert.equal(typeof cuerpo.token, 'string');
  assert.ok(cuerpo.token.length >= 32, 'el token debe ser opaco y largo');
  assert.equal(cuerpo.rol, 'supervisor');
  assert.equal(cuerpo.esDemo, true);
  assert.ok(new Date(cuerpo.expiraEn).getTime() > START);
});

test('criterio 2: correo inexistente y contraseña incorrecta dan la MISMA respuesta', async () => {
  const app = makeApp();

  const incorrecta = await login(app, 'otra-cosa');
  const inexistente = await app.request('/profesional/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'nadie@ejemplo.org', password: PASSWORD }),
  });

  assert.equal(incorrecta.respuesta.status, 401);
  assert.equal(inexistente.status, 401);

  const cuerpoA = incorrecta.cuerpo;
  const cuerpoB = await inexistente.json();

  // Mismo mensaje y mismo motivo: el login no es un oráculo de correos existentes.
  assert.equal(cuerpoA.message, cuerpoB.message);
  assert.equal(cuerpoA.reason, cuerpoB.reason);
});

test('un cuerpo malformado se rechaza con 400', async () => {
  const app = makeApp();
  const respuesta = await app.request('/profesional/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL }),
  });
  assert.equal(respuesta.status, 400);
});

// ---------------------------------------------------------------------------
// Criterio 9 — ninguna acción sin guardia
// ---------------------------------------------------------------------------
test('criterio 9: sin token, las rutas guardadas responden 401', async () => {
  const app = makeApp();

  for (const ruta of ['/profesional/session', '/profesional/auditoria']) {
    const respuesta = await app.request(ruta);
    assert.equal(respuesta.status, 401, ruta);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.reason, 'authz.no_session');
  }
});

test('criterio 9b: un token inventado no vale', async () => {
  const app = makeApp();
  const respuesta = await app.request('/profesional/session', conToken('token-inventado'));
  assert.equal(respuesta.status, 401);
});

// ---------------------------------------------------------------------------
// Sesión y matriz
// ---------------------------------------------------------------------------
test('la sesión devuelve el rol, la institución y las acciones permitidas', async () => {
  const app = makeApp();
  const { cuerpo } = await login(app);

  const respuesta = await app.request('/profesional/session', conToken(cuerpo.token));
  const sesion = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.equal(sesion.rol, 'supervisor');
  assert.equal(sesion.esDemo, true);
  assert.ok(sesion.accionesPermitidas.includes('VIEW_AUDIT_LOG'));
  assert.ok(sesion.accionesPermitidas.includes('MANAGE_DIRECTORY'));
});

test('un rol sin permiso recibe 403 y el motivo', async () => {
  // Puerto que devuelve un rol NO supervisor.
  const port = {
    signIn: async () => ({
      ok: true,
      responderId: 'orientador-1',
      role: 'orientador',
      institutionId: 'ong-1',
      isDemo: false,
      refreshToken: 'r',
    }),
    refresh: async () => ({ ok: false, reason: 'PROVIDER_ERROR' }),
    signOut: async () => {},
  };
  const reloj = makeReloj();
  const app = makeApp({
    authService: new AuthService({ port, clock: reloj.clock }),
    clock: reloj.clock,
  });

  const { cuerpo } = await login(app);
  const respuesta = await app.request('/profesional/auditoria', conToken(cuerpo.token));

  assert.equal(respuesta.status, 403);
  const error = await respuesta.json();
  assert.equal(error.error, 'forbidden');
  assert.equal(error.reason, 'authz.role_not_permitted');
});

test('criterio 3: el rol supervisor sí ve el log de auditoría', async () => {
  const app = makeApp();
  const { cuerpo } = await login(app);

  const respuesta = await app.request('/profesional/auditoria', conToken(cuerpo.token));
  const { eventos } = await respuesta.json();

  assert.equal(respuesta.status, 200);
  assert.ok(Array.isArray(eventos));
  assert.equal(eventos[0].action, 'LOGIN_SUCCESS');
  // El evento no lleva el correo completo.
  assert.ok(!JSON.stringify(eventos).includes('demo@puentered.org'));
});

test('criterio 8: un login fallido también queda auditado', async () => {
  const app = makeApp();
  await login(app, 'mal');

  const { cuerpo } = await login(app);
  const respuesta = await app.request('/profesional/auditoria', conToken(cuerpo.token));
  const { eventos } = await respuesta.json();

  const fallos = eventos.filter((e) => e.action === 'LOGIN_FAILURE');
  assert.equal(fallos.length, 1);
  assert.equal(fallos[0].actorId, null);
});

// ---------------------------------------------------------------------------
// Caducidad
// ---------------------------------------------------------------------------
test('criterio 6: la sesión caduca por inactividad', async () => {
  const reloj = makeReloj();
  const app = makeApp({ clock: reloj.clock });
  const { cuerpo } = await login(app);

  // 31 minutos sin actividad.
  reloj.avanzar(31 * MINUTE);

  const respuesta = await app.request('/profesional/session', conToken(cuerpo.token));
  assert.equal(respuesta.status, 401);
  const error = await respuesta.json();
  assert.equal(error.reason, 'authz.idle');
});

test('criterio 6b: la actividad reinicia el reloj de inactividad', async () => {
  const reloj = makeReloj();
  const app = makeApp({ clock: reloj.clock });
  const { cuerpo } = await login(app);

  reloj.avanzar(29 * MINUTE);
  assert.equal((await app.request('/profesional/session', conToken(cuerpo.token))).status, 200);

  reloj.avanzar(29 * MINUTE);
  assert.equal(
    (await app.request('/profesional/session', conToken(cuerpo.token))).status,
    200,
    'la actividad debe haber reiniciado el reloj',
  );
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
test('el logout revoca el token', async () => {
  const app = makeApp();
  const { cuerpo } = await login(app);

  const salida = await app.request('/profesional/auth/logout', {
    method: 'POST',
    ...conToken(cuerpo.token),
  });
  assert.equal(salida.status, 204);

  const despues = await app.request('/profesional/session', conToken(cuerpo.token));
  assert.equal(despues.status, 401);
});

test('el logout sin token se rechaza', async () => {
  const app = makeApp();
  const respuesta = await app.request('/profesional/auth/logout', { method: 'POST' });
  assert.equal(respuesta.status, 401);
});

// ---------------------------------------------------------------------------
// Superficie pendiente y frontera
// ---------------------------------------------------------------------------
test('las rutas de PR-011…PR-017 responden 501 y enumeran lo implementado', async () => {
  const app = makeApp();
  const respuesta = await app.request('/profesional/alertas');

  assert.equal(respuesta.status, 501);
  const cuerpo = await respuesta.json();
  assert.equal(cuerpo.error, 'not_implemented');
  assert.ok(cuerpo.implementado.includes('/auth/login'));
});

test('criterio 12: la superficie profesional no responde en /joven', async () => {
  const app = makeApp();
  const respuesta = await app.request('/joven/casos');
  assert.equal(respuesta.status, 404);
});
