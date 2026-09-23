import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        init(): Promise<void>;
        ad: {
          requestAd(type: 'midgame' | 'rewarded', callbacks: {
            adStarted?: () => void;
            adFinished?: () => void;
            adError?: (error: unknown) => void;
          }): void;
        };
        game: {
          gameplayStart(): void;
          gameplayStop(): void;
          happytime(): void;
        };
        data: {
          setItem(key: string, value: string): void;
          getItem(key: string): string | null;
        };
      };
    };
  }
}

export class CrazyGamesAdapter implements IPlatformAdapter {
  readonly id = 'crazygames' as const;
  readonly name = 'CrazyGames';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: false,
    hasAudioSync: false,
    hasLanguageDetection: false,
    hasShare: false,
  };

  private get sdk() {
    return typeof window !== 'undefined' ? window.CrazyGames?.SDK : undefined;
  }

  async init(): Promise<void> {
    if (this.sdk?.init) {
      try {
        await this.sdk.init();
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  firstFrameReady(): void {}

  gameReady(): void {}

  gameplayStart(): void {
    try {
      this.sdk?.game?.gameplayStart();
    } catch {
      /* ignore */
    }
  }

  gameplayStop(): void {
    try {
      this.sdk?.game?.gameplayStop();
    } catch {
      /* ignore */
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
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };

    if (this.sdk?.data?.getItem) {
      try {
        const raw = this.sdk.data.getItem('popTheLie_cg_save');
        if (raw) return JSON.parse(raw);
      } catch {
        /* fallback */
      }
    }
    const local = localStorage.getItem('popTheLie_cg_save');
    return local ? JSON.parse(local) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    const serialized = JSON.stringify(data);
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
    localStorage.setItem('popTheLie_cg_save', serialized);
    if (this.sdk?.data?.setItem) {
      try {
        this.sdk.data.setItem('popTheLie_cg_save', serialized);
      } catch {
        /* ignore */
      }
    }
  }

  async sendScore(_score: number): Promise<void> {
    try {
      this.sdk?.game?.happytime();
    } catch {
      /* ignore */
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (!this.sdk?.ad?.requestAd) return;
    return new Promise<void>((resolve) => {
      this.gameplayStop();
      this.sdk!.ad.requestAd('midgame', {
        adStarted: () => {},
        adFinished: () => {
          this.gameplayStart();
          resolve();
        },
        adError: () => {
          this.gameplayStart();
          resolve();
        },
      });
    });
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    if (!this.sdk?.ad?.requestAd) return true;
    return new Promise<boolean>((resolve) => {
      this.gameplayStop();
      this.sdk!.ad.requestAd('rewarded', {
        adStarted: () => {},
        adFinished: () => {
          this.gameplayStart();
          resolve(true);
        },
        adError: () => {
          this.gameplayStart();
          resolve(false);
        },
      });
    });
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[CrazyGames Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[CrazyGames Warning]', warning);
  }
}
