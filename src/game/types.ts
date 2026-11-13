export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type SectorWinner = Player | 'TIE' | null;
export type GameWinner = Player | 'TIE' | null;
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'pvp' | 'ai';

export interface Move {
  sector: number;
  cell: number;
  player: Player;
}

export interface GameState {
  board: CellValue[][];
  sectorWinners: SectorWinner[];
  activeSector: number | null;
  currentPlayer: Player;
  winner: GameWinner;
  winningLine: number[] | null;
  history: Move[];
  mode: GameMode;
  aiPlayer: Player;
  aiDifficulty: AIDifficulty;
}

export interface LineCheckResult {
  winner: Player | null;
  line: number[] | null;
}

export interface ValidMove {
  sector: number;
  cell: number;
}
