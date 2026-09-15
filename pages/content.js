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

gameButtons.forEach(button => {
  button.addEventListener('click', () => activateGame(button.dataset.game));
});

/* ARCHIVE BREACH */
const breachBoard = document.getElementById('breachBoard');
const breachStart = document.getElementById('breachStart');
const breachMessage = document.getElementById('breachMessage');
const breachScore = document.getElementById('breachScore');
const breachCombo = document.getElementById('breachCombo');
const breachTime = document.getElementById('breachTime');
const breachBest = document.getElementById('breachBest');

const breachNodes = [];
let breachRunning = false;
let breachTimer = null;
let breachSpawnTimer = null;
let breachScoreValue = 0;
let breachComboValue = 0;
let breachTimeValue = 30;
let breachBestValue = 0;
let activeCorrupt = new Set();

for (let i = 0; i < 20; i += 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'breach-node';
  button.dataset.index = String(i);
  button.innerHTML = `<span class="node-code">N-${String(i + 1).padStart(2, '0')}</span>`;
  button.setAttribute('aria-label', `Node ${i + 1}`);
  button.addEventListener('click', () => handleBreachNode(button));
  breachBoard.appendChild(button);
  breachNodes.push(button);
}

function updateBreachStats() {
  breachScore.textContent = String(breachScoreValue).padStart(5, '0');
  breachCombo.textContent = `x${breachComboValue}`;
  breachTime.textContent = `${breachTimeValue}s`;
  breachBest.textContent = String(breachBestValue).padStart(5, '0');
}

function resetBreachBoard() {
  activeCorrupt.clear();
  breachNodes.forEach(node => {
    node.classList.remove('corrupt', 'cleaned');
    node.disabled = false;
  });
}

function spawnCorruptNode() {
  if (!breachRunning) return;

  const available = breachNodes.filter(node => !node.classList.contains('corrupt'));
  if (!available.length) return;

  const amount = breachTimeValue <= 10 && Math.random() < 0.45 ? 2 : 1;

  for (let i = 0; i < amount; i += 1) {
    if (!available.length) break;
    const choiceIndex = Math.floor(Math.random() * available.length);
    const node = available.splice(choiceIndex, 1)[0];
    node.classList.add('corrupt');
    activeCorrupt.add(node);

    const lifetime = Math.max(520, 1150 - (30 - breachTimeValue) * 15);
    window.setTimeout(() => {
      if (!breachRunning || !node.classList.contains('corrupt')) return;
      node.classList.remove('corrupt');
      activeCorrupt.delete(node);
      breachComboValue = 0;
      breachScoreValue = Math.max(0, breachScoreValue - 75);
      breachMessage.textContent = 'BREACH MISSED / -75';
      updateBreachStats();
    }, lifetime);
  }

  const nextDelay = Math.max(340, 760 - (30 - breachTimeValue) * 10);
  breachSpawnTimer = window.setTimeout(spawnCorruptNode, nextDelay + Math.random() * 260);
}

function handleBreachNode(node) {
  if (!breachRunning) return;

  if (!node.classList.contains('corrupt')) {
    breachComboValue = 0;
    breachScoreValue = Math.max(0, breachScoreValue - 40);
    breachMessage.textContent = 'FALSE SIGNAL / -40';
    updateBreachStats();
    return;
  }

  node.classList.remove('corrupt');
  node.classList.add('cleaned');
  activeCorrupt.delete(node);
  breachComboValue += 1;
  const gain = 100 + Math.min(400, breachComboValue * 20);
  breachScoreValue += gain;
  breachMessage.textContent = `NODE RESTORED / +${gain}`;
  updateBreachStats();

  window.setTimeout(() => node.classList.remove('cleaned'), 180);
}

