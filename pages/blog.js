const canvas = document.getElementById('arkCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('arkBgm');
const interaction = document.getElementById('interactionPanel');
const volumeText = document.getElementById('volumeText');
const distanceText = document.getElementById('distanceText');
const proximityBar = document.getElementById('proximityBar');
const audioToggle = document.getElementById('audioToggle');
const loreModal = document.getElementById('loreModal');
const loreClose = document.getElementById('loreClose');
const touchButtons = [...document.querySelectorAll('[data-move]')];

const WORLD_W = 960;
const WORLD_H = 640;
const TILE = 32;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;

canvas.width = WORLD_W;
canvas.height = WORLD_H;

const keys = new Set();
let lastTime = performance.now();
let bgmStarted = false;
let bgmEnabled = true;
let targetVolume = 0;
let currentVolume = 0;
let modalOpen = false;

const player = {
  x: WORLD_W / 2,
  y: WORLD_H - TILE * 3,
  radius: 10,
  speed: 118,
  facing: 'up',
  step: 0
};

const score = {
  x: WORLD_W / 2,
  y: WORLD_H / 2,
  radius: 28
};

const walls = new Set();

function wallKey(x, y) {
  return `${x},${y}`;
}

function addWall(x, y) {
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) walls.add(wallKey(x, y));
}

function addRect(x, y, w, h) {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) addWall(col, row);
  }
}

function buildMap() {
  for (let x = 0; x < COLS; x += 1) {
    addWall(x, 0);
    addWall(x, ROWS - 1);
  }
  for (let y = 0; y < ROWS; y += 1) {
    addWall(0, y);
    addWall(COLS - 1, y);
  }

  // Upper archive wings.
  addRect(3, 3, 7, 1);
  addRect(3, 3, 1, 5);
  addRect(9, 3, 1, 3);
  addRect(20, 3, 7, 1);
  addRect(26, 3, 1, 5);
  addRect(20, 3, 1, 3);

  // Side corridors.
  addRect(4, 12, 6, 1);
  addRect(4, 12, 1, 4);
  addRect(20, 12, 6, 1);
  addRect(25, 12, 1, 4);

  // Bottom gate forms a spawn corridor.
  addRect(8, 17, 5, 1);
  addRect(17, 17, 5, 1);

  // Broken pillars around the central hall.
  [[11,7],[18,7],[11,12],[18,12]].forEach(([x, y]) => addRect(x, y, 1, 2));
}

buildMap();

function tileBlocked(tx, ty) {
  return walls.has(wallKey(tx, ty));
}

function collides(x, y) {
  const r = player.radius;
  const points = [
    [x - r, y - r], [x + r, y - r],
    [x - r, y + r], [x + r, y + r]
  ];

  return points.some(([px, py]) => tileBlocked(Math.floor(px / TILE), Math.floor(py / TILE)));
}

function movePlayer(dx, dy, dt) {
  if (!dx && !dy) return;

  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;

  const running = keys.has('shift');
  const speed = running ? 178 : player.speed;
  const amount = speed * dt;

  const nextX = player.x + dx * amount;
  if (!collides(nextX, player.y)) player.x = nextX;

  const nextY = player.y + dy * amount;
  if (!collides(player.x, nextY)) player.y = nextY;

  if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? 'right' : 'left';
  else player.facing = dy > 0 ? 'down' : 'up';

  player.step += dt * (running ? 14 : 9);
}

function startBgm() {
  if (bgmStarted || !bgmEnabled) return;
  bgmStarted = true;
  bgm.volume = 0;
  bgm.play().catch(() => {
    bgmStarted = false;
  });
}

function updateAudio(dt) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const maxDistance = 410;
  const proximity = Math.max(0, 1 - dist / maxDistance);

  const minVolume = 0.015;
  const maxVolume = 0.22;
  targetVolume = bgmEnabled && bgmStarted
    ? minVolume + (maxVolume - minVolume) * Math.pow(proximity, 1.35)
    : 0;

  const smoothing = 1 - Math.pow(0.001, dt);
  currentVolume += (targetVolume - currentVolume) * smoothing;
  currentVolume = Math.max(0, Math.min(maxVolume, currentVolume));
  bgm.volume = currentVolume;

  const tileDistance = dist / TILE;
  volumeText.textContent = `${Math.round(currentVolume * 100)}%`;
  distanceText.textContent = `${tileDistance.toFixed(1)} TILE`;
  proximityBar.style.width = `${Math.round(proximity * 100)}%`;

  const near = dist < 66;
  interaction.classList.toggle('visible', near && !modalOpen);
  interaction.textContent = near
    ? 'E  /  EXAMINE THE LULLABY SCORE'
    : '';
}

