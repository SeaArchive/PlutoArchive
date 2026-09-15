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
const ritualText = document.getElementById('ritualText');
const ritualBar = document.getElementById('ritualBar');
const ritualState = document.getElementById('ritualState');
const ritualCard = document.querySelector('.ritual-card');
const touchButtons = [...document.querySelectorAll('[data-move]')];

const WORLD_W = 960;
const WORLD_H = 640;
const TILE = 32;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;
const RITUAL_RADIUS = 124;
const RITUAL_DURATION = 60;

canvas.width = WORLD_W;
canvas.height = WORLD_H;
ctx.imageSmoothingEnabled = false;

const keys = new Set();
let lastTime = performance.now();
let bgmStarted = false;
let bgmEnabled = true;
let targetVolume = 0;
let currentVolume = 0;
let modalOpen = false;
let ritualTime = 0;
let ritualComplete = false;
let ritualCompletedAt = 0;

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

const ritualStars = [
  [-92,-34],[-68,-76],[-30,-96],[10,-86],[48,-68],[88,-30],
  [96,12],[73,58],[34,92],[-8,98],[-48,78],[-86,48],
  [-58,-12],[-24,-42],[16,-32],[50,4],[18,34],[-24,30]
];

const ritualEdges = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],
  [12,13],[13,14],[14,15],[15,16],[16,17],[17,12],
  [0,12],[2,13],[4,14],[6,15],[8,16],[10,17]
];

const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ'];
const walls = new Set();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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

  addRect(3, 3, 7, 1);
  addRect(3, 3, 1, 5);
  addRect(9, 3, 1, 3);
  addRect(20, 3, 7, 1);
  addRect(26, 3, 1, 5);
  addRect(20, 3, 1, 3);

  addRect(4, 12, 6, 1);
  addRect(4, 12, 1, 4);
  addRect(20, 12, 6, 1);
  addRect(25, 12, 1, 4);

  addRect(8, 17, 5, 1);
  addRect(17, 17, 5, 1);

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
  if (!bgmEnabled) return;
  if (bgmStarted && !bgm.paused) return;

  bgmStarted = true;
  if (!Number.isFinite(bgm.volume)) bgm.volume = 0;
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
  currentVolume = clamp(currentVolume, 0, maxVolume);
  bgm.volume = currentVolume;

  const tileDistance = dist / TILE;
  volumeText.textContent = `${Math.round(currentVolume * 100)}%`;
  distanceText.textContent = `${tileDistance.toFixed(1)} TILE`;
  proximityBar.style.width = `${Math.round(proximity * 100)}%`;

  const near = dist < 66;
  interaction.classList.toggle('visible', near && !modalOpen);
  interaction.classList.toggle('unlocked', near && ritualComplete);
  interaction.textContent = near
    ? (ritualComplete ? 'E  /  OPEN THE HIDDEN PAGE' : 'E  /  EXAMINE THE LULLABY SCORE')
    : '';
}

