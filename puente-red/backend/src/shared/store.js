import { EstadoCaso, ulid } from './contract.js';

/**
 * Almacén **en memoria** — solo para el esqueleto y las pruebas.
 *
 * TODO(TASK-013 / PR-004): sustituir por **Supabase** (Postgres + RLS).
 * Tablas previstas (`PR-004` §4): `casos`, `caso_correlacion`, `audit_event`.
 *
 * Invariante que **no** se puede perder al sustituirlo (`PR-003` §9.3): el
 * `ProfileId` vive en `correlacion` (tabla restringida y auditada) y **nunca**
 * viaja junto al contenido de un caso.
 */
export class InMemoryStore {
  constructor() {
    /** sessionToken -> { profileId, deviceKey } */
    this.sesiones = new Map();
    /** caseToken -> caso (SIN identidad) */
    this.casos = new Map();
    /** caseToken -> { profileId } — tabla restringida, aparte */
    this.correlacion = new Map();
    /** idempotencyKey -> caseToken */
    this.idempotencia = new Map();
    /** Registro de quién vio qué y cuándo (`PR-004` §4.3) */
    this.auditoria = [];
  }

  registrarDispositivo({ profileId, deviceKey }) {
    const sessionToken = `sess_${ulid()}`;
    this.sesiones.set(sessionToken, { profileId, deviceKey });
    this.auditar('registro_dispositivo', { sessionToken });
    return sessionToken;
  }

  sesion(sessionToken) {
    return this.sesiones.get(sessionToken) ?? null;
  }

  /**
   * Inserta la transacción del caso. Idempotente por `idempotencyKey`: dos
   * reintentos offline del APK producen **un solo** caso (`PR-004` §5).
   */
  crearCaso({ sessionToken, contrato, idempotencyKey }) {
    if (idempotencyKey && this.idempotencia.has(idempotencyKey)) {
      return { caseToken: this.idempotencia.get(idempotencyKey), nuevo: false };
    }

    const ahora = new Date().toISOString();
    const caseToken = ulid();
    this.casos.set(caseToken, {
      caseToken,
      estado: EstadoCaso.RECIBIDO,
      categoria: null,
      origenNivel: contrato.origenNivel,
      rulesetVersion: contrato.rulesetVersion ?? null,
      modelVersion: null,
      promptVersion: null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    // El vínculo con la identidad se guarda APARTE y no se devuelve nunca.
    const sesion = this.sesion(sessionToken);
    if (sesion) this.correlacion.set(caseToken, { profileId: sesion.profileId });

    if (idempotencyKey) this.idempotencia.set(idempotencyKey, caseToken);
    this.auditar('caso_creado', { caseToken });
    return { caseToken, nuevo: true };
  }

  caso(caseToken) {
    return this.casos.get(caseToken) ?? null;
  }

  /** Avanza el estado del caso. Lo usará el pipeline de C (`PR-005`–`PR-009`). */
  avanzarEstado(caseToken, estado, extra = {}) {
    const caso = this.casos.get(caseToken);
    if (!caso) return null;
    const actualizado = { ...caso, ...extra, estado, actualizadoEn: new Date().toISOString() };
    this.casos.set(caseToken, actualizado);
    this.auditar('caso_estado', { caseToken, estado });
    return actualizado;
  }

  auditar(accion, meta) {
    this.auditoria.push({ accion, meta, en: new Date().toISOString() });
  }
}
