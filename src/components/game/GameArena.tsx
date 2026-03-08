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
import { addToLeaderboard } from './Leaderboard';

export function GameArena() {
  const { gameState, balloons, floatingScores, lifeLostAt, startGame, popBalloon, pauseGame, resumeGame, quitToMenu } = useGameEngine();
  const [showTutorial, setShowTutorial] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
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

  if (gameState.status === 'menu') {
    return (
      <>
        {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
        <MainMenu
          highScore={gameState.highScore}
          onStart={(diff: Difficulty) => startGame(diff)}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      </>
    );
  }

  if (gameState.status === 'gameover') {
    if (showNameInput) {
      return (
        <NameInputDialog
          score={gameState.score}
          onSubmit={(name) => {
            addToLeaderboard({
              name,
              score: gameState.score,
              level: gameState.level,
              difficulty: gameState.difficulty,
              date: new Date().toLocaleDateString(),
            });
            setShowNameInput(false);
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
          startGame(diff);
        }}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        onSaveScore={() => setShowNameInput(true)}
      />
    );
  }

  return (
    <div className={`relative w-full h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden ${shaking ? 'animate-shake' : ''}`}>
      <StarField />
      <GameHUD gameState={gameState} onPause={pauseGame} />

      {gameState.status === 'paused' && (
        <PauseMenu gameState={gameState} onResume={resumeGame} onQuit={quitToMenu} />
      )}

      <div className="absolute inset-0 z-10">
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
          <span className={`font-game-title text-lg ${fs.type === 'good' ? 'text-game-correct-glow' : 'text-game-wrong-glow'} drop-shadow-lg`}>
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
    </div>
  );
}
