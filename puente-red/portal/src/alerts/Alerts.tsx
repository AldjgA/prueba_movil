/**
 * PR-012 · Centro de alertas.
 *
 * **Qué es:** la lista completa con filtros y búsqueda. El home responde *"¿qué atiendo ahora?"*;
 * esto responde *"¿qué hay en total?"*.
 *
 * **Referencia visual:** `ProAlertsScreen.tsx` del prototipo (filtros *Todos · Rojo · Amarillo ·
 * Sin asignar · En seguimiento · Derivados*).
 *
 * **Lo que decide el servidor:** el filtrado, los contadores y el orden. El portal **no** filtra
 * en memoria: si lo hiciera, los contadores no cuadrarían con la lista, porque solo tendría la
 * página cargada.
 */

import { useCallback, useEffect, useState } from "react";

import { brand, semantic, surface, text } from "../design/tokens.ts";
import { useSession } from "../auth/SessionProvider.tsx";
import { copy } from "../home/Home.tsx";
import { formatHora, formatWaiting, waitingAt } from "../home/format.ts";
import { useTicker } from "../home/useTodayBoard.ts";
import { ALERT_FILTERS, createAlertsApi, type AlertFilter, type AlertPage, type AlertRow } from "./api.ts";

/** Copy de los filtros. El servidor manda claves; el texto lo pone el portal. */
const ETIQUETA_FILTRO: Record<AlertFilter, string> = {
  ALL: "Todos",
  RED: "Rojo",
  YELLOW: "Amarillo",
  UNASSIGNED: "Sin asignar",
  IN_FOLLOWUP: "En seguimiento",
  REFERRED: "Derivados",
};

const AVISO_FILTRO: Record<AlertFilter, string> = {
  ALL: "No hay casos que requieran atención.",
  RED: "No hay casos con prioridad preliminar roja.",
  YELLOW: "No hay casos con prioridad preliminar amarilla.",
  UNASSIGNED: "Todos los casos tienen responsable.",
  IN_FOLLOWUP: "No hay casos en acompañamiento activo.",
  REFERRED: "Todavía no hay derivaciones: el módulo es PR-016.",
};

const ESTADO_COPY: Record<string, string> = {
  RECIBIDO: "Recibido",
  CLASIFICADO: "Clasificado",
  EN_COLA: "En cola",
  ASIGNADO: "Asignado",
  ACEPTADO: "Aceptado",
  CONTACTO_HABILITADO: "Con canal abierto",
  EN_CURSO: "En curso",
};

