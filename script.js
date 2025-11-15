// ELEMENTS
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerNameInput");
const scoreDisplay = document.getElementById("scoreDisplay");

const endOverlay = document.getElementById("endOverlay");
const restartBtn = document.getElementById("restartBtn");
const endLeaderboardBtn = document.getElementById("endLeaderboardBtn");
const finalScoreEl = document.getElementById("final-score");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardList = document.getElementById("leaderboardList");
const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");

// CANVAS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

// GAME STATE
let gameStarted = false;
let starFalling = false;
let playerName = "guest";
let score = 0;
let pipes = [];
let particles = [];
let starsBackground = [];
let shootingStars = [];
let invulnerableFrames = 0;
let animationId;

// PLAYER STAR
let star = { x:100, y:canvas.height/2, radius:12, vy:0, gravity:0.12, maxVy:2.5, bobOffset:0, bobDir:1 };

// BACKGROUND STARS
for (let i=0;i<50;i++){
  starsBackground.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*2+1});
}

// RESET GAME
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

// START GAME
startBtn.onclick = () => {
  if(gameStarted) return;
  gameStarted = true;
  starFalling = false;
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display = "block";

  const nameVal = playerNameInput.value.trim();
  playerName = nameVal !== "" ? nameVal : "guest";

  resetGame();
  invulnerableFrames = 30;
  requestAnimationFrame(gameLoop);
};

// INPUT HANDLER
function handleJump(){
  if(!gameStarted) return;
  if(!starFalling){
    starFalling = true;
    star.vy = 0;
  } else if(invulnerableFrames <= 0){
    star.vy = -2.5;
  }
}
document.addEventListener("keydown", e => { if(e.code==="Space") handleJump(); });
document.addEventListener("pointerdown", handleJump);

// GAME LOOP
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  updateStar();
  updatePipes();
  updateParticles();
  drawStar();
  scoreDisplay.textContent = score;
  if(invulnerableFrames>0) invulnerableFrames--;
  animationId = requestAnimationFrame(gameLoop);
}

// BACKGROUND
function drawBackground(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  starsBackground.forEach(s=>{
    s.x -= 0.1;
    if(s.x<0) s.x=canvas.width;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
  });
}

// PLAYER STAR
function updateStar(){
  if(!starFalling){
    star.bobOffset += 0.5 * star.bobDir;
    if(star.bobOffset>4||star.bobOffset<-4) star.bobDir*=-1;
    star.y = canvas.height/2 + star.bobOffset;
    return;
  }

  star.vy += star.gravity;
  if(star.vy > star.maxVy) star.vy = star.maxVy;
  star.y += star.vy;

  particles.push({x:star.x, y:star.y, vx:0, vy:0, r:Math.max(1, star.vy*0.5), life:10});

  if(Math.random()<0.001){
    shootingStars.push({x:canvas.width, y:Math.random()*canvas.height/2, vx:-4, vy:0, r:2, life:50});
  }

  if(star.y + star.radius > canvas.height){
    if(invulnerableFrames>0){
      star.y = canvas.height-star.radius-1;
      star.vy = 0;
    } else {
      createExplosion(star.x, star.y);
      shakeScreen();
      endGame();
    }
  }
}

function drawStar(){
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius,0,Math.PI*2);
  ctx.fillStyle="#ffeb8a";
  ctx.fill();
}

// PIPES
let pipeGap = 140;
let pipeSpacing = 280;

