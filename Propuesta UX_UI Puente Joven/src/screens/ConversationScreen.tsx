import { useState, useRef, useEffect } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

type Msg = {
  role: "puente" | "user";
  text: string;
  delay?: number;
};

const flow: (Msg | { type: "quickreply"; options: string[]; next: Msg[] })[] = [
  {
    role: "puente",
    text: "No tienes que explicarlo perfectamente. Puedes empezar con una frase.",
    delay: 0,
  },
  {
    role: "user",
    text: "Desde que mis papás se separaron algunos compañeros se ríen de mí.",
    delay: 600,
  },
  {
    role: "puente",
    text: "Quiero ayudarte a ordenar lo que está pasando.",
    delay: 1200,
  },
  {
    role: "puente",
    text: "¿Esto ya había ocurrido antes?",
    delay: 1800,
  },
  {
    type: "quickreply",
    options: ["Una vez", "Varias veces", "Pasa seguido", "No estoy seguro"],
    next: [
      { role: "puente", text: "Entiendo. Seguir pasando hace que sea más difícil de cargar sola o solo.", delay: 400 },
      { role: "puente", text: "¿Hay alguien en el colegio con quien te sientas más cómodo/a?", delay: 1000 },
    ],
  },
];

export default function ConversationScreen({ nav }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Run initial flow
    let timeout = 0;
    const initialMsgs: Msg[] = [];
    for (let i = 0; i < flow.length; i++) {
      const item = flow[i];
      if ("type" in item) {
        setTimeout(() => setShowQuickReplies(true), timeout + 200);
        break;
      } else {
        const delay = item.delay ?? 0;
        timeout = delay + 300;
        setTimeout(() => {
          setMessages((prev) => [...prev, item]);
          setIsTyping(false);
        }, delay + 300);
        if (i < flow.length - 1 && !("type" in flow[i + 1])) {
          const nextDelay = (flow[i + 1] as Msg).delay ?? 0;
          setTimeout(() => setIsTyping(true), delay + 300);
        }
      }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showQuickReplies, isTyping]);

  const handleQuickReply = (option: string) => {
    setSelectedReply(option);
    setShowQuickReplies(false);
    const userMsg: Msg = { role: "user", text: option };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => setIsTyping(true), 300);
    const followups = (flow.find((f) => "type" in f) as any)?.next ?? [];
    followups.forEach((msg: Msg) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => setIsTyping(true), 100);
      }, msg.delay ?? 500);
    });
    setTimeout(() => {
      setIsTyping(false);
      setStep(1);
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-10 pb-4 bg-white border-b border-[#F0F1FA]">
        <button onClick={() => nav("home-joven")} className="text-[#9CA3AF] p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <PuenteOrb size={36} />
        <div className="flex-1">
          <p className="font-semibold text-sm text-[#111827]">Puente</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <p className="text-xs text-[#9CA3AF]">Contigo ahora</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#F0F1FA] rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
          <span className="font-mono text-[10px] text-[#6B7899]">Privado</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-float`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {msg.role === "puente" && (
              <div className="flex items-end gap-2 max-w-[82%]">
                <PuenteOrb size={28} className="flex-shrink-0 mb-1" />
                <div className="bg-white border border-[#E4E6F5] rounded-[20px] rounded-bl-sm px-4 py-3 shadow-sm">
                  <p className="text-[#111827] text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            )}
            {msg.role === "user" && (
              <div
                className="rounded-[20px] rounded-br-sm px-4 py-3 max-w-[75%]"
                style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
              >
                <p className="text-white text-sm leading-relaxed">{msg.text}</p>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <PuenteOrb size={28} className="flex-shrink-0 mb-1" />
            <div className="bg-white border border-[#E4E6F5] rounded-[20px] rounded-bl-sm px-4 py-3.5 shadow-sm">
              <div className="flex gap-1.5">
                {[0, 0.15, 0.3].map((d) => (
                  <div
                    key={d}
                    className="w-2 h-2 rounded-full bg-[#5B5CF0] opacity-40"
                    style={{
                      animation: `orb-pulse 1s ease-in-out ${d}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick replies */}
        {showQuickReplies && !selectedReply && (
          <div className="pt-2 pl-10 animate-float">
            <div className="flex flex-wrap gap-2">
              {["Una vez", "Varias veces", "Pasa seguido", "No estoy seguro"].map((opt) => (
                <button
                  key={opt}
                  className="quick-reply"
                  onClick={() => handleQuickReply(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Post-flow action */}
        {step === 1 && (
          <div className="pt-4 animate-float">
            <div className="bg-white border border-[#E4E6F5] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#5B5CF0] animate-pulse" />
                <span className="font-mono text-[10px] text-[#5B5CF0] tracking-widest">PUENTE ENCONTRÓ ALGO</span>
              </div>
              <p className="text-[#111827] text-sm mb-3 leading-relaxed">
                Quiero hacerte algunas preguntas breves para entender mejor el contexto.
              </p>
              <button
                className="w-full bg-[#5B5CF0] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#4338CA] transition-smooth"
                onClick={() => nav("context-check")}
              >
                Continuar con chequeo →
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-3 bg-white border-t border-[#F0F1FA]">
        <div className="flex items-center gap-2 bg-[#F7F8FC] rounded-2xl border border-[#E4E6F5] px-4 py-3">
          <input
            className="flex-1 bg-transparent text-sm text-[#111827] placeholder-[#9CA3AF] outline-none"
            placeholder="Escribe lo que tengas..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button className="w-8 h-8 rounded-xl bg-[#5B5CF0] flex items-center justify-center flex-shrink-0 hover:bg-[#4338CA] transition-smooth">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
