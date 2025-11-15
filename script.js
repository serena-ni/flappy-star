// elements
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

// canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 420;
canvas.height = 640;

// game state
let gameStarted = false;
let starFalling = false;
let playerName = "guest";
let score = 0;
let pipes = [];
let particles = [];
let invulnerableFrames = 0;
let animationId;

// player star
let star = { x:100, y:canvas.height/2, radius:12, vy:0, gravity:0.12, maxVy:2.5, bobOffset:0, bobDir:1 };

// background stars layers (parallax)
const starLayers = [
  Array.from({length: 30}, () => ({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.5+0.5, speed:0.05})),
  Array.from({length: 20}, () => ({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+1, speed:0.1})),
  Array.from({length: 10}, () => ({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*3+1, speed:0.2}))
];

let shootingStars = [];

// reset game
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

// start game
startBtn.onclick = () => {
  if(gameStarted) return;
  gameStarted = true;
  starFalling = false; // hover first
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display = "block";
  document.getElementById("game-container").classList.add("active");

  const nameVal = playerNameInput.value.trim();
  playerName = nameVal !== "" ? nameVal : "guest";

  resetGame();
  invulnerableFrames = 30;
  animationId = requestAnimationFrame(gameLoop);
};

// input handler
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

// game loop
function gameLoop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  updateStar();
  updatePipes();
  updateParticles();
  drawStar();
  scoreDisplay.textContent = score;

  if(invulnerableFrames>0) invulnerableFrames--;

  if(gameStarted) animationId = requestAnimationFrame(gameLoop);
}

// draw night sky with shimmer + parallax stars
function drawBackground(){
  // faint shimmer: oscillate between dark blue and black
  const shimmer = Math.sin(Date.now()/1000)*10;
  ctx.fillStyle = `rgb(${10+shimmer}, ${10+shimmer}, ${30+shimmer})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // parallax stars
  starLayers.forEach(layer => {
    layer.forEach(s=>{
      s.x -= s.speed;
      if(s.x<0) s.x = canvas.width;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle="#fff";
      ctx.fill();
    });
  });

  // shooting stars
  shootingStars.forEach((s,i)=>{
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
    ctx.strokeStyle = "white";
    ctx.lineWidth = s.r;
    ctx.beginPath();
    ctx.moveTo(s.x - s.vx*3, s.y - s.vy*3);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    if(s.life<=0) shootingStars.splice(i,1);
  });

  // occasionally add shooting star
  if(Math.random()<0.002){
    shootingStars.push({
      x: canvas.width + 20,
      y: Math.random()*canvas.height/2,
      vx: -8 - Math.random()*2,
      vy: 0,
      r: 2 + Math.random()*1.5,
      life: 50 + Math.random()*20
    });
  }
}

// update player star
function updateStar(){
  if(!starFalling){
    // hover
    star.bobOffset += 0.5 * star.bobDir;
    if(star.bobOffset>4||star.bobOffset<-4) star.bobDir*=-1;
    star.y = canvas.height/2 + star.bobOffset;
    return;
  }

  star.vy += star.gravity;
  if(star.vy > star.maxVy) star.vy = star.maxVy;
  star.y += star.vy;

  // trail
  particles.push({x:star.x, y:star.y, vx:0, vy:0, r:Math.max(1, star.vy*0.5), life:10});

  // bottom collision
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

// pipes
let pipeGap = 140;
let pipeSpacing = 280;

function updatePipes(){
  if(pipes.length === 0 || pipes[pipes.length-1].x < canvas.width - pipeSpacing){
    let topH = Math.random()*(canvas.height/2)+60;
    pipes.push({x:canvas.width, top:topH, bottom:canvas.height-topH-pipeGap, passed:false, wobble: Math.random()*2});
  }

  pipes.forEach((p,i)=>{
    p.x -= 2;

    // subtle wobble
    p.wobble = Math.sin(Date.now()/200 + i) * 2;

    let x = Math.round(p.x);
    let w = 40;
    let topHeight = p.top + p.wobble;
    let bottomHeight = p.bottom + p.wobble;

    // top pipe
    let topGrad = ctx.createLinearGradient(x,0,x+w,topHeight);
    topGrad.addColorStop(0,"#33aaff");
    topGrad.addColorStop(1,"#0077cc");
    ctx.fillStyle = topGrad;
    ctx.fillRect(x,0,w,topHeight);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x+5,0,w-10,topHeight);

    // bottom pipe
    let bottomGrad = ctx.createLinearGradient(x,canvas.height-bottomHeight,x+w,canvas.height);
    bottomGrad.addColorStop(0,"#0077cc");
    bottomGrad.addColorStop(1,"#33aaff");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(x,canvas.height-bottomHeight,w,bottomHeight);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x+5,canvas.height-bottomHeight,w-10,bottomHeight);

    // collision
    if(starFalling && invulnerableFrames<=0 && star.x+star.radius>p.x && star.x-star.radius<p.x+w){
      if(star.y-star.radius<p.top || star.y+star.radius>canvas.height-p.bottom){
        createExplosion(star.x,star.y);
        shakeScreen();
        endGame();
      }
    }

    // remove offscreen
    if(p.x+w<0) pipes.splice(i,1);

    // scoring
    if(p.x+w<star.x && !p.passed){ score++; p.passed=true; }
  });
}

// particles
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
}

// screen shake
function shakeScreen(){
  canvas.style.transform=`translate(${Math.random()*6-3}px,${Math.random()*6-3}px)`;
  setTimeout(()=>{canvas.style.transform="";},50);
}

// end game
function endGame() {
  gameStarted = false;
  starFalling = false;

  cancelAnimationFrame(animationId);

  setTimeout(() => {
    endOverlay.classList.remove("hidden");
    finalScoreEl.textContent = `score: ${score}`;
    scoreDisplay.style.display = "none";
    saveScore();
  }, 0);
}

// restart & leaderboard
restartBtn.onclick = () => {
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  startOverlay.classList.remove("hidden");
  playerNameInput.focus();
  resetGame();
};

viewLeaderboardBtn.onclick = (e)=>{
  e.stopPropagation();
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
  endOverlay.classList.add("hidden");
};

closeLeaderboardBtn.onclick = () => {
  leaderboardModal.classList.add("hidden");
  endOverlay.classList.remove("hidden");
};

// leaderboard
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

// page load
document.addEventListener("DOMContentLoaded", ()=>{
  gameStarted=false;
  starFalling=false;
  startOverlay.classList.remove("hidden");
  endOverlay.classList.add("hidden");
  leaderboardModal.classList.add("hidden");
  scoreDisplay.style.display="none";
  resetGame();
});
