import React, { useState, useEffect } from 'react';
import { X, Grid, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { playClick, playHover } from '../../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [selectedCell, setSelectedCell] = useState<number>(4); // Center cell by default

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCellHover = (index: number) => {
    if (index !== selectedCell) {
      setSelectedCell(index);
      playHover();
    }
  };

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide bg-gradient-to-r from-cyan-400 to-sky-200 bg-clip-text text-transparent">
                ПРАВИЛА: СУПЕР КРЕСТИКИ-НОЛИКИ
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Ultimate Tic-Tac-Toe — тактика двух масштабов
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-400 hover:text-white transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 4 Core Rule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 1 */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-cyan-500/30 transition">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/40">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">Глобальное поле 9×9</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Большое поле состоит из <span className="text-cyan-300 font-semibold">9 малых секторов</span> (каждый 3×3). Победа на малом поле засчитывается как завоевание соответствующей клетки глобального поля.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-cyan-500/30 transition">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-xs border border-cyan-500/40">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Правило направления</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Клетка, выбранная вами внутри сектора, <span className="text-cyan-300 font-semibold">отправляет оппонента в этот же сектор</span> на глобальном поле. Например: ход в правый-верхний угол сектора обязывает соперника ходить в правый-верхний сектор!
              </p>
            </div>

            {/* Rule 3 */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-amber-500/30 transition">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs border border-amber-500/40">
                  3
                </span>
                <h3 className="text-sm font-bold text-white">Свободный ход</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Если сектор, куда вас отправляют, <span className="text-amber-300 font-semibold">уже выигран кем-то или полностью заполнен</span> — активируется режим «Свободный ход»: вы можете поставить фигуру в любую свободную клетку любого активного сектора!
              </p>
            </div>

            {/* Rule 4 */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 hover:border-rose-500/30 transition">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-black text-xs border border-rose-500/40">
                  4
                </span>
                <h3 className="text-sm font-bold text-white">Финальная победа</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Для победы в матче необходимо выстроить <span className="text-rose-400 font-semibold">линию из 3 завоеванных малых секторов</span> (по горизонтали, вертикали или диагонали) на глобальном поле.
              </p>
            </div>
          </div>

          {/* Interactive Direction Rule Diagram */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-cyan-500/25">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Интерактивная демонстрация правила направления
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Наведите или нажмите клетку
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              {/* Local Cell Picker */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-cyan-300">
                  Ваш ход в малом секторе:
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-inner">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCell(idx);
                        playClick();
                      }}
                      onMouseEnter={() => handleCellHover(idx)}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                        selectedCell === idx
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#06b6d4] scale-105'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {selectedCell === idx ? 'X' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex flex-col items-center text-cyan-400 animate-pulse">
                <ArrowRight className="w-6 h-6 hidden sm:block" />
                <span className="text-[10px] text-slate-400 font-mono mt-1">Отправляет в</span>
              </div>

              {/* Global Sector Target Preview */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-rose-300">
                  Сектор следующего хода оппонента:
                </span>
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-white/10 shadow-inner">
                  {Array.from({ length: 9 }).map((_, sIdx) => {
                    const isTarget = sIdx === selectedCell;
                    return (
                      <div
                        key={sIdx}
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center transition-all ${
                          isTarget
                            ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300 font-black shadow-[0_0_16px_rgba(244,63,94,0.5)] scale-105 animate-pulse'
                            : 'bg-slate-800/40 border border-white/5 text-slate-600'
                        }`}
                      >
                        <div className="grid grid-cols-3 gap-0.5 opacity-60">
                          {Array.from({ length: 9 }).map((_, c) => (
                            <div
                              key={c}
                              className={`w-1.5 h-1.5 rounded-sm ${
                                isTarget ? 'bg-rose-400' : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-300 hover:from-cyan-300 hover:to-sky-200 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Понятно!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
