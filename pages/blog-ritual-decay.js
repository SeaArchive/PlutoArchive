const RITUAL_DECAY_MULTIPLIER = 0.75;

// The ritual boundary is the third visible circle drawn by blog.js (RITUAL_RADIUS).
// Resonance builds while the player remains inside it and unwinds in reverse outside it.
sessionStorage.removeItem('plutoArkHiddenUnlocked');

let ritualUiTextPercent = -1;
let ritualUiBarPercent = -1;
let ritualUiComplete = null;
let ritualUiDecaying = null;
let ritualUiStateText = '';

function updateRitualUi(progress, inside) {
  const textPercent = Math.round(progress * 100);
  const barPercent = Math.round(progress * 200) / 2;
  const decaying = !ritualComplete && !inside && progress > 0;

  if (textPercent !== ritualUiTextPercent) {
    ritualUiTextPercent = textPercent;
    ritualText.textContent = `${textPercent}%`;
  }

  // Half-percent visual steps are indistinguishable at this meter size, while
  // avoiding a style/layout invalidation on every animation frame.
  if (barPercent !== ritualUiBarPercent) {
    ritualUiBarPercent = barPercent;
    ritualBar.style.width = `${barPercent}%`;
  }

  if (ritualComplete !== ritualUiComplete) {
    ritualUiComplete = ritualComplete;
    ritualCard.classList.toggle('complete', ritualComplete);
  }

  if (decaying !== ritualUiDecaying) {
    ritualUiDecaying = decaying;
    ritualCard.classList.toggle('decaying', decaying);
  }

  let nextState;
  if (ritualComplete) {
    nextState = '마법진이 완전히 결속되어 유지됩니다. 중앙을 벗어나도 더 이상 역순으로 해체되지 않습니다.';
  } else if (!inside && progress <= 0) {
    nextState = '세 번째 원 안에 머무르면 어두운 구역에서 별자리가 하나씩 깨어납니다.';
  } else if (!inside) {
    nextState = `공명이 역순으로 풀리고 있습니다. ${textPercent}% · 완성 전에는 다시 원 안으로 들어가야 유지됩니다.`;
  } else if (progress < 0.18) {
    nextState = '카시오페이아와 거문고자리의 별빛이 어둠 속에서 점등되고 있습니다.';
  } else if (progress < 0.38) {
    nextState = '백조자리와 오리온자리가 이어지며 중앙의 별망과 공명합니다.';
  } else if (progress < 0.58) {
    nextState = '큰곰자리와 전갈자리가 드러나고 룬 고리의 첫 문자가 깨어납니다.';
  } else if (progress < 0.78) {
    nextState = '쌍둥이자리와 안드로메다자리가 나타나며 다중 마법진이 겹쳐집니다.';
  } else {
    nextState = '별자리망, 룬, 고리가 하나의 마법진으로 결속되고 있습니다.';
  }

  if (nextState !== ritualUiStateText) {
    ritualUiStateText = nextState;
    ritualState.textContent = nextState;
  }
}

updateRitual = function updateRitualWithDecay(dt) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const inside = dist <= RITUAL_RADIUS;
  const wasComplete = ritualComplete;

  // Before completion, leaving the third circle still reverses the ritual.
  // Once 100% is reached, the completed state is permanently locked for this session.
  if (ritualComplete) {
    ritualTime = RITUAL_DURATION;
  } else if (inside && !modalOpen) {
    ritualTime = Math.min(RITUAL_DURATION, ritualTime + dt);
  } else if (ritualTime > 0) {
    ritualTime = Math.max(0, ritualTime - dt * RITUAL_DECAY_MULTIPLIER);
  }

  if (!ritualComplete && ritualTime >= RITUAL_DURATION) {
    ritualTime = RITUAL_DURATION;
    ritualComplete = true;
  }

  if (ritualComplete && !wasComplete) {
    ritualCompletedAt = performance.now();
    sessionStorage.setItem('plutoArkHiddenUnlocked', '1');
  }

  if (!ritualComplete && ritualTime <= 0) {
    ritualTime = 0;
    ritualCompletedAt = 0;
    sessionStorage.removeItem('plutoArkHiddenUnlocked');
  }

  const progress = ritualComplete
    ? 1
    : clamp(ritualTime / RITUAL_DURATION, 0, 1);

  updateRitualUi(progress, inside);
};
