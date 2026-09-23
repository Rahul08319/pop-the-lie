import { useState, useEffect, useMemo } from 'react';
import { useGameEngine } from '@/game/useGameEngine';
import { Difficulty } from '@/game/types';
import { BalloonComponent } from './BalloonComponent';
import { GameHUD } from './GameHUD';
import { MainMenu } from './MainMenu';
import { GameOverScreen } from './GameOverScreen';
import { StarField } from './StarField';
import { TutorialOverlay } from './TutorialOverlay';
import { PauseMenu } from './PauseMenu';
import { Leaderboard } from './Leaderboard';
import { NameInputDialog } from './NameInputDialog';
import { DailyLeaderboard } from './DailyLeaderboard';
import { addToLeaderboard } from './Leaderboard';
import { submitDailyScore, hasSubmittedToday } from '@/game/dailyChallenge';
import { toast } from '@/hooks/use-toast';

export function GameArena() {
  const {
    gameState,
    balloons,
    floatingScores,
    lifeLostAt,
    canRevive,
    startGame,
    popBalloon,
    pauseGame,
    resumeGame,
    quitToMenu,
    triggerRewardedRevive,
  } = useGameEngine();

  const [showTutorial, setShowTutorial] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDailyLeaderboard, setShowDailyLeaderboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [submittingDaily, setSubmittingDaily] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (lifeLostAt > 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 500);
      return () => clearTimeout(t);
    }
  }, [lifeLostAt]);

  const particles = useMemo(() => {
    if (lifeLostAt === 0) return [];
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      return { id: `p-${lifeLostAt}-${i}`, px: Math.cos(angle) * dist, py: Math.sin(angle) * dist };
    });
  }, [lifeLostAt]);

  if (showLeaderboard) {
    return <Leaderboard onClose={() => setShowLeaderboard(false)} />;
  }
  if (showDailyLeaderboard) {
    return <DailyLeaderboard onClose={() => setShowDailyLeaderboard(false)} />;
  }

  if (gameState.status === 'menu') {
    return (
      <>
        {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
        <MainMenu
          highScore={gameState.highScore}
          onStart={(diff: Difficulty) => startGame(diff, 'classic')}
          onStartDaily={(diff: Difficulty) => startGame(diff, 'daily')}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onShowDailyLeaderboard={() => setShowDailyLeaderboard(true)}
        />
      </>
    );
  }

  if (gameState.status === 'gameover') {
    if (showNameInput) {
      const isDaily = gameState.mode === 'daily';
      return (
        <NameInputDialog
          score={gameState.score}
          onSubmit={async (name) => {
            if (isDaily && !hasSubmittedToday()) {
              setSubmittingDaily(true);
              try {
                await submitDailyScore({
                  name,
                  score: gameState.score,
                  level: gameState.level,
                  bestCombo: gameState.bestCombo,
                  difficulty: gameState.difficulty,
                });
                toast({ title: '🌍 Submitted!', description: 'Your daily score is on the global board.' });
              } catch (e: any) {
                console.error('Daily submit failed', e);
                toast({
                  title: 'Could not submit score',
                  description: e?.message ?? 'Please try again later.',
                  variant: 'destructive',
                });
              }
              setSubmittingDaily(false);
            } else if (isDaily) {
              toast({
                title: 'Already submitted today',
                description: 'One Daily Challenge submission per device.',
              });
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
      );
    }
    return (
      <GameOverScreen
        gameState={gameState}
        canRevive={canRevive}
        onRewardedRevive={triggerRewardedRevive}
        onRestart={(diff: Difficulty) => {
          setShowNameInput(false);
          startGame(diff, gameState.mode);
        }}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        onShowDailyLeaderboard={() => setShowDailyLeaderboard(true)}
        onSaveScore={() => setShowNameInput(true)}
      />
    );
  }

  const now = Date.now();
  const freezeActive = now < gameState.powerUps.freezeUntil;
  const doubleActive = now < gameState.powerUps.doubleUntil;

  return (
    <div className={`relative w-full h-screen bg-gradient-to-b from-[#0c1017] via-[#141a24] to-[#0a0e14] overflow-hidden ${shaking ? 'animate-shake' : ''}`}>
      <StarField />
      <GameHUD gameState={gameState} onPause={pauseGame} />

      {/* Apple Power-up Dynamic Floating Badges */}
      {(freezeActive || doubleActive || gameState.mode === 'daily') && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pointer-events-none animate-spring-in">
          {gameState.mode === 'daily' && (
            <span className="text-[10px] font-bold tracking-tight bg-[#f5c518]/20 border border-[#f5c518]/40 px-3 py-1 rounded-full text-[#f5c518] backdrop-blur-md shadow-md">
              🌍 DAILY CHALLENGE
            </span>
          )}
          {freezeActive && (
            <span title="Freeze — balloons paused" className="text-[10px] font-bold tracking-tight bg-[#2997ff]/25 border border-[#2997ff]/50 px-3 py-1 rounded-full text-[#2997ff] backdrop-blur-md shadow-md animate-pulse">
              ❄️ FROZEN
            </span>
          )}
          {doubleActive && (
            <span title="Double Points — 2× score" className="text-[10px] font-bold tracking-tight bg-amber-400/25 border border-amber-400/50 px-3 py-1 rounded-full text-amber-300 backdrop-blur-md shadow-md animate-pulse">
              ✨ 2X BOOST
            </span>
          )}
        </div>
      )}

      {gameState.status === 'paused' && (
        <PauseMenu gameState={gameState} onResume={resumeGame} onQuit={quitToMenu} />
      )}

      {/* Balloon Playfield */}
      <div
        className={`absolute inset-0 z-10 ${freezeActive ? '[&_*]:!animation-play-state-paused' : ''}`}
        style={freezeActive ? { filter: 'hue-rotate(180deg) brightness(1.1)' } : undefined}
      >
        {balloons.map(balloon => (
          <BalloonComponent key={balloon.id} balloon={balloon} onPop={popBalloon} />
        ))}
      </div>

      {/* Floating Score Indicators */}
      {floatingScores.map(fs => (
        <div
          key={fs.id}
          className="fixed z-40 pointer-events-none animate-score-fly"
          style={{ left: fs.x, top: fs.y }}
        >
          <span
            className={`font-apple-display font-extrabold text-xl tracking-tight ${
              fs.type === 'good'
                ? 'text-emerald-400 drop-shadow-[0_2px_8px_rgba(52,199,89,0.8)]'
                : fs.type === 'bad'
                ? 'text-rose-400 drop-shadow-[0_2px_8px_rgba(255,59,48,0.8)]'
                : 'text-[#f5c518] drop-shadow-[0_2px_8px_rgba(245,197,24,0.8)]'
            }`}
          >
            {fs.text}
          </span>
        </div>
      ))}

      {/* Life lost flash overlay */}
      {lifeLostAt > 0 && (
        <div key={lifeLostAt} className="absolute inset-0 z-30 pointer-events-none animate-life-lost-flash" />
      )}

      {/* Life lost particles */}
      {particles.length > 0 && (
        <div key={`particles-${lifeLostAt}`} className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 animate-particle-explode"
              style={{ '--px': `${p.px}px`, '--py': `${p.py}px` } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Danger vignette when 1 life remains */}
      {gameState.lives <= 1 && gameState.lives > 0 && (
        <div className="absolute inset-0 border-4 border-rose-500/40 rounded-none pointer-events-none animate-pulse z-20" />
      )}

      {submittingDaily && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center">
          <span className="font-apple-display text-white font-bold text-lg animate-pulse">Submitting to Global Board...</span>
        </div>
      )}
    </div>
  );
}
