import { useEffect, useRef } from 'react';
import { platformManager } from '@/platforms/platformManager';
import { PlayablesSaveData } from './types';

export type { PlayablesSaveData } from './types';

export const getPlayablesSdk = () => (typeof window !== 'undefined' ? window.ytgame : undefined);
export const isInPlayablesEnvironment = () => Boolean(getPlayablesSdk()?.IN_PLAYABLES_ENV);

export async function loadPlayablesSave(): Promise<{ version: 1; highScore: number }> {
  const save = await platformManager.getAdapter().loadData();
  return { version: 1, highScore: save.highScore };
}

export async function savePlayablesData(data: { version: 1; highScore: number }): Promise<void> {
  await platformManager.getAdapter().saveData({
    version: data.version,
    highScore: data.highScore,
    lastSavedAt: Date.now(),
  });
}

export async function sendPlayablesScore(score: number): Promise<void> {
  await platformManager.getAdapter().sendScore(score);
}

interface Options {
  onLoaded(save: { version: 1; highScore: number }): void;
  onPause(): void;
  onResume(): void;
  getSave(): { version: 1; highScore: number };
}

/**
 * Wires YouTube Playables / Universal Platform lifecycle events to the game arena
 */
export function useYouTubePlayables(options: Options): void {
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    let disposed = false;
    const adapter = platformManager.getAdapter();
    const cleanups: Array<() => void> = [];

    const init = async () => {
      try {
        await adapter.init();

        // Signal first frame rendered to YouTube
        requestAnimationFrame(() => {
          adapter.firstFrameReady();
        });

        // Lifecycle pause / resume
        cleanups.push(
          adapter.onPause(() => {
            latest.current.onPause();
            void adapter.saveData({
              version: 1,
              highScore: latest.current.getSave().highScore,
              lastSavedAt: Date.now(),
            });
          })
        );

        cleanups.push(
          adapter.onResume(() => {
            latest.current.onResume();
          })
        );

        // Load data
        const save = await adapter.loadData();
        if (disposed) return;
        latest.current.onLoaded({ version: 1, highScore: save.highScore });

        // Signal game ready once assets & state are interactable
        requestAnimationFrame(() => {
          adapter.gameReady();
        });
      } catch (err) {
        adapter.logError(err);
      }
    };

    void init();

    return () => {
      disposed = true;
      cleanups.forEach((c) => c());
    };
  }, []);
}
