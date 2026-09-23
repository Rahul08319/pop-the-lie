import { useState } from 'react';
import { StarField } from './StarField';
import { Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick } from '@/game/audioManager';
import { PowerUpsLegend } from './PowerUpsLegend';
import { usePlatform } from '@/platforms/platformManager';
import { PlatformSelectorModal } from './PlatformSelectorModal';

interface MainMenuProps {
  highScore: number;
  onStart: (difficulty: Difficulty) => void;
  onStartDaily: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  onShowDailyLeaderboard: () => void;
}

export function MainMenu({
  highScore,
  onStart,
  onStartDaily,
  onShowLeaderboard,
  onShowDailyLeaderboard,
}: MainMenuProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const { platformName, platformId } = usePlatform();

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0c1017] via-[#141a24] to-[#0a0e14] overflow-hidden px-4 py-8 select-none">
      <StarField />

      {showPlatformModal && (
        <PlatformSelectorModal onClose={() => setShowPlatformModal(false)} />
      )}

      {/* Top Bar: Platform Selector Chip */}
      <div className="absolute top-4 left-0 right-0 px-6 flex justify-between items-center z-20">
        <button
          onClick={() => { playButtonClick(); setShowPlatformModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-white text-xs transition-all active:scale-[0.96]"
          title="Switch platform simulated SDK"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-white/90">{platformName}</span>
          <span className="text-[10px] text-white/50">▾</span>
        </button>

        {highScore > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-xs text-white">
            <span className="text-white/60">Best</span>
            <span className="font-bold text-[#f5c518]">{highScore}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm w-full mt-8 animate-spring-in">
        {/* Apple Display Hero Title */}
        <div className="text-center space-y-1">
          <div className="inline-block px-3 py-1 rounded-full bg-[#0066cc]/20 border border-[#0066cc]/40 text-[#2997ff] text-[11px] font-semibold tracking-wide uppercase mb-1">
            Fast Math Reflex
          </div>
          <h1 className="font-apple-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            Pop the Lie
          </h1>
          <p className="text-sm text-white/70 font-normal">
            Pop the wrong math • Keep the truth alive
          </p>
        </div>

        {/* How to Play - Apple Frosted Card */}
        <div className="apple-card p-4 w-full">
          <h2 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-2.5 text-center">
            How to Play
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-white/80">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-lg mb-1">🎈❌</span>
              <span className="font-medium text-[11px] leading-tight">Pop Wrong Equations</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-lg mb-1">🛡️✓</span>
              <span className="font-medium text-[11px] leading-tight">Spare Correct Ones</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-lg mb-1">🔥✨</span>
              <span className="font-medium text-[11px] leading-tight">Chain High Combos</span>
            </div>
          </div>
        </div>

        {/* Power-ups legend */}
        <PowerUpsLegend compact />

        {/* Difficulty Selection: Apple-style Segmented Control */}
        <div className="w-full space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-medium text-white/60">Difficulty</span>
            <span className="text-[11px] text-white/50">
              {DIFFICULTY_CONFIGS[selectedDifficulty].lives} Lives • {DIFFICULTY_CONFIGS[selectedDifficulty].description}
            </span>
          </div>
          <div className="grid grid-cols-3 p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
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
                  className={`py-2 px-3 rounded-full text-xs font-semibold transition-all duration-150 active:scale-[0.96] flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-black shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leaderboard & Daily buttons */}
        <div className="flex items-center justify-center gap-2.5 w-full pt-1">
          <button
            onClick={() => { playButtonClick(); onShowLeaderboard(); }}
            className="flex-1 apple-ghost-pill py-2 text-xs font-semibold text-center flex items-center justify-center gap-1"
          >
            <span>🏆</span> Leaderboard
          </button>
          <button
            onClick={() => { playButtonClick(); onShowDailyLeaderboard(); }}
            className="flex-1 apple-ghost-pill py-2 text-xs font-semibold text-center flex items-center justify-center gap-1"
          >
            <span>🌍</span> Daily Board
          </button>
        </div>

        {/* Play Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full pt-2">
          <button
            onClick={() => { playButtonClick(); onStart(selectedDifficulty); }}
            className="apple-pill-btn w-full py-4 text-base tracking-tight font-bold shadow-xl flex items-center justify-center gap-2"
          >
            <span>▶</span> Start Game
          </button>
          <button
            onClick={() => { playButtonClick(); onStartDaily(selectedDifficulty); }}
            className="apple-ghost-pill w-full py-2.5 text-xs font-medium text-center hover:bg-white/15"
          >
            Daily Challenge (Global Seed)
          </button>
        </div>
      </div>
    </div>
  );
}
