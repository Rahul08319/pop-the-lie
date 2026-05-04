import { useState } from 'react';
import { GameState, Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { StarField } from './StarField';
import { playButtonClick } from '@/game/audioManager';

interface GameOverProps {
  gameState: GameState;
  onRestart: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  onShowDailyLeaderboard: () => void;
  onSaveScore: () => void;
}

export function GameOverScreen({ gameState, onRestart, onShowLeaderboard, onShowDailyLeaderboard, onSaveScore }: GameOverProps) {
  const isNewHighScore = gameState.score >= gameState.highScore && gameState.score > 0;
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(gameState.difficulty);
  const [scoreSaved, setScoreSaved] = useState(false);
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const difficultyColors: Record<Difficulty, string> = {
    easy: 'from-accent to-accent/70 border-accent/50',
    medium: 'from-primary to-primary/70 border-primary/50',
    hard: 'from-secondary to-secondary/70 border-secondary/50',
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6">
        <h1 className="font-game-title text-5xl md:text-7xl text-secondary drop-shadow-lg">
          Game Over
        </h1>

        {isNewHighScore && (
          <div className="font-game-title text-xl text-game-score animate-pulse-glow">
            🏆 New High Score! 🏆
          </div>
        )}

        <div className="bg-card/60 backdrop-blur-md rounded-2xl p-5 min-w-[280px] border border-border">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold text-sm">Score</span>
              <span className="font-game-title text-2xl text-game-score">{gameState.score}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold text-sm">Level</span>
              <span className="font-game-title text-lg text-primary">{gameState.level}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold text-sm">Lies Popped</span>
              <span className="font-game-title text-lg text-accent">{gameState.balloonsPopped}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold text-sm">Best Combo</span>
              <span className="font-game-title text-lg text-game-combo">x{gameState.bestCombo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-semibold text-sm">Difficulty</span>
              <span className="font-game-title text-lg">{DIFFICULTY_CONFIGS[gameState.difficulty].emoji} {DIFFICULTY_CONFIGS[gameState.difficulty].label}</span>
            </div>
          </div>
        </div>

        {/* Save & Leaderboard buttons */}
        <div className="flex gap-2">
          {!scoreSaved && gameState.score > 0 && (
            <button
              onClick={() => { playButtonClick(); setScoreSaved(true); onSaveScore(); }}
              className="font-game-title text-xs bg-game-combo/20 border border-game-combo/40 px-4 py-2 rounded-full text-game-combo hover:scale-105 active:scale-95 transition-transform"
            >
              💾 Save Score
            </button>
          )}
          <button
            onClick={() => { playButtonClick(); onShowLeaderboard(); }}
            className="font-game-title text-xs bg-primary/20 border border-primary/40 px-4 py-2 rounded-full text-primary hover:scale-105 active:scale-95 transition-transform"
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Quick difficulty change */}
        <div className="flex gap-2">
          {difficulties.map((diff) => {
            const config = DIFFICULTY_CONFIGS[diff];
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => { setSelectedDifficulty(diff); playButtonClick(); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-game-title border transition-all ${
                  isSelected
                    ? `bg-gradient-to-b ${difficultyColors[diff]} scale-105`
                    : 'bg-card/40 border-border/50'
                }`}
              >
                {config.emoji} {config.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { playButtonClick(); onRestart(selectedDifficulty); }}
          className="font-game-title text-xl bg-gradient-to-r from-primary to-game-score px-10 py-3 rounded-full text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
