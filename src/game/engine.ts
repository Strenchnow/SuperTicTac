import {
  CellValue,
  GameState,
  GameWinner,
  LineCheckResult,
  Move,
  Player,
  SectorWinner,
  ValidMove,
  AIDifficulty,
  GameMode,
} from './types';

export const WINNING_LINES: readonly [number, number, number][] = [
  [0, 1, 2], // Row 0
  [3, 4, 5], // Row 1
  [6, 7, 8], // Row 2
  [0, 3, 6], // Col 0
  [1, 4, 7], // Col 1
  [2, 5, 8], // Col 2
  [0, 4, 8], // Diagonal
  [2, 4, 6], // Anti-diagonal
];

/**
 * Checks for a 3-in-a-row winner on any 9-cell array (local board or global sector winners).
 */
export function checkLine(cells: (CellValue | SectorWinner)[]): LineCheckResult {
  for (const [a, b, c] of WINNING_LINES) {
    const valA = cells[a];
    const valB = cells[b];
    const valC = cells[c];
    if (valA && (valA === 'X' || valA === 'O') && valA === valB && valA === valC) {
      return { winner: valA, line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

/**
 * Returns true if all 9 cells in a local sector are non-null.
 */
export function isSectorFull(cells: CellValue[]): boolean {
  return cells.every((cell) => cell !== null);
}

/**
 * Creates a fresh GameState.
 */
export function createInitialState(
  mode: GameMode = 'pvp',
  aiPlayer: Player = 'O',
  aiDifficulty: AIDifficulty = 'medium'
): GameState {
  return {
    board: Array.from({ length: 9 }, () => Array(9).fill(null)),
    sectorWinners: Array(9).fill(null),
    activeSector: null, // Initial move is free across the entire board
    currentPlayer: 'X',
    winner: null,
    winningLine: null,
    history: [],
    mode,
    aiPlayer,
    aiDifficulty,
  };
}

/**
 * Validates whether a move can legally be played.
 */
export function isValidMove(state: GameState, sector: number, cell: number): boolean {
  if (state.winner !== null) return false;
  if (sector < 0 || sector > 8 || cell < 0 || cell > 8) return false;
  if (state.sectorWinners[sector] !== null) return false;
  if (state.board[sector][cell] !== null) return false;
  if (state.activeSector !== null && state.activeSector !== sector) return false;
  return true;
}

/**
 * Returns all valid moves for the current state.
 */
export function getValidMoves(state: GameState): ValidMove[] {
  if (state.winner !== null) return [];

  const moves: ValidMove[] = [];

  // If a specific activeSector is designated and not yet resolved/full
  if (
    state.activeSector !== null &&
    state.sectorWinners[state.activeSector] === null &&
    !isSectorFull(state.board[state.activeSector])
  ) {
    const s = state.activeSector;
    for (let c = 0; c < 9; c++) {
      if (state.board[s][c] === null) {
        moves.push({ sector: s, cell: c });
      }
    }
    return moves;
  }

  // Otherwise: free move across all open sectors
  for (let s = 0; s < 9; s++) {
    if (state.sectorWinners[s] === null && !isSectorFull(state.board[s])) {
      for (let c = 0; c < 9; c++) {
        if (state.board[s][c] === null) {
          moves.push({ sector: s, cell: c });
        }
      }
    }
  }

  return moves;
}

/**
 * Executes a move, updates local and global win states, updates activeSector, and passes turn.
 */
export function makeMove(state: GameState, sector: number, cell: number): GameState {
  if (!isValidMove(state, sector, cell)) {
    return state;
  }

  const currentPlayer = state.currentPlayer;

  // Clone board and place mark
  const newBoard = state.board.map((sec, i) => (i === sector ? [...sec] : sec));
  newBoard[sector][cell] = currentPlayer;

  // Clone sector winners
  const newSectorWinners = [...state.sectorWinners];
  let newWinner: GameWinner = null;
  let newWinningLine: number[] | null = null;

  // Check if this local sector was just won or tied
  const localCheck = checkLine(newBoard[sector]);
  if (localCheck.winner) {
    newSectorWinners[sector] = localCheck.winner;
  } else if (isSectorFull(newBoard[sector])) {
    newSectorWinners[sector] = 'TIE';
  }

  // Check if the global game has been won
  const globalCheck = checkLine(newSectorWinners);
  if (globalCheck.winner) {
    newWinner = globalCheck.winner;
    newWinningLine = globalCheck.line;
  } else if (newSectorWinners.every((sw) => sw !== null)) {
    newWinner = 'TIE';
  }

  // Calculate next active sector
  let nextActiveSector: number | null = null;
  if (!newWinner) {
    const targetSector = cell;
    const targetResolved = newSectorWinners[targetSector] !== null;
    const targetFull = isSectorFull(newBoard[targetSector]);

    if (targetResolved || targetFull) {
      nextActiveSector = null; // Free move!
    } else {
      nextActiveSector = targetSector;
    }
  }

  const nextPlayer: Player = currentPlayer === 'X' ? 'O' : 'X';

  const newHistory: Move[] = [
    ...state.history,
    { sector, cell, player: currentPlayer },
  ];

  const nextState: GameState = {
    ...state,
    board: newBoard,
    sectorWinners: newSectorWinners,
    activeSector: nextActiveSector,
    currentPlayer: nextPlayer,
    winner: newWinner,
    winningLine: newWinningLine,
    history: newHistory,
  };

  // If game is not yet won but no legal moves remain anywhere, it's a TIE
  if (!nextState.winner && getValidMoves(nextState).length === 0) {
    nextState.winner = 'TIE';
    nextState.activeSector = null;
  }

  return nextState;
}

/**
 * Resets the game to initial state preserving settings.
 */
export function resetGame(state: GameState): GameState {
  return createInitialState(state.mode, state.aiPlayer, state.aiDifficulty);
}
