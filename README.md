# Gomoku Game

A modern, web-based Gomoku (Five in a Row) game built with Node.js and TypeScript.

## Features

- **Traditional Gomoku Rules**: Classic 15x15 board, first to get 5 in a row wins
- **Player vs Player**: Play against another human player
- **Player vs AI**: Play against a computer opponent
- **Modern UI**: Clean, responsive design with smooth gameplay
- **AI Interface**: Extensible AI system for training and custom implementations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Game

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
gomoku2/
├── src/
│   ├── game/           # Core game logic
│   │   ├── types.ts    # Type definitions
│   │   ├── Board.ts    # Board representation and win detection
│   │   └── Game.ts     # Game state management
│   ├── ai/             # AI implementations
│   │   ├── AIPlayer.ts # AI interface and training interface
│   │   ├── RandomAI.ts # Basic random AI
│   │   └── MCTSAI.ts   # Monte Carlo Tree Search AI
│   ├── scripts/        # Training and play scripts
│   │   ├── train.ts    # AI training script
│   │   └── play.ts     # Interactive play script
│   └── server/         # Express server
│       └── server.ts   # API endpoints
├── public/             # Static web files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styling
│   └── game-ui.js      # Client-side game UI
├── models/             # Trained AI models
│   └── mcts_model.json # MCTS trained model
└── dist/               # Compiled TypeScript (generated)
```

## How to Play

1. Choose game mode (Player vs Player or Player vs AI)
2. Click "New Game" to start
3. Click on the board to place stones
4. Black goes first
5. First player to get 5 stones in a row (horizontal, vertical, or diagonal) wins
6. Use "Reset Game" to restart the current game

## AI Player

The game includes a powerful MCTS (Monte Carlo Tree Search) AI player that can be trained through self-play.

### Training the AI

Train the AI using self-play to improve its gameplay:

```bash
npm run train -- [options]
```

**Options:**
- `-g, --games <number>` - Number of training games (default: 100)
- `-s, --simulations <number>` - MCTS simulations per move (default: 500)
- `-b, --board-size <number>` - Board size (default: 15)
- `-o, --output <path>` - Output model path (default: models/mcts_model.json)

**Examples:**
```bash
# Train with default settings (100 games, 500 simulations per move)
npm run train

# Quick training with fewer games and simulations
npm run train -- --games 50 --simulations 300

# Intensive training for better performance
npm run train -- --games 500 --simulations 1000
```

During training, the script will display:
- Progress percentage
- Win rates for black/white players
- Average number of moves per game
- Training time statistics

### Playing Against the AI

Play against the trained AI through the command line:

```bash
npm run play -- [options]
```

**Options:**
- `-m, --model <path>` - Path to trained model (default: models/mcts_model.json)
- `-c, --color <black|white>` - Your color (default: black)
- `-s, --simulations <number>` - AI simulations per move (default: 1000)

**Examples:**
```bash
# Play as black (you go first)
npm run play

# Play as white (AI goes first)
npm run play -- --color white

# Play with a custom trained model
npm run play -- --model models/my_model.json

# Play with stronger AI (more simulations)
npm run play -- --simulations 2000
```

**Gameplay Instructions:**
- Enter moves as "row col" (e.g., "7 7" for center of 15x15 board)
- Type "quit" or "exit" to end the game
- The board is displayed with coordinates on the edges
- Black stones are represented by ●
- White stones are represented by ○

### Using MCTS AI in Web Interface

The trained MCTS AI is also available in the web interface. To use it:

1. Start the server: `npm run dev` or `npm start`
2. Open http://localhost:3000
3. When creating a new game, select AI type "mcts" instead of "random"

## AI Development

The game includes an extensible AI interface for implementing custom AI players:

### Available AI Implementations

1. **RandomAI** - Makes random valid moves (for testing)
2. **MCTSAI** - Monte Carlo Tree Search with self-play training

### Basic AI Interface
```typescript
interface AIPlayer {
    chooseMove(gameState: GameState, board: Board): Position;
    getName(): string;
}
```

### Trainable AI Interface
For implementing reinforcement learning or other training methods:
```typescript
interface TrainableAI extends AIPlayer {
    train(gameHistory: GameState[][]): void;
    saveModel(path: string): void;
    loadModel(path: string): void;
}
```

### Creating Custom AI
1. Create a new class implementing `AIPlayer` or `TrainableAI`
2. Implement the required methods
3. Register your AI in the server

### MCTS Algorithm

The MCTS AI uses the following techniques:
- **UCB1 Selection** - Balances exploration and exploitation
- **Random Playouts** - Simulates games to evaluate positions
- **Knowledge Base** - Stores statistics from training games
- **Self-Play Training** - Learns by playing against itself

## Development

### Code Conventions
- Language: TypeScript
- Indentation: 4 spaces
- Node.js runtime
- Express for web server

### Build Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm run clean` - Remove compiled files
- `npm start` - Run compiled version
- `npm run train` - Train the MCTS AI using self-play
- `npm run play` - Play against the trained AI in the terminal

## License

ISC