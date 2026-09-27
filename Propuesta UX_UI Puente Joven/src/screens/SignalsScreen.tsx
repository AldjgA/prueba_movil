import { useState } from "react";
import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

const timeline = [
  {
    date: "02 SEP",
    label: "Comentario aislado",
    desc: "\"Se rieron de mí en el pasillo.\"",
    intensity: 1,
    tags: ["Bullying"],
    color: "#A78BFA",
  },
  {
    date: "06 SEP",
    label: "Se repite",
    desc: "\"Ya son dos veces esta semana.\"",
    intensity: 2,
    tags: ["Bullying", "Frecuencia ↑"],
    color: "#818CF8",
  },
  {
    date: "09 SEP",
    label: "Empieza a evitar el recreo",
    desc: "\"Prefiero quedarme en el aula.\"",
    intensity: 3,
    tags: ["Aislamiento ↑", "Cambio conductual"],
    color: "#5B5CF0",
  },
  {
    date: "13 SEP",
    label: "Dificultad para asistir al colegio",
    desc: "\"No quiero ir mañana tampoco.\"",
    intensity: 4,
    tags: ["Impacto escolar ↑", "Señal prioritaria"],
    color: "#4338CA",
  },
];

const signals = [
  { label: "Frecuencia", value: 85, color: "#FB7185" },
  { label: "Aislamiento", value: 72, color: "#F59E0B" },
  { label: "Impacto escolar", value: 60, color: "#5B5CF0" },
];

export default function SignalsScreen({ nav }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#111827] pb-24 text-white">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => nav("home-joven")} className="text-[#6B7899] mb-6 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Volver</span>
        </button>

        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-mono text-[10px] text-[#5B5CF0] tracking-widest">PUENTE SIGNALS</span>
            <h1 className="font-display text-[28px] font-light leading-snug mt-1">
              Hay algo que
              <br />
              <em className="text-[#5EEAD4]">cambió.</em>
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#EF4444] animate-pulse" />
          </div>
        </div>
        <p className="text-[#6B7899] text-sm leading-relaxed">
          Puente encontró una evolución sostenida en tus últimos registros.
        </p>
      </div>

      {/* Signal meters */}
      <div className="px-5 mb-6">
        <div className="bg-[#1C1F33] rounded-2xl p-4 border border-white/5">
          <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">SEÑALES EN AUMENTO</p>
          <div className="space-y-3.5">
            {signals.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#E8EAFF]">{s.label}</span>
                  <span className="font-mono text-xs" style={{ color: s.color }}>↑ {s.value}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${s.value}%`,
                      background: `linear-gradient(90deg, ${s.color}80, ${s.color})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Longitudinal timeline */}
      <div className="px-5 mb-6">
        <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-4">EVOLUCIÓN REGISTRADA</p>
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute left-[19px] top-5 bottom-5 w-px"
            style={{ background: "linear-gradient(to bottom, #5B5CF0 0%, #4338CA 100%)" }}
          />

          <div className="space-y-3">
            {timeline.map((item, i) => (
              <div
                key={i}
                className={`relative flex gap-4 cursor-pointer transition-smooth ${
                  activeNode === i ? "scale-[1.01]" : ""
                }`}
                onClick={() => setActiveNode(activeNode === i ? null : i)}
              >
                {/* Node */}
                <div className="relative z-10 flex-shrink-0 mt-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-smooth"
                    style={{
                      background: activeNode === i ? item.color : `${item.color}20`,
                      borderColor: item.color,
                    }}
                  >
                    <span className="font-mono text-[9px] text-white font-medium">{i + 1}</span>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 rounded-2xl p-4 border transition-smooth"
                  style={{
                    background: activeNode === i ? `${item.color}12` : "rgba(28,31,51,0.6)",
                    borderColor: activeNode === i ? `${item.color}50` : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: item.color }}>
                      {item.date}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-sm"
                          style={{
                            background: j < item.intensity ? item.color : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium mb-1">{item.label}</p>
                  {activeNode === i && (
                    <p className="text-[#6B7899] text-xs italic mt-1 animate-float">{item.desc}</p>
                  )}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] px-2 py-0.5 rounded-full"
                        style={{
                          background: `${item.color}18`,
                          color: item.color,
                          border: `1px solid ${item.color}30`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transparency explanation */}
      <div className="px-5 mb-6">
        <div className="bg-[#1C1F33] rounded-2xl border border-white/5 overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="text-sm text-[#E8EAFF] font-medium">¿Por qué Puente te muestra esto?</span>
            <svg
              width="18" height="18" viewBox="0 0 18 18" fill="none"
              className="transition-smooth"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
            >
              <path d="M5 7l4 4 4-4" stroke="#6B7899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {expanded && (
            <div className="px-4 pb-4 animate-float">
              <p className="text-[#6B7899] text-sm leading-relaxed">
                Porque encontramos <span className="text-[#5EEAD4]">repetición y cambios</span> en cómo esta situación
                está afectando tu día. No es un diagnóstico: es información para ayudarte a entender mejor lo que está
                pasando y decidir qué quieres hacer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="px-5 space-y-3">
        <button
          className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth"
          style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
          onClick={() => nav("situation-map")}
        >
          Ver mapa de situación →
        </button>
        <button
          className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#6B7899] border border-white/10 hover:border-white/20 hover:text-white transition-smooth"
          onClick={() => nav("attention-level")}
        >
          Ver nivel de atención
        </button>
      </div>
    </div>
  );
}
