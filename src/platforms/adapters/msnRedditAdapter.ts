import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

export class MsnRedditAdapter implements IPlatformAdapter {
  readonly id = 'msnreddit' as const;
  readonly name = 'MSN & Reddit Games';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: true,
    hasAudioSync: false,
    hasLanguageDetection: true,
    hasShare: true,
  };

  async init(): Promise<void> {
    // PostMessage handshake with parent container
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'GAME_READY', game: 'PopTheLie' }, '*');
    }
  }

  firstFrameReady(): void {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'FIRST_FRAME' }, '*');
    }
  }

  gameReady(): void {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'GAME_LOADED' }, '*');
    }
  }

  onPause(callback: () => void): () => void {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PAUSE_GAME') callback();
    };
    window.addEventListener('message', handler);
    const visHandler = () => { if (document.hidden) callback(); };
    document.addEventListener('visibilitychange', visHandler);
    return () => {
      window.removeEventListener('message', handler);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }

  onResume(callback: () => void): () => void {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'RESUME_GAME') callback();
    };
    window.addEventListener('message', handler);
    const visHandler = () => { if (!document.hidden) callback(); };
    document.addEventListener('visibilitychange', visHandler);
    return () => {
      window.removeEventListener('message', handler);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }

  isAudioEnabled(): boolean {
    return true;
  }

  onAudioEnabledChange(_callback: (enabled: boolean) => void): () => void {
    return () => {};
  }

  async loadData(): Promise<GameSaveData> {
    const raw = localStorage.getItem('popTheLie_msn_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_msn_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SAVE_DATA', data }, '*');
    }
  }

  async sendScore(score: number): Promise<void> {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'POST_SCORE', score: Math.floor(score) }, '*');
    }
  }

  async showInterstitialAd(): Promise<void> {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SHOW_AD', adType: 'interstitial' }, '*');
    }
  }

  async showRewardedAd(_rewardId: string): Promise<boolean> {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SHOW_AD', adType: 'rewarded' }, '*');
    }
    return true;
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[MSN/Reddit Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[MSN/Reddit Warning]', warning);
  }
}
