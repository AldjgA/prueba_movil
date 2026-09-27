import ProSidebar from "../components/ProSidebar";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

const evolutionData = [
  { week: "Sem 1", bullying: 2, aislamiento: 1, impacto: 0 },
  { week: "Sem 2", bullying: 3, aislamiento: 2, impacto: 1 },
  { week: "Sem 3", bullying: 4, aislamiento: 3, impacto: 2 },
  { week: "Sem 4", bullying: 4, aislamiento: 4, impacto: 4 },
];

const responseData = [
  { label: "< 1h", value: 28, color: "#22C55E" },
  { label: "1–4h", value: 45, color: "#14B8A6" },
  { label: "4–12h", value: 18, color: "#F59E0B" },
  { label: "> 12h", value: 9, color: "#EF4444" },
];

const referralData = [
  { label: "Pendiente", value: 3, color: "#6B7899" },
  { label: "Contactado", value: 8, color: "#818CF8" },
  { label: "Derivado", value: 12, color: "#5B5CF0" },
  { label: "Seguimiento", value: 24, color: "#14B8A6" },
  { label: "Cerrado", value: 156, color: "#22C55E" },
];

const heatmapRows = ["Bullying", "Ciberbullying", "Aislamiento", "Cambios familiares", "Impacto escolar"];
const heatmapCols = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
const heatmapData = [
  [1, 2, 3, 4],
  [0, 1, 2, 4],
  [1, 1, 3, 4],
  [2, 2, 2, 3],
  [0, 1, 2, 4],
];

