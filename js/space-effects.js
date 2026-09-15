(() => {
  const space = document.querySelector('.space');
  if (!space) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = document.createElement('div');
  layer.className = 'space-effects';
  space.appendChild(layer);

  const sparkCount = 24;
  for (let i = 0; i < sparkCount; i += 1) {
    const star = document.createElement('span');
    star.className = `spark-star${Math.random() > 0.72 ? ' spark-bright' : ''}`;
    star.style.left = `${4 + Math.random() * 92}%`;
    star.style.top = `${5 + Math.random() * 86}%`;
    star.style.setProperty('--spark-size', `${(1 + Math.random() * 1.7).toFixed(2)}px`);
    star.style.setProperty('--spark-duration', `${(2.8 + Math.random() * 4.8).toFixed(2)}s`);
    star.style.setProperty('--spark-delay', `${(-Math.random() * 7).toFixed(2)}s`);
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
    text.setAttribute('y', 96);
    text.textContent = data.label;
    svg.appendChild(text);

    layer.appendChild(svg);
  });

  function spawnFlash() {
    const flash = document.createElement('span');
    flash.className = 'sky-flash';
    flash.style.left = `${8 + Math.random() * 84}%`;
    flash.style.top = `${8 + Math.random() * 68}%`;
    layer.appendChild(flash);
    window.setTimeout(() => flash.remove(), 1900);
  }

  function spawnMeteor() {
    const meteor = document.createElement('span');
    meteor.className = 'meteor';

    const x = 52 + Math.random() * 43;
    const y = 4 + Math.random() * 35;
    const length = 90 + Math.random() * 150;
    const angle = 22 + Math.random() * 16;
    const duration = 0.82 + Math.random() * 0.72;
    const travel = 48 + Math.random() * 33;

    meteor.style.setProperty('--meteor-x', `${x}vw`);
    meteor.style.setProperty('--meteor-y', `${y}vh`);
    meteor.style.setProperty('--meteor-length', `${length.toFixed(0)}px`);
    meteor.style.setProperty('--meteor-angle', `${angle.toFixed(1)}deg`);
    meteor.style.setProperty('--meteor-duration', `${duration.toFixed(2)}s`);
    meteor.style.setProperty('--meteor-travel', `-${travel.toFixed(0)}vw`);

    layer.appendChild(meteor);
    window.setTimeout(() => meteor.remove(), duration * 1000 + 250);

    if (Math.random() < 0.18) {
      window.setTimeout(() => {
        if (!document.hidden) spawnMeteor();
      }, 180 + Math.random() * 420);
    }
  }

  function scheduleMeteor() {
    if (reducedMotion) return;

    const delay = 2600 + Math.random() * 6200;
    window.setTimeout(() => {
      if (!document.hidden && Math.random() < 0.68) {
        spawnMeteor();
      }

      if (!document.hidden && Math.random() < 0.16) {
        spawnFlash();
      }

      scheduleMeteor();
    }, delay);
  }

  if (!reducedMotion) {
    scheduleMeteor();
  }

  window.addEventListener('pointermove', event => {
    if (reducedMotion) return;

    const x = ((event.clientX / window.innerWidth) - 0.5) * -5;
    const y = ((event.clientY / window.innerHeight) - 0.5) * -4;
    layer.style.setProperty('--sky-x', `${x.toFixed(2)}px`);
    layer.style.setProperty('--sky-y', `${y.toFixed(2)}px`);
  }, { passive: true });
})();
