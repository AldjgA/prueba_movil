import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

const concepts = [
  {
    id: "A",
    name: "Acompañamiento Vivo",
    desc: "Cálido, humano y emocional. La narrativa del adolescente es protagonista.",
    palette: ["#5B5CF0", "#A78BFA", "#5EEAD4", "#FB7185", "#F7F8FC"],
    bg: "bg-[#F7F8FC]",
    accent: "text-[#5B5CF0]",
    tag: "Warmth · Narrative · Organic",
    preview: "organic",
  },
  {
    id: "B",
    name: "Signals",
    desc: "Tecnológico y visual. Patrones, relaciones y evolución como lenguaje.",
    palette: ["#111827", "#5B5CF0", "#14B8A6", "#5EEAD4", "#818CF8"],
    bg: "bg-[#111827]",
    accent: "text-[#5EEAD4]",
    tag: "Pattern · Data · Evolution",
    preview: "dark",
  },
  {
    id: "C",
    name: "Human Network",
    desc: "Conexión visible: adolescente → Puente → profesional → comunidad.",
    palette: ["#1C1F33", "#4338CA", "#A78BFA", "#5EEAD4", "#FB7185"],
    bg: "bg-[#1C1F33]",
    accent: "text-[#A78BFA]",
    tag: "Network · Connection · Trust",
    preview: "network",
  },
];

export default function MoodboardScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white px-6 py-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="mb-2">
          <span className="font-mono text-[11px] text-[#6B7899] tracking-widest uppercase">
            Dirección Visual / Pre-diseño
          </span>
        </div>
        <h1 className="font-display text-4xl font-light leading-tight mb-2">
          Tres conceptos visuales
          <br />
          <em>para Puente.</em>
        </h1>
        <p className="text-[#6B7899] text-sm max-w-md mb-10">
          La dirección elegida combina A + B. Ver pantallas principales →
        </p>

        {/* Concept cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {concepts.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl overflow-hidden ${c.id === "B" ? "border border-[#5B5CF0]/30" : "border border-white/5"}`}
            >
              {/* Preview area */}
              <div className={`${c.bg} h-48 relative overflow-hidden p-6`}>
                {c.preview === "organic" && (
                  <>
                    <div
                      className="absolute w-32 h-32 blob-1 opacity-20 -top-8 -right-8"
                      style={{ background: "linear-gradient(135deg, #5B5CF0, #A78BFA)" }}
                    />
                    <div
                      className="absolute w-20 h-20 blob-2 opacity-15 bottom-4 left-4"
                      style={{ background: "#14B8A6" }}
                    />
                    <div className="relative z-10">
                      <div className="font-display text-2xl font-light text-[#111827] leading-tight">
                        "Hola, Alex."
                        <br />
                        <em className="text-[#5B5CF0]">Estoy aquí contigo.</em>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {["#5B5CF0", "#A78BFA", "#5EEAD4"].map((c) => (
                          <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {c.preview === "dark" && (
                  <>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 150">
                      {[
                        [20, 30], [60, 70], [100, 50], [140, 90], [180, 40],
                      ].map(([x, y], i, arr) =>
                        i < arr.length - 1 ? (
                          <line
                            key={i}
                            x1={x} y1={y}
                            x2={arr[i + 1][0]} y2={arr[i + 1][1]}
                            stroke="#5B5CF0" strokeWidth="1.5" opacity="0.4"
                          />
                        ) : null
                      )}
                      {[
                        [20, 30], [60, 70], [100, 50], [140, 90], [180, 40],
                      ].map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="4" fill="#5B5CF0" opacity="0.8" />
                      ))}
                    </svg>
                    <div className="relative z-10 mt-auto">
                      <div className="font-mono text-[10px] text-[#5EEAD4] tracking-widest mb-1">SEÑAL DETECTADA</div>
                      <div className="font-display text-xl font-light text-white leading-snug">
                        Patrón creciente
                        <br />
                        <span className="text-[#5B5CF0]">semana 3</span>
                      </div>
                    </div>
                  </>
                )}
                {c.preview === "network" && (
                  <>
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 150">
                      {/* Network lines */}
                      <line x1="100" y1="75" x2="40" y2="40" stroke="#A78BFA" strokeWidth="1" opacity="0.4" />
                      <line x1="100" y1="75" x2="160" y2="40" stroke="#A78BFA" strokeWidth="1" opacity="0.4" />
                      <line x1="100" y1="75" x2="40" y2="120" stroke="#5EEAD4" strokeWidth="1" opacity="0.4" />
                      <line x1="100" y1="75" x2="160" y2="120" stroke="#5EEAD4" strokeWidth="1" opacity="0.4" />
                      {/* Center node */}
                      <circle cx="100" cy="75" r="10" fill="#4338CA" opacity="0.9" />
                      <circle cx="40" cy="40" r="6" fill="#A78BFA" opacity="0.8" />
                      <circle cx="160" cy="40" r="6" fill="#A78BFA" opacity="0.8" />
                      <circle cx="40" cy="120" r="5" fill="#5EEAD4" opacity="0.8" />
                      <circle cx="160" cy="120" r="5" fill="#FB7185" opacity="0.8" />
                      <text x="100" y="79" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">P</text>
                    </svg>
                    <div className="relative z-10 mt-auto">
                      <div className="font-display text-xl font-light text-white leading-snug mt-16">
                        Una red<br />
                        <span className="text-[#A78BFA]">de apoyo real.</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="bg-[#141622] p-5 border-t border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] text-[#6B7899] tracking-widest">
                    CONCEPTO {c.id}
                  </span>
                  {c.id === "B" && (
                    <span className="text-[9px] bg-[#5B5CF0]/20 text-[#818CF8] px-2 py-0.5 rounded-full font-semibold">
                      DIRECCIÓN ELEGIDA
                    </span>
                  )}
                  {c.id === "A" && (
                    <span className="text-[9px] bg-[#14B8A6]/20 text-[#5EEAD4] px-2 py-0.5 rounded-full font-semibold">
                      + COMBINADO
                    </span>
                  )}
                </div>
                <h3 className={`font-display text-lg font-medium mb-1 ${c.accent}`}>
                  {c.name}
                </h3>
                <p className="text-[#6B7899] text-xs leading-relaxed mb-3">{c.desc}</p>
                <div className="flex gap-1.5 mb-3">
                  {c.palette.map((color) => (
                    <div
                      key={color}
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                </div>
                <p className="font-mono text-[10px] text-[#6B7899]/60">{c.tag}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Design decision */}
        <div className="border border-[#5B5CF0]/20 rounded-2xl bg-[#5B5CF0]/5 p-6 mb-8">
          <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-3">DECISIÓN DE DISEÑO</div>
          <p className="text-[#E8EAFF] text-sm leading-relaxed max-w-2xl">
            La dirección final combina <strong className="text-[#A78BFA]">Acompañamiento Vivo</strong> (calidez, tipografía expresiva,
            formas orgánicas, paleta sobre blanco cálido para el lado joven) con{" "}
            <strong className="text-[#5EEAD4]">Signals</strong> (visualizaciones longitudinales, constelaciones de datos,
            superficie oscura para el workspace profesional). La transición entre ambos mundos es parte del lenguaje visual.
          </p>
        </div>

        <button
          onClick={() => nav("entry")}
          className="bg-[#5B5CF0] text-white rounded-xl px-8 py-3.5 font-semibold text-sm hover:bg-[#4338CA] transition-smooth"
        >
          Ver prototipo completo →
        </button>
      </div>
    </div>
  );
}
