// ===== CANVAS SETUP =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 420;
canvas.height = 640;

// ===== GAME STATE =====
let gameActive = false;
let gameStarted = false;
let gameOver = false;
let score = 0;

// ===== STAR (PLAYER) =====
const star = {
  x: canvas.width * 0.3,
  y: canvas.height * 0.5,
  radius: 20,
  velocity: 0,
  gravity: 0.22,
  maxGravity: 6,
  hoverOffset: 0,
  hoverDir: 1,
  hidden: false
};

// ===== PARALLAX STARFIELD =====
const starLayers = [
  { speed: 0.15, stars: [] },
  { speed: 0.3, stars: [] },
  { speed: 0.6, stars: [] }
];

function initStarfield() {
  // clear existing stars
  starLayers.forEach(layer => layer.stars = []);

  // Layer 0: farthest, slowest, smallest, more sparse
  for (let i = 0; i < 50; i++) {
    starLayers[0].stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.2 + 0.5,
      alpha: Math.random() * 0.4 + 0.3
    });
  }

  // Layer 1: middle layer
  for (let i = 0; i < 40; i++) {
    starLayers[1].stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.5 + 0.3
    });
  }

  // Layer 2: closest, fastest, slightly larger
  for (let i = 0; i < 30; i++) {
    starLayers[2].stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.4
    });
  }
}

function drawStarfield() {
  starLayers.forEach(layer => {
    layer.stars.forEach((s, i) => {
      s.x -= layer.speed;
      if (s.x < 0) s.x = canvas.width;

      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

// ===== SHOOTING STARS =====
let shootingStars = [];
let lastShootingStarTime = 0;

function spawnShootingStar() {
  if (Date.now() - lastShootingStarTime < 6000 + Math.random() * 6000) return;
  lastShootingStarTime = Date.now();

  shootingStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.4,
    speed: 2.5 + Math.random() * 1.5,
    alpha: 1
  });
}

function drawShootingStars() {
  shootingStars.forEach((s, i) => {
    s.x += s.speed;
    s.y += s.speed * 0.4;
    s.alpha -= 0.01;

    ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - 22, s.y - 7);
    ctx.stroke();

    if (s.alpha <= 0) shootingStars.splice(i, 1);
  });
}

// ===== PIPES =====
let pipes = [];
const pipeWidth = 110;

function spawnPipe() {
  const pipeGap = 190 + Math.random() * 40;
  const topHeight = 80 + Math.random() * (canvas.height - pipeGap - 160);
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false
  });
}

function drawPipes() {
  ctx.fillStyle = "rgba(138,199,255,0.7)";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
  });
}

function updatePipes() {
  pipes.forEach(pipe => {
    pipe.x -= 2;

    if (!pipe.passed && pipe.x + pipeWidth < star.x) {
      score++;
      pipe.passed = true;
    }
  });

  pipes = pipes.filter(p => p.x + pipeWidth > 0);
}

// ===== SHATTER =====
let shatterParticles = [];

function createShatter(x, y) {
  for (let i = 0; i < 22; i++) {
    shatterParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1
    });
  }
}

function drawShatter() {
  shatterParticles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;

    ctx.fillStyle = `rgba(255,235,170,${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    if (p.life <= 0) shatterParticles.splice(i, 1);
  });
}

// ===== COLLISION =====
function checkCollision() {
  for (let pipe of pipes) {
    if (
      star.x + star.radius > pipe.x &&
      star.x - star.radius < pipe.x + pipeWidth &&
      (star.y - star.radius < pipe.top || star.y + star.radius > pipe.bottom)
    ) {
      endGame();
      return;
    }
  }
}

// ===== GAME FLOW =====
function startGame() {
  document.getElementById("start-screen").style.display = "none";
  gameStarted = true;
  gameActive = true;
}

function endGame() {
  gameActive = false;
  gameOver = true;
  createShatter(star.x, star.y);
  star.hidden = true;
  star.velocity = 0;

  document.getElementById("final-score").textContent = `Score: ${score}`;
  setTimeout(() => {
    document.getElementById("game-over-screen").style.display = "flex";
  }, 400);
}

function resetGame() {
  gameActive = false;
  gameStarted = false;
  gameOver = false;

  star.y = canvas.height * 0.5;
  star.velocity = 0;
  star.hidden = false;

  pipes = [];
  shatterParticles = [];
  score = 0;

  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "flex";
}

// ===== INPUT =====
function flap() {
  if (!gameStarted) return startGame();
  if (!gameActive) return;
  star.velocity = -4.4;
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") flap();
});
canvas.addEventListener("pointerdown", flap);

document.getElementById("restart-btn").addEventListener("click", resetGame);
document.querySelector("#start-screen .btn-start").addEventListener("click", startGame);

// ===== MAIN LOOP =====
let pipeTimer = 0;

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStarfield();
  spawnShootingStar();
  drawShootingStars();

  if (!gameActive && !gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // gentle hover
  if (!gameActive) {
    star.hoverOffset += 0.03 * star.hoverDir;
    if (Math.abs(star.hoverOffset) > 5) star.hoverDir *= -1;
    star.y = canvas.height * 0.5 + star.hoverOffset;
  } else {
    star.velocity += star.gravity;
    if (star.velocity > star.maxGravity) star.velocity = star.maxGravity;
    star.y += star.velocity;
  }

  pipeTimer++;
  if (pipeTimer > 110 + Math.floor(Math.random() * 40)) {
    spawnPipe();
    pipeTimer = 0;
  }

  updatePipes();
  drawPipes();

  if (gameActive) checkCollision();

  if (!star.hidden) {
    ctx.fillStyle = "#ffeab2";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShatter();

  // score display
  ctx.font = "34px Quicksand";
  ctx.fillStyle = "#fff8e8";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.strokeText(score, canvas.width / 2 - 10, 80);
  ctx.fillText(score, canvas.width / 2 - 10, 80);

  requestAnimationFrame(update);
}

// ===== INIT =====
initStarfield();
update();
