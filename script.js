const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

let star = {
  x: 80,
  y: canvas.height / 2,
  radius: 12,
  velocity: 0
};

const gravity = 0.5;
const flapStrength = -8;

let pillars = [];
const pillarWidth = 60;
const pillarGap = 150;
let frame = 0;
let score = 0;
let gameOver = false;

// create pillars
function addPillar() {
  const topHeight = Math.random() * (canvas.height - pillarGap - 50) + 30;
  pillars.push({
    x: canvas.width,
    top: topHeight,
    bottom: canvas.height - topHeight - pillarGap
  });
}

// game loop
function update() {
  if (gameOver) return;

  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // gravity & movement
  star.velocity += gravity;
  star.y += star.velocity;

  // draw star
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.closePath();

  // Add pillars
  if (frame % 90 === 0) addPillar();

  // Draw pillars & check collisions
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
    }

    // score
    if (!p.passed && p.x + pillarWidth < star.x) {
      score++;
      document.getElementById('score').innerText = score;
      p.passed = true;
    }
  }

  // out of bounds
  if (star.y + star.radius > canvas.height || star.y - star.radius < 0) {
    gameOver = true;
  }

  if (!gameOver) requestAnimationFrame(update);
}

function flap() {
  star.velocity = flapStrength;
}

// input
document.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});

document.addEventListener('click', flap);

// start game
update();
