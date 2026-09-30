/**
 * Estructura del portal autenticado: barra lateral + área de contenido.
 *
 * **Referencia visual:** `ProSidebar.tsx` del prototipo. La navegación es la de `PR-003`
 * §33 / brief §33: Inicio · Alertas · Casos · Seguimientos · Derivaciones · Reportes ·
 * Observatorio · Directorio · Configuración.
 *
 * **Lo que este archivo NO hace:** no inventa pantallas. Cada destino declara **qué tarea lo
 * implementa**, y los que aún no existen aparecen **deshabilitados** con su tarea a la vista. Es
 * la diferencia entre «producto a medias» y «maqueta».
 */

import type { ReactNode } from "react";

import { Orb } from "../design/Orb.tsx";
import { brand, surface, text } from "../design/tokens.ts";
import { useSession } from "../auth/SessionProvider.tsx";

/** Destinos navegables hoy. */
export type Destino = "inicio" | "alertas";

interface Entrada {
  readonly etiqueta: string;
  readonly icono: string;
  /** Destino al que navega. `null` = todavía no existe. */
  readonly destino: Destino | null;
  /** Tarea que lo implementa. `null` = sin dueño declarado. */
  readonly tarea: string | null;
}

/** Orden del brief §33. */
const DESTINOS: readonly Entrada[] = [
  { etiqueta: "Inicio", icono: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", destino: "inicio", tarea: "PR-011" },
  { etiqueta: "Alertas", icono: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0", destino: "alertas", tarea: "PR-012" },
  { etiqueta: "Casos", icono: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8", destino: null, tarea: "PR-013" },
  { etiqueta: "Seguimientos", icono: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z", destino: null, tarea: "PR-015" },
  { etiqueta: "Derivaciones", icono: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3", destino: null, tarea: "PR-016" },
  { etiqueta: "Reportes", icono: "M18 20V10M12 20V4M6 20v-6", destino: null, tarea: "PR-017" },
  { etiqueta: "Observatorio", icono: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", destino: null, tarea: "PR-017" },
  { etiqueta: "Directorio", icono: "M4 6h16M4 10h16M4 14h16M4 18h16", destino: null, tarea: "PR-016" },
  { etiqueta: "Configuración", icono: "M12 15a3 3 0 100-6 3 3 0 000 6z", destino: null, tarea: "PR-018" },
];

export interface AppShellProps {
  readonly children: ReactNode;
  /** Destino activo. La ficha de caso (`PR-013`) se abre desde Alertas. */
  readonly activo: Destino;
  readonly onNavegar: (destino: Destino) => void;
}

export function AppShell({ children, activo, onNavegar }: AppShellProps) {
  const { sesion, logout } = useSession();
  const iniciales = sesion?.institucion.slice(0, 2).toUpperCase() ?? "PR";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: surface.page }}>
      <aside
        style={{
          width: 224,
          flexShrink: 0,
          background: surface.raised,
          borderRight: "1px solid rgb(255 255 255 / 5%)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "1.25rem", borderBottom: "1px solid rgb(255 255 255 / 5%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Orb size={20} />
            <span style={{ color: text.primary, fontSize: "1rem", fontWeight: 500 }}>Puente Red</span>
          </div>
          <span className="label">Plataforma profesional</span>
        </div>

        <nav
          style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: 2 }}
          aria-label="Navegación principal"
        >
          {DESTINOS.map((destino) => {
            const activo_ = destino.destino === activo;
            const disponible = destino.destino !== null;
            return (
              <button
                key={destino.etiqueta}
                type="button"
                disabled={!disponible}
                aria-current={activo_ ? "page" : undefined}
                onClick={() => {
                  if (destino.destino !== null) onNavegar(destino.destino);
                }}
                title={
                  disponible
                    ? destino.etiqueta
                    : `Pendiente: ${destino.tarea ?? "sin tarea asignada"}`
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: 0,
                  width: "100%",
                  textAlign: "left",
                  fontFamily: "inherit",
                  background: activo_
                    ? `color-mix(in srgb, ${brand.primary} 12%, transparent)`
                    : "transparent",
                  color: activo_ ? text.primary : text.muted,
                  fontSize: "0.875rem",
                  fontWeight: activo_ ? 600 : 400,
                  // Los pendientes se ven atenuados y **no** se pueden pulsar.
                  opacity: disponible ? 1 : 0.45,
                  cursor: disponible ? "pointer" : "not-allowed",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d={destino.icono}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ flex: 1 }}>{destino.etiqueta}</span>
                {!disponible && destino.tarea !== null && (
                  <span className="mono" style={{ fontSize: "0.5625rem", opacity: 0.8 }}>
                    {destino.tarea}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            padding: "1rem 0.75rem",
            borderTop: "1px solid rgb(255 255 255 / 5%)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 0.75rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                background: `color-mix(in srgb, ${brand.primary} 20%, transparent)`,
                border: `1px solid color-mix(in srgb, ${brand.primary} 30%, transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: brand.primarySoft,
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {iniciales}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                className="mono"
                style={{ margin: 0, color: text.primary, fontSize: "0.6875rem", fontWeight: 600 }}
              >
                {sesion?.rol ?? "—"}
              </p>
              <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.625rem" }}>
                {sesion?.institucion ?? "—"}
              </p>
            </div>
          </div>

          {sesion?.esDemo === true && (
            <div className="notice notice--warning" role="note" style={{ fontSize: "0.6875rem" }}>
              <span aria-hidden="true">◆</span>
              <span>Modo demostración: solo lectura.</span>
            </div>
          )}

          <button
            type="button"
            className="button-link"
            onClick={() => void logout()}
            style={{ padding: "0 0.75rem" }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
