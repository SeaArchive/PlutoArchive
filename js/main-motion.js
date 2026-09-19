(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let viewportWidth = Math.max(1, window.innerWidth);
  let viewportHeight = Math.max(1, window.innerHeight);

  const target = {
    x: viewportWidth * .5,
    y: viewportHeight * .5,
    nx: 0,
    ny: 0
  };

  const current = {
    x: target.x,
    y: target.y,
    nx: 0,
    ny: 0
  };

  let lastTime = performance.now();
  let frameId = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function adaptiveRate(distance, nearRate, farRate, range) {
    const t = clamp(distance / range, 0, 1);
    const smooth = t * t * (3 - 2 * t);
    return nearRate + (farRate - nearRate) * smooth;
  }

  function approach(value, targetValue, dt, nearRate, farRate, range) {
    const distance = Math.abs(targetValue - value);
    if (distance < .0001) return targetValue;
    const rate = adaptiveRate(distance, nearRate, farRate, range);
    const follow = 1 - Math.exp(-dt * rate);
    return value + (targetValue - value) * follow;
  }

  function applyMotion() {
    root.style.setProperty('--pointer-x', `${current.x.toFixed(2)}px`);
    root.style.setProperty('--pointer-y', `${current.y.toFixed(2)}px`);
    root.style.setProperty('--system-shift-x', `${(current.nx * 8).toFixed(3)}px`);
    root.style.setProperty('--system-shift-y', `${(current.ny * 6).toFixed(3)}px`);
    root.style.setProperty('--system-tilt-x', `${(-current.ny * 3.2).toFixed(3)}deg`);
    root.style.setProperty('--system-tilt-z', `${(current.nx * 3.8).toFixed(3)}deg`);
    root.style.setProperty('--copy-shift-x', `${(-current.nx * 3.2).toFixed(3)}px`);
    root.style.setProperty('--copy-shift-y', `${(-current.ny * 2.2).toFixed(3)}px`);
  }

  function ensureFrame() {
    if (reducedMotion || frameId !== null) return;
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function setTarget(clientX, clientY) {
    target.x = clientX;
    target.y = clientY;
    target.nx = clamp((clientX / viewportWidth - .5) * 2, -1, 1);
    target.ny = clamp((clientY / viewportHeight - .5) * 2, -1, 1);
    ensureFrame();
  }

  window.addEventListener('pointermove', event => {
    if (reducedMotion) return;
    setTarget(event.clientX, event.clientY);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    target.x = viewportWidth * .5;
    target.y = viewportHeight * .5;
    target.nx = 0;
    target.ny = 0;
    ensureFrame();
  });

  window.addEventListener('resize', () => {
    viewportWidth = Math.max(1, window.innerWidth);
    viewportHeight = Math.max(1, window.innerHeight);

    if (Math.abs(target.nx) < .001 && Math.abs(target.ny) < .001) {
      target.x = viewportWidth * .5;
      target.y = viewportHeight * .5;
      ensureFrame();
    }
  }, { passive: true });

  function frame(now) {
    frameId = null;
    const dt = Math.min(50, Math.max(1, now - lastTime));
    lastTime = now;

    current.x = approach(current.x, target.x, dt, .0035, .020, 300);
    current.y = approach(current.y, target.y, dt, .0035, .020, 300);
    current.nx = approach(current.nx, target.nx, dt, .0040, .024, .95);
    current.ny = approach(current.ny, target.ny, dt, .0040, .024, .95);

    const settled =
      Math.abs(current.x - target.x) < .02 &&
      Math.abs(current.y - target.y) < .02 &&
      Math.abs(current.nx - target.nx) < .0003 &&
      Math.abs(current.ny - target.ny) < .0003;

    if (settled) {
      current.x = target.x;
      current.y = target.y;
      current.nx = target.nx;
      current.ny = target.ny;
    }

    applyMotion();

    if (!settled) ensureFrame();
  }
})();
