const RITUAL_CONSTELLATIONS = [
  {
    name: 'CASSIOPEIA', x: 155, y: 115, scale: 0.95, rotation: -0.08, start: 0.07,
    points: [[-38,8],[-20,-10],[0,7],[22,-11],[42,5]],
    edges: [[0,1],[1,2],[2,3],[3,4]]
  },
  {
    name: 'LYRA', x: 352, y: 92, scale: 0.8, rotation: 0.16, start: 0.15,
    points: [[-30,-24],[-4,-10],[16,-5],[20,18],[-7,22]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,1]]
  },
  {
    name: 'CYGNUS', x: 790, y: 112, scale: 0.9, rotation: -0.12, start: 0.23,
    points: [[-44,0],[-18,0],[8,0],[42,0],[8,-42],[8,38]],
    edges: [[0,1],[1,2],[2,3],[4,2],[2,5]]
  },
  {
    name: 'ORION', x: 140, y: 322, scale: 0.9, rotation: 0.04, start: 0.31,
    points: [[-28,-38],[28,-35],[-15,-3],[0,0],[15,-2],[-24,38],[25,40],[-2,-58]],
    edges: [[7,0],[7,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[5,6]]
  },
  {
    name: 'URSA MAJOR', x: 815, y: 310, scale: 0.92, rotation: 0.12, start: 0.40,
    points: [[-48,-12],[-27,-23],[-5,-16],[14,-3],[35,-8],[48,8],[34,25]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]]
  },
  {
    name: 'SCORPIUS', x: 164, y: 514, scale: 0.82, rotation: -0.16, start: 0.50,
    points: [[-42,-30],[-25,-18],[-9,-8],[5,4],[18,18],[28,34],[17,48],[3,43],[-9,31]],
    edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]]
  },
  {
    name: 'GEMINI', x: 790, y: 505, scale: 0.84, rotation: 0.08, start: 0.59,
    points: [[-24,-42],[-31,-18],[-34,8],[-42,34],[24,-40],[29,-15],[32,12],[40,36],[0,-3]],
    edges: [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[1,8],[5,8]]
  },
  {
    name: 'ANDROMEDA', x: 610, y: 535, scale: 0.88, rotation: -0.08, start: 0.69,
    points: [[-48,12],[-25,2],[0,-7],[22,-15],[46,-7],[17,8],[-8,20]],
    edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[2,6]]
  }
];

const ARCANE_STARS = [
  [-100,-22],[-88,-58],[-63,-89],[-30,-105],[5,-96],[41,-101],[76,-78],[101,-44],
  [106,-5],[98,34],[77,70],[43,94],[7,106],[-31,99],[-66,81],[-91,50],
  [-69,-18],[-52,-49],[-20,-62],[15,-57],[46,-43],[65,-12],[58,23],[38,52],
  [4,65],[-31,58],[-56,31],[-23,-14],[9,-24],[31,3],[12,26],[-18,21]
];

const ARCANE_EDGES = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,0],
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,16],
  [16,27],[18,28],[20,29],[22,30],[24,31],[26,27],[27,28],[28,29],[29,30],[30,31],[31,27],
  [0,16],[2,17],[4,19],[6,20],[8,22],[10,23],[12,25],[14,26]
];

const ARCANE_RUNES = [
  'ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ',
  'ᛇ','ᛈ','ᛉ','ᛋ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'
];

