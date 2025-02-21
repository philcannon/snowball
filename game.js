// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

const startButton = document.getElementById('startButton');
const leaderboardButton = document.getElementById('leaderboardButton');
const scoreDisplay = document.getElementById('score');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardDiv = document.getElementById('leaderboard');
const gameOverPopup = document.getElementById('gameOverPopup');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Game variables
let snowball = { x: 100, y: 350, radius: 20, vy: 0 };
let gravity = 0.5;
let jumpForce = -12;
let speed = 4; // Increased initial speed
let obstacles = [];
let score = 0;
let gameRunning = false;
let lastTime = 0;

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('snowballLeaderboard')) || [];

function startGame() {
    gameRunning = true;
    startButton.style.display = 'none';
    leaderboardButton.style.display = 'none';
    gameOverPopup.classList.add('hidden');
    score = 0;
    speed = 4;
    obstacles = [];
    snowball = { x: 100, y: 350, radius: 20, vy: 0 };
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    let delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Increase speed over time (faster rate)
    speed += 0.02 * delta;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Snowball physics
    snowball.vy += gravity;
    snowball.y += snowball.vy;
    if (snowball.y + snowball.radius > canvas.height) {
        snowball.y = canvas.height - snowball.radius;
        snowball.vy = 0;
    }

    // Spawn obstacles
    if (Math.random() < 0.02) {
        let size = Math.random() * 40 + 20;
        obstacles.push({ x: canvas.width, y: canvas.height - size, width: size, height: size });
    }

    // Move obstacles and check collision
    obstacles.forEach((ob, i) => {
        ob.x -= speed;
        if (ob.x + ob.width < 0) obstacles.splice(i, 1);

        // Improved collision detection
        if (
            snowball.x + snowball.radius > ob.x &&
            snowball.x - snowball.radius < ob.x + ob.width &&
            snowball.y + snowball.radius > ob.y &&
            snowball.y - snowball.radius < ob.y + ob.height
        ) {
            endGame();
        }
    });

    score += speed * 0.1; // Real-time score based on distance
    scoreDisplay.textContent = Math.floor(score);
}

function draw() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    ctx.beginPath();
    ctx.arc(snowball.x, snowball.y, snowball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e0f7fa';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#000';
    ctx.fill();
    ctx.shadowBlur = 0;

    obstacles.forEach(ob => {
        ctx.fillStyle = '#616161';
        ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    });
}

function endGame() {
    gameRunning = false;
    startButton.style.display = 'block';
    leaderboardButton.style.display = 'block';
    startButton.textContent = 'Restart';
    finalScoreDisplay.textContent = Math.floor(score);
    gameOverPopup.classList.remove('hidden');
    updateLeaderboard(Math.floor(score));
}

function updateLeaderboard(newScore) {
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('snowballLeaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach(score => {
        let li = document.createElement('li');
        li.textContent = score;
        leaderboardList.appendChild(li);
    });
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
leaderboardButton.addEventListener('click', () => {
    leaderboardDiv.classList.toggle('hidden');
});
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && snowball.vy === 0) snowball.vy = jumpForce;
});

// Initial leaderboard display
displayLeaderboard();
