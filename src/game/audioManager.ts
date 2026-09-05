// Web Audio API sound effects & haptic feedback manager

let audioCtx: AudioContext | null = null;
let systemAudioEnabled = true;
export function setSystemAudioEnabled(enabled: boolean) {
  systemAudioEnabled = enabled;
}


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
  if (!systemAudioEnabled) return;
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

export function playPowerUp() {
  // Magical power-up shimmer
  playTone(700, 0.08, 'triangle', 0.2);
  setTimeout(() => playTone(900, 0.08, 'triangle', 0.2), 60);
  setTimeout(() => playTone(1200, 0.12, 'triangle', 0.22), 120);
  setTimeout(() => playTone(1600, 0.18, 'sine', 0.18), 200);
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

// ─── Background Music ───
let musicGain: GainNode | null = null;
let musicPlaying = false;
let musicOscillators: OscillatorNode[] = [];
let musicInterval: number | null = null;
let musicMuted = localStorage.getItem('popTheLie_musicMuted') === 'true';

const MELODY_NOTES = [
  [392, 523], [440, 554], [494, 587], [523, 659],
  [494, 587], [440, 554], [392, 523], [349, 494],
  [330, 440], [349, 494], [392, 523], [440, 554],
  [494, 587], [523, 659], [587, 698], [523, 659],
];

export function startBackgroundMusic() {
  if (musicPlaying) return;
  musicPlaying = true;

  try {
    const ctx = getAudioContext();
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(musicMuted ? 0 : 0.06, ctx.currentTime);
    musicGain.connect(ctx.destination);

    let noteIndex = 0;
    const playNote = () => {
      if (!musicPlaying || !musicGain) return;
      const ctx2 = getAudioContext();
      const [f1, f2] = MELODY_NOTES[noteIndex % MELODY_NOTES.length];

      const osc1 = ctx2.createOscillator();
      const osc2 = ctx2.createOscillator();
      const noteGain = ctx2.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(f1, ctx2.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(f2, ctx2.currentTime);

      noteGain.gain.setValueAtTime(0.5, ctx2.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.45);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(musicGain!);

      osc1.start();
      osc2.start();
      osc1.stop(ctx2.currentTime + 0.5);
      osc2.stop(ctx2.currentTime + 0.5);

      noteIndex++;
    };

    playNote();
    musicInterval = window.setInterval(playNote, 500);
  } catch {
    // Audio not available
  }
}

export function stopBackgroundMusic() {
  musicPlaying = false;
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  musicOscillators.forEach(o => { try { o.stop(); } catch {} });
  musicOscillators = [];
  musicGain = null;
}

export function toggleMusicMute(): boolean {
  musicMuted = !musicMuted;
  localStorage.setItem('popTheLie_musicMuted', String(musicMuted));
  if (musicGain) {
    const ctx = getAudioContext();
    musicGain.gain.setValueAtTime(musicMuted ? 0 : 0.06, ctx.currentTime);
  }
  return musicMuted;
}

export function isMusicMuted(): boolean {
  return musicMuted;
}
