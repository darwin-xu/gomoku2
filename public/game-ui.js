/**
 * Gomoku game UI - Client-side JavaScript
 */

class GomokuUI {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.statusMessage = document.getElementById('statusMessage');
        this.gameId = null;
        this.gameState = null;
        this.boardSize = 15;
        this.cellSize = 40;
        this.padding = 30;
        this.vsAI = false;

        this.setupCanvas();
        this.setupEventListeners();
        this.startNewGame();
    }

    setupCanvas() {
        const size = this.boardSize * this.cellSize + this.padding * 2;
        this.canvas.width = size;
        this.canvas.height = size;
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.vsAI = e.target.value === 'ai';
            });
        });
    }

    async startNewGame() {
        try {
            const response = await fetch('/api/game/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boardSize: this.boardSize,
                    vsAI: this.vsAI
                })
            });

            const data = await response.json();
            this.gameId = data.gameId;
            this.gameState = data.state;
            this.drawBoard();
            this.updateStatus();
        } catch (error) {
            console.error('Error starting new game:', error);
            this.statusMessage.textContent = 'Error starting game';
        }
    }

    async resetGame() {
        if (!this.gameId) return;

        try {
            const response = await fetch(`/api/game/${this.gameId}/reset`, {
                method: 'POST'
            });

            const data = await response.json();
            this.gameState = data.state;
            this.drawBoard();
            this.updateStatus();
        } catch (error) {
            console.error('Error resetting game:', error);
        }
    }

    async handleCanvasClick(event) {
        if (!this.gameId || !this.gameState || this.gameState.status !== 'in_progress') {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);

        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return;
        }

        if (this.gameState.board[row][col] !== 0) {
            return;
        }

        try {
            const response = await fetch(`/api/game/${this.gameId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ row, col })
            });

            if (!response.ok) {
                console.error('Invalid move');
                return;
            }

            const data = await response.json();
            this.gameState = data.state;
            this.drawBoard();
            this.updateStatus();
        } catch (error) {
            console.error('Error making move:', error);
        }
    }

    drawBoard() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#fdf6e3';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        for (let i = 0; i < this.boardSize; i++) {
            const pos = this.padding + i * this.cellSize;

            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(pos, this.padding);
            ctx.lineTo(pos, this.padding + (this.boardSize - 1) * this.cellSize);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(this.padding, pos);
            ctx.lineTo(this.padding + (this.boardSize - 1) * this.cellSize, pos);
            ctx.stroke();
        }

        // Draw star points (for 15x15 board)
        if (this.boardSize === 15) {
            const starPoints = [
                [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
            ];
            ctx.fillStyle = '#333';
            starPoints.forEach(([row, col]) => {
                const x = this.padding + col * this.cellSize;
                const y = this.padding + row * this.cellSize;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

        // Draw stones
        if (this.gameState && this.gameState.board) {
            for (let row = 0; row < this.boardSize; row++) {
                for (let col = 0; col < this.boardSize; col++) {
                    const cell = this.gameState.board[row][col];
                    if (cell !== 0) {
                        this.drawStone(row, col, cell);
                    }
                }
            }

            // Highlight last move
            if (this.gameState.lastMove) {
                this.highlightLastMove(this.gameState.lastMove);
            }
        }
    }

    drawStone(row, col, player) {
        const ctx = this.ctx;
        const x = this.padding + col * this.cellSize;
        const y = this.padding + row * this.cellSize;
        const radius = this.cellSize * 0.4;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);

        if (player === 1) { // Black
            const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
            gradient.addColorStop(0, '#444');
            gradient.addColorStop(1, '#000');
            ctx.fillStyle = gradient;
        } else { // White
            const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ddd');
            ctx.fillStyle = gradient;
        }

        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    highlightLastMove(position) {
        const ctx = this.ctx;
        const x = this.padding + position.col * this.cellSize;
        const y = this.padding + position.row * this.cellSize;

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, this.cellSize * 0.25, 0, 2 * Math.PI);
        ctx.stroke();
    }

    updateStatus() {
        if (!this.gameState) return;

        const status = this.gameState.status;
        const message = this.statusMessage;

        message.classList.remove('winner');

        switch (status) {
            case 'in_progress':
                const player = this.gameState.currentPlayer === 1 ? 'Black' : 'White';
                message.textContent = `${player}'s turn`;
                break;
            case 'black_wins':
                message.textContent = '🎉 Black wins! 🎉';
                message.classList.add('winner');
                break;
            case 'white_wins':
                message.textContent = '🎉 White wins! 🎉';
                message.classList.add('winner');
                break;
            case 'draw':
                message.textContent = "It's a draw!";
                message.classList.add('winner');
                break;
        }
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new GomokuUI();
});
