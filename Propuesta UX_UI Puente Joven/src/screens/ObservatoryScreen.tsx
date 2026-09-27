import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { type Screen } from "../App";
import ProSidebar from "../components/ProSidebar";

interface Props { nav: (s: Screen) => void; }

const distributionData = [
  { label: "Bullying", current: 36, prev: 34, color: "#5B5CF0" },
  { label: "Cambios familiares", current: 24, prev: 22, color: "#A78BFA" },
  { label: "Ciberbullying", current: 21, prev: 18, color: "#14B8A6" },
  { label: "Aislamiento", current: 19, prev: 20, color: "#5EEAD4" },
];

const weeklyData = [
  { week: "Sem 1", casos: 12 },
  { week: "Sem 2", casos: 18 },
  { week: "Sem 3", casos: 24 },
  { week: "Sem 4", casos: 31 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1F33] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="font-mono text-[#6B7899] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color || "#E8EAFF" }}>{p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ObservatoryScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="observatory" />
      <main className="flex-1 overflow-auto">
      {/* Top bar */}
      <div className="bg-[#141622] border-b border-white/5 px-6 py-4">
        <span className="font-mono text-sm text-white">Observatorio Puente</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">OBSERVATORIO PUENTE · DATOS ANÓNIMOS</p>
              <h1 className="font-display text-2xl font-light text-white leading-snug">
                Lo que estamos observando
                <br />
                <em className="text-[#5EEAD4]">en la comunidad.</em>
              </h1>
            </div>
            <div className="bg-[#141622] border border-white/10 rounded-2xl px-5 py-3">
              <p className="font-mono text-[10px] text-[#6B7899] mb-0.5">PERIODO</p>
              <p className="font-mono text-sm text-[#E8EAFF] font-medium">Septiembre 2026</p>
            </div>
          </div>

          {/* Anonymity note */}
          <div className="bg-[#5B5CF0]/8 border border-[#5B5CF0]/15 rounded-xl p-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#5B5CF0]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#5B5CF0]" />
            </div>
            <p className="text-[#818CF8] text-sm leading-relaxed">
              Esta información es <strong>completamente anónima</strong> y agregada.
              No incluye conversaciones, identidades ni datos personales.
              Representa tendencias observadas en la comunidad, no diagnósticos.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Distribution */}
            <div className="pro-surface rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">DISTRIBUCIÓN POR TIPO</p>
                  <p className="text-[#6B7899] text-xs">Septiembre 2026 vs. Agosto 2026</p>
                </div>
              </div>

              <div className="space-y-4">
                {distributionData.map((d) => {
                  const diff = d.current - d.prev;
                  return (
                    <div key={d.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-sm text-[#E8EAFF]">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[#6B7899]">
                            vs. ago {d.prev}%
                          </span>
                          <span
                            className="font-mono text-xs font-medium"
                            style={{ color: diff > 0 ? "#EF4444" : diff < 0 ? "#22C55E" : "#6B7899" }}
                          >
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </span>
                          <span className="font-mono text-sm font-medium" style={{ color: d.color }}>
                            {d.current}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${d.current}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly trend */}
            <div className="pro-surface rounded-2xl p-6">
              <p className="font-mono text-[10px] text-[#5EEAD4] tracking-widest mb-5">TENDENCIA SEMANAL · REGISTROS TOTALES</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#6B7899", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6B7899", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="casos" name="Casos" radius={[6, 6, 0, 0]}>
                    {weeklyData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === weeklyData.length - 1 ? "#5B5CF0" : "#5B5CF025"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key insight */}
            <div className="bg-[#14B8A6]/8 border border-[#14B8A6]/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/15 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v4l3 3" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="8" cy="8" r="6" stroke="#14B8A6" strokeWidth="1.2" />
                  </svg>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#5EEAD4] tracking-widest mb-2">TENDENCIA OBSERVADA</p>
                  <p className="text-[#E8EAFF] text-sm leading-relaxed mb-3">
                    Los registros relacionados con <strong className="text-[#5EEAD4]">ciberbullying aumentaron un 14%</strong>{" "}
                    durante las últimas tres semanas. Esta tendencia coincide con el inicio del ciclo escolar.
                  </p>
                  <div className="bg-[#0D0F1A]/50 border border-white/5 rounded-xl p-3">
                    <p className="text-[#6B7899] text-xs leading-relaxed italic">
                      Una tendencia observada no representa un diagnóstico ni una causa confirmada.
                      Representa patrones en los registros anónimos del período.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Period stats */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">ESTADÍSTICAS DEL PERÍODO</p>
              <div className="space-y-4">
                {[
                  { label: "Total de registros", value: "247", color: "#E8EAFF" },
                  { label: "Tendencias identificadas", value: "4", color: "#5B5CF0" },
                  { label: "Señales en aumento", value: "2", color: "#EF4444" },
                  { label: "Señales estables", value: "1", color: "#22C55E" },
                  { label: "Señales en descenso", value: "1", color: "#14B8A6" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-xs text-[#6B7899]">{s.label}</span>
                    <span className="font-mono text-sm font-medium" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ciberbullying highlight */}
            <div className="bg-[#EF4444]/8 border border-[#EF4444]/20 rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#EF4444] tracking-widest mb-3">SEÑAL EN AUMENTO</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display text-3xl font-medium text-white">+14%</span>
                <div>
                  <p className="text-[#E8EAFF] text-sm font-medium">Ciberbullying</p>
                  <p className="text-[#6B7899] text-xs">vs. agosto 2026</p>
                </div>
              </div>
              <p className="text-[#6B7899] text-xs leading-relaxed">
                Último aumento registrado: semana 3 de septiembre.
              </p>
            </div>

            {/* Context breakdown */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">CONTEXTO ASOCIADO</p>
              <div className="space-y-2">
                {[
                  { label: "Colegio", pct: 68, c: "#5B5CF0" },
                  { label: "Hogar", pct: 22, c: "#A78BFA" },
                  { label: "Sin especificar", pct: 10, c: "#6B7899" },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[#E8EAFF]">{r.label}</span>
                      <span className="font-mono text-xs" style={{ color: r.c }}>{r.pct}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.c }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav */}
            <button
              className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#6B7899] border border-white/8 hover:border-white/15 hover:text-white transition-smooth"
              onClick={() => nav("pro-viz")}
            >
              Ver todas las visualizaciones →
            </button>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
