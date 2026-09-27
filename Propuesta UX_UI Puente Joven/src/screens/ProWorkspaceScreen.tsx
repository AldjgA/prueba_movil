import { type Screen } from "../App";
import ProSidebar from "../components/ProSidebar";

interface Props { nav: (s: Screen) => void; }

const cases = [
  {
    id: "PJ-047",
    level: "RED",
    levelColor: "#EF4444",
    levelBg: "#EF4444",
    label: "Seguridad prioritaria",
    waiting: "18 min",
    assigned: null,
    tags: ["Señal crítica", "Sin asignar"],
    context: "Aislamiento severo + expresión de indefensión",
    signals: ["Aislamiento ↑↑", "Impacto escolar", "Sin apoyo"],
  },
  {
    id: "PJ-032",
    level: "YELLOW",
    levelColor: "#F59E0B",
    levelBg: "#F59E0B",
    label: "Patrón creciente",
    waiting: "1h 24 min",
    assigned: null,
    tags: ["Bullying", "Cambio familiar"],
    context: "Bullying recurrente + separación parental",
    signals: ["Bullying ↑", "Aislamiento ↑", "Impacto escolar"],
  },
  {
    id: "PJ-018",
    level: "YELLOW",
    levelColor: "#F59E0B",
    levelBg: "#F59E0B",
    label: "Ciberbullying recurrente",
    waiting: "3h 10 min",
    assigned: "M. Vera",
    tags: ["Ciberbullying", "Asignado"],
    context: "Ciberbullying en plataformas externas al colegio",
    signals: ["Ciberbullying ↑", "Cambio emocional"],
  },
  {
    id: "PJ-011",
    level: "GREEN",
    levelColor: "#22C55E",
    levelBg: "#22C55E",
    label: "Estable en seguimiento",
    waiting: "—",
    assigned: "R. Morales",
    tags: ["Seguimiento", "Activo"],
    context: "Conflicto familiar en resolución",
    signals: ["Estabilización"],
  },
];

const stats = [
  { label: "Sin asignar", value: 2, color: "#EF4444", icon: "⚠️" },
  { label: "En revisión", value: 5, color: "#F59E0B", icon: "⏱" },
  { label: "Con patrón creciente", value: 3, color: "#5B5CF0", icon: "📈" },
  { label: "Tiempo prom. respuesta", value: "47 min", color: "#14B8A6", icon: "⚡" },
];

export default function ProWorkspaceScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="pro-workspace" />

      <main className="flex-1 overflow-auto">
      {/* Top bar */}
      <div className="bg-[#141622] border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#5B5CF0]/10 border border-[#5B5CF0]/20 rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5B5CF0]" />
            <span className="font-mono text-[11px] text-[#818CF8]">Psicología</span>
          </div>
          <button
            className="text-xs text-[#6B7899] hover:text-[#5B5CF0] transition-smooth font-mono"
            onClick={() => nav("pro-alerts")}
          >
            Ver alertas →
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">
              DOMINGO 13 SEP · WORKSPACE ACTIVO
            </p>
            <h1 className="font-display text-2xl font-light text-white">
              Prioridad de hoy
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="font-mono text-[11px] text-[#6B7899]">En vivo</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="pro-surface rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-lg">{s.icon}</span>
                <span className="font-mono text-[10px] text-[#6B7899] tracking-widest">
                  AHORA
                </span>
              </div>
              <div className="font-display text-2xl font-medium mb-1" style={{ color: s.color }}>
                {s.value}
              </div>
              <p className="text-[#6B7899] text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cases list — 2/3 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest">
                CASOS ACTIVOS · ORDENADOS POR URGENCIA
              </p>
              <button className="font-mono text-[10px] text-[#5B5CF0] hover:text-[#818CF8] transition-smooth">
                Ver todos →
              </button>
            </div>

            <div className="space-y-3">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className={`pro-surface rounded-2xl p-5 cursor-pointer hover:border-[#5B5CF0]/20 transition-smooth ${
                    c.level === "RED" ? "priority-red" : c.level === "YELLOW" ? "priority-yellow" : "priority-green"
                  }`}
                  onClick={() => c.id === "PJ-032" && nav("pro-case")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-white">{c.id}</span>
                        <div
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
                          style={{ background: `${c.levelColor}18`, border: `1px solid ${c.levelColor}30` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.levelColor }} />
                          <span className="font-mono text-[10px]" style={{ color: c.levelColor }}>
                            {c.level}
                          </span>
                        </div>
                        {c.tags.map((t) => (
                          <span key={t} className="font-mono text-[10px] text-[#6B7899] bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-[#E8EAFF] text-sm font-medium mb-1">{c.label}</p>
                      <p className="text-[#6B7899] text-xs mb-2">{c.context}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {c.signals.map((sig) => (
                          <span key={sig} className="font-mono text-[10px] text-[#818CF8] bg-[#5B5CF0]/10 border border-[#5B5CF0]/15 rounded-full px-2 py-0.5">
                            {sig}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-mono text-xs text-[#6B7899] mb-1">Esperando</p>
                      <p
                        className="font-mono text-sm font-medium"
                        style={{ color: c.level === "RED" ? "#EF4444" : c.level === "YELLOW" ? "#F59E0B" : "#22C55E" }}
                      >
                        {c.waiting}
                      </p>
                      {c.assigned ? (
                        <p className="font-mono text-[10px] text-[#6B7899] mt-1">{c.assigned}</p>
                      ) : (
                        <p className="font-mono text-[10px] text-[#EF4444]/80 mt-1">Sin asignar</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — 1/3 */}
          <div className="space-y-4">
            {/* Queue health */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">SALUD DE LA COLA</p>
              <div className="space-y-3">
                {[
                  { label: "Rojo · Prioritario", n: 1, max: 5, c: "#EF4444" },
                  { label: "Amarillo · En seguimiento", n: 2, max: 10, c: "#F59E0B" },
                  { label: "Verde · Estable", n: 4, max: 10, c: "#22C55E" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-[#6B7899]">{row.label}</span>
                      <span className="font-mono text-xs" style={{ color: row.c }}>{row.n}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(row.n / row.max) * 100}%`, background: row.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">ACCIONES RÁPIDAS</p>
              <div className="space-y-2">
                {[
                  { label: "Tomar caso sin asignar", color: "#EF4444", action: () => nav("pro-case") },
                  { label: "Ver visualizaciones", color: "#5B5CF0", action: () => nav("pro-viz") },
                  { label: "Observatorio comunitario", color: "#14B8A6", action: () => nav("observatory") },
                ].map((a) => (
                  <button
                    key={a.label}
                    className="w-full text-left rounded-xl px-4 py-3 text-sm text-[#E8EAFF] border border-white/8 hover:border-white/15 transition-smooth"
                    style={{ background: `${a.color}08` }}
                    onClick={a.action}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time of response */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">TIEMPO DE RESPUESTA</p>
              {[
                { label: "< 1h", pct: 28, c: "#22C55E" },
                { label: "1 – 4h", pct: 45, c: "#14B8A6" },
                { label: "4 – 12h", pct: 18, c: "#F59E0B" },
                { label: "> 12h", pct: 9, c: "#EF4444" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] text-[#6B7899] w-12">{r.label}</span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.c }} />
                  </div>
                  <span className="font-mono text-[10px] w-6 text-right" style={{ color: r.c }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
