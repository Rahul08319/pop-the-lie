import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    ID?: {
      init(options: Record<string, unknown>): void;
      GameBreak(callback: () => void): void;
      submit_score(options: { score: number; table?: string }): void;
    };
  }
}

export class Y8Adapter implements IPlatformAdapter {
  readonly id = 'y8' as const;
  readonly name = 'Y8 Games';

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
    return typeof window !== 'undefined' ? window.ID : undefined;
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
    const raw = localStorage.getItem('popTheLie_y8_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_y8_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(score: number): Promise<void> {
    try {
      this.sdk?.submit_score({ score: Math.floor(score) });
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (!this.sdk?.GameBreak) return;
    return new Promise<void>((resolve) => {
      this.sdk!.GameBreak(() => resolve());
    });
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    return true;
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[Y8 Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[Y8 Warning]', warning);
  }
}
