import { useState, useCallback, useRef, useEffect } from 'react';
import { Balloon, GameState, BALLOON_COLORS, Difficulty, DIFFICULTY_CONFIGS, GameMode, PowerUpType, ActivePowerUps } from './types';
import { generateEquation } from './mathGenerator';
import { mulberry32, seedToInt, todaySeedString } from './rng';
import {
  playPopCorrect,
  playPopWrong,
  playCombo,
  playGameOver,
  hapticPop,
  hapticWrong,
  hapticGameOver,
  startBackgroundMusic,
  stopBackgroundMusic,
  playPowerUp,
  setSystemAudioEnabled,
} from './audioManager';
import { platformManager } from '@/platforms/platformManager';

const POWERUP_SPAWN_CHANCE = 0.07; // ~7% of balloons carry a power-up
const FREEZE_DURATION_MS = 3500;
const DOUBLE_DURATION_MS = 8000;

const emptyPowerUps = (): ActivePowerUps => ({ freezeUntil: 0, doubleUntil: 0 });

const getInitialState = (
  difficulty: Difficulty = 'medium',
  mode: GameMode = 'classic',
  dailySeed: string = '',
): GameState => {
  const lives = DIFFICULTY_CONFIGS[difficulty].lives;
  return {
    status: 'menu',
    score: 0,
    lives,
    startingLives: lives,
    level: 1,
    combo: 0,
    bestCombo: 0,
    highScore: parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
    balloonsPopped: 0,
    missedLies: 0,
    difficulty,
    mode,
    dailySeed,
    powerUps: emptyPowerUps(),
  };
};

