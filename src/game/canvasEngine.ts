import { Difficulty, DIFFICULTY_CONFIGS, GameMode, PowerUpType, BALLOON_COLORS } from './types';
import { generateEquation } from './mathGenerator';
import {
  playPopCorrect,
  playPopWrong,
  playCombo,
  playGameOver,
  playButtonClick,
  playPowerUp,
  hapticPop,
  hapticWrong,
  hapticGameOver,
  startBackgroundMusic,
  stopBackgroundMusic,
} from './audioManager';
import { platformManager } from '@/platforms/platformManager';

export interface CanvasBalloon {
  id: string;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  color: string;
  equation: { display: string; isCorrect: boolean };
  powerUp?: PowerUpType;
  wobblePhase: number;
  wobbleSpeed: number;
  swayAmp: number;
  swayFreq: number;
  baseX: number;
  popped: boolean;
  popResult?: 'correct' | 'wrong';
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
  createdAt: number;
}

export interface SlicePoint {
  x: number;
  y: number;
  time: number;
}

const BALLOON_COLOR_PALETTES: Record<string, { fillTop: string; fillMid: string; fillBot: string; glow: string; text: string }> = {
  'balloon-red': { fillTop: '#ff4d4d', fillMid: '#e60000', fillBot: '#990000', glow: 'rgba(255, 59, 48, 0.6)', text: '#ffffff' },
  'balloon-blue': { fillTop: '#4da6ff', fillMid: '#0066cc', fillBot: '#003366', glow: 'rgba(0, 122, 255, 0.6)', text: '#ffffff' },
  'balloon-green': { fillTop: '#5cd65c', fillMid: '#2eb82e', fillBot: '#1f7a1f', glow: 'rgba(52, 199, 89, 0.6)', text: '#ffffff' },
  'balloon-yellow': { fillTop: '#ffe680', fillMid: '#ffcc00', fillBot: '#cc9900', glow: 'rgba(255, 204, 0, 0.6)', text: '#111827' },
  'balloon-purple': { fillTop: '#d180ff', fillMid: '#9900cc', fillBot: '#660088', glow: 'rgba(175, 82, 222, 0.6)', text: '#ffffff' },
  'balloon-orange': { fillTop: '#ffa64d', fillMid: '#ff6600', fillBot: '#cc5200', glow: 'rgba(255, 149, 0, 0.6)', text: '#ffffff' },
};

export class GameEngine2D {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  // Game Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Game Entities
  private balloons: CanvasBalloon[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private scorePopups: ScorePopup[] = [];
  private stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
  private sliceTrail: SlicePoint[] = [];

  // Screen shake
  private screenShakeIntensity: number = 0;

  // Spawning
  private spawnTimer: number = 0;
  private balloonCounter: number = 0;

  // State
  public score: number = 0;
  public lives: number = 3;
  public maxLives: number = 3;
  public level: number = 1;
  public combo: number = 0;
  public bestCombo: number = 0;
  public balloonsPopped: number = 0;
  public highScore: number = 0;
  public difficulty: Difficulty = 'medium';
  public mode: GameMode = 'classic';
  public state: 'MENU' | 'PLAYING' | 'GAMEOVER' = 'MENU';
  public canRevive: boolean = true;

  // Power ups
  public freezeUntil: number = 0;
  public doubleUntil: number = 0;

  // Callbacks
  public onStateChange?: (state: 'MENU' | 'PLAYING' | 'GAMEOVER') => void;
  public onScoreUpdate?: (score: number, highScore: number, level: number, combo: number) => void;
  public onLivesUpdate?: (lives: number) => void;
  public onGameOver?: (finalScore: number, isNewHigh: boolean) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.highScore = parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0;
    this.initStars();
    this.resize();
    this.bindEvents();

    // Signal firstFrameReady to platform SDK
    platformManager.getAdapter().firstFrameReady();
  }

