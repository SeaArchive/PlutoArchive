(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRAME_INTERVAL = 1000 / 60;

  const target = {
    x: window.innerWidth * .5,
    y: window.innerHeight * .5,
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
  let lastRenderTime = 0;

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

  function setTarget(clientX, clientY) {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    target.x = clientX;
    target.y = clientY;
    target.nx = clamp((clientX / width - .5) * 2, -1, 1);
    target.ny = clamp((clientY / height - .5) * 2, -1, 1);
  }

  window.addEventListener('pointermove', event => {
    if (reducedMotion) return;
    setTarget(event.clientX, event.clientY);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    target.x = window.innerWidth * .5;
    target.y = window.innerHeight * .5;
    target.nx = 0;
    target.ny = 0;
  });

  window.addEventListener('resize', () => {
    if (Math.abs(target.nx) < .001 && Math.abs(target.ny) < .001) {
      target.x = window.innerWidth * .5;
      target.y = window.innerHeight * .5;
    }
  }, { passive: true });

  function frame(now) {
    if (now - lastRenderTime < FRAME_INTERVAL) {
      requestAnimationFrame(frame);
      return;
    }

    const dt = Math.min(50, Math.max(1, now - lastTime));
    lastTime = now;
    lastRenderTime = now;

    if (reducedMotion) {
      current.x = target.x;
      current.y = target.y;
      current.nx = 0;
      current.ny = 0;
    } else {
      current.x = approach(current.x, target.x, dt, .0035, .020, 300);
      current.y = approach(current.y, target.y, dt, .0035, .020, 300);
      current.nx = approach(current.nx, target.nx, dt, .0040, .024, .95);
      current.ny = approach(current.ny, target.ny, dt, .0040, .024, .95);
    }

    root.style.setProperty('--pointer-x', `${current.x.toFixed(2)}px`);
    root.style.setProperty('--pointer-y', `${current.y.toFixed(2)}px`);
    root.style.setProperty('--system-shift-x', `${(current.nx * 8).toFixed(3)}px`);
    root.style.setProperty('--system-shift-y', `${(current.ny * 6).toFixed(3)}px`);
    root.style.setProperty('--system-tilt-x', `${(-current.ny * 3.2).toFixed(3)}deg`);
    root.style.setProperty('--system-tilt-z', `${(current.nx * 3.8).toFixed(3)}deg`);
    root.style.setProperty('--copy-shift-x', `${(-current.nx * 3.2).toFixed(3)}px`);
    root.style.setProperty('--copy-shift-y', `${(-current.ny * 2.2).toFixed(3)}px`);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