function updatePipes(){
  if(pipes.length === 0 || pipes[pipes.length-1].x < canvas.width - pipeSpacing){
    let topH = Math.random()*(canvas.height/2)+60;
    pipes.push({x:canvas.width, top:topH, bottom:canvas.height-topH-pipeGap, passed:false, wobble: Math.random()*2});
  }

  pipes.forEach((p,i)=>{
    p.x -= 2;
    p.wobble = Math.sin(Date.now()/200 + i) * 2;

    let x = Math.round(p.x), w = 40;
    let topHeight = p.top + p.wobble;
    let bottomHeight = p.bottom + p.wobble;

    let topGrad = ctx.createLinearGradient(x,0,x+w,topHeight);
    topGrad.addColorStop(0,"#33aaff");
    topGrad.addColorStop(1,"#0077cc");
    ctx.fillStyle = topGrad;
    ctx.fillRect(x,0,w,topHeight);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x+5,0,w-10,topHeight);

    let bottomGrad = ctx.createLinearGradient(x,canvas.height-bottomHeight,x+w,canvas.height);
    bottomGrad.addColorStop(0,"#0077cc");
    bottomGrad.addColorStop(1,"#33aaff");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(x,canvas.height-bottomHeight,w,bottomHeight);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x+5,canvas.height-bottomHeight,w-10,bottomHeight);

    if(starFalling && invulnerableFrames<=0 && star.x+star.radius>p.x && star.x-star.radius<p.x+w){
      if(star.y-star.radius<p.top || star.y+star.radius>canvas.height-p.bottom){
        createExplosion(star.x,star.y);
        shakeScreen();
        endGame();
      }
    }

    if(p.x+w<0) pipes.splice(i,1);
    if(p.x+w<star.x && !p.passed){ score++; p.passed=true; }
  });
}

// PARTICLES
function createExplosion(x,y){
  for(let i=0;i<15;i++){
    particles.push({x:x,y:y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,r:Math.random()*3+1,life:30});
  }
}

function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="#ffeb8a";
    ctx.fill();
    if(p.life<=0) particles.splice(i,1);
  }

  for(let i=shootingStars.length-1;i>=0;i--){
    let s = shootingStars[i];
    s.x += s.vx; s.y += s.vy; s.life--;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.fill();
    if(s.life<=0) shootingStars.splice(i,1);
  }
}

// SCREEN SHAKE
function shakeScreen(){
  canvas.style.transform=`translate(${Math.random()*6-3}px,${Math.random()*6-3}px)`;
  setTimeout(()=>{canvas.style.transform="";},50);
}

// END GAME
function endGame(){
  gameStarted = false;
  starFalling = false;
  cancelAnimationFrame(animationId);

  setTimeout(() => {
    endOverlay.classList.remove("hidden");
    finalScoreEl.textContent = `score: ${score}`;
    saveScore();
  }, 0);
}

// BUTTONS
restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  playerNameInput.focus();
  resetGame();
};

endLeaderboardBtn.onclick = () => {
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
  endOverlay.classList.add("hidden");
};

closeLeaderboardBtn.onclick = () => {
  leaderboardModal.classList.add("hidden");
  endOverlay.classList.remove("hidden");
};

// LEADERBOARD
function saveScore(){
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  board.push({name:playerName, score});
  board.sort((a,b)=>b.score - a.score);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(board.slice(0,5)));
}

function populateLeaderboard(){
  const board = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  leaderboardList.innerHTML="";
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

  if(!addedCurrent && score>0){
    const row=document.createElement("div"); row.className="lb-row current";
    const num=document.createElement("div"); num.className="lb-num"; num.textContent="—";
    const name=document.createElement("div"); name.className="lb-name"; name.textContent=playerName;
    const sc=document.createElement("div"); sc.className="lb-score"; sc.textContent=score;
    row.appendChild(num); row.appendChild(name); row.appendChild(sc);
    leaderboardList.appendChild(row);
  }
}

// PAGE LOAD
document.addEventListener("DOMContentLoaded", ()=>{
  gameStarted=false;
  starFalling=false;
  startOverlay.classList.remove("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display="none";
  resetGame();
});

// RESPONSIVE CANVAS
function resizeCanvas() {
  const container = document.getElementById("game-container");
  const scaleX = container.clientWidth / 420;
  const scaleY = container.clientHeight / 640;
  const scale = Math.min(scaleX, scaleY);
  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = "top left";
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