export function Alerts() {
  const { token, sesion } = useSession();
  const api = createAlertsApi();

  const [filtro, setFiltro] = useState<AlertFilter>("ALL");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [board, setBoard] = useState<AlertPage | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const recargar = useCallback(() => setNonce((n) => n + 1), []);
  const ahora = useTicker();

  useEffect(() => {
    if (token === null) return undefined;
    let vivo = true;
    setCargando(true);

    void (async () => {
      const resultado = await api.page(token, { filter: filtro, search: busqueda, page: pagina });
      if (!vivo) return;
      setCargando(false);
      if (resultado === null) {
        setError("No se pudieron cargar las alertas. Comprueba tu conexión e inténtalo de nuevo.");
        return;
      }
      setError(null);
      setBoard(resultado);
    })();

    return () => {
      vivo = false;
    };
  }, [api, token, filtro, busqueda, pagina, nonce]);

  const tomar = async (caseToken: string) => {
    if (token === null) return;
    setAviso(null);
    const resultado = await api.takeCase(token, caseToken);
    if (resultado.ok) {
      setAviso(`Caso ${caseToken} tomado. Ahora aparece como aceptado.`);
      recargar();
      return;
    }
    // El mensaje se deriva del motivo del SERVIDOR, no se inventa aquí.
    setAviso(mensajeDeRechazo(caseToken, resultado.reason));
  };

  const esDemo = sesion?.esDemo === true;

  return (
    <div style={{ padding: "2.5rem", maxWidth: 1100 }}>
      <p className="label">Centro de alertas</p>
      <h1
        style={{
          margin: "0.5rem 0 0.25rem",
          color: text.primary,
          fontSize: "1.75rem",
          fontWeight: 300,
          lineHeight: 1.3,
        }}
      >
        Todo lo que está <em style={{ color: brand.primarySoft }}>en el sistema</em>
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <span className="mono" style={{ color: text.muted, fontSize: "0.6875rem" }}>
          {board === null
            ? "Cargando…"
            : `${board.total} en «${ETIQUETA_FILTRO[filtro]}» · actualizado a las ${formatHora(board.generatedAtEpochMillis)}`}
        </span>
        <button type="button" className="button-link" onClick={recargar} disabled={cargando}>
          {cargando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error !== null && (
        <div className="notice notice--danger" role="alert" style={{ marginBottom: "1rem" }}>
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {aviso !== null && (
        <div className="notice notice--info" role="status" style={{ marginBottom: "1rem" }}>
          <span aria-hidden="true">ℹ</span>
          <span>{aviso}</span>
        </div>
      )}

      {board?.demoData === true && (
        <div className="notice notice--warning" role="note" style={{ marginBottom: "1rem" }}>
          <span aria-hidden="true">◆</span>
          <span>Casos de demostración: son ficticios. No hay personas reales esperando respuesta.</span>
        </div>
      )}

      {/* Filtros. El contador va en la propia pestaña para que se vea sin cambiar de filtro. */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {ALERT_FILTERS.map((valor) => {
          const activo = valor === filtro;
          const cuenta = board?.counts[valor];
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={activo}
              onClick={() => {
                setFiltro(valor);
                setPagina(1);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: activo ? `color-mix(in srgb, ${brand.primary} 15%, transparent)` : surface.raised,
                border: `1px solid ${activo ? `color-mix(in srgb, ${brand.primary} 40%, transparent)` : "rgb(255 255 255 / 8%)"}`,
                borderRadius: 999,
                padding: "0.375rem 0.875rem",
                color: activo ? text.primary : text.muted,
                fontSize: "0.8125rem",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {ETIQUETA_FILTRO[valor]}
              {cuenta !== undefined && (
                <span className="mono" style={{ fontSize: "0.625rem", opacity: 0.8 }}>
                  {cuenta}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <input
        type="search"
        className="field"
        placeholder="Buscar por identificador de caso…"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPagina(1);
        }}
        style={{ marginBottom: "1.25rem", maxWidth: 360 }}
        aria-label="Buscar por identificador de caso"
      />

      {board !== null && board.rows.length === 0 && (
        <div
          style={{
            background: surface.raised,
            border: "1px solid rgb(255 255 255 / 6%)",
            borderRadius: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 0.25rem", color: text.primary, fontSize: "0.9375rem" }}>
            {AVISO_FILTRO[filtro]}
          </p>
          <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.6875rem" }}>
            Comprobado a las {formatHora(board.generatedAtEpochMillis)}
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {board?.rows.map((fila) => (
          <Fila
            key={fila.caseToken}
            fila={fila}
            ahora={ahora}
            esDemo={esDemo}
            onTomar={() => void tomar(fila.caseToken)}
          />
        ))}
      </div>

      {board !== null && board.total > board.pageSize && (
        <Paginacion
          pagina={board.page}
          total={board.total}
          tamano={board.pageSize}
          onCambiar={setPagina}
        />
      )}
    </div>
  );
}

/** Traduce el motivo del servidor a un mensaje. **No inventa diagnósticos.** */
function mensajeDeRechazo(caseToken: string, reason: string | null): string {
  if (reason === "DEMO_READ_ONLY") {
    return "En modo demostración no se pueden tomar casos: es de solo lectura.";
  }
  if (reason === "ILLEGAL_TRANSITION") {
    return `El caso ${caseToken} ya no se puede tomar: alguien se adelantó.`;
  }
  if (reason === "UNKNOWN_CASE") return `El caso ${caseToken} no existe.`;
  return `No se pudo tomar el caso ${caseToken}. Inténtalo de nuevo.`;
}

function Fila({
  fila,
  ahora,
  esDemo,
  onTomar,
}: {
  fila: AlertRow;
  ahora: number;
  esDemo: boolean;
  onTomar: () => void;
}) {
  const colorNivel = fila.youthLevel === "ROJO" ? semantic.danger : fila.youthLevel === "AMARILLO" ? semantic.warning : semantic.success;
  const esperando = waitingAt(fila.waitingSinceEpochMillis, ahora);
  const yaTomado = fila.assigneeId !== null;

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(140px, auto) 1fr auto auto",
        alignItems: "center",
        gap: "1rem",
        background: surface.raised,
        border: `1px solid ${fila.slaBreached ? `color-mix(in srgb, ${semantic.danger} 35%, transparent)` : "rgb(255 255 255 / 6%)"}`,
        borderRadius: "0.875rem",
        padding: "0.875rem 1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <span className="mono" style={{ color: text.primary, fontSize: "0.875rem" }}>
          {fila.caseToken}
        </span>
        {/* Nivel del joven: color + TEXTO. Nunca solo color (PR-001 §2). */}
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            background: `color-mix(in srgb, ${colorNivel} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${colorNivel} 30%, transparent)`,
            borderRadius: 999,
            padding: "0.0625rem 0.5rem",
            color: colorNivel,
            fontSize: "0.5625rem",
          }}
        >
          {fila.youthLevel}
        </span>
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, color: text.primary, fontSize: "0.8125rem" }}>
          {copy.MOTIVO[fila.motiveKey] ?? "Motivo registrado"}
        </p>
        <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.625rem" }}>
          {copy.RAZON[fila.reason] ?? fila.reason} ·{" "}
          {ESTADO_COPY[fila.state] ?? fila.state}
          {fila.patternKeys.length > 0 &&
            ` · ${fila.patternKeys.map((p) => copy.PATRON[p] ?? p).join(" · ")}`}
        </p>
      </div>

      <div style={{ textAlign: "right" }}>
        <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.5625rem" }}>
          ESPERANDO
        </p>
        <p
          className="mono"
          style={{
            margin: 0,
            color: fila.slaBreached ? semantic.danger : text.primary,
            fontSize: "0.75rem",
          }}
        >
          {formatWaiting(esperando)}
        </p>
        <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.5625rem" }}>
          {fila.assigneeName ?? "Sin asignar"}
        </p>
      </div>

      <button
        type="button"
        className="button-primary"
        style={{ width: "auto", padding: "0.4375rem 1rem", fontSize: "0.75rem" }}
        disabled={yaTomado || esDemo}
        onClick={onTomar}
        title={
          esDemo
            ? "Modo demostración: solo lectura"
            : yaTomado
              ? "Este caso ya tiene responsable"
              : "Tomar el caso"
        }
      >
        {yaTomado ? "Tomado" : "Tomar caso"}
      </button>
    </article>
  );
}

function Paginacion({
  pagina,
  total,
  tamano,
  onCambiar,
}: {
  pagina: number;
  total: number;
  tamano: number;
  onCambiar: (pagina: number) => void;
}) {
  const ultima = Math.max(1, Math.ceil(total / tamano));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.25rem" }}>
      <button
        type="button"
        className="button-link"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
      >
        ← Anterior
      </button>
      <span className="mono" style={{ color: text.muted, fontSize: "0.6875rem" }}>
        Página {pagina} de {ultima}
      </span>
      <button
        type="button"
        className="button-link"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= ultima}
      >
        Siguiente →
      </button>
    </div>
  );
}
