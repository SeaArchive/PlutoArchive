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
    ritualState.textContent = '마법진이 완성되었습니다. 중앙의 책이 이전과 다른 경로를 가리킵니다.';
  } else if (!inside && progress <= 0) {
    ritualState.textContent = '세 번째 원 안에 머무르면 방주의 숨겨진 문양이 조금씩 반응합니다.';
  } else if (!inside) {
    ritualState.textContent = `공명이 역순으로 풀리고 있습니다. ${Math.round(progress * 100)}% · 다시 원 안으로 들어가면 현재 단계부터 재개됩니다.`;
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
};
