import { useState } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

export default function JovenLoginScreen({ nav }: Props) {
  const [alias, setAlias] = useState("");
  const [pin, setPin] = useState("");
  const [pinFocus, setPinFocus] = useState(false);

  const isDemo = alias.toLowerCase() === "alex";
  const canEnter = (alias.trim().length >= 2 && pin.length === 4) || isDemo;

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col relative overflow-hidden">
      {/* Ambient shapes */}
      <div
        className="absolute w-[300px] h-[300px] -top-20 -right-20 blob-1 opacity-[0.07]"
        style={{ background: "linear-gradient(135deg, #5B5CF0, #A78BFA)" }}
      />
      <div
        className="absolute w-[200px] h-[200px] -bottom-16 -left-16 blob-2 opacity-[0.05]"
        style={{ background: "#14B8A6" }}
      />

      {/* Back */}
      <div className="relative z-10 px-6 pt-12">
        <button
          onClick={() => nav("entry")}
          className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#5B5CF0] transition-smooth mb-10"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Volver</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full -mt-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <PuenteOrb size={40} />
          <div>
            <p className="font-display text-xl font-medium text-[#111827]">Puente Joven</p>
            <p className="font-mono text-[10px] text-[#9CA3AF] tracking-widest">TU ESPACIO PRIVADO</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-light text-[#111827] leading-snug mb-2">
          Hola.
          <br />
          <em className="text-[#5B5CF0] font-medium">¿Quién eres hoy?</em>
        </h1>
        <p className="text-[#9CA3AF] text-sm mb-8">
          No necesitas tu nombre real.
        </p>

        {/* Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-2 block">
              TU ALIAS
            </label>
            <input
              className="w-full bg-white border border-[#E4E6F5] rounded-2xl px-5 py-4 text-[#111827] text-base placeholder-[#9CA3AF] outline-none focus:border-[#5B5CF0]/50 focus:shadow-[0_0_0_3px_rgba(91,92,240,0.08)] transition-smooth"
              placeholder="Ej: Alex, Luna, Ciro..."
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[#9CA3AF] tracking-widest mb-2 block">
              TU PIN DE ACCESO
            </label>
            <div
              className={`w-full bg-white border rounded-2xl px-5 py-4 flex gap-5 justify-center items-center transition-smooth ${
                pinFocus ? "border-[#5B5CF0]/50 shadow-[0_0_0_3px_rgba(91,92,240,0.08)]" : "border-[#E4E6F5]"
              }`}
              onClick={() => document.getElementById("pin-input")?.focus()}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full transition-smooth"
                  style={{
                    background: i < pin.length ? "#5B5CF0" : "#E4E6F5",
                    transform: i < pin.length ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
              <input
                id="pin-input"
                type="number"
                inputMode="numeric"
                className="sr-only"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(v);
                }}
                onFocus={() => setPinFocus(true)}
                onBlur={() => setPinFocus(false)}
              />
            </div>
            <p className="text-[#9CA3AF] text-xs mt-2 text-center font-mono">
              Toca para ingresar 4 dígitos
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          className="w-full rounded-2xl py-4 text-base font-semibold transition-smooth mb-4"
          style={{
            background: canEnter
              ? "linear-gradient(135deg, #5B5CF0, #4338CA)"
              : "#E4E6F5",
            color: canEnter ? "white" : "#9CA3AF",
          }}
          onClick={() => canEnter && nav("onboarding")}
          disabled={!canEnter}
        >
          Entrar a mi espacio
        </button>

        {/* Demo entry */}
        <button
          className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#5B5CF0] border-2 border-[#5B5CF0]/20 hover:border-[#5B5CF0]/40 hover:bg-[#5B5CF0]/4 transition-smooth mb-6"
          onClick={() => { setAlias("Alex"); setPin("0000"); setTimeout(() => nav("onboarding"), 200); }}
        >
          Entrar en modo demo
          <span className="ml-2 font-mono text-xs text-[#A78BFA]">· Alias: Alex</span>
        </button>

        {/* Privacy note */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
          <p className="font-mono text-[11px] text-[#9CA3AF]">
            Usamos la mínima información necesaria.
          </p>
        </div>
      </div>
    </div>
  );
}
