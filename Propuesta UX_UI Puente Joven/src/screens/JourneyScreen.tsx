import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

const events = [
  {
    date: "SEP 02",
    title: "Primera vez",
    desc: "Comentario aislado en el pasillo. Decidiste no contarlo.",
    emotion: "Confusión",
    emotionColor: "#A78BFA",
    context: "Colegio",
    intensity: 1,
  },
  {
    date: "SEP 06",
    title: "Se repite",
    desc: "Ocurrió de nuevo. Empezaste a pensar en ello durante la noche.",
    emotion: "Tristeza",
    emotionColor: "#5B5CF0",
    context: "Colegio",
    intensity: 2,
  },
  {
    date: "SEP 09",
    title: "Cambio conductual",
    desc: "Comenzaste a evitar el recreo. Preferiste quedarte en el aula.",
    emotion: "Vergüenza",
    emotionColor: "#FB7185",
    context: "Colegio",
    intensity: 3,
  },
  {
    date: "SEP 11",
    title: "Lo contaste en Puente",
    desc: "Primera vez que describiste lo que estaba pasando.",
    emotion: "Alivio",
    emotionColor: "#22C55E",
    context: "Puente",
    intensity: 2,
    special: true,
  },
  {
    date: "SEP 13",
    title: "Dificultad escolar",
    desc: "No querías ir al colegio. El impacto se extendió a la asistencia.",
    emotion: "Agotamiento",
    emotionColor: "#F59E0B",
    context: "Hogar · Colegio",
    intensity: 4,
  },
];

export default function JourneyScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-white border-b border-[#F0F1FA]">
        <button onClick={() => nav("home-joven")} className="text-[#9CA3AF] mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Inicio</span>
        </button>
        <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-1">MI RECORRIDO</div>
        <h1 className="font-display text-2xl font-light text-[#111827]">
          Lo que ha ido
          <br />
          <em className="text-[#5B5CF0] font-medium">cambiando.</em>
        </h1>
      </div>

      {/* Before/After comparison */}
      <div className="mx-4 mt-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#E4E6F5] rounded-2xl p-4">
            <div className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-2">ANTES</div>
            <p className="text-[#111827] text-sm leading-relaxed mb-3">
              Comentarios ocasionales. Sin patrón.
            </p>
            <div className="flex gap-1">
              {[1, 1, 0, 0, 0].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: v ? "#5B5CF0" : "#E4E6F5" }}
                />
              ))}
            </div>
          </div>
          <div className="bg-[#5B5CF0] rounded-2xl p-4">
            <div className="font-mono text-[10px] text-white/50 tracking-widest mb-2">AHORA</div>
            <p className="text-white text-sm leading-relaxed mb-3">
              Mayor repetición + aislamiento creciente.
            </p>
            <div className="flex gap-1">
              {[1, 1, 1, 1, 1].map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-white/40" />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#EF4444]/6 border border-[#EF4444]/15 rounded-xl p-3 mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
          <p className="text-[#EF4444] text-xs font-medium">Esto cambió en 11 días.</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4">
        <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-4">LÍNEA DE TIEMPO</p>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px timeline-connector opacity-20" />

          <div className="space-y-4">
            {events.map((ev, i) => (
              <div key={i} className="flex gap-5 animate-float" style={{ animationDelay: `${i * 0.08}s` }}>
                {/* Date & dot */}
                <div className="flex flex-col items-center w-8 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0"
                    style={{
                      background: ev.special ? "#22C55E" : `${ev.emotionColor}18`,
                      border: `2px solid ${ev.special ? "#22C55E" : ev.emotionColor}`,
                    }}
                  >
                    {ev.special && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 rounded-2xl p-4 mb-1"
                  style={{
                    background: ev.special ? "#22C55E08" : "white",
                    border: `1px solid ${ev.special ? "#22C55E30" : "#E4E6F5"}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-[10px] text-[#9CA3AF]">{ev.date}</span>
                      <h3 className="text-[#111827] text-sm font-semibold mt-0.5">{ev.title}</h3>
                    </div>
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 mt-1"
                      style={{
                        background: `${ev.emotionColor}15`,
                        color: ev.emotionColor,
                        border: `1px solid ${ev.emotionColor}30`,
                      }}
                    >
                      {ev.emotion}
                    </span>
                  </div>

                  <p className="text-[#6B7280] text-xs leading-relaxed mb-2">{ev.desc}</p>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#9CA3AF]">{ev.context}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div
                          key={j}
                          className="w-1.5 h-1.5 rounded-sm"
                          style={{
                            background: j < ev.intensity ? ev.emotionColor : "#E4E6F5",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 mt-6">
        <button
          className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth"
          style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
          onClick={() => nav("referral")}
        >
          Preparar solicitud de apoyo →
        </button>
      </div>
    </div>
  );
}
