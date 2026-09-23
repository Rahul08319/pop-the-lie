import { useState, useEffect } from 'react';
import { GameState, Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick, playScoreTick } from '@/game/audioManager';

interface GameOverProps {
  gameState: GameState;
  canRevive?: boolean;
  onRewardedRevive?: () => Promise<boolean>;
  onRestart: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  onShowDailyLeaderboard: () => void;
  onSaveScore: () => void;
  onQuit?: () => void;
}

export function GameOverScreen({
  gameState,
  canRevive,
  onRewardedRevive,
  onRestart,
  onShowLeaderboard,
  onShowDailyLeaderboard,
  onSaveScore,
  onQuit,
}: GameOverProps) {
  const isNewHighScore = gameState.score >= gameState.highScore && gameState.score > 0;
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(gameState.difficulty);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  // Animate score counting up from 0 to final score
  useEffect(() => {
    if (gameState.score <= 0) {
      setDisplayScore(0);
      return;
    }
    const target = gameState.score;
    const duration = 1000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.floor(progress * target);
      setDisplayScore(current);
      playScoreTick();

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [gameState.score]);

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
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none touch-none overscroll-none bg-black/60 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 z-20"
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* Header: GAME OVER */}
      <header className="relative z-20 text-center space-y-1 pt-2 animate-spring-in">
        <h1 className="font-arcade text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-rose-400 via-red-500 to-rose-700 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] tracking-wider">
          GAME OVER
        </h1>
        {isNewHighScore ? (
          <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 border border-amber-400 text-amber-300 font-arcade text-xs sm:text-sm font-bold animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            👑 NEW ALL-TIME RECORD! 👑
          </div>
        ) : (
          <p className="font-arcade text-xs text-white/60">Good run! Sharpen your reflexes and try again.</p>
        )}
      </header>

      {/* Main Scoreboard Cabinet */}
      <main className="relative z-20 w-full max-w-sm flex flex-col items-center gap-3 my-auto animate-spring-in">
        {/* Big Score Box */}
        <div className="w-full rounded-3xl bg-black/50 border-2 border-white/15 backdrop-blur-xl p-5 text-center shadow-2xl space-y-3">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[11px] font-arcade uppercase font-bold text-amber-300/80 tracking-widest">
              Final Score
            </span>
            <span className="font-arcade text-6xl font-black text-amber-300 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)] leading-tight">
              {displayScore}
            </span>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-arcade text-white/50 uppercase font-bold">Level</span>
              <span className="font-arcade text-lg font-bold text-white mt-0.5">{gameState.level}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-arcade text-white/50 uppercase font-bold">Popped</span>
              <span className="font-arcade text-lg font-bold text-emerald-400 mt-0.5">{gameState.balloonsPopped}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-arcade text-white/50 uppercase font-bold">Best Streak</span>
              <span className="font-arcade text-lg font-bold text-purple-300 mt-0.5">x{gameState.bestCombo}</span>
            </div>
          </div>
        </div>

        {/* Rewarded Ad Revive Opportunity */}
        {canRevive && onRewardedRevive && (
          <button
            onClick={handleReviveClick}
            disabled={isWatchingAd}
            className="w-full py-3.5 px-4 rounded-3xl bg-gradient-to-r from-emerald-600/30 via-teal-500/30 to-emerald-600/30 border-2 border-emerald-400/60 hover:border-emerald-300 text-white font-arcade text-xs flex items-center justify-between transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">❤️</span>
              <div className="text-left">
                <span className="block font-bold text-sm text-emerald-300 leading-tight">Continue with +1 Life!</span>
                <span className="text-[10px] text-white/70">Watch 1 sponsored ad</span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-400 text-black font-black text-xs">
              {isWatchingAd ? 'Loading...' : 'REVIVE ▶'}
            </span>
          </button>
        )}

        {/* Quick Difficulty Pills */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {difficulties.map((diff) => {
            const config = DIFFICULTY_CONFIGS[diff];
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => { playButtonClick(); setSelectedDifficulty(diff); }}
                className={`py-1.5 px-2 rounded-2xl border font-arcade text-xs flex items-center justify-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-white/20 border-white text-white shadow-md'
                    : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                <span>{config.emoji}</span>
                <span className="font-bold text-[11px]">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* BIG 3D PLAY AGAIN BUTTON */}
        <button
          onClick={() => { playButtonClick(); onRestart(selectedDifficulty); }}
          className="w-full py-4 px-8 rounded-3xl arcade-btn-green font-arcade text-xl font-black text-white tracking-wider flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <span>🔄</span>
          <span>PLAY AGAIN</span>
        </button>
      </main>

      {/* Bottom Action Row */}
      <footer className="relative z-20 w-full max-w-sm flex items-center justify-center gap-2 pt-2">
        {!scoreSaved && gameState.score > 0 && (
          <button
            onClick={() => { playButtonClick(); setScoreSaved(true); onSaveScore(); }}
            className="flex-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white font-arcade text-xs flex items-center justify-center gap-1 shadow-md transition-transform"
          >
            <span>💾</span> Save
          </button>
        )}
        <button
          onClick={() => { playButtonClick(); onShowLeaderboard(); }}
          className="flex-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white font-arcade text-xs flex items-center justify-center gap-1 shadow-md transition-transform"
        >
          <span>🏆</span> Scores
        </button>
        <button
          onClick={() => { playButtonClick(); onShowDailyLeaderboard(); }}
          className="flex-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white font-arcade text-xs flex items-center justify-center gap-1 shadow-md transition-transform"
        >
          <span>🌍</span> Daily
        </button>
        {onQuit && (
          <button
            onClick={() => { playButtonClick(); onQuit(); }}
            className="flex-1 py-2.5 px-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white font-arcade text-xs flex items-center justify-center gap-1 shadow-md transition-transform"
          >
            <span>🏠</span> Menu
          </button>
        )}
      </footer>
    </div>
  );
}
