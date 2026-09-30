import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { CONTRATO_VERSION } from './shared/contract.js';
import { loadConfig } from './shared/config.js';
import { InMemoryStore } from './shared/store.js';
import { createJovenRoutes } from './routes/joven.js';
import { createProfesionalRoutes } from './routes/profesional.js';

/**
 * La API. **Una sola**, dos superficies (`PR-003` §1):
 *
 * - `/joven/**`       → dueño: **A** (`PR-004`, `TASK-013`)
 * - `/profesional/**` → dueño: **C** (`PR-010`…`PR-017`)
 *
 * Las dos comparten este proceso, la configuración y el almacén, pero **no** los
 * contratos de borde: el APK nunca llama a `/profesional` y el portal nunca llama
 * a `/joven` (`PR-020` criterio 12).
 *
 * @returns {Hono} app de Hono. Se sirve con `@hono/node-server` (`main.js`) y se
 *   prueba directamente con `app.request(...)` sin abrir un puerto.
 */
export function createApp({ config = loadConfig(), store = new InMemoryStore(), log } = {}) {
  const app = new Hono();

  // El logger de Hono registra método, ruta, estado y duración: **nunca el cuerpo**
  // (`TASK-021` T6: nada de contenido sensible en logs).
  app.use('*', log ? logger(log) : logger());

  app.get('/health', (c) =>
    c.json(
      { ok: true, contratoVersion: CONTRATO_VERSION, classifier: config.classifierMode },
      200,
    ),
  );

  app.route('/joven', createJovenRoutes({ store }));
  app.route('/profesional', createProfesionalRoutes());

  app.notFound((c) => c.json({ error: 'not_found', message: 'Ruta desconocida.' }, 404));
  // Nunca se filtra el error interno al cliente: podría llevar contenido.
  app.onError((_err, c) => c.json({ error: 'internal_error', message: 'Error interno.' }, 500));

  return app;
}
