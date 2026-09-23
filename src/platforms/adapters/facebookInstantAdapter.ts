import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    FBInstant?: {
      initializeAsync(): Promise<void>;
      startGameAsync(): Promise<void>;
      setLoadingProgress(percentage: number): void;
      getLocale(): string;
      player: {
        getID(): string;
        getName(): string;
        getDataAsync(keys: string[]): Promise<Record<string, unknown>>;
        setDataAsync(data: Record<string, unknown>): Promise<void>;
      };
      getInterstitialAdAsync(placementId: string): Promise<{
        loadAsync(): Promise<void>;
        showAsync(): Promise<void>;
      }>;
      getRewardedVideoAsync(placementId: string): Promise<{
        loadAsync(): Promise<void>;
        showAsync(): Promise<void>;
      }>;
      postSessionScoreAsync(score: number): Promise<void>;
      onPause(callback: () => void): void;
    };
  }
}

export class FacebookInstantAdapter implements IPlatformAdapter {
  readonly id = 'facebook' as const;
  readonly name = 'Facebook Instant Games';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: true,
    hasAudioSync: false,
    hasLanguageDetection: true,
    hasShare: true,
  };

  private get sdk() {
    return typeof window !== 'undefined' ? window.FBInstant : undefined;
  }

  async init(): Promise<void> {
    if (this.sdk) {
      try {
        await this.sdk.initializeAsync();
        this.sdk.setLoadingProgress(100);
      } catch (err) {
        this.logError(err);
      }
    }
  }

  firstFrameReady(): void {
    // FBInstant does not require firstFrameReady explicitly
  }

  gameReady(): void {
    if (this.sdk) {
      this.sdk.startGameAsync().catch(err => this.logError(err));
    }
  }

  onPause(callback: () => void): () => void {
    if (this.sdk?.onPause) {
      this.sdk.onPause(callback);
    }
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
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };

    if (this.sdk?.player) {
      try {
        const data = await this.sdk.player.getDataAsync(['saveData']);
        if (data?.saveData) {
          return data.saveData as GameSaveData;
        }
      } catch (err) {
        this.logWarning(err);
      }
    }
    return fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
    if (this.sdk?.player) {
      try {
        await this.sdk.player.setDataAsync({ saveData: data });
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  async sendScore(score: number): Promise<void> {
    if (this.sdk?.postSessionScoreAsync) {
      try {
        await this.sdk.postSessionScoreAsync(Math.floor(score));
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (this.sdk?.getInterstitialAdAsync) {
      try {
        const ad = await this.sdk.getInterstitialAdAsync('interstitial_ad_id');
        await ad.loadAsync();
        await ad.showAsync();
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    if (this.sdk?.getRewardedVideoAsync) {
      try {
        const ad = await this.sdk.getRewardedVideoAsync('rewarded_ad_id');
        await ad.loadAsync();
        await ad.showAsync();
        return true;
      } catch (err) {
        this.logWarning(err);
        return false;
      }
    }
    return true;
  }

  async getLanguage(): Promise<string> {
    if (this.sdk?.getLocale) {
      return this.sdk.getLocale();
    }
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[FBInstant Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[FBInstant Warning]', warning);
  }
}
