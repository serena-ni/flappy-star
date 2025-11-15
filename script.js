// FINAL FIXED script.js
// Replaced previous version with a robust, defensive implementation.
// Keep your HTML+CSS as-is and replace script.js with this file.

"use strict";

// ===== ELEMENTS =====
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerNameInput");
const scoreDisplay = document.getElementById("scoreDisplay");

const endOverlay = document.getElementById("endOverlay");
const restartBtn = document.getElementById("restartBtn");
const viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
const finalScoreEl = document.getElementById("final-score");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");

// ===== CANVAS =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

// ===== GAME STATE =====
let gameStarted = false;      // whether the main loop is running
let starFalling = false;      // whether gravity is active for the star
let playerName = "Guest";
let score = 0;
let pipes = [];
let particles = [];
let starsBackground = [];
let shootingStars = [];

// ===== STAR =====
let star = {
  x: 100,
  y: canvas.height / 2,
  radius: 12,
  vy: 0,
  gravity: 0.12,
  maxVy: 2.5,
  bobOffset: 0,
  bobDir: 1
};

// ===== BACKGROUND INIT =====
for (let i = 0; i < 50; i++) {
  starsBackground.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1
  });
}

// ===== HELPERS =====
function resetGame() {
  star.y = canvas.height / 2;
  star.vy = 0;
  star.bobOffset = 0;
  star.bobDir = 1;
  score = 0;
  pipes = [];
  particles = [];
  shootingStars = [];
  scoreDisplay.textContent = score;
}

function safeStartGame() {
  // ensure idempotent: if already started, do nothing
  if (gameStarted) return;
  gameStarted = true;

  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");

  scoreDisplay.style.display = "block";

  const nameVal = (playerNameInput && playerNameInput.value) ? playerNameInput.value.trim() : "";
  playerName = nameVal !== "" ? nameVal : "Guest";

  resetGame();
  starFalling = false; // remain bobbing until user "flaps" or we set falling true
  requestAnimationFrame(gameLoop);
}

// ===== INPUT HANDLERS =====
// start button: hide start overlay and start game, then start falling
startBtn.addEventListener("click", () => {
  startOverlay.classList.add("hidden");
  safeStartGame();
  starFalling = true;
});

// key input: start or flap
document.addEventListener("keydown", (e) => {
  // handle only relevant keys
  if (e.code === "Space" || e.code === "Enter") {
    // prevent page scrolling on Space
    e.preventDefault();
  } else {
    return;
  }

  // If game hasn't started, start it (and begin falling)
  if (!gameStarted) {
    safeStartGame();
    starFalling = true;
    return;
  }

  // otherwise if the star is falling, flap
  if (starFalling && e.code === "Space") {
    star.vy = -2.5;
  }
});

// pointer/tap input: same behavior as Space
document.addEventListener("pointerdown", () => {
  if (!gameStarted) {
    startOverlay.classList.add("hidden");
    safeStartGame();
    starFalling = true;
    return;
  }
  if (starFalling) {
    star.vy = -2.5;
  }
});

// ===== GAME LOOP =====
function gameLoop() {
  // wrap loop body in try/catch so runtime errors don't silently stop RAF
  try {
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw/update
    drawBackground();
    updateStar();
    updatePipes();
    updateParticles();
    drawStar();

    // UI
    scoreDisplay.textContent = score;
  } catch (err) {
    console.error("Game loop error:", err);
    // stop the game to avoid broken state; show end overlay so player can restart.
    gameStarted = false;
    endOverlay.classList.remove("hidden");
    finalScoreEl.textContent = `Error`;
    return;
  }

  // schedule next frame
  if (gameStarted) requestAnimationFrame(gameLoop);
}

// ===== BACKGROUND DRAWING =====
function drawBackground() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // slightly drifting stars
  starsBackground.forEach(s => {
    s.x -= 0.12; // slow left drift
    if (s.x < -2) s.x = canvas.width + 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  });
}

// ===== STAR LOGIC =====
function updateStar() {
  // pre-start bobbing
  if (!starFalling) {
    star.bobOffset += 0.5 * star.bobDir;
    if (star.bobOffset > 4 || star.bobOffset < -4) star.bobDir *= -1;
    star.y = canvas.height / 2 + star.bobOffset;
    return;
  }

  // apply gravity & cap
  star.vy += star.gravity;
  if (!isFinite(star.vy)) star.vy = 0;
  if (star.vy > star.maxVy) star.vy = star.maxVy;
  star.y += star.vy;

  // add velocity-reactive trail particle
  const trailSize = Math.max(0.6, Math.abs(star.vy) * 1.6 + 0.6);
  particles.push({
    x: star.x,
    y: star.y,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.05,
    r: trailSize,
    life: 20
  });

  // rare shooting star
  if (Math.random() < 0.0022) {
    shootingStars.push({
      x: canvas.width + 10,
      y: Math.random() * (canvas.height * 0.45),
      vx: -4.2,
      vy: 0,
      r: 2.5,
      life: 70
    });
  }

  // floor collision
  if (star.y + star.radius > canvas.height) {
    // clamp inside canvas so visuals look okay before explosion
    star.y = canvas.height - star.radius;
    createExplosion(star.x, star.y);
    shakeScreen();
    endGame();
  }
}