function ritualEase(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function drawConstellationGroup(group, time, progress, index) {
  const local = clamp((progress - group.start) / 0.22, 0, 1);
  if (local <= 0) return;

  const starReveal = ritualEase(clamp(local / 0.68, 0, 1));
  const lineReveal = ritualEase(clamp((local - 0.28) / 0.72, 0, 1));
  const visibleStars = Math.max(1, Math.ceil(group.points.length * starReveal));
  const totalLines = group.edges.length * lineReveal;

  ctx.save();
  ctx.translate(group.x, group.y);
  ctx.rotate(group.rotation);
  ctx.scale(group.scale, group.scale);
  ctx.globalCompositeOperation = 'lighter';

  const mist = ctx.createRadialGradient(0, 0, 0, 0, 0, 72);
  mist.addColorStop(0, `rgba(74,98,145,${0.015 + local * 0.035})`);
  mist.addColorStop(1, 'rgba(10,18,35,0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, 0, 72, 0, Math.PI * 2);
  ctx.fill();

  group.edges.forEach(([a, b], edgeIndex) => {
    const amount = clamp(totalLines - edgeIndex, 0, 1);
    if (amount <= 0) return;
    const [ax, ay] = group.points[a];
    const [bx, by] = group.points[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + (bx - ax) * amount, ay + (by - ay) * amount);
    ctx.strokeStyle = `rgba(135,174,230,${0.08 + lineReveal * 0.20})`;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  });

  for (let i = 0; i < visibleStars; i += 1) {
    const [x, y] = group.points[i];
    const twinkle = 0.48 + 0.52 * Math.sin(time * 0.0036 + i * 1.91 + index * 0.73) ** 2;
    const major = i === 0 || i === Math.floor(group.points.length / 2);
    const size = major ? 2.05 : 1.25 + (i % 3) * 0.22;
    ctx.shadowColor = 'rgba(150,190,255,.95)';
    ctx.shadowBlur = 5 + twinkle * 7;
    ctx.fillStyle = `rgba(226,239,255,${0.45 + twinkle * 0.50})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (major && local > 0.7) {
      ctx.strokeStyle = `rgba(220,236,255,${0.18 + twinkle * 0.22})`;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + 6, y);
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';

  if (local > 0.78) {
    ctx.rotate(-group.rotation);
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(120,150,190,${(local - 0.78) / 0.22 * 0.48})`;
    ctx.fillText(group.name, 0, 68);
  }

  ctx.restore();
}

function drawOuterConstellations(time, progress) {
  RITUAL_CONSTELLATIONS.forEach((group, index) => {
    drawConstellationGroup(group, time, progress, index);
  });
}

function drawSegmentedArc(radius, segments, reveal, rotation, alpha, width) {
  const visible = Math.floor(segments * clamp(reveal, 0, 1));
  if (visible <= 0) return;
  const step = Math.PI * 2 / segments;
  for (let i = 0; i < visible; i += 1) {
    const start = rotation + i * step;
    const end = start + step * 0.62;
    ctx.beginPath();
    ctx.arc(0, 0, radius, start, end);
    ctx.strokeStyle = `rgba(194,173,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function drawRuneRing(radius, reveal, time) {
  const count = Math.floor(ARCANE_RUNES.length * clamp(reveal, 0, 1));
  if (!count) return;

  ctx.font = '13px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / ARCANE_RUNES.length + Math.sin(time * 0.0002) * 0.025;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    const shimmer = 0.65 + 0.35 * Math.sin(time * 0.0025 + i * 0.8) ** 2;
    ctx.fillStyle = `rgba(236,218,164,${0.28 + shimmer * 0.48})`;
    ctx.shadowColor = 'rgba(225,203,139,.8)';
    ctx.shadowBlur = 4 + shimmer * 3;
    ctx.fillText(ARCANE_RUNES[i], 0, 0);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
}

function drawArcaneGeometry(time, progress) {
  const circleProgress = ritualEase(clamp((progress - 0.46) / 0.54, 0, 1));
  const runeProgress = ritualEase(clamp((progress - 0.34) / 0.46, 0, 1));
  if (circleProgress <= 0 && runeProgress <= 0) return;

  const slow = time * 0.00012;
  const reverse = -time * 0.00009;
  const pulse = 0.5 + Math.sin(time * 0.003) * 0.5;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const halo = ctx.createRadialGradient(0, 0, 18, 0, 0, 154);
  halo.addColorStop(0, `rgba(160,130,255,${0.025 + circleProgress * 0.085})`);
  halo.addColorStop(0.56, `rgba(80,114,180,${circleProgress * 0.035})`);
  halo.addColorStop(1, 'rgba(100,80,190,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 154, 0, Math.PI * 2);
  ctx.fill();

  drawSegmentedArc(122, 24, circleProgress, slow, 0.22 + circleProgress * 0.34, 1.3);
  drawSegmentedArc(115, 16, clamp(circleProgress * 1.12 - 0.08, 0, 1), reverse, 0.14 + circleProgress * 0.30, 1.0);
  drawSegmentedArc(102, 32, clamp(circleProgress * 1.25 - 0.20, 0, 1), slow * 1.3, 0.12 + circleProgress * 0.24, 0.8);
  drawSegmentedArc(89, 12, clamp(circleProgress * 1.4 - 0.35, 0, 1), reverse * 1.2, 0.14 + circleProgress * 0.26, 1.0);

  drawRuneRing(108, runeProgress, time);

  const spokeReveal = clamp((circleProgress - 0.1) / 0.9, 0, 1);
  const spokes = Math.floor(24 * spokeReveal);
  for (let i = 0; i < spokes; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 24;
    const inner = i % 2 === 0 ? 72 : 82;
    const outer = i % 3 === 0 ? 119 : 111;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.strokeStyle = `rgba(223,204,150,${0.08 + circleProgress * 0.24})`;
    ctx.lineWidth = i % 4 === 0 ? 1.1 : 0.7;
    ctx.stroke();
  }

  const geom = clamp((circleProgress - 0.2) / 0.8, 0, 1);
  if (geom > 0) {
    const shapes = [
      { sides: 3, radius: 73, rotation: -Math.PI / 2 + slow * 0.7 },
      { sides: 3, radius: 73, rotation: Math.PI / 2 - slow * 0.7 },
      { sides: 6, radius: 83, rotation: reverse * 0.5 },
      { sides: 8, radius: 62, rotation: Math.PI / 8 + slow * 0.4 }
    ];

    shapes.forEach((shape, index) => {
      const local = clamp(geom * 1.25 - index * 0.12, 0, 1);
      if (local <= 0) return;
      ctx.beginPath();
      for (let i = 0; i <= shape.sides; i += 1) {
        const angle = shape.rotation + Math.PI * 2 * i / shape.sides;
        const x = Math.cos(angle) * shape.radius;
        const y = Math.sin(angle) * shape.radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = index < 2
        ? `rgba(178,153,255,${0.10 + local * 0.30})`
        : `rgba(130,170,230,${0.08 + local * 0.24})`;
      ctx.lineWidth = index === 2 ? 1.15 : 0.85;
      ctx.stroke();
    });
  }

  const glyphReveal = clamp((circleProgress - 0.44) / 0.56, 0, 1);
  const glyphCount = Math.floor(8 * glyphReveal);
  for (let i = 0; i < glyphCount; i += 1) {
    const angle = i * Math.PI * 2 / 8 + reverse;
    const x = Math.cos(angle) * 53;
    const y = Math.sin(angle) * 53;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 4);
    ctx.strokeStyle = `rgba(236,222,177,${0.16 + glyphReveal * 0.34})`;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(-3.5, -3.5, 7, 7);
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();
  }

  const sparkCount = Math.floor(18 * circleProgress);
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = i * 2.399963 + time * (0.00018 + (i % 3) * 0.00004);
    const radius = 132 + Math.sin(time * 0.0015 + i) * 7;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const twinkle = 0.4 + 0.6 * Math.sin(time * 0.004 + i * 1.4) ** 2;
    ctx.fillStyle = `rgba(224,232,255,${0.18 + twinkle * 0.42})`;
    ctx.shadowColor = 'rgba(174,190,255,.9)';
    ctx.shadowBlur = 4 + twinkle * 5;
    ctx.fillRect(Math.round(x), Math.round(y), 1.5, 1.5);
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';

  if (circleProgress > 0.88) {
    ctx.strokeStyle = `rgba(255,238,190,${0.22 + pulse * 0.24})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 124, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawArcaneStars(time, progress) {
  const starProgress = ritualEase(clamp((progress - 0.02) / 0.44, 0, 1));
  const lineProgress = ritualEase(clamp((progress - 0.16) / 0.44, 0, 1));
  if (starProgress <= 0) return;

  const visibleStars = Math.max(1, Math.ceil(ARCANE_STARS.length * starProgress));
  const totalLines = ARCANE_EDGES.length * lineProgress;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ARCANE_EDGES.forEach(([a, b], index) => {
    const amount = clamp(totalLines - index, 0, 1);
    if (amount <= 0) return;
    const [ax, ay] = ARCANE_STARS[a];
    const [bx, by] = ARCANE_STARS[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + (bx - ax) * amount, ay + (by - ay) * amount);
    ctx.strokeStyle = `rgba(123,173,242,${0.055 + lineProgress * 0.20})`;
    ctx.lineWidth = index % 7 === 0 ? 1.05 : 0.72;
    ctx.stroke();
  });

  for (let i = 0; i < visibleStars; i += 1) {
    const [x, y] = ARCANE_STARS[i];
    const twinkle = 0.45 + 0.55 * Math.sin(time * 0.0042 + i * 1.37) ** 2;
    const size = i % 8 === 0 ? 2.4 : i % 3 === 0 ? 1.75 : 1.25;
    ctx.fillStyle = `rgba(236,243,255,${0.42 + twinkle * 0.50})`;
    ctx.shadowColor = i % 2 ? 'rgba(142,190,255,.95)' : 'rgba(198,175,255,.95)';
    ctx.shadowBlur = 5 + twinkle * 6;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// Replaces the simpler ritual renderer in blog.js. Progress still comes from ritualTime,
// so the existing build/decay logic naturally reveals and erases every layer in reverse.
drawRitual = function drawRitualExpanded(time) {
  const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
  if (progress <= 0) return;

  drawOuterConstellations(time, progress);

  ctx.save();
  ctx.translate(score.x, score.y);
  drawArcaneStars(time, progress);
  drawArcaneGeometry(time, progress);

  if (ritualComplete) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.0035);
    const flashAge = (performance.now() - ritualCompletedAt) / 1000;
    const flash = flashAge < 2.2 ? 1 - flashAge / 2.2 : 0;

    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,240,198,${0.46 + pulse * 0.30})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 124, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(175,150,255,${0.38 + pulse * 0.28})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 91, 0, Math.PI * 2);
    ctx.stroke();

    if (flash > 0) {
      const burst = ctx.createRadialGradient(0, 0, 6, 0, 0, 182);
      burst.addColorStop(0, `rgba(255,246,218,${flash * 0.36})`);
      burst.addColorStop(0.45, `rgba(179,158,255,${flash * 0.13})`);
      burst.addColorStop(1, 'rgba(120,100,220,0)');
      ctx.fillStyle = burst;
      ctx.beginPath();
      ctx.arc(0, 0, 182, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
};