let balloonIdCounter = 0;

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(getInitialState());
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [floatingScores, setFloatingScores] = useState<{ id: string; x: number; y: number; text: string; type: 'good' | 'bad' | 'power' }[]>([]);
  const [lifeLostAt, setLifeLostAt] = useState<number>(0);
  const [canRevive, setCanRevive] = useState<boolean>(true);

  const spawnTimeoutRef = useRef<number | null>(null);
  const rngRef = useRef<() => number>(Math.random);

  // Synchronize audio and platform lifecycle
  useEffect(() => {
    const adapter = platformManager.getAdapter();

    // Sync audio
    setSystemAudioEnabled(adapter.isAudioEnabled());
    const cleanupAudio = adapter.onAudioEnabledChange((enabled) => {
      setSystemAudioEnabled(enabled);
    });

    // Sync cloud save
    adapter.loadData().then((save) => {
      if (save?.highScore) {
        setGameState(gs => ({ ...gs, highScore: Math.max(gs.highScore, save.highScore) }));
      }
    }).catch(err => adapter.logWarning(err));

    return () => {
      cleanupAudio();
    };
  }, []);

  const pickPowerUp = useCallback((rand: () => number): PowerUpType | undefined => {
    if (rand() > POWERUP_SPAWN_CHANCE) return undefined;
    const r = rand();
    if (r < 0.4) return 'freeze';
    if (r < 0.75) return 'life';
    return 'double';
  }, []);

  const spawnBalloon = useCallback((level: number, difficulty: Difficulty) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const rand = rngRef.current;
    const id = `balloon-${++balloonIdCounter}`;
    const equation = generateEquation(level, config.lieChance, rand);
    const color = BALLOON_COLORS[Math.floor(rand() * BALLOON_COLORS.length)];
    const x = 10 + rand() * 75;
    const speed = Math.max(config.speedBase * 0.4, config.speedBase - level * config.speedScaling) + rand() * 3;
    const powerUp = pickPowerUp(rand);

    const balloon: Balloon = { id, equation, x, color, speed, popped: false, createdAt: Date.now(), powerUp };
    setBalloons(prev => [...prev, balloon]);
  }, [pickPowerUp]);

  const initRng = useCallback((mode: GameMode, dailySeed: string) => {
    if (mode === 'daily' && dailySeed) {
      rngRef.current = mulberry32(seedToInt(dailySeed));
    } else {
      rngRef.current = Math.random;
    }
  }, []);

  const hydrateHighScore = useCallback((highScore: number) => {
    setGameState(gs => ({ ...gs, highScore: Math.max(gs.highScore, highScore) }));
  }, []);

  const startGame = useCallback((difficulty: Difficulty = 'medium', mode: GameMode = 'classic') => {
    balloonIdCounter = 0;
    setBalloons([]);
    setFloatingScores([]);
    setCanRevive(true);
    const seed = mode === 'daily' ? todaySeedString() : '';
    initRng(mode, seed);
    const initial = getInitialState(difficulty, mode, seed);
    setGameState({ ...initial, status: 'playing', highScore: initial.highScore });
    startBackgroundMusic();
    platformManager.getAdapter().gameplayStart?.();
  }, [initRng]);

  const pauseGame = useCallback(() => {
    setGameState(gs => {
      if (gs.status === 'playing') {
        platformManager.getAdapter().gameplayStop?.();
        return { ...gs, status: 'paused' };
      }
      return gs;
    });
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(gs => {
      if (gs.status === 'paused') {
        platformManager.getAdapter().gameplayStart?.();
        return { ...gs, status: 'playing' };
      }
      return gs;
    });
  }, []);

  const quitToMenu = useCallback(() => {
    setBalloons([]);
    setFloatingScores([]);
    stopBackgroundMusic();
    platformManager.getAdapter().gameplayStop?.();
    setGameState(gs => ({ ...getInitialState(gs.difficulty, 'classic', ''), highScore: gs.highScore }));
  }, []);

  // Rewarded ad revive mechanism
  const triggerRewardedRevive = useCallback(async (): Promise<boolean> => {
    if (!canRevive) return false;
    const adapter = platformManager.getAdapter();
    const success = await adapter.showRewardedAd('revive-life');
    if (success) {
      setCanRevive(false);
      setGameState(gs => ({
        ...gs,
        status: 'playing',
        lives: 1,
      }));
      startBackgroundMusic();
      adapter.gameplayStart?.();
      return true;
    }
    return false;
  }, [canRevive]);

  const applyPowerUp = useCallback((type: PowerUpType, gs: GameState, x: number, y: number): GameState => {
    const now = Date.now();
    playPowerUp();
    const labelMap: Record<PowerUpType, string> = {
      freeze: '❄️ Freeze!',
      life: '❤️ +1 Life',
      double: '✨ Double Points!',
    };
    setFloatingScores(fs => [...fs, { id: `fs-${now}-pu`, x, y, text: labelMap[type], type: 'power' }]);
    if (type === 'freeze') return { ...gs, powerUps: { ...gs.powerUps, freezeUntil: now + FREEZE_DURATION_MS } };
    if (type === 'double') return { ...gs, powerUps: { ...gs.powerUps, doubleUntil: now + DOUBLE_DURATION_MS } };
    if (type === 'life') return { ...gs, lives: Math.min(gs.startingLives, gs.lives + 1) };
    return gs;
  }, []);

  const handleGameOver = useCallback((finalScore: number, finalHighScore: number) => {
    setTimeout(() => {
      playGameOver();
      hapticGameOver();
      stopBackgroundMusic();
      const adapter = platformManager.getAdapter();
      adapter.gameplayStop?.();
      // Trigger platform interstitial ad on gameover
      void adapter.showInterstitialAd();
      void adapter.sendScore(finalScore);
      void adapter.saveData({
        version: 1,
        highScore: finalHighScore,
        lastSavedAt: Date.now(),
      });
    }, 300);
  }, []);

  const popBalloon = useCallback((id: string, clientX: number, clientY: number) => {
    setBalloons(prev => {
      const balloon = prev.find(b => b.id === id);
      if (!balloon || balloon.popped) return prev;

      const isLie = !balloon.equation.isCorrect;

      setGameState(gs => {
        if (gs.status !== 'playing') return gs;

        if (isLie) {
          const now = Date.now();
          const doubleActive = now < gs.powerUps.doubleUntil;
          const comboBonus = gs.combo >= 3 ? gs.combo * 5 : 0;
          let points = 10 + gs.level * 2 + comboBonus;
          if (doubleActive) points *= 2;
          const newCombo = gs.combo + 1;
          const newScore = gs.score + points;
          const newLevel = Math.floor(newScore / 100) + 1;
          const newHighScore = Math.max(newScore, gs.highScore);

          if (newHighScore > gs.highScore) {
            localStorage.setItem('popTheLie_highScore', String(newHighScore));
            const adapter = platformManager.getAdapter();
            void adapter.saveData({ version: 1, highScore: newHighScore, lastSavedAt: Date.now() });
            void adapter.sendScore(newHighScore);
          }

          playPopCorrect();
          hapticPop();
          if (newCombo >= 3) playCombo();

          setFloatingScores(fs => [...fs, {
            id: `fs-${Date.now()}`,
            x: clientX,
            y: clientY,
            text: `+${points}${doubleActive ? ' ✨' : ''}${gs.combo >= 2 ? ` 🔥x${newCombo}` : ''}`,
            type: 'good'
          }]);

          let next: GameState = {
            ...gs,
            score: newScore,
            combo: newCombo,
            bestCombo: Math.max(newCombo, gs.bestCombo),
            level: newLevel,
            balloonsPopped: gs.balloonsPopped + 1,
            highScore: newHighScore,
          };

          if (balloon.powerUp) {
            next = applyPowerUp(balloon.powerUp, next, clientX, clientY);
          }
          return next;
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

          setLifeLostAt(Date.now());
          if (newLives <= 0) {
            handleGameOver(gs.score, gs.highScore);
            return { ...gs, lives: 0, combo: 0, status: 'gameover' };
          }
          return { ...gs, lives: newLives, combo: 0 };
        }
      });

      return prev.map(b => b.id === id ? { ...b, popped: true, popResult: isLie ? 'correct' : 'wrong' } : b);
    });
  }, [applyPowerUp, handleGameOver]);

  // Handle missed lies (paused while freeze is active)
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    const interval = setInterval(() => {
      const frozen = Date.now() < gameState.powerUps.freezeUntil;
      if (frozen) return;
      setBalloons(prev => {
        const now = Date.now();
        const escaped = prev.filter(b => !b.popped && !b.equation.isCorrect && (now - b.createdAt) > b.speed * 1000);

        if (escaped.length > 0) {
          setGameState(gs => {
            if (gs.status !== 'playing') return gs;
            const newLives = gs.lives - escaped.length;
            setLifeLostAt(Date.now());
            if (newLives <= 0) {
              handleGameOver(gs.score, gs.highScore);
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
  }, [gameState.status, gameState.powerUps.freezeUntil, gameState.score, gameState.highScore, handleGameOver]);

  // Spawn balloons (recursive timeout so we can pause during freeze)
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
      return;
    }

    const config = DIFFICULTY_CONFIGS[gameState.difficulty];
    const baseRate = Math.max(800, config.spawnRateBase - gameState.level * config.spawnRateScaling);

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const frozen = Date.now() < gameState.powerUps.freezeUntil;
      if (!frozen) spawnBalloon(gameState.level, gameState.difficulty);
      spawnTimeoutRef.current = window.setTimeout(tick, baseRate);
    };
    spawnBalloon(gameState.level, gameState.difficulty);
    spawnTimeoutRef.current = window.setTimeout(tick, baseRate);

    return () => {
      cancelled = true;
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
    };
  }, [gameState.status, gameState.level, gameState.difficulty, gameState.powerUps.freezeUntil, spawnBalloon]);

  // Clean floating scores
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingScores(prev => prev.filter(fs => Date.now() - parseInt(fs.id.split('-')[1]) < 1200));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return {
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
    hydrateHighScore,
    triggerRewardedRevive,
  };
}
