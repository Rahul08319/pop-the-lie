import { GameState } from '@/game/types';
import { StarField } from './StarField';

interface GameOverProps {
  gameState: GameState;
  onRestart: () => void;
}

export function GameOverScreen({ gameState, onRestart }: GameOverProps) {
  const isNewHighScore = gameState.score >= gameState.highScore && gameState.score > 0;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <h1 className="font-game-title text-5xl md:text-7xl text-secondary drop-shadow-lg">
          Game Over
        </h1>

        {isNewHighScore && (
          <div className="font-game-title text-xl text-game-score animate-pulse-glow">
            🏆 New High Score! 🏆
          </div>
        )}

        <div className="bg-card/60 backdrop-blur-md rounded-2xl p-6 min-w-[280px] border border-border">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Score</span>
              <span className="font-game-title text-3xl text-game-score">{gameState.score}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Level Reached</span>
              <span className="font-game-title text-xl text-primary">{gameState.level}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Lies Popped</span>
              <span className="font-game-title text-xl text-accent">{gameState.balloonsPopped}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">Best Combo</span>
              <span className="font-game-title text-xl text-game-combo">x{gameState.bestCombo}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold">High Score</span>
              <span className="font-game-title text-xl text-game-score">{gameState.highScore}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="font-game-title text-xl bg-gradient-to-r from-primary to-game-score px-10 py-3 rounded-full text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
