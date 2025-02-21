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
let snowball = { x: 100, y: 350, radius: 20, vy: 0, vx: 0 };
let gravity = 0.5;
let baseJumpForce = -12;
let maxJumpForce = -20;
let jumpCharge = 0;
let maxChargeTime = 500;
let isCharging = false;
let speed = 2;
let obstacles = [];
let score = 0;
let gameRunning = false;
let lastTime = 0;
let timeElapsed = 0;
let lastObstacleTime = 0;
let firstObstacleSpawned = false;

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('snowballLeaderboard')) || [];

function startGame() {
    gameRunning = true;
    startButton.style.display = 'none';
    leaderboardButton.style.display = 'none';
    gameOverPopup.classList.add('hidden');
    score = 0;
    speed = 2;
    timeElapsed = 0;
    obstacles = [];
    firstObstacleSpawned = false;
    snowball = { x: 100, y: 350, radius: 20, vy: 0, vx: 0 };
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    let delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    timeElapsed += delta;

    speed = 2 + timeElapsed * 0.05;

    update(delta);
    draw();
    requestAnimationFrame(gameLoop);
}

function update(delta) {
    // Snowball physics
    snowball.vy += gravity;
    snowball.y += snowball.vy;
    snowball.x += snowball.vx;
    snowball.vx *= 0.95;

    if (snowball.y + snowball.radius > canvas.height) {
        snowball.y = canvas.height - snowball.radius;
        snowball.vy = 0;
        snowball.vx = 0;
    }

    if (isCharging) {
        jumpCharge = Math.min(jumpCharge + delta * 1000, maxChargeTime);
    }

    // Obstacle spawning
    let spawnChance = 0.01 + timeElapsed * 0.005;
    let minGap = Math.max(200 - timeElapsed * 10, 100);

    if (!firstObstacleSpawned && score >= 50 && score <= 80) {
        // Spawn first obstacle between score 50 and 80
        if (Math.random() < 0.1) { // Higher chance for first spawn
            let size = Math.random() * 20 + 20; // Small initial obstacle
            obstacles.push({ x: canvas.width, y: canvas.height - size, width: size, height: size });
            lastObstacleTime = timeElapsed;
            firstObstacleSpawned = true;
        }
    } else if (firstObstacleSpawned && Math.random() < spawnChance && (timeElapsed - lastObstacleTime) * speed > minGap) {
        let maxSize = Math.min(40 + timeElapsed * 5, 80);
        let size = Math.random() * (maxSize - 20) + 20;
        obstacles.push({ x: canvas.width, y: canvas.height - size, width: size, height: size });
        lastObstacleTime = timeElapsed;
    }

    // Move obstacles and check collision
    obstacles.forEach((ob, i) => {
        ob.x -= speed;
        if (ob.x + ob.width < 0) obstacles.splice(i, 1);

        if (
            snowball.x + snowball.radius > ob.x &&
            snowball.x - snowball.radius < ob.x + ob.width &&
            snowball.y + snowball.radius > ob.y &&
            snowball.y - snowball.radius < ob.y + ob.height
        ) {
            endGame();
        }
    });

    score += speed * 0.1;
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
    if (e.code === 'Space' && !isCharging && snowball.vy === 0) {
        isCharging = true;
        jumpCharge = 0;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && isCharging && snowball.vy === 0) {
        isCharging = false;
        let chargeFactor = jumpCharge / maxChargeTime;
        snowball.vy = baseJumpForce + (maxJumpForce - baseJumpForce) * chargeFactor;
        snowball.vx = speed + 5 * chargeFactor;
    }
});

// Initial leaderboard display
displayLeaderboard();
