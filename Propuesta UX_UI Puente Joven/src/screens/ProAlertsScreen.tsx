import { useState } from "react";
import { type Screen } from "../App";
import ProSidebar from "../components/ProSidebar";

interface Props { nav: (s: Screen) => void; }

type Filter = "todos" | "rojo" | "amarillo" | "sin-asignar" | "seguimiento" | "derivados";

const alerts = [
  {
    id: "PJ-047",
    level: "rojo" as const,
    levelColor: "#EF4444",
    motivo: "Seguridad prioritaria",
    pattern: "Aislamiento severo · Expresión de indefensión",
    waiting: "18 min",
    assigned: null,
    status: "sin-asignar",
    tags: ["Aislamiento ↑↑", "Sin apoyo detectado"],
    updated: "hace 18 min",
  },
  {
    id: "PJ-032",
    level: "amarillo" as const,
    levelColor: "#F59E0B",
    motivo: "Patrón creciente",
    pattern: "Bullying recurrente · Cambio familiar · Aislamiento ↑",
    waiting: "1h 24 min",
    assigned: null,
    status: "sin-asignar",
    tags: ["Bullying ↑", "Impacto escolar"],
    updated: "hace 1h 24 min",
  },
  {
    id: "PJ-018",
    level: "amarillo" as const,
    levelColor: "#F59E0B",
    motivo: "Ciberbullying recurrente",
    pattern: "Ciberbullying · Cambio emocional sostenido",
    waiting: "3h 10 min",
    assigned: "M. Vera",
    status: "seguimiento",
    tags: ["Ciberbullying ↑", "Emocional"],
    updated: "hace 3h",
  },
  {
    id: "PJ-061",
    level: "amarillo" as const,
    levelColor: "#F59E0B",
    motivo: "Conflicto familiar",
    pattern: "Tensión familiar · Bajo estado emocional",
    waiting: "6h",
    assigned: "R. Morales",
    status: "seguimiento",
    tags: ["Familia", "Emocional"],
    updated: "hace 6h",
  },
  {
    id: "PJ-029",
    level: "verde" as const,
    levelColor: "#22C55E",
    motivo: "Dificultades escolares",
    pattern: "Bajo rendimiento · Sin señales adicionales",
    waiting: "—",
    assigned: "R. Morales",
    status: "derivados",
    tags: ["Escolar"],
    updated: "ayer",
  },
];

const filters: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "rojo", label: "Rojo" },
  { id: "amarillo", label: "Amarillo" },
  { id: "sin-asignar", label: "Sin asignar" },
  { id: "seguimiento", label: "En seguimiento" },
  { id: "derivados", label: "Derivados" },
];

export default function ProAlertsScreen({ nav }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>("todos");

  const filtered = alerts.filter((a) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "rojo") return a.level === "rojo";
    if (activeFilter === "amarillo") return a.level === "amarillo";
    if (activeFilter === "sin-asignar") return a.status === "sin-asignar";
    if (activeFilter === "seguimiento") return a.status === "seguimiento";
    if (activeFilter === "derivados") return a.status === "derivados";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="pro-alerts" />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-[#141622] border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-0.5">CENTRO DE ALERTAS</p>
            <h1 className="font-display text-xl font-light text-white">¿Qué necesita atención ahora?</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="font-mono text-xs text-[#6B7899]">2 sin asignar</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-6 border-b border-white/5 pb-5">
            {filters.map((f) => (
              <button
                key={f.id}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-smooth border"
                style={{
                  background: activeFilter === f.id ? "#5B5CF0" : "rgba(255,255,255,0.04)",
                  color: activeFilter === f.id ? "white" : "#6B7899",
                  borderColor: activeFilter === f.id ? "#5B5CF0" : "rgba(255,255,255,0.06)",
                }}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
                {f.id === "sin-asignar" && <span className="ml-2 text-[10px] text-[#EF4444]">2</span>}
              </button>
            ))}
          </div>

          {/* Alert list */}
          <div className="space-y-3">
            {filtered.map((alert) => (
              <div
                key={alert.id}
                className="pro-surface rounded-2xl p-5 cursor-pointer hover:border-[#5B5CF0]/20 transition-smooth group"
                style={{
                  borderLeft: `3px solid ${alert.levelColor}`,
                }}
                onClick={() => alert.id === "PJ-032" && nav("pro-case")}
              >
                <div className="flex items-start gap-5">
                  {/* Left: ID + level */}
                  <div className="flex-shrink-0 w-28">
                    <span className="font-mono text-base font-medium text-white">{alert.id}</span>
                    <div
                      className="flex items-center gap-1.5 mt-1 rounded-full px-2.5 py-1 w-fit"
                      style={{ background: `${alert.levelColor}18`, border: `1px solid ${alert.levelColor}30` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: alert.levelColor }} />
                      <span className="font-mono text-[10px]" style={{ color: alert.levelColor }}>
                        {alert.level.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Middle: content */}
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <p className="text-[#E8EAFF] text-sm font-semibold">{alert.motivo}</p>
                    </div>
                    <p className="text-[#6B7899] text-xs mb-2">{alert.pattern}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {alert.tags.map((t) => (
                        <span key={t} className="font-mono text-[10px] text-[#818CF8] bg-[#5B5CF0]/10 border border-[#5B5CF0]/15 rounded-full px-2 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: meta */}
                  <div className="flex-shrink-0 text-right space-y-1">
                    <div>
                      <p className="font-mono text-[10px] text-[#6B7899]">Esperando</p>
                      <p className="font-mono text-sm font-medium" style={{ color: alert.level === "rojo" ? "#EF4444" : "#F59E0B" }}>
                        {alert.waiting}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-[#6B7899]">Responsable</p>
                      <p className="font-mono text-xs" style={{ color: alert.assigned ? "#E8EAFF" : "#EF4444" }}>
                        {alert.assigned ?? "Sin asignar"}
                      </p>
                    </div>
                  </div>

                  {/* CTA arrow */}
                  <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-smooth">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M8 5l5 5-5 5" stroke="#5B5CF0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Priority action for unassigned */}
                {!alert.assigned && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#6B7899]">Actualizado {alert.updated}</span>
                    <button
                      className="bg-[#5B5CF0]/15 text-[#818CF8] border border-[#5B5CF0]/25 rounded-xl px-4 py-1.5 text-xs font-semibold hover:bg-[#5B5CF0]/25 transition-smooth"
                      onClick={(e) => { e.stopPropagation(); nav("pro-case"); }}
                    >
                      Revisar ahora
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#6B7899] text-sm">No hay alertas en esta categoría.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
