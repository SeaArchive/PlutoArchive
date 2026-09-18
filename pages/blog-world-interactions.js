const ARK_OBJECTS = [
  {
    id: 'terminal',
    kind: 'terminal',
    x: 10 * TILE,
    y: 7 * TILE,
    radius: 58,
    prompt: 'ACCESS ARCHIVE TERMINAL',
    tag: 'ARK NODE / TERMINAL-01',
    title: 'ARCHIVE TERMINAL',
    body: '낡은 방주 단말기다. R-01부터 R-08까지의 구획 신호를 읽고 있지만 대부분은 아직 비어 있다.'
  },
  {
    id: 'globe',
    kind: 'globe',
    x: 30 * TILE,
    y: 6 * TILE,
    radius: 62,
    prompt: 'ROTATE CELESTIAL GLOBE',
    tag: 'NAVIGATION DEVICE / CELESTIAL INDEX',
    title: 'CELESTIAL GLOBE',
    body: '방주가 관측해 온 별의 위치를 겹쳐 보는 장치다. 한 번 더 작동시키면 투영을 끌 수 있다.'
  },
  {
    id: 'window',
    kind: 'window',
    x: 50 * TILE,
    y: 7 * TILE,
    radius: 60,
    prompt: 'LOOK THROUGH OBSERVATION LENS',
    tag: 'OUTER HULL / OBSERVATION LENS',
    title: 'OBSERVATION LENS',
    body: '검은 외부 공간 위로 아주 느리게 이동하는 별빛만 보인다. 방주의 현재 위치를 특정할 수 있는 표식은 없다.'
  },
  {
    id: 'bell',
    kind: 'bell',
    x: 8 * TILE,
    y: 19 * TILE,
    radius: 62,
    prompt: 'RING RESONANCE BELL',
    tag: 'RESONANCE DEVICE / BELL-02',
    title: 'RESONANCE BELL',
    body: '소리는 거의 들리지 않지만 바닥과 벽에서 잔잔한 파동이 퍼진다. 중앙 악보의 빛도 아주 잠깐 흔들린다.'
  },
  {
    id: 'crystal',
    kind: 'crystal',
    x: 52 * TILE,
    y: 19 * TILE,
    radius: 62,
    prompt: 'TOUCH MEMORY CRYSTAL',
    tag: 'MEMORY STORAGE / FRAGMENT',
    title: 'MEMORY CRYSTAL',
    body: '손을 대면 내부에 작은 별가루가 떠오른다. 아직 해독되지 않은 기록 조각이 잠들어 있는 것 같다.'
  },
  {
    id: 'reliquary',
    kind: 'reliquary',
    x: 49 * TILE,
    y: 29 * TILE,
    radius: 68,
    prompt: 'EXAMINE SEALED RELIQUARY',
    tag: 'SEALED OBJECT / RELIQUARY',
    title: 'SEALED RELIQUARY',
    body: '마법진과 같은 계통의 룬이 새겨진 봉인함이다. 중앙 공명이 완성되기 전에는 열리지 않는다.'
  },
  {
    id: 'clock',
    kind: 'clock',
    x: 22 * TILE,
    y: 31 * TILE,
    radius: 62,
    prompt: 'TURN BROKEN CHRONOMETER',
    tag: 'ARK DEVICE / CHRONOMETER',
    title: 'BROKEN CHRONOMETER',
    body: '시곗바늘이 일정한 시간을 가리키지 않는다. 작동시킬 때마다 진행 방향만 바뀐다.'
  }
];

const arkObjectState = {
  starChartOn: false,
  crystalAwake: false,
  reliquaryOpen: false,
  clockReversed: false,
  bellPulseStart: -99999,
  windowSeen: false,
  terminalVisits: 0
};

const loreTagNode = loreModal.querySelector('.tag');
const loreBodyNode = loreModal.querySelector('p');

