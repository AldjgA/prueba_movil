import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

export default function PersonalReportScreen({ nav }: Props) {
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-white border-b border-[#F0F1FA]">
        <button onClick={() => nav("attention-level")} className="text-[#9CA3AF] mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Nivel de atención</span>
        </button>
        <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-1">REPORTE PERSONAL</div>
        <h1 className="font-display text-2xl font-light text-[#111827] leading-snug">
          Lo que entendimos
          <br />
          <em className="text-[#5B5CF0] font-medium">juntos.</em>
        </h1>
        <p className="text-[#9CA3AF] text-xs mt-2">Este reporte es tuyo. Solo tú lo ves.</p>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {/* What happened */}
        <div className="bg-white border border-[#E4E6F5] rounded-2xl p-5">
          <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-3">LO QUE OCURRIÓ</div>
          <p className="text-[#374151] text-sm leading-relaxed">
            Desde que tus padres se separaron, algunos compañeros han estado haciendo comentarios sobre ti en el colegio. Esto ha pasado varias veces en los últimos 11 días.
          </p>
          <div className="flex gap-2 flex-wrap mt-3">
            {["Colegio", "Repetitivo", "11 días"].map((t) => (
              <span key={t} className="font-mono text-[10px] text-[#5B5CF0] bg-[#5B5CF0]/8 border border-[#5B5CF0]/15 rounded-full px-2.5 py-1">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* How you felt */}
        <div className="bg-white border border-[#E4E6F5] rounded-2xl p-5">
          <div className="font-mono text-[10px] text-[#FB7185] tracking-widest mb-3">CÓMO TE SENTISTE</div>
          <div className="flex gap-2 flex-wrap mb-3">
            {[
              { e: "Vergüenza", c: "#FB7185" },
              { e: "Tristeza", c: "#5B5CF0" },
              { e: "Confusión", c: "#A78BFA" },
            ].map((em) => (
              <span
                key={em.e}
                className="text-sm px-3 py-1.5 rounded-2xl font-medium"
                style={{ background: `${em.c}12`, color: em.c, border: `1px solid ${em.c}25` }}
              >
                {em.e}
              </span>
            ))}
          </div>
          <p className="text-[#9CA3AF] text-xs leading-relaxed italic">
            "Desde que mis papás se separaron algunos compañeros se ríen de mí."
          </p>
        </div>

        {/* What changed */}
        <div className="bg-white border border-[#E4E6F5] rounded-2xl p-5">
          <div className="font-mono text-[10px] text-[#F59E0B] tracking-widest mb-3">QUÉ CAMBIÓ</div>
          <div className="space-y-2.5">
            {[
              { label: "Antes", desc: "Comentarios ocasionales, sin patrón claro.", c: "#9CA3AF" },
              { label: "Ahora", desc: "Mayor repetición, empezaste a evitar el recreo y tienes dificultad para asistir.", c: "#F59E0B" },
            ].map((row) => (
              <div key={row.label} className="flex gap-3">
                <span className="font-mono text-[10px] w-12 flex-shrink-0 pt-0.5" style={{ color: row.c }}>
                  {row.label.toUpperCase()}
                </span>
                <p className="text-[#374151] text-sm leading-relaxed">{row.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tool used */}
        <div className="bg-white border border-[#E4E6F5] rounded-2xl p-5">
          <div className="font-mono text-[10px] text-[#22C55E] tracking-widest mb-3">QUÉ HERRAMIENTA USASTE</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B5CF0]/10 flex items-center justify-center text-lg flex-shrink-0">
              🌬️
            </div>
            <div>
              <p className="text-[#111827] text-sm font-medium">Bajemos un poco la tensión</p>
              <p className="text-[#9CA3AF] text-xs font-mono">Regulación · 4 ciclos · 1 min</p>
            </div>
            <div className="ml-auto">
              <div className="w-6 h-6 rounded-full bg-[#22C55E]/15 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* What you could do */}
        <div className="bg-white border border-[#E4E6F5] rounded-2xl p-5">
          <div className="font-mono text-[10px] text-[#14B8A6] tracking-widest mb-3">QUÉ PODRÍAS HACER DESPUÉS</div>
          <div className="space-y-2.5">
            {[
              { n: 1, text: "Hablar con tu amiga cercana sobre lo que está pasando.", done: false },
              { n: 2, text: "Preparar cómo pedir apoyo al profesor de confianza.", done: false },
              { n: 3, text: "Practicar cómo contar la situación con tus palabras.", done: false },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#E4E6F5] flex-shrink-0 mt-0.5" />
                <p className="text-[#374151] text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* No clinical scores */}
        <div className="bg-[#F7F8FC] border border-[#E4E6F5] rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#14B8A6]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#14B8A6]" />
          </div>
          <p className="text-[#9CA3AF] text-xs leading-relaxed">
            Este reporte no contiene diagnósticos ni puntuaciones. Está hecho para ayudarte a entender, no para etiquetar.
          </p>
        </div>

        {/* Actions */}
        <button
          className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth"
          style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
          onClick={() => nav("referral")}
        >
          Preparar solicitud de apoyo →
        </button>
        <button
          className="w-full rounded-2xl py-3.5 text-sm font-medium text-[#374151] border border-[#E4E6F5] hover:border-[#5B5CF0]/20 transition-smooth"
          onClick={() => nav("journey")}
        >
          Ver mi recorrido completo
        </button>
      </div>
    </div>
  );
}
