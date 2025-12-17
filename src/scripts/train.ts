/**
 * Training script for MCTS AI
 * Uses self-play to train the AI and saves the trained model
 */

import { Game } from '../game/Game';
import { GameState, GameStatus, CellState } from '../game/types';
import { MCTSAI } from '../ai/MCTSAI';
import * as path from 'path';

interface TrainingConfig {
    numGames: number;
    simulations: number;
    boardSize: number;
    modelPath: string;
    explorationParam?: number;
}

class Trainer {
    private ai1: MCTSAI;
    private ai2: MCTSAI;
    private config: TrainingConfig;
    private gameHistories: GameState[][];
    private stats: {
        blackWins: number;
        whiteWins: number;
        draws: number;
        totalMoves: number;
    };

    constructor(config: TrainingConfig) {
        this.config = config;
        this.ai1 = new MCTSAI(config.simulations, config.explorationParam);
        this.ai2 = new MCTSAI(config.simulations, config.explorationParam);
        this.gameHistories = [];
        this.stats = {
            blackWins: 0,
            whiteWins: 0,
            draws: 0,
            totalMoves: 0
        };
    }

    public async train(): Promise<void> {
        console.log('='.repeat(60));
        console.log('MCTS AI Training');
        console.log('='.repeat(60));
        console.log(`Configuration:`);
        console.log(`  - Number of games: ${this.config.numGames}`);
        console.log(`  - Simulations per move: ${this.config.simulations}`);
        console.log(`  - Board size: ${this.config.boardSize}x${this.config.boardSize}`);
        console.log(`  - Model path: ${this.config.modelPath}`);
        console.log('='.repeat(60));
        console.log('');

        const startTime = Date.now();

        for (let gameNum = 1; gameNum <= this.config.numGames; gameNum++) {
            const gameHistory = await this.playGame(gameNum);
            this.gameHistories.push(gameHistory);

            // Update stats
            const finalState = gameHistory[gameHistory.length - 1];
            this.stats.totalMoves += gameHistory.length;
            
            if (finalState.status === GameStatus.BlackWins) {
                this.stats.blackWins++;
            } else if (finalState.status === GameStatus.WhiteWins) {
                this.stats.whiteWins++;
            } else if (finalState.status === GameStatus.Draw) {
                this.stats.draws++;
            }

            // Print progress
            if (gameNum % 10 === 0 || gameNum === this.config.numGames) {
                this.printProgress(gameNum, startTime);
            }
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('Training games completed!');
        console.log('='.repeat(60));
        this.printFinalStats();

        // Train the AI with collected games
        console.log('');
        console.log('Training AI with game history...');
        this.ai1.train(this.gameHistories);

        // Save the model
        console.log('');
        console.log('Saving trained model...');
        this.ai1.saveModel(this.config.modelPath);

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('');
        console.log('='.repeat(60));
        console.log(`Training completed in ${totalTime} seconds!`);
        console.log('='.repeat(60));
    }

    private async playGame(gameNum: number): Promise<GameState[]> {
        const game = new Game(this.config.boardSize);
        const history: GameState[] = [];

        while (game.getStatus() === GameStatus.InProgress) {
            const currentPlayer = game.getCurrentPlayer();
            const ai = currentPlayer === CellState.Black ? this.ai1 : this.ai2;
            
            // Store state before move
            history.push(JSON.parse(JSON.stringify(game.getState())));
            
            // AI makes a move
            const move = ai.chooseMove(game.getState(), game.getBoard());
            game.makeMove(move);
        }

        // Store final state
        history.push(JSON.parse(JSON.stringify(game.getState())));

        return history;
    }

    private printProgress(gameNum: number, startTime: number): void {
        const progress = (gameNum / this.config.numGames * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const avgMoves = (this.stats.totalMoves / gameNum).toFixed(1);
        const blackWinRate = (this.stats.blackWins / gameNum * 100).toFixed(1);
        const whiteWinRate = (this.stats.whiteWins / gameNum * 100).toFixed(1);
        const drawRate = (this.stats.draws / gameNum * 100).toFixed(1);

        console.log(`[${progress}%] Game ${gameNum}/${this.config.numGames} | ` +
                    `Time: ${elapsed}s | Avg moves: ${avgMoves} | ` +
                    `Black: ${blackWinRate}% | White: ${whiteWinRate}% | Draw: ${drawRate}%`);
    }

    private printFinalStats(): void {
        console.log(`Total games played: ${this.config.numGames}`);
        console.log(`Total moves: ${this.stats.totalMoves}`);
        console.log(`Average moves per game: ${(this.stats.totalMoves / this.config.numGames).toFixed(2)}`);
        console.log('');
        console.log('Game outcomes:');
        console.log(`  Black wins: ${this.stats.blackWins} (${(this.stats.blackWins / this.config.numGames * 100).toFixed(1)}%)`);
        console.log(`  White wins: ${this.stats.whiteWins} (${(this.stats.whiteWins / this.config.numGames * 100).toFixed(1)}%)`);
        console.log(`  Draws: ${this.stats.draws} (${(this.stats.draws / this.config.numGames * 100).toFixed(1)}%)`);
    }
}

// Parse command line arguments
function parseArgs(): TrainingConfig | null {
    const args = process.argv.slice(2);
    const config: TrainingConfig = {
        numGames: 100,
        simulations: 500,
        boardSize: 15,
        modelPath: path.join(__dirname, '../../models/mcts_model.json')
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--games':
            case '-g':
                if (i + 1 >= args.length) {
                    throw new Error('--games requires a value');
                }
                const games = parseInt(args[++i]);
                if (isNaN(games) || games <= 0) {
                    throw new Error('--games must be a positive integer');
                }
                config.numGames = games;
                break;
            case '--simulations':
            case '-s':
                if (i + 1 >= args.length) {
                    throw new Error('--simulations requires a value');
                }
                const sims = parseInt(args[++i]);
                if (isNaN(sims) || sims <= 0) {
                    throw new Error('--simulations must be a positive integer');
                }
                config.simulations = sims;
                break;
            case '--board-size':
            case '-b':
                if (i + 1 >= args.length) {
                    throw new Error('--board-size requires a value');
                }
                const size = parseInt(args[++i]);
                if (isNaN(size) || size < 5 || size > 20) {
                    throw new Error('--board-size must be between 5 and 20');
                }
                config.boardSize = size;
                break;
            case '--output':
            case '-o':
                if (i + 1 >= args.length) {
                    throw new Error('--output requires a value');
                }
                config.modelPath = args[++i];
                break;
            case '--help':
            case '-h':
                console.log('Usage: npm run train -- [options]');
                console.log('');
                console.log('Options:');
                console.log('  -g, --games <number>        Number of training games (default: 100)');
                console.log('  -s, --simulations <number>  MCTS simulations per move (default: 500)');
                console.log('  -b, --board-size <number>   Board size (default: 15)');
                console.log('  -o, --output <path>         Output model path (default: models/mcts_model.json)');
                console.log('  -h, --help                  Show this help message');
                console.log('');
                console.log('Examples:');
                console.log('  npm run train -- --games 50 --simulations 1000');
                console.log('  npm run train -- -g 200 -s 500 -o models/my_model.json');
                return null;
        }
    }

    return config;
}

// Main execution
async function main(): Promise<number> {
    try {
        const config = parseArgs();
        if (!config) {
            // Help was displayed
            return 0;
        }
        const trainer = new Trainer(config);
        await trainer.train();
        return 0;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Training error:', error.message);
        } else {
            console.error('Training error:', error);
        }
        return 1;
    }
}

main().then(exitCode => process.exit(exitCode));
