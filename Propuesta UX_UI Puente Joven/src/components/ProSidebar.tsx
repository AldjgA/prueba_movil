import { type Screen } from "../App";

interface Props {
  nav: (s: Screen) => void;
  active: string;
}

const navItems: { label: string; screen: Screen | null; icon: string; badge?: number }[] = [
  { label: "Inicio", screen: "pro-workspace", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  { label: "Alertas", screen: "pro-alerts", icon: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0", badge: 2 },
  { label: "Casos", screen: "pro-case", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { label: "Seguimientos", screen: "pro-timeline", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
  { label: "Derivaciones", screen: null, icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
  { label: "Reportes", screen: "pro-viz", icon: "M18 20V10M12 20V4M6 20v-6" },
  { label: "Observatorio", screen: "observatory", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a1 1 0 110-2 1 1 0 010 2" },
  { label: "Directorio", screen: null, icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
];

export default function ProSidebar({ nav, active }: Props) {
  return (
    <aside className="w-56 bg-[#141622] border-r border-white/5 flex flex-col min-h-screen flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-5 h-5 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #A78BFA, #5B5CF0)" }} />
          <span className="font-display text-base font-medium text-white">Puente Red</span>
        </div>
        <span className="font-mono text-[10px] text-[#6B7899] tracking-widest">PLATAFORMA PROFESIONAL</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.screen === active;
          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-smooth text-left ${
                isActive
                  ? "bg-[#5B5CF0]/12 text-white"
                  : "text-[#6B7899] hover:text-[#E8EAFF] hover:bg-white/4"
              }`}
              onClick={() => item.screen && nav(item.screen)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={`flex-1 ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {isActive && <div className="w-1 h-4 rounded-full bg-[#5B5CF0]" />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/4 cursor-pointer transition-smooth">
          <div className="w-8 h-8 rounded-full bg-[#5B5CF0]/20 border border-[#5B5CF0]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#818CF8]">AL</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#E8EAFF] truncate">Ana López</p>
            <p className="font-mono text-[10px] text-[#6B7899]">Psicología</p>
          </div>
        </div>
        <button
          className="w-full mt-1 px-3 py-2 text-xs text-[#6B7899] hover:text-[#E8EAFF] text-left transition-smooth flex items-center gap-2"
          onClick={() => nav("entry")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
