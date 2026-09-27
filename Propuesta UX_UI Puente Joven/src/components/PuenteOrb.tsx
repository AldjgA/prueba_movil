interface OrbProps {
  size?: number;
  className?: string;
}

export default function PuenteOrb({ size = 48, className = "" }: OrbProps) {
  return (
    <div
      className={`relative animate-orb ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle at 40% 35%, #A78BFA, #5B5CF0, #14B8A6)",
          filter: `blur(${size * 0.15}px)`,
          transform: "scale(1.2)",
        }}
      />
      {/* Main orb */}
      <div
        className="absolute inset-0 blob-1 animate-orb-inner"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #A78BFA 0%, #5B5CF0 45%, #14B8A6 100%)",
        }}
      />
      {/* Inner highlight */}
      <div
        className="absolute rounded-full opacity-50"
        style={{
          width: size * 0.28,
          height: size * 0.28,
          top: size * 0.18,
          left: size * 0.22,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.85) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
