// ================= START =================
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerNameInput");

let playerName = "Guest";
let gameStarted = false;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  const nameVal = playerNameInput.value.trim();
  playerName = nameVal !== "" ? nameVal : "Guest";

  startOverlay.classList.add("hidden");
  resetGame();
  requestAnimationFrame(gameLoop);
}

startBtn.onclick = () => startGame();

document.addEventListener("keydown", (e) => {
  if (!gameStarted && (e.code === "Space" || e.code === "Enter")) {
    e.preventDefault();
    startGame();
  }
});

document.addEventListener("pointerdown", () => {
  if (!gameStarted) startGame();
});

// ================= GAME STATE & ELEMENTS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

// ================= STAR =================
let star = {
  x: 100,
  y: canvas.height/2,
  radius: 12,
  vy: 0,
  gravity: 0.15,
  maxVy: 3,
  bobOffset: 0,
  bobDir: 1
};

let pipes = [];
let pipeGap = 140;
let pipeSpacing = 280;
let lastPipeX = 400;
let score = 0;
let particles = [];
let starsBackground = [];
let shootingStars = [];

// ================= INIT STARS =================
for (let i=0;i<60;i++){
  starsBackground.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2 +1});
}

// ================= GAME LOOP =================
function resetGame(){
  star.y = canvas.height/2;
  star.vy = 0;
  star.bobOffset = 0;
  star.bobDir = 1;
  score = 0;
  pipes = [];
  particles = [];
}

function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  updateStar();
  updatePipes();
  updateParticles();
  drawStar();

  if(gameStarted) requestAnimationFrame(gameLoop);
}

function drawBackground(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  starsBackground.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
  });
}

function updateStar(){
  if(!gameStarted){
    star.bobOffset += 0.5*star.bobDir;
    if(star.bobOffset>4 || star.bobOffset<-4) star.bobDir*=-1;
    star.y = canvas.height/2 + star.bobOffset;
    return;
  }

  star.vy += star.gravity;
  if(star.vy>star.maxVy) star.vy = star.maxVy;
  star.y += star.vy;

  // collision with bottom
  if(star.y+star.radius>canvas.height){
    createExplosion(star.x, star.y);
    endGame();
  }
}

function drawStar(){
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI*2);
  ctx.fillStyle="#ffeb8a";
  ctx.fill();
}

function updatePipes(){
  if(pipes.length==0 || pipes[pipes.length-1].x<canvas.width-pipeSpacing){
    let topH = Math.random()*(canvas.height/2) + 60;
    pipes.push({x:canvas.width, top:topH, bottom:canvas.height-topH-pipeGap});
  }

  pipes.forEach((p,i)=>{
    p.x -= 2;
    ctx.fillStyle="#33aaff";
    ctx.fillRect(p.x,0,40,p.top);
    ctx.fillRect(p.x,canvas.height-p.bottom,40,p.bottom);

    if(star.x+star.radius>p.x && star.x-star.radius<p.x+40){
      if(star.y-star.radius<p.top || star.y+star.radius>canvas.height-p.bottom){
        createExplosion(star.x, star.y);
        shakeScreen();
        endGame();
      }
    }

    if(p.x+40<0) pipes.splice(i,1);
    if(p.x+40<star.x && !p.passed){score++; p.passed=true;}
  });
}

function createExplosion(x,y){
  for(let i=0;i<15;i++){
    particles.push({
      x:x,
      y:y,
      vx:(Math.random()-0.5)*4,
      vy:(Math.random()-0.5)*4,
      r: Math.random()*3+1,
      life:30
    });
  }
}

function updateParticles(){
  particles.forEach((p,i)=>{
    p.x+=p.vx;
    p.y+=p.vy;
    p.life--;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="#ffeb8a";
    ctx.fill();
    if(p.life<=0) particles.splice(i,1);
  });
}

function shakeScreen(){
  canvas.style.transform = `translate(${Math.random()*6-3}px,${Math.random()*6-3}px)`;
  setTimeout(()=>{canvas.style.transform="";},50);
}

// ================= END / LEADERBOARD =================
const endOverlay = document.getElementById("endOverlay");
const restartBtn = document.getElementById("restartBtn");
const viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
const finalScoreEl = document.getElementById("final-score");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");

function endGame() {
  gameStarted = false;
  endOverlay.classList.remove("hidden");
  finalScoreEl.textContent = `Score: ${score}`;
  saveScore();
}

restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  playerNameInput.focus();
  resetGame();
};

viewLeaderboardBtn.onclick = () => {
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
};

closeLeaderboardBtn.onclick = () => leaderboardModal.classList.add("hidden");

function saveScore() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  board.push({name:playerName, score});
  board.sort((a,b)=>b.score-a.score);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board.slice(0,50)));
}

function populateLeaderboard() {
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  leaderboardList.innerHTML = "";

  let addedCurrent=false;

  board.forEach((entry,i)=>{
    const row=document.createElement("div");
    row.className="lb-row";
    const num=document.createElement("div");
    num.className="lb-num"; num.textContent=i+1;
    const name=document.createElement("div");
    name.className="lb-name"; name.textContent=entry.name;
    const sc=document.createElement("div");
    sc.className="lb-score"; sc.textContent=entry.score;

    if(entry.name===playerName && entry.score===score && !addedCurrent){
      row.classList.add("current");
      addedCurrent=true;
    }
    row.appendChild(num); row.appendChild(name); row.appendChild(sc);
    leaderboardList.appendChild(row);
  });

  if(!addedCurrent){
    const row=document.createElement("div"); row.className="lb-row current";
    const num=document.createElement("div"); num.className="lb-num"; num.textContent="—";
    const name=document.createElement("div"); name.className="lb-name"; name.textContent=playerName;
    const sc=document.createElement("div"); sc.className="lb-score"; sc.textContent=score;
    row.appendChild(num); row.appendChild(name); row.appendChild(sc);
    leaderboardList.appendChild(row);
  }
}
