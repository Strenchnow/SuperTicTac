import { useState, useEffect } from 'react';
import { playhop } from './playhop';

export type Language = 'ru' | 'en';

const TRANSLATIONS = {
  ru: {
    title: 'ULTIMATE TIC-TAC-TOE 3D',
    subtitle: 'СУПЕР КРЕСТИКИ-НОЛИКИ 9×9',
    matchOver: 'Матч завершен',
    turn: 'Ход:',
    aiThinking: 'ИИ рассчитывает ход...',
    freeMove: 'Свободный ход — любой сектор!',
    targetSector: 'Ход в сектор:',
    row: 'Ряд',
    col: 'Кол',
    yourTurn: 'ВАШ ХОД!',
    opponentTurn: 'Ход соперника...',
    you: 'Вы',
    opponent: 'Соперник',
    ai: 'ИИ',
    playerPrefix: 'Игрок',
    room: 'Комната:',
    newGame: 'Новая игра',
    vsAi: 'Против ИИ',
    twoPlayers: '2 Игрока',
    camera: 'Камера',
    rules: 'Правила',
    online: 'По сети',
    restartTitle: 'Начать новую партию?',
    restartDesc: 'Текущий прогресс поля будет сброшен. Вы уверены?',
    cancel: 'Отмена',
    confirm: 'Да, сбросить',
    diffEasy: 'Новичок',
    diffMedium: 'Тактик',
    diffHard: 'Мастер',
    diffEasyDesc: 'Случайные ходы и простая тактика',
    diffMediumDesc: 'Умная оценка секторов',
    diffHardDesc: 'Глубокий Minimax поиск',
    victoryX: 'ПОБЕДА КРЕСТИКОВ!',
    victoryO: 'ПОБЕДА НОЛИКОВ!',
    tie: 'НИЧЬЯ!',
    playAgain: 'Играть снова',
    statsMoves: 'Всего ходов:',
    statsDuration: 'Время матча:',
    sectorsWon: 'Секторы победы:',
  },
  en: {
    title: 'ULTIMATE TIC-TAC-TOE 3D',
    subtitle: 'CYBER TIC-TAC-TOE 9×9',
    matchOver: 'Match Over',
    turn: 'Turn:',
    aiThinking: 'AI is thinking...',
    freeMove: 'Free move — pick any sector!',
    targetSector: 'Target sector:',
    row: 'Row',
    col: 'Col',
    yourTurn: 'YOUR TURN!',
    opponentTurn: "Opponent's turn...",
    you: 'You',
    opponent: 'Opponent',
    ai: 'AI',
    playerPrefix: 'Player',
    room: 'Room:',
    newGame: 'New Game',
    vsAi: 'vs AI',
    twoPlayers: '2 Players',
    camera: 'Camera',
    rules: 'Rules',
    online: 'Online',
    restartTitle: 'Start a new match?',
    restartDesc: 'Current board progress will be lost. Are you sure?',
    cancel: 'Cancel',
    confirm: 'Restart',
    diffEasy: 'Novice',
    diffMedium: 'Tactician',
    diffHard: 'Master',
    diffEasyDesc: 'Casual moves & basic blocks',
    diffMediumDesc: 'Smart tactical sector evaluation',
    diffHardDesc: 'Deep Minimax search',
    victoryX: 'PLAYER X WINS!',
    victoryO: 'PLAYER O WINS!',
    tie: 'IT IS A DRAW!',
    playAgain: 'Play Again',
    statsMoves: 'Total Moves:',
    statsDuration: 'Match Duration:',
    sectorsWon: 'Winning Sectors:',
  },
};

const SECTOR_NAMES_I18N = {
  ru: [
    'Верх-Лево', 'Верх-Центр', 'Верх-Право',
    'Центр-Лево', 'Центр', 'Центр-Право',
    'Низ-Лево', 'Низ-Центр', 'Низ-Право',
  ],
  en: [
    'Top-Left', 'Top-Center', 'Top-Right',
    'Mid-Left', 'Center', 'Mid-Right',
    'Bottom-Left', 'Bottom-Center', 'Bottom-Right',
  ],
};

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('super_ttt_lang');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {}

  const detected = playhop.getLanguage();
  if (detected.startsWith('ru') || detected.startsWith('be') || detected.startsWith('uk')) {
    return 'ru';
  }
  return 'en';
}

let currentLang: Language = getInitialLanguage();
const listeners = new Set<(lang: Language) => void>();

export function getLanguage(): Language {
  return currentLang;
}

export function setLanguage(lang: Language): void {
  currentLang = lang;
  try {
    localStorage.setItem('super_ttt_lang', lang);
  } catch {}
  listeners.forEach((fn) => fn(lang));
}

export function toggleLanguage(): Language {
  const next = currentLang === 'ru' ? 'en' : 'ru';
  setLanguage(next);
  return next;
}

export function useI18n() {
  const [lang, setLang] = useState<Language>(() => currentLang);

  useEffect(() => {
    listeners.add(setLang);
    return () => {
      listeners.delete(setLang);
    };
  }, []);

  return {
    lang,
    t: TRANSLATIONS[lang],
    sectorNames: SECTOR_NAMES_I18N[lang],
    setLanguage,
    toggleLanguage,
  };
}
