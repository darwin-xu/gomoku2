/**
 * Simple random AI player for testing
 */

import { AIPlayer } from './AIPlayer';
import { Position, GameState } from '../game/types';
import { Board } from '../game/Board';

export class RandomAI implements AIPlayer {
    public getName(): string {
        return 'Random AI';
    }

    public chooseMove(gameState: GameState, board: Board): Position {
        const emptyPositions: Position[] = [];
        const size = board.getSize();

        // Find all empty positions
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const position = { row, col };
                if (board.isEmpty(position)) {
                    emptyPositions.push(position);
                }
            }
        }

        if (emptyPositions.length === 0) {
            throw new Error('No valid moves available');
        }

        // Choose a random empty position
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        return emptyPositions[randomIndex];
    }
}
