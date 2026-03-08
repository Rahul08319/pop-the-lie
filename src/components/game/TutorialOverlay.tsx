import { useState, useEffect } from 'react';

const TUTORIAL_STEPS = [
  {
    emoji: '🎈',
    title: 'Pop the Lies!',
    description: 'Balloons float up with math equations. Your job is to find the WRONG ones!',
  },
  {
    emoji: '❌',
    title: 'Tap Wrong Equations',
    description: 'See "2 + 3 = 7"? That\'s a lie! Tap it to pop it and earn points.',
  },
  {
    emoji: '✅',
    title: 'Leave the Truth',
    description: 'Don\'t pop correct equations like "4 × 2 = 8" — you\'ll lose a life!',
  },
  {
    emoji: '🔥',
    title: 'Build Combos',
    description: 'Pop lies in a row to build combos and score bonus points!',
  },
];

const STORAGE_KEY = 'popTheLie_tutorialSeen';

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setVisible(false);
      onComplete();
    }
  }, [onComplete]);

  if (!visible) return null;

  const isLast = step === TUTORIAL_STEPS.length - 1;
  const current = TUTORIAL_STEPS[step];

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setVisible(false);
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === step ? 'bg-primary scale-125' : i < step ? 'bg-primary/50' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-6xl animate-scale-in" key={step}>
          {current.emoji}
        </div>
        <h2 className="font-game-title text-2xl text-primary">{current.title}</h2>
        <p className="text-foreground/80 text-sm leading-relaxed">{current.description}</p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={handleSkip}
            className="text-muted-foreground text-xs hover:text-foreground transition-colors px-4 py-2"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="font-game-title bg-gradient-to-r from-primary to-game-score px-8 py-3 rounded-full text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform text-sm"
          >
            {isLast ? '🎮 Let\'s Go!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
