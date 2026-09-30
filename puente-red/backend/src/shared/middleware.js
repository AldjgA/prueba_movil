import { CAMPOS_PROHIBIDOS, CONTRATO_VERSION, NivelOrigen } from './contract.js';

/**
 * Middleware de la frontera (`PR-003`).
 *
 * Aquí vive lo que protege el contrato: versión, sesión y **campos prohibidos**.
 * Si algo de esto falla, la petición se rechaza antes de tocar datos.
 */

/** Lee el cuerpo JSON sin lanzar: devuelve `null` si no es un objeto válido. */
export async function leerJson(c) {
  try {
    const cuerpo = await c.req.json();
    return cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo) ? cuerpo : null;
  } catch {
    return null;
  }
}

/** Sesión del APK a partir de `Authorization: Bearer <sessionToken>`. */
export function sesionDe(c, store) {
  const cabecera = c.req.header('authorization') ?? '';
  if (!cabecera.startsWith('Bearer ')) return null;
  const token = cabecera.slice('Bearer '.length).trim();
  if (!token) return null;
  const sesion = store.sesion(token);
  return sesion ? { token, ...sesion } : null;
}

/**
 * Busca campos prohibidos en cualquier profundidad del payload.
 *
 * Es la guarda de `PR-020` criterio 2: si un `ProfileId` o un alias aparece en
 * el cuerpo, la ingesta **debe** rechazarlo. Se comprueba en profundidad porque
 * un campo anidado es exactamente donde se colaría.
 */
export function camposProhibidosPresentes(valor, prohibidos = CAMPOS_PROHIBIDOS) {
  const encontrados = new Set();
  const visitar = (nodo) => {
    if (Array.isArray(nodo)) {
      nodo.forEach(visitar);
      return;
    }
    if (nodo && typeof nodo === 'object') {
      for (const [clave, hijo] of Object.entries(nodo)) {
        if (prohibidos.includes(clave)) encontrados.add(clave);
        visitar(hijo);
      }
    }
  };
  visitar(valor);
  return [...encontrados];
}

/**
 * Valida el Contrato A (`PR-003` §4) en la frontera.
 * Devuelve `null` si es válido, o `{ code, message }` si hay que rechazarlo.
 */
export function validarContratoA(contrato) {
  if (contrato.contratoVersion !== CONTRATO_VERSION) {
    return {
      code: 'unsupported_contract_version',
      message: `Se soporta contratoVersion ${CONTRATO_VERSION}.`,
    };
  }
  const prohibidos = camposProhibidosPresentes(contrato);
  if (prohibidos.length > 0) {
    return {
      code: 'forbidden_fields',
      message: `El reporte no puede contener: ${prohibidos.join(', ')}.`,
    };
  }
  if (!Object.values(NivelOrigen).includes(contrato.origenNivel)) {
    return { code: 'invalid_origen_nivel', message: 'origenNivel debe ser VERDE, AMARILLO o ROJO.' };
  }
  return null;
}
