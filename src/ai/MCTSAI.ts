/**
 * Monte Carlo Tree Search (MCTS) AI for Gomoku
 * Implements a trainable AI using MCTS algorithm with UCB1 selection
 */

import { AIPlayer, TrainableAI } from './AIPlayer';
import { Position, GameState, CellState, GameStatus } from '../game/types';
import { Board } from '../game/Board';
import { Game } from '../game/Game';
import * as fs from 'fs';
import * as path from 'path';

interface MCTSNodeData {
    position: Position | null;
    player: CellState.Black | CellState.White;
    visits: number;
    wins: number;
    children: MCTSNodeData[];
}

class MCTSNode {
    public position: Position | null; // null for root
    public player: CellState.Black | CellState.White;
    public visits: number;
    public wins: number;
    public children: MCTSNode[];
    public parent: MCTSNode | null;
    public untriedMoves: Position[];

    constructor(
        position: Position | null,
        player: CellState.Black | CellState.White,
        parent: MCTSNode | null = null,
        untriedMoves: Position[] = []
    ) {
        this.position = position;
        this.player = player;
        this.visits = 0;
        this.wins = 0;
        this.children = [];
        this.parent = parent;
        this.untriedMoves = [...untriedMoves];
    }

    public isFullyExpanded(): boolean {
        return this.untriedMoves.length === 0;
    }

    public getBestChild(explorationParam: number = Math.sqrt(2)): MCTSNode {
        return this.children.reduce((best, child) => {
            const childUCB = this.calculateUCB(child, explorationParam);
            const bestUCB = this.calculateUCB(best, explorationParam);
            return childUCB > bestUCB ? child : best;
        });
    }

    private calculateUCB(node: MCTSNode, explorationParam: number): number {
        if (node.visits === 0) {
            return Infinity;
        }
        const exploitation = node.wins / node.visits;
        const exploration = explorationParam * Math.sqrt(Math.log(this.visits) / node.visits);
        return exploitation + exploration;
    }

    public expand(game: Game): MCTSNode {
        const move = this.untriedMoves.pop()!;
        const nextPlayer = this.player === CellState.Black ? CellState.White : CellState.Black;
        
        // Make the move to get valid next moves
        const tempGame = this.cloneGame(game);
        tempGame.makeMove(move);
        
        const nextMoves = this.getValidMoves(tempGame.getBoard());
        const childNode = new MCTSNode(move, nextPlayer, this, nextMoves);
        this.children.push(childNode);
        
        return childNode;
    }

    private getValidMoves(board: Board): Position[] {
        const moves: Position[] = [];
        const size = board.getSize();
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const position = { row, col };
                if (board.isEmpty(position)) {
                    moves.push(position);
                }
            }
        }
        
        return moves;
    }

    private cloneGame(game: Game): Game {
        const newGame = new Game(game.getBoardSize());
        const moves = game.getMoveHistory();
        
        for (const move of moves) {
            newGame.makeMove(move.position);
        }
        
        return newGame;
    }

    public update(result: number): void {
        this.visits++;
        this.wins += result;
    }

    public toJSON(): MCTSNodeData {
        return {
            position: this.position,
            player: this.player,
            visits: this.visits,
            wins: this.wins,
            children: this.children.map(child => child.toJSON())
        };
    }

    public static fromJSON(data: MCTSNodeData, parent: MCTSNode | null = null): MCTSNode {
        const node = new MCTSNode(data.position, data.player, parent);
        node.visits = data.visits;
        node.wins = data.wins;
        node.children = data.children.map(childData => MCTSNode.fromJSON(childData, node));
        return node;
    }
}

export class MCTSAI implements TrainableAI {
    private simulations: number;
    private explorationParam: number;
    private knowledgeBase: Map<string, { visits: number; wins: number }>;

    constructor(simulations: number = 1000, explorationParam: number = Math.sqrt(2)) {
        this.simulations = simulations;
        this.explorationParam = explorationParam;
        this.knowledgeBase = new Map();
    }

    public getName(): string {
        return 'MCTS AI';
    }

    public chooseMove(gameState: GameState, board: Board): Position {
        const game = this.reconstructGame(gameState);
        const rootNode = new MCTSNode(
            null,
            gameState.currentPlayer,
            null,
            this.getValidMoves(board)
        );

        // Run MCTS simulations
        for (let i = 0; i < this.simulations; i++) {
            const node = this.select(rootNode, game);
            const result = this.simulate(node, game);
            this.backpropagate(node, result);
        }

        // Choose the move with the most visits (most explored)
        const bestChild = rootNode.children.reduce((best, child) => {
            return child.visits > best.visits ? child : best;
        });

        if (!bestChild.position) {
            throw new Error('No valid move found');
        }

        // Update knowledge base
        this.updateKnowledgeBase(gameState, bestChild.position, bestChild.wins, bestChild.visits);

        return bestChild.position;
    }

