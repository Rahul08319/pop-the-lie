import { useState } from 'react';
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
  const { gameState, balloons, floatingScores, startGame, popBalloon, pauseGame, resumeGame, quitToMenu } = useGameEngine();
  const [showTutorial, setShowTutorial] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

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
    <div className="relative w-full h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden">
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

      {gameState.lives <= 1 && (
        <div className="absolute inset-0 border-4 border-game-wrong-glow/30 rounded-none pointer-events-none animate-pulse z-20" />
      )}
    </div>
  );
}
