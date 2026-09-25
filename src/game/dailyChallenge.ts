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
  device_id?: string | null;
}

const SUBMITTED_KEY = 'popTheLie_dailySubmitted';
const DEVICE_ID_KEY = 'popTheLie_deviceId';
const OFFLINE_SCORES_KEY = 'popTheLie_offlineDailyScores';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function hasSubmittedToday(): boolean {
  return localStorage.getItem(SUBMITTED_KEY) === todaySeedString();
}

export function markSubmittedToday() {
  localStorage.setItem(SUBMITTED_KEY, todaySeedString());
}

export function getOfflineDailyScores(): DailyScore[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_SCORES_KEY) || '[]') as DailyScore[];
  } catch {
    return [];
  }
}

function saveOfflineDailyScore(input: { name: string; score: number; level: number; bestCombo: number }) {
  const score: DailyScore = {
    id: `offline-${Date.now()}`,
    player_name: input.name.slice(0, 20),
    score: Math.max(0, Math.floor(input.score)),
    level: input.level,
    best_combo: input.bestCombo,
    challenge_seed: todaySeedString(),
    created_at: new Date().toISOString(),
    device_id: getDeviceId(),
  };
  const scores = getOfflineDailyScores().filter((item) => item.challenge_seed !== score.challenge_seed);
  scores.push(score);
  localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(scores.slice(-30)));
}

export async function hasSubmittedTodayRemote(): Promise<boolean> {
  const seed = todaySeedString();
  const deviceId = getDeviceId();
  const { count, error } = await supabase
    .from('daily_challenge_scores')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_seed', seed)
    .eq('device_id', deviceId);
  if (error) return hasSubmittedToday();
  return (count ?? 0) > 0;
}

export async function submitDailyScore(input: {
  name: string;
  score: number;
  level: number;
  bestCombo: number;
  difficulty: Difficulty;
}) {
  if (hasSubmittedToday()) {
    throw new Error('You have already submitted a score for today on this device.');
  }
  const seed = todaySeedString();
  const deviceId = getDeviceId();

  // Defensive remote check (handles cleared localStorage)
  if (await hasSubmittedTodayRemote()) {
    markSubmittedToday();
    throw new Error('This device has already submitted a score for today.');
  }

  const { error } = await supabase.from('daily_challenge_scores').insert({
    player_name: input.name.slice(0, 20),
    score: Math.max(0, Math.floor(input.score)),
    level: input.level,
    best_combo: input.bestCombo,
    challenge_seed: seed,
    device_id: deviceId,
  });
  if (error) {
    // Unique-violation = duplicate submission
    if ((error as any).code === '23505') {
      markSubmittedToday();
      throw new Error('This device has already submitted a score for today.');
    }
    // A Daily Challenge remains playable when the leaderboard is unavailable.
    saveOfflineDailyScore(input);
    markSubmittedToday();
    return { offline: true };
  }
  markSubmittedToday();
  return { offline: false };
}

export async function fetchDailyLeaderboard(limit = 50): Promise<DailyScore[]> {
  const seed = todaySeedString();
  const { data, error } = await supabase
    .from('daily_challenge_scores')
    .select('*')
    .eq('challenge_seed', seed)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) return getOfflineDailyScores().filter((score) => score.challenge_seed === seed);
  const remote = (data ?? []) as DailyScore[];
  const offline = getOfflineDailyScores().filter((score) => score.challenge_seed === seed);
  return [...remote, ...offline].sort((a, b) => b.score - a.score).slice(0, limit);
}
