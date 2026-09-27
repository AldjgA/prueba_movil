import { useState } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

const steps = [
  {
    step: 1,
    tag: "ANTES DE EMPEZAR",
    headline: "Puente es una herramienta automatizada.",
    body: "Puede ayudarte a ordenar lo que está pasando, reconocer cambios, practicar herramientas breves y encontrar apoyo.",
    cant: ["Diagnosticar", "Reemplazar atención profesional"],
    puede: ["Ordenar lo que ocurre", "Reconocer cambios", "Practicar herramientas", "Encontrar apoyo"],
    cta: "Entiendo",
  },
  {
    step: 2,
    tag: "TU PRIVACIDAD IMPORTA",
    headline: "Tú controlas lo que se comparte.",
    body: "Tus conversaciones no se envían automáticamente a nadie.",
    privacyPoints: [
      "Solo recogemos la información necesaria.",
      "Puedes revisar cualquier resumen antes de compartirlo.",
      "Si en algún momento se necesita apoyo humano, te explicaremos exactamente qué ocurrirá.",
    ],
    cta: "Continuar",
  },
  {
    step: 3,
    tag: "¿CÓMO QUIERES USAR PUENTE?",
    headline: "Elige cómo empezar.",
    routes: [
      {
        id: "me-pasa",
        icon: "💬",
        label: "Me está pasando algo",
        desc: "Quiero contar algo que estoy viviendo.",
        color: "#5B5CF0",
        screen: "conversation" as Screen,
      },
      {
        id: "ayudar",
        icon: "🤝",
        label: "Quiero ayudar a alguien",
        desc: "Alguien confió en mí y quiero saber cómo acompañarlo.",
        color: "#14B8A6",
        screen: "help-someone" as Screen,
      },
    ],
    cta: null,
  },
];

export default function OnboardingScreen({ nav }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col relative overflow-hidden">
      {/* Ambient */}
      <div
        className="absolute w-[280px] h-[280px] -top-16 -right-16 blob-1 opacity-[0.06]"
        style={{ background: "linear-gradient(135deg, #5B5CF0, #A78BFA)" }}
      />

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 flex items-center justify-between">
        <PuenteOrb size={32} />
        {/* Progress dots */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-smooth"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                background: i === step ? "#5B5CF0" : i < step ? "#5B5CF050" : "#E4E6F5",
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-[#9CA3AF]">{step + 1} / {steps.length}</span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-10 max-w-sm mx-auto w-full">
        <span className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-4 block">
          {current.tag}
        </span>

        <h1 className="font-display text-[26px] font-light text-[#111827] leading-snug mb-3">
          {current.headline}
        </h1>

        {/* Step 1 */}
        {current.step === 1 && (
          <div className="animate-float">
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">{current.body}</p>

            <div className="space-y-3 mb-6">
              <div className="bg-white border border-[#E4E6F5] rounded-2xl p-4">
                <p className="font-mono text-[10px] text-[#22C55E] tracking-widest mb-3">PUEDE AYUDARTE A</p>
                <div className="space-y-2">
                  {current.puede!.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#22C55E]/15 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-[#374151] text-sm">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E4E6F5] rounded-2xl p-4">
                <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-3">NO PUEDE</p>
                <div className="space-y-2">
                  {current.cant!.map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#F0F1FA] flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M2 2l4 4M6 2L2 6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="text-[#9CA3AF] text-sm">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {current.step === 2 && (
          <div className="animate-float">
            <p className="text-[#6B7280] text-sm leading-relaxed mb-6">{current.body}</p>
            <div className="space-y-3 mb-6">
              {current.privacyPoints!.map((pt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white border border-[#E4E6F5] rounded-2xl p-4"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#14B8A6]/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                  </div>
                  <p className="text-[#374151] text-sm leading-relaxed">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — route selection */}
        {current.step === 3 && (
          <div className="animate-float">
            <p className="text-[#6B7280] text-sm mb-6">
              Puedes cambiar esto en cualquier momento.
            </p>
            <div className="space-y-4 mb-6">
              {current.routes!.map((route) => (
                <div
                  key={route.id}
                  className="bg-white border-2 border-[#E4E6F5] rounded-2xl p-5 cursor-pointer hover:border-[#5B5CF0]/30 hover:shadow-md transition-smooth"
                  style={{}}
                  onClick={() => { nav("home-joven"); }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${route.color}12` }}
                    >
                      {route.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#111827] font-semibold text-sm mb-1">{route.label}</p>
                      <p className="text-[#9CA3AF] text-xs leading-relaxed">{route.desc}</p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#9CA3AF] mt-1">
                      <path d="M7 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full text-sm text-[#9CA3AF] underline"
              onClick={() => nav("home-joven")}
            >
              Ir al inicio y decidir después
            </button>
          </div>
        )}

        {/* CTA */}
        {current.cta && (
          <div className="mt-auto pb-8">
            <button
              className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-smooth"
              style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else nav("home-joven");
              }}
            >
              {current.cta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
