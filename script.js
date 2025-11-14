const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let starX = 100;
let starY = canvas.height / 2;
let starRadius = 12;
let velocity = 0;
let gravity = 0.08;
let gravityGrowthRate = 0.00018;
let maxGravity = 0.35;

let gameStarted = false;
let gameActive = false;

let score = 0;
let pipes = [];
let pipeSpeed = 2;

// === PARALLAX STAR BACKGROUND ===
const bgStars = [
  { x: 0, speed: 0.2, img: new Image() },
  { x: 0, speed: 0.5, img: new Image() },
  { x: 0, speed: 1.0, img: new Image() }
];

bgStars[0].img.src = "assets/stars-small.png";   // slow layer
bgStars[1].img.src = "assets/stars-med.png";     // medium layer
bgStars[2].img.src = "assets/stars-large.png";   // fast layer

// bobbing animation before game starts
let bobOffset = 0;
let bobDirection = 1;

// UI
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreText = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// start button
document.getElementById("start-btn").addEventListener("click", () => {
  startScreen.style.display = "none";
  gameStarted = true;
  gameActive = false; // game starts after first tap
});

// controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") flap();
});
window.addEventListener("mousedown", flap);

function flap() {
  if (!gameStarted) return;

  if (!gameActive) {
    gameActive = true;
    velocity = -3.2;
    return;
  }

  velocity = -3.2;
}

// reset game
function resetGame() {
  starY = canvas.height / 2;
  velocity = 0;
  gravity = 0.08;
  score = 0;
  pipes = [];
  gameOverScreen.style.display = "none";
  startScreen.style.display = "flex";

  gameStarted = false;
  gameActive = false;
}

// pipe generation
function spawnPipe() {
  const gap = 140;
  const topHeight = Math.random() * (canvas.height - gap - 100) + 40;

  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + gap
  });
}

setInterval(() => {
  if (gameActive) spawnPipe();
}, 1700);

// parallax star drawing
function drawParallaxStars() {
  bgStars.forEach(layer => {
    layer.x -= layer.speed;

    if (layer.x <= -canvas.width) layer.x = 0;

    ctx.drawImage(layer.img, layer.x, 0, canvas.width, canvas.height);
    ctx.drawImage(layer.img, layer.x + canvas.width, 0, canvas.width, canvas.height);
  });
}

// draw player star
function drawStar() {
  ctx.beginPath();
  ctx.fillStyle = "#ffe98a";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#fff7c2";
  
  ctx.arc(starX, starY, starRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

// main loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // PARALLAX BACKGROUND FIRST
  drawParallaxStars();

  if (!gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // hover animation before first flap
  if (!gameActive) {
    bobOffset += 0.015 * bobDirection;
    if (bobOffset > 3 || bobOffset < -3) bobDirection *= -1;

    const hoverY = (canvas.height / 2) + bobOffset;
    starY = hoverY;

    drawStar();
    requestAnimationFrame(update);
    return;
  }

  // gravity growth (slow)
  gravity = Math.min(maxGravity, gravity + gravityGrowthRate);

  // apply gravity
  velocity += gravity;
  starY += velocity;

  // draw star after physics
  drawStar();

  // draw pipes + check collision
  pipes.forEach((p, i) => {
    p.x -= pipeSpeed;

    ctx.fillStyle = "#8ac7ff";

    // top pipe
    ctx.fillRect(p.x, 0, 60, p.top);

    // bottom pipe
    ctx.fillRect(p.x, p.bottom, 60, canvas.height - p.bottom);

    // score
    if (p.x + 60 < starX && !p.scored) {
      score++;
      p.scored = true;
      document.getElementById("score").innerText = score;
    }

    // collision
    if (
      starX + starRadius > p.x &&
      starX - starRadius < p.x + 60 &&
      (starY - starRadius < p.top || starY + starRadius > p.bottom)
    ) {
      endGame();
    }

    // remove pipes
    if (p.x < -80) pipes.splice(i, 1);
  });

  // ground or ceiling collision
  if (starY + starRadius > canvas.height || starY - starRadius < 0) {
    endGame();
  }

  requestAnimationFrame(update);

  // === SHOOTING STARS ===
let shootingStars = [];
let lastShootingStarTime = 0;

function spawnShootingStar() {
  // about once every 6–12 seconds
  if (Date.now() - lastShootingStarTime < 6000 + Math.random() * 6000) return;
  lastShootingStarTime = Date.now();

  shootingStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * (canvas.height * 0.5),
    speed: 3 + Math.random() * 2,
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
    ctx.lineTo(s.x - 25, s.y - 8);
    ctx.stroke();

    if (s.alpha <= 0) shootingStars.splice(i, 1);
  });
}

}

function endGame() {
  gameActive = false;
  gameStarted = false;
  finalScoreText.textContent = score;
  gameOverScreen.style.display = "flex";
}

restartBtn.addEventListener("click", resetGame);

update();

