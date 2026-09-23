import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

/**
 * YouTube Playables SDK v1 Types
 * Matches the official Google YouTube Playables specification
 */
export interface YouTubePlayablesSdk {
  IN_PLAYABLES_ENV: boolean;
  SDK_VERSION?: string;
  game: {
    firstFrameReady(): void;
    gameReady(): void;
    loadData(): Promise<string>;
    saveData(data: string): Promise<void>;
  };
  system: {
    getLanguage(): Promise<string>;
    isAudioEnabled(): boolean;
    onAudioEnabledChange(callback: (enabled: boolean) => void): () => void;
    onPause(callback: () => void): () => void;
    onResume(callback: () => void): () => void;
  };
  ads?: {
    requestInterstitialAd(): Promise<void>;
    requestRewardedAd(rewardId: string): Promise<boolean>;
  };
  engagement?: {
    sendScore(score: { value: number }): Promise<void>;
    openYTContent(content: { id: string; contentType?: 'VIDEO' | 'PLAYABLE' }): Promise<void>;
  };
  health?: {
    logError(): void;
    logWarning(): void;
  };
}

declare global {
  interface Window {
    ytgame?: YouTubePlayablesSdk;
  }
}

const LOCAL_STORAGE_KEY = 'popTheLie_yt_savedata';

export class YouTubePlayablesAdapter implements IPlatformAdapter {
  readonly id = 'youtube' as const;
  readonly name = 'YouTube Playables';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: true,
    hasAudioSync: true,
    hasLanguageDetection: true,
    hasShare: false,
  };

  private get sdk(): YouTubePlayablesSdk | undefined {
    return typeof window !== 'undefined' ? window.ytgame : undefined;
  }

  get isInPlayablesEnv(): boolean {
    return Boolean(this.sdk && this.sdk.IN_PLAYABLES_ENV);
  }

  async init(): Promise<void> {
    if (this.sdk) {
      try {
        const lang = await this.sdk.system.getLanguage();
        if (lang) {
          document.documentElement.lang = lang;
        }
      } catch (err) {
        this.logWarning(err);
      }
    }
  }

  firstFrameReady(): void {
    try {
      this.sdk?.game?.firstFrameReady();
    } catch (err) {
      this.logError(err);
    }
  }

  gameReady(): void {
    try {
      this.sdk?.game?.gameReady();
    } catch (err) {
      this.logError(err);
    }
  }

  onPause(callback: () => void): () => void {
    try {
      if (this.sdk?.system?.onPause) {
        return this.sdk.system.onPause(callback);
      }
    } catch (err) {
      this.logWarning(err);
    }
    // Fallback window visibility change
    const handler = () => {
      if (document.hidden) callback();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  onResume(callback: () => void): () => void {
    try {
      if (this.sdk?.system?.onResume) {
        return this.sdk.system.onResume(callback);
      }
    } catch (err) {
      this.logWarning(err);
    }
    const handler = () => {
      if (!document.hidden) callback();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  isAudioEnabled(): boolean {
    try {
      if (this.sdk?.system?.isAudioEnabled) {
        return this.sdk.system.isAudioEnabled();
      }
    } catch (err) {
      this.logWarning(err);
    }
    return true;
  }

  onAudioEnabledChange(callback: (enabled: boolean) => void): () => void {
    try {
      if (this.sdk?.system?.onAudioEnabledChange) {
        return this.sdk.system.onAudioEnabledChange(callback);
      }
    } catch (err) {
      this.logWarning(err);
    }
    return () => {};
  }

  async loadData(): Promise<GameSaveData> {
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };

    try {
      if (this.isInPlayablesEnv && this.sdk?.game?.loadData) {
        const raw = await this.sdk.game.loadData();
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            version: parsed.version ?? 1,
            highScore: typeof parsed.highScore === 'number' && Number.isFinite(parsed.highScore) ? Math.floor(parsed.highScore) : fallback.highScore,
            balloonsPoppedTotal: parsed.balloonsPoppedTotal,
            bestComboTotal: parsed.bestComboTotal,
            lastSavedAt: parsed.lastSavedAt ?? Date.now(),
          };
        }
      }
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch (err) {
      this.logWarning(err);
    }
    return fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    try {
      const serialized = JSON.stringify(data);

      // YouTube specification: string must be well-formed and <= 3 MiB
      if (typeof String.prototype.isWellFormed === 'function' && !serialized.isWellFormed()) {
        this.logWarning('Save data string is not well formed UTF-16');
        return;
      }
      if (new Blob([serialized]).size > 3 * 1024 * 1024) {
        this.logError('Save data exceeds 3 MiB limit');
        return;
      }

      if (this.isInPlayablesEnv && this.sdk?.game?.saveData) {
        await this.sdk.game.saveData(serialized);
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
        localStorage.setItem('popTheLie_highScore', String(data.highScore));
      }
    } catch (err) {
      this.logWarning(err);
    }
  }

  async sendScore(score: number): Promise<void> {
    if (!Number.isSafeInteger(score) || score < 0) {
      this.logWarning('Invalid score for YouTube Playables: must be non-negative safe integer');
      return;
    }
    try {
      if (this.isInPlayablesEnv && this.sdk?.engagement?.sendScore) {
        await this.sdk.engagement.sendScore({ value: Math.floor(score) });
      }
    } catch (err) {
      this.logWarning(err);
    }
  }

  async showInterstitialAd(): Promise<void> {
    try {
      if (this.sdk?.ads?.requestInterstitialAd) {
        await this.sdk.ads.requestInterstitialAd();
      }
    } catch (err) {
      // Per YouTube guidelines: Handle ad errors gracefully and continue gameplay
      this.logWarning(err);
    }
  }

  async showRewardedAd(rewardId: string): Promise<boolean> {
    try {
      if (this.sdk?.ads?.requestRewardedAd) {
        // Safe sanitization: IDs must be readable, no user data
        const safeRewardId = rewardId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
        return await this.sdk.ads.requestRewardedAd(safeRewardId);
      }
      // If running locally or ads unsupported, resolve true in development or mock
      return true;
    } catch (err) {
      this.logWarning(err);
      return false;
    }
  }

  async getLanguage(): Promise<string> {
    try {
      if (this.sdk?.system?.getLanguage) {
        return await this.sdk.system.getLanguage();
      }
    } catch (err) {
      this.logWarning(err);
    }
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    try {
      this.sdk?.health?.logError();
      console.error('[YouTube Playables Error]', error);
    } catch {
      /* best effort */
    }
  }

  logWarning(warning?: unknown): void {
    try {
      this.sdk?.health?.logWarning();
      console.warn('[YouTube Playables Warning]', warning);
    } catch {
      /* best effort */
    }
  }

  async openContent(id: string, type: 'VIDEO' | 'PLAYABLE' = 'VIDEO'): Promise<void> {
    try {
      if (this.sdk?.engagement?.openYTContent) {
        await this.sdk.engagement.openYTContent({ id, contentType: type });
      } else {
        window.open(type === 'VIDEO' ? `https://www.youtube.com/watch?v=${id}` : `https://www.youtube.com/playables`, '_blank');
      }
    } catch (err) {
      this.logWarning(err);
    }
  }
}
