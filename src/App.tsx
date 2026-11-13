import { useState, useRef, useEffect, useCallback } from 'react';
import type { GameState, GameMode, AIDifficulty } from './game/types';
import { createInitialState, isValidMove, makeMove } from './game/engine';
import { getBestMove } from './game/ai';
import { Scene, type SceneRef } from './components/3d';
import { Navbar, Controls, RulesModal, VictoryModal } from './components/ui';
import { playMove, playSectorWin, playGameWin, playInvalid } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState('pvp', 'O', 'medium')
  );
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState<number>(0);

  const sceneRef = useRef<SceneRef>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active game timer
  useEffect(() => {
    if (!gameStartTime || gameState.winner !== null) return;

    const timer = setInterval(() => {
      setGameDuration(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime, gameState.winner]);

  // Clean up any pending AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Reset / New Game
  const handleResetGame = useCallback(() => {
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
  }, []);

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
      if (gameState.mode === 'ai' && gameState.currentPlayer === gameState.aiPlayer) {
        return false;
      }
      return isValidMove(gameState, sector, cell);
    },
    [gameState, isAiThinking]
  );

  // AI Move Execution
  const triggerAiMove = useCallback(() => {
    setIsAiThinking(true);

    aiTimeoutRef.current = setTimeout(() => {
      setGameState((latestState) => {
        // Verify state is still active and valid for AI move
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

  // Human player move handler
  const handleCellClick = useCallback(
    (sector: number, cell: number) => {
      // Disallow moves if game is already decided or AI is computing
      if (gameState.winner !== null || isAiThinking) {
        return;
      }

      // Disallow clicking during AI turn in AI mode
      if (gameState.mode === 'ai' && gameState.currentPlayer === gameState.aiPlayer) {
        return;
      }

      // Check move legality
      if (!isValidMove(gameState, sector, cell)) {
        playInvalid();
        return;
      }

      // Start duration clock on the first move made
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

      // Trigger AI turn if game is still going and next player is AI
      if (
        nextState.mode === 'ai' &&
        nextState.winner === null &&
        nextState.currentPlayer === nextState.aiPlayer
      ) {
        triggerAiMove();
      }
    },
    [gameState, isAiThinking, gameStartTime, triggerAiMove]
  );

  // If user switched mode to AI during an active game on AI's turn
  useEffect(() => {
    if (
      gameState.mode === 'ai' &&
      gameState.winner === null &&
      gameState.currentPlayer === gameState.aiPlayer &&
      !isAiThinking
    ) {
      triggerAiMove();
    }
  }, [
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
        disabled={isAiThinking}
      />

      {/* Rules & Tutorial Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
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
