import { useState } from 'react';
import { GameState, Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { StarField } from './StarField';
import { playButtonClick } from '@/game/audioManager';

interface GameOverProps {
  gameState: GameState;
  canRevive?: boolean;
  onRewardedRevive?: () => Promise<boolean>;
  onRestart: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  onShowDailyLeaderboard: () => void;
  onSaveScore: () => void;
}

export function GameOverScreen({
  gameState,
  canRevive,
  onRewardedRevive,
  onRestart,
  onShowLeaderboard,
  onShowDailyLeaderboard,
  onSaveScore,
}: GameOverProps) {
  const isNewHighScore = gameState.score >= gameState.highScore && gameState.score > 0;
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(gameState.difficulty);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const handleReviveClick = async () => {
    if (!onRewardedRevive || isWatchingAd) return;
    playButtonClick();
    setIsWatchingAd(true);
    try {
      await onRewardedRevive();
    } finally {
      setIsWatchingAd(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0c1017] via-[#141a24] to-[#0a0e14] overflow-hidden px-4 select-none">
      <StarField />

      <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm w-full animate-spring-in">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-apple-display text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            Game Over
          </h1>
          {isNewHighScore ? (
            <div className="inline-block px-3 py-1 rounded-full bg-[#f5c518]/20 border border-[#f5c518]/40 text-[#f5c518] text-xs font-bold animate-pulse-glow">
              🏆 New Personal Best! 🏆
            </div>
          ) : (
            <p className="text-xs text-white/60">Good run! Sharpen your reflexes and try again.</p>
          )}
        </div>

        {/* Apple Stats Card */}
        <div className="apple-card p-5 w-full space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Score</span>
            <span className="font-apple-display text-3xl font-extrabold text-[#f5c518]">{gameState.score}</span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/50 uppercase block font-semibold">Level</span>
              <span className="font-apple-display text-base font-bold text-white">{gameState.level}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/50 uppercase block font-semibold">Popped</span>
              <span className="font-apple-display text-base font-bold text-emerald-400">{gameState.balloonsPopped}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/50 uppercase block font-semibold">Combo</span>
              <span className="font-apple-display text-base font-bold text-[#d28eff]">x{gameState.bestCombo}</span>
            </div>
          </div>
        </div>

        {/* Rewarded Ad Revive Opportunity */}
        {canRevive && onRewardedRevive && (
          <button
            onClick={handleReviveClick}
            disabled={isWatchingAd}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 hover:border-emerald-500/70 text-emerald-300 font-semibold text-xs flex items-center justify-between transition-all active:scale-[0.97] shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">❤️</span>
              <div className="text-left">
                <span className="block font-bold leading-tight">Continue with +1 Life</span>
                <span className="text-[10px] text-emerald-400/80">Watch 1 short sponsored ad</span>
              </div>
            </div>
            <span className="text-xs bg-emerald-400/20 px-2.5 py-1 rounded-full text-emerald-300">
              {isWatchingAd ? 'Loading...' : 'Watch Ad →'}
            </span>
          </button>
        )}

        {/* Difficulty Selector Segmented Control */}
        <div className="w-full space-y-1">
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
                  className={`py-1.5 px-2 rounded-full text-xs font-semibold transition-all active:scale-[0.96] flex items-center justify-center gap-1 ${
                    isSelected ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-center gap-2 w-full">
          {!scoreSaved && gameState.score > 0 && (
            <button
              onClick={() => { playButtonClick(); setScoreSaved(true); onSaveScore(); }}
              className="flex-1 apple-ghost-pill py-2 text-xs font-semibold text-center"
            >
              💾 Save
            </button>
          )}
          <button
            onClick={() => { playButtonClick(); onShowLeaderboard(); }}
            className="flex-1 apple-ghost-pill py-2 text-xs font-semibold text-center"
          >
            🏆 Scores
          </button>
          <button
            onClick={() => { playButtonClick(); onShowDailyLeaderboard(); }}
            className="flex-1 apple-ghost-pill py-2 text-xs font-semibold text-center"
          >
            🌍 Daily
          </button>
        </div>

        {/* Primary Play Again Button */}
        <button
          onClick={() => { playButtonClick(); onRestart(selectedDifficulty); }}
          className="apple-pill-btn w-full py-4 text-base tracking-tight font-bold shadow-xl flex items-center justify-center gap-2 mt-1"
        >
          <span>🔄</span> Play Again
        </button>
      </div>
    </div>
  );
}
