/**
 * Gomoku game board implementation
 */

import { CellState, Position, GameStatus } from './types';

export class Board {
    private board: CellState[][];
    private readonly size: number;

    constructor(size: number = 15) {
        this.size = size;
        this.board = this.createEmptyBoard();
    }

    private createEmptyBoard(): CellState[][] {
        return Array.from({ length: this.size }, () =>
            Array.from({ length: this.size }, () => CellState.Empty)
        );
    }

    public getSize(): number {
        return this.size;
    }

    public getBoard(): CellState[][] {
        return this.board.map(row => [...row]);
    }

    public getCell(position: Position): CellState {
        return this.board[position.row][position.col];
    }

    public isValidPosition(position: Position): boolean {
        return (
            position.row >= 0 &&
            position.row < this.size &&
            position.col >= 0 &&
            position.col < this.size
        );
    }

    public isEmpty(position: Position): boolean {
        return this.isValidPosition(position) && this.getCell(position) === CellState.Empty;
    }

    public placeStone(position: Position, player: CellState.Black | CellState.White): boolean {
        if (!this.isEmpty(position)) {
            return false;
        }
        this.board[position.row][position.col] = player;
        return true;
    }

    public checkWin(position: Position, player: CellState.Black | CellState.White): boolean {
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal \
            { dr: 1, dc: -1 }  // Diagonal /
        ];

        for (const { dr, dc } of directions) {
            if (this.countConsecutive(position, player, dr, dc) >= 5) {
                return true;
            }
        }

        return false;
    }

    private countConsecutive(
        position: Position,
        player: CellState.Black | CellState.White,
        dr: number,
        dc: number
    ): number {
        let count = 1; // Count the placed stone

        // Count in positive direction
        count += this.countInDirection(position, player, dr, dc);

        // Count in negative direction
        count += this.countInDirection(position, player, -dr, -dc);

        return count;
    }

    private countInDirection(
        position: Position,
        player: CellState.Black | CellState.White,
        dr: number,
        dc: number
    ): number {
        let count = 0;
        let r = position.row + dr;
        let c = position.col + dc;

        while (
            r >= 0 &&
            r < this.size &&
            c >= 0 &&
            c < this.size &&
            this.board[r][c] === player
        ) {
            count++;
            r += dr;
            c += dc;
        }

        return count;
    }

    public isFull(): boolean {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === CellState.Empty) {
                    return false;
                }
            }
        }
        return true;
    }

    public reset(): void {
        this.board = this.createEmptyBoard();
    }

    public clone(): Board {
        const clonedBoard = new Board(this.size);
        clonedBoard.board = this.board.map(row => [...row]);
        return clonedBoard;
    }
}
