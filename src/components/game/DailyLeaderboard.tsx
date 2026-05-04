import { useEffect, useState } from 'react';
import { fetchDailyLeaderboard, DailyScore } from '@/game/dailyChallenge';
import { todaySeedString } from '@/game/rng';
import { playButtonClick } from '@/game/audioManager';

interface Props {
  onClose: () => void;
}

export function DailyLeaderboard({ onClose }: Props) {
  const [entries, setEntries] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDailyLeaderboard(50)
      .then(d => { if (!cancelled) setEntries(d); })
      .catch(e => { if (!cancelled) setError(e.message ?? 'Failed to load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const seed = todaySeedString();
  const formatted = `${seed.slice(0, 4)}-${seed.slice(4, 6)}-${seed.slice(6, 8)}`;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="font-game-title text-2xl text-primary text-center">🌍 Daily Challenge</h2>
        <p className="text-center text-xs text-muted-foreground mb-3">{formatted} • Global Top 50</p>

        {loading && <p className="text-center text-sm py-8 text-muted-foreground">Loading...</p>}
        {error && <p className="text-center text-sm py-8 text-destructive">{error}</p>}
        {!loading && !error && entries.length === 0 && (
          <p className="text-muted-foreground text-center text-sm py-8">No scores yet today. Be the first!</p>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="overflow-y-auto flex-1 space-y-1.5">
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
