import { useState } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

export default function HomeJoven({ nav }: Props) {
  const [inputVal, setInputVal] = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Hola" : "Buenas noches";

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24 relative overflow-hidden">
      {/* Ambient shape */}
      <div
        className="absolute w-[360px] h-[360px] -top-24 -right-24 blob-1 opacity-[0.06]"
        style={{ background: "linear-gradient(135deg, #5B5CF0, #A78BFA)" }}
      />

      {/* Header */}
      <div className="relative z-10 px-5 pt-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[#9CA3AF] text-sm mb-1">{greeting},</p>
            <h1 className="font-display text-3xl font-medium text-[#111827] leading-tight">
              Alex.
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-[#E4E6F5] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM1 8a7 7 0 1114 0A7 7 0 011 8z" fill="#9CA3AF" />
              </svg>
            </div>
          </div>
        </div>

        {/* Hero headline */}
        <div className="mb-8">
          <h2 className="font-display text-[26px] font-light text-[#111827] leading-snug mb-1">
            Estoy aquí
            <br />
            <em className="text-[#5B5CF0] font-medium">contigo.</em>
          </h2>
          <p className="text-[#6B7280] text-sm">¿Qué necesitas hoy?</p>
        </div>
      </div>

      {/* MAIN MODULE — Me está pasando algo */}
      <div className="relative z-10 mx-4 mb-4">
        <div
          className="rounded-[24px] overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #4338CA 0%, #5B5CF0 50%, #7C3AED 100%)",
          }}
        >
          {/* Top decor */}
          <div className="relative px-6 pt-6 pb-0">
            <div
              className="absolute w-40 h-40 -top-12 -right-12 blob-1 opacity-15"
              style={{ background: "#A78BFA" }}
            />
            <div
              className="absolute w-24 h-24 top-2 -left-8 blob-2 opacity-10"
              style={{ background: "#5EEAD4" }}
            />

            <div className="relative flex items-center justify-between mb-4">
              <div>
                <span className="font-mono text-[10px] text-white/50 tracking-widest">
                  ME ESTÁ PASANDO ALGO
                </span>
              </div>
              <PuenteOrb size={36} />
            </div>

            <p className="text-white/80 text-sm leading-relaxed mb-5 relative">
              Puedes contarlo como quieras.
              <br />
              No hay respuestas correctas o incorrectas.
            </p>
          </div>

          {/* Input area */}
          <div className="px-4 pb-5 relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1 flex items-center gap-2 border border-white/20">
              <div className="flex-1 px-3 py-2.5">
                <p className="text-white/40 text-[11px] font-mono mb-1">HOY…</p>
                <input
                  className="w-full bg-transparent text-white text-sm placeholder-white/40 outline-none"
                  placeholder="Empieza con lo que tengas..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
              </div>
              <button
                className="bg-white text-[#5B5CF0] rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap hover:bg-white/90 transition-smooth"
                onClick={() => nav("conversation")}
              >
                Contarlo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND BLOCK — Ayudar */}
      <div className="relative z-10 mx-4 mb-4">
        <div
          className="rounded-[20px] border border-[#E4E6F5] bg-white p-5 cursor-pointer hover:border-[#14B8A6]/40 hover:shadow-md transition-smooth"
          onClick={() => nav("help-someone")}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl blob-3 flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #14B8A6, #5EEAD4)" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 4.5C7.41 4.5 4.5 7.41 4.5 11c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5S14.59 4.5 11 4.5z" fill="white" opacity="0.3" />
                <path d="M11 8v6M8 11h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-0.5">
                QUIERO AYUDAR A ALGUIEN
              </div>
              <p className="text-[#111827] text-sm font-medium leading-snug">
                Alguien confió en mí y quiero saber qué hacer.
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#9CA3AF]">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Secondary grid */}
      <div className="relative z-10 mx-4 grid grid-cols-2 gap-3 mb-5">
        {/* Mi recorrido */}
        <div
          className="rounded-[20px] bg-[#111827] p-5 cursor-pointer hover:bg-[#1C2133] transition-smooth"
          onClick={() => nav("journey")}
        >
          <div className="mb-8">
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
              {[0, 5, 10, 15, 20, 25].map((x, i) => (
                <circle
                  key={x}
                  cx={x + 2}
                  cy={i % 2 === 0 ? 10 : 8}
                  r="2.5"
                  fill={i < 4 ? "#5B5CF0" : "#5EEAD4"}
                  opacity={0.4 + i * 0.12}
                />
              ))}
              <path d="M2 10 L7 8 L12 10 L17 8 L22 10 L27 8" stroke="#5B5CF0" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          <div className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">MI RECORRIDO</div>
          <p className="text-white text-sm font-medium">Ver lo que ha ido cambiando</p>
        </div>

        {/* Señales de hoy */}
        <div
          className="rounded-[20px] bg-white border border-[#E4E6F5] p-5 cursor-pointer hover:border-[#5B5CF0]/30 hover:shadow-md transition-smooth"
          onClick={() => nav("signals")}
        >
          <div className="mb-8">
            <div className="flex gap-1 items-end h-8">
              {[4, 6, 5, 8, 7, 9, 11].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h * 2.5}px`,
                    background: i === 6 ? "#5B5CF0" : `rgba(91,92,240,${0.15 + i * 0.08})`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-1">PUENTE SIGNALS</div>
          <p className="text-[#111827] text-sm font-medium">Hay algo que cambió</p>
        </div>
      </div>

      {/* Recursos para hoy */}
      <div className="relative z-10 mx-4 mb-6">
        <div className="rounded-[20px] bg-white border border-[#E4E6F5] p-5">
          <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">RECURSOS PARA HOY</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { emoji: "🌬️", label: "Respirar", time: "2 min", color: "#5B5CF0" },
              { emoji: "✍️", label: "Escribir", time: "5 min", color: "#A78BFA" },
              { emoji: "🎵", label: "Escuchar", time: "3 min", color: "#14B8A6" },
            ].map((r) => (
              <div
                key={r.label}
                className="flex-shrink-0 rounded-2xl px-4 py-3 border border-[#E4E6F5] flex items-center gap-3 cursor-pointer hover:border-[#5B5CF0]/30 hover:bg-[#F7F8FC] transition-smooth"
              >
                <span className="text-xl">{r.emoji}</span>
                <div>
                  <p className="text-[#111827] text-sm font-medium">{r.label}</p>
                  <p className="text-[#9CA3AF] text-xs font-mono">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy indicator */}
      <div className="relative z-10 mx-4 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
        <p className="text-[#9CA3AF] text-xs font-mono">Tú decides qué compartir.</p>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#E4E6F5]">
        <div className="flex items-center justify-around max-w-sm mx-auto px-4 py-3">
          {[
            { label: "Inicio", screen: "home-joven" as Screen, active: true },
            { label: "Hablar", screen: "conversation" as Screen, active: false },
            { label: "Recorrido", screen: "journey" as Screen, active: false },
            { label: "Ayudar", screen: "help-someone" as Screen, active: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => nav(item.screen)}
              className={`flex flex-col items-center gap-1 transition-smooth ${item.active ? "text-[#5B5CF0]" : "text-[#9CA3AF]"}`}
            >
              <span className={`text-xs font-semibold ${item.active ? "" : "opacity-60"}`}>
                {item.label}
              </span>
              {item.active && <span className="w-1 h-1 rounded-full bg-[#5B5CF0]" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
