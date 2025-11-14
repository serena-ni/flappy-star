const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const finalScore = document.getElementById('final-score');

let gameStarted = false;
let gameActive = false;

let star = {
  x: 80,
  radius: 12,
  velocity: 0
};

const gravityBase = 0.05;   // initial slow fall
const gravityMax = 0.18;    // max slow gravity
const flapStrength = -8;
let gravity = gravityBase;

let pillars = [];
const pillarWidth = 60;
const pillarGap = 150;
let frame = 0;
let score = 0;
let gameOver = false;

// Hover variables
let hoverOffset = 0;
let hoverDirection = 1;
const hoverRange = 5;      // ±5px
const hoverSpeed = 0.2;    // very slow

// Start game button
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameStarted = true;
  gameActive = false;
  draw(); // show initial hover frame
});

// Restart button
restartButton.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  resetGame();
  startScreen.style.display = 'none';
  gameStarted = true;
  gameActive = false;
  draw();
});

// Reset game
function resetGame() {
  star.velocity = 0;
  pillars = [];
  frame = 0;
  score = 0;
  gameOver = false;
  gravity = gravityBase;
  scoreElement.innerText = score;
  hoverOffset = 0;
  hoverDirection = 1;
}

// Add pillars
function addPillar() {
  const topHeight = Math.random() * (canvas.height - pillarGap - 50) + 30;
  pillars.push({
    x: canvas.width,
    top: topHeight,
    bottom: canvas.height - topHeight - pillarGap
  });
}

// Draw frame (hover or active)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gentle bobbing before first flap
  if (!gameActive) {
    hoverOffset += hoverSpeed * hoverDirection;
    if (hoverOffset > hoverRange || hoverOffset < -hoverRange) {
      hoverDirection *= -1;
    }
  } else {
    hoverOffset = 0;
  }

  // Draw star
  ctx.beginPath();
  ctx.arc(star.x, canvas.height / 2 + hoverOffset, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.closePath();

  // Draw pillars
  for (let p of pillars) {
    ctx.fillStyle = '#8b00ff';
    ctx.fillRect(p.x, 0, pillarWidth, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, pillarWidth, p.bottom);
  }

  if (!gameActive && !gameOver) requestAnimationFrame(draw);
}

// Game loop
function update() {
  if (!gameActive || gameOver) return;

  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gradually increase gravity (slow)
  gravity = Math.min(gravityBase + frame * 0.00005, gravityMax);

  star.velocity += gravity;
  star.y += star.velocity;

  // Draw star
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.closePath();

  // Add pillars
  if (frame % 90 === 0) addPillar();

  // Draw pillars & collisions
  for (let i = 0; i < pillars.length; i++) {
    let p = pillars[i];
    p.x -= 2;

    ctx.fillStyle = '#8b00ff';
    ctx.fillRect(p.x, 0, pillarWidth, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, pillarWidth, p.bottom);

    // Collision
    if (
      star.x + star.radius > p.x &&
      star.x - star.radius < p.x + pillarWidth &&
      (star.y - star.radius < p.top || star.y + star.radius > canvas.height - p.bottom)
    ) {
      gameOver = true;
      endGame();
    }

    // Score
    if (!p.passed && p.x + pillarWidth < star.x) {
      score++;
      scoreElement.innerText = score;
      p.passed = true;
    }
  }

  // Out of bounds
  if (star.y + star.radius > canvas.height || star.y - star.radius < 0) {
    gameOver = true;
    endGame();
  }

  if (!gameOver) requestAnimationFrame(update);
}

// End game
function endGame() {
  gameOverScreen.style.display = 'flex';
  finalScore.innerText = `Score: ${score}`;
  gameActive = false;
}

// Flap function
function flap() {
  if (!gameStarted) return;

  if (!gameActive) gameActive = true;

  star.velocity = flapStrength;

  if (gameActive) requestAnimationFrame(update);
}

// Input
document.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});

document.addEventListener('click', flap);
