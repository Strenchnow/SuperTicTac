import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Clock, Swords, Sparkles, Hash, Award } from 'lucide-react';
import { GameWinner, Player, GameMode, Move } from '../../game/types';
import { playGameWin, playClick } from '../../utils/audio';

export interface VictoryModalProps {
  winner: GameWinner;
  winningLine: number[] | null;
  movesCount?: number;
  history?: Move[];
  durationSeconds?: number;
  mode?: GameMode;
  aiPlayer?: Player;
  onPlayAgain: () => void;
}

const SECTOR_NAMES = [
  'Верх-Лево',
  'Верх-Центр',
  'Верх-Право',
  'Центр-Лево',
  'Центр',
  'Центр-Право',
  'Низ-Лево',
  'Низ-Центр',
  'Низ-Право',
];

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  winningLine,
  movesCount,
  history = [],
  durationSeconds = 0,
  mode = 'pvp',
  aiPlayer = 'O',
  onPlayAgain,
}) => {
  useEffect(() => {
    if (!winner) return;

    if (winner !== 'TIE') {
      playGameWin();

      // Multi-burst cyber confetti salute
      const colors =
        winner === 'X'
          ? ['#00f3ff', '#38bdf8', '#0284c7', '#ffffff']
          : ['#ff0055', '#fb7185', '#f43f5e', '#ffffff'];

      const fire = (ratio: number, opts: confetti.Options) => {
        confetti({
          origin: { y: 0.65 },
          zIndex: 9999,
          ...opts,
          particleCount: Math.floor(220 * ratio),
        });
      };

      fire(0.25, { spread: 30, startVelocity: 60, colors });
      fire(0.2, { spread: 60, colors: [...colors, '#fbbf24'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9, colors });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors });
      fire(0.1, { spread: 120, startVelocity: 45, colors });
    }
  }, [winner]);

  if (!winner) return null;

  const totalMoves = history.length > 0 ? history.length : (movesCount ?? 0);
  const xMoves = history.length > 0 ? history.filter((m) => m.player === 'X').length : Math.ceil(totalMoves / 2);
  const oMoves = history.length > 0 ? history.filter((m) => m.player === 'O').length : Math.floor(totalMoves / 2);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins === 0) return `${remainingSecs} сек`;
    return `${mins} мин ${remainingSecs} сек`;
  };

  const getWinnerTitle = () => {
    if (winner === 'TIE') {
      return {
        text: 'НИЧЬЯ!',
        subtitle: 'Великолепная тактическая битва равных!',
        badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40 shadow-[0_0_24px_rgba(245,158,11,0.4)]',
        glowClass: 'drop-shadow-[0_0_25px_rgba(245,158,11,0.6)] text-amber-300',
      };
    }

    if (winner === 'X') {
      const isPlayerXAi = mode === 'ai' && aiPlayer === 'X';
      return {
        text: 'ПОБЕДА КРЕСТИКОВ!',
        subtitle: isPlayerXAi ? 'Искусственный интеллект одержал верх' : 'Игрок X триумфально завершил матч!',
        badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40 shadow-[0_0_24px_rgba(6,182,212,0.4)]',
        glowClass: 'drop-shadow-[0_0_30px_rgba(6,182,212,0.8)] text-cyan-300',
      };
    }

    const isPlayerOAi = mode === 'ai' && aiPlayer === 'O';
    return {
      text: 'ПОБЕДА НОЛИКОВ!',
      subtitle: isPlayerOAi ? 'Искусственный интеллект одержал победу' : 'Игрок O разгромил противника!',
      badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/40 shadow-[0_0_24px_rgba(244,63,94,0.4)]',
      glowClass: 'drop-shadow-[0_0_30px_rgba(244,63,94,0.8)] text-rose-300',
    };
  };

  const winnerData = getWinnerTitle();

  const handleRestart = () => {
    playClick();
    onPlayAgain();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.3)] text-center flex flex-col items-center gap-5">
        {/* Glow Accent Circle Behind Trophy */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-60 bg-gradient-to-tr from-cyan-500 to-rose-500" />
          <div className="relative w-20 h-20 rounded-2xl bg-slate-950 border border-white/20 flex items-center justify-center shadow-2xl">
            {winner === 'TIE' ? (
              <Swords className="w-10 h-10 text-amber-400 animate-pulse" />
            ) : (
              <Trophy className="w-10 h-10 text-yellow-400 animate-bounce" />
            )}
          </div>
        </div>

        {/* Winner Header */}
        <div className="space-y-1.5">
          <h2 className={`text-2xl sm:text-3xl font-black tracking-wider ${winnerData.glowClass}`}>
            {winnerData.text}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {winnerData.subtitle}
          </p>
        </div>

        {/* Winning Line Highlight (if won) */}
        {winningLine && winningLine.length > 0 && (
          <div className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400">Победный ряд секторов:</span>
            <span className="text-white font-bold tracking-wide">
              {winningLine.map((idx) => SECTOR_NAMES[idx] || `#${idx + 1}`).join(' • ')}
            </span>
          </div>
        )}

        {/* Game Stats Card Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 pt-2">
          {/* Total Moves */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 border border-white/10">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>Всего ходов</span>
            </div>
            <span className="text-lg font-black text-white">{totalMoves}</span>
            <span className="text-[10px] text-slate-400">
              X: {xMoves} | O: {oMoves}
            </span>
          </div>

          {/* Game Mode */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 border border-white/10">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Режим</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              {mode === 'ai' ? 'Против ИИ' : '2 Игрока'}
            </span>
            <span className="text-[10px] text-slate-400">Партия 9×9</span>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 border border-white/10">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Время</span>
            </div>
            <span className="text-sm sm:text-base font-black text-white mt-1">
              {formatDuration(durationSeconds)}
            </span>
            <span className="text-[10px] text-slate-400">Длительность</span>
          </div>
        </div>

        {/* Play Again Action Button */}
        <div className="w-full pt-2">
          <button
            onClick={handleRestart}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 hover:from-cyan-300 hover:to-rose-300 shadow-[0_0_30px_rgba(6,182,212,0.5)] transition active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Играть снова</span>
          </button>
        </div>
      </div>
    </div>
  );
};
