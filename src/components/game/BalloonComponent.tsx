import { Balloon } from '@/game/types';

interface BalloonProps {
  balloon: Balloon;
  onPop: (id: string, x: number, y: number) => void;
}

const COLOR_MAP: Record<string, { bg: string; glow: string; text: string }> = {
  'balloon-red': {
    bg: 'from-[#ff3b30] via-[#d70015] to-[#a3000b]',
    glow: 'rgba(255, 59, 48, 0.5)',
    text: '#ffffff',
  },
  'balloon-blue': {
    bg: 'from-[#007aff] via-[#0066cc] to-[#004080]',
    glow: 'rgba(0, 122, 255, 0.5)',
    text: '#ffffff',
  },
  'balloon-green': {
    bg: 'from-[#34c759] via-[#248a3d] to-[#165a27]',
    glow: 'rgba(52, 199, 89, 0.5)',
    text: '#ffffff',
  },
  'balloon-yellow': {
    bg: 'from-[#ffd60a] via-[#f5a623] to-[#d48200]',
    glow: 'rgba(255, 214, 10, 0.5)',
    text: '#1d1d1f',
  },
  'balloon-purple': {
    bg: 'from-[#af52de] via-[#8944ab] to-[#5b2b73]',
    glow: 'rgba(175, 82, 222, 0.5)',
    text: '#ffffff',
  },
  'balloon-orange': {
    bg: 'from-[#ff9500] via-[#e06d00] to-[#b34700]',
    glow: 'rgba(255, 149, 0, 0.5)',
    text: '#ffffff',
  },
};

export function BalloonComponent({ balloon, onPop }: BalloonProps) {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onPop(balloon.id, rect.left + rect.width / 2, rect.top);
  };

  const scheme = COLOR_MAP[balloon.color] || COLOR_MAP['balloon-blue'];

  if (balloon.popped) {
    const isCorrect = balloon.popResult === 'correct';
    return (
      <div
        className="absolute pointer-events-none animate-pop"
        style={{ left: `${balloon.x}%`, bottom: 0 }}
      >
        {/* Core Flash */}
        <div
          className={`w-16 h-20 rounded-full blur-sm ${
            isCorrect ? 'bg-emerald-400/80 shadow-[0_0_30px_rgba(52,199,89,0.8)]' : 'bg-red-500/80 shadow-[0_0_30px_rgba(255,59,48,0.8)]'
          }`}
        />
        {/* Apple Particle Shower (10 radial particles) */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * 36 * Math.PI) / 180;
          const dist = 35 + (i % 3) * 15;
          return (
            <div
              key={i}
              className={`absolute w-2.5 h-2.5 rounded-full ${
                isCorrect ? 'bg-emerald-300' : 'bg-rose-400'
              } shadow-sm`}
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>
    );
  }

  const powerIcon =
    balloon.powerUp === 'freeze'
      ? '❄️'
      : balloon.powerUp === 'life'
      ? '❤️'
      : balloon.powerUp === 'double'
      ? '✨'
      : null;

  return (
    <div
      className="absolute animate-float-up cursor-pointer touch-none select-none"
      style={{
        left: `${balloon.x}%`,
        '--float-duration': `${balloon.speed}s`,
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
    >
      <div className="animate-sway">
        {/* Physical Balloon String */}
        <div className="w-[1.5px] h-9 bg-white/40 mx-auto" />

        {/* Power-up Ambient Aura */}
        {powerIcon && (
          <div className="absolute inset-0 -m-3 rounded-full bg-[#f5c518]/30 blur-lg animate-pulse pointer-events-none" />
        )}

        {/* Glossy Apple Balloon Body */}
        <div
          className={`relative w-[84px] h-[102px] rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] bg-gradient-to-b ${scheme.bg} flex items-center justify-center transition-transform hover:scale-105 active:scale-95 duration-100 ${
            powerIcon ? 'ring-2 ring-[#ffd60a] shadow-[0_0_20px_rgba(255,214,10,0.6)]' : 'shadow-2xl'
          }`}
          style={{
            boxShadow: `0 12px 24px -6px ${scheme.glow}, inset 0 -8px 16px rgba(0,0,0,0.35)`,
          }}
        >
          {/* Specular Glare Highlights */}
          <div className="absolute top-2.5 left-3.5 w-5 h-8 rounded-[50%] bg-white/45 rotate-[-28deg] blur-[0.5px] pointer-events-none" />
          <div className="absolute top-4 left-6 w-2 h-3 rounded-[50%] bg-white/60 rotate-[-28deg] pointer-events-none" />

          {/* Bottom Tied Knot */}
          <div
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-2.5 rounded-b-md bg-gradient-to-b ${scheme.bg}`}
          />

          {/* Equation Display in Chunky Arcade Typography */}
          <span
            className="font-arcade font-black text-sm tracking-wide text-center px-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
            style={{ color: scheme.text }}
          >
            {balloon.equation.display}
          </span>

          {/* Power Up Badge */}
          {powerIcon && (
            <span className="absolute -top-3 -right-2 text-xl drop-shadow-md select-none animate-bounce">
              {powerIcon}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
