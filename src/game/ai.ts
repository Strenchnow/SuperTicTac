import { GameState, Player, ValidMove } from './types';
import { getValidMoves, makeMove, WINNING_LINES } from './engine';

const SECTOR_WEIGHTS = [200, 150, 200, 150, 300, 150, 200, 150, 200];
const CELL_WEIGHTS = [15, 5, 15, 5, 30, 5, 15, 5, 15];

/**
 * Checks if placing a mark in [cell] of [sector] achieves a 3-in-a-row for [player] in that sector.
 */
export function doesMoveWinSector(
  board: (Player | null)[][],
  sector: number,
  cell: number,
  player: Player
): boolean {
  for (const [a, b, c] of WINNING_LINES) {
    if (a === cell) {
      if (board[sector][b] === player && board[sector][c] === player) return true;
    } else if (b === cell) {
      if (board[sector][a] === player && board[sector][c] === player) return true;
    } else if (c === cell) {
      if (board[sector][a] === player && board[sector][b] === player) return true;
    }
  }
  return false;
}

/**
 * Checks if placing a mark in [cell] of [sector] prevents [opponent] from completing a 3-in-a-row.
 */
export function doesMoveBlockSector(
  board: (Player | null)[][],
  sector: number,
  cell: number,
  opponent: Player
): boolean {
  return doesMoveWinSector(board, sector, cell, opponent);
}

/**
 * Checks if winning [sector] will complete a global 3-in-a-row for [player].
 */
export function doesSectorWinGlobal(
  sectorWinners: (Player | 'TIE' | null)[],
  sector: number,
  player: Player
): boolean {
  for (const [a, b, c] of WINNING_LINES) {
    if (a === sector) {
      if (sectorWinners[b] === player && sectorWinners[c] === player) return true;
    } else if (b === sector) {
      if (sectorWinners[a] === player && sectorWinners[c] === player) return true;
    } else if (c === sector) {
      if (sectorWinners[a] === player && sectorWinners[b] === player) return true;
    }
  }
  return false;
}

/**
 * Heuristic evaluation function for a GameState from the perspective of aiPlayer.
 */
export function evaluateState(state: GameState, aiPlayer: Player, opponent: Player): number {
  if (state.winner === aiPlayer) return 100000;
  if (state.winner === opponent) return -100000;
  if (state.winner === 'TIE') return 0;

  let score = 0;

  // 1. Evaluate sector winners and global lines
  for (let s = 0; s < 9; s++) {
    const sw = state.sectorWinners[s];
    if (sw === aiPlayer) {
      score += SECTOR_WEIGHTS[s];
    } else if (sw === opponent) {
      score -= SECTOR_WEIGHTS[s];
    }
  }

  for (const [a, b, c] of WINNING_LINES) {
    const wA = state.sectorWinners[a];
    const wB = state.sectorWinners[b];
    const wC = state.sectorWinners[c];

    let aiCount = 0;
    let oppCount = 0;
    let tieCount = 0;

    for (const w of [wA, wB, wC]) {
      if (w === aiPlayer) aiCount++;
      else if (w === opponent) oppCount++;
      else if (w === 'TIE') tieCount++;
    }

    if (tieCount === 0) {
      if (aiCount > 0 && oppCount === 0) {
        if (aiCount === 2) score += 900;
        else if (aiCount === 1) score += 80;
      } else if (oppCount > 0 && aiCount === 0) {
        if (oppCount === 2) score -= 950;
        else if (oppCount === 1) score -= 80;
      }
    }
  }

  // 2. Evaluate active local boards
  for (let s = 0; s < 9; s++) {
    if (state.sectorWinners[s] !== null) continue;

    const sectorBoard = state.board[s];
    const sWeight = SECTOR_WEIGHTS[s] / 100;

    for (const [a, b, c] of WINNING_LINES) {
      const vA = sectorBoard[a];
      const vB = sectorBoard[b];
      const vC = sectorBoard[c];

      let aiLocal = 0;
      let oppLocal = 0;

      for (const v of [vA, vB, vC]) {
        if (v === aiPlayer) aiLocal++;
        else if (v === opponent) oppLocal++;
      }

      if (aiLocal > 0 && oppLocal === 0) {
        if (aiLocal === 2) score += 35 * sWeight;
        else if (aiLocal === 1) score += 6 * sWeight;
      } else if (oppLocal > 0 && aiLocal === 0) {
        if (oppLocal === 2) score -= 40 * sWeight;
        else if (oppLocal === 1) score -= 6 * sWeight;
      }
    }

    for (let c = 0; c < 9; c++) {
      const val = sectorBoard[c];
      if (val === aiPlayer) {
        score += CELL_WEIGHTS[c] * 0.2;
      } else if (val === opponent) {
        score -= CELL_WEIGHTS[c] * 0.2;
      }
    }
  }

  // 3. Free move advantage
  if (state.activeSector === null) {
    if (state.currentPlayer === aiPlayer) {
      score += 50;
    } else {
      score -= 50;
    }
  }

  return score;
}

/**
 * Move ordering function to optimize alpha-beta pruning branch cutoffs.
 */
