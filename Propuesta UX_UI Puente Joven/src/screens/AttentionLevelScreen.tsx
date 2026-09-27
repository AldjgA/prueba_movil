import { useState } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

const levels = {
  green: {
    color: "#22C55E",
    bg: "#22C55E",
    label: "VERDE",
    title: "Podemos trabajar en esto paso a paso.",
    explanation: "Lo que contaste muestra algo que vale la pena atender. No es urgente, pero sí importante. Puente puede acompañarte con herramientas que funcionan.",
    changed: "Esta es la primera vez que registramos esta situación.",
    next: "Te sugerimos una herramienta breve para empezar.",
  },
  yellow: {
    color: "#F59E0B",
    bg: "#F59E0B",
    label: "AMARILLO",
    title: "Sería bueno involucrar a alguien.",
    explanation: "Notamos que lo que estás viviendo ha cambiado en las últimas semanas. La frecuencia aumentó y está afectando tu día a día. No tienes que manejarlo solo/a.",
    changed: "La frecuencia aumentó y empezó a afectar tu asistencia al colegio.",
    next: "Podemos ayudarte a preparar cómo pedir apoyo a alguien de confianza.",
  },
  red: {
    color: "#EF4444",
    bg: "#EF4444",
    label: "ROJO",
    title: "Esto necesita apoyo humano prioritario.",
    explanation: "Lo que compartiste indica que necesitas apoyo de una persona capacitada ahora. No porque estés haciendo algo mal, sino porque mereces tener a alguien real acompañándote.",
    changed: "Aparecieron señales que indican que necesitas apoyo inmediato.",
    next: "Vamos a preparar una solicitud para que alguien del equipo te contacte pronto.",
  },
};

export default function AttentionLevelScreen({ nav }: Props) {
  const [showWhy, setShowWhy] = useState(false);
  const level = levels.yellow; // Demo: always yellow

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => nav("situation-map")} className="text-[#9CA3AF] mb-6 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Mapa</span>
        </button>
        <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-2">NIVEL DE ATENCIÓN</div>
      </div>

      {/* Level card — main visual */}
      <div className="mx-4 mb-5">
        <div
          className="rounded-[24px] p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${level.color}15 0%, ${level.color}08 100%)`,
            border: `2px solid ${level.color}30`,
          }}
        >
          {/* Ambient blob */}
          <div
            className="absolute w-40 h-40 -top-10 -right-10 blob-1 opacity-20"
            style={{ background: level.color }}
          />

          <div className="relative z-10">
            {/* Level indicator */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2 border"
                style={{
                  background: `${level.color}18`,
                  borderColor: `${level.color}40`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ background: level.color }}
                />
                <span
                  className="font-mono text-xs font-medium tracking-widest"
                  style={{ color: level.color }}
                >
                  NIVEL {level.label}
                </span>
              </div>
            </div>

            <h1 className="font-display text-[26px] font-light text-[#111827] leading-snug mb-4">
              {level.title}
            </h1>

            <p className="text-[#6B7280] text-sm leading-relaxed mb-5">
              {level.explanation}
            </p>

            {/* What changed */}
            <div
              className="rounded-2xl p-4 border"
              style={{ background: `${level.color}08`, borderColor: `${level.color}20` }}
            >
              <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: level.color }}>
                QUÉ CAMBIÓ
              </p>
              <p className="text-[#374151] text-sm">{level.changed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Puente shows this */}
      <div className="mx-4 mb-5">
        <div className="bg-white border border-[#E4E6F5] rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5 text-left"
            onClick={() => setShowWhy(!showWhy)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F0F1FA] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#5B5CF0" strokeWidth="1.2" />
                  <path d="M7 6v3M7 4.5h.01" stroke="#5B5CF0" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[#111827] text-sm font-medium">¿Por qué Puente te muestra esto?</span>
            </div>
            <svg
              width="18" height="18" viewBox="0 0 18 18" fill="none"
              className="transition-smooth flex-shrink-0"
              style={{ transform: showWhy ? "rotate(180deg)" : "rotate(0)" }}
            >
              <path d="M5 7l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showWhy && (
            <div className="px-5 pb-5 animate-float">
              <p className="text-[#6B7280] text-sm leading-relaxed mb-4">
                Nos contaste situaciones similares en <strong className="text-[#5B5CF0]">4 momentos distintos</strong> y recientemente mencionaste que estás evitando espacios del colegio.
              </p>

              {/* Signal list */}
              <div className="space-y-2">
                {[
                  { signal: "Bullying recurrente", dates: "02, 06, 09, 13 SEP", c: "#FB7185" },
                  { signal: "Aislamiento", dates: "09, 13 SEP", c: "#F59E0B" },
                  { signal: "Impacto escolar", dates: "13 SEP", c: "#5B5CF0" },
                ].map((s) => (
                  <div
                    key={s.signal}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: `${s.c}08`, border: `1px solid ${s.c}20` }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />
                      <span className="text-xs text-[#374151]">{s.signal}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#9CA3AF]">{s.dates}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What happens next */}
      <div className="mx-4 mb-6">
        <div className="bg-white border border-[#E4E6F5] rounded-2xl p-5">
          <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">QUÉ OCURRE DESPUÉS</p>
          <p className="text-[#374151] text-sm leading-relaxed">{level.next}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-4 space-y-3">
        <button
          className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth"
          style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
          onClick={() => nav("route")}
        >
          Ver herramienta recomendada →
        </button>
        <button
          className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#5B5CF0] border-2 border-[#5B5CF0]/20 hover:border-[#5B5CF0]/40 hover:bg-[#5B5CF0]/4 transition-smooth"
          onClick={() => nav("referral")}
        >
          Preparar solicitud de apoyo
        </button>
        <button
          className="w-full text-sm text-[#9CA3AF] py-2"
          onClick={() => nav("personal-report")}
        >
          Ver reporte personal
        </button>
      </div>
    </div>
  );
}
