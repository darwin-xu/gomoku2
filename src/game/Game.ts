/**
 * Gomoku game logic and state management
 */

import { Board } from './Board';
import { CellState, GameState, GameStatus, Position, Move } from './types';

export class Game {
    private board: Board;
    private currentPlayer: CellState.Black | CellState.White;
    private status: GameStatus;
    private winner: CellState | null;
    private lastMove: Position | null;
    private moveHistory: Move[];

    constructor(boardSize: number = 15) {
        this.board = new Board(boardSize);
        this.currentPlayer = CellState.Black;
        this.status = GameStatus.InProgress;
        this.winner = null;
        this.lastMove = null;
        this.moveHistory = [];
    }

    public makeMove(position: Position): boolean {
        if (this.status !== GameStatus.InProgress) {
            return false;
        }

        if (!this.board.placeStone(position, this.currentPlayer)) {
            return false;
        }

        // Record the move
        this.moveHistory.push({
            position: { ...position },
            player: this.currentPlayer
        });
        this.lastMove = position;

        // Check for win
        if (this.board.checkWin(position, this.currentPlayer)) {
            this.status = this.currentPlayer === CellState.Black
                ? GameStatus.BlackWins
                : GameStatus.WhiteWins;
            this.winner = this.currentPlayer;
        } else if (this.board.isFull()) {
            this.status = GameStatus.Draw;
        } else {
            // Switch player
            this.currentPlayer = this.currentPlayer === CellState.Black
                ? CellState.White
                : CellState.Black;
        }

        return true;
    }

    public getState(): GameState {
        return {
            board: this.board.getBoard(),
            currentPlayer: this.currentPlayer,
            status: this.status,
            winner: this.winner,
            lastMove: this.lastMove ? { ...this.lastMove } : null,
            moveHistory: [...this.moveHistory]
        };
    }

    public getCurrentPlayer(): CellState.Black | CellState.White {
        return this.currentPlayer;
    }

    public getStatus(): GameStatus {
        return this.status;
    }

    public getWinner(): CellState | null {
        return this.winner;
    }

    public getBoard(): Board {
        return this.board;
    }

    public getBoardSize(): number {
        return this.board.getSize();
    }

    public reset(): void {
        this.board.reset();
        this.currentPlayer = CellState.Black;
        this.status = GameStatus.InProgress;
        this.winner = null;
        this.lastMove = null;
        this.moveHistory = [];
    }

    public isValidMove(position: Position): boolean {
        return this.status === GameStatus.InProgress && this.board.isEmpty(position);
    }

    public getLastMove(): Position | null {
        return this.lastMove ? { ...this.lastMove } : null;
    }

    public getMoveHistory(): Move[] {
        return [...this.moveHistory];
    }
}
