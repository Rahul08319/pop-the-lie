export type GameLanguage = 'en' | 'hi' | 'es';

const DICTIONARY = {
  en: { play: 'PLAY', daily: 'Daily Challenge', howTo: 'How to Play', difficulty: 'Choose Difficulty', popLie: 'Pop the wrong math • Leave the truth!', settings: 'Settings', achievements: 'Achievements' },
  hi: { play: 'खेलें', daily: 'डेली चैलेंज', howTo: 'कैसे खेलें', difficulty: 'कठिनाई चुनें', popLie: 'गलत गणित को फोड़ें • सही को छोड़ें!', settings: 'सेटिंग्स', achievements: 'उपलब्धियाँ' },
  es: { play: 'JUGAR', daily: 'Reto diario', howTo: 'Cómo jugar', difficulty: 'Elige dificultad', popLie: '¡Revienta las cuentas falsas!', settings: 'Ajustes', achievements: 'Logros' },
} as const;

const STORAGE_KEY = 'popTheLie_language';

export function getGameLanguage(): GameLanguage {
  const saved = localStorage.getItem(STORAGE_KEY) as GameLanguage | null;
  if (saved && saved in DICTIONARY) return saved;
  const locale = document.documentElement.lang.toLowerCase();
  return locale.startsWith('hi') ? 'hi' : locale.startsWith('es') ? 'es' : 'en';
}

export function setGameLanguage(language: GameLanguage): void {
  localStorage.setItem(STORAGE_KEY, language);
  document.documentElement.lang = language;
}

export function strings(language: GameLanguage) {
  return DICTIONARY[language];
}
