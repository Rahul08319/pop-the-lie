import { useState, useCallback, useRef, useEffect } from 'react';
import { Balloon, GameState, BALLOON_COLORS, Difficulty, DIFFICULTY_CONFIGS } from './types';
import { generateEquation } from './mathGenerator';
import { playPopCorrect, playPopWrong, playCombo, playGameOver, hapticPop, hapticWrong, hapticGameOver, startBackgroundMusic, stopBackgroundMusic } from './audioManager';

const getInitialState = (difficulty: Difficulty = 'medium'): GameState => ({
  status: 'menu',
  score: 0,
  lives: DIFFICULTY_CONFIGS[difficulty].lives,
  level: 1,
  combo: 0,
  bestCombo: 0,
  highScore: parseInt(localStorage.getItem('popTheLie_highScore') || '0'),
  balloonsPopped: 0,
  missedLies: 0,
  difficulty,
});

let balloonIdCounter = 0;

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(getInitialState());
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [floatingScores, setFloatingScores] = useState<{ id: string; x: number; y: number; text: string; type: 'good' | 'bad' }[]>([]);
  const spawnIntervalRef = useRef<number | null>(null);

  const spawnBalloon = useCallback((level: number, difficulty: Difficulty) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const id = `balloon-${++balloonIdCounter}`;
    const equation = generateEquation(level, config.lieChance);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const x = 10 + Math.random() * 75;
    const speed = Math.max(config.speedBase * 0.4, config.speedBase - level * config.speedScaling) + Math.random() * 3;

    const balloon: Balloon = { id, equation, x, color, speed, popped: false, createdAt: Date.now() };
    setBalloons(prev => [...prev, balloon]);
  }, []);

  const [lifeLostAt, setLifeLostAt] = useState<number>(0);

  const startGame = useCallback((difficulty: Difficulty = 'medium') => {
    balloonIdCounter = 0;
    setBalloons([]);
    setFloatingScores([]);
    const initial = getInitialState(difficulty);
    setGameState({ ...initial, status: 'playing', highScore: initial.highScore });
    startBackgroundMusic();
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(gs => gs.status === 'playing' ? { ...gs, status: 'paused' } : gs);
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(gs => gs.status === 'paused' ? { ...gs, status: 'playing' } : gs);
  }, []);

  const quitToMenu = useCallback(() => {
    setBalloons([]);
    setFloatingScores([]);
    setGameState(gs => ({ ...getInitialState(gs.difficulty), highScore: gs.highScore }));
  }, []);

  const popBalloon = useCallback((id: string, clientX: number, clientY: number) => {
    setBalloons(prev => {
      const balloon = prev.find(b => b.id === id);
      if (!balloon || balloon.popped) return prev;

      const isLie = !balloon.equation.isCorrect;

      setGameState(gs => {
        if (gs.status !== 'playing') return gs;
        
        if (isLie) {
          const comboBonus = gs.combo >= 3 ? gs.combo * 5 : 0;
          const points = 10 + gs.level * 2 + comboBonus;
          const newCombo = gs.combo + 1;
          const newScore = gs.score + points;
          const newLevel = Math.floor(newScore / 100) + 1;
          const newHighScore = Math.max(newScore, gs.highScore);
          
          if (newHighScore > gs.highScore) {
            localStorage.setItem('popTheLie_highScore', String(newHighScore));
          }

          playPopCorrect();
          hapticPop();
          if (newCombo >= 3) playCombo();

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
          const newLives = gs.lives - 1;
          
          playPopWrong();
          hapticWrong();

          setFloatingScores(fs => [...fs, {
            id: `fs-${Date.now()}`,
            x: clientX,
            y: clientY,
            text: '❌ That was true!',
            type: 'bad'
          }]);

          if (newLives <= 0) {
            setTimeout(() => { playGameOver(); hapticGameOver(); }, 300);
            return { ...gs, lives: 0, combo: 0, status: 'gameover' };
          }
          return { ...gs, lives: newLives, combo: 0 };
        }
      });

      return prev.map(b => b.id === id ? { ...b, popped: true, popResult: isLie ? 'correct' : 'wrong' } : b);
    });
  }, []);

  // Handle missed lies
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
              setTimeout(() => { playGameOver(); hapticGameOver(); }, 300);
              return { ...gs, lives: 0, status: 'gameover', missedLies: gs.missedLies + escaped.length };
            }
            return { ...gs, lives: newLives, combo: 0, missedLies: gs.missedLies + escaped.length };
          });
        }

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

    const config = DIFFICULTY_CONFIGS[gameState.difficulty];
    const spawnRate = Math.max(800, config.spawnRateBase - gameState.level * config.spawnRateScaling);
    
    spawnBalloon(gameState.level, gameState.difficulty);
    
    spawnIntervalRef.current = window.setInterval(() => {
      spawnBalloon(gameState.level, gameState.difficulty);
    }, spawnRate);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [gameState.status, gameState.level, gameState.difficulty, spawnBalloon]);

  // Clean floating scores
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingScores(prev => prev.filter(fs => Date.now() - parseInt(fs.id.split('-')[1]) < 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return { gameState, balloons, floatingScores, startGame, popBalloon, pauseGame, resumeGame, quitToMenu };
}
