import { useState } from "react";
import { type Screen } from "../App";
import ProSidebar from "../components/ProSidebar";

interface Props { nav: (s: Screen) => void; }

export default function ProCaseFichaScreen({ nav }: Props) {
  const [notes, setNotes] = useState("");
  const [valoracion, setValoracion] = useState("");
  const [accion, setAccion] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white flex">
      <ProSidebar nav={nav} active="pro-case" />
      <main className="flex-1 overflow-auto">
      {/* Top bar */}
      <div className="bg-[#141622] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => nav("pro-case")} className="text-[#6B7899] flex items-center gap-2 hover:text-white transition-smooth">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Caso PJ-032</span>
        </button>
        <span className="text-[#6B7899]">/</span>
        <span className="font-mono text-sm text-white">Ficha de acompañamiento</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-full px-3 py-1">
            <span className="font-mono text-[10px] text-[#22C55E]">Consentimiento autorizado</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Section separator — AI vs Human */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* AI organized data */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-[#5B5CF0]/10 border border-[#5B5CF0]/20 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-[#5B5CF0]" />
                <span className="font-mono text-[11px] text-[#818CF8]">ORGANIZADO POR PUENTE</span>
              </div>
              <p className="text-[#6B7899] text-xs">Datos estructurados automáticamente</p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Situación", value: "Bullying relacionado con separación parental. Colegio.", color: "#5B5CF0" },
                { label: "Frecuencia detectada", value: "Repetitiva. 4 eventos registrados (02–13 SEP).", color: "#A78BFA" },
                { label: "Señales principales", value: "Aislamiento progresivo, impacto en asistencia escolar.", color: "#FB7185" },
                { label: "Factores protectores", value: "Amiga cercana. Figura docente identificada.", color: "#22C55E" },
                { label: "Apoyo en plataforma", value: "Reconocimiento emocional. Regulación. Preparación para pedir ayuda.", color: "#14B8A6" },
                { label: "Pensamiento identificado", value: "\"Esto va a seguir pasando.\" · Indefensión aprendida.", color: "#F59E0B" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="pro-surface rounded-xl p-4"
                  style={{ borderLeft: `3px solid ${row.color}40` }}
                >
                  <div className="font-mono text-[10px] tracking-widest mb-1" style={{ color: row.color }}>
                    {row.label.toUpperCase()}
                  </div>
                  <p className="text-[#E8EAFF] text-sm">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Human assessment */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                <span className="font-mono text-[11px] text-[#5EEAD4]">VALORACIÓN HUMANA</span>
              </div>
              <p className="text-[#6B7899] text-xs">Completa el profesional</p>
            </div>

            <div className="space-y-4">
              <div className="pro-surface rounded-xl p-5">
                <label className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3 block">
                  VALORACIÓN CLÍNICA
                </label>
                <textarea
                  className="w-full bg-[#0D0F1A] border border-white/8 rounded-xl p-4 text-[#E8EAFF] text-sm placeholder-[#6B7899] outline-none focus:border-[#5B5CF0]/40 transition-smooth resize-none"
                  rows={4}
                  placeholder="Impresión clínica inicial del profesional..."
                  value={valoracion}
                  onChange={(e) => setValoracion(e.target.value)}
                />
              </div>

              <div className="pro-surface rounded-xl p-5">
                <label className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3 block">
                  ACCIÓN REALIZADA
                </label>
                <textarea
                  className="w-full bg-[#0D0F1A] border border-white/8 rounded-xl p-4 text-[#E8EAFF] text-sm placeholder-[#6B7899] outline-none focus:border-[#5B5CF0]/40 transition-smooth resize-none"
                  rows={3}
                  placeholder="Contacto inicial, entrevista, derivación..."
                  value={accion}
                  onChange={(e) => setAccion(e.target.value)}
                />
              </div>

              <div className="pro-surface rounded-xl p-5">
                <label className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3 block">
                  DERIVACIÓN
                </label>
                <select className="w-full bg-[#0D0F1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-[#E8EAFF] outline-none focus:border-[#5B5CF0]/40 transition-smooth appearance-none">
                  <option value="" className="bg-[#0D0F1A] text-[#6B7899]">Seleccionar tipo de derivación</option>
                  <option value="psico" className="bg-[#0D0F1A]">Psicología externa</option>
                  <option value="orientador" className="bg-[#0D0F1A]">Orientador escolar</option>
                  <option value="familia" className="bg-[#0D0F1A]">Intervención familiar</option>
                  <option value="urgencia" className="bg-[#0D0F1A]">Urgencia / Derivación inmediata</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="pro-surface rounded-xl p-4">
                  <label className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3 block">
                    PRÓXIMO SEGUIMIENTO
                  </label>
                  <input
                    type="date"
                    className="w-full bg-[#0D0F1A] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-[#E8EAFF] outline-none focus:border-[#5B5CF0]/40 transition-smooth"
                  />
                </div>
                <div className="pro-surface rounded-xl p-4">
                  <label className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3 block">
                    ESTADO
                  </label>
                  <select className="w-full bg-[#0D0F1A] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-[#E8EAFF] outline-none focus:border-[#5B5CF0]/40 transition-smooth appearance-none">
                    <option className="bg-[#0D0F1A]">En revisión</option>
                    <option className="bg-[#0D0F1A]">Asignado</option>
                    <option className="bg-[#0D0F1A]">Derivado</option>
                    <option className="bg-[#0D0F1A]">Seguimiento</option>
                    <option className="bg-[#0D0F1A]">Cerrado</option>
                  </select>
                </div>
              </div>

              <div className="pro-surface rounded-xl p-5">
                <label className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3 block">
                  NOTAS INTERNAS
                </label>
                <textarea
                  className="w-full bg-[#0D0F1A] border border-white/8 rounded-xl p-4 text-[#E8EAFF] text-sm placeholder-[#6B7899] outline-none focus:border-[#5B5CF0]/40 transition-smooth resize-none"
                  rows={3}
                  placeholder="Solo visible para el equipo profesional..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth"
                style={{ background: "linear-gradient(135deg, #14B8A6, #0D9488)" }}
                onClick={handleSave}
              >
                {saved ? "✓ Ficha guardada" : "Guardar ficha de acompañamiento"}
              </button>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
