import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { loadConfig } from './shared/config.js';

/**
 * Punto de entrada. Un proceso, dos superficies.
 *
 * Pensado para el servidor de **0.1 vCPU / 256 MB sin cold start** (`PR-INFRA` §2):
 * la API solo orquesta; la BD, la auth y el LLM viven fuera.
 */
const config = loadConfig();
const app = createApp({ config });

const servidor = serve({ fetch: app.fetch, port: config.port }, (info) => {
  // Sin secretos en el log de arranque.
  console.log(
    `Puente Red API escuchando en :${info.port} (clasificador: ${config.classifierMode})`,
  );
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    servidor.close(() => process.exit(0));
  });
}
