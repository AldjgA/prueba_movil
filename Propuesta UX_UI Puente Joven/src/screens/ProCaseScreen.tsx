import { useState } from "react";
import { type Screen } from "../App";
import ProSidebar from "../components/ProSidebar";

interface Props { nav: (s: Screen) => void; }

const evolutionPoints = [
  { date: "02 SEP", label: "Inicio", intensity: 1, color: "#A78BFA" },
  { date: "06 SEP", label: "Repetición", intensity: 2, color: "#818CF8" },
  { date: "09 SEP", label: "Aislamiento", intensity: 3, color: "#5B5CF0" },
  { date: "13 SEP", label: "Impacto escolar", intensity: 4, color: "#4338CA" },
];

export default function ProCaseScreen({ nav }: Props) {
  const [taken, setTaken] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="pro-case" />
      <main className="flex-1 overflow-auto">
      {/* Top bar */}
      <div className="bg-[#141622] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => nav("pro-alerts")} className="text-[#6B7899] flex items-center gap-2 hover:text-white transition-smooth">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Alertas</span>
        </button>
        <span className="text-[#6B7899]">/</span>
        <span className="font-mono text-sm text-white">Caso PJ-032</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main content — 70% */}
          <div className="space-y-6">
            {/* Case header */}
            <div className="pro-surface rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-lg font-medium text-white">PJ-032</span>
                    <div className="flex items-center gap-1.5 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-full px-3 py-1">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span className="font-mono text-[11px] text-[#F59E0B]">AMARILLO · Patrón creciente</span>
                    </div>
                  </div>
                  <p className="text-[#6B7899] text-sm">Adolescente · 15 años · Colegio secundario</p>
                </div>
                <div className="font-mono text-xs text-[#6B7899] text-right">
                  <p>Registrado</p>
                  <p className="text-[#E8EAFF]">02 SEP 2026</p>
                </div>
              </div>
            </div>

            {/* Evolution signal */}
            <div className="pro-surface rounded-2xl p-6">
              <div className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-5">EVOLUCIÓN DEL CASO</div>

              {/* Timeline chart */}
              <div className="relative">
                {/* Y-axis labels */}
                <div className="flex gap-0">
                  <div className="flex flex-col justify-between pr-3 text-right h-28">
                    {["Alta", "Media", "Baja"].map((l) => (
                      <span key={l} className="font-mono text-[9px] text-[#6B7899]">{l}</span>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="flex-1 relative h-28">
                    {/* Grid lines */}
                    {[0, 33, 66, 100].map((pct) => (
                      <div
                        key={pct}
                        className="absolute w-full border-t border-white/5"
                        style={{ top: `${pct}%` }}
                      />
                    ))}

                    {/* SVG line + dots */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 112" preserveAspectRatio="none">
                      {/* Area fill */}
                      <defs>
                        <linearGradient id="evolGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5B5CF0" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#5B5CF0" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,84 L133,70 L267,42 L400,14 L400,112 L0,112 Z"
                        fill="url(#evolGrad)"
                      />
                      <path
                        d="M0,84 L133,70 L267,42 L400,14"
                        stroke="#5B5CF0"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {evolutionPoints.map((p, i) => (
                        <circle
                          key={i}
                          cx={i * 133}
                          cy={[84, 70, 42, 14][i]}
                          r="5"
                          fill={p.color}
                          stroke="#0D0F1A"
                          strokeWidth="2"
                        />
                      ))}
                    </svg>

                    {/* X labels */}
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between">
                      {evolutionPoints.map((p) => (
                        <span key={p.date} className="font-mono text-[9px] text-[#6B7899]">{p.date}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="pro-surface rounded-2xl p-5">
                <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">SEÑALES REGISTRADAS</p>
                <div className="space-y-2">
                  {["Bullying recurrente", "Aislamiento", "Cambio familiar", "Impacto escolar"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: ["#FB7185", "#F59E0B", "#14B8A6", "#EF4444"][i] }}
                      />
                      <span className="text-[#E8EAFF] text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pro-surface rounded-2xl p-5">
                <p className="font-mono text-[10px] text-[#22C55E] tracking-widest mb-4">FACTORES PROTECTORES</p>
                <div className="space-y-2">
                  {["Amiga cercana", "Profesor identificado"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                      <span className="text-[#E8EAFF] text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Apoyo en Puente */}
            <div className="pro-surface rounded-2xl p-6">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">APOYO REALIZADO EN PUENTE</p>
              <div className="flex gap-2 flex-wrap">
                {["Reconocimiento emocional", "Regulación", "Preparación para pedir ayuda"].map((a) => (
                  <span key={a} className="text-sm text-[#818CF8] bg-[#5B5CF0]/10 border border-[#5B5CF0]/15 rounded-full px-3 py-1.5">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Authorized summary */}
            <div className="pro-surface rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] text-[#6B7899] tracking-widest">RESUMEN AUTORIZADO POR EL ADOLESCENTE</p>
                <div className="flex items-center gap-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-3 py-1">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-[10px] text-[#22C55E]">Autorizado</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Situación", text: "Desde que mis padres se separaron, compañeros se ríen de mí en el colegio." },
                  { label: "Frecuencia", text: "Varias veces por semana. Comenzó el 2 de septiembre." },
                  { label: "Impacto", text: "Comenzó a evitar el recreo. Dificultad para asistir al colegio." },
                ].map((s) => (
                  <div key={s.label} className="flex gap-3">
                    <span className="font-mono text-[10px] text-[#6B7899] w-20 flex-shrink-0 pt-0.5">{s.label}</span>
                    <p className="text-[#E8EAFF] text-sm leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ficha link */}
            <button
              className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#6B7899] border border-white/8 hover:border-[#5B5CF0]/30 hover:text-white transition-smooth"
              onClick={() => nav("pro-ficha")}
            >
              Abrir ficha de acompañamiento →
            </button>
          </div>

          {/* Right panel — 30% */}
          <div className="space-y-4">
            {/* Status */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">ESTADO DEL CASO</p>
              <div className="space-y-3">
                {[
                  { label: "Nivel de atención", value: "Amarillo", valueColor: "#F59E0B" },
                  { label: "Esperando", value: "1h 24 min", valueColor: "#F59E0B" },
                  { label: "Estado", value: "En revisión", valueColor: "#E8EAFF" },
                  { label: "Responsable", value: "Sin asignar", valueColor: "#EF4444" },
                  { label: "Consentimiento", value: "Autorizado", valueColor: "#22C55E" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-2">
                    <span className="text-xs text-[#6B7899]">{row.label}</span>
                    <span className="font-mono text-xs font-medium text-right" style={{ color: row.valueColor }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next action */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-3">PRÓXIMA ACCIÓN</p>
              <div className="bg-[#5B5CF0]/8 border border-[#5B5CF0]/20 rounded-xl p-3 mb-4">
                <p className="text-[#818CF8] text-sm font-medium">Asignar profesional</p>
              </div>
              {!taken ? (
                <button
                  className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-smooth"
                  style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
                  onClick={() => setTaken(true)}
                >
                  Tomar caso
                </button>
              ) : (
                <div className="text-center animate-float">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E]/15 flex items-center justify-center mx-auto mb-2">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.5 9l4 4 7-7" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[#22C55E] text-sm font-medium mb-3">Caso tomado</p>
                  <button
                    className="w-full rounded-xl py-3 text-sm font-medium text-[#E8EAFF] border border-white/10 hover:border-white/20 transition-smooth"
                    onClick={() => nav("pro-ficha")}
                  >
                    Ir a ficha →
                  </button>
                </div>
              )}
            </div>

            {/* Signal badges */}
            <div className="pro-surface rounded-2xl p-5">
              <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-3">SEÑALES ACTIVAS</p>
              <div className="space-y-2">
                <div className="signal-rising rounded-xl px-3 py-2 text-xs font-mono">Bullying ↑ en progresión</div>
                <div className="signal-moderate rounded-xl px-3 py-2 text-xs font-mono">Aislamiento moderado</div>
                <div className="signal-moderate rounded-xl px-3 py-2 text-xs font-mono">Impacto escolar activo</div>
                <div className="signal-new rounded-xl px-3 py-2 text-xs font-mono">Cambio familiar reciente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