export function orderMoves(
  state: GameState,
  moves: ValidMove[],
  player: Player,
  opponent: Player
): ValidMove[] {
  const scored = moves.map((move) => {
    let score = 0;
    const winsLocal = doesMoveWinSector(state.board, move.sector, move.cell, player);
    const blocksLocal = doesMoveBlockSector(state.board, move.sector, move.cell, opponent);

    if (winsLocal) {
      const winsGlobal = doesSectorWinGlobal(state.sectorWinners, move.sector, player);
      if (winsGlobal) {
        score += 1000000;
      } else {
        score += 5000;
      }
    }

    if (blocksLocal) {
      const blocksGlobal = doesSectorWinGlobal(state.sectorWinners, move.sector, opponent);
      if (blocksGlobal) {
        score += 500000;
      } else {
        score += 2500;
      }
    }

    // Check where this move sends opponent
    const targetSector = move.cell;
    const isTargetResolved =
      state.sectorWinners[targetSector] !== null ||
      (winsLocal && move.sector === targetSector);

    if (isTargetResolved) {
      // Sends opponent to a resolved board -> opponent gets free move!
      score -= 800;
    } else {
      // Check if target board allows opponent an immediate local win
      const oppCanWinTarget = WINNING_LINES.some(([a, b, c]) => {
        const tb = state.board[targetSector];
        return (
          (tb[a] === opponent && tb[b] === opponent && tb[c] === null) ||
          (tb[a] === opponent && tb[c] === opponent && tb[b] === null) ||
          (tb[b] === opponent && tb[c] === opponent && tb[a] === null)
        );
      });
      if (oppCanWinTarget) {
        score -= 400;
      }
    }

    // Positional preferences
    score += CELL_WEIGHTS[move.cell];
    score += SECTOR_WEIGHTS[move.sector] * 0.1;

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.move);
}

/**
 * Minimax algorithm with alpha-beta pruning and time safety guard.
 */
function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  opponent: Player,
  startTime: number,
  timeLimitMs: number
): number {
  if (
    state.winner !== null ||
    depth === 0 ||
    performance.now() - startTime > timeLimitMs
  ) {
    return evaluateState(state, aiPlayer, opponent);
  }

  const moves = getValidMoves(state);
  if (moves.length === 0) {
    return evaluateState(state, aiPlayer, opponent);
  }

  const orderedMoves = orderMoves(
    state,
    moves,
    isMaximizing ? aiPlayer : opponent,
    isMaximizing ? opponent : aiPlayer
  );

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      const nextState = makeMove(state, move.sector, move.cell);
      const evaluation = minimax(
        nextState,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
        opponent,
        startTime,
        timeLimitMs
      );
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cutoff
      if (performance.now() - startTime > timeLimitMs) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      const nextState = makeMove(state, move.sector, move.cell);
      const evaluation = minimax(
        nextState,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer,
        opponent,
        startTime,
        timeLimitMs
      );
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cutoff
      if (performance.now() - startTime > timeLimitMs) break;
    }
    return minEval;
  }
}

/**
 * Chooses the best move for the current player based on heuristic analysis and Minimax.
 */
export function getBestMove(state: GameState): ValidMove | null {
  if (state.winner !== null) return null;

  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  const aiPlayer = state.currentPlayer;
  const opponent = aiPlayer === 'X' ? 'O' : 'X';
  const difficulty = state.aiDifficulty || 'medium';

  // 1. Easy mode
  if (difficulty === 'easy') {
    // 50% chance to play completely randomly
    if (Math.random() < 0.5) {
      const randomIndex = Math.floor(Math.random() * validMoves.length);
      return validMoves[randomIndex];
    }

    // Otherwise check for immediate local win or block
    for (const move of validMoves) {
      if (doesMoveWinSector(state.board, move.sector, move.cell, aiPlayer)) {
        return move;
      }
    }
    for (const move of validMoves) {
      if (doesMoveBlockSector(state.board, move.sector, move.cell, opponent)) {
        return move;
      }
    }
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  // 2. Check for immediate global win first (always take it!)
  for (const move of validMoves) {
    if (doesMoveWinSector(state.board, move.sector, move.cell, aiPlayer)) {
      if (doesSectorWinGlobal(state.sectorWinners, move.sector, aiPlayer)) {
        return move;
      }
    }
  }

  // 3. Check for immediate global block (if opponent could win the game on next turn)
  for (const move of validMoves) {
    if (doesMoveBlockSector(state.board, move.sector, move.cell, opponent)) {
      if (doesSectorWinGlobal(state.sectorWinners, move.sector, opponent)) {
        return move;
      }
    }
  }

  // 4. Medium / Hard Minimax search
  const depth =
    difficulty === 'hard'
      ? validMoves.length <= 9
        ? 4
        : 3
      : validMoves.length <= 9
      ? 3
      : 2;

  const startTime = performance.now();
  const timeLimitMs = difficulty === 'hard' ? 200 : 100;

  const orderedMoves = orderMoves(state, validMoves, aiPlayer, opponent);

  let bestMove: ValidMove = orderedMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of orderedMoves) {
    const nextState = makeMove(state, move.sector, move.cell);
    const score = minimax(
      nextState,
      depth - 1,
      alpha,
      beta,
      false,
      aiPlayer,
      opponent,
      startTime,
      timeLimitMs
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    alpha = Math.max(alpha, bestScore);

    if (performance.now() - startTime > timeLimitMs) {
      break;
    }
  }

  return bestMove;
}