function drawStar() {
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffeb8a";
  ctx.fill();
}

// ===== PIPES =====
let pipeGap = 140;
let pipeSpacing = 290;

function updatePipes() {
  // spawn logic
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
    const topH = Math.random() * (canvas.height / 2) + 60;
    pipes.push({
      x: canvas.width + 6,
      top: topH,
      bottom: canvas.height - topH - pipeGap,
      width: 44,
      passed: false
    });
  }

  // move / draw / collisions
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= 2;

    // draw
    ctx.fillStyle = "#33aaff";
    ctx.fillRect(p.x, 0, p.width, p.top);
    ctx.fillRect(p.x, canvas.height - p.bottom, p.width, p.bottom);

    // collision check when overlapping in X
    const collisionX = star.x + star.radius > p.x && star.x - star.radius < p.x + p.width;
    if (collisionX) {
      const hitTop = star.y - star.radius < p.top;
      const hitBottom = star.y + star.radius > canvas.height - p.bottom;
      if (hitTop || hitBottom) {
        createExplosion(star.x, star.y);
        shakeScreen();
        endGame();
        return; // stop processing pipes (we ended)
      }
    }

    // score
    if (p.x + p.width < star.x && !p.passed) {
      p.passed = true;
      score++;
    }

    // remove off-screen
    if (p.x + p.width < -20) {
      pipes.splice(i, 1);
    }
  }
}

// ===== PARTICLES & SHOOTING STARS =====
function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4.2,
      vy: (Math.random() - 0.5) * 4.2,
      r: Math.random() * 3 + 0.6,
      life: 28 + Math.floor(Math.random() * 10)
    });
  }
}

function updateParticles() {
  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02; // tiny gravity for particles
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.6, p.r), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,235,138,0.95)";
    ctx.fill();
  }

  // shooting stars
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    if (s.life <= 0 || s.x < -20) shootingStars.splice(i, 1);
  }
}

// ===== SCREEN SHAKE =====
function shakeScreen() {
  canvas.style.transform = `translate(${(Math.random() * 6 - 3).toFixed(2)}px,${(Math.random() * 6 - 3).toFixed(2)}px)`;
  setTimeout(() => (canvas.style.transform = ""), 60);
}

// ===== END / LEADERBOARD HANDLERS =====
function endGame() {
  // stop loop
  gameStarted = false;
  starFalling = false;

  endOverlay.classList.remove("hidden");
  finalScoreEl.textContent = `Score: ${score}`;
  saveScore();
}

restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  playerNameInput && playerNameInput.focus();
  resetGame();
};

viewLeaderboardBtn.onclick = (e) => {
  e && e.stopPropagation();
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
  endOverlay.classList.add("hidden");
};

closeLeaderboardBtn.onclick = () => {
  leaderboardModal.classList.add("hidden");
  endOverlay.classList.remove("hidden");
};

// ===== LEADERBOARD =====
function saveScore() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  board.push({ name: playerName, score });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board.slice(0, 50)));
}

function populateLeaderboard() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  leaderboardList.innerHTML = "";
  let addedCurrent = false;

  for (let i = 0; i < board.length; i++) {
    const entry = board[i];
    const row = document.createElement("div");
    row.className = "lb-row";

    const num = document.createElement("div");
    num.className = "lb-num";
    num.textContent = i + 1;

    const name = document.createElement("div");
    name.className = "lb-name";
    name.textContent = entry.name;

    const sc = document.createElement("div");
    sc.className = "lb-score";
    sc.textContent = entry.score;

    if (!addedCurrent && entry.name === playerName && entry.score === score) {
      row.classList.add("current");
      addedCurrent = true;
    }

    row.appendChild(num);
    row.appendChild(name);
    row.appendChild(sc);
    leaderboardList.appendChild(row);
    if (i >= 4) break; // show top 5
  }

  if (!addedCurrent) {
    const row = document.createElement("div");
    row.className = "lb-row current";

    const num = document.createElement("div");
    num.className = "lb-num";
    num.textContent = "—";

    const name = document.createElement("div");
    name.className = "lb-name";
    name.textContent = playerName;

    const sc = document.createElement("div");
    sc.className = "lb-score";
    sc.textContent = score;

    row.appendChild(num);
    row.appendChild(name);
    row.appendChild(sc);
    leaderboardList.appendChild(row);
  }
}

// ===== PAGE LOAD INIT =====
document.addEventListener("DOMContentLoaded", () => {
  // ensure overlays are properly hidden/shown
  gameStarted = false;
  starFalling = false;
  startOverlay.classList.remove("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display = "none";

  // initialize
  resetGame();
});
