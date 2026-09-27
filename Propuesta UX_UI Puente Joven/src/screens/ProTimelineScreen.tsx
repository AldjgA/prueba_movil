import { type Screen } from "../App";
import ProSidebar from "../components/ProSidebar";

interface Props { nav: (s: Screen) => void; }

const timelineEvents = [
  {
    time: "13 SEP · 13:48",
    event: "Registro recibido",
    desc: "Adolescente completó conversación inicial en Puente Joven.",
    actor: "Sistema",
    type: "system",
    color: "#5B5CF0",
  },
  {
    time: "13 SEP · 13:49",
    event: "Chequeo contextual completado",
    desc: "5 dimensiones exploradas. Señales de aislamiento y sueño alterado detectadas.",
    actor: "Sistema",
    type: "system",
    color: "#5B5CF0",
  },
  {
    time: "13 SEP · 13:51",
    event: "Patrón detectado",
    desc: "4 registros en 11 días. Frecuencia ↑, aislamiento ↑, impacto escolar ↑.",
    actor: "Puente Signals",
    type: "signal",
    color: "#A78BFA",
  },
  {
    time: "13 SEP · 13:52",
    event: "Nivel de atención: Amarillo",
    desc: "Criterios: repetición sostenida + cambio conductual + impacto escolar.",
    actor: "Sistema",
    type: "alert",
    color: "#F59E0B",
  },
  {
    time: "13 SEP · 13:55",
    event: "Resumen revisado por el adolescente",
    desc: "Alex revisó el resumen de 5 secciones en Puente Joven.",
    actor: "Alex (usuario)",
    type: "user",
    color: "#14B8A6",
  },
  {
    time: "13 SEP · 14:00",
    event: "Solicitud autorizada",
    desc: "Alex autorizó el envío del resumen a un profesional.",
    actor: "Alex (usuario)",
    type: "user",
    color: "#22C55E",
  },
  {
    time: "13 SEP · 14:01",
    event: "Alerta enviada a Puente Red",
    desc: "Caso PJ-032 creado. Sin responsable asignado.",
    actor: "Sistema",
    type: "system",
    color: "#5B5CF0",
  },
  {
    time: "13 SEP · 15:05",
    event: "Caso tomado",
    desc: "Ana López tomó el caso PJ-032 para revisión.",
    actor: "Ana López · Psicología",
    type: "professional",
    color: "#818CF8",
  },
  {
    time: "13 SEP · 15:22",
    event: "Valoración registrada",
    desc: "Primera valoración clínica completada. Acción: contacto inicial planificado.",
    actor: "Ana López · Psicología",
    type: "professional",
    color: "#818CF8",
  },
  {
    time: "13 SEP · 15:30",
    event: "Estado: En seguimiento",
    desc: "Siguiente seguimiento agendado para el 16 SEP.",
    actor: "Ana López · Psicología",
    type: "professional",
    color: "#818CF8",
  },
  {
    time: "—",
    event: "Próxima acción pendiente",
    desc: "Seguimiento del 16 SEP. Definir derivación.",
    actor: "Sin completar",
    type: "pending",
    color: "#6B7899",
  },
];

const typeIcons: Record<string, string> = {
  system: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  signal: "M22 12h-4l-3 9L9 3l-3 9H2",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8",
  professional: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  pending: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 8v4l3 3",
};

export default function ProTimelineScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="pro-timeline" />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-[#141622] border-b border-white/5 px-8 py-5 flex items-center justify-between">
          <div>
            <button
              onClick={() => nav("pro-case")}
              className="font-mono text-[10px] text-[#6B7899] tracking-widest hover:text-[#5B5CF0] transition-smooth mb-1 flex items-center gap-1"
            >
              ← Caso PJ-032
            </button>
            <h1 className="font-display text-xl font-light text-white">Seguimiento operacional</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-full px-3 py-1.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span className="font-mono text-[11px] text-[#F59E0B]">En seguimiento</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 max-w-3xl">
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: "Tiempo total", value: "1h 42 min", c: "#F59E0B" },
              { label: "Acciones registradas", value: "9", c: "#5B5CF0" },
              { label: "Próxima acción", value: "16 SEP", c: "#14B8A6" },
            ].map((s) => (
              <div key={s.label} className="pro-surface rounded-2xl p-4">
                <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-1">{s.label}</p>
                <p className="font-display text-xl font-medium" style={{ color: s.c }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <p className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-5">HISTORIAL COMPLETO</p>

          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-5 top-5 bottom-10 w-px bg-gradient-to-b from-[#5B5CF0] via-[#818CF8] to-[#6B7899] opacity-20" />

            <div className="space-y-3">
              {timelineEvents.map((ev, i) => (
                <div
                  key={i}
                  className={`flex gap-4 animate-float ${ev.type === "pending" ? "opacity-50" : ""}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Node */}
                  <div className="flex-shrink-0 z-10">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: `${ev.color}18`,
                        border: `1.5px solid ${ev.color}40`,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d={typeIcons[ev.type]} stroke={ev.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pro-surface rounded-2xl p-4 mb-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className="text-[#E8EAFF] text-sm font-semibold">{ev.event}</p>
                        <p className="text-[#6B7899] text-xs mt-0.5">{ev.desc}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-[10px] text-[#6B7899]">{ev.time}</p>
                        <p className="font-mono text-[10px] mt-0.5" style={{ color: ev.color }}>
                          {ev.actor}
                        </p>
                      </div>
                    </div>

                    {ev.type === "pending" && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <button
                          className="text-xs text-[#818CF8] hover:text-[#A78BFA] transition-smooth font-medium"
                          onClick={() => nav("pro-ficha")}
                        >
                          Completar acción →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