  private initStars() {
    this.stars = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.8 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.6,
      });
    }
  }

  public resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private bindEvents() {
    let isPointerDown = false;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      isPointerDown = true;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.sliceTrail = [{ x, y, time: Date.now() }];
      this.checkPopAt(x, y);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.sliceTrail.push({ x, y, time: Date.now() });
      if (this.sliceTrail.length > 15) this.sliceTrail.shift();
      this.checkPopAt(x, y);
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      isPointerDown = false;
      this.sliceTrail = [];
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('resize', () => this.resize());
  }

  private checkPopAt(x: number, y: number) {
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (b.popped) continue;

      // Distance from balloon center
      const dx = (x - b.x) / b.radiusX;
      const dy = (y - b.y) / b.radiusY;
      if (dx * dx + dy * dy <= 1.25) {
        this.popBalloon(b);
        break; // pop one per frame slice
      }
    }
  }

  public start(difficulty: Difficulty = 'medium', mode: GameMode = 'classic') {
    this.difficulty = difficulty;
    this.mode = mode;
    this.maxLives = DIFFICULTY_CONFIGS[difficulty].lives;
    this.lives = this.maxLives;
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.bestCombo = 0;
    this.balloonsPopped = 0;
    this.canRevive = true;
    this.freezeUntil = 0;
    this.doubleUntil = 0;
    this.balloons = [];
    this.particles = [];
    this.shockwaves = [];
    this.scorePopups = [];
    this.spawnTimer = 0;
    this.balloonCounter = 0;
    this.state = 'PLAYING';

    startBackgroundMusic();
    platformManager.getAdapter().gameplayStart?.();
    this.onStateChange?.('PLAYING');
    this.onScoreUpdate?.(this.score, this.highScore, this.level, this.combo);
    this.onLivesUpdate?.(this.lives);
  }

  public pause() {
    this.isPaused = true;
    platformManager.getAdapter().gameplayStop?.();
  }

  public resume() {
    this.isPaused = false;
    platformManager.getAdapter().gameplayStart?.();
  }

  public quitToMenu() {
    this.state = 'MENU';
    this.balloons = [];
    this.particles = [];
    this.shockwaves = [];
    this.scorePopups = [];
    stopBackgroundMusic();
    platformManager.getAdapter().gameplayStop?.();
    this.onStateChange?.('MENU');
  }

  public async triggerRewardedRevive(): Promise<boolean> {
    if (!this.canRevive) return false;
    const adapter = platformManager.getAdapter();
    const success = await adapter.showRewardedAd('revive-life');
    if (success) {
      this.canRevive = false;
      this.lives = 1;
      this.state = 'PLAYING';
      this.onLivesUpdate?.(this.lives);
      this.onStateChange?.('PLAYING');
      startBackgroundMusic();
      adapter.gameplayStart?.();
      return true;
    }
    return false;
  }

  public popBalloon(b: CanvasBalloon) {
    if (b.popped) return;
    b.popped = true;

    const isLie = !b.equation.isCorrect;
    b.popResult = isLie ? 'correct' : 'wrong';

    // Particle explosion
    this.createPopParticles(b.x, b.y, b.color, isLie);
    this.shockwaves.push({
      x: b.x,
      y: b.y,
      radius: b.radiusX * 0.5,
      maxRadius: b.radiusX * 2.2,
      alpha: 0.9,
      color: isLie ? '#34d399' : '#f87171',
    });

    if (this.state === 'MENU') {
      // Menu interactive popping
      if (isLie) {
        playPopCorrect(1);
        this.addScorePopup(b.x, b.y, '💥 POP!', '#34d399');
      } else {
        playPopWrong();
        this.addScorePopup(b.x, b.y, '❌ TRUE!', '#f87171');
      }
      return;
    }

    if (isLie) {
      // Correct: popped a false statement!
      const isDouble = Date.now() < this.doubleUntil;
      const comboBonus = this.combo >= 2 ? this.combo * 5 : 0;
      let points = 10 + this.level * 2 + comboBonus;
      if (isDouble) points *= 2;

      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += points;
      this.level = Math.floor(this.score / 100) + 1;
      this.balloonsPopped++;

      playPopCorrect(this.combo);
      hapticPop();
      if (this.combo >= 3) playCombo();

      let popupText = `+${points}`;
      if (isDouble) popupText += ' ✨2X';
      if (this.combo >= 2) popupText += ` 🔥x${this.combo}`;
      this.addScorePopup(b.x, b.y, popupText, isDouble ? '#fbbf24' : '#34d399');

      // Check high score
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('popTheLie_highScore', String(this.highScore));
        const adapter = platformManager.getAdapter();
        void adapter.saveData({ version: 1, highScore: this.highScore, lastSavedAt: Date.now() });
        void adapter.sendScore(this.highScore);
      }

      // Handle power-up
      if (b.powerUp) {
        this.applyPowerUp(b.powerUp, b.x, b.y);
      }

      this.onScoreUpdate?.(this.score, this.highScore, this.level, this.combo);
    } else {
      // Wrong: popped a truth!
      this.combo = 0;
      this.lives--;
      this.screenShakeIntensity = 15;
      playPopWrong();
      hapticWrong();
      this.addScorePopup(b.x, b.y, '❌ WRONG!', '#f87171');
      this.onLivesUpdate?.(this.lives);

      if (this.lives <= 0) {
        this.handleGameOver();
      }
    }
  }

  private applyPowerUp(type: PowerUpType, x: number, y: number) {
    const now = Date.now();
    playPowerUp();
    if (type === 'freeze') {
      this.freezeUntil = now + 3500;
      this.addScorePopup(x, y - 30, '❄️ TIME FROZEN!', '#60a5fa');
    } else if (type === 'double') {
      this.doubleUntil = now + 8000;
      this.addScorePopup(x, y - 30, '✨ DOUBLE POINTS!', '#fbbf24');
    } else if (type === 'life') {
      this.lives = Math.min(this.maxLives, this.lives + 1);
      this.onLivesUpdate?.(this.lives);
      this.addScorePopup(x, y - 30, '❤️ +1 LIFE!', '#f43f5e');
    }
  }

  private handleGameOver() {
    this.state = 'GAMEOVER';
    stopBackgroundMusic();
    playGameOver();
    hapticGameOver();

    const adapter = platformManager.getAdapter();
    adapter.gameplayStop?.();
    // Monetization is intentionally disabled for this YouTube Playables build.
    void adapter.sendScore(this.score);
    void adapter.saveData({ version: 1, highScore: this.highScore, lastSavedAt: Date.now() });

    const isNewHigh = this.score >= this.highScore && this.score > 0;
    this.onGameOver?.(this.score, isNewHigh);
    this.onStateChange?.('GAMEOVER');
  }

  private createPopParticles(x: number, y: number, colorKey: string, isCorrect: boolean) {
    const palette = BALLOON_COLOR_PALETTES[colorKey] || BALLOON_COLOR_PALETTES['balloon-blue'];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 150 + Math.random() * 350;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: i % 2 === 0 ? palette.fillTop : palette.fillMid,
        alpha: 1,
        decay: 1.5 + Math.random() * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 12,
      });
    }

    // Sparkle star fragments
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color: '#ffffff',
        alpha: 1,
        decay: 2.2,
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  private addScorePopup(x: number, y: number, text: string, color: string) {
    this.scorePopups.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -90,
      scale: 0.8,
      createdAt: Date.now(),
    });
  }

  private spawnBalloon(isMenu: boolean = false) {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const id = `b-${++this.balloonCounter}`;
    const levelToUse = isMenu ? 1 : this.level;
    const equation = generateEquation(levelToUse, config.lieChance);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

    const radius = Math.min(this.width * 0.11, 46);
    const minX = radius + 20;
    const maxX = this.width - radius - 20;
    const baseX = minX + Math.random() * (maxX - minX);

    // Speed calculation
    const baseSpeed = isMenu ? 70 : 110 + this.level * 8;
    const speed = baseSpeed * (0.85 + Math.random() * 0.3);

    // Power-up chance
    let powerUp: PowerUpType | undefined;
    if (!isMenu && Math.random() < 0.12) {
      const r = Math.random();
      if (r < 0.4) powerUp = 'freeze';
      else if (r < 0.75) powerUp = 'life';
      else powerUp = 'double';
    }

    this.balloons.push({
      id,
      x: baseX,
      y: this.height + radius * 1.5,
      radiusX: radius,
      radiusY: radius * 1.22,
      speed,
      color,
      equation,
      powerUp,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 2,
      swayAmp: 15 + Math.random() * 25,
      swayFreq: 1 + Math.random() * 1.5,
      baseX,
      popped: false,
      createdAt: Date.now(),
    });
  }

  public run() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  public getStateSnapshot() {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      combo: this.combo,
      status: this.state,
      balloons: this.balloons.map(balloon => ({ id: balloon.id, x: Math.round(balloon.x), y: Math.round(balloon.y), equation: balloon.equation.display, isLie: !balloon.equation.isCorrect, powerUp: balloon.powerUp })),
    };
  }

  public advanceTime(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let index = 0; index < steps; index += 1) this.update(1 / 60);
    this.render();
  }

  private update(dt: number) {
    const now = Date.now();
    const isFrozen = now < this.freezeUntil;

    // Decay screen shake
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity -= dt * 35;
      if (this.screenShakeIntensity < 0) this.screenShakeIntensity = 0;
    }

    // Clean slice trail
    const trailCutoff = now - 180;
    this.sliceTrail = this.sliceTrail.filter(pt => pt.time > trailCutoff);

    // Spawning logic
    if (this.state === 'PLAYING') {
      if (!isFrozen) {
        this.spawnTimer += dt;
        const config = DIFFICULTY_CONFIGS[this.difficulty];
        const spawnInterval = Math.max(0.65, (config.spawnRateBase - this.level * 40) / 1000);
        if (this.spawnTimer >= spawnInterval) {
          this.spawnTimer = 0;
          this.spawnBalloon(false);
        }
      }
    } else if (this.state === 'MENU') {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 1.6 && this.balloons.filter(b => !b.popped).length < 5) {
        this.spawnTimer = 0;
        this.spawnBalloon(true);
      }
    }

    // Update balloons
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (b.popped) {
        this.balloons.splice(i, 1);
        continue;
      }

      if (!isFrozen) {
        b.y -= b.speed * dt;
        b.wobblePhase += b.wobbleSpeed * dt;
        b.x = b.baseX + Math.sin(b.wobblePhase * b.swayFreq) * b.swayAmp;
      }

      // Check if escaped top
      if (b.y < -b.radiusY * 2) {
        this.balloons.splice(i, 1);
        // If an unpopped false equation escapes -> player missed a lie!
        if (this.state === 'PLAYING' && !b.equation.isCorrect) {
          this.lives--;
          this.combo = 0;
          this.screenShakeIntensity = 12;
          playPopWrong();
          hapticWrong();
          this.addScorePopup(b.x, 50, '❌ MISSED LIE!', '#f87171');
          this.onLivesUpdate?.(this.lives);

          if (this.lives <= 0) {
            this.handleGameOver();
          }
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt; // gravity
      p.rotation += p.rotationSpeed * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * (dt * 12);
      sw.alpha -= dt * 2.5;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      sp.y += sp.vy * dt;
      sp.scale = Math.min(1.2, sp.scale + dt * 1.5);
      sp.alpha -= dt * 1.2;
      if (sp.alpha <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake offset
    if (this.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#070a13');
    skyGrad.addColorStop(0.5, '#0d1424');
    skyGrad.addColorStop(1, '#05080e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Stars
    for (const star of this.stars) {
      const sx = star.x * this.width;
      const sy = star.y * this.height;
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Balloons
    const now = Date.now();
    const isFrozen = now < this.freezeUntil;
    for (const b of this.balloons) {
      this.drawBalloon(ctx, b, isFrozen);
    }

    // 4. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 5. Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    // 6. Slice Blade Trail
    if (this.sliceTrail.length >= 2) {
      ctx.save();
      for (let i = 1; i < this.sliceTrail.length; i++) {
        const p1 = this.sliceTrail[i - 1];
        const p2 = this.sliceTrail[i];
        const progress = i / this.sliceTrail.length;

        ctx.strokeStyle = `rgba(52, 211, 153, ${progress * 0.9})`;
        ctx.lineWidth = progress * 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Inner bright core
        ctx.strokeStyle = `rgba(255, 255, 255, ${progress})`;
        ctx.lineWidth = progress * 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. Floating Score Popups
    for (const sp of this.scorePopups) {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.font = `900 ${Math.floor(22 * sp.scale)}px "Fredoka One", cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(sp.text, sp.x + 2, sp.y + 2); // shadow
      ctx.fillStyle = sp.color;
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.restore();
    }

    // 8. Frozen Screen Vignette
    if (isFrozen) {
      const frostGrad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.width * 0.25,
        this.width / 2, this.height / 2, this.width * 0.8
      );
      frostGrad.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      frostGrad.addColorStop(1, 'rgba(96, 165, 250, 0.25)');
      ctx.fillStyle = frostGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  private drawBalloon(ctx: CanvasRenderingContext2D, b: CanvasBalloon, isFrozen: boolean) {
    const palette = BALLOON_COLOR_PALETTES[b.color] || BALLOON_COLOR_PALETTES['balloon-blue'];
    ctx.save();
    ctx.translate(b.x, b.y);

    // 1. Trailing Physics String
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, b.radiusY);
    const stringWobble = Math.sin(b.wobblePhase * 2) * 8;
    ctx.quadraticCurveTo(stringWobble, b.radiusY + 18, stringWobble * 0.5, b.radiusY + 36);
    ctx.stroke();

    // 2. Power-up Aura
    if (b.powerUp) {
      ctx.shadowColor = b.powerUp === 'freeze' ? '#60a5fa' : b.powerUp === 'life' ? '#f43f5e' : '#fbbf24';
      ctx.shadowBlur = 24;
    } else {
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = 16;
    }

    // 3. Volumetric Balloon Egg Shape
    ctx.beginPath();
    // Bezier control points for true cartoon balloon pear/egg shape
    const topW = b.radiusX;
    const botW = b.radiusX * 0.7;
    const topH = b.radiusY;
    const botH = b.radiusY;

    ctx.moveTo(0, -topH);
    ctx.bezierCurveTo(topW * 1.05, -topH, topW * 1.05, botH * 0.4, botW, botH);
    ctx.lineTo(-botW, botH);
    ctx.bezierCurveTo(-topW * 1.05, botH * 0.4, -topW * 1.05, -topH, 0, -topH);
    ctx.closePath();

    // Balloon Gradient Fill
    const grad = ctx.createLinearGradient(-b.radiusX * 0.3, -b.radiusY, b.radiusX * 0.3, b.radiusY);
    if (isFrozen) {
      grad.addColorStop(0, '#93c5fd');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, '#1e3a8a');
    } else {
      grad.addColorStop(0, palette.fillTop);
      grad.addColorStop(0.55, palette.fillMid);
      grad.addColorStop(1, palette.fillBot);
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // 4. Specular Glare Arc (Glossy Highlight)
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      -b.radiusX * 0.38,
      -b.radiusY * 0.42,
      b.radiusX * 0.22,
      b.radiusY * 0.4,
      -Math.PI / 6,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
    ctx.restore();

    // 5. Tie Knot
    ctx.fillStyle = isFrozen ? '#1e3a8a' : palette.fillBot;
    ctx.beginPath();
    ctx.moveTo(-5, b.radiusY);
    ctx.lineTo(5, b.radiusY);
    ctx.lineTo(8, b.radiusY + 6);
    ctx.lineTo(-8, b.radiusY + 6);
    ctx.closePath();
    ctx.fill();

    // 6. Math Equation Text
    ctx.font = `900 ${Math.floor(b.radiusX * 0.36)}px "Fredoka One", cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText(b.equation.display, 0, 2);

    // Text Foreground
    ctx.fillStyle = isFrozen ? '#ffffff' : palette.text;
    ctx.fillText(b.equation.display, 0, 0);

    // 7. Power-up Badge Icon
    if (b.powerUp) {
      const icon = b.powerUp === 'freeze' ? '❄️' : b.powerUp === 'life' ? '❤️' : '✨';
      ctx.font = '20px sans-serif';
      ctx.fillText(icon, b.radiusX * 0.65, -b.radiusY * 0.65);
    }

    ctx.restore();
  }
}
