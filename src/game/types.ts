export interface MathEquation {
  display: string;
  isCorrect: boolean;
}

export interface Balloon {
  id: string;
  equation: MathEquation;
  x: number;
  color: string;
  speed: number;
  popped: boolean;
  popResult?: 'correct' | 'wrong';
  createdAt: number;
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
}

export const BALLOON_COLORS = [
  'balloon-red',
  'balloon-blue',
  'balloon-green',
  'balloon-yellow',
  'balloon-purple',
  'balloon-orange',
] as const;