function stopBreach() {
  breachRunning = false;
  window.clearInterval(breachTimer);
  window.clearTimeout(breachSpawnTimer);
  breachTimer = null;
  breachSpawnTimer = null;
  resetBreachBoard();
  breachBestValue = Math.max(breachBestValue, breachScoreValue);
  breachStart.disabled = false;
  breachStart.textContent = 'RESTART';
  breachMessage.textContent = `SESSION COMPLETE / SCORE ${breachScoreValue}`;
  updateBreachStats();
}

function startBreach() {
  window.clearInterval(breachTimer);
  window.clearTimeout(breachSpawnTimer);
  resetBreachBoard();
  breachRunning = true;
  breachScoreValue = 0;
  breachComboValue = 0;
  breachTimeValue = 30;
  breachStart.disabled = true;
  breachStart.textContent = 'RUNNING';
  breachMessage.textContent = 'TRACE CORRUPTED NODES';
  updateBreachStats();
  spawnCorruptNode();

  breachTimer = window.setInterval(() => {
    breachTimeValue -= 1;
    updateBreachStats();
    if (breachTimeValue <= 0) stopBreach();
  }, 1000);
}

breachStart.addEventListener('click', startBreach);
updateBreachStats();

/* RHYTHM SIGNAL */
const rhythmStart = document.getElementById('rhythmStart');
const rhythmMessage = document.getElementById('rhythmMessage');
const rhythmScore = document.getElementById('rhythmScore');
const rhythmCombo = document.getElementById('rhythmCombo');
const rhythmTime = document.getElementById('rhythmTime');
const rhythmAccuracy = document.getElementById('rhythmAccuracy');
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
    y: -18,
    hit: false
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
  const boardHeight = document.querySelector('.rhythm-wrap').clientHeight;
  const targetY = boardHeight - 62;
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

  const boardHeight = document.querySelector('.rhythm-wrap').clientHeight;
  const targetY = boardHeight - 62;
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

function stopRhythm() {
  rhythmRunning = false;
  cancelAnimationFrame(rhythmAnimation);
  clearInterval(rhythmScheduler);
  clearInterval(rhythmClock);
  rhythmAnimation = null;
  rhythmScheduler = null;
  rhythmClock = null;
  rhythmNotes.forEach(note => note.element.remove());
  rhythmNotes = [];
  rhythmStart.disabled = false;
  rhythmStart.textContent = 'RESTART';
  rhythmMessage.textContent = `SESSION COMPLETE / SCORE ${rhythmScoreValue}`;
  updateRhythmStats();
}

function startRhythm() {
  cancelAnimationFrame(rhythmAnimation);
  clearInterval(rhythmScheduler);
  clearInterval(rhythmClock);
  rhythmNotes.forEach(note => note.element.remove());
  rhythmNotes = [];

  rhythmRunning = true;
  rhythmScoreValue = 0;
  rhythmComboValue = 0;
  rhythmHits = 0;
  rhythmAttempts = 0;
  rhythmTimeValue = 30;
  beatCounter = 0;
  rhythmStart.disabled = true;
  rhythmStart.textContent = 'RUNNING';
  rhythmMessage.textContent = 'SYNC TO THE SIGNAL';
  updateRhythmStats();

  const ctx = ensureAudio();
  if (ctx?.state === 'suspended') ctx.resume();

  scheduleBeat();
  rhythmScheduler = window.setInterval(scheduleBeat, 500);
  rhythmClock = window.setInterval(() => {
    rhythmTimeValue -= 1;
    updateRhythmStats();
    if (rhythmTimeValue <= 0) stopRhythm();
  }, 1000);
  rhythmAnimation = requestAnimationFrame(animateRhythm);
}

rhythmStart.addEventListener('click', startRhythm);
laneButtons.forEach((button, index) => button.addEventListener('click', () => hitLane(index)));

document.addEventListener('keydown', event => {
  const index = laneKeys.indexOf(event.key.toLowerCase());
  if (index === -1) return;
  const activePanel = document.querySelector('.game-panel.active');
  if (activePanel?.dataset.panel !== 'rhythm') return;
  if (event.repeat) return;
  hitLane(index);
});

updateRhythmStats();
activateGame('breach');
