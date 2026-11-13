import React, { useState, useEffect } from 'react';
import { X, Users, Copy, Check, LogOut, Loader2, ArrowRight } from 'lucide-react';
import { Player } from '../../game/types';

export interface MultiplayerPlayer {
  id: string;
  player: Player;
  name: string;
}

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  myRole: Player | null;
  players: MultiplayerPlayer[];
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onLeaveRoom: () => void;
  errorMessage: string | null;
  isLoading: boolean;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  roomId,
  myRole,
  players,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  errorMessage,
  isLoading,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('Пилот');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If room is present in URL search params (e.g. ?room=XYZ)
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl && !roomId) {
      setRoomCodeInput(roomFromUrl.toUpperCase());
      setTab('join');
    }
  }, [roomId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(playerName.trim() || 'Пилот 1');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    onJoinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim() || 'Пилот 2');
  };

  const playerX = players.find((p) => p.player === 'X');
  const playerO = players.find((p) => p.player === 'O');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-950/50 text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider text-cyan-400 font-mono">
                СЕТЕВАЯ ИГРА
              </h2>
              <p className="text-xs text-slate-400">Онлайн-дуэль в реальном времени</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Room active view */}
        {roomId ? (
          <div className="space-y-6">
            {/* Room code banner */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
              <span className="text-xs text-slate-400 tracking-wider uppercase font-mono">
                Код комнаты
              </span>
              <div className="text-3xl font-extrabold tracking-widest text-cyan-300 font-mono">
                {roomId}
              </div>
              <p className="text-xs text-slate-400 text-center">
                Отправьте этот код или ссылку другу для подключения
              </p>
              <button
                onClick={handleCopyLink}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-sm font-medium transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Ссылка скопирована!' : 'Скопировать ссылку-приглашение'}
              </button>
            </div>

            {/* Players list */}
            <div className="space-y-3">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                Игроки в матче:
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Player X */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all ${
                    myRole === 'X'
                      ? 'bg-cyan-500/15 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 font-mono">КРЕСТИКИ (X)</span>
                    {myRole === 'X' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-300 font-mono">
                        ВЫ
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-200 truncate">
                    {playerX ? playerX.name : 'Ожидание...'}
                  </div>
                </div>

                {/* Player O */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-1 transition-all ${
                    myRole === 'O'
                      ? 'bg-rose-500/15 border-rose-400/60 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 font-mono">НОЛИКИ (O)</span>
                    {myRole === 'O' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 font-mono">
                        ВЫ
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-200 truncate">
                    {playerO ? (
                      playerO.name
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 font-normal">
                        <Loader2 size={13} className="animate-spin text-rose-400" />
                        Ожидание...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Leave room button */}
            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={onLeaveRoom}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 text-sm transition-all border border-slate-700 hover:border-rose-500/40"
              >
                <LogOut size={16} />
                Покинуть комнату
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/30"
              >
                К игре
              </button>
            </div>
          </div>
        ) : (
          /* Lobby view (create or join) */
          <div className="space-y-5">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              <button
                onClick={() => setTab('create')}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === 'create'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Создать комнату
              </button>
              <button
                onClick={() => setTab('join')}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === 'join'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Войти по коду
              </button>
            </div>

            {/* Player Name Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 tracking-wider font-mono uppercase">
                Ваш позывной / Имя:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Например, Кибер-Рейнджер"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-200 text-sm outline-none transition-colors"
              />
            </div>

            {tab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Сервер сгенерирует уникальную приватную комнату. Вы будете ходить первым (за
                  синие крестики X) и сможете отправить ссылку напарнику.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Создать комнату и получить ссылку <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 tracking-wider font-mono uppercase">
                    Код комнаты:
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="Например, X9K2L1"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-200 text-center font-mono text-lg tracking-widest outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !roomCodeInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-slate-100 font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Подключиться к игре <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
