interface PowerUpInfo {
  type: 'freeze' | 'life' | 'double';
  icon: string;
  name: string;
  short: string;
  detail: string;
  accent: string;
}

export const POWERUP_INFO: PowerUpInfo[] = [
  {
    type: 'freeze',
    icon: '❄️',
    name: 'Freeze',
    short: 'Pauses balloons for 3s',
    detail: 'Time slows: balloons stop moving and no new ones spawn for 3 seconds. Perfect for catching your breath in chaos.',
    accent: 'text-primary border-primary/40 bg-primary/10',
  },
  {
    type: 'life',
    icon: '❤️',
    name: 'Extra Life',
    short: 'Restores 1 life',
    detail: 'Adds one life back (up to your starting max). Pop it before a tough wave hits.',
    accent: 'text-secondary border-secondary/40 bg-secondary/10',
  },
  {
    type: 'double',
    icon: '✨',
    name: 'Double Points',
    short: '2× score for 8s',
    detail: 'All correct pops earn double points for 8 seconds. Stack with combos for huge scores.',
    accent: 'text-game-score border-game-score/40 bg-game-score/10',
  },
];

interface Props {
  compact?: boolean;
}

export function PowerUpsLegend({ compact = false }: Props) {
  return (
    <div className="bg-card/60 backdrop-blur-md rounded-2xl p-4 w-full border border-border">
      <h3 className="font-game-title text-base text-primary text-center mb-1">Power-Ups</h3>
      <p className="text-center text-[10px] text-muted-foreground mb-3">
        Glowing balloons grant a bonus when popped (only the wrong-equation ones).
      </p>
      <div className="grid grid-cols-1 gap-2">
        {POWERUP_INFO.map(p => (
          <div
            key={p.type}
            className={`flex items-start gap-3 rounded-xl border px-3 py-2 ${p.accent}`}
            title={p.detail}
          >
            <div className="text-2xl leading-none mt-0.5">{p.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="font-game-title text-sm">{p.name}</div>
              <div className="text-[11px] opacity-80">{compact ? p.short : p.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