function drawFloor() {
  ctx.fillStyle = '#04080c';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (tileBlocked(x, y)) continue;
      const even = (x + y) % 2 === 0;
      ctx.fillStyle = even ? '#071018' : '#060d14';
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeStyle = 'rgba(73,214,255,.022)';
      ctx.strokeRect(x * TILE + .5, y * TILE + .5, TILE - 1, TILE - 1);
    }
  }

  // Central hall rings.
  ctx.save();
  ctx.translate(score.x, score.y);
  ctx.strokeStyle = 'rgba(215,200,138,.10)';
  ctx.lineWidth = 2;
  [64, 92, 124].forEach(radius => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function drawWalls() {
  walls.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const px = x * TILE;
    const py = y * TILE;

    ctx.fillStyle = '#101820';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#16232d';
    ctx.fillRect(px + 3, py + 3, TILE - 6, 5);
    ctx.fillStyle = 'rgba(73,214,255,.055)';
    ctx.fillRect(px + 3, py + TILE - 5, TILE - 6, 2);
    ctx.strokeStyle = 'rgba(73,214,255,.08)';
    ctx.strokeRect(px + .5, py + .5, TILE - 1, TILE - 1);
  });
}

function drawDoors() {
  const doors = [
    { x: 6.5, y: 3.15, label: 'R-01' },
    { x: 23.5, y: 3.15, label: 'R-02' },
    { x: 4.15, y: 14.2, label: 'R-03' },
    { x: 25.85, y: 14.2, label: 'R-04' }
  ];

  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  doors.forEach(door => {
    const px = door.x * TILE;
    const py = door.y * TILE;
    ctx.fillStyle = '#0b1117';
    ctx.fillRect(px - 21, py - 6, 42, 12);
    ctx.strokeStyle = 'rgba(73,214,255,.18)';
    ctx.strokeRect(px - 21.5, py - 6.5, 43, 13);
    ctx.fillStyle = 'rgba(105,119,138,.62)';
    ctx.fillText(door.label, px, py + 3);
  });
}

function drawScore(time) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const proximity = Math.max(0, 1 - dist / 410);
  const pulse = 0.5 + Math.sin(time * 0.0021) * 0.5;
  const glow = 10 + proximity * 28 + pulse * 5;

  ctx.save();
  ctx.translate(score.x, score.y);

  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 78);
  halo.addColorStop(0, `rgba(215,200,138,${0.15 + proximity * 0.16})`);
  halo.addColorStop(1, 'rgba(215,200,138,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal.
  ctx.fillStyle = '#131a1d';
  ctx.fillRect(-26, 18, 52, 8);
  ctx.fillRect(-18, 26, 36, 10);
  ctx.strokeStyle = 'rgba(215,200,138,.25)';
  ctx.strokeRect(-26.5, 17.5, 53, 9);

  // Open score: symbolic, not a reproduction of the original sheet music.
  ctx.shadowColor = 'rgba(215,200,138,.8)';
  ctx.shadowBlur = glow;
  ctx.fillStyle = '#d8d1b7';
  ctx.fillRect(-35, -26, 33, 42);
  ctx.fillRect(2, -26, 33, 42);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#b9ae8c';
  ctx.fillRect(-2, -25, 4, 41);

  ctx.strokeStyle = '#4d493d';
  ctx.lineWidth = 1;
  [-16, -11, -6, -1, 4].forEach(offset => {
    ctx.beginPath();
    ctx.moveTo(-30, offset);
    ctx.lineTo(-7, offset);
    ctx.moveTo(7, offset);
    ctx.lineTo(30, offset);
    ctx.stroke();
  });

  // Abstract note marks to communicate "score" without copying the copyrighted notation.
  const marks = [
    [-25,-8],[-17,1],[-10,-13],[11,-3],[18,-11],[26,2]
  ];
  ctx.fillStyle = '#3d3a32';
  marks.forEach(([x, y], index) => {
    ctx.beginPath();
    ctx.arc(x, y, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 1.5, y - (index % 2 ? 9 : 7), 1.2, index % 2 ? 10 : 8);
  });

  ctx.fillStyle = `rgba(255,244,202,${0.35 + pulse * 0.3})`;
  ctx.fillRect(-1, -33, 2, 4);
  ctx.fillRect(-1, 21, 2, 4);
  ctx.fillRect(-42, -5, 4, 2);
  ctx.fillRect(38, -5, 4, 2);

  ctx.restore();
}

