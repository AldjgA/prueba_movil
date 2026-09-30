import { Hono } from 'hono';

/**
 * API Profesional — dueño: **C** (`PR-010`…`PR-017`).
 *
 * ⚠️ **ESTE ARCHIVO ES EL PUNTO DE ENGANCHE DE C.** El esqueleto solo monta la
 * superficie y su guardia de aislamiento; las rutas las añade C.
 *
 * Regla de la frontera (`PR-003` §1, `PR-020` criterio 12): el portal habla
 * **solo** con `/profesional/**` y el APK **solo** con `/joven/**`. Ninguna de
 * las dos superficies llama a la otra.
 */
export function createProfesionalRoutes() {
  const profesional = new Hono();

  // Marcador de vida: sirve para comprobar que la superficie está montada y
  // separada de la del joven.
  profesional.get('/', (c) => c.json({ superficie: 'profesional', estado: 'esqueleto' }, 200));

  // TODO(C): PR-010 (auth + roles), PR-011 (home), PR-012 (alertas),
  //          PR-013 (ficha), PR-014, PR-015, PR-016, PR-017.
  profesional.all('*', (c) =>
    c.json(
      { error: 'not_implemented', message: 'Superficie profesional pendiente (PR-010…PR-017).' },
      501,
    ),
  );

  return profesional;
}
