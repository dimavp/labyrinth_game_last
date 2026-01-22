const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const btnGenerate = document.getElementById('btn-generate');
const btnNext = document.getElementById('btn-next');
const winOverlay = document.getElementById('win-overlay');
const capybaraImg = document.getElementById('capybara-sprite');

// Game Config
const COLS = 15;
const ROWS = 15;
const CELL_SIZE = 40; // 600 / 15
let grid = [];
let current; // Current cell for generation
let stack = [];
let player = { col: 0, row: 0 };
let goal = { col: COLS - 1, row: ROWS - 1 };
let isGameWon = false;

// Cell Object
class Cell {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        // Walls: [Top, Right, Bottom, Left]
        this.walls = [true, true, true, true];
        this.visited = false;
    }

    draw() {
        const x = this.col * CELL_SIZE;
        const y = this.row * CELL_SIZE;

        ctx.strokeStyle = '#ecf0f1'; // Wall color
        ctx.lineWidth = 2;

        // Draw Walls
        if (this.walls[0]) { // Top
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL_SIZE, y);
            ctx.stroke();
        }
        if (this.walls[1]) { // Right
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE, y);
            ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            ctx.stroke();
        }
        if (this.walls[2]) { // Bottom
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE, y + CELL_SIZE);
            ctx.lineTo(x, y + CELL_SIZE);
            ctx.stroke();
        }
        if (this.walls[3]) { // Left
            ctx.beginPath();
            ctx.moveTo(x, y + CELL_SIZE);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Fill visited cells (for generation debugging, or path styling)
        // We'll leave the path dark (#34495e from CSS)
    }

    checkNeighbors() {
        let neighbors = [];

        let top = grid[index(this.col, this.row - 1)];
        let right = grid[index(this.col + 1, this.row)];
        let bottom = grid[index(this.col, this.row + 1)];
        let left = grid[index(this.col - 1, this.row)];

        if (top && !top.visited) neighbors.push(top);
        if (right && !right.visited) neighbors.push(right);
        if (bottom && !bottom.visited) neighbors.push(bottom);
        if (left && !left.visited) neighbors.push(left);

        if (neighbors.length > 0) {
            let r = Math.floor(Math.random() * neighbors.length);
            return neighbors[r];
        } else {
            return undefined;
        }
    }
}

function index(col, row) {
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) {
        return -1;
    }
    return col + row * COLS;
}

// Maze Generation (Recursive Backtracker)
function setup() {
    grid = [];
    stack = [];
    isGameWon = false;
    winOverlay.classList.add('hidden');
    player = { col: 0, row: 0 };

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid.push(new Cell(c, r));
        }
    }

    current = grid[0];
    current.visited = true;
    generateMaze();
}

function generateMaze() {
    // We will generate instantly loop instead of animation for gameplay readiness
    while (true) {
        let next = current.checkNeighbors();
        if (next) {
            next.visited = true;
            stack.push(current);
            removeWalls(current, next);
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            break; // Finished
        }
    }
    draw();
}

function removeWalls(a, b) {
    let x = a.col - b.col;
    if (x === 1) {
        a.walls[3] = false;
        b.walls[1] = false;
    } else if (x === -1) {
        a.walls[1] = false;
        b.walls[3] = false;
    }
    let y = a.row - b.row;
    if (y === 1) {
        a.walls[0] = false;
        b.walls[2] = false;
    } else if (y === -1) {
        a.walls[2] = false;
        b.walls[0] = false;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear to BG color

    // Draw Maze
    for (let i = 0; i < grid.length; i++) {
        grid[i].draw();
    }

    // Draw Goal
    const goalX = goal.col * CELL_SIZE;
    const goalY = goal.row * CELL_SIZE;
    ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
    ctx.fillRect(goalX + 5, goalY + 5, CELL_SIZE - 10, CELL_SIZE - 10);

    // Draw Player
    const playerX = player.col * CELL_SIZE;
    const playerY = player.row * CELL_SIZE;

    // Use Sprite if loaded, else use fallback rect
    if (capybaraImg.complete && capybaraImg.naturalHeight !== 0) {
        ctx.drawImage(capybaraImg, playerX + 2, playerY + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    } else {
        ctx.fillStyle = '#d35400';
        ctx.fillRect(playerX + 5, playerY + 5, CELL_SIZE - 10, CELL_SIZE - 10);
    }
}

// Controls
document.addEventListener('keydown', (e) => {
    if (isGameWon) return;

    let nextCol = player.col;
    let nextRow = player.row;
    let currentCell = grid[index(player.col, player.row)];
    let moved = false;

    if (e.key === 'ArrowUp') {
        if (!currentCell.walls[0]) {
            nextRow--;
            moved = true;
        }
    } else if (e.key === 'ArrowRight') {
        if (!currentCell.walls[1]) {
            nextCol++;
            moved = true;
        }
    } else if (e.key === 'ArrowDown') {
        if (!currentCell.walls[2]) {
            nextRow++;
            moved = true;
        }
    } else if (e.key === 'ArrowLeft') {
        if (!currentCell.walls[3]) {
            nextCol--;
            moved = true;
        }
    }

    if (moved) {
        player.col = nextCol;
        player.row = nextRow;
        draw();
        checkWin();
    }
});

function checkWin() {
    if (player.col === goal.col && player.row === goal.row) {
        isGameWon = true;
        winOverlay.classList.remove('hidden');
    }
}

// Listeners
btnGenerate.addEventListener('click', () => {
    setup();
});

btnNext.addEventListener('click', () => {
    setup();
});

// Initial Start
// Wait for image to load to draw the first time correctly
capybaraImg.onload = () => {
    setup();
};
// Fallback if image is already cached or broken
setTimeout(() => {
    if (grid.length === 0) setup();
}, 100);
