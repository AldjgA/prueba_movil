/**
 * PR-011 · Home profesional — «¿Qué necesita nuestra atención ahora?»
 *
 * **Referencia visual:** `ProWorkspaceScreen.tsx` del prototipo (tarjetas `PJ-047` y `PJ-032`).
 *
 * **Reparto de responsabilidades:** el **servidor** decide qué tarjetas hay y en qué orden; el
 * portal solo las pinta. Si el portal ordenara, la prioridad dependería de la pantalla.
 *
 * El **copy** vive aquí, no en el servidor: el servidor manda claves de catálogo
 * (`motive.seguridad_prioritaria`) y el portal las traduce.
 */

import { brand, semantic, surface, text } from "../design/tokens.ts";
import { useSession } from "../auth/SessionProvider.tsx";
import type { AttentionCard, TodayBoard } from "./api.ts";
import { formatHora, formatWaiting, waitingAt } from "./format.ts";
import { useTicker, useTodayBoard } from "./useTodayBoard.ts";

// ---------------------------------------------------------------------------
// Copy. El servidor manda claves; el texto lo pone el portal.
// ---------------------------------------------------------------------------
const MOTIVO: Record<string, string> = {
  "motive.seguridad_prioritaria": "Seguridad prioritaria",
  "motive.patron_creciente": "Patrón creciente",
  "motive.revision_programada": "Revisión programada",
};

const PATRON: Record<string, string> = {
  "pattern.sla_incumplido": "Pasó el tiempo de respuesta",
  "pattern.esperando_sin_acuse": "Sin responsable",
  "pattern.sla_en_riesgo": "Queda poco margen",
  "pattern.fuera_de_horario": "Fuera de horario",
};

const RAZON: Record<string, string> = {
  HIGH_WAITING: "Prioridad alta esperando",
  UNASSIGNED: "Sin responsable",
  SLA_BREACHED: "Tiempo de respuesta superado",
  SLA_AT_RISK: "Queda poco margen",
  IMPORTANT_CHANGE: "Cambio observado",
};

function colorCategoria(categoria: "MEDIO" | "ALTO" | null): string {
  if (categoria === "ALTO") return semantic.danger;
  if (categoria === "MEDIO") return semantic.warning;
  return text.muted;
}

function copyDe(mapa: Record<string, string>, clave: string, respaldo: string): string {
  return mapa[clave] ?? respaldo;
}

export function Home() {
  const { token } = useSession();
  const { board, cargando, error, recargar } = useTodayBoard(token);
  const ahora = useTicker();

  return (
    <div style={{ padding: "2.5rem", maxWidth: 900 }}>
      <p className="label">Prioridad de hoy</p>
      <h1
        style={{
          margin: "0.5rem 0 0.25rem",
          color: text.primary,
          fontSize: "1.75rem",
          fontWeight: 300,
          lineHeight: 1.3,
        }}
      >
        ¿Qué necesita <em style={{ color: brand.primarySoft }}>nuestra atención ahora</em>?
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
          minHeight: 24,
        }}
      >
        <span className="mono" style={{ color: text.muted, fontSize: "0.6875rem" }}>
          {board === null
            ? "Cargando…"
            : `Actualizado a las ${formatHora(board.generatedAtEpochMillis)}`}
        </span>
        <button type="button" className="button-link" onClick={recargar} disabled={cargando}>
          {cargando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error !== null && (
        <div className="notice notice--danger" role="alert" style={{ marginBottom: "1.5rem" }}>
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {board !== null && board.demoData && (
        <div className="notice notice--warning" role="note" style={{ marginBottom: "1rem" }}>
          <span aria-hidden="true">◆</span>
          <span>
            Casos de demostración: son ficticios. No hay personas reales esperando respuesta.
          </span>
        </div>
      )}

      {board !== null && board.outOfHours && (
        <div className="notice notice--info" role="status" style={{ marginBottom: "1rem" }}>
          <span aria-hidden="true">🌙</span>
          <span>
            Fuera del horario de servicio. Los tiempos de respuesta no corren hasta que el equipo
            vuelva.
          </span>
        </div>
      )}

      {board !== null && <Contadores board={board} />}

      {board !== null && board.cards.length === 0 && <EstadoVacio board={board} />}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {board?.cards.map((card) => (
          <Tarjeta key={card.caseToken} card={card} ahora={ahora} />
        ))}
      </div>
    </div>
  );
}

