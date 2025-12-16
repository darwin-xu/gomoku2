/**
 * AI Player interface for Gomoku
 * This interface allows for different AI implementations and training
 */

import { Position, CellState, GameState } from '../game/types';
import { Board } from '../game/Board';

export interface AIPlayer {
    /**
     * Choose the next move based on the current game state
     * @param gameState Current game state
     * @param board Current board
     * @returns Position for the next move
     */
    chooseMove(gameState: GameState, board: Board): Position;

    /**
     * Get the name/type of this AI
     */
    getName(): string;
}

/**
 * Training interface for AI players
 * This allows future implementation of reinforcement learning or other training methods
 */
export interface TrainableAI extends AIPlayer {
    /**
     * Train the AI with game data
     * @param gameHistory Array of game states from completed games
     */
    train(gameHistory: GameState[][]): void;

    /**
     * Save the trained model
     * @param path Path to save the model
     */
    saveModel(path: string): void;

    /**
     * Load a trained model
     * @param path Path to load the model from
     */
    loadModel(path: string): void;
}
