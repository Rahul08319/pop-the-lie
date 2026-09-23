import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YouTubePlayablesAdapter } from '@/platforms/adapters/youtubePlayablesAdapter';
import { platformManager } from '@/platforms/platformManager';

describe('YouTubePlayablesAdapter & PlatformManager', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset window.ytgame mock
    window.ytgame = {
      IN_PLAYABLES_ENV: true,
      SDK_VERSION: '1.0.0',
      game: {
        firstFrameReady: vi.fn(),
        gameReady: vi.fn(),
        loadData: vi.fn().mockResolvedValue(JSON.stringify({ version: 1, highScore: 150 })),
        saveData: vi.fn().mockResolvedValue(undefined),
      },
      system: {
        getLanguage: vi.fn().mockResolvedValue('en-US'),
        isAudioEnabled: vi.fn().mockReturnValue(true),
        onAudioEnabledChange: vi.fn().mockImplementation((cb) => () => {}),
        onPause: vi.fn().mockImplementation((cb) => () => {}),
        onResume: vi.fn().mockImplementation((cb) => () => {}),
      },
      ads: {
        requestInterstitialAd: vi.fn().mockResolvedValue(undefined),
        requestRewardedAd: vi.fn().mockResolvedValue(true),
      },
      engagement: {
        sendScore: vi.fn().mockResolvedValue(undefined),
        openYTContent: vi.fn().mockResolvedValue(undefined),
      },
      health: {
        logError: vi.fn(),
        logWarning: vi.fn(),
      },
    };
  });

  it('initializes YouTube Playables adapter and detects environment', async () => {
    const adapter = new YouTubePlayablesAdapter();
    expect(adapter.id).toBe('youtube');
    expect(adapter.isInPlayablesEnv).toBe(true);

    await adapter.init();
    expect(window.ytgame?.system.getLanguage).toHaveBeenCalled();
  });

  it('triggers firstFrameReady and gameReady lifecycle calls', () => {
    const adapter = new YouTubePlayablesAdapter();
    adapter.firstFrameReady();
    expect(window.ytgame?.game.firstFrameReady).toHaveBeenCalled();

    adapter.gameReady();
    expect(window.ytgame?.game.gameReady).toHaveBeenCalled();
  });

  it('saves and loads cloud data conforming to YouTube 3 MiB and UTF-16 spec', async () => {
    const adapter = new YouTubePlayablesAdapter();
    const testData = { version: 1, highScore: 350, lastSavedAt: Date.now() };

    await adapter.saveData(testData);
    expect(window.ytgame?.game.saveData).toHaveBeenCalledWith(JSON.stringify(testData));

    const loaded = await adapter.loadData();
    expect(loaded.highScore).toBe(150);
  });

  it('validates scores submitted to YouTube Playables', async () => {
    const adapter = new YouTubePlayablesAdapter();
    await adapter.sendScore(500);
    expect(window.ytgame?.engagement?.sendScore).toHaveBeenCalledWith({ value: 500 });

    // Negative scores rejected
    await adapter.sendScore(-10);
    expect(window.ytgame?.engagement?.sendScore).toHaveBeenCalledTimes(1);
  });

  it('requests interstitial and rewarded ads with sanitized reward IDs', async () => {
    const adapter = new YouTubePlayablesAdapter();
    await adapter.showInterstitialAd();
    expect(window.ytgame?.ads?.requestInterstitialAd).toHaveBeenCalled();

    const rewarded = await adapter.showRewardedAd('revive_life_123');
    expect(rewarded).toBe(true);
    expect(window.ytgame?.ads?.requestRewardedAd).toHaveBeenCalledWith('revive_life_123');
  });

  it('PlatformManager contains all 13 platforms and switches active target', () => {
    const platforms = platformManager.getAllAdapters();
    expect(platforms.length).toBeGreaterThanOrEqual(13);

    const ids = platforms.map((p) => p.id);
    expect(ids).toContain('youtube');
    expect(ids).toContain('facebook');
    expect(ids).toContain('poki');
    expect(ids).toContain('crazygames');
    expect(ids).toContain('yandex');
    expect(ids).toContain('gamedistribution');
    expect(ids).toContain('discord');
    expect(ids).toContain('jiogames');
    expect(ids).toContain('y8');
    expect(ids).toContain('lagged');
    expect(ids).toContain('pwa');
    expect(ids).toContain('quickgames');
    expect(ids).toContain('msnreddit');

    platformManager.setPlatform('poki');
    expect(platformManager.getAdapter().id).toBe('poki');

    platformManager.setPlatform('youtube');
    expect(platformManager.getAdapter().id).toBe('youtube');
  });
});
