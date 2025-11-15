// INITIAL SETUP
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

let gameStarted = false;
let gameOver = false;
let score = 0;
let username = "Guest";

const star = {
    x: 150,
    y: canvas.height / 2,
    radius: 22,
    vy: 0,
};

let particles = [];
let pipes = [];
let starsBG = [];
let shootingStars = [];

let keys = {};

// PARALLAX STAR BACKGROUND
function createStarLayer(amount, speedFactor) {
    const arr = [];
    for (let i = 0; i < amount; i++) {
        arr.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.8 + 0.3,
            speedFactor
        });
    }
    return arr;
}

starsBG = [
    ...createStarLayer(35, 0.2),
    ...createStarLayer(25, 0.5),
    ...createStarLayer(15, 0.8)
];

// INPUT
document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (!gameStarted && e.code === "Space") startGame();
});

document.addEventListener("keyup", (e) => keys[e.code] = false);

canvas.addEventListener("touchstart", () => {
    if (!gameStarted) startGame();
    keys["Space"] = true;
});
canvas.addEventListener("touchend", () => (keys["Space"] = false));

document.getElementById("startBtn").onclick = startGame;

// GAME START
function startGame() {
    if (gameStarted) return;

    const input = document.getElementById("usernameInput");
    username = input.value.trim() || "Guest";   // ⭐ fallback

    gameStarted = true;
    score = 0;

    document.getElementById("nameEntry").classList.add("hidden");
    animate();
}

// PIPE GENERATION
function createPipe() {
    const gap = 220;
    const minY = 80;
    const maxY = canvas.height - 80 - gap;
    const topY = Math.random() * (maxY - minY) + minY;

    pipes.push({
        x: canvas.width,
        top: topY,
        bottom: topY + gap,
        width: 80
    });
}

setInterval(createPipe, 1800);

// STAR SHATTER PARTICLES
function spawnShatter(x, y) {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            alpha: 1
        });
    }
}

// rare spark explosion when passing tight gap
function sparkBurst(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 3 + 2,
            alpha: 1,
            spark: true
        });
    }
}

// SHOOTING STARS
setInterval(() => {
    if (Math.random() < 0.2) {
        shootingStars.push({
            x: Math.random() * canvas.width,
            y: -20,
            vx: -10 - Math.random() * 5,
            vy: 10 + Math.random() * 5,
            alpha: 1
        });
    }
}, 6000);

// LEADERBOARD
function saveScore() {
    let board = JSON.parse(localStorage.getItem("leaderboard") || "[]");

    board.push({ name: username, score });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);

    localStorage.setItem("leaderboard", JSON.stringify(board));
}

function showLeaderboard() {
    const box = document.getElementById("leaderboardList");
    const board = JSON.parse(localStorage.getItem("leaderboard") || "[]");

    box.innerHTML = board
        .map((e, i) => `<p>${i + 1}. <strong>${e.name}</strong> — ${e.score}</p>`)
        .join("");

    document.getElementById("leaderboardModal").classList.remove("hidden");
}

document.getElementById("viewLeaderboardBtn").onclick = showLeaderboard;
document.getElementById("closeLeaderboardBtn").onclick = () => {
    document.getElementById("leaderboardModal").classList.add("hidden");
};

// GAME OVER
function endGame() {
    if (gameOver) return;
    gameOver = true;

    saveScore();

    document.getElementById("finalScore").textContent = `Your Score: ${score}`;
    document.getElementById("gameOverScreen").classList.remove("hidden");

    document.getElementById("restartBtn").onclick = () => location.reload();
}

// MAIN LOOP
function animate() {
    if (!gameStarted || gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw parallax stars
    starsBG.forEach(s => {
        s.x -= s.speedFactor;
        if (s.x < 0) s.x = canvas.width;
        ctx.fillStyle = "white";
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // shooting stars
    shootingStars.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.01;

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "white";
        ctx.fillRect(s.x, s.y, 4, 4);
        ctx.globalAlpha = 1;
    });
    shootingStars = shootingStars.filter(s => s.alpha > 0);

    // PIPES
    pipes.forEach(pipe => {
        pipe.x -= 4;

        ctx.fillStyle = "#0af";
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);

        // collisions
        if (
            star.x + star.radius > pipe.x &&
            star.x - star.radius < pipe.x + pipe.width &&
            (star.y - star.radius < pipe.top || star.y + star.radius > pipe.bottom)
        ) {
            spawnShatter(star.x, star.y);
            screenShake = 10;
            endGame();
        }

        // score
        if (!pipe.scored && pipe.x + pipe.width < star.x) {
            score++;
            document.getElementById("scoreDisplay").textContent = score;

            const gapTightness = pipe.bottom - pipe.top;
            if (gapTightness < 170 && Math.random() < 0.4) {
                sparkBurst(star.x, star.y);
            }

            pipe.scored = true;
        }
    });

    // gravity & movement
    star.vy += 0.4;
    if (keys["Space"]) star.vy = -6.5;
    star.y += star.vy;

    // draw star
    if (!gameOver) {
        ctx.fillStyle = "gold";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.spark ? "white" : "gold";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    particles = particles.filter(p => p.alpha > 0);

    // bounds
    if (star.y - star.radius < 0 || star.y + star.radius > canvas.height) {
        spawnShatter(star.x, star.y);
        screenShake = 10;
        endGame();
    }

    requestAnimationFrame(animate);
}

