import { useState, useEffect, useCallback, useMemo } from 'react';
import { StarField } from './StarField';
import { Difficulty, DIFFICULTY_CONFIGS, BALLOON_COLORS } from '@/game/types';
import { playButtonClick, playPopCorrect, playPopWrong, toggleMusicMute, isMusicMuted } from '@/game/audioManager';
import { PlatformSelectorModal } from './PlatformSelectorModal';

interface MainMenuProps {
  highScore: number;
  onStart: (difficulty: Difficulty) => void;
  onStartDaily: (difficulty: Difficulty) => void;
  onShowLeaderboard: () => void;
  onShowDailyLeaderboard: () => void;
}

interface MenuBalloon {
  id: string;
  x: number;
  speed: number;
  color: string;
  equation: string;
  isLie: boolean;
  popped: boolean;
}

const MENU_EQUATIONS = [
  { eq: '2 + 3 = 6', isLie: true },
  { eq: '5 × 2 = 10', isLie: false },
  { eq: '9 - 4 = 5', isLie: false },
  { eq: '7 + 1 = 9', isLie: true },
  { eq: '8 ÷ 2 = 3', isLie: true },
  { eq: '4 × 3 = 12', isLie: false },
  { eq: '6 + 7 = 14', isLie: true },
  { eq: '10 - 6 = 4', isLie: false },
];

