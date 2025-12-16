/**
 * Types and interfaces for Gomoku game
 */

export enum CellState {
    Empty = 0,
    Black = 1,
    White = 2
}

export enum GameStatus {
    InProgress = 'in_progress',
    BlackWins = 'black_wins',
    WhiteWins = 'white_wins',
    Draw = 'draw'
}

export interface Position {
    row: number;
    col: number;
}

export interface Move {
    position: Position;
    player: CellState.Black | CellState.White;
}

export interface GameState {
    board: CellState[][];
    currentPlayer: CellState.Black | CellState.White;
    status: GameStatus;
    winner: CellState | null;
    lastMove: Position | null;
    moveHistory: Move[];
}
