import { useState } from "react";
import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

export default function RouteScreen({ nav }: Props) {
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhala" | "exhala">("inhala");
  const [count, setCount] = useState(0);

  const startBreathing = () => {
    setBreathing(true);
    let phase: "inhala" | "exhala" = "inhala";
    let c = 0;
    const interval = setInterval(() => {
      phase = phase === "inhala" ? "exhala" : "inhala";
      c += 0.5;
      setBreathPhase(phase);
      setCount(Math.floor(c));
      if (c >= 4) {
        clearInterval(interval);
        setBreathing(false);
        setCount(0);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => nav("situation-map")} className="text-[#9CA3AF] mb-6 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Mapa</span>
        </button>

        <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-2">RUTA PERSONALIZADA</div>
        <h1 className="font-display text-[28px] font-light text-[#111827] leading-snug">
          Un paso
          <br />
          <em className="text-[#5B5CF0]">a la vez.</em>
        </h1>
      </div>

      {/* AHORA — main action */}
      <div className="mx-4 mb-5">
        <div
          className="rounded-[24px] overflow-hidden"
          style={{ background: "linear-gradient(150deg, #F7F8FC 0%, #EEF0FB 100%)" }}
        >
          <div className="border border-[#5B5CF0]/15 rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-1">AHORA · 1 MIN</div>
                <h2 className="font-display text-xl font-medium text-[#111827]">
                  Bajemos un poco la tensión.
                </h2>
              </div>
              <div className="font-mono text-xs text-[#9CA3AF]">1 min</div>
            </div>

            {/* Breathing exercise */}
            <div className="flex flex-col items-center py-6">
              {/* Orb */}
              <div className="relative mb-6">
                <div
                  className="rounded-full transition-all duration-3000 ease-in-out"
                  style={{
                    width: breathing && breathPhase === "inhala" ? 120 : 80,
                    height: breathing && breathPhase === "inhala" ? 120 : 80,
                    background:
                      "radial-gradient(circle at 35% 30%, #A78BFA, #5B5CF0 50%, #14B8A6)",
                    boxShadow: breathing
                      ? "0 0 40px rgba(91,92,240,0.35)"
                      : "0 0 20px rgba(91,92,240,0.15)",
                    opacity: 0.9,
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)",
                  }}
                />
              </div>

              {breathing ? (
                <div className="text-center animate-float">
                  <p className="font-display text-2xl font-light text-[#5B5CF0] mb-1">
                    {breathPhase === "inhala" ? "Inhala..." : "Exhala..."}
                  </p>
                  <p className="font-mono text-xs text-[#9CA3AF]">Ciclo {count + 1} de 4</p>
                </div>
              ) : (
                <button
                  className="bg-[#5B5CF0] text-white rounded-2xl px-8 py-3.5 text-sm font-semibold hover:bg-[#4338CA] transition-smooth shadow-lg"
                  onClick={startBreathing}
                >
                  {count > 0 ? "Completado ✓" : "Comenzar respiración"}
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-[#9CA3AF] font-mono">
                4 ciclos · inhala 4s · exhala 4s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SIGUIENTE */}
      <div className="mx-4 mb-5">
        <div className="bg-white rounded-[20px] border border-[#E4E6F5] p-5 opacity-80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#F0F1FA] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.2" />
                <path d="M7 4.5V7l2 2" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest">SIGUIENTE · 3 MIN</div>
              <p className="text-[#111827] text-sm font-medium">Preparemos cómo pedir ayuda.</p>
            </div>
          </div>
          <div className="h-0.5 bg-[#F0F1FA] rounded-full mb-3" />
          <p className="text-[#9CA3AF] text-xs">Disponible al completar el primer paso.</p>
        </div>
      </div>

      {/* Also available */}
      <div className="mx-4">
        <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">TAMBIÉN PUEDES</p>
        <div className="space-y-2">
          {[
            { label: "Ordenar lo que ocurrió", icon: "📋", action: "journey" as Screen },
            { label: "Poner nombre a lo que sientes", icon: "💭", action: "conversation" as Screen },
            { label: "Ver qué está en tus manos", icon: "✋", action: "situation-map" as Screen },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 bg-white border border-[#E4E6F5] rounded-2xl p-4 hover:border-[#5B5CF0]/30 hover:shadow-sm transition-smooth text-left"
              onClick={() => nav(item.action)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[#111827] text-sm">{item.label}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-auto text-[#9CA3AF]">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Request help */}
      <div className="mx-4 mt-5">
        <button
          className="w-full rounded-2xl py-3.5 text-sm font-semibold text-[#5B5CF0] border-2 border-[#5B5CF0]/20 hover:border-[#5B5CF0]/50 hover:bg-[#5B5CF0]/5 transition-smooth"
          onClick={() => nav("referral")}
        >
          Solicitar apoyo de alguien →
        </button>
      </div>
    </div>
  );
}
