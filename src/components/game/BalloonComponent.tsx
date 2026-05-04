import { Balloon } from '@/game/types';

interface BalloonProps {
  balloon: Balloon;
  onPop: (id: string, x: number, y: number) => void;
}

const COLOR_MAP: Record<string, string> = {
  'balloon-red': 'from-game-balloon-red to-red-700',
  'balloon-blue': 'from-game-balloon-blue to-blue-700',
  'balloon-green': 'from-game-balloon-green to-green-700',
  'balloon-yellow': 'from-game-balloon-yellow to-yellow-600',
  'balloon-purple': 'from-game-balloon-purple to-purple-700',
  'balloon-orange': 'from-game-balloon-orange to-orange-700',
};

const SHINE_MAP: Record<string, string> = {
  'balloon-red': 'bg-red-300/40',
  'balloon-blue': 'bg-blue-300/40',
  'balloon-green': 'bg-green-300/40',
  'balloon-yellow': 'bg-yellow-200/40',
  'balloon-purple': 'bg-purple-300/40',
  'balloon-orange': 'bg-orange-300/40',
};

export function BalloonComponent({ balloon, onPop }: BalloonProps) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onPop(balloon.id, rect.left + rect.width / 2, rect.top);
  };

  if (balloon.popped) {
    return (
      <div
        className="absolute animate-pop pointer-events-none"
        style={{ left: `${balloon.x}%`, bottom: 0 }}
      >
        <div className={`w-16 h-20 rounded-full ${balloon.popResult === 'correct' ? 'bg-game-correct-glow/50' : 'bg-game-wrong-glow/50'}`} />
        {/* Particle burst */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${balloon.popResult === 'correct' ? 'bg-game-correct-glow' : 'bg-game-wrong-glow'}`}
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${Math.cos(i * 60 * Math.PI / 180) * 30}px, ${Math.sin(i * 60 * Math.PI / 180) * 30}px)`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
    );
  }

  const gradient = COLOR_MAP[balloon.color] || COLOR_MAP['balloon-blue'];
  const shine = SHINE_MAP[balloon.color] || SHINE_MAP['balloon-blue'];

  const powerIcon = balloon.powerUp === 'freeze' ? '❄️' : balloon.powerUp === 'life' ? '❤️' : balloon.powerUp === 'double' ? '✨' : null;

  return (
    <div
      className="absolute animate-float-up cursor-pointer"
      style={{
        left: `${balloon.x}%`,
        '--float-duration': `${balloon.speed}s`,
      } as React.CSSProperties}
      onClick={handleClick}
      onTouchStart={handleClick}
    >
      <div className="animate-sway">
        {/* String */}
        <div className="w-0.5 h-8 bg-foreground/30 mx-auto" />
        {/* Power-up aura */}
        {powerIcon && (
          <div className="absolute inset-0 -m-2 rounded-full bg-game-score/30 blur-md animate-pulse pointer-events-none" />
        )}
        {/* Balloon body */}
        <div className={`relative w-20 h-24 rounded-full bg-gradient-to-b ${gradient} shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${powerIcon ? 'ring-2 ring-game-score/70' : ''}`}>
          {/* Shine effect */}
          <div className={`absolute top-2 left-3 w-4 h-6 rounded-full ${shine} rotate-[-20deg]`} />
          {/* Knot */}
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-b ${gradient}`} />
          {/* Equation text */}
          <span className="text-foreground font-bold text-xs text-center leading-tight px-1 drop-shadow-md select-none">
            {balloon.equation.display}
          </span>
          {powerIcon && (
            <span className="absolute -top-3 -right-2 text-xl drop-shadow-lg select-none animate-bounce">{powerIcon}</span>
          )}
        </div>
      </div>
    </div>
  );
}
