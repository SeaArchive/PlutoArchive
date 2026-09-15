const gameButtons = [...document.querySelectorAll('.game-select')];
const panels = [...document.querySelectorAll('.game-panel')];

function activateGame(id) {
  gameButtons.forEach(button => {
    const active = button.dataset.game === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === id));
}

/* ARCHIVE BREACH */
const breachBoard = document.getElementById('breachBoard');
const breachStart = document.getElementById('breachStart');
const breachStop = document.getElementById('breachStop');
const breachMessage = document.getElementById('breachMessage');
const breachScore = document.getElementById('breachScore');
const breachHitsEl = document.getElementById('breachHits');
const breachAccuracy = document.getElementById('breachAccuracy');
const breachReaction = document.getElementById('breachReaction');
const breachTime = document.getElementById('breachTime');
const breachBest = document.getElementById('breachBest');
const breachSensitivity = document.getElementById('breachSensitivity');
const breachRecommendation = document.getElementById('breachRecommendation');

const BREACH_HISTORY_KEY = 'plutoArchiveBreachSensitivityHistoryV1';
const BREACH_BEST_KEY = 'plutoArchiveBreachBestV1';
const breachNodes = [];
const breachExpiryTimers = new Map();
const breachSpawnTimes = new Map();
let breachRunning = false;
let breachTimer = null;
let breachSpawnTimer = null;
let breachScoreValue = 0;
let breachHitsValue = 0;
let breachMissesValue = 0;
let breachReactionTotal = 0;
let breachTimeValue = 30;
let breachBestValue = loadStoredBest();
let breachCurrentSensitivity = 1;
let activeCorrupt = new Set();
let lastBreachNodeIndex = -1;

