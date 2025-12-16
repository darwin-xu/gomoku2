/**
 * Interactive play script for playing against trained MCTS AI
 * Allows human vs AI gameplay through command line interface
 */

import { Game } from '../game/Game';
import { CellState, GameStatus } from '../game/types';
import { MCTSAI } from '../ai/MCTSAI';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';

class InteractiveGame {
    private game: Game;
    private ai: MCTSAI;
    private humanPlayer: CellState.Black | CellState.White;
    private rl: readline.Interface;
    private shouldQuit: boolean;

    constructor(modelPath: string, humanColor: 'black' | 'white', simulations: number = 1000) {
        this.game = new Game(15);
        this.ai = new MCTSAI(simulations);
        this.humanPlayer = humanColor === 'black' ? CellState.Black : CellState.White;
        this.shouldQuit = false;
        
        // Load trained model if it exists
        if (fs.existsSync(modelPath)) {
            console.log(`Loading trained model from ${modelPath}...`);
            this.ai.loadModel(modelPath);
        } else {
            console.log(`Warning: Model file not found at ${modelPath}`);
            console.log('Using untrained MCTS AI with random playouts.');
        }

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    public async play(): Promise<void> {
        console.log('\n' + '='.repeat(60));
        console.log('Gomoku - Human vs AI');
        console.log('='.repeat(60));
        console.log(`You are playing as: ${this.humanPlayer === CellState.Black ? 'Black (●)' : 'White (○)'}`);
        console.log(`AI is playing as: ${this.humanPlayer === CellState.Black ? 'White (○)' : 'Black (●)'}`);
        console.log('Black plays first!');
        console.log('='.repeat(60));
        console.log('');

        await this.gameLoop();
        this.rl.close();
    }

    private async gameLoop(): Promise<void> {
        while (this.game.getStatus() === GameStatus.InProgress && !this.shouldQuit) {
            this.printBoard();
            
            const currentPlayer = this.game.getCurrentPlayer();
            
            if (currentPlayer === this.humanPlayer) {
                await this.humanTurn();
            } else {
                await this.aiTurn();
            }
        }

        // Game over or user quit
        if (!this.shouldQuit) {
            this.printBoard();
            this.printGameResult();
        }
    }

    private printBoard(): void {
        const board = this.game.getState().board;
        const size = board.length;

        // Print column numbers
        console.log('\n   ' + Array.from({ length: size }, (_, i) => 
            i.toString().padStart(2, ' ')).join(' '));
        console.log('  ┌' + '──┬'.repeat(size - 1) + '──┐');

        for (let row = 0; row < size; row++) {
            let rowStr = row.toString().padStart(2, ' ') + '│';
            for (let col = 0; col < size; col++) {
                const cell = board[row][col];
                let symbol = '  ';
                
                if (cell === CellState.Black) {
                    symbol = ' ●';
                } else if (cell === CellState.White) {
                    symbol = ' ○';
                }
                
                rowStr += symbol + '│';
            }
            console.log(rowStr);
            
            if (row < size - 1) {
                console.log('  ├' + '──┼'.repeat(size - 1) + '──┤');
            }
        }

        console.log('  └' + '──┴'.repeat(size - 1) + '──┘');
    }

    private async humanTurn(): Promise<void> {
        const playerName = this.humanPlayer === CellState.Black ? 'Black' : 'White';
        console.log(`\n${playerName}'s turn (You)`);
        
        let validMove = false;
        
        while (!validMove) {
            const input = await this.prompt('Enter move (row col), e.g., "7 7": ');
            
            if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
                console.log('Game terminated by user.');
                this.shouldQuit = true;
                return;
            }

            const parts = input.trim().split(/\s+/);
            if (parts.length !== 2) {
                console.log('Invalid input. Please enter row and column separated by space.');
                continue;
            }

            const row = parseInt(parts[0]);
            const col = parseInt(parts[1]);

            if (isNaN(row) || isNaN(col)) {
                console.log('Invalid input. Please enter numbers.');
                continue;
            }

            const position = { row, col };
            
            if (!this.game.isValidMove(position)) {
                console.log('Invalid move. Position is out of bounds or already occupied.');
                continue;
            }

            this.game.makeMove(position);
            validMove = true;
        }
    }

    private async aiTurn(): Promise<void> {
        const playerName = this.humanPlayer === CellState.Black ? 'White' : 'Black';
        console.log(`\n${playerName}'s turn (AI)`);
        console.log('AI is thinking...');
        
        const startTime = Date.now();
        const move = this.ai.chooseMove(this.game.getState(), this.game.getBoard());
        const thinkTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`AI chose position: (${move.row}, ${move.col}) [${thinkTime}s]`);
        this.game.makeMove(move);
        
        // Small delay for readability
        await this.sleep(500);
    }

    private printGameResult(): void {
        console.log('\n' + '='.repeat(60));
        console.log('Game Over!');
        console.log('='.repeat(60));
        
        const status = this.game.getStatus();
        const winner = this.game.getWinner();
        
        if (status === GameStatus.Draw) {
            console.log('Result: Draw!');
        } else if (winner === this.humanPlayer) {
            console.log('Result: You win! Congratulations!');
        } else {
            console.log('Result: AI wins! Better luck next time!');
        }
        
        const moves = this.game.getMoveHistory().length;
        console.log(`Total moves: ${moves}`);
        console.log('='.repeat(60));
    }

    private prompt(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Parse command line arguments
function parseArgs(): { modelPath: string; humanColor: 'black' | 'white'; simulations: number } {
    const args = process.argv.slice(2);
    let modelPath = path.join(__dirname, '../../models/mcts_model.json');
    let humanColor: 'black' | 'white' = 'black';
    let simulations = 1000;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--model':
            case '-m':
                modelPath = args[++i];
                break;
            case '--color':
            case '-c':
                const color = args[++i].toLowerCase();
                if (color !== 'black' && color !== 'white') {
                    console.error('Color must be "black" or "white"');
                    process.exit(1);
                }
                humanColor = color;
                break;
            case '--simulations':
            case '-s':
                simulations = parseInt(args[++i]);
                break;
            case '--help':
            case '-h':
                console.log('Usage: npm run play -- [options]');
                console.log('');
                console.log('Options:');
                console.log('  -m, --model <path>          Path to trained model (default: models/mcts_model.json)');
                console.log('  -c, --color <black|white>   Your color (default: black)');
                console.log('  -s, --simulations <number>  AI simulations per move (default: 1000)');
                console.log('  -h, --help                  Show this help message');
                console.log('');
                console.log('Examples:');
                console.log('  npm run play');
                console.log('  npm run play -- --color white');
                console.log('  npm run play -- -m models/my_model.json -c white -s 2000');
                console.log('');
                console.log('During gameplay:');
                console.log('  - Enter moves as "row col", e.g., "7 7" for center of 15x15 board');
                console.log('  - Type "quit" or "exit" to end the game');
                process.exit(0);
        }
    }

    return { modelPath, humanColor, simulations };
}

// Main execution
async function main(): Promise<number> {
    try {
        const { modelPath, humanColor, simulations } = parseArgs();
        const game = new InteractiveGame(modelPath, humanColor, simulations);
        await game.play();
        return 0;
    } catch (error) {
        console.error('Error during gameplay:', error);
        return 1;
    }
}

main().then(exitCode => process.exit(exitCode));