    private select(node: MCTSNode, game: Game): MCTSNode {
        const gameCopy = this.cloneGame(game);
        let currentNode = node;

        while (true) {
            // If node has untried moves, expand it
            if (!currentNode.isFullyExpanded()) {
                return currentNode.expand(gameCopy);
            }

            // If terminal node, return it
            if (currentNode.children.length === 0) {
                return currentNode;
            }

            // Select best child using UCB
            currentNode = currentNode.getBestChild(this.explorationParam);
            if (currentNode.position) {
                gameCopy.makeMove(currentNode.position);
            }

            // If game is over, return this node
            if (gameCopy.getStatus() !== GameStatus.InProgress) {
                return currentNode;
            }
        }
    }

    private simulate(node: MCTSNode, game: Game): number {
        const gameCopy = this.cloneGame(game);
        
        // Play through the path to this node
        let currentNode: MCTSNode | null = node;
        const path: Position[] = [];
        
        while (currentNode && currentNode.parent) {
            if (currentNode.position) {
                path.unshift(currentNode.position);
            }
            currentNode = currentNode.parent;
        }
        
        for (const move of path) {
            gameCopy.makeMove(move);
        }

        // Simulate random playout
        while (gameCopy.getStatus() === GameStatus.InProgress) {
            const validMoves = this.getValidMoves(gameCopy.getBoard());
            if (validMoves.length === 0) break;
            
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            gameCopy.makeMove(randomMove);
        }

        // Return result from perspective of node's player
        const status = gameCopy.getStatus();
        if (status === GameStatus.Draw) {
            return 0.5;
        }
        
        const winner = gameCopy.getWinner();
        return winner === node.player ? 1 : 0;
    }

    private backpropagate(node: MCTSNode | null, result: number): void {
        let currentNode = node;
        let currentResult = result;
        
        while (currentNode) {
            currentNode.update(currentResult);
            // In MCTS, each node represents a player to move. When we traverse up the tree,
            // we alternate between players at each level. Therefore, we must flip the result
            // at each level: a win for Black at one level is a loss for White at the parent level.
            currentResult = 1 - currentResult;
            currentNode = currentNode.parent;
        }
    }

    private getValidMoves(board: Board): Position[] {
        const moves: Position[] = [];
        const size = board.getSize();
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const position = { row, col };
                if (board.isEmpty(position)) {
                    moves.push(position);
                }
            }
        }
        
        return moves;
    }

    private reconstructGame(gameState: GameState): Game {
        const game = new Game(gameState.board.length);
        
        for (const move of gameState.moveHistory) {
            game.makeMove(move.position);
        }
        
        return game;
    }

    private cloneGame(game: Game): Game {
        const newGame = new Game(game.getBoardSize());
        const moves = game.getMoveHistory();
        
        for (const move of moves) {
            newGame.makeMove(move.position);
        }
        
        return newGame;
    }

    private getBoardStateKey(gameState: GameState): string {
        return JSON.stringify(gameState.board);
    }

    private updateKnowledgeBase(
        gameState: GameState,
        position: Position,
        wins: number,
        visits: number
    ): void {
        const key = this.getBoardStateKey(gameState) + `_${position.row}_${position.col}`;
        const existing = this.knowledgeBase.get(key);
        
        if (existing) {
            existing.visits += visits;
            existing.wins += wins;
        } else {
            this.knowledgeBase.set(key, { visits, wins });
        }
    }

    public train(gameHistory: GameState[][]): void {
        console.log(`Training MCTS AI with ${gameHistory.length} games...`);
        
        for (let i = 0; i < gameHistory.length; i++) {
            const game = gameHistory[i];
            const finalState = game[game.length - 1];
            
            // Learn from each position in the game
            for (const state of game) {
                // Store patterns from this game
                this.learnFromState(state, finalState.winner);
            }
            
            if ((i + 1) % 10 === 0) {
                console.log(`Processed ${i + 1}/${gameHistory.length} games`);
            }
        }
        
        console.log(`Training complete. Knowledge base size: ${this.knowledgeBase.size}`);
    }

    private learnFromState(state: GameState, winner: CellState | null): void {
        // This is a simplified learning approach
        // In a full implementation, this would update neural network weights
        // For now, we just accumulate statistics
        const key = this.getBoardStateKey(state);
        const result = winner === state.currentPlayer ? 1 : (winner === null ? 0.5 : 0);
        
        const existing = this.knowledgeBase.get(key);
        if (existing) {
            existing.visits++;
            existing.wins += result;
        } else {
            this.knowledgeBase.set(key, { visits: 1, wins: result });
        }
    }

    public saveModel(filepath: string): void {
        const modelData = {
            simulations: this.simulations,
            explorationParam: this.explorationParam,
            knowledgeBase: Array.from(this.knowledgeBase.entries())
        };
        
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, JSON.stringify(modelData, null, 2));
        console.log(`Model saved to ${filepath}`);
        console.log(`Knowledge base entries: ${this.knowledgeBase.size}`);
    }

    public loadModel(filepath: string): void {
        if (!fs.existsSync(filepath)) {
            throw new Error(`Model file not found: ${filepath}`);
        }
        
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        this.simulations = data.simulations;
        this.explorationParam = data.explorationParam;
        this.knowledgeBase = new Map(data.knowledgeBase);
        
        console.log(`Model loaded from ${filepath}`);
        console.log(`Knowledge base entries: ${this.knowledgeBase.size}`);
    }

    public setSimulations(simulations: number): void {
        this.simulations = simulations;
    }

    public getSimulations(): number {
        return this.simulations;
    }
}
