import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    JioGamesSDK?: {
      postScore(score: number): void;
      cacheAd(type: string): void;
      showAd(type: string, callbacks: { onAdClosed?: () => void; onAdError?: () => void }): void;
    };
  }
}

export class JioGamesAdapter implements IPlatformAdapter {
  readonly id = 'jiogames' as const;
  readonly name = 'JioGames';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: false,
    hasLeaderboards: true,
    hasAudioSync: false,
    hasLanguageDetection: false,
    hasShare: false,
  };

  private get sdk() {
    return typeof window !== 'undefined' ? window.JioGamesSDK : undefined;
  }

  async init(): Promise<void> {
    try {
      this.sdk?.cacheAd('interstitial');
      this.sdk?.cacheAd('rewarded');
    } catch (err) {
      this.logWarning(err);
    }
  }

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
    const raw = localStorage.getItem('popTheLie_jio_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_jio_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(score: number): Promise<void> {
    try {
      this.sdk?.postScore(Math.floor(score));
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (!this.sdk?.showAd) return;
    return new Promise<void>((resolve) => {
      this.sdk!.showAd('interstitial', {
        onAdClosed: () => resolve(),
        onAdError: () => resolve(),
      });
    });
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    if (!this.sdk?.showAd) return true;
    return new Promise<boolean>((resolve) => {
      this.sdk!.showAd('rewarded', {
        onAdClosed: () => resolve(true),
        onAdError: () => resolve(false),
      });
    });
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[JioGames Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[JioGames Warning]', warning);
  }
}
