export type AchievementId = 'first-pop' | 'combo-5' | 'score-250' | 'daily-player';

export interface Achievement {
  id: AchievementId;
  icon: string;
  title: string;
  description: string;
}

const STORAGE_KEY = 'popTheLie_achievements';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-pop', icon: '🎈', title: 'Truth Seeker', description: 'Pop your first lie.' },
  { id: 'combo-5', icon: '🔥', title: 'Hot Streak', description: 'Reach a 5x combo.' },
  { id: 'score-250', icon: '🏆', title: 'Bright Mind', description: 'Score 250 points in one run.' },
  { id: 'daily-player', icon: '🌍', title: 'Daily Explorer', description: 'Finish a Daily Challenge.' },
];

export function getUnlockedAchievements(): AchievementId[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as AchievementId[];
  } catch {
    return [];
  }
}

export function unlockAchievements(ids: AchievementId[]): AchievementId[] {
  const unlocked = new Set(getUnlockedAchievements());
  const newlyUnlocked = ids.filter((id) => !unlocked.has(id));
  if (newlyUnlocked.length) {
    newlyUnlocked.forEach((id) => unlocked.add(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  }
  return newlyUnlocked;
}
