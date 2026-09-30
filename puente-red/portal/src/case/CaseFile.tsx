/**
 * PR-013 · Ficha de caso — las 7 secciones del brief §24.
 *
 * **Referencia visual:** `ProCaseScreen.tsx` del prototipo.
 *
 * **Lo que el portal NO hace:** no decide qué secciones mostrar ni cuáles faltan. Recibe las 7
 * del servidor, con sus claves de catálogo y su motivo de no disponibilidad. Si el portal
 * decidiera, dos pantallas podrían mostrar fichas distintas del mismo caso.
 *
 * **La ficha no muestra la conversación** (brief §24, guardrail #5). Lo que nunca se comparte
 * aparece **dicho**, no omitido.
 */

import { useCallback, useEffect, useState } from "react";

import { brand, semantic, surface, text } from "../design/tokens.ts";
import { useSession } from "../auth/SessionProvider.tsx";
import { createAlertsApi } from "../alerts/api.ts";
import { formatWaiting, waitingAt } from "../home/format.ts";
import { useTicker } from "../home/useTodayBoard.ts";
import { createCaseApi, type CaseFicha, type FichaSeccion } from "./api.ts";

// ---------------------------------------------------------------------------
// Copy. El servidor manda claves; el texto lo pone el portal.
// ---------------------------------------------------------------------------
const TITULO: Record<string, string> = {
  "ficha.seccion.motivo": "Motivo registrado",
  "ficha.seccion.evolucion": "Evolución longitudinal",
  "ficha.seccion.senales": "Señales observadas",
  "ficha.seccion.factores_protectores": "Factores protectores",
  "ficha.seccion.herramientas": "Herramientas utilizadas en Puente",
  "ficha.seccion.resumen_autorizado": "Resumen autorizado",
  "ficha.seccion.historial": "Historial de acciones",
};

const NO_DISPONIBLE: Record<string, string> = {
  "ficha.no_disponible.caracteristicas":
    "Todavía no disponible: las características del caso (PR-006) no llegan todavía a la cola.",
  "ficha.no_disponible.sin_expediente":
    "Todavía no disponible: la ingesta no trajo el expediente del Contrato A.",
};

const CLAVE: Record<string, string> = {
  aislamiento_persistente: "Aislamiento persistente",
  deterioro_escolar: "Deterioro escolar",
  ideacion_activa: "Ideación activa",
  plan_estructurado: "Plan estructurado",
  intento_reciente: "Intento reciente",
  autolesion: "Autolesión",
  abuso: "Abuso",
  peligro_inmediato: "Peligro inmediato",
  violencia_no_inmediata: "Violencia no inmediata",
  situacion: "Situación",
  frecuencia: "Frecuencia",
  impacto: "Impacto",
  apoyo_disponible: "Apoyo disponible",
  cambios_observados: "Cambios observados",
  breathe: "Respirar",
  write: "Escribir",
  listen: "Escuchar",
  "scope.conversacion_completa": "La conversación completa",
  "scope.notas_internas": "Las notas internas del equipo",
};

const ESTADO_COPY: Record<string, string> = {
  RECIBIDO: "Recibido",
  CLASIFICADO: "Clasificado",
  EN_COLA: "En cola",
  ASIGNADO: "Asignado",
  ACEPTADO: "Aceptado",
  CONTACTO_HABILITADO: "Con canal abierto",
  EN_CURSO: "En curso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const CONSENTIMIENTO_COPY: Record<string, string> = {
  AUTORIZADO: "Autorizado",
  REVOCADO: "Revocado por el joven",
  NO_CONSTA: "No consta",
};

export interface CaseFileProps {
  readonly caseToken: string;
  readonly onVolver: () => void;
}

