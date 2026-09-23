import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    gdsdk?: {
      showAd(type?: 'rewarded'): Promise<void>;
      preloadAd(type?: 'rewarded'): Promise<void>;
    };
    GD_OPTIONS?: Record<string, unknown>;
  }
}

export class GameDistributionAdapter implements IPlatformAdapter {
  readonly id = 'gamedistribution' as const;
  readonly name = 'GameDistribution';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: false,
    hasLeaderboards: false,
    hasAudioSync: false,
    hasLanguageDetection: false,
    hasShare: false,
  };

  private get sdk() {
    return typeof window !== 'undefined' ? window.gdsdk : undefined;
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
    const raw = localStorage.getItem('popTheLie_gd_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_gd_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(_score: number): Promise<void> {}

  async showInterstitialAd(): Promise<void> {
    try {
      if (this.sdk?.showAd) {
        await this.sdk.showAd();
      }
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    try {
      if (this.sdk?.showAd) {
        await this.sdk.showAd('rewarded');
        return true;
      }
      return true;
    } catch (err) {
      this.logWarning(err);
      return false;
    }
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[GameDistribution Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[GameDistribution Warning]', warning);
  }
}
