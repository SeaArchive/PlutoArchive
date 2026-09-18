// Performance layer for the Ark canvas.
// Expensive starfield and ritual geometry are cached and only rebuilt when progress changes.

const PERF_RITUAL_SIZE = 384;
const PERF_RITUAL_HALF = PERF_RITUAL_SIZE / 2;
const PERF_RITUAL_STEPS = 60;

const perfSpaceCache = document.createElement('canvas');
perfSpaceCache.width = WORLD_W;
perfSpaceCache.height = WORLD_H;
const perfSpaceCtx = perfSpaceCache.getContext('2d', { alpha: false });

const perfRitualCache = document.createElement('canvas');
perfRitualCache.width = PERF_RITUAL_SIZE;
perfRitualCache.height = PERF_RITUAL_SIZE;
const perfRitualCtx = perfRitualCache.getContext('2d');

let perfRitualBucket = -1;

function perfBuildSpaceCache() {
  const c = perfSpaceCtx;
  c.fillStyle = '#010207';
  c.fillRect(0, 0, WORLD_W, WORLD_H);

  SPACE_NEBULAE.forEach(nebula => {
    const gradient = c.createRadialGradient(
      nebula.x, nebula.y, 0,
      nebula.x, nebula.y, nebula.radius
    );
    gradient.addColorStop(0, `rgba(${nebula.tone},.055)`);
    gradient.addColorStop(.48, `rgba(${nebula.tone},.022)`);
    gradient.addColorStop(1, `rgba(${nebula.tone},0)`);
    c.fillStyle = gradient;
    c.beginPath();
    c.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
    c.fill();
  });

  SPACE_STARS.forEach((star, index) => {
    const baseAlpha = .24 + star.depth * .46;
    const size = Math.max(1, Math.round(star.size * (.7 + star.depth * .4)));
    c.fillStyle = index % 13 === 0
      ? `rgba(196,211,255,${baseAlpha})`
      : `rgba(222,236,255,${baseAlpha})`;
    c.fillRect(Math.round(star.x), Math.round(star.y), size, size);
  });
}

perfBuildSpaceCache();

drawFloor = function drawFloorCached(time) {
  const sx = Math.max(0, Math.floor(camera.x));
  const sy = Math.max(0, Math.floor(camera.y));
  const sw = Math.min(Math.ceil(camera.w) + 2, WORLD_W - sx);
  const sh = Math.min(Math.ceil(camera.h) + 2, WORLD_H - sy);

  // Copy only the visible part of the cached world instead of the entire 1920x1152 image.
  ctx.drawImage(
    perfSpaceCache,
    sx, sy, sw, sh,
    sx, sy, sw, sh
  );

  // Only a few visible stars receive live twinkle animation.
  for (let index = 0; index < SPACE_STARS.length; index += 29) {
    const star = SPACE_STARS[index];
    if (
      star.x < camera.x - 8 ||
      star.x > camera.x + camera.w + 8 ||
      star.y < camera.y - 8 ||
      star.y > camera.y + camera.h + 8
    ) continue;

    const twinkle = .35 + .65 * Math.sin(time * .002 + star.phase) ** 2;
    const size = star.size > 1.55 ? 2 : 1;
    ctx.fillStyle = `rgba(238,245,255,${.18 + twinkle * .55})`;
    ctx.fillRect(Math.round(star.x), Math.round(star.y), size, size);
  }
};

