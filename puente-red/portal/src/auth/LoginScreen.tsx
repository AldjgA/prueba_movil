/**
 * PR-010 · Pantalla de acceso al portal.
 *
 * **Referencia visual:** `ProLoginScreen.tsx` del prototipo. El brief §37 prohíbe rediseñar,
 * así que la estructura, los colores y la tipografía se copian.
 *
 * **Qué cambia respecto al prototipo, y por qué:**
 * - El botón **hace login de verdad** (el prototipo solo navegaba a otra pantalla).
 * - Aparece el **error del servidor** con texto e icono, nunca solo color (`PR-001` §2).
 * - Se declara el **entorno de demostración** cuando corresponde: `PR-001` §8 prohíbe que una
 *   demo simule una respuesta clínica que no existe.
 * - Se avisa cuando la sesión se cerró **por inactividad**, para que no parezca un fallo.
 */

import { useState, type FormEvent } from "react";

import { Orb } from "../design/Orb.tsx";
import { brand, semantic, surface, text } from "../design/tokens.ts";
import { useSession } from "./SessionProvider.tsx";

/**
 * `VITE_ES_DEMO=false` solo en un despliegue con personas reales atendiendo. Por defecto se
 * declara demo: es la postura honesta mientras no haya piloto (`PR-003` Q6/Q7).
 */
const ES_DEMO = import.meta.env["VITE_ES_DEMO"] !== "false";

const PASOS = [
  { etiqueta: "Nueva solicitud", cuenta: 3, color: semantic.danger },
  { etiqueta: "En revisión", cuenta: 8, color: semantic.warning },
  { etiqueta: "Asignada", cuenta: 12, color: brand.primary },
  { etiqueta: "Seguimiento activo", cuenta: 24, color: brand.accent },
  { etiqueta: "Cerrada", cuenta: 156, color: semantic.success },
] as const;

const MAXIMO = 156;

export function LoginScreen() {
  const { login, estado, error, cerradaPorInactividad } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const enviando = estado === "autenticando";
  const puedeEnviar = email.trim() !== "" && password !== "" && !enviando;

  const alEnviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!puedeEnviar) return;
    await login(email, password);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: surface.page }}>
      {/* Panel izquierdo — marca. Oculto en pantallas estrechas, como el prototipo. */}
      <div
        style={{
          display: "none",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "50%",
          padding: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
        className="login-brand-panel"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Orb size={36} />
          <div>
            <p style={{ margin: 0, color: text.primary, fontSize: "1.125rem", fontWeight: 500 }}>
              Puente Red
            </p>
            <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.75rem" }}>
              Plataforma profesional
            </p>
          </div>
        </div>

        <div>
          <p className="label" style={{ color: brand.primary, marginBottom: "0.75rem" }}>
            Flujo de atención
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {PASOS.map((paso) => (
              <div key={paso.etiqueta} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: paso.color,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    background: "rgb(255 255 255 / 5%)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min((paso.cuenta / MAXIMO) * 100, 100)}%`,
                      background: `${paso.color}80`,
                    }}
                  />
                </div>
                <span
                  className="mono"
                  style={{ color: text.muted, fontSize: "0.75rem", width: 24, textAlign: "right" }}
                >
                  {paso.cuenta}
                </span>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: "2rem",
              marginBottom: 0,
              color: text.primary,
              fontSize: "1.875rem",
              fontWeight: 300,
              lineHeight: 1.35,
            }}
          >
            Una herramienta
            <br />
            <em style={{ color: brand.primary }}>para equipos que acompañan.</em>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{ width: 6, height: 6, borderRadius: "50%", background: brand.accent }}
          />
          <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.6875rem" }}>
            Acceso restringido · Solo profesionales autorizados
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario. */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <form onSubmit={alEnviar} style={{ width: "100%", maxWidth: "28rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <Orb size={32} />
            <span style={{ color: text.primary, fontSize: "1.125rem" }}>Puente Red</span>
          </div>

          <p className="label" style={{ marginBottom: "0.5rem" }}>
            Acceso profesional
          </p>
          <h1
            style={{
              margin: 0,
              marginBottom: "2rem",
              color: text.primary,
              fontSize: "1.75rem",
              fontWeight: 300,
              lineHeight: 1.35,
            }}
          >
            Un espacio de trabajo para
            <br />
            <em style={{ color: brand.accentSoft }}>equipos de acompañamiento.</em>
          </h1>

          {/* Avisos: texto + icono, nunca solo color. */}
          {error !== null && (
            <div className="notice notice--danger" role="alert" style={{ marginBottom: "1rem" }}>
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {cerradaPorInactividad && error === null && (
            <div className="notice notice--info" role="status" style={{ marginBottom: "1rem" }}>
              <span aria-hidden="true">⏱</span>
              <span>Cerramos tu sesión por inactividad. Vuelve a entrar para continuar.</span>
            </div>
          )}
          {ES_DEMO && (
            <div className="notice notice--warning" style={{ marginBottom: "1rem" }} role="note">
              <span aria-hidden="true">◆</span>
              <span>
                Entorno de demostración: no hay casos reales ni personas atendiendo. No
                introduzcas datos de una persona real.
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label className="label" htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>
                Correo institucional
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                className="field"
                placeholder="nombre@institucion.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error !== null}
              />
            </div>
            <div>
              <label className="label" htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error !== null}
              />
            </div>
          </div>

          <button type="submit" className="button-primary" disabled={!puedeEnviar}>
            {enviando ? "Comprobando…" : "Entrar a Puente Red"}
          </button>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: surface.raised,
              border: "1px solid rgb(255 255 255 / 5%)",
              borderRadius: 999,
              padding: "0.5rem 1rem",
              width: "fit-content",
            }}
          >
            <span aria-hidden="true" style={{ color: text.muted, fontSize: "0.75rem" }}>
              🔒
            </span>
            <span className="mono" style={{ color: text.muted, fontSize: "0.625rem" }}>
              Sesión con caducidad · 8 h máximo
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
