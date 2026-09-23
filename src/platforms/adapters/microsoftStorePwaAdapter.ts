import { IPlatformAdapter, GameSaveData, PlatformCapabilities } from '../types';

export class MicrosoftStorePwaAdapter implements IPlatformAdapter {
  readonly id = 'pwa' as const;
  readonly name = 'Microsoft Store / Windows PWA';

  readonly capabilities: PlatformCapabilities = {
    hasAds: false,
    hasRewardedAds: false,
    hasCloudSave: true,
    hasLeaderboards: false,
    hasAudioSync: false,
    hasLanguageDetection: true,
    hasShare: true,
  };

  async init(): Promise<void> {
    // Windows PWA TitleBar and Window Controls Overlay enhancements
    if ('windowControlsOverlay' in navigator) {
      (navigator as any).windowControlsOverlay?.addEventListener?.('geometrychange', () => {
        // Adjust padding if window controls overlay is toggled
      });
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
    const raw = localStorage.getItem('popTheLie_pwa_save');
    const fallback: GameSaveData = {
      version: 1,
      highScore: Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0,
      lastSavedAt: Date.now(),
    };
    return raw ? JSON.parse(raw) : fallback;
  }

  async saveData(data: GameSaveData): Promise<void> {
    localStorage.setItem('popTheLie_pwa_save', JSON.stringify(data));
    localStorage.setItem('popTheLie_highScore', String(data.highScore));
  }

  async sendScore(_score: number): Promise<void> {}
  async showInterstitialAd(): Promise<void> {}
  async showRewardedAd(_rewardId: string): Promise<boolean> { return true; }

  async getLanguage(): Promise<string> {
    return navigator.language || 'en';
  }

  logError(error?: unknown): void {
    console.error('[PWA Error]', error);
  }

  logWarning(warning?: unknown): void {
    console.warn('[PWA Warning]', warning);
  }
}
