import { useCallback, useEffect, useState } from 'react';
import { fetchDailyLeaderboard, DailyScore, hasSubmittedToday } from '@/game/dailyChallenge';
import { todaySeedString } from '@/game/rng';
import { playButtonClick } from '@/game/audioManager';

interface Props {
  onClose: () => void;
}

export function DailyLeaderboard({ onClose }: Props) {
  const [entries, setEntries] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyLeaderboard(50);
      setEntries(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const medals = ['🥇', '🥈', '🥉'];
  const seed = todaySeedString();
  const formatted = `${seed.slice(0, 4)}-${seed.slice(4, 6)}-${seed.slice(6, 8)}`;
  const submitted = hasSubmittedToday();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h2 className="font-game-title text-2xl text-primary text-center">🌍 Daily Challenge</h2>
            <p className="text-center text-xs text-muted-foreground">{formatted} • Global Top 50</p>
          </div>
          <button
            onClick={() => { playButtonClick(); load(true); }}
            disabled={refreshing || loading}
            aria-label="Refresh leaderboard"
            title="Refresh"
            className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 active:scale-95 transition disabled:opacity-50"
          >
            <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
          </button>
        </div>

        {submitted && (
          <p className="mt-2 text-center text-[11px] text-game-combo">
            ✓ Your score for today is in. One submission per device.
          </p>
        )}

        <div className="mt-3 flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading global scores…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
              <p className="text-sm text-destructive text-center">{error}</p>
              <button
                onClick={() => { playButtonClick(); load(true); }}
                className="font-game-title text-xs bg-primary/20 border border-primary/40 px-4 py-2 rounded-full text-primary"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="text-4xl">🎈</div>
              <p className="text-sm font-game-title text-foreground">No scores yet today</p>
              <p className="text-xs text-muted-foreground px-4">
                Be the first to top today's global board — play the Daily Challenge!
              </p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    i < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'
                  }`}
                >
                  <span className="text-lg w-8 text-center">
                    {i < 3 ? medals[i] : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-game-title text-sm text-foreground truncate">{entry.player_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Lv.{entry.level} • Combo x{entry.best_combo}
                    </div>
                  </div>
                  <span className="font-game-title text-lg text-game-score">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { playButtonClick(); onClose(); }}
          className="mt-4 w-full font-game-title text-sm bg-muted/40 hover:bg-muted/60 px-6 py-2.5 rounded-full text-foreground transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