function getNearestArkInteraction() {
  const candidates = [];

  const exitDist = Math.hypot(player.x - exitDoor.x, player.y - exitDoor.y);
  if (exitDist < exitDoor.radius) {
    candidates.push({ type: 'exit', dist: exitDist, radius: exitDoor.radius, prompt: 'RETURN TO MAIN ARCHIVE' });
  }

  const scoreDist = Math.hypot(player.x - score.x, player.y - score.y);
  if (scoreDist < 66) {
    candidates.push({ type: 'score', dist: scoreDist, radius: 66, prompt: ritualComplete ? 'OPEN THE HIDDEN PAGE' : 'EXAMINE THE LULLABY SCORE' });
  }

  ARK_OBJECTS.forEach(object => {
    const dist = Math.hypot(player.x - object.x, player.y - object.y);
    if (dist < object.radius) {
      candidates.push({ type: 'object', dist, radius: object.radius, object, prompt: object.prompt });
    }
  });

  candidates.sort((a, b) => (a.dist / a.radius) - (b.dist / b.radius));
  return candidates[0] || null;
}

openLore = function openArkLore(data = null) {
  const content = data || {
    tag: 'CENTRAL OBJECT / LULLABY SCORE',
    title: '14TH LULLABY',
    body: '방주의 중심에 남아 있는 악보. 이 오브젝트에 가까워질수록 공간 전체에 흐르는 자장가가 더 크게 들립니다. 오래 머무르면 중앙 원이 다른 신호에 반응하는 것처럼 보입니다.'
  };

  loreTagNode.textContent = content.tag;
  document.getElementById('loreTitle').textContent = content.title;
  loreBodyNode.textContent = content.body;

  modalOpen = true;
  keys.clear();
  loreModal.classList.add('open');
  loreClose.focus();
};

function openObjectLore(object) {
  if (object.id === 'terminal') {
    arkObjectState.terminalVisits += 1;
    openLore({
      tag: object.tag,
      title: object.title,
      body: `NODE SCAN #${String(arkObjectState.terminalVisits).padStart(2, '0')} · R-01 / R-02 / R-03 신호 안정. R-04 / R-05 미응답. R-06 / R-07 / R-08은 기록 슬롯만 존재한다.`
    });
    return;
  }

  if (object.id === 'globe') {
    arkObjectState.starChartOn = !arkObjectState.starChartOn;
    openLore({
      tag: object.tag,
      title: object.title,
      body: arkObjectState.starChartOn
        ? '천구 투영이 켜졌다. 장치 주변을 도는 별 궤도와 방향선이 희미하게 나타난다.'
        : '천구 투영이 꺼졌다. 표면에 새겨진 좌표선만 남는다.'
    });
    return;
  }

  if (object.id === 'window') {
    arkObjectState.windowSeen = true;
    openLore({
      tag: object.tag,
      title: object.title,
      body: '검은 외부 공간을 오래 바라보면 아주 먼 별들이 서로 다른 속도로 흘러간다. 방주 자체가 이동 중인 것처럼 보인다.'
    });
    return;
  }

  if (object.id === 'bell') {
    arkObjectState.bellPulseStart = performance.now();
    openLore({
      tag: object.tag,
      title: object.title,
      body: '종을 울렸다. 들리는 소리보다 먼저 바닥의 빛이 퍼져 나간다. 파동은 몇 초 동안 방 전체를 훑고 사라진다.'
    });
    return;
  }

  if (object.id === 'crystal') {
    arkObjectState.crystalAwake = !arkObjectState.crystalAwake;
    openLore({
      tag: object.tag,
      title: object.title,
      body: arkObjectState.crystalAwake
        ? '수정 내부의 기억 입자가 깨어났다. 희미한 문장 조각과 별빛이 반복해서 떠오른다.'
        : '수정의 빛이 가라앉았다. 기억 조각도 다시 깊은 곳으로 잠긴다.'
    });
    return;
  }

  if (object.id === 'reliquary') {
    if (!ritualComplete) {
      openLore({
        tag: object.tag,
        title: object.title,
        body: '봉인은 반응하지만 열리지 않는다. 중앙 마법진을 완전히 결속해야 잠금이 해제될 것 같다.'
      });
      return;
    }

    arkObjectState.reliquaryOpen = true;
    openLore({
      tag: 'UNSEALED OBJECT / RELIQUARY',
      title: 'RELIQUARY OPENED',
      body: '봉인이 풀렸다. 안에는 물질이 아니라 오래된 좌표 문자열과 손으로 적은 듯한 기록 파편이 빛으로 남아 있다.'
    });
    return;
  }

  if (object.id === 'clock') {
    arkObjectState.clockReversed = !arkObjectState.clockReversed;
    openLore({
      tag: object.tag,
      title: object.title,
      body: arkObjectState.clockReversed
        ? '바늘이 역방향으로 돌기 시작했다. 방 안의 실제 시간은 변하지 않지만 장치 주변의 작은 먼지 입자가 반대로 흐른다.'
        : '바늘이 다시 정방향으로 움직인다. 어느 쪽도 현재 시각과는 일치하지 않는다.'
    });
    return;
  }

  openLore(object);
}

