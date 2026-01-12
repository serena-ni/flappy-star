// ELEMENTS
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerNameInput");
const scoreDisplay = document.getElementById("scoreDisplay");

const endOverlay = document.getElementById("endOverlay");
const restartBtn = document.getElementById("restartBtn");
const finalScoreEl = document.getElementById("final-score");

const viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");
const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");

// CANVAS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

// GAME STATE
let running = false;
let score = 0;
let lastTime = 0;
let pipes = [];
let particles = [];
let playerName = "guest";

// STAR (FIXED PHYSICS)
const star = {
  x: 110,
  y: canvas.height / 2,
  r: 12,
  vy: 0,
  gravity: 1400,   // stronger gravity
  jump: -420,      // MUCH stronger jump
  squash: 1
};

// START GAME (FIX: force first frame)
startBtn.onclick = () => {
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");

  canvas.style.display = "block";
  scoreDisplay.style.display = "block";

  playerName = playerNameInput.value.trim() || "guest";

  resetGame();
  running = true;

  lastTime = performance.now();
  requestAnimationFrame(loop);
};

// INPUT (FIXED: always responsive)
function jump() {
  if (!running) return;
  star.vy = star.jump;
  star.squash = 1.35;
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

document.addEventListener("pointerdown", jump);

// RESET
function resetGame() {
  score = 0;
  pipes = [];
  particles = [];

  star.y = canvas.height / 2;
  star.vy = 0;
  star.squash = 1;

  scoreDisplay.textContent = "0";
}

// GAME LOOP (FIXED dt clamp)
function loop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// UPDATE
function update(dt) {
  // STAR PHYSICS
  star.vy += star.gravity * dt;
  star.y += star.vy * dt;
  star.squash += (1 - star.squash) * 10 * dt;

  // TRAIL
  particles.push({
    x: star.x - 8,
    y: star.y,
    r: Math.random() * 2 + 1.5,
    life: 20
  });

  // PIPES
  if (pipes.length === 0 || pipes[pipes.length - 1].x < 200) {
    spawnPipe();
  }

  pipes.forEach(p => {
    p.x -= 160 * dt;

    if (!p.passed && p.x + 40 < star.x) {
      score++;
      p.passed = true;
      scoreDisplay.textContent = score;
    }

    if (
      star.x + star.r > p.x &&
      star.x - star.r < p.x + 40 &&
      (star.y - star.r < p.top || star.y + star.r > p.top + p.gap)
    ) endGame();
  });

  pipes = pipes.filter(p => p.x > -60);

  if (star.y + star.r > canvas.height || star.y - star.r < 0) {
    endGame();
  }

  updateParticles();
}

// DRAW
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPipes();
  drawParticles();
  drawStar();
}

// STAR
function drawStar() {
  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.scale(1 / star.squash, star.squash);

  ctx.fillStyle = "#ffeb8a";
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#ffeb8a";

  ctx.beginPath();
  ctx.arc(0, 0, star.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// PIPES
function spawnPipe() {
  const gap = 160;
  const top = Math.random() * 260 + 60;
  pipes.push({ x: canvas.width, top, gap, passed: false });
}

function drawPipes() {
  ctx.fillStyle = "#3fa9f5";
  pipes.forEach(p => {
    ctx.fillRect(p.x, 0, 40, p.top);
    ctx.fillRect(p.x, p.top + p.gap, 40, canvas.height);
  });
}

// PARTICLES
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life--;
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 20;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffeb8a";
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// END GAME
function endGame() {
  running = false;
  endOverlay.classList.remove("hidden");
  scoreDisplay.style.display = "none";
  finalScoreEl.textContent = `score: ${score}`;
  saveScore();
}

// RESTART
restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  canvas.style.display = "none";
};

// LEADERBOARD
viewLeaderboardBtn.onclick = () => {
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
};

closeLeaderboardBtn.onclick = () => {
  leaderboardModal.classList.add("hidden");
  endOverlay.classList.remove("hidden");
};

function saveScore() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  board.push({ name: playerName, score });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board.slice(0, 5)));
}

function populateLeaderboard() {
  leaderboardList.innerHTML = "";
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  board.forEach((e, i) => {
    const row = document.createElement("div");
    row.className = "lb-row";
    row.innerHTML = `<div>${i + 1}</div><div>${e.name}</div><div>${e.score}</div>`;
    leaderboardList.appendChild(row);
  });
}