function perfEase(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function perfPolygon(c, sides, radius, rotation, alpha) {
  c.beginPath();
  for (let i = 0; i <= sides; i += 1) {
    const angle = rotation + Math.PI * 2 * i / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.strokeStyle = `rgba(173,157,235,${alpha})`;
  c.lineWidth = 1;
  c.stroke();
}

function perfRebuildRitual(progress) {
  const bucket = Math.round(clamp(progress, 0, 1) * PERF_RITUAL_STEPS);
  if (bucket === perfRitualBucket) return;
  perfRitualBucket = bucket;

  const p = bucket / PERF_RITUAL_STEPS;
  const c = perfRitualCtx;
  c.clearRect(0, 0, PERF_RITUAL_SIZE, PERF_RITUAL_SIZE);
  if (p <= 0) return;

  c.save();
  c.translate(PERF_RITUAL_HALF, PERF_RITUAL_HALF);
  c.globalCompositeOperation = 'lighter';

  const starProgress = perfEase(clamp((p - .02) / .42, 0, 1));
  const lineProgress = perfEase(clamp((p - .14) / .42, 0, 1));
  const runeProgress = perfEase(clamp((p - .34) / .46, 0, 1));
  const circleProgress = perfEase(clamp((p - .46) / .54, 0, 1));

  if (circleProgress > 0) {
    const halo = c.createRadialGradient(0, 0, 8, 0, 0, 154);
    halo.addColorStop(0, `rgba(157,132,238,${.03 + circleProgress * .07})`);
    halo.addColorStop(.55, `rgba(92,120,185,${circleProgress * .025})`);
    halo.addColorStop(1, 'rgba(90,70,170,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(0, 0, 154, 0, Math.PI * 2);
    c.fill();

    const ringData = [
      [122, 24, .60],
      [114, 18, .48],
      [103, 28, .42],
      [90, 14, .38]
    ];

    ringData.forEach(([radius, segments, alpha], ringIndex) => {
      const reveal = clamp(circleProgress * (1.15 + ringIndex * .08) - ringIndex * .09, 0, 1);
      const visible = Math.floor(segments * reveal);
      const step = Math.PI * 2 / segments;
      for (let i = 0; i < visible; i += 1) {
        const start = -Math.PI / 2 + i * step + ringIndex * .08;
        c.beginPath();
        c.arc(0, 0, radius, start, start + step * .62);
        c.strokeStyle = `rgba(187,166,245,${.10 + alpha * circleProgress})`;
        c.lineWidth = ringIndex === 0 ? 1.2 : .8;
        c.stroke();
      }
    });

    const spokes = Math.floor(20 * circleProgress);
    for (let i = 0; i < spokes; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 20;
      c.beginPath();
      c.moveTo(Math.cos(angle) * 73, Math.sin(angle) * 73);
      c.lineTo(Math.cos(angle) * (i % 2 ? 109 : 120), Math.sin(angle) * (i % 2 ? 109 : 120));
      c.strokeStyle = `rgba(222,204,151,${.08 + circleProgress * .20})`;
      c.lineWidth = .8;
      c.stroke();
    }

    const geom = clamp((circleProgress - .18) / .82, 0, 1);
    if (geom > 0) {
      perfPolygon(c, 3, 73, -Math.PI / 2, .08 + geom * .25);
      perfPolygon(c, 3, 73, Math.PI / 2, .08 + geom * .25);
      if (geom > .28) perfPolygon(c, 6, 83, 0, .06 + geom * .22);
      if (geom > .55) perfPolygon(c, 8, 62, Math.PI / 8, .05 + geom * .20);
    }
  }

  const visibleStars = Math.ceil(ARCANE_STARS.length * starProgress);
  for (let i = 0; i < visibleStars; i += 1) {
    const [x, y] = ARCANE_STARS[i];
    const size = i % 8 === 0 ? 2.25 : i % 3 === 0 ? 1.55 : 1.15;
    c.fillStyle = i % 2
      ? 'rgba(203,226,255,.76)'
      : 'rgba(222,211,255,.74)';
    c.beginPath();
    c.arc(x, y, size, 0, Math.PI * 2);
    c.fill();
  }

  const totalLines = ARCANE_EDGES.length * lineProgress;
  ARCANE_EDGES.forEach(([a, b], index) => {
    const amount = clamp(totalLines - index, 0, 1);
    if (amount <= 0) return;
    const [ax, ay] = ARCANE_STARS[a];
    const [bx, by] = ARCANE_STARS[b];
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(ax + (bx - ax) * amount, ay + (by - ay) * amount);
    c.strokeStyle = `rgba(128,177,240,${.06 + lineProgress * .18})`;
    c.lineWidth = index % 7 === 0 ? 1 : .65;
    c.stroke();
  });

  const runeCount = Math.floor(ARCANE_RUNES.length * runeProgress);
  c.font = '13px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let i = 0; i < runeCount; i += 1) {
    const angle = -Math.PI / 2 + Math.PI * 2 * i / ARCANE_RUNES.length;
    const x = Math.cos(angle) * 108;
    const y = Math.sin(angle) * 108;
    c.save();
    c.translate(x, y);
    c.rotate(angle + Math.PI / 2);
    c.fillStyle = `rgba(232,216,166,${.28 + runeProgress * .46})`;
    c.fillText(ARCANE_RUNES[i], 0, 0);
    c.restore();
  }

  c.restore();
}

function perfDrawOuterConstellations(progress) {
  RITUAL_CONSTELLATIONS.forEach(group => {
    const local = clamp((progress - group.start) / .22, 0, 1);
    if (local <= 0) return;

    // Do not render constellations well outside the current camera viewport.
    if (
      group.x < camera.x - 120 ||
      group.x > camera.x + camera.w + 120 ||
      group.y < camera.y - 120 ||
      group.y > camera.y + camera.h + 120
    ) return;

    const starReveal = perfEase(clamp(local / .68, 0, 1));
    const lineReveal = perfEase(clamp((local - .28) / .72, 0, 1));
    const starCount = Math.max(1, Math.ceil(group.points.length * starReveal));
    const lineCount = group.edges.length * lineReveal;

    ctx.save();
    ctx.translate(group.x, group.y);
    ctx.rotate(group.rotation);
    ctx.scale(group.scale, group.scale);

    group.edges.forEach(([a, b], index) => {
      const amount = clamp(lineCount - index, 0, 1);
      if (amount <= 0) return;
      const [ax, ay] = group.points[a];
      const [bx, by] = group.points[b];
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + (bx - ax) * amount, ay + (by - ay) * amount);
      ctx.strokeStyle = `rgba(137,178,228,${.07 + lineReveal * .19})`;
      ctx.lineWidth = .8;
      ctx.stroke();
    });

    for (let i = 0; i < starCount; i += 1) {
      const [x, y] = group.points[i];
      const size = i === 0 || i === Math.floor(group.points.length / 2) ? 2 : 1.2;
      ctx.fillStyle = 'rgba(225,239,255,.78)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

drawRitual = function drawRitualCached(time) {
  const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
  if (progress <= 0) {
    perfRitualBucket = -1;
    return;
  }

  perfDrawOuterConstellations(progress);
  perfRebuildRitual(progress);

  ctx.drawImage(
    perfRitualCache,
    score.x - PERF_RITUAL_HALF,
    score.y - PERF_RITUAL_HALF
  );

  // Keep only a few cheap moving accents on top of the cached geometry.
  ctx.save();
  ctx.translate(score.x, score.y);
  ctx.globalCompositeOperation = 'lighter';

  const pulse = .5 + .5 * Math.sin(time * .0032);
  if (progress > .5) {
    ctx.strokeStyle = `rgba(198,179,255,${.08 + progress * .13 + pulse * .05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 126, time * .00012, time * .00012 + Math.PI * 1.4);
    ctx.stroke();

    for (let i = 0; i < 6; i += 1) {
      const angle = time * .00022 + i * Math.PI * 2 / 6;
      const radius = 134 + Math.sin(time * .0015 + i) * 5;
      ctx.fillStyle = `rgba(226,235,255,${.20 + pulse * .30})`;
      ctx.fillRect(Math.cos(angle) * radius, Math.sin(angle) * radius, 1.5, 1.5);
    }
  }

  if (ritualComplete) {
    const flashAge = (performance.now() - ritualCompletedAt) / 1000;
    const flash = flashAge < 1.6 ? 1 - flashAge / 1.6 : 0;
    ctx.strokeStyle = `rgba(255,240,198,${.44 + pulse * .26})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, 124, 0, Math.PI * 2);
    ctx.stroke();

    if (flash > 0) {
      const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 170);
      glow.addColorStop(0, `rgba(255,246,218,${flash * .25})`);
      glow.addColorStop(1, 'rgba(160,130,240,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 170, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

// Room constellations remain animated, but avoid per-star shadowBlur and radial gradients.
if (typeof drawConstellationRoom === 'function') {
  drawConstellationRoom = function drawConstellationRoomOptimized(room, time) {
    const dist = Math.hypot(player.x - room.x, player.y - room.y);
    const proximity = clamp(1 - dist / 220, 0, 1);
    const pulse = .5 + .5 * Math.sin(time * .0028 + room.x * .002);
    const lineAlpha = .10 + proximity * .25 + pulse * .04;
    const starAlpha = .32 + proximity * .42 + pulse * .10;

    ctx.save();
    ctx.translate(room.x, room.y);
    ctx.rotate(room.rotation);
    ctx.globalCompositeOperation = 'lighter';

    room.edges.forEach(([a, b]) => {
      const [ax, ay] = room.points[a];
      const [bx, by] = room.points[b];
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = `rgba(145,190,235,${lineAlpha})`;
      ctx.lineWidth = .8 + proximity * .35;
      ctx.stroke();
    });

    room.points.forEach(([x, y], index) => {
      const twinkle = .55 + .45 * Math.sin(time * .003 + index * 1.7) ** 2;
      const size = index % 4 === 0 ? 2 : 1.2;
      ctx.fillStyle = `rgba(226,242,255,${starAlpha * (.76 + twinkle * .24)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
    ctx.rotate(-room.rotation);
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(166,199,226,${.44 + proximity * .44})`;
    ctx.fillText(`${room.id} · ${room.name}`, 0, 78);
    ctx.restore();
  };
}


function perfInView(x, y, pad = 110) {
  return !(
    x < camera.x - pad ||
    x > camera.x + camera.w + pad ||
    y < camera.y - pad ||
    y > camera.y + camera.h + pad
  );
}

const PERF_RELIC_CONSTELLATIONS = {
  globe: {
    points: [[0,-30],[21,-20],[30,0],[20,22],[0,31],[-21,21],[-30,0],[-20,-21],[0,0]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[2,8],[4,8],[6,8]]
  },
  bell: {
    points: [[0,-30],[-18,-12],[-24,12],[-12,22],[0,27],[12,22],[24,12],[18,-12],[0,7]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[8,4]]
  },
  crystal: {
    points: [[0,-34],[20,-8],[13,27],[0,36],[-14,27],[-21,-8],[0,3]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[2,6],[4,6]]
  },
  reliquary: {
    points: [[-27,-18],[27,-18],[30,19],[-30,19],[-12,-3],[12,-3],[0,13],[0,-27]],
    edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,4],[7,0],[7,1]]
  },
  clock: {
    // Simplified Horologium: an elongated chain rather than a clock face.
    points: [[-36,-27],[-19,-11],[-6,8],[12,29],[31,16],[23,-7],[6,-26]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]
  }
};

function perfDrawRelicConstellation(object, time) {
  const shape = PERF_RELIC_CONSTELLATIONS[object.kind];
  if (!shape) return;

  const dist = Math.hypot(player.x - object.x, player.y - object.y);
  const proximity = clamp(1 - dist / 190, 0, 1);
  const pulse = .5 + .5 * Math.sin(time * .0024 + object.x * .0017);
  const bellAge = object.kind === 'bell'
    ? (performance.now() - arkObjectState.bellPulseStart) / 1000
    : 99;

  let activeBoost = 0;
  if (object.kind === 'globe' && arkObjectState.starChartOn) activeBoost = .16;
  if (object.kind === 'crystal' && arkObjectState.crystalAwake) activeBoost = .20;
  if (object.kind === 'reliquary' && ritualComplete) activeBoost = .16;
  if (object.kind === 'reliquary' && arkObjectState.reliquaryOpen) activeBoost = .12;
  if (object.kind === 'clock') activeBoost = .08;
  if (object.kind === 'bell' && bellAge < 3.2) activeBoost = .18;

  const lineAlpha = .10 + proximity * .28 + pulse * .035 + activeBoost;
  const starAlpha = .34 + proximity * .40 + pulse * .10 + activeBoost;

  ctx.save();
  ctx.translate(object.x, object.y);

  ctx.globalCompositeOperation = 'lighter';

  shape.edges.forEach(([a, b]) => {
    const [ax, ay] = shape.points[a];
    const [bx, by] = shape.points[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = object.kind === 'reliquary' && ritualComplete
      ? `rgba(190,163,255,${lineAlpha})`
      : `rgba(145,190,235,${lineAlpha})`;
    ctx.lineWidth = .75 + proximity * .32;
    ctx.stroke();
  });

  shape.points.forEach(([x, y], index) => {
    const twinkle = .58 + .42 * Math.sin(time * .0028 + index * 1.71 + object.y * .002) ** 2;
    const size = index % 4 === 0 ? 2 : 1.15;
    ctx.fillStyle = object.kind === 'reliquary' && ritualComplete
      ? `rgba(232,218,255,${starAlpha * (.78 + twinkle * .22)})`
      : `rgba(226,242,255,${starAlpha * (.78 + twinkle * .22)})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  });

  if (object.kind === 'bell' && bellAge >= 0 && bellAge < 3.2) {
    for (let i = 0; i < 3; i += 1) {
      const p = clamp((bellAge - i * .38) / 1.8, 0, 1);
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = `rgba(194,216,255,${(1 - p) * .16})`;
      ctx.lineWidth = .7;
      ctx.beginPath();
      ctx.arc(0, 0, 32 + p * 68, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(148,184,214,${.42 + proximity * .42})`;
  ctx.fillText(object.title, 0, 55);
  ctx.restore();
}

// Draw only the objects close enough to matter for the current camera.
drawWorldInteractables = function drawWorldInteractablesOptimized(time) {
  ARK_ROOMS.forEach(room => {
    if (perfInView(room.x, room.y, 120)) drawConstellationRoom(room, time);
  });

  ARK_OBJECTS.forEach(object => {
    if (perfInView(object.x, object.y, 105)) {
      perfDrawRelicConstellation(object, time);
    }
  });
};

// Restrict lighting fills to the visible camera rectangle.
drawLighting = function drawLightingOptimized() {
  const left = camera.x - 2;
  const top = camera.y - 2;
  const width = camera.w + 4;
  const height = camera.h + 4;

  // Clear visibility around the player, then transition into a dense dark-space fog.
  const clearRadius = 155;
  const softRadius = 255;
  const fogRadius = 390;
  const fog = ctx.createRadialGradient(
    player.x, player.y, clearRadius,
    player.x, player.y, fogRadius
  );
  fog.addColorStop(0, 'rgba(1,3,9,0)');
  fog.addColorStop(.34, 'rgba(1,3,9,.08)');
  fog.addColorStop(.62, 'rgba(1,3,9,.38)');
  fog.addColorStop(.82, 'rgba(1,3,9,.66)');
  fog.addColorStop(1, 'rgba(0,1,5,.82)');

  ctx.fillStyle = fog;
  ctx.fillRect(left, top, width, height);

  // A second cheap veil deepens the far corners without blurring the clear center.
  const veil = ctx.createRadialGradient(
    player.x, player.y, softRadius,
    player.x, player.y, Math.max(camera.w, camera.h) * .82
  );
  veil.addColorStop(0, 'rgba(2,4,10,0)');
  veil.addColorStop(1, 'rgba(0,1,4,.22)');
  ctx.fillStyle = veil;
  ctx.fillRect(left, top, width, height);

  // Pluto may still leak a subtle glow through the fog when nearby.
  if (perfInView(score.x, score.y, 220)) {
    const scoreGlow = ctx.createRadialGradient(
      score.x, score.y, 18,
      score.x, score.y, ritualComplete ? 180 : 140
    );
    scoreGlow.addColorStop(0, ritualComplete ? 'rgba(178,153,255,.085)' : 'rgba(115,145,205,.045)');
    scoreGlow.addColorStop(1, 'rgba(80,100,160,0)');
    ctx.fillStyle = scoreGlow;
    ctx.fillRect(
      Math.max(left, score.x - 200),
      Math.max(top, score.y - 200),
      400,
      400
    );
  }
};
