import { useState } from "react";
import { type Screen } from "../App";

interface Props { nav: (s: Screen) => void; }

type NodeKey =
  | "context" | "frequency" | "emotions" | "thought"
  | "impact" | "support" | "family";

interface MapNode {
  id: NodeKey;
  label: string;
  value: string;
  color: string;
  x: number;
  y: number;
  origin?: string;
}

const nodes: MapNode[] = [
  {
    id: "context", label: "Contexto", value: "Colegio",
    color: "#5B5CF0", x: 50, y: 8,
    origin: "Mencionaste que esto ocurre principalmente en el colegio.",
  },
  {
    id: "frequency", label: "Frecuencia", value: "Repetitivo",
    color: "#A78BFA", x: 82, y: 28,
    origin: "Dijiste que ha pasado varias veces esta semana.",
  },
  {
    id: "emotions", label: "Emociones", value: "Vergüenza · Tristeza",
    color: "#FB7185", x: 88, y: 62,
    origin: "Expresaste vergüenza cuando describiste la situación.",
  },
  {
    id: "thought", label: "Pensamiento", value: "\"Esto va a seguir pasando.\"",
    color: "#F59E0B", x: 60, y: 88,
    origin: "Compartiste que sientes que la situación no va a cambiar.",
  },
  {
    id: "impact", label: "Impacto", value: "Evita recreo · Dificultad para asistir",
    color: "#EF4444", x: 15, y: 75,
    origin: "Esto apareció cuando dijiste: \"Ahora prefiero quedarme en el aula.\"",
  },
  {
    id: "support", label: "Apoyo", value: "Amiga cercana",
    color: "#22C55E", x: 8, y: 42,
    origin: "Mencionaste que tienes una amiga en quien confías.",
  },
  {
    id: "family", label: "Cambio familiar", value: "Separación parental",
    color: "#14B8A6", x: 20, y: 15,
    origin: "Contaste que tus padres se separaron recientemente.",
  },
];

const CENTER = { x: 50, y: 50 };

export default function SituationMapScreen({ nav }: Props) {
  const [activeNode, setActiveNode] = useState<NodeKey | null>(null);

  const active = nodes.find((n) => n.id === activeNode);

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 bg-white border-b border-[#F0F1FA]">
        <button onClick={() => nav("signals")} className="text-[#9CA3AF] mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 4.5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Puente Signals</span>
        </button>
        <div className="font-mono text-[10px] text-[#5B5CF0] tracking-widest mb-1">MAPA DE SITUACIÓN</div>
        <h1 className="font-display text-2xl font-light text-[#111827]">
          Entendamos lo que
          <br />
          <em className="text-[#5B5CF0] font-medium">está pasando.</em>
        </h1>
      </div>

      {/* Map visualization */}
      <div className="relative mx-4 mt-6 mb-4">
        <div className="bg-white rounded-[24px] border border-[#E4E6F5] shadow-sm overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="w-full"
            style={{ aspectRatio: "1/1" }}
          >
            {/* Connection lines */}
            {nodes.map((node) => (
              <line
                key={node.id}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={node.x}
                y2={node.y}
                stroke={activeNode === node.id ? node.color : "#E4E6F5"}
                strokeWidth={activeNode === node.id ? "0.8" : "0.4"}
                className="transition-smooth signal-line"
                style={{ opacity: activeNode && activeNode !== node.id ? 0.3 : 1 }}
              />
            ))}

            {/* Center node */}
            <circle cx={CENTER.x} cy={CENTER.y} r="9" fill="#5B5CF0" opacity="0.12" />
            <circle cx={CENTER.x} cy={CENTER.y} r="6" fill="#5B5CF0" opacity="0.2" />
            <circle cx={CENTER.x} cy={CENTER.y} r="4" fill="#5B5CF0" />
            <text
              x={CENTER.x}
              y={CENTER.y - 6}
              textAnchor="middle"
              fill="#111827"
              fontSize="2.2"
              fontWeight="600"
              fontFamily="Manrope, sans-serif"
            >
              SITUACIÓN
            </text>
            <text
              x={CENTER.x}
              y={CENTER.y + 8}
              textAnchor="middle"
              fill="#6B7280"
              fontSize="1.6"
              fontFamily="Manrope, sans-serif"
              className="italic"
            >
              Burlas desde la separación
            </text>

            {/* Satellite nodes */}
            {nodes.map((node, i) => {
              const isActive = activeNode === node.id;
              const isDimmed = activeNode && !isActive;
              return (
                <g
                  key={node.id}
                  className="map-node animate-node"
                  style={{ animationDelay: `${i * 0.1}s`, opacity: isDimmed ? 0.35 : 1 }}
                  onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? "6.5" : "5.5"}
                    fill={node.color}
                    opacity={isActive ? 1 : 0.15}
                    className="transition-smooth"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? "4" : "3.5"}
                    fill={node.color}
                    opacity={isActive ? 1 : 0.8}
                    className="transition-smooth"
                  />
                  <text
                    x={node.x}
                    y={node.y > CENTER.y ? node.y + 8 : node.y - 6}
                    textAnchor="middle"
                    fill={node.color}
                    fontSize="2.2"
                    fontWeight={isActive ? "700" : "600"}
                    fontFamily="Manrope, sans-serif"
                    className="transition-smooth"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {nodes.map((n) => (
            <button
              key={n.id}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-smooth"
              style={{
                background: activeNode === n.id ? `${n.color}18` : "transparent",
                border: `1px solid ${activeNode === n.id ? n.color + "40" : "#E4E6F5"}`,
              }}
              onClick={() => setActiveNode(activeNode === n.id ? null : n.id)}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: n.color }} />
              <span className="text-[11px] font-medium" style={{ color: activeNode === n.id ? n.color : "#6B7280" }}>
                {n.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel — explainability */}
      {active ? (
        <div className="mx-4 animate-float">
          <div
            className="rounded-2xl p-5 border"
            style={{
              background: `${active.color}08`,
              borderColor: `${active.color}30`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: active.color }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: active.color }}>
                {active.label.toUpperCase()}
              </span>
            </div>
            <p className="text-[#111827] text-sm font-semibold mb-1">{active.value}</p>
            <p className="text-[#6B7280] text-xs leading-relaxed italic">{active.origin}</p>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: `${active.color}20` }}>
              <span className="font-mono text-[10px] text-[#9CA3AF]">
                ¿Por qué aparece esto? · Puente lo identificó a partir de lo que contaste.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-4">
          <div className="rounded-2xl bg-white border border-[#E4E6F5] p-4">
            <p className="text-[#9CA3AF] text-xs text-center">
              Toca un nodo del mapa para ver de dónde viene esa señal.
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 mt-5">
        <button
          className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-smooth"
          style={{ background: "linear-gradient(135deg, #5B5CF0, #4338CA)" }}
          onClick={() => nav("route")}
        >
          Ver ruta personalizada →
        </button>
      </div>
    </div>
  );
}
