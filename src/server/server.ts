/**
 * Express server for Gomoku game
 */

import express from 'express';
import path from 'path';
import { Game } from '../game/Game';
import { CellState } from '../game/types';
import { AIPlayer } from '../ai/AIPlayer';
import { RandomAI } from '../ai/RandomAI';

const app = express();
const PORT = process.env.PORT || 3000;

// Store active games (in production, use a proper database)
const games = new Map<string, { game: Game; ai?: AIPlayer }>();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Create a new game
app.post('/api/game/new', (req, res) => {
    const { boardSize = 15, vsAI = false } = req.body;
    const gameId = Date.now().toString();
    const game = new Game(boardSize);
    
    const gameData: { game: Game; ai?: AIPlayer } = { game };
    if (vsAI) {
        gameData.ai = new RandomAI();
    }
    
    games.set(gameId, gameData);
    
    res.json({
        gameId,
        state: game.getState()
    });
});

// Get game state
app.get('/api/game/:gameId', (req, res) => {
    const gameData = games.get(req.params.gameId);
    if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({ state: gameData.game.getState() });
});

// Make a move
app.post('/api/game/:gameId/move', (req, res) => {
    const gameData = games.get(req.params.gameId);
    if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    const { row, col } = req.body;
    const position = { row, col };
    
    if (!gameData.game.makeMove(position)) {
        return res.status(400).json({ error: 'Invalid move' });
    }
    
    let aiMove = null;
    
    // If playing against AI and game is still in progress, let AI make a move
    if (gameData.ai && gameData.game.getStatus() === 'in_progress') {
        const aiPosition = gameData.ai.chooseMove(
            gameData.game.getState(),
            gameData.game.getBoard()
        );
        gameData.game.makeMove(aiPosition);
        aiMove = aiPosition;
    }
    
    res.json({
        state: gameData.game.getState(),
        aiMove
    });
});

// Reset game
app.post('/api/game/:gameId/reset', (req, res) => {
    const gameData = games.get(req.params.gameId);
    if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    gameData.game.reset();
    res.json({ state: gameData.game.getState() });
});

app.listen(PORT, () => {
    console.log(`Gomoku server running on http://localhost:${PORT}`);
});
