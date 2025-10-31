/*
  Coin Dash Runner - Global Edition
  Lightweight polished endless runner with:
   - Parallax background
   - Simple animated square character
   - Localization (EN / AR) auto-detect
   - Hooks for ads: showInterstitialAd(), showRewardedAd()
*/

// ---------- Localization ----------
const LOCALES = {
  en: {
    subtitle: "Run, jump & collect coins — Beat your best score!",
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    retry: "Retry",
    revive: "Watch Ad to Continue",
    gameOver: "Game Over",
    tip: "Tip: Tap/Click/Space to jump"
  },
  ar: {
    subtitle: "اجمع العملات واطوِّس أفضل نتيجة لديك!",
    play: "اللعب",
    pause: "إيقاف",
    mute: "كتم",
    retry: "إعادة",
    revive: "شاهد إعلان للاستمرار",
    gameOver: "انتهت اللعبة",
    tip: "المس/اضغط/مسافة للقفز"
  }
};

function getLang(){
  const nav = navigator.language || navigator.userLanguage || 'en';
  if(nav.startsWith('ar')) return 'ar';
  return nav.startsWith('es') ? 'en' : 'en';
}
const LANG = getLang();
const t = LOCALES[LANG] || LOCALES.en;

// ---------- UI bindings ----------
const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const coinsEl = document.getElementById('coins');
const bestEl = document.getElementById('bestScore');
const messageSubtitle = document.getElementById('subtitle');
const devName = document.getElementById('devName');
const gameArea = document.getElementById('game-area');
const splash = document.getElementById('splash');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const finalCoins = document.getElementById('finalCoins');
const retryBtn = document.getElementById('retryBtn');
const reviveBtn = document.getElementById('reviveBtn');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');

messageSubtitle.textContent = t.subtitle;
startBtn.textContent = t.play;
pauseBtn.textContent = t.pause;
muteBtn.textContent = t.mute;
retryBtn.textContent = t.retry;
reviveBtn.textContent = t.revive;
overlayTitle.textContent = t.gameOver;
document.getElementById('footer').textContent = t.tip;

// ---------- Canvas setup ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width = 900;
const HEIGHT = canvas.height = 450;

// responsive drawing scale
function scaleCanvas(){
  const ratio = WIDTH / HEIGHT;
  const w = Math.min(window.innerWidth - 40, 1000);
  canvas.style.width = w + 'px';
  canvas.style.height = Math.round(w / ratio) + 'px';
}
window.addEventListener('resize', scaleCanvas);
scaleCanvas();

// Parallax simple movement
let parallaxOffset = 0;

// ---------- Game state ----------
let running = false;
let paused = false;
let score = 0;
let best = +localStorage.getItem('cdr_best') || 0;
bestEl.textContent = best;
let player, obstacles, pickups, speed, gravity, groundY;
let frame = 0;
let reviveAvailable = true;
let muted = false;

// ---------- Reset ----------
function resetGame(){
  score = 0;
  speed = 3;
  gravity = 0.6;
  groundY = HEIGHT - 80;
  player = { x:80, y: groundY - 40, w:36, h:36, vy:0, onGround:true, bob:0 };
  obstacles = [];
  pickups = [];
  reviveAvailable = true;
  coinsEl.textContent = score;
  overlay.classList.add('hidden');
}

// spawn functions
function spawnObstacle(){
  const h = 24 + Math.random()*64;
  obstacles.push({ x: WIDTH + 40, y: groundY - h, w: 22 + Math.random()*28, h:h, passed:false });
}
function spawnPickup(){
  pickups.push({ x: WIDTH + 60, y: groundY - 120 - Math.random()*80, r:10, collected:false });
}

// physics & update
function update(){
  if(!running || paused) return;
  frame++;
  parallaxOffset += 0.6 + speed*0.02;

  if(frame % Math.max(50, 120 - Math.floor(speed*6)) === 0) spawnObstacle();
  if(frame % 140 === 0) spawnPickup();
  if(frame % 600 === 0) speed += 0.35;

  // player physics
  player.vy += gravity;
  player.y += player.vy;
  if(player.y + player.h > groundY){
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
    player.bob = 0;
  } else {
    player.onGround = false;
    player.bob = Math.sin(frame * 0.12) * 0.6;
  }

  // obstacles
  obstacles.forEach(ob => { ob.x -= speed; if(!ob.passed && ob.x + ob.w < player.x){ ob.passed = true; score += 1; coinsEl.textContent = score; } });
  obstacles = obstacles.filter(o => o.x + o.w > -60);

  // pickups
  pickups.forEach(p => {
    p.x -= speed;
    if(!p.collected && rectCircleCollide(player, p)){
      p.collected = true;
      score += 5;
      coinsEl.textContent = score;
      // play coin sound hook
      // playSound('coin');
    }
  });
  pickups = pickups.filter(p => p.x + p.r > -60 && !p.collected);

  // collisions
  for(let ob of obstacles){
    if(rectsIntersect(player, ob)){
      gameOver();
      break;
    }
  }
}

