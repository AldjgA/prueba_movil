import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createApp } from '../src/app.js';
import {
  CONTRATO_VERSION,
  EstadoCaso,
  SupportRequestState,
  canalVisible,
  psicologoVisible,
  proyectarEstadoParaApk,
} from '../src/shared/contract.js';
import { InMemoryStore } from '../src/shared/store.js';

/**
 * Pruebas de humo del esqueleto (`PR-004` + invariantes de `PR-003` §9).
 *
 * No sustituyen a las pruebas de contrato de `PR-020` (de C): comprueban que el
 * esqueleto **arranca y respeta la frontera**.
 *
 * Se usa `app.request(...)` de Hono: no hace falta abrir un puerto.
 */
function app() {
  return createApp({
    config: { classifierMode: 'off' },
    store: new InMemoryStore(),
    log: () => {},
  });
}

async function registrar(api, profileId = 'perfil-opaco-1') {
  const res = await api.request('/joven/registro', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profileId, deviceKey: 'clave-publica-del-keystore' }),
  });
  return { res, body: await res.json() };
}

function reporteValido(extra = {}) {
  return {
    contratoVersion: CONTRATO_VERSION,
    caseToken: 'provisional',
    origenNivel: 'ROJO',
    rulesetVersion: 'mvp-0.1',
    motivo: ['ideacion_activa'],
    respuestasChequeo: [],
    resumenAutorizado: { scope: [], nota: '' },
    consentimiento: { id: 'c-1', scope: [], otorgadoEn: new Date().toISOString() },
    creadoEn: new Date().toISOString(),
    ...extra,
  };
}

function enviarReporte(api, sessionToken, { body = reporteValido(), idempotencyKey } = {}) {
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${sessionToken}` };
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  return api.request('/joven/casos', { method: 'POST', headers, body: JSON.stringify(body) });
}

test('/health responde con la versión del contrato', async () => {
  const res = await app().request('/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).contratoVersion, CONTRATO_VERSION);
});

test('el registro devuelve sesión y NO devuelve el ProfileId', async () => {
  const { res, body } = await registrar(app(), 'perfil-opaco-1');
  assert.equal(res.status, 201);
  assert.ok(body.sessionToken.startsWith('sess_'));
  assert.equal(
    JSON.stringify(body).includes('perfil-opaco-1'),
    false,
    'El ProfileId no debe volver en la respuesta',
  );
});

test('la ingesta exige sesión', async () => {
  const api = app();
  const res = await api.request('/joven/casos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reporteValido()),
  });
  assert.equal(res.status, 401);
});

test('la ingesta rechaza un cuerpo con ProfileId (PR-020 criterio 2)', async () => {
  const api = app();
  const { body: sesion } = await registrar(api);
  const res = await enviarReporte(api, sesion.sessionToken, {
    body: reporteValido({ profileId: 'se-colo-aqui' }),
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'forbidden_fields');
});

test('la ingesta rechaza un ProfileId anidado (no solo en la raíz)', async () => {
  const api = app();
  const { body: sesion } = await registrar(api);
  const res = await enviarReporte(api, sesion.sessionToken, {
    body: reporteValido({ resumenAutorizado: { scope: [], nota: '', alias: 'escondido' } }),
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'forbidden_fields');
});

test('la ingesta rechaza una versión de contrato no soportada', async () => {
  const api = app();
  const { body: sesion } = await registrar(api);
  const res = await enviarReporte(api, sesion.sessionToken, {
    body: reporteValido({ contratoVersion: '99.0' }),
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'unsupported_contract_version');
});

test('la ingesta es idempotente por Idempotency-Key', async () => {
  const api = app();
  const { body: sesion } = await registrar(api);
  const primera = await (await enviarReporte(api, sesion.sessionToken, { idempotencyKey: 'k-1' })).json();
  const segunda = await (await enviarReporte(api, sesion.sessionToken, { idempotencyKey: 'k-1' })).json();
  assert.equal(primera.caseToken, segunda.caseToken, 'Dos reintentos producen un solo caso');
});

test('el contrato B no filtra al psicólogo antes de ACEPTADO', async () => {
  const api = app();
  const { body: sesion } = await registrar(api);
  const creado = await (await enviarReporte(api, sesion.sessionToken)).json();

  const res = await api.request(`/joven/casos/${creado.caseToken}`, {
    headers: { authorization: `Bearer ${sesion.sessionToken}` },
  });
  assert.equal(res.status, 200);
  const caso = await res.json();
  assert.equal(caso.psicologo, null);
  assert.equal(caso.canalContacto, null);
  assert.equal(caso.estado, EstadoCaso.RECIBIDO);
});

test('un caso no es visible desde otra sesión', async () => {
  const api = app();
  const { body: dueno } = await registrar(api, 'perfil-A');
  const { body: ajeno } = await registrar(api, 'perfil-B');
  const creado = await (await enviarReporte(api, dueno.sessionToken)).json();

  const res = await api.request(`/joven/casos/${creado.caseToken}`, {
    headers: { authorization: `Bearer ${ajeno.sessionToken}` },
  });
  assert.equal(res.status, 404, 'Ni siquiera se confirma que el caso exista');
});

test('la superficie profesional está montada y separada', async () => {
  const api = app();
  const res = await api.request('/profesional');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).superficie, 'profesional');

  // Actualizado por C el 2026-09-30: `/profesional/casos/:caseToken` YA existe (`PR-013`), así
  // que la comprobación usaba una ruta que ya no es cierta. El propósito de esta aserción es que
  // la superficie está **separada**, no que esté vacía; se usa una ruta que sigue pendiente.
  // Ver `puente-red/deliverables/PR-013/NECESIDADES.md` §7.5.
  const ajena = await api.request('/profesional/seguimientos');
  assert.equal(ajena.status, 501, 'Las rutas de C que aún no existen responden 501');
});

test('los 9 estados del caso proyectan a los 7 del APK, sin huérfanos (hallazgo F1)', () => {
  for (const estado of Object.values(EstadoCaso)) {
    const proyectado = proyectarEstadoParaApk(estado);
    assert.ok(proyectado, `El estado ${estado} no tiene proyección al APK`);
    assert.ok(
      Object.values(SupportRequestState).includes(proyectado),
      `La proyección ${proyectado} no es un estado del APK`,
    );
  }
});

test('psicologo y canal se liberan en momentos distintos (conciliación R1 vs R5)', () => {
  assert.equal(psicologoVisible(EstadoCaso.EN_COLA), false);
  assert.equal(psicologoVisible(EstadoCaso.ACEPTADO), true);
  // La clave: aceptar revela los datos, pero NO abre el canal.
  assert.equal(canalVisible(EstadoCaso.ACEPTADO), false);
  assert.equal(canalVisible(EstadoCaso.CONTACTO_HABILITADO), true);
});
