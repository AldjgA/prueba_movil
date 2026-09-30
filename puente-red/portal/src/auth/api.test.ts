/**
 * PR-010 · Pruebas del cliente de la API Profesional.
 *
 * Se prueba la **frontera**: que el portal hable solo con `/profesional/**` (criterio 12) y que
 * **no invente** mensajes de error distintos a los del servidor (criterio 2).
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createPortalApi, type FetchLike } from "./api.ts";

interface Llamada {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

function fakeFetch(respuesta: Response | (() => Promise<Response>)): {
  fetchImpl: FetchLike;
  llamadas: Llamada[];
} {
  const llamadas: Llamada[] = [];
  return {
    llamadas,
    fetchImpl: async (url, init) => {
      llamadas.push({ url, init });
      return typeof respuesta === "function" ? respuesta() : respuesta;
    },
  };
}

const json = (cuerpo: unknown, status = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });

// ---------------------------------------------------------------------------
// Frontera
// ---------------------------------------------------------------------------
test("criterio 12: el cliente solo construye rutas /profesional", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json({ token: "t", expiraEn: "2026-01-01" }));
  const api = createPortalApi({ fetchImpl });

  await api.login("a@b.org", "x");
  await api.session("t");
  await api.logout("t");

  assert.equal(llamadas.length, 3);
  for (const llamada of llamadas) {
    assert.ok(
      llamada.url.startsWith("/profesional/"),
      `toda ruta debe ser /profesional: ${llamada.url}`,
    );
    assert.ok(!llamada.url.includes("/joven"), "el portal NUNCA llama a /joven");
  }
});

test("el login envía correo y contraseña por POST en el cuerpo", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json({ token: "t", expiraEn: "2026-01-01" }));
  await createPortalApi({ fetchImpl }).login("ana@ong.org", "secreta");

  const llamada = llamadas[0];
  assert.equal(llamada?.url, "/profesional/auth/login");
  assert.equal(llamada?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(llamada?.init?.body)), {
    email: "ana@ong.org",
    password: "secreta",
  });
});

test("la sesión y el cierre llevan el token en la cabecera", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json({ rol: "supervisor" }));
  const api = createPortalApi({ fetchImpl });

  await api.session("token-abc");
  await api.logout("token-abc");

  for (const llamada of llamadas) {
    const cabeceras = llamada.init?.headers as Record<string, string> | undefined;
    assert.equal(cabeceras?.["authorization"], "Bearer token-abc");
  }
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
test("un login correcto devuelve token, rol y caducidad", async () => {
  const { fetchImpl } = fakeFetch(
    json({ token: "tok", rol: "psicologo", institucion: "ong-1", esDemo: false, expiraEn: "2026-01-01T00:00:00Z" }),
  );
  const resultado = await createPortalApi({ fetchImpl }).login("a@b.org", "x");

  assert.equal(resultado.ok, true);
  assert.equal(resultado.ok === true ? resultado.token : null, "tok");
  assert.equal(resultado.ok === true ? resultado.rol : null, "psicologo");
  assert.equal(resultado.ok === true ? resultado.esDemo : null, false);
});

test("criterio 2: el mensaje de error es EXACTAMENTE el del servidor", async () => {
  const delServidor = "Correo o contraseña incorrectos.";
  const { fetchImpl } = fakeFetch(
    json({ error: "unauthorized", message: delServidor, reason: "auth.invalid_credentials" }, 401),
  );

  const resultado = await createPortalApi({ fetchImpl }).login("a@b.org", "mal");

  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false ? resultado.message : null, delServidor);
  assert.equal(resultado.ok === false ? resultado.reason : null, "auth.invalid_credentials");
  assert.equal(resultado.ok === false ? resultado.status : null, 401);
});

test("un fallo de red no se confunde con credenciales incorrectas", async () => {
  const { fetchImpl } = fakeFetch(() => Promise.reject(new Error("sin red")));
  const resultado = await createPortalApi({ fetchImpl }).login("a@b.org", "x");

  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false ? resultado.status : null, 0);
  assert.ok(
    !(resultado.ok === false ? resultado.message : "").includes("Correo o contraseña"),
    "un fallo de red no debe parecer un fallo de credenciales",
  );
});

test("una respuesta sin token se trata como fallo, no como éxito a medias", async () => {
  const { fetchImpl } = fakeFetch(json({ rol: "supervisor" }));
  const resultado = await createPortalApi({ fetchImpl }).login("a@b.org", "x");
  assert.equal(resultado.ok, false);
});

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------
test("la sesión devuelve las acciones permitidas que manda el servidor", async () => {
  const { fetchImpl } = fakeFetch(
    json({
      rol: "orientador",
      institucion: "ong-1",
      esDemo: true,
      emitidaEn: "2026-01-01T00:00:00Z",
      expiraEn: "2026-01-01T08:00:00Z",
      accionesPermitidas: ["VIEW_ALERTS", "VIEW_CASE_SUMMARY", "CREATE_REFERRAL"],
    }),
  );

  const sesion = await createPortalApi({ fetchImpl }).session("tok");

  assert.notEqual(sesion, null);
  // El portal NO calcula esto: lo copia del servidor. Una sola fuente de verdad.
  assert.deepEqual(sesion?.accionesPermitidas, [
    "VIEW_ALERTS",
    "VIEW_CASE_SUMMARY",
    "CREATE_REFERRAL",
  ]);
  assert.equal(sesion?.esDemo, true);
});

test("una sesión rechazada devuelve null", async () => {
  const { fetchImpl } = fakeFetch(json({ error: "unauthorized" }, 401));
  assert.equal(await createPortalApi({ fetchImpl }).session("malo"), null);
});

test("accionesPermitidas tolera valores no textuales", async () => {
  const { fetchImpl } = fakeFetch(
    json({ rol: "supervisor", accionesPermitidas: ["VIEW_ALERTS", 42, null, "MANAGE_DIRECTORY"] }),
  );
  const sesion = await createPortalApi({ fetchImpl }).session("tok");
  assert.deepEqual(sesion?.accionesPermitidas, ["VIEW_ALERTS", "MANAGE_DIRECTORY"]);
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
test("el cierre de sesión no falla aunque la red caiga", async () => {
  const { fetchImpl } = fakeFetch(() => Promise.reject(new Error("sin red")));
  await assert.doesNotReject(() => createPortalApi({ fetchImpl }).logout("tok"));
});

// ---------------------------------------------------------------------------
// baseUrl
// ---------------------------------------------------------------------------
test("baseUrl permite apuntar a otro origen en desarrollo", async () => {
  const { fetchImpl, llamadas } = fakeFetch(json({ token: "t", expiraEn: "x" }));
  await createPortalApi({ fetchImpl, baseUrl: "http://127.0.0.1:8080" }).login("a@b.org", "x");
  assert.equal(llamadas[0]?.url, "http://127.0.0.1:8080/profesional/auth/login");
});
