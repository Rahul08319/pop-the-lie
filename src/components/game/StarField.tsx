import { useMemo } from 'react';

export function StarField() {
  const stars = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 3,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-foreground/60 animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            '--twinkle-duration': `${s.duration}s`,
            '--twinkle-delay': `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
