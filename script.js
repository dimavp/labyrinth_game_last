const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const btnGenerate = document.getElementById('btn-generate');
const btnNext = document.getElementById('btn-next');
const winOverlay = document.getElementById('win-overlay');
const capybaraImg = document.getElementById('capybara-sprite');

// Game Config - Dynamic based on difficulty
let currentDifficulty = 2; // Default: Medium
const difficultySettings = {
    1: { cols: 10, rows: 10, cellSize: 50, canvasSize: 500 },  // Easy
    2: { cols: 15, rows: 15, cellSize: 40, canvasSize: 600 },  // Medium
    3: { cols: 20, rows: 20, cellSize: 30, canvasSize: 600 },  // Hard
    4: { cols: 25, rows: 25, cellSize: 24, canvasSize: 600 }   // Expert
};

let COLS, ROWS, CELL_SIZE;
let grid = [];
let current; // Current cell for generation
let stack = [];
let player = { col: 0, row: 0 };
let goal;
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
    // Apply difficulty settings
    const settings = difficultySettings[currentDifficulty];
    COLS = settings.cols;
    ROWS = settings.rows;
    CELL_SIZE = settings.cellSize;

    // Resize canvas
    canvas.width = settings.canvasSize;
    canvas.height = settings.canvasSize;

    grid = [];
    stack = [];
    isGameWon = false;
    winOverlay.classList.add('hidden');
    player = { col: 0, row: 0 };
    goal = { col: COLS - 1, row: ROWS - 1 };

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
let moveInterval = null;

function slidePlayer(startX, startY) {
    if (isGameWon) return;

    let dx = startX;
    let dy = startY;
    let currentCell = grid[index(player.col, player.row)];
    let canMoveInit = false;

    if (dy === -1 && !currentCell.walls[0]) canMoveInit = true;
    else if (dx === 1 && !currentCell.walls[1]) canMoveInit = true;
    else if (dy === 1 && !currentCell.walls[2]) canMoveInit = true;
    else if (dx === -1 && !currentCell.walls[3]) canMoveInit = true;

    // Если сразу стена - никуда не едем
    if (!canMoveInit) return;

    // Если уже едем, прерываем старое движение и начинаем новое
    if (moveInterval) clearInterval(moveInterval);

    // Делаем первый шаг мгновенно
    moveStep();

    // Запускаем таймер для непрерывного скольжения (если не победили и не уперлись сразу)
    if (moveInterval !== null || !isGameWon) {
        moveInterval = setInterval(moveStep, 45); // Скорость: 45 мс на клетку
    }

    function moveStep() {
        let cell = grid[index(player.col, player.row)];
        let canMoveForward = false;

        // Смотрим, можно ли двигаться дальше в текущем направлении dx, dy
        if (dy === -1 && !cell.walls[0]) canMoveForward = true;
        else if (dx === 1 && !cell.walls[1]) canMoveForward = true;
        else if (dy === 1 && !cell.walls[2]) canMoveForward = true;
        else if (dx === -1 && !cell.walls[3]) canMoveForward = true;

        if (canMoveForward) {
            // Двигаемся
            player.col += dx;
            player.row += dy;
            draw();
            checkWin();

            if (isGameWon) {
                if (moveInterval) clearInterval(moveInterval);
                moveInterval = null;
                return;
            }

            // Мы в новой клетке. Анализируем, куда из нее можно выйти
            let newCell = grid[index(player.col, player.row)];
            let exits = [];
            if (!newCell.walls[0]) exits.push({ x: 0, y: -1 });
            if (!newCell.walls[1]) exits.push({ x: 1, y: 0 });
            if (!newCell.walls[2]) exits.push({ x: 0, y: 1 });
            if (!newCell.walls[3]) exits.push({ x: -1, y: 0 });

            if (exits.length > 2) {
                // ПЕРЕКРЕСТОК: 3 или 4 прохода. Нужно остановиться, чтобы дать игроку выбрать!
                if (moveInterval) clearInterval(moveInterval);
                moveInterval = null;
            } else if (exits.length === 2) {
                // ИЗГИБ ИЛИ КОРИДОР: всего 2 прохода (один откуда пришли, другой вперед)
                // Находим куда идти дальше (не туда, откуда пришли)
                let forwardExit = exits.find(e => !(e.x === -dx && e.y === -dy));
                if (forwardExit) {
                    dx = forwardExit.x;
                    dy = forwardExit.y;
                }
            } else {
                // ТУПИК: 1 проход. Останавливаемся.
                if (moveInterval) clearInterval(moveInterval);
                moveInterval = null;
            }
        } else {
            // Уперлись в прямую стену
            if (moveInterval) clearInterval(moveInterval);
            moveInterval = null;
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') slidePlayer(0, -1);
    else if (e.key === 'ArrowRight') slidePlayer(1, 0);
    else if (e.key === 'ArrowDown') slidePlayer(0, 1);
    else if (e.key === 'ArrowLeft') slidePlayer(-1, 0);
});

// Touch Controls
document.getElementById('btn-up').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    slidePlayer(0, -1);
});
document.getElementById('btn-right').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    slidePlayer(1, 0);
});
document.getElementById('btn-down').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    slidePlayer(0, 1);
});
document.getElementById('btn-left').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    slidePlayer(-1, 0);
});

// Swipe/Stylus Controls on Canvas
let swipeStartX = null;
let swipeStartY = null;
const SWIPE_THRESHOLD = 20; // Minimum px to register a swipe

canvas.addEventListener('pointerdown', (e) => {
    // Work with pen (stylus), touch, and mouse
    if (e.pointerType === 'pen' || e.pointerType === 'touch' || e.pointerType === 'mouse') {
        swipeStartX = e.clientX;
        swipeStartY = e.clientY;
        e.preventDefault();
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (swipeStartX === null) return;
    e.preventDefault(); // Prevent scrolling while swiping
});

canvas.addEventListener('pointerup', (e) => {
    if (swipeStartX === null) return;

    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only register if swipe distance exceeds threshold
    if (Math.max(absDx, absDy) >= SWIPE_THRESHOLD) {
        if (absDx > absDy) {
            // Horizontal swipe
            slidePlayer(dx > 0 ? 1 : -1, 0);
        } else {
            // Vertical swipe
            slidePlayer(0, dy > 0 ? 1 : -1);
        }
    }

    swipeStartX = null;
    swipeStartY = null;
});

canvas.addEventListener('pointercancel', () => {
    swipeStartX = null;
    swipeStartY = null;
});

// Prevent default touch behavior on canvas to avoid scrolling
canvas.style.touchAction = 'none';

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

// Difficulty Selection
function initDifficultyButtons() {
    const difficultyButtons = document.querySelectorAll('.btn-difficulty');
    console.log('Found difficulty buttons:', difficultyButtons.length);

    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Difficulty button clicked:', btn.dataset.level);
            // Remove active class from all buttons
            difficultyButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update difficulty
            currentDifficulty = parseInt(btn.dataset.level);
            console.log('New difficulty:', currentDifficulty);
            // Generate new maze with new difficulty
            setup();
        });
    });
}

// Initialize difficulty buttons when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDifficultyButtons);
} else {
    initDifficultyButtons();
}

// Initial Start
// Wait for image to load to draw the first time correctly
capybaraImg.onload = () => {
    setup();
};
// Fallback if image is already cached or broken
setTimeout(() => {
    if (grid.length === 0) setup();
}, 100);
