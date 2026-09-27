import { useState } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

type Question = {
  id: string;
  puente: string;
  type: "chips" | "scale" | "yesno" | "open";
  chips?: string[];
  scaleLabels?: [string, string];
};

const questions: Question[] = [
  {
    id: "emotions",
    puente: "¿Cómo describirías cómo te has sentido esta semana?",
    type: "chips",
    chips: ["Triste", "Ansioso/a", "Enojado/a", "Confundido/a", "Agotado/a", "Solo/a", "Bien", "No sé"],
  },
  {
    id: "sleep",
    puente: "¿Cómo ha estado tu sueño últimamente?",
    type: "chips",
    chips: ["Duermo bien", "Me cuesta dormir", "Duermo demasiado", "Tengo pesadillas", "Varía mucho"],
  },
  {
    id: "school",
    puente: "¿Cómo está yendo en el colegio?",
    type: "chips",
    chips: ["Bien", "Más o menos", "Tengo dificultades", "Estoy faltando", "No quiero ir"],
  },
  {
    id: "loneliness",
    puente: "¿Tienes personas con quienes hablar cuando algo te preocupa?",
    type: "chips",
    chips: ["Sí, varias", "Sí, una o dos", "Pocas veces", "Generalmente no", "No"],
  },
  {
    id: "safety",
    puente: "¿Te sientes seguro/a en tu entorno habitual?",
    type: "yesno",
  },
];

export default function ContextCheckScreen({ nav }: Props) {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const current = questions[qIndex];
  const progress = ((qIndex + 1) / questions.length) * 100;

  const toggleChip = (chip: string) => {
    setSelected((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const advance = (answer?: string | string[]) => {
    const ans = answer ?? selected;
    setAnswers((prev) => ({ ...prev, [current.id]: ans }));
    setSelected([]);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full text-center animate-float">
          <PuenteOrb size={64} className="mx-auto mb-6" />
          <h1 className="font-display text-2xl font-light text-[#111827] mb-3 leading-snug">
            Gracias por contarme.
            <br />
            <em className="text-[#5B5CF0]">Ya tengo un panorama.</em>
          </h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
            Con lo que compartiste puedo organizar mejor lo que está pasando.
          </p>
          <button
            className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-smooth"
            style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
            onClick={() => nav("signals")}
          >
            Ver Puente Signals →
          </button>
          <button
            className="mt-3 text-sm text-[#9CA3AF] w-full"
            onClick={() => nav("situation-map")}
          >
            Ver mapa de situación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-[#E4E6F5]">
        <div
          className="h-full bg-[#5B5CF0] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => qIndex > 0 ? setQIndex(qIndex - 1) : nav("conversation")} className="text-[#9CA3AF]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <PuenteOrb size={32} />
        <div className="flex-1">
          <p className="text-xs text-[#9CA3AF] font-mono">
            {qIndex + 1} de {questions.length} · CHEQUEO CONTEXTUAL
          </p>
        </div>
        <button onClick={() => nav("signals")} className="font-mono text-[11px] text-[#9CA3AF] hover:text-[#5B5CF0] transition-smooth">
          Saltar
        </button>
      </div>

      {/* Puente message */}
      <div className="px-5 mb-6">
        <div className="flex items-end gap-3 animate-float" key={qIndex}>
          <PuenteOrb size={36} className="flex-shrink-0 mb-1" />
          <div className="bg-white border border-[#E4E6F5] rounded-[20px] rounded-bl-sm px-5 py-4 shadow-sm max-w-[85%]">
            <p className="text-[#111827] text-sm leading-relaxed">{current.puente}</p>
          </div>
        </div>
      </div>

      {/* Answer area */}
      <div className="px-5 flex-1" key={`answer-${qIndex}`}>
        {current.type === "chips" && (
          <div className="animate-float">
            <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">
              ELIGE UNA O MÁS OPCIONES
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {current.chips!.map((chip) => (
                <button
                  key={chip}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium border-2 transition-smooth ${
                    selected.includes(chip)
                      ? "bg-[#5B5CF0] text-white border-[#5B5CF0]"
                      : "bg-white text-[#374151] border-[#E4E6F5] hover:border-[#5B5CF0]/30"
                  }`}
                  onClick={() => toggleChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              className="w-full rounded-2xl py-4 text-sm font-semibold transition-smooth"
              style={{
                background: selected.length > 0 ? "linear-gradient(135deg, #5B5CF0, #4338CA)" : "#E4E6F5",
                color: selected.length > 0 ? "white" : "#9CA3AF",
              }}
              onClick={() => advance()}
              disabled={selected.length === 0}
            >
              Continuar
            </button>
          </div>
        )}

        {current.type === "yesno" && (
          <div className="space-y-3 animate-float">
            {["Sí, me siento seguro/a", "Más o menos", "No del todo", "No, no me siento seguro/a"].map((opt) => (
              <button
                key={opt}
                className="w-full text-left bg-white border-2 border-[#E4E6F5] rounded-2xl px-5 py-4 text-sm text-[#374151] font-medium hover:border-[#5B5CF0]/30 hover:bg-[#F7F8FC] transition-smooth"
                onClick={() => advance(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skip question */}
      <div className="px-5 pb-8 mt-4">
        <button
          className="w-full text-sm text-[#9CA3AF] py-2"
          onClick={() => advance("Sin respuesta")}
        >
          Prefiero no responder esto ahora
        </button>
      </div>
    </div>
  );
}
