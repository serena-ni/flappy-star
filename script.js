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
  y: canvas.height / 2,
  radius: 12,
  velocity: 0,
  hoverDirection: 1
};

const gravityBase = 0.05;   // very slow initial fall
const gravityMax = 0.6;     // maximum gravity
const flapStrength = -8;
let gravity = gravityBase;

let pillars = [];
const pillarWidth = 60;
const pillarGap = 150;
let frame = 0;
let score = 0;
let gameOver = false;

// start game button
startButton.addEventListener('click', () => {
  startScreen.style.display = 'none';
  gameStarted = true;
  gameActive = false; // wait for first flap
  star.y = canvas.height / 2;
  draw(); // initial hover frame
});

// restart button
restartButton.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  resetGame();
  startScreen.style.display = 'none';
  gameStarted = true;
  gameActive = false;
  draw();
});

// reset game
function resetGame() {
  star.y = canvas.height / 2;
  star.velocity = 0;
  star.hoverDirection = 1;
  pillars = [];
  frame = 0;
  score = 0;
  gameOver = false;
  gravity = gravityBase;
  scoreElement.innerText = score;
}

// add pillars
function addPillar() {
  const topHeight = Math.random() * (canvas.height - pillarGap - 50) + 30;
  pillars.push({
    x: canvas.width,
    top: topHeight,
    bottom: canvas.height - topHeight - pillarGap
  });
}

// draw frame (hover or active)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // hover effect before first flap
  if (!gameActive) {
    star.y += 0.7 * star.hoverDirection; // slow up/down
    if (star.y > canvas.height / 2 + 15 || star.y < canvas.height / 2 - 15) {
      star.hoverDirection *= -1;
    }
  }

  // draw star
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.closePath();

  // draw existing pillars
  for (let p of pillars) {
    ctx.fillStyle = '#8b00ff';
    ctx.fillRect(p.x, 0, pillarWidth, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, pillarWidth, p.bottom);
  }

  if (!gameActive && !gameOver) requestAnimationFrame(draw);
}

// game loop
function update() {
  if (!gameActive || gameOver) return;

  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // gradually increase gravity over time (very slow)
  gravity = Math.min(gravityBase + frame * 0.0002, gravityMax);

  star.velocity += gravity;
  star.y += star.velocity;

  // draw star
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.closePath();

  // add pillars
  if (frame % 90 === 0) addPillar();

  // draw pillars & collisions
  for (let i = 0; i < pillars.length; i++) {
    let p = pillars[i];
    p.x -= 2;

    ctx.fillStyle = '#8b00ff';
    ctx.fillRect(p.x, 0, pillarWidth, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, pillarWidth, p.bottom);

    // collision
    if (
      star.x + star.radius > p.x &&
      star.x - star.radius < p.x + pillarWidth &&
      (star.y - star.radius < p.top || star.y + star.radius > canvas.height - p.bottom)
    ) {
      gameOver = true;
      endGame();
    }

    // score
    if (!p.passed && p.x + pillarWidth < star.x) {
      score++;
      scoreElement.innerText = score;
      p.passed = true;
    }
  }

  // out of bounds
  if (star.y + star.radius > canvas.height || star.y - star.radius < 0) {
    gameOver = true;
    endGame();
  }

  if (!gameOver) requestAnimationFrame(update);
}

// end game
function endGame() {
  gameOverScreen.style.display = 'flex';
  finalScore.innerText = `Score: ${score}`;
  gameActive = false;
}

// flap function
function flap() {
  if (!gameStarted) return;

  if (!gameActive) gameActive = true; // first flap starts physics

  star.velocity = flapStrength;

  if (gameActive) requestAnimationFrame(update);
}

// input
document.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});

document.addEventListener('click', flap);
