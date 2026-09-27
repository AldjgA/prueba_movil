import { useState } from "react";
import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

const sections = [
  {
    key: "situation",
    label: "SITUACIÓN",
    value: "Desde que mis padres se separaron, compañeros se ríen de mí. Ocurre principalmente en el colegio, de forma repetida.",
    color: "#5B5CF0",
  },
  {
    key: "frequency",
    label: "FRECUENCIA",
    value: "Varias veces por semana. Registrado entre el 2 y el 13 de septiembre.",
    color: "#A78BFA",
  },
  {
    key: "change",
    label: "CAMBIO OBSERVADO",
    value: "Comenzó a evitar el recreo. Dificultad creciente para asistir al colegio.",
    color: "#FB7185",
  },
  {
    key: "impact",
    label: "IMPACTO",
    value: "Ausentismo parcial. Expresó pensamientos de que la situación no cambiará.",
    color: "#F59E0B",
  },
  {
    key: "support",
    label: "APOYO DISPONIBLE",
    value: "Amiga cercana. Profesor identificado como figura de confianza.",
    color: "#22C55E",
  },
];

export default function ReferralScreen({ nav }: Props) {
  const [authorized, setAuthorized] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const getValue = (key: string, original: string) =>
    edits[key] !== undefined ? edits[key] : original;

  const toggleEdit = (key: string, original: string) => {
    if (editingKey === key) {
      setEditingKey(null);
    } else {
      setEditingKey(key);
      if (edits[key] === undefined) setEdits((e) => ({ ...e, [key]: original }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-white border-b border-[#F0F1FA]">
        <button onClick={() => nav("route")} className="text-[#9CA3AF] mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Ruta</span>
        </button>
        <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-2">DERIVACIÓN</div>
        <h1 className="font-display text-2xl font-light text-[#111827] leading-snug">
          No tienes que seguir
          <br />
          <em className="text-[#5B5CF0] font-medium">con esto solo/a.</em>
        </h1>
      </div>

      {/* Summary */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest">RESUMEN PARA COMPARTIR</p>
          <div className="flex items-center gap-1.5 bg-[#F0F1FA] rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
            <span className="font-mono text-[10px] text-[#6B7280]">Tú decides qué compartir</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {sections.map((s) => (
            <div
              key={s.key}
              className="bg-white border border-[#E4E6F5] rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-widest" style={{ color: s.color }}>
                  {s.label}
                </span>
                {!authorized && (
                  <button
                    className="font-mono text-[10px] text-[#9CA3AF] hover:text-[#5B5CF0] transition-smooth"
                    onClick={() => toggleEdit(s.key, s.value)}
                  >
                    {editingKey === s.key ? "Guardar" : "Editar"}
                  </button>
                )}
              </div>

              {editingKey === s.key ? (
                <textarea
                  className="w-full text-xs text-[#111827] bg-[#F7F8FC] border border-[#E4E6F5] rounded-xl p-3 outline-none resize-none"
                  rows={3}
                  value={getValue(s.key, s.value)}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [s.key]: e.target.value }))
                  }
                />
              ) : (
                <p className="text-[#374151] text-sm leading-relaxed">
                  {getValue(s.key, s.value)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Exclusions note */}
        <div className="bg-[#F7F8FC] border border-[#E4E6F5] rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="9" cy="9" r="7" stroke="#9CA3AF" strokeWidth="1.2" />
              <path d="M9 8v4M9 6h.01" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <p className="text-[#9CA3AF] text-xs leading-relaxed">
              Este resumen <strong className="text-[#6B7280]">no incluye conversaciones privadas</strong>.
              Solo contiene lo que tú elegiste compartir. Un profesional recibirá únicamente esta información.
            </p>
          </div>
        </div>

        {/* Actions */}
        {!authorized ? (
          <div className="space-y-3">
            <button
              className="w-full rounded-2xl py-4 text-sm font-semibold transition-smooth"
              style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)", color: "white" }}
              onClick={() => setAuthorized(true)}
            >
              Autorizar y enviar a profesional →
            </button>
            <button
              className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#9CA3AF] border border-[#E4E6F5] hover:border-[#5B5CF0]/20 transition-smooth"
            >
              Revisar primero
            </button>
          </div>
        ) : (
          <div className="animate-float">
            <div className="bg-[#22C55E]/8 border border-[#22C55E]/20 rounded-2xl p-6 text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#22C55E]/15 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11l5 5 9-9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-display text-lg font-medium text-[#111827] mb-1">Solicitud enviada</p>
              <p className="text-[#6B7280] text-sm">
                Un profesional de la red Puente revisará tu caso. Te avisaremos cuando haya una respuesta.
              </p>
            </div>
            <button
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-[#5B5CF0] border-2 border-[#5B5CF0]/20 hover:bg-[#5B5CF0]/5 transition-smooth"
              onClick={() => nav("pro-workspace")}
            >
              Ver workspace profesional (demo) →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
