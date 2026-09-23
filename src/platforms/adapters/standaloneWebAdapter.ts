import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

export class StandaloneWebAdapter implements IPlatformAdapter {
  readonly id = 'standalone' as const;
  readonly name = 'Web Browser (Local/Standalone)';

  readonly capabilities: PlatformCapabilities = {
    hasAds: true,
    hasRewardedAds: true,
    hasCloudSave: true,
    hasLeaderboards: true,
    hasAudioSync: true,
    hasLanguageDetection: true,
    hasShare: true,
  };

  private audioEnabled = true;
  private audioListeners: Array<(enabled: boolean) => void> = [];

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
    return this.audioEnabled;
  }

  onAudioEnabledChange(callback: (enabled: boolean) => void): () => void {
    this.audioListeners.push(callback);
    return () => {
      this.audioListeners = this.audioListeners.filter(cb => cb !== callback);
    };
  }

  setAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    this.audioListeners.forEach(cb => cb(enabled));
  }

  async loadData(): Promise<GameSaveData> {
    const raw = localStorage.getItem('popTheLie_saveData');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_saveData', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(_score: number): Promise<void> {}

  async showInterstitialAd(): Promise<void> {
    console.log('[Ad Simulation] Interstitial ad shown (dev/local)');
  }

  async showRewardedAd(rewardId: string): Promise<boolean> {
    console.log(`[Ad Simulation] Rewarded ad watched for: ${rewardId} (dev/local)`);
    return true;
  }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[Standalone Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[Standalone Warning]', warning);
  }
}
