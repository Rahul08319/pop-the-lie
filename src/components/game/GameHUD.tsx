import { useState } from 'react';
import { GameState, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick, toggleMusicMute, isMusicMuted } from '@/game/audioManager';

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
}

export function GameHUD({ gameState, onPause }: GameHUDProps) {
  const config = DIFFICULTY_CONFIGS[gameState.difficulty];
  const [muted, setMuted] = useState(isMusicMuted());

  const handleMuteToggle = () => {
    const newMuted = toggleMusicMute();
    setMuted(newMuted);
  };

  return (
    <header className="absolute top-3 left-0 right-0 z-30 px-3 sm:px-6 pointer-events-none select-none">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Score & Level Capsule */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="apple-card px-4 py-1.5 rounded-full flex items-center gap-3 border border-white/15 bg-black/40 backdrop-blur-xl shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] font-arcade font-bold tracking-wider text-white/50 uppercase">Score</span>
              <span className="font-arcade text-xl font-black text-[#f5c518] leading-none">
                {gameState.score}
              </span>
            </div>
            <div className="w-px h-6 bg-white/15" />
            <div className="flex flex-col">
              <span className="text-[10px] font-arcade font-bold tracking-wider text-white/50 uppercase">Lvl</span>
              <span className="font-arcade text-xl font-black text-white leading-none">
                {gameState.level}
              </span>
            </div>
          </div>

          {/* Dynamic Combo Badge */}
          {gameState.combo >= 2 && (
            <div className="px-3 py-1 rounded-full bg-[#af52de]/25 border border-[#af52de]/50 backdrop-blur-lg flex items-center gap-1 animate-pulse-glow">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-bold text-[#d28eff] tracking-tight">
                x{gameState.combo}
              </span>
            </div>
          )}
        </div>

        {/* Right: Lives Capsule & Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Hearts Display */}
          <div className="apple-card px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/15 bg-black/40 backdrop-blur-xl shadow-lg">
            {Array.from({ length: config.lives }).map((_, i) => (
              <span
                key={i}
                className={`text-sm transition-all duration-300 ${
                  i < gameState.lives ? 'scale-100 opacity-100' : 'scale-75 opacity-20 filter grayscale'
                }`}
              >
                ❤️
              </span>
            ))}
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={handleMuteToggle}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-[0.92] transition-transform shadow-lg"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            <span className="text-sm">{muted ? '🔇' : '🔊'}</span>
          </button>

          {/* Pause Button */}
          <button
            onClick={() => { playButtonClick(); onPause(); }}
            className="w-9 h-9 rounded-full bg-black/40 border border-white/15 backdrop-blur-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-[0.92] transition-transform shadow-lg"
            aria-label="Pause game"
          >
            <span className="text-xs font-bold">⏸</span>
          </button>
        </div>
      </div>
    </header>
  );
}
