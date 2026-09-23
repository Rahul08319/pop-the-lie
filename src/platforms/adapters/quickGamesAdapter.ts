import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    qg?: {
      createRewardedVideoAd(options: { adUnitId: string }): {
        load(): Promise<void>;
        show(): Promise<void>;
        onClose(cb: (res: { isEnded: boolean }) => void): void;
        onError(cb: (err: unknown) => void): void;
      };
      createInterstitialAd(options: { adUnitId: string }): {
        load(): Promise<void>;
        show(): Promise<void>;
        onError(cb: (err: unknown) => void): void;
      };
      getStorage(options: { key: string; success?: (res: { data: string }) => void; fail?: () => void }): void;
      setStorage(options: { key: string; data: string; success?: () => void; fail?: () => void }): void;
    };
  }
}

export class QuickGamesAdapter implements IPlatformAdapter {
  readonly id = 'quickgames' as const;
  readonly name = 'Huawei & Xiaomi Quick Games';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: false,
    hasAudioSync: false,
    hasLanguageDetection: true,
    hasShare: false,
  };

  private get sdk() {
    return typeof window !== 'undefined' ? window.qg : undefined;
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
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };

    if (this.sdk?.getStorage) {
      return new Promise<GameSaveData>((resolve) => {
        this.sdk!.getStorage({
          key: 'popTheLie_qg_save',
          success: (res) => {
            try { resolve(JSON.parse(res.data)); }
            catch { resolve(fallback); }
          },
          fail: () => resolve(fallback),
        });
      });
    }

    const raw = localStorage.getItem('popTheLie_qg_save');
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    const serialized = JSON.stringify(data);
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
    localStorage.setItem('popTheLie_qg_save', serialized);
    if (this.sdk?.setStorage) {
      this.sdk.setStorage({ key: 'popTheLie_qg_save', data: serialized });
    }
  }

  async sendScore(_score: number): Promise<void> {}

  async showInterstitialAd(): Promise<void> {
    if (!this.sdk?.createInterstitialAd) return;
    try {
      const ad = this.sdk.createInterstitialAd({ adUnitId: 'qg_interstitial_id' });
      await ad.load();
      await ad.show();
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    if (!this.sdk?.createRewardedVideoAd) return true;
    return new Promise<boolean>((resolve) => {
      try {
        const ad = this.sdk!.createRewardedVideoAd({ adUnitId: 'qg_rewarded_id' });
        ad.onClose((res) => resolve(Boolean(res?.isEnded)));
        ad.onError(() => resolve(false));
        ad.load().then(() => ad.show()).catch(() => resolve(false));
      } catch (err) {
        this.logWarning(err);
        resolve(false);
      }
    });
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[QuickGames Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[QuickGames Warning]', warning);
  }
}