export function MainMenu({
  highScore,
  onStart,
  onStartDaily,
  onShowLeaderboard,
  onShowDailyLeaderboard,
}: MainMenuProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [selectedMode, setSelectedMode] = useState<'classic' | 'daily'>('classic');
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [muted, setMuted] = useState(isMusicMuted());
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Interactive ambient balloons for the title screen!
  const [menuBalloons, setMenuBalloons] = useState<MenuBalloon[]>([]);
  const [menuParticles, setMenuParticles] = useState<{ id: string; x: number; y: number; text: string }[]>([]);

  // Spawn periodic interactive ambient balloons
  useEffect(() => {
    let idCounter = 0;
    const interval = setInterval(() => {
      setMenuBalloons((prev) => {
        if (prev.filter(b => !b.popped).length >= 5) return prev;
        const item = MENU_EQUATIONS[Math.floor(Math.random() * MENU_EQUATIONS.length)];
        const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
        const newBalloon: MenuBalloon = {
          id: `menu-b-${++idCounter}`,
          x: 10 + Math.random() * 80,
          speed: 6 + Math.random() * 4,
          color,
          equation: item.eq,
          isLie: item.isLie,
          popped: false,
        };
        return [...prev.slice(-8), newBalloon];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const handlePopMenuBalloon = (b: MenuBalloon, e: React.PointerEvent) => {
    e.stopPropagation();
    if (b.popped) return;

    if (b.isLie) {
      playPopCorrect(1);
    } else {
      playPopWrong();
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const px = rect.left + rect.width / 2;
    const py = rect.top;

    setMenuParticles(prev => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        x: px,
        y: py,
        text: b.isLie ? '💥 POP!' : '❌ TRUE!',
      },
    ]);

    setMenuBalloons(prev =>
      prev.map(item => item.id === b.id ? { ...item, popped: true } : item)
    );
  };

  const handleMuteToggle = () => {
    playButtonClick();
    const newMuted = toggleMusicMute();
    setMuted(newMuted);
  };

  const handleFullscreenToggle = () => {
    playButtonClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none touch-none overscroll-none bg-gradient-to-b from-[#0a0f1d] via-[#101827] to-[#060a12] flex flex-col justify-between items-center p-4 sm:p-6"
      onContextMenu={(e) => e.preventDefault()}
    >
      <StarField />

      {/* Interactive Title Screen Balloons that the player can tap! */}
      <div className="absolute inset-0 pointer-events-auto z-10 overflow-hidden">
        {menuBalloons.map((b) => {
          if (b.popped) return null;
          return (
            <div
              key={b.id}
              onPointerDown={(e) => handlePopMenuBalloon(b, e)}
              className="absolute animate-float-up cursor-pointer active:scale-95 transition-transform hover:scale-105"
              style={{
                left: `${b.x}%`,
                '--float-duration': `${b.speed}s`,
              } as React.CSSProperties}
            >
              <div className="animate-sway flex flex-col items-center">
                <div className="w-[72px] h-[88px] rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] bg-gradient-to-b from-blue-500 to-indigo-700 shadow-xl border border-white/30 flex items-center justify-center p-2 relative">
                  <div className="absolute top-2 left-2.5 w-4 h-6 rounded-full bg-white/40 rotate-[-25deg]" />
                  <span className="font-arcade text-white text-xs font-bold drop-shadow-md text-center">
                    {b.equation}
                  </span>
                  <div className="absolute -bottom-1.5 w-3 h-2 bg-indigo-700 rounded-b-md" />
                </div>
                <div className="w-[1px] h-7 bg-white/30" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Particles for Title Screen Pops */}
      {menuParticles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none animate-score-fly z-40"
          style={{ left: p.x, top: p.y }}
        >
          <span className="font-arcade text-amber-300 font-extrabold text-lg drop-shadow-[0_2px_10px_rgba(251,191,36,0.8)]">
            {p.text}
          </span>
        </div>
      ))}

      {/* Top Arcade HUD Bar */}
      <header className="relative z-20 w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleMuteToggle}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 backdrop-blur-md flex items-center justify-center text-lg text-white shadow-lg transition-transform"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreenToggle}
            className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold text-white shadow-lg transition-transform"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '⤦' : '⛶'}
          </button>
        </div>

        {/* High Score Gold Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <span className="text-lg">👑</span>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-amber-300/80 tracking-widest leading-none">Best Score</span>
            <span className="font-arcade text-lg font-black text-amber-300 leading-none">{highScore}</span>
          </div>
        </div>
      </header>

      {/* Center Hero: 3D Bouncy Game Title & Action Area */}
      <main className="relative z-20 flex flex-col items-center gap-5 my-auto w-full max-w-md">
        {/* Animated 3D Arcade Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wider uppercase backdrop-blur-sm animate-pulse">
            <span>🎈</span> FAST MATH ARCADE <span>⚡</span>
          </div>

          <div className="relative inline-block select-none">
            <h1 className="font-arcade text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffd60a] via-[#ff9500] to-[#ff3b30] drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] tracking-wide transform hover:scale-105 transition-transform">
              POP THE LIE!
            </h1>
            <div className="absolute -bottom-2 -right-4 text-3xl animate-bounce">
              🎈
            </div>
          </div>

          <p className="font-arcade text-xs sm:text-sm text-sky-200/80 drop-shadow">
            Pop Wrong Equations • Protect The Truth!
          </p>
        </div>

        {/* Game Mode Switcher: Arcade Endless vs Daily Challenge */}
        <div className="flex p-1 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-lg w-full max-w-xs shadow-inner">
          <button
            onClick={() => { playButtonClick(); setSelectedMode('classic'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-arcade text-xs transition-all flex items-center justify-center gap-1.5 ${
              selectedMode === 'classic'
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>⚡</span> Arcade Run
          </button>
          <button
            onClick={() => { playButtonClick(); setSelectedMode('daily'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-arcade text-xs transition-all flex items-center justify-center gap-1.5 ${
              selectedMode === 'daily'
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>🌍</span> Daily Quest
          </button>
        </div>

        {/* Difficulty Badges */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
          {difficulties.map((diff) => {
            const config = DIFFICULTY_CONFIGS[diff];
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => { playButtonClick(); setSelectedDifficulty(diff); }}
                className={`py-2 px-2 rounded-2xl border font-arcade text-xs flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span className="text-base">{config.emoji}</span>
                <span className="font-bold text-[11px] mt-0.5">{config.label}</span>
                <span className="text-[9px] text-white/50">{config.lives} Lives</span>
              </button>
            );
          })}
        </div>

        {/* GIANT 3D ARCADE PLAY BUTTON */}
        <button
          onClick={() => {
            playButtonClick();
            if (selectedMode === 'daily') {
              onStartDaily(selectedDifficulty);
            } else {
              onStart(selectedDifficulty);
            }
          }}
          className="w-full max-w-xs py-4 px-8 rounded-3xl arcade-btn-green font-arcade text-2xl font-black text-white tracking-wider flex items-center justify-center gap-3 animate-pulse hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          <span className="text-3xl">▶</span>
          <span>START GAME</span>
        </button>
      </main>

      {/* Bottom Arcade Control Toolbar */}
      <footer className="relative z-20 w-full max-w-md flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => { playButtonClick(); onShowLeaderboard(); }}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 backdrop-blur-md text-white font-arcade text-xs flex items-center justify-center gap-1.5 shadow-lg transition-transform"
        >
          <span>🏆</span> Scores
        </button>

        <button
          onClick={() => { playButtonClick(); setShowHowToPlay(true); }}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 backdrop-blur-md text-white font-arcade text-xs flex items-center justify-center gap-1.5 shadow-lg transition-transform"
        >
          <span>❓</span> Rules
        </button>

        <button
          onClick={() => { playButtonClick(); setShowPowerUps(true); }}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 backdrop-blur-md text-white font-arcade text-xs flex items-center justify-center gap-1.5 shadow-lg transition-transform"
        >
          <span>⚡</span> Powers
        </button>

        <button
          onClick={() => { playButtonClick(); setShowPlatformModal(true); }}
          className="w-11 h-10 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 backdrop-blur-md text-white flex items-center justify-center text-sm shadow-lg transition-transform"
          title="Platform / Settings"
        >
          <span>⚙️</span>
        </button>
      </footer>

      {/* Modal: How to Play */}
      {showHowToPlay && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-spring-in"
          onClick={() => setShowHowToPlay(false)}
        >
          <div
            className="bg-[#141a28] border-2 border-white/20 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-arcade text-2xl text-amber-300">How to Play</h2>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                <span className="text-3xl">🎈❌</span>
                <div>
                  <h3 className="font-arcade text-sm text-red-300 font-bold">Pop False Math</h3>
                  <p className="text-xs text-white/70">Tap any balloon with a wrong equation (e.g. 2 + 2 = 5) to pop it for points!</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <span className="text-3xl">🛡️✅</span>
                <div>
                  <h3 className="font-arcade text-sm text-emerald-300 font-bold">Spare The Truth</h3>
                  <p className="text-xs text-white/70">Let correct equations float away safely! Popping a correct one costs 1 life.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3">
                <span className="text-3xl">🔥✨</span>
                <div>
                  <h3 className="font-arcade text-sm text-purple-300 font-bold">Streak High Combos</h3>
                  <p className="text-xs text-white/70">Pop lies consecutively without mistakes to trigger fiery multiplier combos!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-2xl arcade-btn-green font-arcade text-white text-sm font-bold shadow-lg"
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}

      {/* Modal: Power-Ups */}
      {showPowerUps && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-spring-in"
          onClick={() => setShowPowerUps(false)}
        >
          <div
            className="bg-[#141a28] border-2 border-white/20 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-arcade text-2xl text-amber-300">Power-Ups</h2>
              <button
                onClick={() => setShowPowerUps(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center gap-3">
                <span className="text-3xl">❄️</span>
                <div>
                  <h3 className="font-arcade text-sm text-blue-300 font-bold">Freeze Time</h3>
                  <p className="text-xs text-white/70">Freezes all balloons on screen for 3.5 seconds so you can plan and pop!</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center gap-3">
                <span className="text-3xl">❤️</span>
                <div>
                  <h3 className="font-arcade text-sm text-rose-300 font-bold">Extra Life</h3>
                  <p className="text-xs text-white/70">Restores +1 heart container back to your starting maximum!</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <div>
                  <h3 className="font-arcade text-sm text-amber-300 font-bold">2X Score Boost</h3>
                  <p className="text-xs text-white/70">Doubles all points earned for the next 8 seconds!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPowerUps(false)}
              className="w-full py-3 rounded-2xl arcade-btn-blue font-arcade text-white text-sm font-bold shadow-lg"
            >
              NICE!
            </button>
          </div>
        </div>
      )}

      {/* Platform Selector Modal */}
      {showPlatformModal && (
        <PlatformSelectorModal onClose={() => setShowPlatformModal(false)} />
      )}
    </div>
  );
}
