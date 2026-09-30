import { Hono } from 'hono';

import {
  AUTHORIZATION_MATRIX,
  AuthService,
  InMemoryAuthAuditSink,
  InMemorySessionRegistry,
  PORTAL_ACTIONS,
  GENERIC_SIGN_IN_MESSAGE,
  createDemoAuthPort,
  sessionExpiryReason,
} from '../core/auth/index.ts';
import { CONTRATO_VERSION } from '../shared/contract.js';
import { leerJson } from '../shared/middleware.js';
import { DEMO_SEED, Directory } from '../core/directory/index.ts';
import {
  ALERT_FILTERS,
  DEFAULT_PAGE_SIZE,
  buildAlertPage,
  isAlertFilter,
} from '../core/alerts/index.ts';
import { buildTodayBoard, DEFAULT_SERVICE_WINDOW, isOutOfHours, seedDemoCases } from '../core/home/index.ts';
import { CaseQueue, InMemoryCaseStore, humanActor } from '../core/queue/index.ts';

/**
 * API Profesional — dueño: **C** (`PR-010`…`PR-017`).
 *
 * **Estado: `PR-010` (autenticación y roles).** Las rutas de `PR-011`…`PR-017` todavía no
 * existen; el resto de la superficie responde `501`.
 *
 * Regla de la frontera (`PR-003` §1, `PR-020` criterio 12): el portal habla **solo** con
 * `/profesional/**` y el APK **solo** con `/joven/**`. Ninguna de las dos superficies llama a
 * la otra.
 *
 * ## Cómo se guarda una ruta
 *
 * Toda ruta que toque datos pasa por `exigirAccion(...)`, que llama a `AuthService.guard` →
 * `authorize` (la matriz de `core/auth/roles.ts`). **Ninguna ruta se ejecuta sin pasar por la
 * guardia** (`PR-010` criterio 9). Añadir una ruta nueva sin guardia es un fallo de seguridad.
 *
 * `exigirSesionViva` es distinto y **solo** vale para rutas que no tocan datos de nadie más
 * (leer tu propia sesión, cerrarla). No sustituye a `exigirAccion`.
 */

/** Código HTTP por motivo de rechazo. Un rechazo nunca dice más de lo necesario. */
const CODIGO_POR_MOTIVO = {
  NO_SESSION: 401,
  SESSION_EXPIRED: 401,
  SESSION_IDLE: 401,
  ROLE_NOT_PERMITTED: 403,
  DEMO_READ_ONLY: 403,
  CROSS_INSTITUTION: 403,
};

