import { useState } from "react";
import { type Screen } from "../App";
import PuenteOrb from "../components/PuenteOrb";

interface Props { nav: (s: Screen) => void; }

export default function ProLoginScreen({ nav }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-[#0D0F1A] flex relative overflow-hidden">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative">
        <div
          className="absolute w-[500px] h-[500px] -bottom-40 -left-40 blob-1 opacity-[0.04]"
          style={{ background: "linear-gradient(135deg, #5B5CF0, #14B8A6)" }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <PuenteOrb size={36} />
          <div>
            <p className="text-white font-display text-lg font-medium tracking-tight">Puente Red</p>
            <p className="text-[#6B7899] text-xs font-mono">Plataforma profesional</p>
          </div>
        </div>

        {/* Middle visual */}
        <div className="relative z-10 my-auto">
          <div className="mb-8">
            <p className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-3">FLUJO DE ATENCIÓN</p>
            <div className="space-y-2">
              {[
                { step: "Nueva solicitud", count: 3, color: "#EF4444" },
                { step: "En revisión", count: 8, color: "#F59E0B" },
                { step: "Asignada", count: 12, color: "#5B5CF0" },
                { step: "Seguimiento activo", count: 24, color: "#14B8A6" },
                { step: "Cerrada", count: 156, color: "#22C55E" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((s.count / 156) * 100, 100)}%`,
                        background: `${s.color}80`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-[#6B7899] w-6 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="font-display text-3xl font-light text-white leading-snug">
            Una herramienta
            <br />
            <em className="text-[#5B5CF0]">para equipos que acompañan.</em>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
            <p className="font-mono text-[11px] text-[#6B7899]">Acceso restringido · Solo profesionales autorizados</p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <PuenteOrb size={32} />
            <span className="text-white font-display text-lg">Puente Red</span>
          </div>

          <div className="mb-8">
            <div className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-2">ACCESO PROFESIONAL</div>
            <h1 className="font-display text-3xl font-light text-white leading-snug">
              Un espacio de trabajo para
              <br />
              <em className="text-[#5EEAD4]">equipos de acompañamiento.</em>
            </h1>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-2 block">
                CORREO INSTITUCIONAL
              </label>
              <input
                type="email"
                className="w-full bg-[#141622] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-[#6B7899] outline-none focus:border-[#5B5CF0]/50 focus:bg-[#1C1F33] transition-smooth"
                placeholder="nombre@institución.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#6B7899] tracking-widest mb-2 block">
                CONTRASEÑA
              </label>
              <input
                type="password"
                className="w-full bg-[#141622] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-[#6B7899] outline-none focus:border-[#5B5CF0]/50 focus:bg-[#1C1F33] transition-smooth"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth mb-4"
            style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
            onClick={() => nav("pro-workspace")}
          >
            Ingresar al workspace
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-[#141622] border border-white/5 rounded-full px-4 py-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="4" width="9" height="7" rx="1.5" stroke="#6B7899" strokeWidth="1" />
                <path d="M4 4V3a2 2 0 014 0v1" stroke="#6B7899" strokeWidth="1" />
              </svg>
              <span className="font-mono text-[10px] text-[#6B7899]">Acceso restringido</span>
            </div>
            <button className="font-mono text-[11px] text-[#6B7899] hover:text-[#818CF8] transition-smooth">
              ¿Olvidaste tu acceso?
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              className="text-xs text-[#6B7899] hover:text-[#5B5CF0] transition-smooth"
              onClick={() => nav("entry")}
            >
              ← Volver a Puente Joven
            </button>
            <span className="font-mono text-[10px] text-[#6B7899]/40">v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
