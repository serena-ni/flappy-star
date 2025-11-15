const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI elements
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const leaderboardModal = document.getElementById("leaderboard-modal");
const restartBtn = document.getElementById("restart-btn");
const startBtn = document.getElementById("start-btn");
const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
const closeLeaderboardBtn = document.getElementById("close-leaderboard-btn");
const nameInput = document.getElementById("player-name");
const finalScoreText = document.getElementById("final-score");
const leaderboardList = document.getElementById("leaderboard-list");

// game constants
let starX = 90;
let starY = 280;
let velocity = 0;
let gravity = 0.22;
let maxFallSpeed = 4.5;
let jumpStrength = -5;
let score = 0;
let pipes = [];
let gameRunning = false;
let playerName = "";
let idleFloat = 0;
let idleSpeed = 0.02;
let particles = [];
let stars = [];
let frameCount = 0;

// --- CREATE BACKGROUND STARS ---
function initStars() {
  stars = [];
  const count = 70;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.2 + 0.05
    });
  }
}
initStars();

// --- CREATE PIPES ---
function createPipe() {
  const gap = 160;
  const topHeight = Math.random() * 250 + 50;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + gap
  });
}

// --- START GAME ---
function startGame() {
  playerName = nameInput.value.trim() || "Player";
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  leaderboardModal.classList.add("hidden");

  starX = 90;
  starY = 280;
  velocity = 0;
  score = 0;
  pipes = [];
  particles = [];
  idleFloat = 0;

  gameRunning = true;
  loop();
}

// --- RESTART ---
restartBtn.onclick = startGame;
startBtn.onclick = startGame;

// SPACE / CLICK
window.addEventListener("keydown", e => {
  if (e.code === "Space" && gameRunning) jump();
});
canvas.addEventListener("click", () => {
  if (gameRunning) jump();
});

// --- JUMP ---
function jump() {
  velocity = jumpStrength;
}

// --- END GAME ---
function endGame() {
  gameRunning = false;

  // Particle explosion & shake
  screenShake(10);

  finalScoreText.textContent = `Score: ${score}`;

  saveToLeaderboard();
  gameOverScreen.classList.remove("hidden");
}

// --- SCREEN SHAKE ---
function screenShake(amount) {
  const shakeDuration = 300;
  const start = Date.now();
  function shake() {
    const elapsed = Date.now() - start;
    if (elapsed < shakeDuration) {
      const dx = (Math.random() - 0.5) * amount;
      const dy = (Math.random() - 0.5) * amount;
      ctx.setTransform(1, 0, 0, 1, dx, dy);
      requestAnimationFrame(shake);
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  shake();
}

// --- SAVE SCORE ---
function saveToLeaderboard() {
  let board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");

  board.push({ name: playerName, score });
  board.sort((a, b) => b.score - a.score);
  board = board.slice(0, 5);

  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board));
}

// --- POPULATE LEADERBOARD ---
function populateLeaderboard() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  leaderboardList.innerHTML = "";

  let addedCurrent = false;

  board.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${entry.name}: ${entry.score}`;
    if (entry.name === playerName && entry.score === score && !addedCurrent) {
      li.classList.add("current");
      addedCurrent = true;
    }
    leaderboardList.appendChild(li);
  });

  if (!addedCurrent) {
    const li = document.createElement("li");
    li.textContent = `Your score: ${playerName} – ${score}`;
    li.classList.add("current");
    leaderboardList.appendChild(li);
  }
}

viewLeaderboardBtn.onclick = () => {
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
};

closeLeaderboardBtn.onclick = () =>
  leaderboardModal.classList.add("hidden");

// --- PARTICLES ---
function addParticles(x, y, count, size) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: size,
      life: 30
    });
  }
}

// --- RARE SPARK BONUS ---
function sparkBonus(x, y) {
  addParticles(x, y, 40, 4);
}

// --- UPDATE LOOP ---
function loop() {
  if (!gameRunning) return;

  frameCount++;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // PARALLAX STARS
  for (let s of stars) {
    s.x -= s.speed;
    if (s.x < 0) s.x = canvas.width;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  // IDLE FLOAT IF NOT MOVING
  if (Math.abs(velocity) < 0.01) {
    idleFloat += idleSpeed;
    starY = 280 + Math.sin(idleFloat) * 4;
  } else {
    // GRAVITY
    velocity += gravity;
    if (velocity > maxFallSpeed) velocity = maxFallSpeed;
    starY += velocity;
  }

  // DRAW STAR
  ctx.fillStyle = "#ffd76b";
  ctx.beginPath();
  ctx.arc(starX, starY, 14, 0, Math.PI * 2);
  ctx.fill();

  // PARTICLES
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.fillStyle = "rgba(255,220,150,0.8)";
    ctx.fillRect(p.x, p.y, p.size, p.size);
    if (p.life <= 0) particles.splice(i, 1);
  });

  // PIPE SPAWNING
  if (frameCount % 120 === 0) createPipe();

  // PIPES
  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= 2;

    // DRAW PIPES
    ctx.fillStyle = "#85a6ff";
    ctx.fillRect(pipe.x, 0, 60, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, 60, canvas.height - pipe.bottom);

    // SCORE COUNT
    if (pipe.x + 60 < starX && !pipe.passed) {
      pipe.passed = true;
      score++;

      // tight gap bonus
      if (pipe.bottom - pipe.top < 155) {
        sparkBonus(starX, starY);
      }
    }

    // REMOVE OLD PIPES
    if (pipe.x < -60) pipes.splice(i, 1);

    // COLLISION
    if (
      starX + 14 > pipe.x &&
      starX - 14 < pipe.x + 60 &&
      (starY - 14 < pipe.top || starY + 14 > pipe.bottom)
    ) {
      addParticles(starX, starY, 50, 3);
      endGame();
      return;
    }
  }

  requestAnimationFrame(loop);
}
