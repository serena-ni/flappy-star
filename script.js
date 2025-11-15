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
let shakeOffset = { x: 0, y: 0 };
let playerName = "Anonymous";

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

// ===== PARTICLES =====
let starTrail = [];
let shatterParticles = [];

// ===== PARALLAX STARFIELD =====
const starLayers = [
  { speed: 0.15, stars: [] },
  { speed: 0.3, stars: [] },
  { speed: 0.6, stars: [] }
];

function initStarfield() {
  starLayers.forEach((layer, idx) => layer.stars = []);

  for (let i = 0; i < 50; i++) starLayers[0].stars.push({x: Math.random()*canvas.width,y: Math.random()*canvas.height,size: Math.random()*1.2+0.5,alpha: Math.random()*0.4+0.3});
  for (let i = 0; i < 40; i++) starLayers[1].stars.push({x: Math.random()*canvas.width,y: Math.random()*canvas.height,size: Math.random()*1.5+0.8,alpha: Math.random()*0.5+0.3});
  for (let i = 0; i < 30; i++) starLayers[2].stars.push({x: Math.random()*canvas.width,y: Math.random()*canvas.height,size: Math.random()*2+1,alpha: Math.random()*0.6+0.4});
}

function drawStarfield() {
  starLayers.forEach(layer => {
    layer.stars.forEach((s, i) => {
      s.x -= layer.speed;
      if(s.x < 0) s.x = canvas.width;
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
      ctx.fill();
    });
  });
}

// ===== SHOOTING STARS =====
let shootingStars = [];
let lastShootingStarTime = 0;
function spawnShootingStar() {
  if(Date.now()-lastShootingStarTime < 6000+Math.random()*6000) return;
  lastShootingStarTime = Date.now();
  shootingStars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height*0.4,speed:2.5+Math.random()*1.5,alpha:1});
}
function drawShootingStars(){
  shootingStars.forEach((s,i)=>{
    s.x+=s.speed;s.y+=s.speed*0.4;s.alpha-=0.01;
    ctx.strokeStyle=`rgba(255,255,255,${s.alpha})`;
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-22,s.y-7);ctx.stroke();
    if(s.alpha<=0) shootingStars.splice(i,1);
  });
}

// ===== PIPES =====
let pipes=[];
const pipeWidth=110;
function spawnPipe(){
  const pipeGap = 190+Math.random()*40;
  const topHeight = 80+Math.random()*(canvas.height-pipeGap-160);
  pipes.push({x:canvas.width,top:topHeight,bottom:topHeight+pipeGap,passed:false});
}
function drawPipes(){
  ctx.fillStyle="rgba(138,199,255,0.7)";
  pipes.forEach(pipe=>{
    ctx.fillRect(pipe.x,0,pipeWidth,pipe.top);
    ctx.fillRect(pipe.x,pipe.bottom,pipeWidth,canvas.height-pipe.bottom);
  });
}
function updatePipes(){
  pipes.forEach(pipe=>{
    pipe.x-=2;
    if(!pipe.passed && pipe.x+pipeWidth<star.x){score++;pipe.passed=true;}
  });
  pipes = pipes.filter(p=>p.x+pipeWidth>0);
}

// ===== STAR TRAIL =====
function spawnStarTrail(){
  if(star.hidden||!gameStarted) return;
  const speedFactor = Math.min(Math.abs(star.velocity)/6,1);
  starTrail.push({x:star.x-5+Math.random()*10,y:star.y-5+Math.random()*10,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,radius:(Math.random()*2+1)*(0.7+0.3*speedFactor),alpha:0.8});
}
function drawStarTrail(){
  starTrail.forEach((p,i)=>{
    p.x+=p.vx;p.y+=p.vy;p.alpha-=0.02;p.radius*=0.97;
    ctx.fillStyle=`rgba(255,235,170,${p.alpha})`;
    ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();
    if(p.alpha<=0||p.radius<=0.3) starTrail.splice(i,1);
  });
}

// ===== SHATTER =====
function createShatter(x,y){
  for(let i=0;i<22;i++){
    shatterParticles.push({x:x,y:y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,life:1});
  }
}
function drawShatter(){
  shatterParticles.forEach((p,i)=>{
    p.x+=p.vx;p.y+=p.vy;p.life-=0.02;
    ctx.fillStyle=`rgba(255,235,170,${p.life})`;
    ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();
    if(p.life<=0) shatterParticles.splice(i,1);
  });
}

// ===== COLLISION =====
function checkCollision(){
  for(let pipe of pipes){
    if(star.x+star.radius>pipe.x && star.x-star.radius<pipe.x+pipeWidth && (star.y-star.radius<pipe.top || star.y+star.radius>pipe.bottom)){
      endGame(); return;
    }
  }
}