function loadStoredBest() {
  try {
    const stored = Number(localStorage.getItem(BREACH_BEST_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
}

function loadBreachHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BREACH_HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(item => item && Number.isFinite(Number(item.sensitivity))) : [];
  } catch {
    return [];
  }
}

function saveBreachHistory(history) {
  try {
    localStorage.setItem(BREACH_HISTORY_KEY, JSON.stringify(history.slice(-60)));
  } catch {
    // Local history is optional; the game still works without it.
  }
}

function sanitizeSensitivity() {
  const parsed = Number.parseFloat(breachSensitivity.value);
  const value = Number.isFinite(parsed) ? Math.min(20, Math.max(0.1, parsed)) : 1;
  const rounded = Math.round(value * 100) / 100;
  breachSensitivity.value = rounded.toFixed(2);
  return rounded;
}

for (let i = 0; i < 80; i += 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'breach-node';
  button.dataset.index = String(i);
  button.innerHTML = `<span class="node-code">N-${String(i + 1).padStart(2, '0')}</span>`;
  button.setAttribute('aria-label', `Aim node ${i + 1}`);
  button.addEventListener('click', () => handleBreachNode(button));
  breachBoard.appendChild(button);
  breachNodes.push(button);
}

function currentBreachAccuracy() {
  const attempts = breachHitsValue + breachMissesValue;
  return attempts ? (breachHitsValue / attempts) * 100 : 100;
}

function currentAverageReaction() {
  return breachHitsValue ? breachReactionTotal / breachHitsValue : 0;
}

function updateBreachStats() {
  breachScore.textContent = String(breachScoreValue).padStart(5, '0');
  breachHitsEl.textContent = String(breachHitsValue);
  breachAccuracy.textContent = `${Math.round(currentBreachAccuracy())}%`;
  const averageReaction = currentAverageReaction();
  breachReaction.textContent = averageReaction ? `${Math.round(averageReaction)}ms` : '—';
  breachTime.textContent = `${breachTimeValue}s`;
  breachBest.textContent = String(breachBestValue).padStart(5, '0');
}

function clearBreachExpiry(node) {
  const timer = breachExpiryTimers.get(node);
  if (timer) window.clearTimeout(timer);
  breachExpiryTimers.delete(node);
  breachSpawnTimes.delete(node);
}

function clearBreachTimers() {
  window.clearInterval(breachTimer);
  window.clearTimeout(breachSpawnTimer);
  breachTimer = null;
  breachSpawnTimer = null;
  breachExpiryTimers.forEach(timer => window.clearTimeout(timer));
  breachExpiryTimers.clear();
}

function resetBreachBoard() {
  activeCorrupt.clear();
  breachSpawnTimes.clear();
  breachNodes.forEach(node => node.classList.remove('corrupt', 'cleaned'));
  breachBoard.classList.remove('false-hit');
}

function flashFalseHit() {
  breachBoard.classList.add('false-hit');
  window.setTimeout(() => breachBoard.classList.remove('false-hit'), 100);
}

function registerBreachMiss(label = 'FALSE SIGNAL', penalty = 35) {
  if (!breachRunning) return;
  breachMissesValue += 1;
  breachScoreValue = Math.max(0, breachScoreValue - penalty);
  breachMessage.textContent = `${label} / -${penalty}`;
  flashFalseHit();
  updateBreachStats();
}

function spawnCorruptNode() {
  if (!breachRunning) return;

  const maxActive = breachTimeValue <= 8 ? 2 : 1;
  const available = breachNodes.filter((node, index) => !node.classList.contains('corrupt') && index !== lastBreachNodeIndex);

  if (activeCorrupt.size < maxActive && available.length) {
    const choiceIndex = Math.floor(Math.random() * available.length);
    const node = available[choiceIndex];
    lastBreachNodeIndex = Number(node.dataset.index);
    node.classList.add('corrupt');
    activeCorrupt.add(node);
    breachSpawnTimes.set(node, performance.now());

    const lifetime = Math.max(620, 1180 - (30 - breachTimeValue) * 17);
    const expiryTimer = window.setTimeout(() => {
      if (!breachRunning || !node.classList.contains('corrupt')) return;
      node.classList.remove('corrupt');
      activeCorrupt.delete(node);
      breachExpiryTimers.delete(node);
      breachSpawnTimes.delete(node);
      breachMissesValue += 1;
      breachScoreValue = Math.max(0, breachScoreValue - 50);
      breachMessage.textContent = 'TARGET LOST / -50';
      updateBreachStats();
    }, lifetime);

    breachExpiryTimers.set(node, expiryTimer);
  }

  const nextDelay = Math.max(280, 560 - (30 - breachTimeValue) * 7);
  breachSpawnTimer = window.setTimeout(spawnCorruptNode, nextDelay + Math.random() * 150);
}

function handleBreachNode(node) {
  if (!breachRunning) return;

  if (!node.classList.contains('corrupt')) {
    registerBreachMiss('FALSE SIGNAL', 35);
    return;
  }

  const spawnedAt = breachSpawnTimes.get(node) || performance.now();
  const reactionMs = Math.max(1, performance.now() - spawnedAt);
  clearBreachExpiry(node);
  node.classList.remove('corrupt');
  node.classList.add('cleaned');
  activeCorrupt.delete(node);

  breachHitsValue += 1;
  breachReactionTotal += reactionMs;
  const speedBonus = Math.max(0, Math.round((900 - reactionMs) / 8));
  const gain = 100 + speedBonus;
  breachScoreValue += gain;
  breachMessage.textContent = `TARGET RESTORED / ${Math.round(reactionMs)}ms / +${gain}`;
  updateBreachStats();

  window.setTimeout(() => node.classList.remove('cleaned'), 130);
}

breachBoard.addEventListener('click', event => {
  if (!breachRunning) return;
  if (event.target.closest('.breach-node')) return;
  registerBreachMiss('EMPTY FIELD', 25);
});

function recordSensitivitySession() {
  if (!breachHitsValue) return;

  const accuracy = currentBreachAccuracy();
  const avgReaction = currentAverageReaction();
  const efficiency = (breachHitsValue * (accuracy / 100) * 1000) / Math.max(150, avgReaction);
  const history = loadBreachHistory();

  history.push({
    sensitivity: breachCurrentSensitivity,
    hits: breachHitsValue,
    misses: breachMissesValue,
    accuracy,
    avgReaction,
    score: breachScoreValue,
    efficiency,
    timestamp: Date.now()
  });

  saveBreachHistory(history);
}

function updateSensitivityRecommendation(currentSensitivity = sanitizeSensitivity()) {
  const history = loadBreachHistory();

  if (!history.length) {
    breachRecommendation.textContent = 'SENSITIVITY ANALYSIS / 완료된 30초 세션부터 비교 데이터에 반영됩니다.';
    return;
  }

  const groups = new Map();
  history.forEach(session => {
    const key = Number(session.sensitivity).toFixed(2);
    if (!groups.has(key)) {
      groups.set(key, { sensitivity: Number(key), sessions: 0, efficiency: 0, accuracy: 0, avgReaction: 0 });
    }
    const group = groups.get(key);
    group.sessions += 1;
    group.efficiency += Number(session.efficiency) || 0;
    group.accuracy += Number(session.accuracy) || 0;
    group.avgReaction += Number(session.avgReaction) || 0;
  });

  const ranked = [...groups.values()].map(group => ({
    ...group,
    efficiency: group.efficiency / group.sessions,
    accuracy: group.accuracy / group.sessions,
    avgReaction: group.avgReaction / group.sessions
  })).sort((a, b) => b.efficiency - a.efficiency);

  const best = ranked[0];
  if (ranked.length === 1) {
    breachRecommendation.innerHTML = `BASELINE / 감도 <strong>${best.sensitivity.toFixed(2)}</strong> · 평균 적중률 ${Math.round(best.accuracy)}% · 평균 반응 ${Math.round(best.avgReaction)}ms · 다른 감도에서도 완료 세션을 만들면 비교 추천이 활성화됩니다.`;
    return;
  }

  const current = ranked.find(group => group.sensitivity.toFixed(2) === Number(currentSensitivity).toFixed(2));
  let deltaText = '';
  if (current && current.efficiency > 0 && current.sensitivity !== best.sensitivity) {
    const delta = ((best.efficiency / current.efficiency) - 1) * 100;
    deltaText = ` · 현재 감도 대비 효율 ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
  }

  breachRecommendation.innerHTML = `RECOMMENDED SENSITIVITY / <strong>${best.sensitivity.toFixed(2)}</strong> · 평균 적중률 ${Math.round(best.accuracy)}% · 평균 반응 ${Math.round(best.avgReaction)}ms · ${best.sessions} SESSION${best.sessions > 1 ? 'S' : ''}${deltaText}`;
}

function stopBreach(completed = false) {
  if (!breachRunning && !completed) return;
  breachRunning = false;
  clearBreachTimers();
  resetBreachBoard();
  breachBestValue = Math.max(breachBestValue, breachScoreValue);

  try {
    localStorage.setItem(BREACH_BEST_KEY, String(breachBestValue));
  } catch {
    // Best score persistence is optional.
  }

  if (completed) recordSensitivitySession();

  breachStart.disabled = false;
  breachStart.textContent = 'RESTART';
  breachStop.disabled = true;
  breachSensitivity.disabled = false;
  breachMessage.textContent = completed
    ? `SESSION COMPLETE / SCORE ${breachScoreValue}`
    : `SESSION STOPPED / SCORE ${breachScoreValue} / ANALYSIS EXCLUDED`;
  updateBreachStats();
  updateSensitivityRecommendation(breachCurrentSensitivity);
}

function startBreach() {
  clearBreachTimers();
  resetBreachBoard();
  breachCurrentSensitivity = sanitizeSensitivity();
  breachRunning = true;
  breachScoreValue = 0;
  breachHitsValue = 0;
  breachMissesValue = 0;
  breachReactionTotal = 0;
  breachTimeValue = 30;
  lastBreachNodeIndex = -1;
  breachStart.disabled = true;
  breachStart.textContent = 'RUNNING';
  breachStop.disabled = false;
  breachSensitivity.disabled = true;
  breachMessage.textContent = `AIM TEST / SENS ${breachCurrentSensitivity.toFixed(2)}`;
  updateBreachStats();
  spawnCorruptNode();

  breachTimer = window.setInterval(() => {
    breachTimeValue -= 1;
    updateBreachStats();
    if (breachTimeValue <= 0) stopBreach(true);
  }, 1000);
}

breachStart.addEventListener('click', startBreach);
breachStop.addEventListener('click', () => stopBreach(false));
breachSensitivity.addEventListener('change', () => updateSensitivityRecommendation(sanitizeSensitivity()));
updateBreachStats();
updateSensitivityRecommendation();

/* RHYTHM SIGNAL */
const rhythmStart = document.getElementById('rhythmStart');
const rhythmStop = document.getElementById('rhythmStop');
const rhythmMessage = document.getElementById('rhythmMessage');
const rhythmScore = document.getElementById('rhythmScore');
const rhythmCombo = document.getElementById('rhythmCombo');
const rhythmTime = document.getElementById('rhythmTime');
const rhythmAccuracy = document.getElementById('rhythmAccuracy');
const rhythmWrap = document.getElementById('rhythmWrap');
const rhythmStarfield = document.getElementById('rhythmStarfield');
const rhythmLanes = [...document.querySelectorAll('.rhythm-lane')];
const laneButtons = [...document.querySelectorAll('.lane-button')];

const laneKeys = ['d', 'f', 'j', 'k'];
let rhythmRunning = false;
let rhythmAnimation = null;
let rhythmScheduler = null;
let rhythmClock = null;
let rhythmAudio = null;
let rhythmNotes = [];
let rhythmScoreValue = 0;
let rhythmComboValue = 0;
let rhythmHits = 0;
let rhythmAttempts = 0;
let rhythmTimeValue = 30;
let nextNoteId = 0;
let beatCounter = 0;

function updateRhythmStats() {
  rhythmScore.textContent = String(rhythmScoreValue).padStart(5, '0');
  rhythmCombo.textContent = `x${rhythmComboValue}`;
  rhythmTime.textContent = `${rhythmTimeValue}s`;
  const accuracy = rhythmAttempts ? Math.round((rhythmHits / rhythmAttempts) * 100) : 100;
  rhythmAccuracy.textContent = `${accuracy}%`;
}

function ensureAudio() {
  if (rhythmAudio) return rhythmAudio;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  rhythmAudio = new AudioContext();
  return rhythmAudio;
}

function pulseBeat(strong = false) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = strong ? 520 : 330;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(strong ? 0.08 : 0.045, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.09);
}

function clearRhythmStars() {
  rhythmStarfield.replaceChildren();
}

function spawnRhythmStar() {
  const star = document.createElement('span');
  star.className = 'rhythm-star';
  const size = 2 + Math.random() * 2.8;
  star.style.left = `${5 + Math.random() * 90}%`;
  star.style.top = `${4 + Math.random() * 78}%`;
  star.style.setProperty('--star-size', `${size.toFixed(1)}px`);
  star.style.setProperty('--twinkle-time', `${(1.1 + Math.random() * 1.7).toFixed(2)}s`);
  star.style.animationDelay = `${(-Math.random() * 1.5).toFixed(2)}s`;
  rhythmStarfield.appendChild(star);

  while (rhythmStarfield.childElementCount > 120) {
    rhythmStarfield.firstElementChild?.remove();
  }
}

function makeNote(laneIndex) {
  if (!rhythmRunning) return;
  const note = document.createElement('div');
  note.className = 'rhythm-note';
  note.dataset.id = String(nextNoteId++);
  rhythmLanes[laneIndex].appendChild(note);
  rhythmNotes.push({
    id: note.dataset.id,
    laneIndex,
    element: note,
    y: -18
  });
}

function scheduleBeat() {
  if (!rhythmRunning) return;
  beatCounter += 1;
  pulseBeat(beatCounter % 4 === 1);

  const lane = Math.floor(Math.random() * 4);
  makeNote(lane);
  if (beatCounter > 4 && Math.random() < 0.22) {
    let second = Math.floor(Math.random() * 4);
    if (second === lane) second = (second + 1) % 4;
    makeNote(second);
  }
}

function removeNote(note) {
  if (note.element.isConnected) note.element.remove();
  rhythmNotes = rhythmNotes.filter(item => item !== note);
}

function animateRhythm() {
  if (!rhythmRunning) return;
  const targetY = rhythmWrap.clientHeight - 62;
  const speed = 3.25;

  [...rhythmNotes].forEach(note => {
    note.y += speed;
    note.element.style.transform = `translateY(${note.y}px)`;

    if (note.y > targetY + 58) {
      rhythmAttempts += 1;
      rhythmComboValue = 0;
      rhythmMessage.textContent = 'MISS';
      rhythmLanes[note.laneIndex].classList.add('miss');
      window.setTimeout(() => rhythmLanes[note.laneIndex].classList.remove('miss'), 100);
      removeNote(note);
      updateRhythmStats();
    }
  });

  rhythmAnimation = requestAnimationFrame(animateRhythm);
}

function hitLane(laneIndex) {
  const laneButton = laneButtons[laneIndex];
  laneButton.classList.add('active');
  rhythmLanes[laneIndex].classList.add('flash');
  window.setTimeout(() => {
    laneButton.classList.remove('active');
    rhythmLanes[laneIndex].classList.remove('flash');
  }, 90);

  if (!rhythmRunning) return;

  const targetY = rhythmWrap.clientHeight - 62;
  const candidates = rhythmNotes
    .filter(note => note.laneIndex === laneIndex)
    .map(note => ({ note, distance: Math.abs(note.y - targetY) }))
    .sort((a, b) => a.distance - b.distance);

  rhythmAttempts += 1;
  if (!candidates.length || candidates[0].distance > 54) {
    rhythmComboValue = 0;
    rhythmMessage.textContent = 'MISS';
    updateRhythmStats();
    return;
  }

  const { note, distance } = candidates[0];
  let grade = 'GOOD';
  let points = 100;
  if (distance <= 18) {
    grade = 'PERFECT';
    points = 300;
    spawnRhythmStar();
  } else if (distance <= 34) {
    grade = 'GREAT';
    points = 200;
  }

  rhythmHits += 1;
  rhythmComboValue += 1;
  rhythmScoreValue += points + Math.min(200, rhythmComboValue * 5);
  rhythmMessage.textContent = grade;
  removeNote(note);
  updateRhythmStats();
}

function clearRhythmTimers() {
  cancelAnimationFrame(rhythmAnimation);
  clearInterval(rhythmScheduler);
  clearInterval(rhythmClock);
  rhythmAnimation = null;
  rhythmScheduler = null;
  rhythmClock = null;
}

function stopRhythm(completed = false) {
  if (!rhythmRunning && !completed) return;
  rhythmRunning = false;
  clearRhythmTimers();
  rhythmNotes.forEach(note => note.element.remove());
  rhythmNotes = [];
  rhythmStart.disabled = false;
  rhythmStart.textContent = 'RESTART';
  rhythmStop.disabled = true;
  rhythmMessage.textContent = completed
    ? `SESSION COMPLETE / SCORE ${rhythmScoreValue}`
    : `SESSION STOPPED / SCORE ${rhythmScoreValue}`;
  updateRhythmStats();
}

function startRhythm() {
  clearRhythmTimers();
  rhythmNotes.forEach(note => note.element.remove());
  rhythmNotes = [];
  clearRhythmStars();

  rhythmRunning = true;
  rhythmScoreValue = 0;
  rhythmComboValue = 0;
  rhythmHits = 0;
  rhythmAttempts = 0;
  rhythmTimeValue = 30;
  beatCounter = 0;
  rhythmStart.disabled = true;
  rhythmStart.textContent = 'RUNNING';
  rhythmStop.disabled = false;
  rhythmMessage.textContent = 'SYNC TO THE SIGNAL';
  updateRhythmStats();

  const ctx = ensureAudio();
  if (ctx?.state === 'suspended') ctx.resume();

  scheduleBeat();
  rhythmScheduler = window.setInterval(scheduleBeat, 500);
  rhythmClock = window.setInterval(() => {
    rhythmTimeValue -= 1;
    updateRhythmStats();
    if (rhythmTimeValue <= 0) stopRhythm(true);
  }, 1000);
  rhythmAnimation = requestAnimationFrame(animateRhythm);
}

rhythmStart.addEventListener('click', startRhythm);
rhythmStop.addEventListener('click', () => stopRhythm(false));
laneButtons.forEach((button, index) => button.addEventListener('click', () => hitLane(index)));

document.addEventListener('keydown', event => {
  const index = laneKeys.indexOf(event.key.toLowerCase());
  if (index === -1) return;
  const activePanel = document.querySelector('.game-panel.active');
  if (activePanel?.dataset.panel !== 'rhythm') return;
  if (event.repeat) return;
  hitLane(index);
});

gameButtons.forEach(button => {
  button.addEventListener('click', () => {
    const nextGame = button.dataset.game;
    if (nextGame !== 'breach' && breachRunning) stopBreach(false);
    if (nextGame !== 'rhythm' && rhythmRunning) stopRhythm(false);
    activateGame(nextGame);
  });
});

updateRhythmStats();
activateGame('breach');