function drawPlayer() {
  const bob = Math.sin(player.step) * 1.2;
  const x = Math.round(player.x);
  const y = Math.round(player.y + bob);

  ctx.save();
  ctx.translate(x, y);

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(-8, 8, 16, 5);

  // Body.
  ctx.fillStyle = '#a8c9d6';
  ctx.fillRect(-6, -7, 12, 13);
  ctx.fillStyle = '#dcecf2';
  ctx.fillRect(-5, -13, 10, 7);
  ctx.fillStyle = '#293842';
  ctx.fillRect(-6, 5, 5, 7);
  ctx.fillRect(1, 5, 5, 7);

  // Facing marker.
  ctx.fillStyle = '#49d6ff';
  if (player.facing === 'up') ctx.fillRect(-1, -17, 2, 3);
  if (player.facing === 'down') ctx.fillRect(-1, 12, 2, 3);
  if (player.facing === 'left') ctx.fillRect(-10, -2, 3, 2);
  if (player.facing === 'right') ctx.fillRect(7, -2, 3, 2);

  ctx.restore();
}

function drawLighting() {
  const gradient = ctx.createRadialGradient(player.x, player.y, 85, player.x, player.y, 330);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(.58, 'rgba(0,0,0,.18)');
  gradient.addColorStop(1, 'rgba(0,0,0,.68)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const scoreGlow = ctx.createRadialGradient(score.x, score.y, 18, score.x, score.y, 150);
  scoreGlow.addColorStop(0, 'rgba(215,200,138,.07)');
  scoreGlow.addColorStop(1, 'rgba(215,200,138,0)');
  ctx.fillStyle = scoreGlow;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

function update(dt) {
  if (!modalOpen) {
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;
    movePlayer(dx, dy, dt);
  }

  updateAudio(dt);
}

function render(time) {
  drawFloor();
  drawWalls();
  drawDoors();
  drawScore(time);
  drawPlayer();
  drawLighting();
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render(now);
  requestAnimationFrame(loop);
}

function openLore() {
  modalOpen = true;
  keys.clear();
  loreModal.classList.add('open');
  loreClose.focus();
}

function closeLore() {
  modalOpen = false;
  loreModal.classList.remove('open');
  canvas.focus();
}

function tryInteract() {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  if (dist < 66) openLore();
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  if (['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
    if (!modalOpen) event.preventDefault();
    keys.add(key);
    startBgm();
  }

  if (key === 'e' && !event.repeat && !modalOpen) {
    startBgm();
    tryInteract();
  }

  if (key === 'escape' && modalOpen) closeLore();
}

function onKeyUp(event) {
  keys.delete(event.key.toLowerCase());
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', () => keys.clear());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) keys.clear();
});

canvas.addEventListener('pointerdown', () => {
  canvas.focus();
  startBgm();
});

audioToggle.addEventListener('click', () => {
  bgmEnabled = !bgmEnabled;
  audioToggle.textContent = bgmEnabled ? 'BGM / ON' : 'BGM / OFF';
  if (bgmEnabled) startBgm();
});

loreClose.addEventListener('click', closeLore);
loreModal.addEventListener('pointerdown', event => {
  if (event.target === loreModal) closeLore();
});

touchButtons.forEach(button => {
  const key = button.dataset.move;
  const start = event => {
    event.preventDefault();
    keys.add(key);
    startBgm();
  };
  const stop = event => {
    event.preventDefault();
    keys.delete(key);
  };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('pointerleave', stop);
});

requestAnimationFrame(loop);
