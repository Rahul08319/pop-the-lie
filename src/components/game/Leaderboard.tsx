import { useState, useEffect } from 'react';
import { Difficulty, DIFFICULTY_CONFIGS } from '@/game/types';
import { playButtonClick } from '@/game/audioManager';

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  difficulty: Difficulty;
  date: string;
}

const STORAGE_KEY = 'popTheLie_leaderboard';
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToLeaderboard(entry: LeaderboardEntry): boolean {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed.some(e => e === entry);
}

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
        <h2 className="font-game-title text-2xl text-primary text-center mb-4">🏆 Leaderboard</h2>

        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm py-8">No scores yet. Play a game!</p>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-1.5">
            {entries.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  i < 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'
                }`}
              >
                <span className="text-lg w-8 text-center">
                  {i < 3 ? medals[i] : `${i + 1}.`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-game-title text-sm text-foreground truncate">{entry.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {DIFFICULTY_CONFIGS[entry.difficulty].emoji} Lv.{entry.level} • {entry.date}
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
