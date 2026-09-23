import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

export class DiscordActivitiesAdapter implements IPlatformAdapter {
  readonly id = 'discord' as const;
  readonly name = 'Discord Activities';

  readonly capabilities: PlatformCapabilities = {
    hasAds: false,
    hasRewardedAds: false,
    hasCloudSave: true,
    hasLeaderboards: true,
    hasAudioSync: false,
    hasLanguageDetection: true,
    hasShare: true,
  };

  async init(): Promise<void> {
    // Discord Embedded App handshake
    try {
      if (typeof window !== 'undefined' && (window as any).DiscordSDK) {
        await (window as any).DiscordSDK.ready();
      }
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
    const raw = localStorage.getItem('popTheLie_discord_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_discord_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(_score: number): Promise<void> {}
  async showInterstitialAd(): Promise<void> {}
  async showRewardedAd(_rewardId: string): Promise<boolean> { return true; }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[Discord Activities Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[Discord Activities Warning]', warning);
  }
}