// ===== LEADERBOARD =====
function updateLeaderboard(name, score){
  let leaderboard = JSON.parse(localStorage.getItem("flappyStarLeaderboard")||"[]");
  leaderboard.push({name,score});
  leaderboard.sort((a,b)=>b.score-a.score);
  leaderboard = leaderboard.slice(0,5);
  localStorage.setItem("flappyStarLeaderboard", JSON.stringify(leaderboard));

  const list = document.getElementById("leaderboard-list");
  list.innerHTML="";
  leaderboard.forEach(entry=>{
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}`;
    list.appendChild(li);
  });
}

// ===== GAME FLOW =====
function startGame(){
  const nameInput=document.getElementById("player-name");
  playerName=nameInput.value.trim()||"Anonymous";
  document.getElementById("start-screen").style.display="none";
  gameStarted=true; gameActive=true;
}

function endGame(){
  gameActive=false; gameOver=true;
  createShatter(star.x, star.y);
  star.hidden=true; star.velocity=0;

  // Screen shake
  let shakeFrames=12;
  let shakeInterval=setInterval(()=>{
    shakeOffset.x=(Math.random()-0.5)*6;
    shakeOffset.y=(Math.random()-0.5)*6;
    shakeFrames--;
    if(shakeFrames<=0){clearInterval(shakeInterval); shakeOffset.x=0; shakeOffset.y=0;}
  },16);

  document.getElementById("final-score").textContent=`Score: ${score}`;
  updateLeaderboard(playerName, score);
  setTimeout(()=>{document.getElementById("game-over-screen").style.display="flex";},400);
}

function resetGame(){
  gameActive=false; gameStarted=false; gameOver=false;
  star.y=canvas.height*0.5; star.velocity=0; star.hidden=false;
  pipes=[]; shatterParticles=[]; starTrail=[];
  score=0;
  document.getElementById("game-over-screen").style.display="none";
  document.getElementById("start-screen").style.display="flex";
}

// ===== INPUT =====
function flap(){if(!gameStarted)return startGame(); if(!gameActive)return; star.velocity=-4.4;}
document.addEventListener("keydown",e=>{if(e.code==="Space")flap();});
canvas.addEventListener("pointerdown",flap);
document.getElementById("restart-btn").addEventListener("click",resetGame);
document.querySelector("#start-screen .btn-start").addEventListener("click",startGame);

// ===== MAIN LOOP =====
let pipeTimer=0;
function update(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(shakeOffset.x, shakeOffset.y);

  drawStarfield();
  spawnShootingStar();
  drawShootingStars();
  spawnStarTrail();
  drawStarTrail();

  if(!gameActive && !gameStarted){ctx.restore(); requestAnimationFrame(update); return;}

  if(!gameActive){
    star.hoverOffset+=0.03*star.hoverDir;
    if(Math.abs(star.hoverOffset)>5) star.hoverDir*=-1;
    star.y=canvas.height*0.5+star.hoverOffset;
  } else {
    star.velocity+=star.gravity;
    if(star.velocity>star.maxGravity) star.velocity=star.maxGravity;
    star.y+=star.velocity;
  }

  pipeTimer++;
  if(pipeTimer>110+Math.floor(Math.random()*40)){spawnPipe(); pipeTimer=0;}
  updatePipes(); drawPipes();

  // Rare spark explosion through tight pipe
  pipes.forEach(pipe=>{
    const gapHeight = pipe.bottom - pipe.top;
    if(!pipe.passed && star.x>pipe.x && star.x<pipe.x+pipeWidth){
      if(gapHeight<200 && Math.random()<0.02){
        for(let i=0;i<15;i++){shatterParticles.push({x:star.x,y:star.y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,life:1});}
      }
    }
  });

  if(gameActive) checkCollision();

  if(!star.hidden){ctx.fillStyle="#ffeab2"; ctx.beginPath(); ctx.arc(star.x, star.y, star.radius,0,Math.PI*2); ctx.fill();}

  drawShatter();

  ctx.font="34px Quicksand";
  ctx.fillStyle="#fff8e8";
  ctx.lineWidth=3;
  ctx.strokeStyle="rgba(0,0,0,0.5)";
  ctx.strokeText(score, canvas.width/2-10, 80);
  ctx.fillText(score, canvas.width/2-10, 80);

  ctx.restore();
  requestAnimationFrame(update);
}

// ===== INIT =====
initStarfield();
update();

// ===== LEADERBOARD =====
const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
const leaderboardModal = document.getElementById("leaderboard-modal");
const closeLeaderboardBtn = document.getElementById("close-leaderboard-btn");

viewLeaderboardBtn.addEventListener("click", () => {
  populateLeaderboard();
  leaderboardModal.classList.remove("hidden");
});

closeLeaderboardBtn.addEventListener("click", () => {
  leaderboardModal.classList.add("hidden");
});

function populateLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem("flappyStarLeaderboard") || "[]");
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  let yourEntryAdded = false;

  leaderboard.forEach((entry, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${entry.name}: ${entry.score}`;
    if(entry.name === playerName && entry.score === score && !yourEntryAdded){
      li.classList.add("current");
      yourEntryAdded = true;
    }
    list.appendChild(li);
  });

  // if  score isn’t in top 5, show entry at bottom
  if(!yourEntryAdded){
    const li = document.createElement("li");
    li.textContent = `Your score: ${playerName}: ${score}`;
    li.classList.add("current");
    list.appendChild(li);
  }
}