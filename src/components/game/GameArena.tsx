import { useState, useEffect, useRef } from 'react';
import { Difficulty, GameState, DIFFICULTY_CONFIGS } from '@/game/types';
import { GameEngine2D } from '@/game/canvasEngine';
import { GameHUD } from './GameHUD';
import { MainMenu } from './MainMenu';
import { GameOverScreen } from './GameOverScreen';
import { PauseMenu } from './PauseMenu';
import { Leaderboard, addToLeaderboard } from './Leaderboard';
import { NameInputDialog } from './NameInputDialog';
import { DailyLeaderboard } from './DailyLeaderboard';
import { submitDailyScore, hasSubmittedToday } from '@/game/dailyChallenge';
import { useYouTubePlayables } from '@/game/youtubePlayables';
import { AchievementId, unlockAchievements } from '@/game/achievements';

export function GameArena() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine2D | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [engineState, setEngineState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    score: 0,
    lives: 3,
    startingLives: 3,
    level: 1,
    combo: 0,
    bestCombo: 0,
    highScore: parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
    balloonsPopped: 0,
    missedLies: 0,
    difficulty: 'medium',
    mode: 'classic',
    dailySeed: '',
    powerUps: { freezeUntil: 0, doubleUntil: 0 },
  });

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDailyLeaderboard, setShowDailyLeaderboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [submittingDaily, setSubmittingDaily] = useState(false);

  const award = (ids: AchievementId[]) => {
    const newlyUnlocked = unlockAchievements(ids);
    if (newlyUnlocked.length) showNotification(`🏅 Achievement: ${newlyUnlocked.map(id => id.replace('-', ' ')).join(', ')}`);
  };

  // Initialize Canvas 2D Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine2D(canvasRef.current);
    engineRef.current = engine;

    engine.onStateChange = (st) => {
      const mapped = st === 'MENU' ? 'menu' : st === 'PLAYING' ? 'playing' : 'gameover';
      setEngineState(mapped);
      setGameState(prev => ({ ...prev, status: mapped }));
    };

    engine.onScoreUpdate = (sc, hs, lvl, cmb) => {
      setGameState(prev => ({
        ...prev,
        score: sc,
        highScore: hs,
        level: lvl,
        combo: cmb,
        bestCombo: Math.max(prev.bestCombo, cmb),
        balloonsPopped: engine.balloonsPopped,
      }));
      const awards: AchievementId[] = [];
      if (engine.balloonsPopped === 1) awards.push('first-pop');
      if (cmb >= 5) awards.push('combo-5');
      if (sc >= 250) awards.push('score-250');
      if (awards.length) award(awards);
    };

    engine.onLivesUpdate = (lv) => {
      setGameState(prev => ({ ...prev, lives: lv }));
    };

    engine.run();

    return () => {
      engine.destroy();
    };
  }, []);

  useYouTubePlayables({
    onLoaded: (save) => setGameState(prev => ({ ...prev, highScore: Math.max(prev.highScore, save.highScore) })),
    onPause: () => {
      engineRef.current?.pause();
      setEngineState('paused');
      setGameState(prev => ({ ...prev, status: 'paused' }));
    },
    onResume: () => {
      engineRef.current?.resume();
      setEngineState('playing');
      setGameState(prev => ({ ...prev, status: 'playing' }));
    },
    getSave: () => ({ version: 1, highScore: gameState.highScore }),
  });

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({ coordinateSystem: 'canvas pixels: origin top-left, x right, y down', ...engineRef.current?.getStateSnapshot() });
    window.advanceTime = (ms) => engineRef.current?.advanceTime(ms);
    return () => { delete window.render_game_to_text; delete window.advanceTime; };
  }, []);

  const handleStartGame = (diff: Difficulty, mode: 'classic' | 'daily' = 'classic') => {
    const config = DIFFICULTY_CONFIGS[diff];
    setGameState(prev => ({
      ...prev,
      difficulty: diff,
      mode,
      lives: config.lives,
      startingLives: config.lives,
      score: 0,
      combo: 0,
      level: 1,
      status: 'playing',
    }));
    setEngineState('playing');
    engineRef.current?.start(diff, mode);
  };

  const handlePause = () => {
    setEngineState('paused');
    setGameState(prev => ({ ...prev, status: 'paused' }));
    engineRef.current?.pause();
  };

  const handleResume = () => {
    setEngineState('playing');
    setGameState(prev => ({ ...prev, status: 'playing' }));
    engineRef.current?.resume();
  };

  const handleQuitToMenu = () => {
    setEngineState('menu');
    setGameState(prev => ({ ...prev, status: 'menu' }));
    engineRef.current?.quitToMenu();
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none touch-none overscroll-none bg-[#070a13]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 60FPS HTML5 Canvas Game World */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full touch-none select-none z-0"
        tabIndex={0}
        aria-label="Pop the Lie game canvas. Tap or click false equations."
      />

      {/* In-Game HUD: Score, Lives, Combo Flame, Pause */}
      {engineState === 'playing' && (
        <GameHUD gameState={gameState} onPause={handlePause} />
      )}

      {/* Paused Menu */}
      {engineState === 'paused' && (
        <PauseMenu
          gameState={gameState}
          onResume={handleResume}
          onQuit={handleQuitToMenu}
        />
      )}

      {/* Main Menu Overlay (Canvas ambient balloons still float & are poppable!) */}
      {engineState === 'menu' && (
        <MainMenu
          highScore={gameState.highScore}
          onStart={(diff) => handleStartGame(diff, 'classic')}
          onStartDaily={(diff) => handleStartGame(diff, 'daily')}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onShowDailyLeaderboard={() => setShowDailyLeaderboard(true)}
        />
      )}

      {/* Game Over Screen */}
      {engineState === 'gameover' && !showNameInput && (
        <GameOverScreen
          gameState={gameState}
          canRevive={false}
          onRewardedRevive={async () => false}
          onRestart={(diff) => handleStartGame(diff, gameState.mode)}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onShowDailyLeaderboard={() => setShowDailyLeaderboard(true)}
          onSaveScore={() => setShowNameInput(true)}
          onQuit={handleQuitToMenu}
        />
      )}

      {/* Name Input Dialog for Leaderboard Submission */}
      {showNameInput && (
        <NameInputDialog
          score={gameState.score}
          onSubmit={async (name) => {
            const isDaily = gameState.mode === 'daily';
            if (isDaily && !hasSubmittedToday()) {
              setSubmittingDaily(true);
              try {
                const result = await submitDailyScore({
                  name,
                  score: gameState.score,
                  level: gameState.level,
                  bestCombo: gameState.bestCombo,
                  difficulty: gameState.difficulty,
                });
                award(['daily-player']);
                showNotification(result.offline ? '📱 Daily score saved offline.' : '🌍 Score submitted to the global board!');
              } catch (e: any) {
                console.error('Daily submit failed', e);
                showNotification('⚠️ Could not submit score. Try again later.');
              }
              setSubmittingDaily(false);
            }
            addToLeaderboard({
              name,
              score: gameState.score,
              level: gameState.level,
              difficulty: gameState.difficulty,
              date: new Date().toLocaleDateString(),
            });
            setShowNameInput(false);
            if (isDaily) setShowDailyLeaderboard(true);
          }}
          onSkip={() => setShowNameInput(false)}
        />
      )}

      {/* Leaderboards */}
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
      {showDailyLeaderboard && (
        <DailyLeaderboard onClose={() => setShowDailyLeaderboard(false)} />
      )}

      {/* Arcade Notification Banner */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-amber-400 text-black font-arcade text-xs font-bold shadow-2xl animate-spring-in">
          {notification}
        </div>
      )}

      {submittingDaily && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center">
          <span className="font-arcade text-white font-bold text-lg animate-pulse">Submitting to Global Board...</span>
        </div>
      )}
    </div>
  );
}
