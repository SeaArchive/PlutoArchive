(() => {
  const space = document.querySelector('.space');
  if (!space) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = document.createElement('div');
  layer.className = 'space-effects';
  space.appendChild(layer);

  const sparkCount = 64;
  for (let i = 0; i < sparkCount; i += 1) {
    const star = document.createElement('span');
    const bright = Math.random() > 0.68;
    star.className = `spark-star${bright ? ' spark-bright' : ''}`;
    star.style.left = `${2 + Math.random() * 96}%`;
    star.style.top = `${3 + Math.random() * 92}%`;
    star.style.setProperty('--spark-size', `${(0.8 + Math.random() * 2.25).toFixed(2)}px`);
    star.style.setProperty('--spark-duration', `${(3.2 + Math.random() * 6.4).toFixed(2)}s`);
    star.style.setProperty('--spark-delay', `${(-Math.random() * 9).toFixed(2)}s`);
    star.style.setProperty('--spark-depth', `${(.35 + Math.random() * .9).toFixed(3)}`);
    layer.appendChild(star);
  }

  const constellations = [
    {
      className: 'constellation-orion',
      label: 'ORION',
      viewBox: '0 0 120 100',
      lines: [
        [18, 14, 43, 36], [43, 36, 59, 48], [59, 48, 76, 45],
        [76, 45, 104, 21], [43, 36, 34, 78], [59, 48, 58, 84],
        [76, 45, 89, 79], [34, 78, 58, 84], [58, 84, 89, 79]
      ],
      stars: [[18,14,2.2],[43,36,1.7],[59,48,1.9],[76,45,1.6],[104,21,2.1],[34,78,2],[58,84,1.5],[89,79,2.1]]
    },
    {
      className: 'constellation-lyra',
      label: 'LYRA',
      viewBox: '0 0 100 100',
      lines: [
        [18, 19, 42, 45], [42, 45, 69, 37], [69, 37, 80, 69],
        [80, 69, 48, 79], [48, 79, 42, 45]
      ],
      stars: [[18,19,2.6],[42,45,1.6],[69,37,1.8],[80,69,1.7],[48,79,1.9]]
    },
    {
      className: 'constellation-cygnus',
      label: 'CYGNUS',
      viewBox: '0 0 130 100',
      lines: [
        [13, 52, 46, 50], [46, 50, 76, 48], [76, 48, 116, 45],
        [76, 48, 70, 13], [76, 48, 83, 86]
      ],
      stars: [[13,52,1.8],[46,50,1.6],[76,48,2.4],[116,45,2],[70,13,2],[83,86,1.9]]
    },
    {
      className: 'constellation-cassiopeia',
      label: 'CASSIOPEIA',
      viewBox: '0 0 125 90',
      lines: [[10,52,34,26],[34,26,58,51],[58,51,82,23],[82,23,114,47]],
      stars: [[10,52,1.7],[34,26,2.1],[58,51,1.8],[82,23,2.2],[114,47,1.8]]
    },
    {
      className: 'constellation-andromeda',
      label: 'ANDROMEDA',
      viewBox: '0 0 135 95',
      lines: [[12,70,39,53],[39,53,64,40],[64,40,93,25],[64,40,84,67],[93,25,122,19]],
      stars: [[12,70,1.7],[39,53,1.9],[64,40,2.3],[93,25,1.8],[84,67,1.6],[122,19,2.1]]
    }
  ];

  const svgNS = 'http://www.w3.org/2000/svg';

  constellations.forEach(data => {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('constellation', data.className);
    svg.setAttribute('viewBox', data.viewBox);
    svg.setAttribute('aria-hidden', 'true');

    data.lines.forEach(([x1, y1, x2, y2]) => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      svg.appendChild(line);
    });

    data.stars.forEach(([cx, cy, r]) => {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      svg.appendChild(circle);
    });

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', 4);
    text.setAttribute('y', parseFloat(data.viewBox.split(' ')[3]) - 4);
    text.textContent = data.label;
    svg.appendChild(text);

    layer.appendChild(svg);
  });

  function spawnFlash() {
    const flash = document.createElement('span');
    flash.className = 'sky-flash';
    flash.style.left = `${6 + Math.random() * 88}%`;
    flash.style.top = `${6 + Math.random() * 76}%`;
    layer.appendChild(flash);
    window.setTimeout(() => flash.remove(), 2200);
  }

  function spawnMeteor() {
    const meteor = document.createElement('span');
    meteor.className = 'meteor';

    const x = 48 + Math.random() * 48;
    const y = 2 + Math.random() * 40;
    const length = 110 + Math.random() * 190;
    const angle = 20 + Math.random() * 18;
    const duration = 0.95 + Math.random() * 0.95;
    const travel = 54 + Math.random() * 40;

    meteor.style.setProperty('--meteor-x', `${x}vw`);
    meteor.style.setProperty('--meteor-y', `${y}vh`);
    meteor.style.setProperty('--meteor-length', `${length.toFixed(0)}px`);
    meteor.style.setProperty('--meteor-angle', `${angle.toFixed(1)}deg`);
    meteor.style.setProperty('--meteor-duration', `${duration.toFixed(2)}s`);
    meteor.style.setProperty('--meteor-travel', `-${travel.toFixed(0)}vw`);

    layer.appendChild(meteor);
    window.setTimeout(() => meteor.remove(), duration * 1000 + 320);

    if (Math.random() < 0.22) {
      window.setTimeout(() => {
        if (!document.hidden) spawnMeteor();
      }, 180 + Math.random() * 360);
    }
  }

  function scheduleMeteor() {
    if (reducedMotion) return;

    const delay = 2200 + Math.random() * 5200;
    window.setTimeout(() => {
      if (!document.hidden && Math.random() < 0.74) spawnMeteor();
      if (!document.hidden && Math.random() < 0.19) spawnFlash();
      scheduleMeteor();
    }, delay);
  }

  if (!reducedMotion) scheduleMeteor();

  // Same motion model as the hidden page: large pointer offsets are followed
  // quickly, then the final few pixels settle more slowly.
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastFrame = performance.now();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function approach(value, target, dt, range) {
    const distance = Math.abs(target - value);
    const t = clamp(distance / range, 0, 1);
    const smooth = t * t * (3 - 2 * t);
    const rate = .0035 + (.021 - .0035) * smooth;
    return value + (target - value) * (1 - Math.exp(-dt * rate));
  }

  window.addEventListener('pointermove', event => {
    if (reducedMotion) return;
    targetX = ((event.clientX / window.innerWidth) - .5) * -8;
    targetY = ((event.clientY / window.innerHeight) - .5) * -6;
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function animateSky(now) {
    const dt = Math.min(50, Math.max(1, now - lastFrame));
    lastFrame = now;

    currentX = approach(currentX, targetX, dt, 8);
    currentY = approach(currentY, targetY, dt, 6);

    layer.style.setProperty('--sky-x', `${currentX.toFixed(3)}px`);
    layer.style.setProperty('--sky-y', `${currentY.toFixed(3)}px`);
    requestAnimationFrame(animateSky);
  }

  requestAnimationFrame(animateSky);
})();
