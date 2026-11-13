import React, { useState } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Camera,
  Users,
  Bot,
  Sparkles,
  ChevronUp,
  Globe,
} from 'lucide-react';
import { GameMode, AIDifficulty } from '../../game/types';
import { useAudioState, playClick } from '../../utils/audio';

export interface ControlsProps {
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  onChangeMode: (mode: GameMode) => void;
  onChangeDifficulty: (difficulty: AIDifficulty) => void;
  onResetGame: () => void;
  onResetCamera: () => void;
  onOpenRules: () => void;
  onOpenMultiplayer?: () => void;
  isMultiplayerActive?: boolean;
  roomId?: string | null;
  disabled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  mode,
  aiDifficulty,
  onChangeMode,
  onChangeDifficulty,
  onResetGame,
  onResetCamera,
  onOpenRules,
  onOpenMultiplayer,
  isMultiplayerActive = false,
  roomId = null,
  disabled = false,
}) => {
  const { muted, toggle } = useAudioState();
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);

  const handleAudioToggle = () => {
    toggle();
  };

  const handleResetClick = () => {
    playClick();
    setShowConfirmRestart(true);
  };

  const confirmReset = () => {
    playClick();
    setShowConfirmRestart(false);
    onResetGame();
  };

  const cancelReset = () => {
    playClick();
    setShowConfirmRestart(false);
  };

  const handleModeToggle = () => {
    playClick();
    const nextMode: GameMode = mode === 'pvp' ? 'ai' : 'pvp';
    onChangeMode(nextMode);
  };

  const handleDifficultySelect = (diff: AIDifficulty) => {
    playClick();
    onChangeDifficulty(diff);
    setShowDifficultyMenu(false);
  };

  const difficultyLabels: Record<AIDifficulty, { label: string; color: string; desc: string }> = {
    easy: { label: 'Новичок', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40', desc: 'Случайные ходы и простая тактика' },
    medium: { label: 'Тактик', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40', desc: 'Умная тактическая оценка секторов' },
    hard: { label: 'Мастер', color: 'text-purple-400 border-purple-500/40 bg-purple-950/40', desc: 'Глубокий Minimax поиск' },
  };

  return (
    <>
      {/* Restart confirmation popover/modal */}
      {showConfirmRestart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_32px_rgba(6,182,212,0.3)] text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Начать новую партию?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Текущий прогресс поля будет сброшен. Вы уверены?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={cancelReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition border border-white/10"
              >
                Отмена
              </button>
              <button
                onClick={confirmReset}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 shadow-[0_0_16px_rgba(6,182,212,0.5)] transition"
              >
                Да, начать заново
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom / Cyber-Dock Controls */}
      <div className="fixed bottom-4 left-0 right-0 z-40 pointer-events-none px-3 flex justify-center">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* New Game / Restart Button */}
          <button
            onClick={handleResetClick}
            disabled={disabled}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-sky-600/20 hover:from-cyan-500/30 hover:to-sky-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white transition active:scale-95 disabled:opacity-50"
            title="Перезапустить партию"
          >
            <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90 duration-300" />
            <span className="text-xs font-bold tracking-wide hidden sm:inline">Новая игра</span>
          </button>

          {/* Game Mode Selector (2 Players vs AI) */}
          <button
            onClick={handleModeToggle}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition active:scale-95 disabled:opacity-50 ${
              mode === 'ai'
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 hover:border-purple-400'
                : 'bg-slate-800/80 border-white/10 text-slate-200 hover:border-white/20'
            }`}
            title="Переключить режим игры"
          >
            {mode === 'ai' ? (
              <>
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">Против ИИ</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">2 Игрока</span>
              </>
            )}
          </button>

          {/* AI Difficulty Selector (visible only when AI mode is active) */}
          {mode === 'ai' && (
            <div className="relative">
              <button
                onClick={() => {
                  playClick();
                  setShowDifficultyMenu(!showDifficultyMenu);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition active:scale-95 ${difficultyLabels[aiDifficulty].color}`}
                title="Сложность искусственного интеллекта"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{difficultyLabels[aiDifficulty].label}</span>
                <ChevronUp
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showDifficultyMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Difficulty dropdown menu */}
              {showDifficultyMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900/95 border border-purple-500/40 rounded-xl p-1.5 shadow-[0_0_24px_rgba(168,85,247,0.3)] backdrop-blur-md flex flex-col gap-1 animate-fadeIn">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => handleDifficultySelect(diff)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex flex-col gap-0.5 transition ${
                        aiDifficulty === diff
                          ? 'bg-purple-600/30 text-purple-200 border border-purple-400/40'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{difficultyLabels[diff].label}</span>
                        {aiDifficulty === diff && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {difficultyLabels[diff].desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="h-5 w-px bg-white/10 mx-0.5" />

          {/* Multiplayer Button */}
          {onOpenMultiplayer && (
            <button
              onClick={() => {
                playClick();
                onOpenMultiplayer();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition active:scale-95 ${
                isMultiplayerActive
                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-cyan-500/30 text-cyan-300'
              }`}
              title="Сетевая игра онлайн"
            >
              <Globe className={`w-4 h-4 ${isMultiplayerActive ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="text-xs font-bold">
                {isMultiplayerActive ? `Онлайн (${roomId})` : 'По сети'}
              </span>
            </button>
          )}

          {/* Reset Camera Button */}
          <button
            onClick={() => {
              playClick();
              onResetCamera();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition active:scale-95"
            title="Сбросить ракурс 3D камеры"
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-medium hidden md:inline">Камера</span>
          </button>

          {/* Audio Mute/Unmute Toggle */}
          <button
            onClick={handleAudioToggle}
            className={`flex items-center justify-center p-2 rounded-xl border transition active:scale-95 ${
              muted
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/50'
                : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
            }`}
            title={muted ? 'Включить звук' : 'Выключить звук'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => {
              playClick();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-amber-300 transition active:scale-95"
            title="Правила игры"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium hidden sm:inline">Правила</span>
          </button>
        </div>
      </div>
    </>
  );
};
