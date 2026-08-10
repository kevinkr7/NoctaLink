import { useMemo } from "react";

interface StarFieldProps {
  count?: number;
  className?: string;
}

export function StarField({ count = 120, className = "" }: StarFieldProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.4,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.7,
      })),
    [count],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            boxShadow: s.size > 1.4 ? "0 0 4px rgba(255,255,255,0.8)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
