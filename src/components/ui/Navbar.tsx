import React from 'react';
import { Bot, User, Sparkles, Target, Zap } from 'lucide-react';
import { Player, GameWinner, GameMode } from '../../game/types';

interface NavbarProps {
  currentPlayer: Player;
  activeSector: number | null;
  winner: GameWinner;
  isAiThinking?: boolean;
  mode?: GameMode;
  aiPlayer?: Player;
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

export const Navbar: React.FC<NavbarProps> = ({
  currentPlayer,
  activeSector,
  winner,
  isAiThinking = false,
  mode = 'pvp',
  aiPlayer = 'O',
}) => {
  const isAiTurn = mode === 'ai' && currentPlayer === aiPlayer;
  const isX = currentPlayer === 'X';

  const getPlayerLabel = (player: Player) => {
    if (mode === 'ai') {
      return player === aiPlayer ? 'ИИ' : 'Вы';
    }
    return `Игрок ${player}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none p-3 sm:p-4 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Game Title & Branding */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-rose-500/20 border border-cyan-400/40">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                ULTIMATE TIC-TAC-TOE 3D
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              СУПЕР КРЕСТИКИ-НОЛИКИ 9×9
            </div>
          </div>
        </div>

        {/* Turn Status & Current Target Sector Display */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {winner ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-white/20 text-xs sm:text-sm font-bold text-slate-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              Матч завершен
            </div>
          ) : (
            <>
              {/* Whose turn is it */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300 ${
                  isX
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
                }`}
              >
                {isAiTurn ? (
                  <Bot className={`w-4 h-4 ${isAiThinking ? 'animate-bounce text-cyan-400' : ''}`} />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>Ход:</span>
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-black text-xs ${
                    isX ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_#06b6d4]' : 'bg-rose-500 text-white shadow-[0_0_8px_#f43f5e]'
                  }`}
                >
                  {currentPlayer}
                </span>
                <span className="text-slate-400 font-normal text-xs">
                  ({getPlayerLabel(currentPlayer)})
                </span>
              </div>

              {/* AI Thinking animation or Sector Requirement */}
              {isAiThinking ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-400/40 text-cyan-300 text-xs sm:text-sm font-semibold animate-pulse">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                  </div>
                  <span>ИИ рассчитывает ход...</span>
                </div>
              ) : activeSector === null ? (
                /* Free Move Badge */
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs sm:text-sm font-semibold shadow-[0_0_14px_rgba(245,158,11,0.2)] animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Свободный ход — выберите любой сектор!</span>
                </div>
              ) : (
                /* Targeted Sector Badge */
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-cyan-500/30 text-slate-200 text-xs sm:text-sm font-medium">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Ход в сектор:</span>
                  <span className="text-cyan-300 font-bold">
                    {SECTOR_NAMES[activeSector] || `№${activeSector + 1}`}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                    [Ряд {Math.floor(activeSector / 3) + 1}, Кол {(activeSector % 3) + 1}]
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
