/**
 * PR-005 · Pruebas de configuración y de la guarda de secretos.
 *
 * Criterio 9: la API key **no** está en el repositorio. La guarda automática de
 * `puente-red/**` la define `TASK-014` (de A, hallazgo F2 de `REVISION-C.md`); aquí se
 * comprueba la parte que sí es de este paquete: que la configuración **nunca** transporta
 * la clave, solo el nombre de la variable de entorno.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_CONFIG, loadConfigFromEnv } from "../config.ts";

test("criterio 9: la configuración por defecto no contiene ningún valor de clave", () => {
  const serialized = JSON.stringify(DEFAULT_CONFIG);
  assert.ok(!serialized.includes("AIza"), "no debe haber una clave de Google embebida");
  // Solo el NOMBRE de la variable, con la convención de `src/shared/config.js` (de A).
  assert.equal(DEFAULT_CONFIG.apiKeyEnvVar, "GOOGLE_GENAI_API_KEY");
});

test("criterio 9b: loadConfigFromEnv no propaga el valor de la clave a la configuración", () => {
  const SECRET = "AIzaSyCLAVE_QUE_NO_DEBE_SALIR";
  const config = loadConfigFromEnv({
    CLASSIFIER_MODE: "on",
    GOOGLE_GENAI_API_KEY: SECRET,
    CLASSIFIER_MODEL: "gemini-2.0-flash",
  });

  const serialized = JSON.stringify(config);
  assert.ok(!serialized.includes(SECRET), "la clave no debe aparecer en la configuración");
  assert.equal(config.enabled, true);
  assert.equal(config.modelVersion, "gemini-2.0-flash");
  assert.equal(config.apiKeyEnvVar, "GOOGLE_GENAI_API_KEY");
});

test("el clasificador está APAGADO por defecto (postura conservadora)", () => {
  assert.equal(DEFAULT_CONFIG.enabled, false);
  assert.equal(loadConfigFromEnv({}).enabled, false);
});

test("CLASSIFIER_MODE manda sobre CLASSIFIER_ENABLED (convención de A)", () => {
  assert.equal(loadConfigFromEnv({ CLASSIFIER_MODE: "on" }).enabled, true);
  assert.equal(loadConfigFromEnv({ CLASSIFIER_MODE: "off" }).enabled, false);
  // Cualquier valor distinto de "on" apaga: no hay modo "quizá".
  assert.equal(loadConfigFromEnv({ CLASSIFIER_MODE: "sí" }).enabled, false);
  // Sin CLASSIFIER_MODE se acepta el booleano de respaldo.
  assert.equal(loadConfigFromEnv({ CLASSIFIER_ENABLED: "true" }).enabled, true);
});

test("loadConfigFromEnv tolera entradas inválidas sin romper", () => {
  const config = loadConfigFromEnv({
    CLASSIFIER_TIMEOUT_MS: "no-es-un-numero",
    CLASSIFIER_MAX_SPEND_USD: "-5",
  });
  assert.equal(config.timeoutMs, DEFAULT_CONFIG.timeoutMs);
  assert.equal(config.maxSpendUsdPerDay, DEFAULT_CONFIG.maxSpendUsdPerDay);
});
