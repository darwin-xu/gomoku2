/**
 * Express server for Gomoku game
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Game } from '../game/Game';
import { CellState } from '../game/types';
import { AIPlayer } from '../ai/AIPlayer';
import { RandomAI } from '../ai/RandomAI';
import { MCTSAI } from '../ai/MCTSAI';

const app = express();
const PORT = process.env.PORT || 3000;

// Store active games (in production, use a proper database)
const games = new Map<string, { game: Game; ai?: AIPlayer }>();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Create a new game
app.post('/api/game/new', (req, res) => {
    const { boardSize = 15, vsAI = false, aiType = 'random', aiSimulations } = req.body;
    const gameId = crypto.randomUUID();
    const game = new Game(boardSize);
    
    const gameData: { game: Game; ai?: AIPlayer } = { game };
    if (vsAI) {
        if (aiType === 'mcts') {
            // Parse and validate simulations parameter
            let simulations = 1000; // default
            if (aiSimulations !== undefined) {
                simulations = aiSimulations;
            } else if (process.env.MCTS_SIMULATIONS) {
                const parsed = parseInt(process.env.MCTS_SIMULATIONS);
                if (!isNaN(parsed) && parsed > 0) {
                    simulations = parsed;
                }
            }
            
            // Validate simulations is a positive integer
            if (isNaN(simulations) || simulations <= 0 || !Number.isInteger(simulations)) {
                return res.status(400).json({ error: 'Invalid simulations parameter: must be a positive integer' });
            }
            
            // Limit maximum simulations to prevent excessive computation
            if (simulations > 10000) {
                return res.status(400).json({ error: 'Simulations parameter too large: maximum is 10000' });
            }
            
            const mctsAI = new MCTSAI(simulations);
            const modelPath = path.join(__dirname, '../../models/mcts_model.json');
            
            // Try to load trained model
            if (fs.existsSync(modelPath)) {
                try {
                    mctsAI.loadModel(modelPath);
                    console.log('Loaded trained MCTS model');
                } catch (error) {
                    console.log('Failed to load MCTS model, using untrained AI', error);
                }
            }
            gameData.ai = mctsAI;
        } else {
            gameData.ai = new RandomAI();
        }
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
