import { MathEquation } from './types';

type Op = '+' | '-' | '×' | '÷';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEquation(level: number): MathEquation {
  const isCorrect = Math.random() > 0.45; // ~45% are lies
  const maxNum = Math.min(5 + level * 3, 50);
  const ops: Op[] = level < 3 ? ['+', '-'] : level < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[randInt(0, ops.length - 1)];

  let a: number, b: number, correctAnswer: number;

  switch (op) {
    case '+':
      a = randInt(1, maxNum);
      b = randInt(1, maxNum);
      correctAnswer = a + b;
      break;
    case '-':
      a = randInt(1, maxNum);
      b = randInt(1, a);
      correctAnswer = a - b;
      break;
    case '×':
      a = randInt(1, Math.min(maxNum, 12));
      b = randInt(1, Math.min(maxNum, 12));
      correctAnswer = a * b;
      break;
    case '÷':
      b = randInt(1, Math.min(maxNum, 12));
      correctAnswer = randInt(1, Math.min(maxNum, 12));
      a = b * correctAnswer;
      break;
    default:
      a = 1; b = 1; correctAnswer = 2;
  }

  if (isCorrect) {
    return { display: `${a} ${op} ${b} = ${correctAnswer}`, isCorrect: true };
  } else {
    // Generate wrong answer (offset by 1-5, never 0)
    let wrongAnswer: number;
    do {
      const offset = randInt(1, Math.max(3, Math.floor(correctAnswer * 0.3)));
      wrongAnswer = Math.random() > 0.5 ? correctAnswer + offset : correctAnswer - offset;
    } while (wrongAnswer === correctAnswer);
    return { display: `${a} ${op} ${b} = ${wrongAnswer}`, isCorrect: false };
  }
}

export { generateEquation };
