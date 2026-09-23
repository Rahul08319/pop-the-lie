import { IPlatformAdapter, PlatformId, GameSaveData } from './types';
import { YouTubePlayablesAdapter } from './adapters/youtubePlayablesAdapter';
import { FacebookInstantAdapter } from './adapters/facebookInstantAdapter';
import { PokiAdapter } from './adapters/pokiAdapter';
import { CrazyGamesAdapter } from './adapters/crazyGamesAdapter';
import { YandexGamesAdapter } from './adapters/yandexGamesAdapter';
import { GameDistributionAdapter } from './adapters/gameDistributionAdapter';
import { DiscordActivitiesAdapter } from './adapters/discordActivitiesAdapter';
import { JioGamesAdapter } from './adapters/jioGamesAdapter';
import { Y8Adapter } from './adapters/y8Adapter';
import { LaggedAdapter } from './adapters/laggedAdapter';
import { MicrosoftStorePwaAdapter } from './adapters/microsoftStorePwaAdapter';
import { QuickGamesAdapter } from './adapters/quickGamesAdapter';
import { MsnRedditAdapter } from './adapters/msnRedditAdapter';
import { StandaloneWebAdapter } from './adapters/standaloneWebAdapter';
import { useEffect, useState } from 'react';

export class PlatformManager {
  private static instance: PlatformManager;
  private currentAdapter: IPlatformAdapter;
  private adapters: Map<PlatformId, IPlatformAdapter> = new Map();
  private listeners: Array<(adapter: IPlatformAdapter) => void> = [];

  private constructor() {
    // Register all adapters
    this.register(new YouTubePlayablesAdapter());
    this.register(new FacebookInstantAdapter());
    this.register(new PokiAdapter());
    this.register(new CrazyGamesAdapter());
    this.register(new YandexGamesAdapter());
    this.register(new GameDistributionAdapter());
    this.register(new DiscordActivitiesAdapter());
    this.register(new JioGamesAdapter());
    this.register(new Y8Adapter());
    this.register(new LaggedAdapter());
    this.register(new MicrosoftStorePwaAdapter());
    this.register(new QuickGamesAdapter());
    this.register(new MsnRedditAdapter());
    this.register(new StandaloneWebAdapter());

    // Auto-detect platform
    const detectedId = this.detectPlatform();
    this.currentAdapter = this.adapters.get(detectedId) || this.adapters.get('youtube')!;
  }

  public static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager();
    }
    return PlatformManager.instance;
  }

  private register(adapter: IPlatformAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(): IPlatformAdapter {
    return this.currentAdapter;
  }

  public getAllAdapters(): IPlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  public setPlatform(id: PlatformId) {
    const next = this.adapters.get(id);
    if (next && next !== this.currentAdapter) {
      this.currentAdapter = next;
      this.notifyListeners();
    }
  }

  public subscribe(cb: (adapter: IPlatformAdapter) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentAdapter));
  }

  /**
   * Intelligently detect runtime host environment
   */
  public detectPlatform(): PlatformId {
    if (typeof window === 'undefined') return 'standalone';

    // 1. Explicit query parameter override (e.g., ?platform=poki)
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('platform') as PlatformId;
    if (param && this.adapters.has(param)) {
      return param;
    }

    // 2. Global runtime objects
    if (window.ytgame && (window.ytgame.IN_PLAYABLES_ENV || typeof window.ytgame.game?.firstFrameReady === 'function')) {
      return 'youtube';
    }
    if ((window as any).FBInstant) {
      return 'facebook';
    }
    if ((window as any).PokiSDK) {
      return 'poki';
    }
    if ((window as any).CrazyGames) {
      return 'crazygames';
    }
    if ((window as any).YaGames) {
      return 'yandex';
    }
    if ((window as any).gdsdk) {
      return 'gamedistribution';
    }
    if ((window as any).DiscordSDK) {
      return 'discord';
    }
    if ((window as any).JioGamesSDK) {
      return 'jiogames';
    }
    if ((window as any).ID?.GameBreak) {
      return 'y8';
    }
    if ((window as any).LaggedAPI) {
      return 'lagged';
    }
    if ((window as any).qg) {
      return 'quickgames';
    }

    // 3. Domain heuristics
    const hostname = window.location.hostname;
    if (hostname.includes('youtube') || hostname.includes('playables')) return 'youtube';
    if (hostname.includes('poki.com')) return 'poki';
    if (hostname.includes('crazygames.com')) return 'crazygames';
    if (hostname.includes('yandex.')) return 'yandex';
    if (hostname.includes('gamedistribution.com')) return 'gamedistribution';
    if (hostname.includes('msn.com') || hostname.includes('reddit.com')) return 'msnreddit';

    // 4. PWA standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      return 'pwa';
    }

    // 5. Default to YouTube Playables if ytgame script tag was loaded, else standalone
    return typeof (window as any).ytgame !== 'undefined' ? 'youtube' : 'standalone';
  }
}

export const platformManager = PlatformManager.getInstance();

/**
 * React Hook for Platform state & lifecycle
 */
export function usePlatform() {
  const [adapter, setAdapter] = useState<IPlatformAdapter>(() => platformManager.getAdapter());

  useEffect(() => {
    return platformManager.subscribe(newAdapter => {
      setAdapter(newAdapter);
    });
  }, []);

  return {
    adapter,
    platformId: adapter.id,
    platformName: adapter.name,
    capabilities: adapter.capabilities,
    setPlatform: (id: PlatformId) => platformManager.setPlatform(id),
    allPlatforms: platformManager.getAllAdapters(),
  };
}