const heatColors = ["rgba(91,92,240,0.06)", "rgba(91,92,240,0.2)", "rgba(91,92,240,0.4)", "rgba(91,92,240,0.6)", "rgba(91,92,240,0.85)"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1F33] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="font-mono text-[#6B7899] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProVisualizationsScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="pro-viz" />
      <main className="flex-1 overflow-auto">
      {/* Top bar */}
      <div className="bg-[#141622] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <span className="font-mono text-sm text-white">Reportes y Visualizaciones</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">ANÁLISIS DE PATRONES</p>
          <h1 className="font-display text-2xl font-light text-white">Visualizaciones del equipo</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* A — Heatmap */}
          <div className="pro-surface rounded-2xl p-6 lg:col-span-2">
            <div className="mb-4">
              <p className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-1">A · MATRIZ DE PATRONES</p>
              <p className="text-[#6B7899] text-xs">¿Qué señales están aumentando y cuándo?</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left pr-4 pb-3 font-mono text-[10px] text-[#6B7899] tracking-widest">SEÑAL</th>
                    {heatmapCols.map((col) => (
                      <th key={col} className="text-center pb-3 font-mono text-[10px] text-[#6B7899] tracking-widest px-2">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapRows.map((row, ri) => (
                    <tr key={row}>
                      <td className="pr-4 py-2 text-sm text-[#E8EAFF] whitespace-nowrap">{row}</td>
                      {heatmapData[ri].map((val, ci) => (
                        <td key={ci} className="py-2 px-2 text-center">
                          <div
                            className="w-full rounded-lg py-3 flex items-center justify-center transition-smooth cursor-default"
                            style={{
                              background: heatColors[val],
                              minWidth: "60px",
                            }}
                          >
                            <span
                              className="font-mono text-[11px] font-medium"
                              style={{ color: val >= 3 ? "#E8EAFF" : val >= 2 ? "#A78BFA" : "#6B7899" }}
                            >
                              {val === 0 ? "·" : val}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-3 mt-4">
                <span className="font-mono text-[10px] text-[#6B7899]">Intensidad:</span>
                {[0, 1, 2, 3, 4].map((v) => (
                  <div key={v} className="flex items-center gap-1">
                    <div className="w-5 h-3 rounded-sm" style={{ background: heatColors[v] }} />
                    <span className="font-mono text-[9px] text-[#6B7899]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* B — Evolution line chart */}
          <div className="pro-surface rounded-2xl p-6">
            <div className="mb-5">
              <p className="font-mono text-[10px] text-[#A78BFA] tracking-widest mb-1">B · EVOLUCIÓN DEL CASO PJ-032</p>
              <p className="text-[#6B7899] text-xs">¿Qué señales están creciendo juntas?</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#6B7899", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7899", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="bullying" name="Bullying" stroke="#FB7185" strokeWidth={2} dot={{ fill: "#FB7185", r: 4 }} />
                <Line type="monotone" dataKey="aislamiento" name="Aislamiento" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 4 }} />
                <Line type="monotone" dataKey="impacto" name="Impacto escolar" stroke="#5B5CF0" strokeWidth={2} dot={{ fill: "#5B5CF0", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              {[
                { label: "Bullying", c: "#FB7185" },
                { label: "Aislamiento", c: "#F59E0B" },
                { label: "Impacto", c: "#5B5CF0" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.c }} />
                  <span className="font-mono text-[10px] text-[#6B7899]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* C — Response time bar chart */}
          <div className="pro-surface rounded-2xl p-6">
            <div className="mb-5">
              <p className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-1">C · TIEMPO DE RESPUESTA</p>
              <p className="text-[#6B7899] text-xs">¿Qué tan rápido responde el equipo?</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={responseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6B7899", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="label" tick={{ fill: "#6B7899", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="%" radius={[0, 6, 6, 0]}>
                  {responseData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* D — Referral funnel */}
          <div className="pro-surface rounded-2xl p-6 lg:col-span-2">
            <div className="mb-5">
              <p className="font-mono text-[10px] text-[#F59E0B] tracking-widest mb-1">D · FLUJO DE ATENCIÓN Y DERIVACIONES</p>
              <p className="text-[#6B7899] text-xs">¿Cómo fluyen los casos a través del sistema?</p>
            </div>
            <div className="flex items-end gap-4 overflow-x-auto pb-2">
              {referralData.map((d, i) => (
                <div key={d.label} className="flex flex-col items-center flex-1 min-w-[80px]">
                  <span className="font-mono text-sm font-medium mb-2" style={{ color: d.color }}>{d.value}</span>
                  <div
                    className="w-full rounded-t-xl transition-all duration-700"
                    style={{
                      height: `${Math.max((d.value / 156) * 140, 20)}px`,
                      background: `linear-gradient(to top, ${d.color}40, ${d.color}90)`,
                      border: `1px solid ${d.color}30`,
                    }}
                  />
                  <p className="font-mono text-[10px] text-[#6B7899] mt-2 text-center">{d.label}</p>
                </div>
              ))}
            </div>
            {/* Arrows between */}
            <div className="flex items-center justify-between px-8 mt-2">
              {referralData.slice(0, -1).map((_, i) => (
                <svg key={i} width="24" height="10" viewBox="0 0 24 10" fill="none" className="opacity-30">
                  <path d="M0 5h20M16 1l4 4-4 4" stroke="#6B7899" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
          </div>

          {/* E — Growing signals */}
          <div className="pro-surface rounded-2xl p-6">
            <div className="mb-5">
              <p className="font-mono text-[10px] text-[#FB7185] tracking-widest mb-1">E · CASOS CON SEÑALES CRECIENTES</p>
              <p className="text-[#6B7899] text-xs">¿Qué requiere atención ahora mismo?</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Bullying + Aislamiento", cases: 3, trend: "+2 esta semana", c: "#EF4444" },
                { label: "Ciberbullying", cases: 2, trend: "+1 esta semana", c: "#F59E0B" },
                { label: "Impacto escolar", cases: 4, trend: "Sin cambio", c: "#5B5CF0" },
                { label: "Cambios familiares", cases: 5, trend: "-1 esta semana", c: "#22C55E" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.c }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#E8EAFF]">{row.label}</span>
                      <span className="font-mono text-sm font-medium" style={{ color: row.c }}>{row.cases}</span>
                    </div>
                    <p className="font-mono text-[10px] text-[#6B7899]">{row.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* F — Observatory link */}
          <div
            className="pro-surface rounded-2xl p-6 cursor-pointer border border-[#14B8A6]/20 hover:border-[#14B8A6]/40 transition-smooth"
            onClick={() => nav("observatory")}
          >
            <div className="mb-5">
              <p className="font-mono text-[10px] text-[#5EEAD4] tracking-widest mb-1">F · OBSERVATORIO COMUNITARIO</p>
              <p className="text-[#6B7899] text-xs">Tendencias anónimas de la comunidad</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Bullying", pct: 36, c: "#5B5CF0" },
                { label: "Cambios familiares", pct: 24, c: "#A78BFA" },
                { label: "Ciberbullying", pct: 21, c: "#14B8A6" },
                { label: "Aislamiento", pct: 19, c: "#5EEAD4" },
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
            <div className="mt-4 text-[#5EEAD4] text-sm font-medium">Ver observatorio completo →</div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
