const canvas = document.getElementById('arkCanvas');
const ctx = canvas.getContext('2d');
const bgm = document.getElementById('arkBgm');
const starLightBgm = document.getElementById('starLightBgm');
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

const WORLD_W = 1920;
const WORLD_H = 1152;
const TILE = 32;
const COLS = WORLD_W / TILE;
const ROWS = WORLD_H / TILE;
const RITUAL_RADIUS = 124;
const RITUAL_DURATION = 30;
const VIEW_H = 640;
const RENDER_SCALE = 1.35;

const camera = {
  x: 0,
  y: 0,
  w: 960,
  h: VIEW_H,
  initialized: false
};

function resizeGameCanvas() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width || window.innerWidth || 960);
  const height = Math.max(1, rect.height || window.innerHeight || 640);
  const aspect = width / height;

  const logicalWidth = Math.max(1, Math.round(VIEW_H * aspect));
  canvas.height = Math.round(VIEW_H * RENDER_SCALE);
  canvas.width = Math.round(logicalWidth * RENDER_SCALE);
  camera.w = logicalWidth;
  camera.h = VIEW_H;
  camera.initialized = false;
  ctx.imageSmoothingEnabled = false;
}

function updateCamera() {
  const maxX = Math.max(0, WORLD_W - camera.w);
  const maxY = Math.max(0, WORLD_H - camera.h);
  const targetX = clamp(player.x - camera.w / 2, 0, maxX);
  const targetY = clamp(player.y - camera.h / 2, 0, maxY);

  if (!camera.initialized) {
    camera.x = targetX;
    camera.y = targetY;
    camera.initialized = true;
    return;
  }

  camera.x += (targetX - camera.x) * 0.14;
  camera.y += (targetY - camera.y) * 0.14;
}

resizeGameCanvas();
window.addEventListener('resize', resizeGameCanvas);

const keys = new Set();

const mobileDrag = {
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  dx: 0,
  dy: 0,
  strength: 0
};

const MOBILE_DRAG_DEADZONE = 12;
const MOBILE_DRAG_MAX = 80;

let lastTime = performance.now();
let lastRenderTime = 0;
const FRAME_INTERVAL = 1000 / 45;
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

const exitDoor = {
  x: 50,
  y: WORLD_H - 56,
  radius: 78
};

function seededUnit(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

const SPACE_STARS = Array.from({ length: 560 }, (_, index) => ({
  x: seededUnit(index * 4 + 1) * WORLD_W,
  y: seededUnit(index * 4 + 2) * WORLD_H,
  size: 0.6 + seededUnit(index * 4 + 3) * 1.9,
  phase: seededUnit(index * 4 + 4) * Math.PI * 2,
  depth: 0.3 + seededUnit(index * 4 + 5) * 0.7
}));

const SPACE_NEBULAE = [
  { x: 280, y: 220, radius: 300, tone: '88,118,190' },
  { x: 1540, y: 250, radius: 340, tone: '104,76,150' },
  { x: 1420, y: 940, radius: 360, tone: '55,110,150' },
  { x: 620, y: 930, radius: 280, tone: '92,70,142' }
];

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
  walls.clear();
}

buildMap();

function tileBlocked() {
  return false;
}

function collides(x, y) {
  const r = player.radius + 10;
  return x - r < 0 || y - r < 0 || x + r > WORLD_W || y + r > WORLD_H;
}

