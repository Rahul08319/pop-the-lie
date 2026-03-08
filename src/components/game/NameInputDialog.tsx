import { useState } from 'react';
import { playButtonClick } from '@/game/audioManager';

interface NameInputDialogProps {
  score: number;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

export function NameInputDialog({ score, onSubmit, onSkip }: NameInputDialogProps) {
  const [name, setName] = useState(() => localStorage.getItem('popTheLie_playerName') || '');

  const handleSubmit = () => {
    const trimmed = name.trim() || 'Anonymous';
    localStorage.setItem('popTheLie_playerName', trimmed);
    playButtonClick();
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-6 max-w-xs w-full text-center space-y-4">
        <div className="text-4xl">🏆</div>
        <h2 className="font-game-title text-xl text-primary">Score: {score}</h2>
        <p className="text-sm text-muted-foreground">Enter your name for the leaderboard</p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Your name"
          maxLength={20}
          className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-center font-game-title text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={() => { playButtonClick(); onSkip(); }}
            className="flex-1 text-muted-foreground text-xs hover:text-foreground transition-colors py-2"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 font-game-title text-sm bg-gradient-to-r from-primary to-game-score px-6 py-2.5 rounded-full text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
