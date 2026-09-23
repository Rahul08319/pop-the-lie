import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    LaggedAPI?: {
      init(devId: string, pubId: string): void;
      Scores: {
        save(options: { score: number; board: string }, callback?: (response: unknown) => void): void;
      };
      Achievements: {
        save(options: { award: string }, callback?: (response: unknown) => void): void;
      };
      showAd(): void;
    };
  }
}

export class LaggedAdapter implements IPlatformAdapter {
  readonly id = 'lagged' as const;
  readonly name = 'Lagged';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: false,
    hasCloudSave: false,
    hasLeaderboards: true,
    hasAudioSync: false,
    hasLanguageDetection: false,
    hasShare: false,
  };

  private get sdk() {
    return typeof window !== 'undefined' ? window.LaggedAPI : undefined;
  }

  async init(): Promise<void> {}
  firstFrameReady(): void {}
  gameReady(): void {}

  onPause(callback: () => void): () => void {
    const handler = () => { if (document.hidden) callback(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  onResume(callback: () => void): () => void {
    const handler = () => { if (!document.hidden) callback(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  isAudioEnabled(): boolean {
    return true;
  }

  onAudioEnabledChange(_callback: (enabled: boolean) => void): () => void {
    return () => {};
  }

  async loadData(): Promise<GameSaveData> {
    const raw = localStorage.getItem('popTheLie_lagged_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_lagged_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(score: number): Promise<void> {
    try {
      this.sdk?.Scores?.save({ score: Math.floor(score), board: 'high_score' });
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showInterstitialAd(): Promise<void> {
    try {
      this.sdk?.showAd();
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    return true;
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[Lagged Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[Lagged Warning]', warning);
  }
}
