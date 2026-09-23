import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    PokiSDK?: {
      init(): Promise<void>;
      gameLoadingStart(): void;
      gameLoadingFinished(): void;
      gameplayStart(): void;
      gameplayStop(): void;
      commercialBreak(): Promise<void>;
      rewardedBreak(): Promise<boolean>;
      happyTime(magnitude: number): void;
      setDebug(debug: boolean): void;
    };
  }
}

export class PokiAdapter implements IPlatformAdapter {
  readonly id = 'poki' as const;
  readonly name = 'Poki';

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
    return typeof window !== 'undefined' ? window.PokiSDK : undefined;
  }

  async init(): Promise<void> {
    if (this.sdk) {
      try {
        await this.sdk.init();
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  firstFrameReady(): void {
    // Handled by loading finished
  }

  gameReady(): void {
    try {
      this.sdk?.gameLoadingFinished();
    } catch (err) {
      this.logWarning(err);
    }
  }

  gameplayStart(): void {
    try {
      this.sdk?.gameplayStart();
    } catch (err) {
      this.logWarning(err);
    }
  }

  gameplayStop(): void {
    try {
      this.sdk?.gameplayStop();
    } catch (err) {
      this.logWarning(err);
    }
  }

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
    const raw = localStorage.getItem('popTheLie_poki_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_poki_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(_score: number): Promise<void> {
    // Poki uses happyTime celebrations
    try {
      this.sdk?.happyTime(0.8);
    } catch {
      /* ignore */
    }
  }

  async showInterstitialAd(): Promise<void> {
    try {
      if (this.sdk?.commercialBreak) {
        this.gameplayStop();
        await this.sdk.commercialBreak();
        this.gameplayStart();
      }
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    try {
      if (this.sdk?.rewardedBreak) {
        this.gameplayStop();
        const success = await this.sdk.rewardedBreak();
        this.gameplayStart();
        return success;
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
    console.error('[Poki Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[Poki Warning]', warning);
  }
}
