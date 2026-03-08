import { GameState, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick } from '@/game/audioManager';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
}

export function GameHUD({ gameState, onPause }: GameHUDProps) {
  const config = DIFFICULTY_CONFIGS[gameState.difficulty];

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-start justify-between">
      {/* Score */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border pointer-events-none">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Score</div>
        <div className="text-2xl font-game-title text-game-score">{gameState.score}</div>
      </div>

      {/* Level & Combo */}
      <div className="flex flex-col items-center gap-1 pointer-events-none">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border">
          <div className="text-xs text-muted-foreground font-semibold text-center uppercase tracking-wider">Level</div>
          <div className="text-xl font-game-title text-primary text-center">{gameState.level}</div>
        </div>
        {gameState.combo >= 2 && (
          <div className="bg-game-combo/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-game-combo/40 animate-pulse-glow">
            <span className="text-sm font-bold text-game-combo">🔥 x{gameState.combo}</span>
          </div>
        )}
      </div>

      {/* Lives + Pause */}
      <div className="flex items-start gap-2">
        <div className="bg-card/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-border pointer-events-none">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            {config.emoji} Lives
          </div>
          <div className="text-2xl">
            {Array.from({ length: config.lives }).map((_, i) => (
              <span key={i} className={i < gameState.lives ? '' : 'opacity-20'}>❤️</span>
            ))}
          </div>
        </div>
        <button
          onClick={() => { playButtonClick(); onPause(); }}
          className="bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-border hover:bg-card active:scale-95 transition-all"
          aria-label="Pause"
        >
          <span className="text-xl">⏸️</span>
        </button>
      </div>
    </div>
  );
}
