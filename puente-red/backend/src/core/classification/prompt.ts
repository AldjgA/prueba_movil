/**
 * PR-005 · Construcción del prompt de clasificación.
 *
 * ⚠️ **ESTADO: PROVISIONAL.** La metodología definitiva la fija el clínico en `PR-001` §5–§6.
 * Este prompt implementa **solo** lo que ya está cerrado en los documentos del repo:
 * el guardrail #2 (`PR-001` §2) y la regla dura D2 (`PR-003` §9.4).
 *
 * Lo que el prompt **no** hace, por diseño (`PR-001` §6.2):
 * - no pide diagnóstico, gravedad clínica ni estimación de riesgo de vida;
 * - no permite decidir una derivación;
 * - no permite cerrar un caso;
 * - no genera texto para el joven.
 */

import type { LlmClassificationRequest } from "./llmPort.ts";

export const PROMPT_VERSION = "classification-prompt/1.0.0-provisional";

/**
 * Instrucciones fijas. Se mantienen separadas del contenido del caso para que
 * `promptVersion` identifique exactamente esta plantilla.
 */
export const SYSTEM_INSTRUCTIONS = [
  "Eres un componente de triaje operativo de una plataforma de acompañamiento a adolescentes.",
  "",
  "Tu única tarea es proponer una CATEGORÍA OPERATIVA para que un equipo humano priorice su trabajo.",
  "Las categorías son exactamente dos:",
  '  - "MEDIO": requiere revisión programada; puede resolverlo personal capacitado.',
  '  - "ALTO": requiere contacto humano el mismo día, con psicólogo implicado.',
  "",
  "REGLAS DURAS:",
  "1. NO emites diagnóstico, gravedad clínica ni estimación de riesgo de vida.",
  "2. NO decides derivaciones ni cierras casos.",
  "3. Tu salida es una PROPUESTA: una persona la valida aceptando el caso.",
  "4. Si el nivel de origen es ROJO, la categoría es ALTO y no puede ser otra cosa.",
  "5. La justificación se expresa SOLO con claves de la lista permitida. Nunca prosa.",
  "",
  "Devuelve exclusivamente un objeto JSON con esta forma:",
  '{ "category": "MEDIO" | "ALTO", "rationaleKeys": ["<clave>", ...] }',
].join("\n");

/**
 * Serializa el caso **sin identidad**. Solo el `caseToken`, el nivel de origen, el motivo
 * (claves) y el alcance autorizado.
 */
export function buildPrompt(request: LlmClassificationRequest): string {
  const caseBlock = {
    caseToken: request.caseToken,
    origenNivel: request.origenNivel,
    motivo: [...request.motivo],
    alcanceAutorizado: [...request.authorizedScope],
  };

  return [
    SYSTEM_INSTRUCTIONS,
    "",
    "Claves de justificación permitidas:",
    request.allowedRationaleKeys.map((k) => `  - ${k}`).join("\n"),
    "",
    "Caso (sin identidad):",
    JSON.stringify(caseBlock, null, 2),
    "",
    "Responde SOLO con el JSON.",
  ].join("\n");
}
