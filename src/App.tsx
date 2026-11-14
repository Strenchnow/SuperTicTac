import { useState, useRef, useEffect, useCallback } from 'react';
import type { GameState, GameMode, AIDifficulty, Player } from './game/types';
import { createInitialState, isValidMove, makeMove } from './game/engine';
import { getBestMove } from './game/ai';
import { Scene, type SceneRef } from './components/3d';
import { Navbar, Controls, RulesModal, VictoryModal, MultiplayerModal, type MultiplayerPlayer } from './components/ui';
import { playMove, playSectorWin, playGameWin, playInvalid, playClick } from './utils/audio';
import { socket } from './network/socket';
import { playhop } from './utils/playhop';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState('pvp', 'O', 'medium')
  );
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState<number>(0);

  // Multiplayer States
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Player | null>(null);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<MultiplayerPlayer[]>([]);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [isMultiplayerLoading, setIsMultiplayerLoading] = useState<boolean>(false);

  const sceneRef = useRef<SceneRef>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check URL parameters for direct room joining (?room=CODE)
  useEffect(() => {
    // Initialize Playhop SDK
    playhop.init();

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setIsMultiplayerOpen(true);
    }
  }, []);

  // Setup Socket.io Event Listeners
  useEffect(() => {
    function onRoomCreated(data: {
      roomId: string;
      player: Player;
      gameState: GameState;
      players: MultiplayerPlayer[];
    }) {
      setRoomId(data.roomId);
      setMyRole(data.player);
      setGameState(data.gameState);
      setMultiplayerPlayers(data.players);
      setIsMultiplayerLoading(false);
      setMultiplayerError(null);
      // Update browser URL without reloading
      const newUrl = `${window.location.pathname}?room=${data.roomId}`;
      window.history.replaceState(null, '', newUrl);
    }

    function onRoomJoined(data: {
      roomId: string;
      player: Player;
      gameState: GameState;
      players: MultiplayerPlayer[];
    }) {
      setRoomId(data.roomId);
      setMyRole(data.player);
      setGameState(data.gameState);
      setMultiplayerPlayers(data.players);
      setIsMultiplayerLoading(false);
      setMultiplayerError(null);
      const newUrl = `${window.location.pathname}?room=${data.roomId}`;
      window.history.replaceState(null, '', newUrl);
    }

    function onPlayerJoined(data: { newPlayer: MultiplayerPlayer; players: MultiplayerPlayer[] }) {
      setMultiplayerPlayers(data.players);
    }

    function onPlayerLeft(data: { players: MultiplayerPlayer[] }) {
      setMultiplayerPlayers(data.players);
    }

    function onMoveMade(data: {
      sector: number;
      cell: number;
      player: Player;
      gameState: GameState;
    }) {
      setGameState((prevState) => {
        const prevSectors = prevState.sectorWinners;
        const newSectorWon =
          data.gameState.sectorWinners[data.sector] !== null &&
          prevSectors[data.sector] === null;

        if (data.gameState.winner) {
          playGameWin();
        } else if (newSectorWon) {
          playSectorWin();
        } else {
          playMove(data.player);
        }
        return data.gameState;
      });
    }

    function onGameRestarted(data: { gameState: GameState }) {
      setGameState(data.gameState);
      setGameStartTime(null);
      setGameDuration(0);
    }

    function onErrorMessage(data: { message: string }) {
      setMultiplayerError(data.message);
      setIsMultiplayerLoading(false);
    }

    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('move_made', onMoveMade);
    socket.on('game_restarted', onGameRestarted);
    socket.on('error_message', onErrorMessage);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('move_made', onMoveMade);
      socket.off('game_restarted', onGameRestarted);
      socket.off('error_message', onErrorMessage);
    };
  }, []);

  // Active game timer
  useEffect(() => {
    if (!gameStartTime || gameState.winner !== null) return;

    const timer = setInterval(() => {
      setGameDuration(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime, gameState.winner]);

  // Handle Playhop gameplay lifecycle and interstitial ad on game end
  useEffect(() => {
    if (gameState.winner !== null) {
      playhop.notifyGameplayStop();
      const adTimer = setTimeout(() => {
        playhop.showFullscreenAd();
      }, 1500);
      return () => clearTimeout(adTimer);
    } else {
      playhop.notifyGameplayStart();
    }
  }, [gameState.winner]);

  // Clean up any pending AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Multiplayer Actions
  const handleCreateRoom = useCallback((name: string) => {
    setIsMultiplayerLoading(true);
    setMultiplayerError(null);
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('create_room', { playerName: name });
  }, []);

  const handleJoinRoom = useCallback((code: string, name: string) => {
    setIsMultiplayerLoading(true);
    setMultiplayerError(null);
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join_room', { roomId: code, playerName: name });
  }, []);

  const handleLeaveRoom = useCallback(() => {
    playClick();
    if (socket.connected) {
      socket.disconnect();
    }
    setRoomId(null);
    setMyRole(null);
    setMultiplayerPlayers([]);
    setMultiplayerError(null);
    setIsMultiplayerLoading(false);
    setGameState(createInitialState('pvp', 'O', 'medium'));
    // Clear URL search param
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Reset / New Game
  const handleResetGame = useCallback(() => {
    if (roomId) {
      socket.emit('restart_game', { roomId });
      return;
    }

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setGameState((prev) =>
      createInitialState(prev.mode, prev.aiPlayer, prev.aiDifficulty)
    );
    setIsAiThinking(false);
    setGameStartTime(null);
    setGameDuration(0);
  }, [roomId]);

  // Mode change handler (PvP vs AI)
  const handleChangeMode = useCallback((newMode: GameMode) => {
    setGameState((prev) => ({
      ...prev,
      mode: newMode,
    }));
  }, []);

  // AI Difficulty change handler
  const handleChangeDifficulty = useCallback((newDifficulty: AIDifficulty) => {
    setGameState((prev) => ({
      ...prev,
      aiDifficulty: newDifficulty,
    }));
  }, []);

  // Validity checker for 3D cells and ghost preview
  const checkValidMove = useCallback(
    (sector: number, cell: number): boolean => {
      if (gameState.winner !== null || isAiThinking) return false;

      // In Multiplayer mode
      if (roomId) {
        if (multiplayerPlayers.length < 2) return false;
        if (myRole !== gameState.currentPlayer) return false;
        return isValidMove(gameState, sector, cell);
      }

      // In AI mode
      if (gameState.mode === 'ai' && gameState.currentPlayer === gameState.aiPlayer) {
        return false;
      }

      return isValidMove(gameState, sector, cell);
    },
    [gameState, isAiThinking, roomId, multiplayerPlayers.length, myRole]
  );

  // AI Move Execution
  const triggerAiMove = useCallback(() => {
    setIsAiThinking(true);

    aiTimeoutRef.current = setTimeout(() => {
      setGameState((latestState) => {
        if (
          latestState.winner !== null ||
          latestState.mode !== 'ai' ||
          latestState.currentPlayer !== latestState.aiPlayer
        ) {
          setIsAiThinking(false);
          return latestState;
        }

        const aiMove = getBestMove(latestState);
        if (!aiMove) {
          setIsAiThinking(false);
          return latestState;
        }

        const prevSectors = latestState.sectorWinners;
        const nextState = makeMove(latestState, aiMove.sector, aiMove.cell);

        const newSectorWon =
          nextState.sectorWinners[aiMove.sector] !== null &&
          prevSectors[aiMove.sector] === null;

        if (nextState.winner) {
          playGameWin();
        } else if (newSectorWon) {
          playSectorWin();
        } else {
          playMove(latestState.currentPlayer);
        }

        setIsAiThinking(false);
        return nextState;
      });
    }, 400);
  }, []);

  // Player move handler (click on 3D cell)
  const handleCellClick = useCallback(
    (sector: number, cell: number) => {
      // Disallow moves if game is already decided
      if (gameState.winner !== null) {
        return;
      }

      // Multiplayer Room Move
      if (roomId) {
        if (multiplayerPlayers.length < 2) {
          playInvalid();
          return;
        }
        if (myRole !== gameState.currentPlayer) {
          playInvalid();
          return;
        }
        if (!isValidMove(gameState, sector, cell)) {
          playInvalid();
          return;
        }

        if (!gameStartTime) {
          setGameStartTime(Date.now());
        }

        // Send move to server
        socket.emit('make_move', { roomId, sector, cell });
        return;
      }

      // Local / AI Game Move
      if (isAiThinking) return;
      if (gameState.mode === 'ai' && gameState.currentPlayer === gameState.aiPlayer) {
        return;
      }

      if (!isValidMove(gameState, sector, cell)) {
        playInvalid();
        return;
      }

      if (!gameStartTime) {
        setGameStartTime(Date.now());
      }

      const prevSectors = gameState.sectorWinners;
      const nextState = makeMove(gameState, sector, cell);

      const newSectorWon =
        nextState.sectorWinners[sector] !== null &&
        prevSectors[sector] === null;

      if (nextState.winner) {
        playGameWin();
      } else if (newSectorWon) {
        playSectorWin();
      } else {
        playMove(gameState.currentPlayer);
      }

      setGameState(nextState);

      if (
        nextState.mode === 'ai' &&
        nextState.winner === null &&
        nextState.currentPlayer === nextState.aiPlayer
      ) {
        triggerAiMove();
      }
    },
    [
      gameState,
      roomId,
      multiplayerPlayers.length,
      myRole,
      gameStartTime,
      isAiThinking,
      triggerAiMove,
    ]
  );

  // If user switched mode to AI during an active game on AI's turn
  useEffect(() => {
    if (
      !roomId &&
      gameState.mode === 'ai' &&
      gameState.winner === null &&
      gameState.currentPlayer === gameState.aiPlayer &&
      !isAiThinking
    ) {
      triggerAiMove();
    }
  }, [
    roomId,
    gameState.mode,
    gameState.currentPlayer,
    gameState.aiPlayer,
    gameState.winner,
    isAiThinking,
    triggerAiMove,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D Ultimate Tic-Tac-Toe Canvas */}
      <div className="fixed inset-0 w-full h-full overflow-hidden">
        <Scene
          ref={sceneRef}
          gameState={gameState}
          onMove={handleCellClick}
          isValidMove={checkValidMove}
          className="w-full h-full"
        />
      </div>

      {/* Top Navbar */}
      <Navbar
        currentPlayer={gameState.currentPlayer}
        activeSector={gameState.activeSector}
        winner={gameState.winner}
        isAiThinking={isAiThinking}
        mode={gameState.mode}
        aiPlayer={gameState.aiPlayer}
        isMultiplayer={Boolean(roomId)}
        myRole={myRole}
        roomCode={roomId}
      />

      {/* Bottom Floating Cyber-Dock Controls */}
      <Controls
        mode={gameState.mode}
        aiDifficulty={gameState.aiDifficulty}
        onChangeMode={handleChangeMode}
        onChangeDifficulty={handleChangeDifficulty}
        onResetGame={handleResetGame}
        onResetCamera={() => sceneRef.current?.resetCamera()}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenMultiplayer={() => setIsMultiplayerOpen(true)}
        isMultiplayerActive={Boolean(roomId)}
        roomId={roomId}
        disabled={isAiThinking || Boolean(roomId && myRole !== gameState.currentPlayer)}
      />

      {/* Rules & Tutorial Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Multiplayer Lobby Modal */}
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        roomId={roomId}
        myRole={myRole}
        players={multiplayerPlayers}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        errorMessage={multiplayerError}
        isLoading={isMultiplayerLoading}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        winner={gameState.winner}
        winningLine={gameState.winningLine}
        movesCount={gameState.history.length}
        history={gameState.history}
        durationSeconds={gameDuration}
        mode={gameState.mode}
        aiPlayer={gameState.aiPlayer}
        onPlayAgain={handleResetGame}
      />
    </main>
  );
}
