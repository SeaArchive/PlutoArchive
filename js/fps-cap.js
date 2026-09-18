(() => {
  'use strict';

  if (window.__plutoFpsCapInstalled) return;
  window.__plutoFpsCapInstalled = true;

  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const FRAME_INTERVAL = 1000 / 60;
  let lastFrameTime = 0;
  let scheduled = false;
  let nextId = 1;
  const callbacks = new Map();

  function pump(now) {
    if (now - lastFrameTime < FRAME_INTERVAL - 0.8) {
      nativeRequestAnimationFrame(pump);
      return;
    }

    lastFrameTime = now;
    scheduled = false;

    const batch = [...callbacks.entries()];
    callbacks.clear();

    batch.forEach(([id, callback]) => {
      if (typeof callback !== 'function') return;
      try {
        callback(now);
      } catch (error) {
        window.setTimeout(() => { throw error; }, 0);
      }
    });

    if (callbacks.size && !scheduled) {
      scheduled = true;
      nativeRequestAnimationFrame(pump);
    }
  }

  window.requestAnimationFrame = callback => {
    const id = nextId++;
    callbacks.set(id, callback);
    if (!scheduled) {
      scheduled = true;
      nativeRequestAnimationFrame(pump);
    }
    return id;
  };

  window.cancelAnimationFrame = id => {
    callbacks.delete(id);
  };
})();