function updateRitual(dt) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const inside = dist <= RITUAL_RADIUS;

  if (!ritualComplete && inside && !modalOpen) {
    ritualTime = Math.min(RITUAL_DURATION, ritualTime + dt);
    if (ritualTime >= RITUAL_DURATION) {
      ritualComplete = true;
      ritualCompletedAt = performance.now();
      sessionStorage.setItem('plutoArkHiddenUnlocked', '1');
    }
  }

  const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
  ritualText.textContent = `${Math.round(progress * 100)}%`;
  ritualBar.style.width = `${progress * 100}%`;
  ritualCard.classList.toggle('complete', ritualComplete);

  if (ritualComplete) {
    ritualState.textContent = '마법진이 완성되었습니다. 중앙의 책이 이전과 다른 경로를 가리킵니다.';
  } else if (!inside && progress === 0) {
    ritualState.textContent = '중앙 원 내부에서 머무르면 방주의 숨겨진 문양이 조금씩 반응합니다.';
  } else if (!inside) {
    ritualState.textContent = `공명이 멈췄습니다. 다시 중앙 원으로 들어가면 ${Math.round(progress * 100)}%부터 이어집니다.`;
  } else if (progress < 0.12) {
    ritualState.textContent = '희미한 별빛이 하나씩 나타나기 시작합니다.';
  } else if (progress < 0.35) {
    ritualState.textContent = '별들이 서로를 찾으며 별자리의 윤곽을 만듭니다.';
  } else if (progress < 0.58) {
    ritualState.textContent = '별자리 사이의 선이 이어지고 바닥의 문양이 깨어납니다.';
  } else if (progress < 0.82) {
    ritualState.textContent = '원 둘레에서 룬 문자가 차례로 드러나고 있습니다.';
  } else {
    ritualState.textContent = '마지막 고리가 닫히고 있습니다. 중앙에서 조금만 더 머무르세요.';
  }
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

  ctx.save();
  ctx.translate(score.x, score.y);
  ctx.strokeStyle = 'rgba(215,200,138,.10)';
  ctx.lineWidth = 2;
  [64, 92, RITUAL_RADIUS].forEach(radius => {
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

function drawPartialCircle(radius, progress, alpha, width = 1) {
  if (progress <= 0) return;
  ctx.beginPath();
  ctx.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(progress, 0, 1));
  ctx.strokeStyle = `rgba(185,163,255,${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawRitual(time) {
  const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
  if (progress <= 0) return;

  const pulse = 0.5 + 0.5 * Math.sin(time * 0.0032);
  const starProgress = clamp((progress - 0.04) / 0.36, 0, 1);
  const lineProgress = clamp((progress - 0.18) / 0.38, 0, 1);
  const runeProgress = clamp((progress - 0.38) / 0.44, 0, 1);
  const circleProgress = clamp((progress - 0.55) / 0.45, 0, 1);

  ctx.save();
  ctx.translate(score.x, score.y);

  if (circleProgress > 0) {
    const halo = ctx.createRadialGradient(0, 0, 18, 0, 0, 145);
    halo.addColorStop(0, `rgba(178,153,255,${0.03 + circleProgress * 0.07})`);
    halo.addColorStop(1, 'rgba(178,153,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 145, 0, Math.PI * 2);
    ctx.fill();

    drawPartialCircle(118, circleProgress, 0.24 + circleProgress * 0.32, 1.4);
    drawPartialCircle(104, clamp(circleProgress * 1.12 - 0.12, 0, 1), 0.18 + circleProgress * 0.30, 1);
    drawPartialCircle(78, clamp(circleProgress * 1.25 - 0.25, 0, 1), 0.20 + circleProgress * 0.28, 1);

    const spokeCount = Math.floor(circleProgress * 12);
    for (let i = 0; i < spokeCount; i += 1) {
      const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 80, Math.sin(angle) * 80);
      ctx.lineTo(Math.cos(angle) * 116, Math.sin(angle) * 116);
      ctx.strokeStyle = `rgba(215,200,138,${0.10 + circleProgress * 0.24})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const polygonProgress = clamp((circleProgress - 0.28) / 0.72, 0, 1);
    if (polygonProgress > 0) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
        const x = Math.cos(angle) * 73;
        const y = Math.sin(angle) * 73;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(178,153,255,${0.10 + polygonProgress * 0.30})`;
      ctx.stroke();
    }
  }

  const visibleStars = Math.ceil(ritualStars.length * starProgress);
  for (let i = 0; i < visibleStars; i += 1) {
    const [x, y] = ritualStars[i];
    const twinkle = 0.45 + 0.55 * Math.sin(time * 0.004 + i * 1.73) ** 2;
    const size = i % 5 === 0 ? 2.3 : 1.55;
    ctx.fillStyle = `rgba(235,241,255,${0.46 + twinkle * 0.44})`;
    ctx.shadowColor = 'rgba(178,198,255,.95)';
    ctx.shadowBlur = 5 + twinkle * 5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  const totalLines = ritualEdges.length * lineProgress;
  ritualEdges.forEach(([a, b], index) => {
    const amount = clamp(totalLines - index, 0, 1);
    if (amount <= 0) return;
    const [ax, ay] = ritualStars[a];
    const [bx, by] = ritualStars[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + (bx - ax) * amount, ay + (by - ay) * amount);
    ctx.strokeStyle = `rgba(160,195,255,${0.08 + lineProgress * 0.24})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  const visibleRunes = Math.floor(runes.length * runeProgress);
  ctx.font = '14px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < visibleRunes; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / runes.length;
    const rx = Math.cos(angle) * 109;
    const ry = Math.sin(angle) * 109;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = `rgba(229,214,165,${0.35 + runeProgress * 0.45})`;
    ctx.shadowColor = 'rgba(215,200,138,.65)';
    ctx.shadowBlur = 4;
    ctx.fillText(runes[i], 0, 0);
    ctx.restore();
  }

  if (ritualComplete) {
    const flashAge = (performance.now() - ritualCompletedAt) / 1000;
    const flash = flashAge < 2 ? (1 - flashAge / 2) : 0;
    ctx.strokeStyle = `rgba(255,241,196,${0.45 + pulse * 0.28})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(178,153,255,${0.38 + pulse * 0.26})`;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.stroke();

    if (flash > 0) {
      const completeGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, 165);
      completeGlow.addColorStop(0, `rgba(255,246,215,${flash * 0.34})`);
      completeGlow.addColorStop(1, 'rgba(178,153,255,0)');
      ctx.fillStyle = completeGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 165, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawScore(time) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const proximity = Math.max(0, 1 - dist / 410);
  const pulse = 0.5 + Math.sin(time * 0.0021) * 0.5;
  const glow = 10 + proximity * 28 + pulse * 5 + (ritualComplete ? 18 : 0);

  ctx.save();
  ctx.translate(score.x, score.y);

  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, ritualComplete ? 104 : 78);
  halo.addColorStop(0, ritualComplete
    ? `rgba(178,153,255,${0.18 + pulse * 0.10})`
    : `rgba(215,200,138,${0.15 + proximity * 0.16})`);
  halo.addColorStop(1, 'rgba(215,200,138,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, ritualComplete ? 104 : 78, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#131a1d';
  ctx.fillRect(-26, 18, 52, 8);
  ctx.fillRect(-18, 26, 36, 10);
  ctx.strokeStyle = ritualComplete ? 'rgba(178,153,255,.48)' : 'rgba(215,200,138,.25)';
  ctx.strokeRect(-26.5, 17.5, 53, 9);

  ctx.shadowColor = ritualComplete ? 'rgba(178,153,255,.95)' : 'rgba(215,200,138,.8)';
  ctx.shadowBlur = glow;
  ctx.fillStyle = ritualComplete ? '#ded7cf' : '#d8d1b7';
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

  const marks = [[-25,-8],[-17,1],[-10,-13],[11,-3],[18,-11],[26,2]];
  ctx.fillStyle = '#3d3a32';
  marks.forEach(([x, y], index) => {
    ctx.beginPath();
    ctx.arc(x, y, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 1.5, y - (index % 2 ? 9 : 7), 1.2, index % 2 ? 10 : 8);
  });

  if (ritualComplete) {
    ctx.strokeStyle = `rgba(111,76,154,${0.55 + pulse * 0.25})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -5, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -5);
    ctx.lineTo(7, -5);
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = `rgba(255,244,202,${0.35 + pulse * 0.3})`;
    ctx.fillRect(-1, -33, 2, 4);
    ctx.fillRect(-1, 21, 2, 4);
    ctx.fillRect(-42, -5, 4, 2);
    ctx.fillRect(38, -5, 4, 2);
  }

  ctx.restore();
}

function drawPlayer() {
  const bob = Math.sin(player.step) * 1.2;
  const x = Math.round(player.x);
  const y = Math.round(player.y + bob);

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(-8, 8, 16, 5);

  ctx.fillStyle = '#a8c9d6';
  ctx.fillRect(-6, -7, 12, 13);
  ctx.fillStyle = '#dcecf2';
  ctx.fillRect(-5, -13, 10, 7);
  ctx.fillStyle = '#293842';
  ctx.fillRect(-6, 5, 5, 7);
  ctx.fillRect(1, 5, 5, 7);

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

  const scoreGlow = ctx.createRadialGradient(score.x, score.y, 18, score.x, score.y, ritualComplete ? 190 : 150);
  scoreGlow.addColorStop(0, ritualComplete ? 'rgba(178,153,255,.12)' : 'rgba(215,200,138,.07)');
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

  updateRitual(dt);
  updateAudio(dt);
}

function render(time) {
  drawFloor();
  drawWalls();
  drawDoors();
  drawRitual(time);
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
  if (!modalOpen) return;
  modalOpen = false;
  loreModal.classList.remove('open');
  canvas.focus();
}

function interactCenter() {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  if (dist >= 66 || modalOpen) return;

  if (ritualComplete) {
    sessionStorage.setItem('plutoArkHiddenUnlocked', '1');
    window.location.href = 'hidden.html';
    return;
  }

  openLore();
}

function setAudioEnabled(enabled) {
  bgmEnabled = enabled;
  audioToggle.textContent = enabled ? 'BGM / ON' : 'BGM / OFF';

  if (!enabled) {
    bgm.pause();
    bgmStarted = false;
    currentVolume = 0;
    targetVolume = 0;
    bgm.volume = 0;
  } else {
    startBgm();
  }
}

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();

  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e'].includes(key)) {
    startBgm();
  }

  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) event.preventDefault();

  if (key === 'escape') {
    closeLore();
    return;
  }

  if (key === 'e') {
    if (!event.repeat) interactCenter();
    return;
  }

  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)) {
    keys.add(key);
  }
});

document.addEventListener('keyup', event => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', () => {
  canvas.focus();
  startBgm();
});

loreClose.addEventListener('click', closeLore);
loreModal.addEventListener('pointerdown', event => {
  if (event.target === loreModal) closeLore();
});

audioToggle.addEventListener('click', () => {
  setAudioEnabled(!bgmEnabled);
});

touchButtons.forEach(button => {
  const key = button.dataset.move;

  const press = event => {
    event.preventDefault();
    startBgm();
    keys.add(key);
    if (button.setPointerCapture && event.pointerId !== undefined) {
      try { button.setPointerCapture(event.pointerId); } catch (_) {}
    }
  };

  const release = event => {
    event.preventDefault();
    keys.delete(key);
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
});

updateRitual(0);
updateAudio(0);
requestAnimationFrame(loop);
