// ================= ELEMENTS =================
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

// ================= GAME VARIABLES =================
let gameStarted = false;
let starFalling = false;
let playerName = "Guest";
let score = 0;
let pipes = [];
let particles = [];
let starsBackground = [];
let shootingStars = [];

// ================= CANVAS =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

// ================= STAR =================
let star = { x:100, y:canvas.height/2, radius:12, vy:0, gravity:0.12, maxVy:2.5, bobOffset:0, bobDir:1 };

// ================= INITIALIZE BACKGROUND STARS =================
for (let i=0;i<60;i++){
  starsBackground.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*2+1});
}

// ================= FUNCTIONS =================
function resetGame(){
  star.y = canvas.height/2;
  star.vy = 0;
  star.bobOffset = 0;
  star.bobDir = 1;
  score = 0;
  pipes = [];
  particles = [];
  shootingStars = [];
}

// ================= START GAME =================
function startGame(){
  if(gameStarted) return;
  gameStarted = true;
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display = "block";

  const nameVal = playerNameInput.value.trim();
  playerName = nameVal !== "" ? nameVal : "Guest";

  resetGame();
  starFalling = false; // bobbing first
  requestAnimationFrame(gameLoop);
}

startBtn.onclick = () => { startGame(); starFalling = true; };

document.addEventListener("keydown", e=>{
  if(!gameStarted){
    if(e.code==="Space"||e.code==="Enter"){ startGame(); starFalling = true; }
  } else if(starFalling && e.code==="Space"){
    star.vy=-2.5;
  }
});

document.addEventListener("pointerdown", ()=>{
  if(!gameStarted){ startGame(); starFalling=true; }
  else if(starFalling){ star.vy=-2.5; }
});

// ================= GAME LOOP =================
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  updateStar();
  updatePipes();
  updateParticles();
  drawStar();
  scoreDisplay.textContent = score;
  if(gameStarted) requestAnimationFrame(gameLoop);
}

// ================= DRAW BACKGROUND =================
function drawBackground(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  starsBackground.forEach(s=>{
    s.x-=0.2;
    if(s.x<0) s.x=canvas.width;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
  });
}

// ================= STAR =================
function updateStar(){
  if(!starFalling){
    star.bobOffset+=0.5*star.bobDir;
    if(star.bobOffset>4 || star.bobOffset<-4) star.bobDir*=-1;
    star.y = canvas.height/2 + star.bobOffset;
    return;
  }

  star.vy+=star.gravity;
  if(star.vy>star.maxVy) star.vy=star.maxVy;
  star.y+=star.vy;

  let trailClass = "slow";
  if(star.vy>1.5) trailClass="fast";
  else if(star.vy>0.75) trailClass="medium";

  particles.push({x:star.x,y:star.y,vx:(Math.random()-0.5)*0.2,vy:0,r: Math.random()*(star.vy+1)*2,life:20,type:trailClass});

  if(Math.random()<0.001) shootingStars.push({x:canvas.width, y:Math.random()*canvas.height/2, vx:-4, vy:0, r:3, life:60});

  if(star.y+star.radius>canvas.height){
    createExplosion(star.x, star.y);
    shakeScreen();
    endGame();
  }
}

function drawStar(){
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius,0,Math.PI*2);
  ctx.fillStyle="#ffeb8a";
  ctx.fill();
}

// ================= PIPES =================
let pipeGap = 140;
let pipeSpacing = 280;

function updatePipes(){
  if(pipes.length===0 || pipes[pipes.length-1].x<canvas.width-pipeSpacing){
    let topH = Math.random()*(canvas.height/2)+60;
    pipes.push({x:canvas.width, top:topH, bottom:canvas.height-topH-pipeGap, passed:false});
  }

  pipes.forEach((p,i)=>{
    p.x-=2;
    ctx.fillStyle="#33aaff";
    ctx.fillRect(p.x,0,40,p.top);
    ctx.fillRect(p.x,canvas.height-p.bottom,40,p.bottom);

    if(star.x+star.radius>p.x && star.x-star.radius<p.x+40){
      if(star.y-star.radius<p.top || star.y+star.radius>canvas.height-p.bottom){
        createExplosion(star.x,star.y);
        shakeScreen();
        endGame();
      }
    }

    if(p.x+40<0) pipes.splice(i,1);
    if(p.x+40<star.x && !p.passed){ score++; p.passed=true; }
  });
}

// ================= PARTICLES =================
function createExplosion(x,y){
  for(let i=0;i<15;i++){
    particles.push({
      x:x, y:y,
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

  shootingStars.forEach((s,i)=>{
    s.x+=s.vx;
    s.y+=s.vy;
    s.life--;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
    if(s.life<=0) shootingStars.splice(i,1);
  });
}

// ================= SCREEN SHAKE =================
function shakeScreen(){
  canvas.style.transform=`translate(${Math.random()*6-3}px,${Math.random()*6-3}px)`;
  setTimeout(()=>{canvas.style.transform="";},50);
}

// ================= END GAME =================
function endGame(){
  gameStarted=false;
  starFalling=false;
  endOverlay.classList.remove("hidden");
  endOverlay.style.display="flex";
  finalScoreEl.textContent = `Score: ${score}`;
  saveScore();
}

restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  startOverlay.style.display="flex";
  playerNameInput.focus();
  resetGame();
};

viewLeaderboardBtn.onclick = (e) => {
  e.stopPropagation();
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
  endOverlay.style.display="none";
};

closeLeaderboardBtn.onclick = () => {
  leaderboardModal.classList.add("hidden");
  endOverlay.style.display="flex";
};

// ================= LEADERBOARD =================
function saveScore(){
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  board.push({name:playerName, score});
  board.sort((a,b)=>b.score-b.score);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board.slice(0,50)));
}

function populateLeaderboard(){
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  leaderboardList.innerHTML = "";
  let addedCurrent=false;

  board.forEach((entry,i)=>{
    const row=document.createElement("div"); row.className="lb-row";
    const num=document.createElement("div"); num.className="lb-num"; num.textContent=i+1;
    const name=document.createElement("div"); name.className="lb-name"; name.textContent=entry.name;
    const sc=document.createElement("div"); sc.className="lb-score"; sc.textContent=entry.score;
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

// ================= PAGE LOAD INITIALIZATION =================
document.addEventListener("DOMContentLoaded", ()=>{
  gameStarted=false;
  starFalling=false;
  startOverlay.classList.remove("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display="none";
  resetGame();
});