updateAudio = function updateArkAudio(dt) {
  const dist = Math.hypot(player.x - score.x, player.y - score.y);
  const maxDistance = 520;
  const proximity = Math.max(0, 1 - dist / maxDistance);

  const minVolume = 0.012;
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

  const nearby = getNearestArkInteraction();
  const show = Boolean(nearby) && !modalOpen;

  interaction.classList.toggle('visible', show);
  interaction.classList.toggle('unlocked', nearby?.type === 'score' && ritualComplete);
  interaction.classList.toggle('exit-door', nearby?.type === 'exit');
  interaction.classList.toggle('world-object', nearby?.type === 'object');

  interaction.textContent = show ? `E  /  ${nearby.prompt}` : '';
};

interactCenter = function interactWithArk() {
  if (modalOpen) return;

  const nearby = getNearestArkInteraction();
  if (!nearby) return;

  if (nearby.type === 'exit') {
    keys.clear();
    window.location.href = '../index.html';
    return;
  }

  if (nearby.type === 'score') {
    if (ritualComplete) {
      sessionStorage.setItem('plutoArkHiddenUnlocked', '1');
      window.location.href = 'hidden.html';
      return;
    }

    openLore();
    return;
  }

  if (nearby.type === 'object') {
    openObjectLore(nearby.object);
  }
};

function drawTerminal(object, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.004);
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.fillStyle = '#0b141a';
  ctx.fillRect(-24, -18, 48, 36);
  ctx.strokeStyle = 'rgba(73,214,255,.34)';
  ctx.strokeRect(-24.5, -18.5, 49, 37);
  ctx.fillStyle = `rgba(73,214,255,${0.20 + pulse * 0.28})`;
  ctx.fillRect(-15, -9, 30, 13);
  ctx.fillStyle = '#1d3038';
  ctx.fillRect(-18, 11, 36, 4);
  ctx.restore();
}

function drawGlobe(object, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.0025);
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.strokeStyle = `rgba(140,192,255,${0.34 + pulse * 0.25})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 7, time * 0.0004, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 21, -time * 0.00035, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#101820';
  ctx.fillRect(-3, 20, 6, 18);
  ctx.fillRect(-16, 36, 32, 4);

  if (arkObjectState.starChartOn) {
    ctx.globalCompositeOperation = 'lighter';
    [32, 42, 54].forEach((radius, index) => {
      ctx.strokeStyle = `rgba(120,162,244,${0.10 + index * 0.05})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, time * 0.0002 * (index + 1), time * 0.0002 * (index + 1) + Math.PI * 1.35);
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawWindow(object, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.0018);
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.fillStyle = '#03070d';
  ctx.fillRect(-28, -28, 56, 56);
  ctx.strokeStyle = 'rgba(120,158,198,.30)';
  ctx.strokeRect(-28.5, -28.5, 57, 57);
  for (let i = 0; i < 9; i += 1) {
    const x = -22 + ((i * 17) % 43);
    const y = -20 + ((i * 29) % 41);
    const tw = 0.25 + 0.75 * Math.sin(time * 0.002 + i * 1.7) ** 2;
    ctx.fillStyle = `rgba(220,238,255,${0.28 + tw * 0.55})`;
    ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
  }
  ctx.strokeStyle = `rgba(73,214,255,${0.08 + pulse * 0.10})`;
  ctx.beginPath();
  ctx.moveTo(0, -28); ctx.lineTo(0, 28);
  ctx.moveTo(-28, 0); ctx.lineTo(28, 0);
  ctx.stroke();
  ctx.restore();
}

