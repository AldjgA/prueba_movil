import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

export default function EntryScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#F7F8FC] relative overflow-hidden flex flex-col">
      {/* Background shapes */}
      <div
        className="absolute w-[600px] h-[600px] -top-48 -right-48 blob-1 opacity-[0.07]"
        style={{ background: "linear-gradient(135deg, #5B5CF0, #A78BFA)" }}
      />
      <div
        className="absolute w-[400px] h-[400px] -bottom-32 -left-32 blob-2 opacity-[0.05]"
        style={{ background: "#14B8A6" }}
      />

      {/* Top bar */}
      <header className="relative z-10 px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PuenteOrb size={32} />
          <span className="font-display text-lg font-medium text-[#111827] tracking-tight">
            Puente
          </span>
        </div>
        <button
          onClick={() => nav("moodboard")}
          className="text-xs font-mono text-[#9CA3AF] hover:text-[#5B5CF0] transition-smooth"
        >
          / ver moodboard
        </button>
      </header>

      {/* Main content — desktop split layout */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-6xl mx-auto px-8 py-12 lg:py-0 w-full gap-12 lg:gap-24">
        {/* Left: hero */}
        <div className="flex-1 pt-4 lg:pt-0">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-white border border-[#E4E6F5] rounded-full px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="font-mono text-[11px] text-[#6B7280] tracking-wide">
                Sistema activo
              </span>
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] font-light text-[#111827] leading-[1.1] tracking-tight mb-5">
            Un espacio para
            <br />
            <em className="text-[#5B5CF0] not-italic font-medium">
              entender lo que
            </em>
            <br />
            está pasando.
          </h1>

          <p className="text-[#6B7280] text-base md:text-lg leading-relaxed max-w-md mb-10">
            Y encontrar el siguiente paso.
          </p>

          {/* Access cards */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
            {/* Puente Joven */}
            <div
              className="flex-1 bg-white border border-[#E4E6F5] rounded-2xl p-6 cursor-pointer group hover:border-[#5B5CF0]/40 hover:shadow-lg transition-smooth relative overflow-hidden"
              onClick={() => nav("joven-login")}
            >
              <div
                className="absolute w-24 h-24 -top-8 -right-8 blob-1 opacity-10 group-hover:opacity-20 transition-smooth"
                style={{ background: "#5B5CF0" }}
              />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#5B5CF0]/10 flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C7.24 2 5 4.24 5 7c0 2.09 1.26 3.9 3.1 4.72C5.2 12.57 3 15.12 3 18h14c0-2.88-2.2-5.43-5.1-6.28C13.74 10.9 15 9.09 15 7c0-2.76-2.24-5-5-5z" fill="#5B5CF0" />
                  </svg>
                </div>
                <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-1">PUENTE JOVEN</div>
                <h2 className="font-display text-lg font-medium text-[#111827] mb-2 leading-snug">
                  Recibir apoyo o acompañar a alguien.
                </h2>
                <p className="text-[#9CA3AF] text-xs leading-relaxed mb-4">
                  Un espacio privado para recibir apoyo o aprender a acompañar a alguien.
                </p>
                <button
                  className="w-full bg-[#5B5CF0] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#4338CA] transition-smooth"
                  onClick={(e) => { e.stopPropagation(); nav("joven-login"); }}
                >
                  Entrar a Puente Joven
                </button>
              </div>
            </div>

            {/* Puente Red */}
            <div
              className="flex-1 bg-[#0D0F1A] border border-white/10 rounded-2xl p-6 cursor-pointer group hover:border-[#5B5CF0]/30 hover:shadow-xl transition-smooth relative overflow-hidden"
              onClick={() => nav("pro-login")}
            >
              <div
                className="absolute w-24 h-24 -bottom-8 -right-8 blob-2 opacity-10 group-hover:opacity-20 transition-smooth"
                style={{ background: "#14B8A6" }}
              />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="11" rx="2" stroke="#14B8A6" strokeWidth="1.5" />
                    <path d="M7 5V4a3 3 0 016 0v1" stroke="#14B8A6" strokeWidth="1.5" />
                    <path d="M10 10v3M8.5 11.5h3" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">PUENTE RED</div>
                <h2 className="font-display text-lg font-medium text-white mb-2 leading-snug">
                  Acceso para profesionales y equipos autorizados.
                </h2>
                <p className="text-[#6B7899] text-xs leading-relaxed mb-4">
                  Un espacio de trabajo para profesionales y equipos autorizados.
                </p>
                <button
                  className="w-full bg-white/8 text-white border border-white/15 rounded-xl py-3 text-sm font-semibold hover:bg-[#14B8A6]/15 hover:border-[#14B8A6]/40 transition-smooth"
                  onClick={(e) => { e.stopPropagation(); nav("pro-login"); }}
                >
                  Entrar a Puente Red
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: visual / signal diagram */}
        <div className="hidden lg:flex flex-col items-center gap-0 relative w-64">
          {/* Signal flow diagram */}
          <div className="relative">
            {[
              { label: "RELATO", color: "#5B5CF0", delay: "0s" },
              { label: "SEÑALES", color: "#A78BFA", delay: "0.1s" },
              { label: "CAMBIOS", color: "#14B8A6", delay: "0.2s" },
              { label: "PATRÓN", color: "#5EEAD4", delay: "0.3s" },
              { label: "RUTA", color: "#22C55E", delay: "0.4s" },
              { label: "AYUDA", color: "#F7F8FC", delay: "0.5s", textDark: true },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center">
                <div
                  className="w-32 rounded-lg px-4 py-2.5 flex items-center justify-center"
                  style={{
                    background: step.textDark ? step.color : `${step.color}18`,
                    border: `1.5px solid ${step.color}40`,
                    animationDelay: step.delay,
                  }}
                >
                  <span
                    className="font-mono text-[11px] font-medium tracking-widest"
                    style={{ color: step.textDark ? "#111827" : step.color }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < 5 && (
                  <div className="w-px h-5 bg-gradient-to-b from-[#5B5CF0] to-[#14B8A6] opacity-30 my-1" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest leading-relaxed">
              DE LA CONVERSACIÓN
              <br />
              A LA INTERVENCIÓN HUMANA
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 pb-8 flex items-center justify-between">
        <p className="font-mono text-[11px] text-[#9CA3AF]">
          Puente · No diagnostica · No reemplaza profesionales
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#14B8A6]" />
          <span className="font-mono text-[11px] text-[#9CA3AF]">Privado por diseño</span>
        </div>
      </footer>
    </div>
  );
}
