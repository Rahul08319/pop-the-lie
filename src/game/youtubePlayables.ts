import { useEffect, useRef } from 'react';
import { setSystemAudioEnabled } from './audioManager';

interface YouTubePlayablesSdk {
  IN_PLAYABLES_ENV: boolean;
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
  engagement?: { sendScore(score: { value: number }): Promise<void> };
  health?: { logError(): void; logWarning(): void };
}

declare global {
  interface Window { ytgame?: YouTubePlayablesSdk }
}

export interface PlayablesSaveData { version: 1; highScore: number }

const SAVE_KEY = 'popTheLie_saveData';
const legacyHighScore = () => Number.parseInt(localStorage.getItem('popTheLie_highScore') || '0', 10) || 0;
const fallback = (): PlayablesSaveData => ({ version: 1, highScore: legacyHighScore() });
export const getPlayablesSdk = () => window.ytgame;
export const isInPlayablesEnvironment = () => Boolean(getPlayablesSdk()?.IN_PLAYABLES_ENV);

function health(kind: 'logError' | 'logWarning') {
  try { getPlayablesSdk()?.health?.[kind](); } catch { /* best effort */ }
}

function parseSave(raw: string): PlayablesSaveData {
  try {
    const value = JSON.parse(raw) as Partial<PlayablesSaveData>;
    if (typeof value.highScore === 'number' && Number.isFinite(value.highScore) && value.highScore >= 0) {
      return { version: 1, highScore: Math.floor(value.highScore) };
    }
  } catch { health('logWarning'); }
  return fallback();
}

export async function loadPlayablesSave(): Promise<PlayablesSaveData> {
  try {
    if (isInPlayablesEnvironment()) return parseSave(await getPlayablesSdk()!.game.loadData());
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? parseSave(raw) : fallback();
  } catch {
    health('logWarning');
    return fallback();
  }
}

export async function savePlayablesData(data: PlayablesSaveData): Promise<void> {
  try {
    if (isInPlayablesEnvironment()) await getPlayablesSdk()!.game.saveData(JSON.stringify(data));
    else {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      localStorage.setItem('popTheLie_highScore', String(data.highScore));
    }
  } catch { health('logWarning'); }
}

export async function sendPlayablesScore(score: number): Promise<void> {
  if (!isInPlayablesEnvironment() || !Number.isSafeInteger(score) || score < 0) return;
  try { await getPlayablesSdk()?.engagement?.sendScore({ value: score }); }
  catch { health('logWarning'); }
}

interface Options {
  onLoaded(save: PlayablesSaveData): void;
  onPause(): void;
  onResume(): void;
  getSave(): PlayablesSaveData;
}

/** Wires YouTube Playables lifecycle events to this game; local development uses safe fallbacks. */
export function useYouTubePlayables(options: Options): void {
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    let disposed = false;
    const cleanup: Array<() => void> = [];
    const init = async () => {
      const sdk = getPlayablesSdk();
      try {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        sdk?.game.firstFrameReady();

        if (sdk) {
          setSystemAudioEnabled(sdk.system.isAudioEnabled());
          cleanup.push(sdk.system.onAudioEnabledChange(setSystemAudioEnabled));
          cleanup.push(sdk.system.onPause(() => {
            latest.current.onPause();
            void savePlayablesData(latest.current.getSave());
          }));
          cleanup.push(sdk.system.onResume(() => latest.current.onResume()));
          try { document.documentElement.lang = await sdk.system.getLanguage(); }
          catch { health('logWarning'); }
        }

        const save = await loadPlayablesSave();
        if (disposed) return;
        latest.current.onLoaded(save);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        sdk?.game.gameReady();
      } catch { health('logError'); }
    };
    void init();
    return () => {
      disposed = true;
      cleanup.forEach(remove => remove());
    };
  }, []);
}