function Contadores({ board }: { board: TodayBoard }) {
  const items = [
    { etiqueta: "Esperando", valor: board.waitingCount, color: text.primary },
    { etiqueta: "Sin responsable", valor: board.unassignedCount, color: semantic.danger },
    { etiqueta: "Cambios importantes", valor: board.importantChangeCount, color: semantic.warning },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "0.75rem",
        marginBottom: "1.5rem",
      }}
    >
      {items.map((item) => (
        <div
          key={item.etiqueta}
          style={{
            background: surface.raised,
            border: "1px solid rgb(255 255 255 / 6%)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
          }}
        >
          <p className="label" style={{ marginBottom: "0.25rem" }}>
            {item.etiqueta}
          </p>
          <p
            className="mono"
            style={{ margin: 0, color: item.color, fontSize: "1.5rem", fontWeight: 500 }}
          >
            {item.valor}
          </p>
        </div>
      ))}
    </div>
  );
}

function EstadoVacio({ board }: { board: TodayBoard }) {
  return (
    <div
      style={{
        background: surface.raised,
        border: "1px solid rgb(255 255 255 / 6%)",
        borderRadius: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p style={{ margin: "0 0 0.25rem", color: text.primary, fontSize: "1rem" }}>
        No hay nada que requiera atención ahora.
      </p>
      <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.6875rem" }}>
        Comprobado a las {formatHora(board.generatedAtEpochMillis)}
      </p>
    </div>
  );
}

function Tarjeta({ card, ahora }: { card: AttentionCard; ahora: number }) {
  const color = colorCategoria(card.category);
  // Criterio 3: el tiempo se recalcula en el cliente desde el instante de recepción, así que
  // avanza sin volver a pedir el tablero.
  const esperando = waitingAt(card.waitingSinceEpochMillis, ahora);

  return (
    <article
      style={{
        background: surface.raised,
        border: `1px solid ${card.slaBreached ? `color-mix(in srgb, ${semantic.danger} 35%, transparent)` : "rgb(255 255 255 / 6%)"}`,
        borderRadius: "1rem",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span className="mono" style={{ color: text.primary, fontSize: "1rem", fontWeight: 500 }}>
            {card.caseToken}
          </span>
          {/* Nivel: color + TEXTO. Nunca solo color (PR-001 §2, brief §13). */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              background: `color-mix(in srgb, ${color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              borderRadius: 999,
              padding: "0.125rem 0.625rem",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            <span className="mono" style={{ color, fontSize: "0.6875rem" }}>
              {card.category ?? "SIN CLASIFICAR"} ·{" "}
              {copyDe(RAZON, card.reason, card.reason)}
            </span>
          </span>
        </div>

        <span className="mono" style={{ color: text.muted, fontSize: "0.6875rem", textAlign: "right" }}>
          Esperando
          <br />
          <span style={{ color: card.slaBreached ? semantic.danger : text.primary }}>
            {formatWaiting(esperando)}
          </span>
        </span>
      </div>

      <p style={{ margin: "0 0 0.5rem", color: text.primary, fontSize: "0.875rem" }}>
        {copyDe(MOTIVO, card.motiveKey, "Motivo registrado")}
      </p>

      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
        {card.patternKeys.map((clave) => (
          <span
            key={clave}
            className="mono"
            style={{
              background: "rgb(255 255 255 / 4%)",
              border: "1px solid rgb(255 255 255 / 8%)",
              borderRadius: 999,
              padding: "0.125rem 0.5rem",
              color: text.muted,
              fontSize: "0.625rem",
            }}
          >
            {copyDe(PATRON, clave, clave)}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <span className="mono" style={{ color: text.muted, fontSize: "0.6875rem" }}>
          Responsable:{" "}
          <span style={{ color: card.assigneeName === null ? semantic.danger : text.primary }}>
            {card.assigneeName ?? "Sin asignar"}
          </span>
        </span>

        {/* CTA deshabilitada: PR-013 (ficha de caso) todavía no existe. Se declara, no se finge. */}
        <button
          type="button"
          className="button-primary"
          style={{ width: "auto", padding: "0.5rem 1.25rem", fontSize: "0.8125rem" }}
          disabled
          title="Pendiente: PR-013 (ficha de caso)"
        >
          {card.reason === "HIGH_WAITING" || card.reason === "SLA_BREACHED"
            ? "Revisar ahora"
            : "Revisar"}
        </button>
      </div>
    </article>
  );
}

/** Reexportado para pruebas y para `PR-012`. */
export const copy = { MOTIVO, PATRON, RAZON };
