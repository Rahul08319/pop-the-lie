import { MathEquation } from './types';

type Op = '+' | '-' | '×' | '÷';
type Rand = () => number;

const defaultRand: Rand = Math.random;

function randInt(min: number, max: number, rand: Rand = defaultRand) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function generateEquation(level: number, lieChance: number = 0.45, rand: Rand = defaultRand): MathEquation {
  const isCorrect = rand() > lieChance;
  const maxNum = Math.min(5 + level * 3, 50);
  const ops: Op[] = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[randInt(0, ops.length - 1, rand)];

  let a: number, b: number, correctAnswer: number;

  switch (op) {
    case '+':
      a = randInt(1, maxNum, rand);
      b = randInt(1, maxNum, rand);
      correctAnswer = a + b;
      break;
    case '-':
      a = randInt(1, maxNum, rand);
      b = randInt(1, a, rand);
      correctAnswer = a - b;
      break;
    case '×':
      a = randInt(1, Math.min(maxNum, 12), rand);
      b = randInt(1, Math.min(maxNum, 12), rand);
      correctAnswer = a * b;
      break;
    case '÷':
      b = randInt(1, Math.min(maxNum, 12), rand);
      correctAnswer = randInt(1, Math.min(maxNum, 12), rand);
      a = b * correctAnswer;
      break;
    default:
      a = 1; b = 1; correctAnswer = 2;
  }

  if (isCorrect) {
    return { display: `${a} ${op} ${b} = ${correctAnswer}`, isCorrect: true };
  } else {
    let wrongAnswer: number;
    do {
      const offset = randInt(1, Math.max(3, Math.floor(correctAnswer * 0.3)), rand);
      wrongAnswer = rand() > 0.5 ? correctAnswer + offset : correctAnswer - offset;
    } while (wrongAnswer === correctAnswer);
    return { display: `${a} ${op} ${b} = ${wrongAnswer}`, isCorrect: false };
  }
}

export { generateEquation };
