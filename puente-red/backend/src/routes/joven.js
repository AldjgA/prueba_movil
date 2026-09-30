import { Hono } from 'hono';

import { CONTRATO_VERSION, contratoB } from '../shared/contract.js';
import { leerJson, sesionDe, validarContratoA } from '../shared/middleware.js';

/**
 * API Joven — dueño: **A** (`PR-004`, `TASK-013`).
 *
 * Rutas:
 * - `POST /joven/registro`      — vínculo `ProfileId` ↔ sesión (el `ProfileId` entra
 *                                 aquí y **no vuelve a salir** en ninguna respuesta).
 * - `POST /joven/casos`         — ingesta del reporte (Contrato A, `PR-003` §4).
 * - `GET  /joven/casos/:token`  — estado del caso (Contrato B, `PR-003` §5).
 */
export function createJovenRoutes({ store }) {
  const joven = new Hono();

  // --- POST /joven/registro -------------------------------------------------
  joven.post('/registro', async (c) => {
    const cuerpo = await leerJson(c);
    if (!cuerpo) return c.json({ error: 'invalid_body', message: 'Cuerpo inválido.' }, 400);
    if (typeof cuerpo.profileId !== 'string' || cuerpo.profileId.length === 0) {
      return c.json({ error: 'invalid_profile_id', message: 'Falta profileId.' }, 400);
    }
    if (typeof cuerpo.deviceKey !== 'string' || cuerpo.deviceKey.length === 0) {
      return c.json({ error: 'invalid_device_key', message: 'Falta deviceKey.' }, 400);
    }
    const sessionToken = store.registrarDispositivo({
      profileId: cuerpo.profileId,
      deviceKey: cuerpo.deviceKey,
    });
    // Respuesta deliberadamente pobre: ni el ProfileId ni la deviceKey vuelven.
    return c.json({ sessionToken, contratoVersion: CONTRATO_VERSION }, 201);
  });

  // --- POST /joven/casos (ingesta) ------------------------------------------
  joven.post('/casos', async (c) => {
    const sesion = sesionDe(c, store);
    if (!sesion) return c.json({ error: 'unauthorized', message: 'Falta una sesión válida.' }, 401);

    const cuerpo = await leerJson(c);
    if (!cuerpo) return c.json({ error: 'invalid_body', message: 'Cuerpo inválido.' }, 400);

    const problema = validarContratoA(cuerpo);
    if (problema) return c.json({ error: problema.code, message: problema.message }, 400);

    const { caseToken, nuevo } = store.crearCaso({
      sessionToken: sesion.token,
      contrato: cuerpo,
      idempotencyKey: c.req.header('idempotency-key') ?? null,
    });
    return c.json(
      { caseToken, estado: 'RECIBIDO', contratoVersion: CONTRATO_VERSION },
      nuevo ? 201 : 200,
    );
  });

  // --- GET /joven/casos/:caseToken (estado) ---------------------------------
  joven.get('/casos/:caseToken', (c) => {
    const sesion = sesionDe(c, store);
    if (!sesion) return c.json({ error: 'unauthorized', message: 'Falta una sesión válida.' }, 401);

    const caseToken = c.req.param('caseToken');
    const caso = store.caso(caseToken);
    // "RLS": solo el caso de ESA sesión. Se responde 404 y no 403 para no
    // confirmar siquiera que el caso existe.
    const correlacion = store.correlacion.get(caseToken);
    if (!caso || !correlacion || correlacion.profileId !== sesion.profileId) {
      return c.json({ error: 'not_found', message: 'Caso no encontrado.' }, 404);
    }
    store.auditar('caso_consultado', { caseToken });
    return c.json(contratoB(caso), 200);
  });

  return joven;
}
