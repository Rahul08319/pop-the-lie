/**
 * Universal Platform SDK Types
 * Zero external wrapper dependency - Native adapters for 13+ web gaming platforms
 */

export type PlatformId =
  | 'youtube'
  | 'facebook'
  | 'poki'
  | 'crazygames'
  | 'yandex'
  | 'gamedistribution'
  | 'discord'
  | 'jiogames'
  | 'y8'
  | 'lagged'
  | 'pwa'
  | 'quickgames'
  | 'msnreddit'
  | 'standalone';

export interface GameSaveData {
  version: number;
  highScore: number;
  balloonsPoppedTotal?: number;
  bestComboTotal?: number;
  customSettings?: {
    soundMuted?: boolean;
    musicMuted?: boolean;
  };
  lastSavedAt?: number;
}

export interface PlatformCapabilities {
  hasAds: boolean;
  hasRewardedAds: boolean;
  hasCloudSave: boolean;
  hasLeaderboards: boolean;
  hasAudioSync: boolean;
  hasLanguageDetection: boolean;
  hasShare: boolean;
}

export interface IPlatformAdapter {
  id: PlatformId;
  name: string;
  capabilities: PlatformCapabilities;

  /** Initialize SDK */
  init(): Promise<void>;

  /** Inform platform that the first frame has rendered */
  firstFrameReady(): void;

  /** Inform platform that loading is finished and game is interactive */
  gameReady(): void;

  /** Inform platform that gameplay started (e.g. Poki/CrazyGames) */
  gameplayStart?(): void;

  /** Inform platform that gameplay stopped/paused (e.g. Poki/CrazyGames) */
  gameplayStop?(): void;

  /** Listen for pause requested by platform / host environment */
  onPause(callback: () => void): () => void;

  /** Listen for resume requested by platform / host environment */
  onResume(callback: () => void): () => void;

  /** Check if system audio is enabled by host */
  isAudioEnabled(): boolean;

  /** Listen for host audio toggle (e.g. YouTube Playables header audio button) */
  onAudioEnabledChange(callback: (enabled: boolean) => void): () => void;

  /** Load persistent cloud save data */
  loadData(): Promise<GameSaveData>;

  /** Save persistent cloud data */
  saveData(data: GameSaveData): Promise<void>;

  /** Submit player's high score */
  sendScore(score: number): Promise<void>;

  /** Show an interstitial ad during a natural break (e.g. game over) */
  showInterstitialAd(): Promise<void>;

  /** Show a rewarded video ad in exchange for a perk (e.g. extra life) */
  showRewardedAd(rewardId: string): Promise<boolean>;

  /** Retrieve the player's host language tag (e.g. 'en-US') */
  getLanguage(): Promise<string>;

  /** Health telemetry reporting */
  logError(error?: unknown): void;
  logWarning(warning?: unknown): void;

  /** Optional platform link out (e.g. YouTube video or related playable) */
  openContent?(id: string, type?: 'VIDEO' | 'PLAYABLE'): Promise<void>;
}