export function createProfesionalRoutes({
  env = process.env,
  authService,
  registry,
  audit,
  clock,
  directory,
  queue,
} = {}) {
  const profesional = new Hono();

  const reloj = clock ?? { nowEpochMillis: () => Date.now() };
  const sesiones = registry ?? new InMemorySessionRegistry({ clock: reloj });
  // Sumidero de auditoría en memoria. En producción será la tabla `audit_event` (`PR-004` §4.3),
  // que necesita el cliente de Supabase de `src/shared/**` (de A).
  const auditoria = audit ?? new InMemoryAuthAuditSink();

  // ---------------------------------------------------------------------------
  // Estado del portal: directorio y cola.
  //
  // ⚠️ **En memoria.** La persistencia real es Supabase (`PR-004` §4), que necesita el cliente
  // de `src/shared/**` (de A). Mientras no exista, el portal es demostrable pero **no
  // persistente**: reiniciar el servidor vacía la cola.
  // ---------------------------------------------------------------------------
  const directorio = directory ?? crearDirectorioFicticio(reloj);
  const cola = queue ?? new CaseQueue({ directory: directorio, store: new InMemoryCaseStore(), clock: reloj });

  // `PR-003` Q7: por defecto el tablero está VACÍO. Los casos ficticios son opt-in.
  const demoCasos = env['PUENTE_DEMO_CASOS'] === 'on';
  if (demoCasos) {
    seedDemoCases({ queue: cola, directory: directorio, nowEpochMillis: reloj.nowEpochMillis() });
  }
  const ventanaServicio = env['PUENTE_HORARIO_SERVICIO'] ?? DEFAULT_SERVICE_WINDOW;

  // La sesión de demostración tiene que apuntar a un perfil que **exista** en el directorio:
  // si no, `takeCase` devolvería `UNKNOWN_RESPONDER` y la demo no funcionaría.
  const primerPerfil = directorio.list()[0];
  // Sin `authService` inyectado se usa el adaptador de DEMOSTRACIÓN, que falla cerrado si no
  // hay contraseña en el entorno (`core/auth/demoAuthPort.ts`).
  const auth =
    authService ??
    new AuthService({
      port: createDemoAuthPort({ PUENTE_DEMO_RESPONDER_ID: primerPerfil?.id ?? '', ...env }),
      audit: auditoria,
      clock: reloj,
    });

  /** Token del portal, de `Authorization: Bearer <token>`. */
  const tokenDe = (c) => {
    const cabecera = c.req.header('authorization') ?? '';
    if (!cabecera.startsWith('Bearer ')) return null;
    const token = cabecera.slice('Bearer '.length).trim();
    return token === '' ? null : token;
  };

  /**
   * Sesión viva, sin comprobar rol.
   * **No vale para rutas que toquen datos**: para eso está `exigirAccion`.
   */
  const exigirSesionViva = async (c, next) => {
    const token = tokenDe(c);
    const sesion = token === null ? null : sesiones.resolve(token);
    if (sesion === null) {
      return c.json({ error: 'unauthorized', reason: 'authz.no_session' }, 401);
    }
    const motivo = sessionExpiryReason(sesion, reloj.nowEpochMillis());
    if (motivo !== null) {
      return c.json({ error: 'unauthorized', reason: `authz.${motivo.toLowerCase()}` }, 401);
    }
    // Solo AHORA: la sesión vive, así que este acceso sí cuenta como actividad.
    // Marcar antes de comprobar anularía el reloj de inactividad.
    sesiones.touch(token);
    c.set('sesion', sesion);
    await next();
  };

  /** Guardia de acción: sesión viva **y** rol autorizado por la matriz. */
  const exigirAccion = (accion) => async (c, next) => {
    const token = tokenDe(c);
    const sesion = token === null ? null : sesiones.resolve(token);
    const decision = auth.guard(sesion, accion);
    if (!decision.allowed) {
      const codigo = CODIGO_POR_MOTIVO[decision.reason] ?? 403;
      return c.json(
        {
          error: codigo === 401 ? 'unauthorized' : 'forbidden',
          reason: `authz.${decision.reason.toLowerCase()}`,
        },
        codigo,
      );
    }
    if (token !== null) sesiones.touch(token);
    c.set('sesion', sesion);
    await next();
  };

  // ---------------------------------------------------------------------------
  // Marcador de vida
  // ---------------------------------------------------------------------------
  profesional.get('/', (c) =>
    c.json({ superficie: 'profesional', estado: 'pr-010', contratoVersion: CONTRATO_VERSION }, 200),
  );

  // ---------------------------------------------------------------------------
  // PR-010 · Autenticación
  // ---------------------------------------------------------------------------

  /**
   * Inicia sesión. Devuelve un **token opaco**; la sesión del portal **caduca**
   * (`REVISION-C` §5.2), a diferencia del `sessionToken` sin caducidad de la API Joven.
   */
  profesional.post('/auth/login', async (c) => {
    const cuerpo = await leerJson(c);
    if (cuerpo === null || typeof cuerpo.email !== 'string' || typeof cuerpo.password !== 'string') {
      return c.json({ error: 'bad_request', message: 'Se esperan email y password.' }, 400);
    }

    const resultado = await auth.signIn(cuerpo.email, cuerpo.password);
    if (!resultado.ok) {
      // Mensaje ÚNICO: nunca se revela si el correo existe (criterio 2).
      return c.json(
        {
          error: 'unauthorized',
          message: GENERIC_SIGN_IN_MESSAGE,
          reason: `auth.${resultado.reason.toLowerCase()}`,
        },
        401,
      );
    }

    const token = sesiones.emit(resultado.session);
    return c.json(
      {
        token,
        rol: resultado.session.role,
        institucion: resultado.session.institutionId,
        esDemo: resultado.session.isDemo,
        expiraEn: new Date(resultado.session.expiresAtEpochMillis).toISOString(),
      },
      200,
    );
  });

  /** Cierra sesión: revoca el token y lo deja auditado. */
  profesional.post('/auth/logout', exigirSesionViva, async (c) => {
    const token = tokenDe(c);
    if (token !== null) sesiones.revoke(token);
    await auth.signOut(c.get('sesion'));
    return c.body(null, 204);
  });

  /**
   * Sesión actual y **qué puede hacer** con su rol.
   *
   * Devuelve la lista de acciones permitidas: es la forma de que el portal no tenga que
   * replicar la matriz de autorización en el cliente. La matriz vive **solo** en el servidor.
   */
  profesional.get('/session', exigirSesionViva, (c) => {
    const sesion = c.get('sesion');
    return c.json(
      {
        rol: sesion.role,
        institucion: sesion.institutionId,
        esDemo: sesion.isDemo,
        emitidaEn: new Date(sesion.issuedAtEpochMillis).toISOString(),
        expiraEn: new Date(sesion.expiresAtEpochMillis).toISOString(),
        accionesPermitidas: PORTAL_ACTIONS.filter((accion) =>
          AUTHORIZATION_MATRIX[accion].includes(sesion.role),
        ),
      },
      200,
    );
  });

  /**
   * Log de auditoría. **Solo `supervisor`** (`PR-010` criterio 3).
   *
   * Los eventos **no** contienen contenido sensible: acción, actor, motivo y momento
   * (`PR-018`). Aquí se expone el log de autenticación, que es el que produce `PR-010`.
   */
  profesional.get('/auditoria', exigirAccion('VIEW_AUDIT_LOG'), (c) =>
    c.json({ eventos: auth.auditEvents() }, 200),
  );

  // ---------------------------------------------------------------------------
  // PR-011 · Home profesional
  // ---------------------------------------------------------------------------

  /**
   * **«¿Qué necesita nuestra atención ahora?»** (`PR-011`).
   *
   * El orden lo decide el servidor (`core/home/todayBoard.ts`), no el cliente: si el portal
   * ordenara, la prioridad dependería de la pantalla que la muestra.
   *
   * `fueraDeHorario` lo calcula **el servidor** a partir del horario configurado. El APK y el
   * portal **no** deben inferirlo (hallazgo K5 de B).
   */
  profesional.get('/home', exigirAccion('VIEW_ALERTS'), (c) => {
    const ahora = reloj.nowEpochMillis();
    const board = buildTodayBoard({
      queue: cola,
      directory: directorio,
      nowEpochMillis: ahora,
      outOfHours: isOutOfHours(ahora, ventanaServicio),
      demoData: demoCasos,
    });
    return c.json(board, 200);
  });

  // ---------------------------------------------------------------------------
  // PR-012 · Centro de alertas
  // ---------------------------------------------------------------------------

  /**
   * Lista de alertas con los filtros del brief §23, búsqueda y paginación.
   *
   * ⚠️ **El filtro `RED` filtra por el nivel del joven** (`origenNivel`, reglas del APK), **no**
   * por la categoría del LLM. Son dos ejes independientes (`PLAN-PUENTE-RED.md` §7).
   */
  profesional.get('/alertas', exigirAccion('VIEW_ALERTS'), (c) => {
    const filtroCrudo = c.req.query('filtro') ?? 'ALL';
    if (!isAlertFilter(filtroCrudo)) {
      // Un filtro desconocido se rechaza en vez de ignorarse: silenciarlo haría creer que el
      // portal está filtrando cuando en realidad muestra todo.
      return c.json(
        { error: 'filtro_invalido', message: `Filtros válidos: ${ALERT_FILTERS.join(', ')}.` },
        400,
      );
    }

    const ahora = reloj.nowEpochMillis();
    return c.json(
      buildAlertPage({
        queue: cola,
        directory: directorio,
        nowEpochMillis: ahora,
        outOfHours: isOutOfHours(ahora, ventanaServicio),
        filter: filtroCrudo,
        search: c.req.query('busqueda'),
        page: numeroDeQuery(c.req.query('pagina'), 1),
        pageSize: numeroDeQuery(c.req.query('tamano'), DEFAULT_PAGE_SIZE),
        demoData: demoCasos,
      }),
      200,
    );
  });

  /**
   * **Tomar un caso** (`PR-012` criterio 8).
   *
   * Es el **único** endpoint que toma un caso, y lo usan tanto el centro de alertas como la ficha
   * (`PR-013`). Si hubiera dos, «tomar» podría significar dos cosas distintas según la pantalla.
   *
   * Exige actor humano: el identificador sale de la **sesión**, nunca del cuerpo. Si viniera del
   * cliente, cualquiera podría tomar un caso en nombre de otro.
   */
  profesional.post('/casos/:caseToken/tomar', exigirAccion('TAKE_CASE'), (c) => {
    const sesion = c.get('sesion');
    const resultado = cola.takeCase(
      c.req.param('caseToken'),
      sesion.responderId,
      humanActor(sesion.responderId),
    );

    if (!resultado.ok) {
      const codigo = resultado.reason === 'UNKNOWN_CASE' ? 404 : 409;
      return c.json({ error: 'no_se_pudo_tomar', reason: resultado.reason }, codigo);
    }

    return c.json(
      { caseToken: resultado.ticket.caseToken, estado: resultado.ticket.state },
      200,
    );
  });

  // ---------------------------------------------------------------------------
  // PR-013…PR-017 — pendientes
  // ---------------------------------------------------------------------------
  profesional.all('*', (c) =>
    c.json(
      {
        error: 'not_implemented',
        message: 'Superficie profesional pendiente (PR-013…PR-017).',
        implementado: [
          '/auth/login',
          '/auth/logout',
          '/session',
          '/auditoria',
          '/home',
          '/alertas',
          'POST /casos/:caseToken/tomar',
        ],
      },
      501,
    ),
  );

  return profesional;
}

/** Lee un entero de la query. Devuelve el respaldo si no es un número. */
function numeroDeQuery(valor, respaldo) {
  if (valor === undefined) return respaldo;
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) ? numero : respaldo;
}

/**
 * Directorio con los perfiles **ficticios** de la demostración (brief §28, `PR-003` Q7).
 *
 * En producción lo sustituye el directorio real de la ONG, que es una tabla de Supabase.
 */
function crearDirectorioFicticio(reloj) {
  const directorio = new Directory({ clock: reloj });
  for (const perfil of DEMO_SEED) {
    directorio.upsert(perfil, null);
  }
  return directorio;
}
