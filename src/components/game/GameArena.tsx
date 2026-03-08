import { useGameEngine } from '@/game/useGameEngine';
import { Difficulty } from '@/game/types';
import { BalloonComponent } from './BalloonComponent';
import { GameHUD } from './GameHUD';
import { MainMenu } from './MainMenu';
import { GameOverScreen } from './GameOverScreen';
import { StarField } from './StarField';

export function GameArena() {
  const { gameState, balloons, floatingScores, startGame, popBalloon } = useGameEngine();

  if (gameState.status === 'menu') {
    return <MainMenu highScore={gameState.highScore} onStart={(diff: Difficulty) => startGame(diff)} />;
  }

  if (gameState.status === 'gameover') {
    return <GameOverScreen gameState={gameState} onRestart={(diff: Difficulty) => startGame(diff)} />;
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-game-sky-top to-game-sky-bottom overflow-hidden">
      <StarField />
      <GameHUD gameState={gameState} />

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
