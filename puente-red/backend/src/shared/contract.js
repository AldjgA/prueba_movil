/**
 * Contrato de datos Joven ↔ Red (`PR-003`) y de la ingesta (`PR-004`).
 *
 * ÚNICA fuente de verdad de los nombres que cruzan la frontera. Vive en `shared/`
 * (dueño: Agente A); C **declara** cambios, no los aplica
 * (`CONTRATO-DE-INTEGRACION.md` §1.1).
 *
 * Regla que no se puede perder: el `ProfileId` **nunca** viaja junto al contenido
 * (`PR-003` §9.3).
 */

/** Versión del contrato; viaja en cada petición y respuesta (`PR-003` §8). */
export const CONTRATO_VERSION = '1.0';

/**
 * Estados del caso (`PR-003` §3.1).
 *
 * `RESUELTO` y `CERRADO` son **dos** estados: un caso puede cerrarse **sin**
 * resolverse (el joven revoca). Ver `REVISION-C.md` §5.1.
 */
export const EstadoCaso = Object.freeze({
  RECIBIDO: 'RECIBIDO',
  CLASIFICADO: 'CLASIFICADO',
  EN_COLA: 'EN_COLA',
  ASIGNADO: 'ASIGNADO',
  ACEPTADO: 'ACEPTADO',
  CONTACTO_HABILITADO: 'CONTACTO_HABILITADO',
  EN_CURSO: 'EN_CURSO',
  RESUELTO: 'RESUELTO',
  CERRADO: 'CERRADO',
});

/** Orden de avance; sirve para comparar "estado ≥ ACEPTADO" sin listar estados. */
const ORDEN_ESTADO = Object.freeze(
  Object.fromEntries(Object.values(EstadoCaso).map((estado, indice) => [estado, indice])),
);

/** Nivel preliminar que calcula el APK por **reglas**. Nunca un diagnóstico. */
export const NivelOrigen = Object.freeze({ VERDE: 'VERDE', AMARILLO: 'AMARILLO', ROJO: 'ROJO' });

/** Categoría del equipo (la produce el LLM). El LLM **solo sube** (`PR-001` P3). */
export const Categoria = Object.freeze({ MEDIO: 'MEDIO', ALTO: 'ALTO' });

/**
 * Estados visibles en el APK (`SupportRequestState`, contrato estable: **no renombrar**).
 * `DRAFT` y `AUTHORIZED` son del APK, antes de enviar: el backend nunca los produce.
 */
export const SupportRequestState = Object.freeze({
  DRAFT: 'DRAFT',
  AUTHORIZED: 'AUTHORIZED',
  QUEUED: 'QUEUED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN_PROGRESS',
  UPDATE_AVAILABLE: 'UPDATE_AVAILABLE',
  CLOSED: 'CLOSED',
});

/**
 * Proyección de los 9 estados del caso a los 7 del APK (**hallazgo F1** de
 * `REVISION-C.md` §6). Sin ella, `PR-020` criterio 8 no se puede cumplir.
 *
 * El backend tiene más estados que el enum del APK porque necesita distinguir
 * triaje de acompañamiento; el joven ve una versión agregada.
 */
const PROYECCION_APK = Object.freeze({
  [EstadoCaso.RECIBIDO]: SupportRequestState.QUEUED,
  [EstadoCaso.CLASIFICADO]: SupportRequestState.QUEUED,
  [EstadoCaso.EN_COLA]: SupportRequestState.QUEUED,
  [EstadoCaso.ASIGNADO]: SupportRequestState.QUEUED,
  [EstadoCaso.ACEPTADO]: SupportRequestState.ACKNOWLEDGED,
  [EstadoCaso.CONTACTO_HABILITADO]: SupportRequestState.IN_PROGRESS,
  [EstadoCaso.EN_CURSO]: SupportRequestState.IN_PROGRESS,
  [EstadoCaso.RESUELTO]: SupportRequestState.UPDATE_AVAILABLE,
  [EstadoCaso.CERRADO]: SupportRequestState.CLOSED,
});

export function proyectarEstadoParaApk(estado) {
  return PROYECCION_APK[estado] ?? null;
}

/** `true` si el joven ya puede ver los datos del psicólogo (`PR-003` R5). */
export function psicologoVisible(estado) {
  return ORDEN_ESTADO[estado] >= ORDEN_ESTADO[EstadoCaso.ACEPTADO];
}

/** `true` si el psicólogo ya decidió comunicarse (`PR-003` R1). */
export function canalVisible(estado) {
  return ORDEN_ESTADO[estado] >= ORDEN_ESTADO[EstadoCaso.CONTACTO_HABILITADO];
}

/**
 * Contrato B — lo que el backend devuelve al APK (`PR-003` §5).
 *
 * `psicologo` y `canalContacto` van a `null` hasta que corresponde: el APK no
 * puede mostrarlos aunque quisiera, porque no se los enviamos.
 */
export function contratoB(caso) {
  return {
    contratoVersion: CONTRATO_VERSION,
    caseToken: caso.caseToken,
    estado: caso.estado,
    estadoApk: proyectarEstadoParaApk(caso.estado),
    categoria: caso.categoria,
    actualizadoEn: caso.actualizadoEn,
    psicologo: psicologoVisible(caso.estado) ? caso.psicologo ?? null : null,
    canalContacto: canalVisible(caso.estado) ? caso.canalContacto ?? null : null,
    mensajesNoLeidos: caso.mensajesNoLeidos ?? 0,
  };
}

/**
 * Campos que **nunca** pueden aparecer en un payload que cruce la frontera.
 * Se usa en las pruebas de contrato (`PR-020`).
 */
export const CAMPOS_PROHIBIDOS = Object.freeze(['profileId', 'alias', 'mac', 'deviceKey']);

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * ULID: opaco, ordenable por tiempo y **no derivable** del `ProfileId`
 * (`PR-004` §3).
 */
export function ulid(now = Date.now()) {
  let tiempo = '';
  let resto = now;
  for (let i = 0; i < 10; i += 1) {
    tiempo = B32[resto % 32] + tiempo;
    resto = Math.floor(resto / 32);
  }
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let azar = '';
  for (let i = 0; i < 16; i += 1) azar += B32[bytes[i] % 32];
  return tiempo + azar;
}
