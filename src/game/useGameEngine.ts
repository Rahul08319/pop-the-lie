import { useState, useCallback, useRef, useEffect } from 'react';
import { Balloon, GameState, BALLOON_COLORS } from './types';
import { generateEquation } from './mathGenerator';

const INITIAL_STATE: GameState = {
  status: 'menu',
  score: 0,
  lives: 3,
  level: 1,
  combo: 0,
  bestCombo: 0,
  highScore: parseInt(localStorage.getItem('popTheLie_highScore') || '0'),
  balloonsPopped: 0,
  missedLies: 0,
};

let balloonIdCounter = 0;

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [floatingScores, setFloatingScores] = useState<{ id: string; x: number; y: number; text: string; type: 'good' | 'bad' }[]>([]);
  const spawnIntervalRef = useRef<number | null>(null);
  const cleanupIntervalRef = useRef<number | null>(null);

  const spawnBalloon = useCallback((level: number) => {
    const id = `balloon-${++balloonIdCounter}`;
    const equation = generateEquation(level);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const x = 10 + Math.random() * 75; // 10-85% from left
    const speed = Math.max(4, 10 - level * 0.5) + Math.random() * 3;

    const balloon: Balloon = { id, equation, x, color, speed, popped: false, createdAt: Date.now() };
    setBalloons(prev => [...prev, balloon]);
  }, []);

  const startGame = useCallback(() => {
    balloonIdCounter = 0;
    setBalloons([]);
    setFloatingScores([]);
    setGameState({ ...INITIAL_STATE, status: 'playing', highScore: INITIAL_STATE.highScore });
  }, []);

  const popBalloon = useCallback((id: string, clientX: number, clientY: number) => {
    setBalloons(prev => {
      const balloon = prev.find(b => b.id === id);
      if (!balloon || balloon.popped) return prev;

      const isLie = !balloon.equation.isCorrect;

      setGameState(gs => {
        if (gs.status !== 'playing') return gs;
        
        if (isLie) {
          // Correct pop! It was a lie
          const comboBonus = gs.combo >= 3 ? gs.combo * 5 : 0;
          const points = 10 + gs.level * 2 + comboBonus;
          const newCombo = gs.combo + 1;
          const newScore = gs.score + points;
          const newLevel = Math.floor(newScore / 100) + 1;
          const newHighScore = Math.max(newScore, gs.highScore);
          
          if (newHighScore > gs.highScore) {
            localStorage.setItem('popTheLie_highScore', String(newHighScore));
          }

          setFloatingScores(fs => [...fs, {
            id: `fs-${Date.now()}`,
            x: clientX,
            y: clientY,
            text: `+${points}${gs.combo >= 2 ? ` 🔥x${newCombo}` : ''}`,
            type: 'good'
          }]);

          return {
            ...gs,
            score: newScore,
            combo: newCombo,
            bestCombo: Math.max(newCombo, gs.bestCombo),
            level: newLevel,
            balloonsPopped: gs.balloonsPopped + 1,
            highScore: newHighScore,
          };
        } else {
          // Wrong! It was correct equation
          const newLives = gs.lives - 1;
          
          setFloatingScores(fs => [...fs, {
            id: `fs-${Date.now()}`,
            x: clientX,
            y: clientY,
            text: '❌ That was true!',
            type: 'bad'
          }]);

          if (newLives <= 0) {
            return { ...gs, lives: 0, combo: 0, status: 'gameover' };
          }
          return { ...gs, lives: newLives, combo: 0 };
        }
      });

      return prev.map(b => b.id === id ? { ...b, popped: true, popResult: isLie ? 'correct' : 'wrong' } : b);
    });
  }, []);

  // Handle missed lies (incorrect equations that float away)
  useEffect(() => {
    if (gameState.status !== 'playing') return;
    
    const interval = setInterval(() => {
      setBalloons(prev => {
        const now = Date.now();
        const escaped = prev.filter(b => !b.popped && !b.equation.isCorrect && (now - b.createdAt) > b.speed * 1000);
        
        if (escaped.length > 0) {
          setGameState(gs => {
            if (gs.status !== 'playing') return gs;
            const newLives = gs.lives - escaped.length;
            if (newLives <= 0) {
              return { ...gs, lives: 0, status: 'gameover', missedLies: gs.missedLies + escaped.length };
            }
            return { ...gs, lives: newLives, combo: 0, missedLies: gs.missedLies + escaped.length };
          });
        }

        // Clean old balloons
        return prev.filter(b => {
          if (b.popped) return (now - b.createdAt) < 1000;
          return (now - b.createdAt) < (b.speed + 1) * 1000;
        });
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gameState.status]);

  // Spawn balloons
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      return;
    }

    const spawnRate = Math.max(800, 2500 - gameState.level * 150);
    
    spawnBalloon(gameState.level);
    
    spawnIntervalRef.current = window.setInterval(() => {
      spawnBalloon(gameState.level);
    }, spawnRate);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [gameState.status, gameState.level, spawnBalloon]);

  // Clean floating scores
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingScores(prev => prev.filter(fs => Date.now() - parseInt(fs.id.split('-')[1]) < 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return { gameState, balloons, floatingScores, startGame, popBalloon };
}
