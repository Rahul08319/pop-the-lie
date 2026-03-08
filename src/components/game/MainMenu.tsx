import { useState } from 'react';
import { StarField } from './StarField';
import { Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick } from '@/game/audioManager';

interface MainMenuProps {
  highScore: number;
  onStart: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
}

export function MainMenu({ highScore, onStart, onShowLeaderboard }: MainMenuProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const difficultyColors: Record<Difficulty, string> = {
    easy: 'from-accent to-accent/70 border-accent/50',
    medium: 'from-primary to-primary/70 border-primary/50',
    hard: 'from-secondary to-secondary/70 border-secondary/50',
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-md w-full">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-game-title text-5xl md:text-7xl text-primary drop-shadow-lg">
            Pop the Lie
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-semibold">
            🎈 Pop the wrong math • Leave the truth! 🎈
          </p>
        </div>

        {/* How to play */}
        <div className="bg-card/60 backdrop-blur-md rounded-2xl p-4 w-full border border-border">
          <h2 className="font-game-title text-lg text-primary mb-2 text-center">How to Play</h2>
          <ul className="space-y-1.5 text-xs text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="text-game-correct-glow">✓</span>
              <span>Tap balloons with <strong className="text-secondary">wrong</strong> equations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-wrong-glow">✗</span>
              <span>Don't pop <strong className="text-accent">correct</strong> ones!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-combo">🔥</span>
              <span>Build combos for bonus points</span>
            </li>
          </ul>
        </div>

        {/* Difficulty Selection */}
        <div className="w-full">
          <h3 className="font-game-title text-base text-foreground text-center mb-3">Choose Difficulty</h3>
          <div className="grid grid-cols-3 gap-2">
            {difficulties.map((diff) => {
              const config = DIFFICULTY_CONFIGS[diff];
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulty(diff);
                    playButtonClick();
                  }}
                  className={`
                    relative rounded-xl p-3 border-2 transition-all duration-200
                    ${isSelected
                      ? `bg-gradient-to-b ${difficultyColors[diff]} scale-105 shadow-lg`
                      : 'bg-card/40 border-border/50 hover:bg-card/60'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{config.emoji}</div>
                  <div className={`font-game-title text-sm ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {config.label}
                  </div>
                  <div className={`text-[10px] mt-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {config.description}
                  </div>
                  <div className={`text-[10px] mt-1 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                    ❤️ {config.lives} lives
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* High score & Leaderboard */}
        <div className="flex items-center gap-4">
          {highScore > 0 && (
            <div className="text-center">
              <span className="text-muted-foreground text-xs">Best Score</span>
              <div className="font-game-title text-2xl text-game-score">{highScore}</div>
            </div>
          )}
          <button
            onClick={() => { playButtonClick(); onShowLeaderboard(); }}
            className="font-game-title text-xs bg-primary/20 border border-primary/40 px-4 py-2 rounded-full text-primary hover:scale-105 active:scale-95 transition-transform"
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Play button */}
        <button
          onClick={() => {
            playButtonClick();
            onStart(selectedDifficulty);
          }}
          className="font-game-title text-2xl bg-gradient-to-r from-primary to-game-score px-12 py-4 rounded-full text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
        >
          🎮 PLAY
        </button>
      </div>

      {/* Decorative floating balloons */}
      <div className="absolute bottom-10 left-10 w-12 h-16 rounded-full bg-gradient-to-b from-game-balloon-red to-destructive opacity-30 animate-sway" />
      <div className="absolute bottom-20 right-16 w-10 h-14 rounded-full bg-gradient-to-b from-game-balloon-blue to-primary opacity-25 animate-sway" style={{ animationDelay: '1s' }} />
    </div>
  );
}
