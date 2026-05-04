import { supabase } from '@/integrations/supabase/client';
import { Difficulty } from './types';
import { todaySeedString } from './rng';

export interface DailyScore {
  id: string;
  player_name: string;
  score: number;
  level: number;
  best_combo: number;
  challenge_seed: string;
  created_at: string;
}

const SUBMITTED_KEY = 'popTheLie_dailySubmitted';

export function hasSubmittedToday(): boolean {
  return localStorage.getItem(SUBMITTED_KEY) === todaySeedString();
}

export function markSubmittedToday() {
  localStorage.setItem(SUBMITTED_KEY, todaySeedString());
}

export async function submitDailyScore(input: {
  name: string;
  score: number;
  level: number;
  bestCombo: number;
  difficulty: Difficulty;
}) {
  const seed = todaySeedString();
  const { error } = await supabase.from('daily_challenge_scores').insert({
    player_name: input.name.slice(0, 20),
    score: Math.max(0, Math.floor(input.score)),
    level: input.level,
    best_combo: input.bestCombo,
    challenge_seed: seed,
  });
  if (error) throw error;
  markSubmittedToday();
}

export async function fetchDailyLeaderboard(limit = 50): Promise<DailyScore[]> {
  const seed = todaySeedString();
  const { data, error } = await supabase
    .from('daily_challenge_scores')
    .select('*')
    .eq('challenge_seed', seed)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DailyScore[];
}
