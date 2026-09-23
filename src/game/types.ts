export interface MathEquation {
  display: string;
  isCorrect: boolean;
}

export type PowerUpType = 'freeze' | 'life' | 'double';

export interface Balloon {
  id: string;
  equation: MathEquation;
  x: number;
  color: string;
  speed: number;
  popped: boolean;
  popResult?: 'correct' | 'wrong';
  createdAt: number;
  powerUp?: PowerUpType;
}

export type GameMode = 'classic' | 'daily';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  lives: number;
  spawnRateBase: number;
  spawnRateScaling: number;
  speedBase: number;
  speedScaling: number;
  lieChance: number;
  label: string;
  emoji: string;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    lives: 5,
    spawnRateBase: 3000,
    spawnRateScaling: 100,
    speedBase: 12,
    speedScaling: 0.3,
    lieChance: 0.5,
    label: 'Easy',
    emoji: '🌤️',
    description: 'Slower balloons, more lives',
  },
  medium: {
    lives: 3,
    spawnRateBase: 2500,
    spawnRateScaling: 150,
    speedBase: 10,
    speedScaling: 0.5,
    lieChance: 0.45,
    label: 'Medium',
    emoji: '⚡',
    description: 'Balanced challenge',
  },
  hard: {
    lives: 2,
    spawnRateBase: 1800,
    spawnRateScaling: 200,
    speedBase: 7,
    speedScaling: 0.7,
    lieChance: 0.4,
    label: 'Hard',
    emoji: '🔥',
    description: 'Fast & unforgiving',
  },
};

export interface ActivePowerUps {
  freezeUntil: number;     // timestamp ms; spawner & motion paused while now < this
  doubleUntil: number;     // timestamp ms; score x2 while now < this
}

export interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'gameover';
  score: number;
  lives: number;
  level: number;
  combo: number;
  bestCombo: number;
  highScore: number;
  balloonsPopped: number;
  missedLies: number;
  difficulty: Difficulty;
  mode: GameMode;
  dailySeed: string;
  powerUps: ActivePowerUps;
  startingLives: number;
}

export const BALLOON_COLORS = [
  'balloon-red',
  'balloon-blue',
  'balloon-green',
  'balloon-yellow',
  'balloon-purple',
  'balloon-orange',
] as const;

export interface PlayablesSaveData {
  version: 1;
  highScore: number;
}
