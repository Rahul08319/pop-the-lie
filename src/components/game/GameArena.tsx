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

export function GameArena() {
  const { gameState, balloons, floatingScores, lifeLostAt, startGame, popBalloon, pauseGame, resumeGame, quitToMenu } = useGameEngine();
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
              } catch (e) {
                console.error('Daily submit failed', e);
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
      );
    }
    return (
      <GameOverScreen
        gameState={gameState}
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
    <div className={`relative w-full h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden ${shaking ? 'animate-shake' : ''}`}>
      <StarField />
      <GameHUD gameState={gameState} onPause={pauseGame} />

      {/* Power-up status bar */}
      {(freezeActive || doubleActive || gameState.mode === 'daily') && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex gap-2 pointer-events-none">
          {gameState.mode === 'daily' && (
            <span className="font-game-title text-[10px] bg-game-score/30 border border-game-score/50 px-2 py-1 rounded-full text-game-score">🌍 DAILY</span>
          )}
          {freezeActive && (
            <span className="font-game-title text-[10px] bg-primary/40 border border-primary/60 px-2 py-1 rounded-full text-primary-foreground animate-pulse">❄️ FROZEN</span>
          )}
          {doubleActive && (
            <span className="font-game-title text-[10px] bg-game-score/40 border border-game-score/60 px-2 py-1 rounded-full text-primary-foreground animate-pulse">✨ x2</span>
          )}
        </div>
      )}

      {gameState.status === 'paused' && (
        <PauseMenu gameState={gameState} onResume={resumeGame} onQuit={quitToMenu} />
      )}

      <div className={`absolute inset-0 z-10 ${freezeActive ? '[&_*]:!animation-play-state-paused' : ''}`} style={freezeActive ? { filter: 'hue-rotate(180deg) brightness(1.1)' } : undefined}>
        {balloons.map(balloon => (
          <BalloonComponent key={balloon.id} balloon={balloon} onPop={popBalloon} />
        ))}
      </div>

      {floatingScores.map(fs => (
        <div
          key={fs.id}
          className="fixed z-40 pointer-events-none animate-score-fly"
          style={{ left: fs.x, top: fs.y }}
        >
          <span className={`font-game-title text-lg ${fs.type === 'good' ? 'text-game-correct-glow' : fs.type === 'bad' ? 'text-game-wrong-glow' : 'text-game-score'} drop-shadow-lg`}>
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
              className="absolute w-3 h-3 rounded-full bg-destructive animate-particle-explode"
              style={{ '--px': `${p.px}px`, '--py': `${p.py}px` } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {gameState.lives <= 1 && gameState.lives > 0 && (
        <div className="absolute inset-0 border-4 border-game-wrong-glow/30 rounded-none pointer-events-none animate-pulse z-20" />
      )}

      {submittingDaily && (
        <div className="absolute inset-0 z-50 bg-background/70 flex items-center justify-center">
          <span className="font-game-title text-primary">Submitting...</span>
        </div>
      )}
    </div>
  );
}
