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
│   │   └── RandomAI.ts # Basic random AI
│   └── server/         # Express server
│       └── server.ts   # API endpoints
├── public/             # Static web files
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styling
│   └── game-ui.js      # Client-side game UI
└── dist/               # Compiled TypeScript (generated)
```

## How to Play

1. Choose game mode (Player vs Player or Player vs AI)
2. Click "New Game" to start
3. Click on the board to place stones
4. Black goes first
5. First player to get 5 stones in a row (horizontal, vertical, or diagonal) wins
6. Use "Reset Game" to restart the current game

## AI Development

The game includes an extensible AI interface for implementing custom AI players:

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

## License

ISC