function drawBell(object, time) {
  const age = (performance.now() - arkObjectState.bellPulseStart) / 1000;
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.fillStyle = '#8d8159';
  ctx.beginPath();
  ctx.moveTo(-14, 12);
  ctx.quadraticCurveTo(-10, -18, 0, -22);
  ctx.quadraticCurveTo(10, -18, 14, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-18, 12, 36, 4);
  ctx.fillStyle = '#d7c88a';
  ctx.fillRect(-2, 16, 4, 5);

  if (age >= 0 && age < 4) {
    for (let i = 0; i < 4; i += 1) {
      const p = clamp((age - i * 0.45) / 2.2, 0, 1);
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = `rgba(215,200,138,${(1 - p) * 0.30})`;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + p * 95, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCrystal(object, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.0047);
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = arkObjectState.crystalAwake ? 'rgba(181,153,255,.95)' : 'rgba(90,130,180,.65)';
  ctx.shadowBlur = arkObjectState.crystalAwake ? 18 + pulse * 9 : 7;
  ctx.fillStyle = arkObjectState.crystalAwake
    ? `rgba(190,167,255,${0.52 + pulse * 0.24})`
    : 'rgba(110,145,180,.48)';
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(17, -4);
  ctx.lineTo(9, 26);
  ctx.lineTo(-10, 26);
  ctx.lineTo(-18, -4);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#15202a';
  ctx.fillRect(-18, 27, 36, 5);
  ctx.restore();
}

function drawReliquary(object, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.003);
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.fillStyle = arkObjectState.reliquaryOpen ? '#2c2733' : '#17151b';
  ctx.fillRect(-28, -15, 56, 31);
  ctx.strokeStyle = ritualComplete
    ? `rgba(190,163,255,${0.30 + pulse * 0.35})`
    : 'rgba(120,105,135,.30)';
  ctx.strokeRect(-28.5, -15.5, 57, 32);
  ctx.fillStyle = ritualComplete ? '#b49ad8' : '#655c6c';
  ctx.fillRect(-3, -4, 6, 10);
  if (arkObjectState.reliquaryOpen) {
    ctx.strokeStyle = 'rgba(215,200,138,.45)';
    ctx.beginPath();
    ctx.moveTo(-28, -15);
    ctx.lineTo(-22, -29);
    ctx.lineTo(22, -29);
    ctx.lineTo(28, -15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawClock(object, time) {
  const direction = arkObjectState.clockReversed ? -1 : 1;
  const angle = time * 0.0006 * direction;
  ctx.save();
  ctx.translate(object.x, object.y);
  ctx.fillStyle = '#10161b';
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,203,210,.35)';
  ctx.stroke();
  ctx.strokeStyle = 'rgba(215,200,138,.70)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(-angle * 0.37) * 9, Math.sin(-angle * 0.37) * 9);
  ctx.stroke();
  ctx.fillStyle = '#69778a';
  ctx.fillRect(-13, 26, 26, 4);
  ctx.restore();
}

function drawWorldInteractables(time) {
  ARK_OBJECTS.forEach(object => {
    if (object.kind === 'terminal') drawTerminal(object, time);
    else if (object.kind === 'globe') drawGlobe(object, time);
    else if (object.kind === 'window') drawWindow(object, time);
    else if (object.kind === 'bell') drawBell(object, time);
    else if (object.kind === 'crystal') drawCrystal(object, time);
    else if (object.kind === 'reliquary') drawReliquary(object, time);
    else if (object.kind === 'clock') drawClock(object, time);

    ctx.save();
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(102,132,150,.45)';
    ctx.fillText(object.title, object.x, object.y + 48);
    ctx.restore();
  });
}
