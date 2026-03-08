import { GameState, Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick } from '@/game/audioManager';

interface PauseMenuProps {
  gameState: GameState;
  onResume: () => void;
  onQuit: () => void;
}

export function PauseMenu({ gameState, onResume, onQuit }: PauseMenuProps) {
  const config = DIFFICULTY_CONFIGS[gameState.difficulty];

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-6 max-w-xs w-full text-center space-y-4">
        <h2 className="font-game-title text-3xl text-primary">⏸️ Paused</h2>

        <div className="bg-muted/30 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Score</span>
            <span className="font-game-title text-game-score">{gameState.score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Level</span>
            <span className="font-game-title text-primary">{gameState.level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Difficulty</span>
            <span className="font-game-title">{config.emoji} {config.label}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => { playButtonClick(); onResume(); }}
            className="w-full font-game-title text-lg bg-gradient-to-r from-primary to-game-score px-8 py-3 rounded-full text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            ▶️ Resume
          </button>
          <button
            onClick={() => { playButtonClick(); onQuit(); }}
            className="w-full font-game-title text-sm text-muted-foreground hover:text-secondary transition-colors px-8 py-2"
          >
            🚪 Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
