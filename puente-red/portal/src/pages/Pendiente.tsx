/**
 * Marcador de las pantallas que aún no existen.
 *
 * **Por qué existe y no es relleno:** es la diferencia entre "esto es un producto a medias" y
 * "esto es una maqueta". El portal declara **qué falta y de quién es**, en vez de mostrar
 * tarjetas de datos inventados. `PR-001` §8 prohíbe simular una capacidad que no existe.
 */

import { brand, surface, text } from "../design/tokens.ts";
import { useSession } from "../auth/SessionProvider.tsx";

const PENDIENTES = [
  { tarea: "PR-011", que: "Home profesional: «¿Qué necesita nuestra atención ahora?»" },
  { tarea: "PR-012", que: "Centro de alertas con priorización y filtros" },
  { tarea: "PR-013", que: "Ficha de caso estructurada (7 secciones)" },
  { tarea: "PR-014", que: "Separación «organizado por Puente» / «valoración profesional»" },
  { tarea: "PR-015", que: "Timeline operacional y seguimiento" },
  { tarea: "PR-016", que: "Derivaciones y directorio de apoyo" },
  { tarea: "PR-017", que: "Observatorio y reportes agregados" },
] as const;

export function Pendiente() {
  const { sesion, puede } = useSession();

  return (
    <div style={{ padding: "2.5rem", maxWidth: 760 }}>
      <p className="label">Estado del portal</p>
      <h1
        style={{
          margin: "0.5rem 0 0.75rem",
          color: text.primary,
          fontSize: "1.75rem",
          fontWeight: 300,
          lineHeight: 1.3,
        }}
      >
        Autenticación lista. <em style={{ color: brand.primarySoft }}>El resto, en construcción.</em>
      </h1>
      <p style={{ color: text.muted, fontSize: "0.875rem", marginBottom: "2rem" }}>
        Tu sesión está activa y las rutas del portal ya están guardadas por rol. Las pantallas de
        trabajo son las siguientes tareas de la cola.
      </p>

      <div
        style={{
          background: surface.raised,
          border: "1px solid rgb(255 255 255 / 6%)",
          borderRadius: "1rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <p className="label" style={{ marginBottom: "0.75rem" }}>
          Tu sesión
        </p>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem" }}>
          <dt style={{ color: text.muted, fontSize: "0.8125rem" }}>Rol</dt>
          <dd className="mono" style={{ margin: 0, color: text.primary, fontSize: "0.8125rem" }}>
            {sesion?.rol ?? "—"}
          </dd>
          <dt style={{ color: text.muted, fontSize: "0.8125rem" }}>Institución</dt>
          <dd className="mono" style={{ margin: 0, color: text.primary, fontSize: "0.8125rem" }}>
            {sesion?.institucion ?? "—"}
          </dd>
          <dt style={{ color: text.muted, fontSize: "0.8125rem" }}>Caduca</dt>
          <dd className="mono" style={{ margin: 0, color: text.primary, fontSize: "0.8125rem" }}>
            {sesion?.expiraEn ?? "—"}
          </dd>
          <dt style={{ color: text.muted, fontSize: "0.8125rem" }}>Acciones permitidas</dt>
          <dd className="mono" style={{ margin: 0, color: text.primary, fontSize: "0.75rem" }}>
            {sesion?.accionesPermitidas.length ?? 0} ·{" "}
            {puede("VIEW_AUDIT_LOG") ? "incluye ver auditoría" : "sin acceso a auditoría"}
          </dd>
        </dl>
      </div>

      <p className="label" style={{ marginBottom: "0.75rem" }}>
        Pendiente
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {PENDIENTES.map((item) => (
          <li
            key={item.tarea}
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "baseline",
              padding: "0.625rem 0.875rem",
              background: surface.raised,
              border: "1px solid rgb(255 255 255 / 5%)",
              borderRadius: "0.75rem",
            }}
          >
            <span className="mono" style={{ color: brand.primarySoft, fontSize: "0.6875rem", width: 48 }}>
              {item.tarea}
            </span>
            <span style={{ color: text.primary, fontSize: "0.8125rem" }}>{item.que}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
