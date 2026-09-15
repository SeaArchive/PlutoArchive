const RITUAL_DECAY_MULTIPLIER = 0.75;

// The ritual boundary is the third visible circle drawn by blog.js (RITUAL_RADIUS).
// Resonance builds while the player remains inside it and unwinds in reverse outside it.
sessionStorage.removeItem('plutoArkHiddenUnlocked');

updateRitual = function updateRitualWithDecay(dt) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const inside = dist <= RITUAL_RADIUS;
  const wasComplete = ritualComplete;

  if (inside) {
    ritualTime = Math.min(RITUAL_DURATION, ritualTime + dt);
  } else if (ritualTime > 0) {
    ritualTime = Math.max(0, ritualTime - dt * RITUAL_DECAY_MULTIPLIER);
  }

  ritualComplete = ritualTime >= RITUAL_DURATION;

  if (ritualComplete && !wasComplete) {
    ritualCompletedAt = performance.now();
    sessionStorage.setItem('plutoArkHiddenUnlocked', '1');
  } else if (!ritualComplete && wasComplete) {
    ritualCompletedAt = 0;
    sessionStorage.removeItem('plutoArkHiddenUnlocked');
  }

  if (ritualTime <= 0) {
    ritualTime = 0;
    ritualComplete = false;
    ritualCompletedAt = 0;
    sessionStorage.removeItem('plutoArkHiddenUnlocked');
  }

  const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
  ritualText.textContent = `${Math.round(progress * 100)}%`;
  ritualBar.style.width = `${progress * 100}%`;
  ritualCard.classList.toggle('complete', ritualComplete);
  ritualCard.classList.toggle('decaying', !inside && progress > 0);

  if (ritualComplete) {
    ritualState.textContent = '모든 별자리와 룬 고리가 결속되었습니다. 중앙의 책이 숨겨진 경로를 가리킵니다.';
  } else if (!inside && progress <= 0) {
    ritualState.textContent = '세 번째 원 안에 머무르면 어두운 구역에서 별자리가 하나씩 깨어납니다.';
  } else if (!inside) {
    ritualState.textContent = `공명이 역순으로 풀리고 있습니다. ${Math.round(progress * 100)}% · 다시 원 안으로 들어가면 현재 단계부터 재개됩니다.`;
  } else if (progress < 0.18) {
    ritualState.textContent = '카시오페이아와 거문고자리의 별빛이 어둠 속에서 점등되고 있습니다.';
  } else if (progress < 0.38) {
    ritualState.textContent = '백조자리와 오리온자리가 이어지며 중앙의 별망과 공명합니다.';
  } else if (progress < 0.58) {
    ritualState.textContent = '큰곰자리와 전갈자리가 드러나고 룬 고리의 첫 문자가 깨어납니다.';
  } else if (progress < 0.78) {
    ritualState.textContent = '쌍둥이자리와 안드로메다자리가 나타나며 다중 마법진이 겹쳐집니다.';
  } else {
    ritualState.textContent = '별자리망, 룬, 회전 고리가 하나의 마법진으로 결속되고 있습니다.';
  }
};