// ---------- Drawing ----------
function draw(){
  // background clear
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,HEIGHT);
  g.addColorStop(0, '#7ed9ff');
  g.addColorStop(1, '#9bd1ff');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  // parallax layers (simple rectangles with repeated shapes)
  drawParallax();

  // ground
  ctx.fillStyle = '#2d2f36';
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

  // player (animated square)
  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  const jumpTilt = player.vy * 0.02;
  ctx.rotate(jumpTilt);
  // color pulse
  const pulse = Math.abs(Math.sin(frame*0.08));
  const r = Math.round(255 - pulse*40);
  ctx.fillStyle = `rgb(${r},${92},${92})`;
  ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h);
  ctx.restore();

  // obstacles
  ctx.fillStyle = '#2b2b2b';
  for(let ob of obstacles){
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  // pickups (coins)
  for(let p of pickups){
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(p.x-4, p.y-10, 6, 6);
  }

  requestAnimationFrame(draw);
}

function drawParallax(){
  // back: subtle hills
  ctx.save();
  ctx.translate(- (parallaxOffset*0.2 % WIDTH), 0);
  ctx.fillStyle = '#7fbfff40';
  for(let i= -2; i<3; i++){
    ctx.beginPath();
    const x = i*300;
    ctx.ellipse(x + 200, 240, 220, 80, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // mid layer: soft shapes
  ctx.save();
  ctx.translate(- (parallaxOffset*0.5 % WIDTH), 0);
  ctx.fillStyle = '#3aa9ff30';
  for(let i=-2;i<4;i++){
    ctx.fillRect(i*240 + 60, 260, 120, 40);
  }
  ctx.restore();

  // front shapes
  ctx.save();
  ctx.translate(- (parallaxOffset*0.9 % WIDTH), 0);
  ctx.fillStyle = '#ffffff08';
  for(let i=-2;i<5;i++){
    ctx.fillRect(i*160 + 40, 300, 40, 20);
  }
  ctx.restore();
}

// ---------- Collisions ----------
function rectsIntersect(a,b){
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}
function rectCircleCollide(rect, circle){
  const distX = Math.abs(circle.x - rect.x - rect.w/2);
  const distY = Math.abs(circle.y - rect.y - rect.h/2);
  if(distX > (rect.w/2 + circle.r)) return false;
  if(distY > (rect.h/2 + circle.r)) return false;
  if(distX <= (rect.w/2)) return true;
  if(distY <= (rect.h/2)) return true;
  const dx = distX - rect.w/2;
  const dy = distY - rect.h/2;
  return (dx*dx + dy*dy <= circle.r * circle.r);
}

// ---------- Controls ----------
function jump(){
  if(!running || paused) return;
  if(player.onGround){
    player.vy = -11;
    player.onGround = false;
    // playSound('jump');
  }
}

window.addEventListener('keydown', e=>{
  if(e.code === 'Space' || e.code === 'ArrowUp'){ e.preventDefault(); if(!running) startGame(); else jump(); }
  if(e.code === 'KeyM') toggleMute();
  if(e.code === 'KeyP') togglePause();
});

canvas.addEventListener('touchstart', e=>{ e.preventDefault(); if(!running) startGame(); else jump(); });
canvas.addEventListener('mousedown', e=>{ if(!running) startGame(); else jump(); });

startBtn.addEventListener('click', ()=>{ if(!running) startGame(); });
retryBtn.addEventListener('click', ()=>{ resetGame(); startGame(); });
reviveBtn.addEventListener('click', ()=>{ // placeholder for rewarded ad flow
  reviveAvailable = false;
  overlay.classList.add('hidden');
  running = true;
  // award small coins
  score += 3;
  coinsEl.textContent = score;
  gameLoop();
});

pauseBtn.addEventListener('click', ()=>{ togglePause(); });
muteBtn.addEventListener('click', ()=>{ toggleMute(); });

function togglePause(){ paused = !paused; pauseBtn.textContent = paused ? 'Resume' : t.pause; }
function toggleMute(){ muted = !muted; muteBtn.textContent = muted ? 'Unmute' : t.mute; }

// ---------- Game flow ----------
function startGame(){
  splash.classList.add('hidden');
  gameArea.classList.remove('hidden');
  resetGame();
  running = true;
  frame = 0;
  requestAnimationFrame(draw);
  gameLoop();
}

function gameOver(){
  running = false;
  overlay.classList.remove('hidden');
  document.getElementById('finalCoins').textContent = score;
  overlayMessage.textContent = `${t.subtitle}`;
  // best
  if(score > best){ best = score; localStorage.setItem('cdr_best', best); bestEl.textContent = best; }
  // optionally show interstitial ad hook:
  // showInterstitialAd();
}

function gameLoop(){
  if(!running || paused) return;
  update();
  setTimeout(()=>{ requestAnimationFrame(gameLoop); }, 1000/60);
}

// ---------- Hooks for ad providers (implement when integrating) ----------
function showInterstitialAd(){
  // implement provider SDK call here
  // e.g., GameDistribution / GameMonetize will provide snippet
  console.log("Interstitial ad requested (hook)");
}
function showRewardedAd(){
  // implement provider SDK call and return a Promise resolving when rewarded
  console.log("Rewarded ad requested (hook)");
  return Promise.resolve(true);
}

// ---------- Utilities / audio (placeholders) ----------
function playSound(name){
  if(muted) return;
  // integrate WebAudio / Audio elements; left as placeholder to keep size small.
}

// ---------- Init ----------
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) paused = true; });
