const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

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

let running = false;
let score = 0;
let lastTime = 0;
let playerName = "guest";
let pipes = [];
let particles = [];
let bgStars = [];

const star = {
  x: 110,
  y: canvas.height / 2,
  r: 14,
  vy: 0,
  gravity: 850,
  jumpPower: -310
};

// setup background stars
for (let i = 0; i < 40; i++) {
  bgStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.3 + 0.1
  });
}

function jump() {
  if (!running) return;
  star.vy = star.jumpPower;
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

document.addEventListener("pointerdown", e => {
  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
    jump();
  }
});

startBtn.onclick = () => {
  playerName = playerNameInput.value.trim() || "guest";
  
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  canvas.style.display = "block";
  scoreDisplay.style.display = "block";
  
  resetGame();
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
};

restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  canvas.style.display = "none";
};

viewLeaderboardBtn.onclick = () => {
  showLeaderboard();
  leaderboardModal.classList.remove("hidden");
};

closeLeaderboardBtn.onclick = () => {
  leaderboardModal.classList.add("hidden");
  endOverlay.classList.remove("hidden");
};

function resetGame() {
  score = 0;
  pipes = [];
  particles = [];
  star.y = canvas.height / 2;
  star.vy = 0;
  scoreDisplay.textContent = "0";
}

function gameLoop(time) {
  if (!running) return;
  
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  
  update(dt);
  draw();
  
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  bgStars.forEach(s => s.twinkle += dt * s.speed);
  
  star.vy += star.gravity * dt;
  star.y += star.vy * dt;
  
  // spawn trail particles
  if (Math.random() < 0.6) {
    particles.push({
      x: star.x + (Math.random() - 0.5) * 8,
      y: star.y + (Math.random() - 0.5) * 8,
      r: Math.random() * 2.5 + 1.5,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      life: 20
    });
  }
  
  // update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life--;
    particles[i].x += particles[i].vx * dt;
    particles[i].y += particles[i].vy * dt;
    particles[i].r *= 0.96;
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
  
  // spawn pipes
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
    const gap = 170;
    const minTop = 80;
    const maxTop = canvas.height - gap - 80;
    const top = Math.random() * (maxTop - minTop) + minTop;
    pipes.push({ x: canvas.width, top, gap, passed: false });
  }
  
  // update pipes
  for (let i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= 140 * dt;
    
    if (!pipes[i].passed && pipes[i].x + 40 < star.x) {
      pipes[i].passed = true;
      score++;
      scoreDisplay.textContent = score;
    }
    
    // collision check
    if (star.x + star.r > pipes[i].x && 
        star.x - star.r < pipes[i].x + 40) {
      if (star.y - star.r < pipes[i].top || 
          star.y + star.r > pipes[i].top + pipes[i].gap) {
        gameOver();
      }
    }
    
    if (pipes[i].x < -60) {
      pipes.splice(i, 1);
    }
  }
  
  // check bounds
  if (star.y + star.r > canvas.height || star.y - star.r < 0) {
    gameOver();
  }
}

function draw() {
  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0a0e27');
  grad.addColorStop(1, '#1a1d3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawBackgroundStars();
  drawPipes();
  drawParticles();
  drawStar();
}

function drawBackgroundStars() {
  bgStars.forEach(s => {
    const alpha = (Math.sin(s.twinkle) + 1) / 2 * 0.7 + 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawStar() {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffeb8a';
  ctx.fillStyle = '#ffeb8a';
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
  ctx.fill();
  
  // inner glow
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff9d6';
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipes() {
  pipes.forEach(p => {
    const gradient = ctx.createLinearGradient(p.x, 0, p.x + 40, 0);
    gradient.addColorStop(0, '#2d7ab5');
    gradient.addColorStop(0.5, '#3fa9f5');
    gradient.addColorStop(1, '#2d7ab5');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(p.x, 0, 40, p.top);
    ctx.fillRect(p.x, p.top + p.gap, 40, canvas.height);
    
    // pipe caps
    ctx.fillStyle = '#5bc0ff';
    ctx.fillRect(p.x - 3, p.top - 25, 46, 25);
    ctx.fillRect(p.x - 3, p.top + p.gap, 46, 25);
    
    // shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(p.x + 3, 0, 8, p.top);
    ctx.fillRect(p.x + 3, p.top + p.gap, 8, canvas.height);
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 20;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffeb8a';
    ctx.fillStyle = '#ffeb8a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function gameOver() {
  running = false;
  endOverlay.classList.remove("hidden");
  scoreDisplay.style.display = "none";
  finalScoreEl.textContent = `score: ${score}`;
  saveScore();
}

function saveScore() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  board.push({ name: playerName, score });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board.slice(0, 10)));
}

function showLeaderboard() {
  leaderboardList.innerHTML = "";
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  
  if (board.length === 0) {
    leaderboardList.innerHTML = '<div style="text-align: center; opacity: 0.6; padding: 20px;">no scores yet</div>';
    return;
  }
  
  board.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "lb-row";
    row.innerHTML = `<div>${i + 1}</div><div>${entry.name}</div><div>${entry.score}</div>`;
    leaderboardList.appendChild(row);
  });
}
