import { StarField } from './StarField';

interface MainMenuProps {
  highScore: number;
  onStart: () => void;
}

export function MainMenu({ highScore, onStart }: MainMenuProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden">
      <StarField />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-game-title text-6xl md:text-8xl text-primary drop-shadow-lg">
            Pop the Lie
          </h1>
          <p className="mt-3 text-lg text-muted-foreground font-semibold">
            🎈 Pop the wrong math • Leave the truth! 🎈
          </p>
        </div>

        {/* How to play */}
        <div className="bg-card/60 backdrop-blur-md rounded-2xl p-6 max-w-sm border border-border">
          <h2 className="font-game-title text-xl text-primary mb-3 text-center">How to Play</h2>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="text-game-correct-glow">✓</span>
              <span>Tap balloons with <strong className="text-secondary">wrong</strong> equations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-wrong-glow">✗</span>
              <span>Don't pop <strong className="text-accent">correct</strong> ones — you'll lose a life!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-combo">🔥</span>
              <span>Build combos for bonus points</span>
            </li>
            <li className="flex items-start gap-2">
              <span>⚠️</span>
              <span>If a lie escapes, you lose a life too!</span>
            </li>
          </ul>
        </div>

        {highScore > 0 && (
          <div className="text-center">
            <span className="text-muted-foreground text-sm">Best Score</span>
            <div className="font-game-title text-3xl text-game-score">{highScore}</div>
          </div>
        )}

        {/* Play button */}
        <button
          onClick={onStart}
          className="font-game-title text-2xl bg-gradient-to-r from-primary to-game-score px-12 py-4 rounded-full text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
        >
          🎮 PLAY
        </button>
      </div>

      {/* Decorative floating balloons */}
      <div className="absolute bottom-10 left-10 w-12 h-16 rounded-full bg-gradient-to-b from-game-balloon-red to-red-700 opacity-30 animate-sway" />
      <div className="absolute bottom-20 right-16 w-10 h-14 rounded-full bg-gradient-to-b from-game-balloon-blue to-blue-700 opacity-25 animate-sway" style={{ animationDelay: '1s' }} />
      <div className="absolute top-32 left-1/4 w-8 h-12 rounded-full bg-gradient-to-b from-game-balloon-green to-green-700 opacity-20 animate-sway" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}
