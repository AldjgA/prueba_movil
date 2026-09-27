import { useState } from "react";
import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

const roles = ["Amigo/a", "Compañero/a", "Familiar", "Profesor/a", "Tutor/a"];

export default function HelpSomeoneScreen({ nav }: Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [inputText, setInputText] = useState("");

  const handleContinue = () => {
    if (selectedRole && inputText.trim()) setShowGuide(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => nav("home-joven")} className="text-[#9CA3AF] mb-6 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Inicio</span>
        </button>

        <div className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-2">QUIERO AYUDAR A ALGUIEN</div>
        <h1 className="font-display text-[28px] font-light text-[#111827] leading-snug mb-1">
          Alguien confió
          <br />
          <em className="text-[#14B8A6] font-medium">en ti.</em>
        </h1>
        <p className="text-[#6B7280] text-sm">
          No necesitas tener la respuesta perfecta para acompañar.
        </p>
      </div>

      {!showGuide ? (
        <>
          {/* Role selector */}
          <div className="px-4 mb-6">
            <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">
              ¿QUIÉN TE CONTÓ ALGO?
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  className="rounded-2xl px-4 py-2.5 text-sm font-medium transition-smooth border"
                  style={{
                    background: selectedRole === role ? "#14B8A6" : "white",
                    color: selectedRole === role ? "white" : "#374151",
                    borderColor: selectedRole === role ? "#14B8A6" : "#E4E6F5",
                  }}
                  onClick={() => setSelectedRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* What did they share */}
          <div className="px-4 mb-6">
            <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">
              ¿QUÉ TE CONTÓ?
            </p>
            <div className="bg-white border border-[#E4E6F5] rounded-2xl p-4">
              <textarea
                className="w-full bg-transparent text-sm text-[#111827] placeholder-[#9CA3AF] outline-none resize-none"
                rows={4}
                placeholder="Mi amiga dice que ya no quiere ir al colegio porque se burlan de ella..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
          </div>

          <div className="px-4">
            <button
              className="w-full rounded-2xl py-4 text-sm font-semibold transition-smooth"
              style={{
                background:
                  selectedRole && inputText.trim()
                    ? "linear-gradient(135deg, #14B8A6, #0D9488)"
                    : "#E4E6F5",
                color: selectedRole && inputText.trim() ? "white" : "#9CA3AF",
              }}
              onClick={handleContinue}
            >
              Ver cómo acompañar →
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 animate-float">
          {/* Person badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center">
              <span className="font-mono text-[10px] text-[#14B8A6] font-medium">
                {selectedRole?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest">ACOMPAÑANDO A</p>
              <p className="text-[#111827] font-medium text-sm">{selectedRole}</p>
            </div>
          </div>

          {/* Guide blocks */}
          <div className="space-y-3">
            {[
              {
                step: "AHORA",
                icon: "👂",
                headline: "Escucha.",
                color: "#14B8A6",
                bg: "#14B8A6",
              },
              {
                step: "PUEDES DECIR",
                icon: "💬",
                headline: "\"Gracias por confiar en mí.\"",
                color: "#5B5CF0",
                bg: "#5B5CF0",
              },
              {
                step: "EVITA",
                icon: "🚫",
                headline: "\"No les hagas caso.\"",
                color: "#FB7185",
                bg: "#FB7185",
                note: "Minimizar lo que siente puede hacer que se cierre más.",
              },
              {
                step: "PUEDES PREGUNTAR",
                icon: "❓",
                headline: "\"¿Esto está pasando seguido?\"",
                color: "#A78BFA",
                bg: "#A78BFA",
              },
              {
                step: "SIGUIENTE PASO",
                icon: "🤝",
                headline: "Puedes acompañarla a hablar con alguien.",
                color: "#22C55E",
                bg: "#22C55E",
                action: true,
              },
            ].map((block) => (
              <div
                key={block.step}
                className="rounded-2xl p-5 border"
                style={{
                  background: `${block.bg}06`,
                  borderColor: `${block.color}25`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: block.color }}>
                    {block.step}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{block.icon}</span>
                  <div>
                    <p className="text-[#111827] text-sm font-semibold leading-snug">{block.headline}</p>
                    {block.note && (
                      <p className="text-[#9CA3AF] text-xs mt-1 leading-relaxed">{block.note}</p>
                    )}
                  </div>
                </div>
                {block.action && (
                  <button
                    className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-smooth"
                    style={{ background: block.color }}
                    onClick={() => nav("conversation")}
                  >
                    Ir juntos a Puente →
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            className="mt-4 text-sm text-[#9CA3AF] underline w-full text-center"
            onClick={() => setShowGuide(false)}
          >
            Editar información
          </button>
        </div>
      )}
    </div>
  );
}