function movePlayer(dx, dy, dt, speedScale = 1) {
  if (!dx && !dy) return;

  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;

  const running = keys.has('shift');
  const speed = running ? 178 : player.speed;
  const amount = speed * dt * clamp(speedScale, 0, 1);

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
  if (bgmStarted && !bgm.paused && !starLightBgm.paused) return;

  bgmStarted = true;
  if (!Number.isFinite(bgm.volume)) bgm.volume = 0;
  if (!Number.isFinite(starLightBgm.volume)) starLightBgm.volume = 0;

  const plays = [bgm.play(), starLightBgm.play()];
  Promise.all(plays).catch(() => {
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

  const nearScore = dist < 66;
  const exitDist = Math.hypot(player.x - exitDoor.x, player.y - exitDoor.y);
  const nearExit = exitDist < exitDoor.radius;
  const showInteraction = (nearExit || nearScore) && !modalOpen;

  interaction.classList.toggle('visible', showInteraction);
  interaction.classList.toggle('unlocked', nearScore && ritualComplete && !nearExit);
  interaction.classList.toggle('exit-door', nearExit);

  if (nearExit) {
    interaction.textContent = 'E  /  RETURN TO MAIN ARCHIVE';
  } else if (nearScore) {
    interaction.textContent = ritualComplete
      ? 'E  /  OPEN THE HIDDEN PAGE'
      : 'E  /  EXAMINE THE LULLABY SCORE';
  } else {
    interaction.textContent = '';
  }
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

function drawFloor(time) {
  ctx.fillStyle = '#010207';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  SPACE_NEBULAE.forEach((nebula, index) => {
    const driftX = Math.sin(time * 0.00008 + index) * 10;
    const driftY = Math.cos(time * 0.00007 + index * 1.7) * 8;
    const gradient = ctx.createRadialGradient(
      nebula.x + driftX,
      nebula.y + driftY,
      0,
      nebula.x + driftX,
      nebula.y + driftY,
      nebula.radius
    );
    gradient.addColorStop(0, `rgba(${nebula.tone},.055)`);
    gradient.addColorStop(.46, `rgba(${nebula.tone},.022)`);
    gradient.addColorStop(1, `rgba(${nebula.tone},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(nebula.x + driftX, nebula.y + driftY, nebula.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  SPACE_STARS.forEach((star, index) => {
    const twinkle = 0.42 + 0.58 * Math.sin(time * (0.0012 + star.depth * 0.0014) + star.phase) ** 2;
    const alpha = 0.18 + twinkle * (0.42 + star.depth * 0.32);
    const size = star.size * (0.75 + star.depth * 0.45);

    ctx.fillStyle = `rgba(222,236,255,${alpha})`;
    if (size > 1.7) {
      ctx.shadowColor = index % 5 === 0 ? 'rgba(174,157,255,.8)' : 'rgba(146,204,255,.8)';
      ctx.shadowBlur = 4 + twinkle * 5;
    }
    ctx.fillRect(Math.round(star.x), Math.round(star.y), size, size);
    ctx.shadowBlur = 0;
  });
}

function drawWalls() {
  // The Ark is now an open star field; world bounds are intentionally invisible.
}

function drawExitDoor(time) {
  const pulse = 0.5 + Math.sin(time * 0.0044) * 0.5;
  const x = exitDoor.x;
  const y = exitDoor.y;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 74);
  halo.addColorStop(0, `rgba(120,230,255,${0.18 + pulse * 0.12})`);
  halo.addColorStop(0.45, `rgba(73,214,255,${0.08 + pulse * 0.08})`);
  halo.addColorStop(1, 'rgba(73,214,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'rgba(73,214,255,.95)';
  ctx.shadowBlur = 12 + pulse * 12;
  ctx.fillStyle = `rgba(148,235,255,${0.12 + pulse * 0.08})`;
  ctx.fillRect(-18, -30, 36, 52);

  ctx.strokeStyle = `rgba(188,246,255,${0.56 + pulse * 0.34})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(-18.5, -30.5, 37, 53);

  ctx.strokeStyle = `rgba(73,214,255,${0.32 + pulse * 0.30})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(-13.5, -25.5, 27, 43);

  ctx.fillStyle = `rgba(231,252,255,${0.64 + pulse * 0.30})`;
  ctx.fillRect(9, -4, 2, 2);

  for (let i = 0; i < 8; i += 1) {
    const angle = i * 2.399963 + time * (0.0007 + (i % 3) * 0.00008);
    const radius = 30 + (i % 4) * 7 + Math.sin(time * 0.002 + i) * 4;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius - 4;
    ctx.fillStyle = `rgba(202,247,255,${0.24 + pulse * 0.42})`;
    ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(184,235,247,${0.58 + pulse * 0.28})`;
  ctx.fillText('EXIT', 0, 37);
  ctx.restore();
}

function drawDoors() {
  // Archive rooms are represented by interactive constellations instead of doors.
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
  const proximity = Math.max(0, 1 - dist / 520);
  const pulse = 0.5 + Math.sin(time * 0.0021) * 0.5;
  const bob = Math.sin(time * 0.0016) * 2;
  const planetRadius = 42;

  ctx.save();
  ctx.translate(score.x, score.y + bob);
  ctx.globalCompositeOperation = 'lighter';

  const outerGlow = ctx.createRadialGradient(0, 0, planetRadius * .4, 0, 0, 118);
  outerGlow.addColorStop(0, `rgba(164,181,225,${0.09 + proximity * 0.08 + pulse * 0.03})`);
  outerGlow.addColorStop(.45, `rgba(94,111,176,${0.05 + proximity * 0.05})`);
  outerGlow.addColorStop(1, 'rgba(56,70,130,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 118, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';

  const sphere = ctx.createRadialGradient(-13, -16, 6, 0, 0, planetRadius);
  sphere.addColorStop(0, '#d5d7db');
  sphere.addColorStop(.28, '#a9abb3');
  sphere.addColorStop(.58, '#777985');
  sphere.addColorStop(.84, '#484b58');
  sphere.addColorStop(1, '#232733');
  ctx.fillStyle = sphere;
  ctx.shadowColor = ritualComplete ? 'rgba(190,163,255,.82)' : 'rgba(132,159,212,.58)';
  ctx.shadowBlur = 14 + proximity * 16 + (ritualComplete ? 14 : 0);
  ctx.beginPath();
  ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const patches = [
    [-16,-10,10,7,.22],[10,-17,13,8,.16],[14,8,11,7,.18],
    [-7,19,14,6,.14],[-24,9,8,5,.16],[2,-2,9,6,.12]
  ];
  patches.forEach(([x,y,rx,ry,a], index) => {
    ctx.fillStyle = index % 2
      ? `rgba(204,193,170,${a})`
      : `rgba(87,79,100,${a + .05})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, index * .6, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(224,218,201,.25)';
  ctx.beginPath();
  ctx.ellipse(-6, 2, 12, 8, -.28, 0, Math.PI * 2);
  ctx.ellipse(6, 1, 11, 7, .24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(151,177,221,${0.20 + pulse * 0.18})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 3, 62, 16, -.18, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const angle = time * (0.00022 + i * 0.00003) + i * 1.26;
    const radius = 67 + (i % 2) * 9;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * .34;
    const s = i % 2 ? 1.4 : 2;
    ctx.fillStyle = `rgba(208,229,255,${0.34 + pulse * 0.28})`;
    ctx.fillRect(x, y, s, s);
  }

  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(188,208,232,.72)';
  ctx.fillText('PLUTO / CENTRAL RESONANCE', 0, 72);
  ctx.restore();
}

function drawPlayer() {
  const bob = Math.sin(player.step) * 1.1;
  const x = Math.round(player.x);
  const y = Math.round(player.y + bob);

  ctx.save();
  ctx.translate(x, y);

  const footGlow = ctx.createRadialGradient(0, 9, 1, 0, 9, 18);
  footGlow.addColorStop(0, 'rgba(92,190,225,.16)');
  footGlow.addColorStop(1, 'rgba(92,190,225,0)');
  ctx.fillStyle = footGlow;
  ctx.beginPath();
  ctx.ellipse(0, 9, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

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
  const gradient = ctx.createRadialGradient(player.x, player.y, 110, player.x, player.y, 430);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(.64, 'rgba(0,0,0,.05)');
  gradient.addColorStop(1, 'rgba(0,0,0,.24)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const scoreGlow = ctx.createRadialGradient(score.x, score.y, 24, score.x, score.y, ritualComplete ? 230 : 175);
  scoreGlow.addColorStop(0, ritualComplete ? 'rgba(178,153,255,.12)' : 'rgba(115,145,205,.07)');
  scoreGlow.addColorStop(1, 'rgba(80,100,160,0)');
  ctx.fillStyle = scoreGlow;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

function update(dt) {
  if (!modalOpen) {
    let dx = 0;
    let dy = 0;
    let speedScale = 1;

    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    if (mobileDrag.active && mobileDrag.strength > 0) {
      dx += mobileDrag.dx;
      dy += mobileDrag.dy;
      speedScale = Math.max(.32, mobileDrag.strength);
    }

    movePlayer(dx, dy, dt, speedScale);
  }

  updateRitual(dt);
  updateAudio(dt);
}

function render(time) {
  updateCamera();

  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  ctx.fillStyle = '#020406';
  ctx.fillRect(0, 0, camera.w, camera.h);

  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

  drawFloor(time);
  drawWalls();
  drawDoors();
  drawRitual(time);
  drawScore(time);

  if (typeof drawWorldInteractables === 'function') {
    drawWorldInteractables(time);
  }

  drawExitDoor(time);
  drawLighting();
  drawPlayer();

  ctx.restore();
}

function loop(now) {
  if (now - lastRenderTime < FRAME_INTERVAL) {
    requestAnimationFrame(loop);
    return;
  }

  const dt = Math.min(0.04, (now - lastTime) / 1000);
  lastTime = now;
  lastRenderTime = now;
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
  if (modalOpen) return;

  const exitDist = Math.hypot(player.x - exitDoor.x, player.y - exitDoor.y);
  if (exitDist < exitDoor.radius) {
    keys.clear();
    window.location.href = '../index.html';
    return;
  }

  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  if (dist >= 66) return;

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
    starLightBgm.pause();
    bgmStarted = false;
    currentVolume = 0;
    targetVolume = 0;
    bgm.volume = 0;
    starLightBgm.volume = 0;
  } else {
    startBgm();
  }
}

function updateMobileDrag(event) {
  const deltaX = event.clientX - mobileDrag.startX;
  const deltaY = event.clientY - mobileDrag.startY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= MOBILE_DRAG_DEADZONE) {
    mobileDrag.dx = 0;
    mobileDrag.dy = 0;
    mobileDrag.strength = 0;
    return;
  }

  mobileDrag.dx = deltaX / distance;
  mobileDrag.dy = deltaY / distance;
  mobileDrag.strength = clamp(
    (distance - MOBILE_DRAG_DEADZONE) / (MOBILE_DRAG_MAX - MOBILE_DRAG_DEADZONE),
    0,
    1
  );
}

function stopMobileDrag(pointerId = null) {
  if (!mobileDrag.active) return;
  if (pointerId !== null && mobileDrag.pointerId !== pointerId) return;

  mobileDrag.active = false;
  mobileDrag.pointerId = null;
  mobileDrag.dx = 0;
  mobileDrag.dy = 0;
  mobileDrag.strength = 0;
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
    if (!event.repeat) {
      if (modalOpen) closeLore();
      else interactCenter();
    }
    return;
  }

  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)) {
    keys.add(key);
  }
});

document.addEventListener('keyup', event => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => {
  keys.clear();
  stopMobileDrag();
});

canvas.addEventListener('pointerdown', event => {
  canvas.focus();
  startBgm();

  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

  event.preventDefault();
  mobileDrag.active = true;
  mobileDrag.pointerId = event.pointerId;
  mobileDrag.startX = event.clientX;
  mobileDrag.startY = event.clientY;
  mobileDrag.dx = 0;
  mobileDrag.dy = 0;
  mobileDrag.strength = 0;

  if (canvas.setPointerCapture) {
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  }
});

canvas.addEventListener('pointermove', event => {
  if (!mobileDrag.active || event.pointerId !== mobileDrag.pointerId) return;
  event.preventDefault();
  updateMobileDrag(event);
});

canvas.addEventListener('pointerup', event => {
  if (event.pointerId !== mobileDrag.pointerId) return;
  event.preventDefault();
  stopMobileDrag(event.pointerId);
});

canvas.addEventListener('pointercancel', event => {
  stopMobileDrag(event.pointerId);
});

canvas.addEventListener('lostpointercapture', event => {
  stopMobileDrag(event.pointerId);
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
