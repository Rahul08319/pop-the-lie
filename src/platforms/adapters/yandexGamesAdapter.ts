import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<{
        adv: {
          showFullscreenAdv(options: {
            callbacks: {
              onClose?: (wasShown: boolean) => void;
              onError?: (error: unknown) => void;
            };
          }): void;
          showRewardedVideo(options: {
            callbacks: {
              onOpen?: () => void;
              onRewarded?: () => void;
              onClose?: () => void;
              onError?: (error: unknown) => void;
            };
          }): void;
        };
        getPlayer(options?: { scopes?: boolean }): Promise<{
          getData(keys?: string[]): Promise<Record<string, unknown>>;
          setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
          getStats(keys?: string[]): Promise<Record<string, number>>;
          setStats(stats: Record<string, number>): Promise<void>;
        }>;
        getLeaderboards(): Promise<{
          setLeaderboardScore(name: string, score: number): Promise<void>;
        }>;
        environment: {
          i18n: {
            lang: string;
          };
        };
      }>;
    };
  }
}

export class YandexGamesAdapter implements IPlatformAdapter {
  readonly id = 'yandex' as const;
  readonly name = 'Yandex Games';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: true,
    hasAudioSync: false,
    hasLanguageDetection: true,
    hasShare: false,
  };

  private ysdk: any = null;
  private player: any = null;

  async init(): Promise<void> {
    if (typeof window !== 'undefined' && window.YaGames) {
      try {
        this.ysdk = await window.YaGames.init();
        try {
          this.player = await this.ysdk.getPlayer({ scopes: false });
        } catch {
          /* anonymous player */
        }
      } catch (err) {
        this.logWarning(err);
      }
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
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };

    if (this.player) {
      try {
        const data = await this.player.getData(['saveData']);
        if (data?.saveData) return data.saveData as GameSaveData;
      } catch (err) {
        this.logWarning(err);
      }
    }
    const local = localStorage.getItem('popTheLie_yandex_save');
    return local ? JSON.parse(local) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
    localStorage.setItem('popTheLie_yandex_save', JSON.stringify(data));
    if (this.player) {
      try {
        await this.player.setData({ saveData: data }, true);
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  async sendScore(score: number): Promise<void> {
    if (this.ysdk) {
      try {
        const lb = await this.ysdk.getLeaderboards();
        await lb.setLeaderboardScore('score', Math.floor(score));
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (!this.ysdk?.adv?.showFullscreenAdv) return;
    return new Promise<void>((resolve) => {
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onClose: () => resolve(),
          onError: () => resolve(),
        },
      });
    });
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    if (!this.ysdk?.adv?.showRewardedVideo) return true;
    return new Promise<boolean>((resolve) => {
      let earned = false;
      this.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => { earned = true; },
          onClose: () => resolve(earned),
          onError: () => resolve(false),
        },
      });
    });
  }

  async getLanguage(): Promise<string> {
    if (this.ysdk?.environment?.i18n?.lang) {
      return this.ysdk.environment.i18n.lang;
    }
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[Yandex Games Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[Yandex Games Warning]', warning);
  }
}
