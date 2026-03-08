// Web Audio API sound effects & haptic feedback manager

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playPopCorrect() {
  // Happy ascending chime
  playTone(600, 0.1, 'sine', 0.25);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.2), 50);
  setTimeout(() => playTone(1000, 0.15, 'sine', 0.15), 100);
}

export function playPopWrong() {
  // Buzzer sound
  playTone(200, 0.3, 'sawtooth', 0.2);
  setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.15), 100);
}

export function playCombo() {
  // Sparkly combo sound
  playTone(800, 0.08, 'sine', 0.15);
  setTimeout(() => playTone(1000, 0.08, 'sine', 0.15), 60);
  setTimeout(() => playTone(1200, 0.08, 'sine', 0.15), 120);
  setTimeout(() => playTone(1400, 0.12, 'sine', 0.2), 180);
}

export function playGameOver() {
  // Descending sad tones
  playTone(400, 0.2, 'sine', 0.25);
  setTimeout(() => playTone(300, 0.2, 'sine', 0.2), 200);
  setTimeout(() => playTone(200, 0.4, 'sine', 0.15), 400);
}

export function playButtonClick() {
  playTone(500, 0.05, 'sine', 0.15);
}

// Haptic feedback
export function hapticPop() {
  if ('vibrate' in navigator) {
    navigator.vibrate(30);
  }
}

export function hapticWrong() {
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
}

export function hapticGameOver() {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100, 50, 200]);
  }
}