export function CaseFile({ caseToken, onVolver }: CaseFileProps) {
  const { token, sesion } = useSession();
  const api = createCaseApi();
  const alertas = createAlertsApi();

  const [ficha, setFicha] = useState<CaseFicha | null>(null);
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
      const resultado = await api.ficha(token, caseToken);
      if (!vivo) return;
      setCargando(false);
      if (resultado === null) {
        setError("No se pudo cargar la ficha. Comprueba tu conexión e inténtalo de nuevo.");
        return;
      }
      setError(null);
      setFicha(resultado);
    })();

    return () => {
      vivo = false;
    };
  }, [api, token, caseToken, nonce]);

  const tomar = async () => {
    if (token === null) return;
    const resultado = await alertas.takeCase(token, caseToken);
    if (resultado.ok) {
      setAviso(`Caso ${caseToken} tomado. Ahora aparece como aceptado.`);
      recargar();
      return;
    }
    setAviso(
      resultado.reason === "DEMO_READ_ONLY"
        ? "En modo demostración no se pueden tomar casos: es de solo lectura."
        : `No se pudo tomar el caso ${caseToken}. Inténtalo de nuevo.`,
    );
  };

  const esDemo = sesion?.esDemo === true;

  return (
    <div style={{ padding: "2.5rem", maxWidth: 900 }}>
      <button type="button" className="button-link" onClick={onVolver} style={{ marginBottom: "1rem" }}>
        ← Volver a alertas
      </button>

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

      {ficha === null ? (
        <p className="mono" style={{ color: text.muted, fontSize: "0.75rem" }}>
          {cargando ? "Cargando ficha…" : ""}
        </p>
      ) : (
        <>
          {/* Cabecera. Criterio 7: el encuadre de prioridad preliminar SIEMPRE visible. */}
          <div
            style={{
              background: surface.raised,
              border: "1px solid rgb(255 255 255 / 6%)",
              borderRadius: "1rem",
              padding: "1.25rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span className="mono" style={{ color: text.primary, fontSize: "1.125rem", fontWeight: 500 }}>
                {ficha.caseToken}
              </span>
              <Etiqueta valor={ficha.youthLevel} color={colorNivel(ficha.youthLevel)} />
              <Etiqueta valor={ficha.categoria ?? "SIN CLASIFICAR"} color={brand.primarySoft} />
            </div>
            <p className="mono" style={{ margin: 0, color: text.muted, fontSize: "0.625rem" }}>
              {ficha.encuadreKey === "ficha.encuadre.prioridad_preliminar"
                ? "Prioridad preliminar de revisión — nunca un diagnóstico"
                : ficha.encuadreKey}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <Dato etiqueta="Estado" valor={ESTADO_COPY[ficha.estado] ?? ficha.estado} />
            <Dato
              etiqueta="Esperando"
              valor={formatWaiting(waitingAt(ficha.registradoEnEpochMillis, ahora))}
              color={ficha.slaBreached ? semantic.danger : undefined}
            />
            <Dato etiqueta="Responsable" valor={ficha.responsableNombre ?? "Sin asignar"} />
            <Dato
              etiqueta="Consentimiento"
              valor={CONSENTIMIENTO_COPY[ficha.consentimiento] ?? ficha.consentimiento}
              color={ficha.consentimiento === "REVOCADO" ? semantic.danger : semantic.success}
            />
          </div>

          {ficha.puedeTomarse && (
            <button
              type="button"
              className="button-primary"
              style={{ width: "auto", padding: "0.625rem 1.5rem", marginBottom: "1.5rem" }}
              disabled={esDemo}
              onClick={() => void tomar()}
              title={esDemo ? "Modo demostración: solo lectura" : "Tomar el caso"}
            >
              Tomar caso
            </button>
          )}

          {/* Las 7 secciones, en el orden del brief §24. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {ficha.secciones.map((seccion) => (
              <Seccion key={seccion.seccion} seccion={seccion} />
            ))}
          </div>

          {/* Enlace a PR-014, todavía no existe: se declara, no se finge. */}
          <button
            type="button"
            className="button-link"
            disabled
            title="Pendiente: PR-014 (separación «organizado por Puente» / «valoración profesional»)"
            style={{ marginTop: "1.5rem", opacity: 0.5, cursor: "not-allowed" }}
          >
            Abrir ficha de acompañamiento → (pendiente: PR-014)
          </button>
        </>
      )}
    </div>
  );
}

function colorNivel(nivel: string): string {
  if (nivel === "ROJO") return semantic.danger;
  if (nivel === "AMARILLO") return semantic.warning;
  return semantic.success;
}

function Etiqueta({ valor, color }: { valor: string; color: string }) {
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        borderRadius: 999,
        padding: "0.0625rem 0.5rem",
        color,
        fontSize: "0.5625rem",
      }}
    >
      {valor}
    </span>
  );
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div
      style={{
        background: surface.raised,
        border: "1px solid rgb(255 255 255 / 5%)",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
      }}
    >
      <p className="label" style={{ marginBottom: "0.25rem" }}>
        {etiqueta}
      </p>
      <p className="mono" style={{ margin: 0, color: color ?? text.primary, fontSize: "0.8125rem" }}>
        {valor}
      </p>
    </div>
  );
}

function Seccion({ seccion }: { seccion: FichaSeccion }) {
  return (
    <section
      style={{
        background: surface.raised,
        border: "1px solid rgb(255 255 255 / 6%)",
        borderRadius: "0.875rem",
        padding: "1.125rem 1.25rem",
      }}
    >
      <p className="label" style={{ marginBottom: "0.75rem" }}>
        {seccion.orden} · {TITULO[seccion.tituloKey] ?? seccion.tituloKey}
      </p>

      {!seccion.disponible ? (
        <p style={{ margin: 0, color: text.muted, fontSize: "0.8125rem" }}>
          {seccion.motivoNoDisponibleKey === null
            ? "Sin contenido."
            : (NO_DISPONIBLE[seccion.motivoNoDisponibleKey] ?? seccion.motivoNoDisponibleKey)}
        </p>
      ) : (
        <>
          {seccion.claveItems.length === 0 && seccion.eventos.length === 0 ? (
            <p style={{ margin: 0, color: text.muted, fontSize: "0.8125rem" }}>Sin contenido.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {seccion.claveItems.map((clave) => (
                <li
                  key={clave}
                  className="mono"
                  style={{
                    background: "rgb(255 255 255 / 4%)",
                    border: "1px solid rgb(255 255 255 / 8%)",
                    borderRadius: 999,
                    padding: "0.125rem 0.625rem",
                    color: text.primary,
                    fontSize: "0.6875rem",
                  }}
                >
                  {CLAVE[clave] ?? clave}
                </li>
              ))}
              {seccion.eventos.map((evento) => (
                <li
                  key={`${evento.tipo}-${evento.at}`}
                  className="mono"
                  style={{
                    background: "rgb(255 255 255 / 4%)",
                    border: "1px solid rgb(255 255 255 / 8%)",
                    borderRadius: 999,
                    padding: "0.125rem 0.625rem",
                    color: text.muted,
                    fontSize: "0.6875rem",
                  }}
                >
                  {ESTADO_COPY[evento.tipo] ?? evento.tipo}
                  {evento.actorKind === "HUMAN" ? " · equipo" : " · sistema"}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Criterio 3: lo que nunca se comparte se DICE, no se omite. */}
      {seccion.noAutorizadoKeys.length > 0 && (
        <div className="notice notice--info" role="note" style={{ marginTop: "0.75rem" }}>
          <span aria-hidden="true">🔒</span>
          <span>
            No autorizado para compartir:{" "}
            {seccion.noAutorizadoKeys.map((clave) => CLAVE[clave] ?? clave).join(" · ")}.
          </span>
        </div>
      )}
    </section>
  );
}
