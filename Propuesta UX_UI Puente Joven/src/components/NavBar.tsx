import { type Screen } from "../App";

interface NavBarProps {
  nav: (s: Screen) => void;
  current: Screen;
  dark?: boolean;
}

const items: { label: string; screen: Screen }[] = [
  { label: "Inicio", screen: "home-joven" },
  { label: "Mi recorrido", screen: "journey" },
  { label: "Ayudar", screen: "help-someone" },
];

export default function NavBar({ nav, current, dark }: NavBarProps) {
  const base = dark
    ? "bg-[#141622] border-[rgba(255,255,255,0.07)]"
    : "bg-white/90 border-[#E4E6F5]";
  const textActive = dark ? "text-[#818CF8]" : "text-[#5B5CF0]";
  const textInactive = dark ? "text-[#6B7899]" : "text-[#9CA3AF]";

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${base} safe-area-bottom`}>
      <div className="flex items-center justify-around max-w-sm mx-auto px-4 py-3">
        {items.map((item) => {
          const active = current === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => nav(item.screen)}
              className={`flex flex-col items-center gap-1 transition-smooth ${
                active ? textActive : textInactive
              }`}
            >
              <span className={`text-xs font-semibold tracking-wide ${active ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#5B5CF0]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
