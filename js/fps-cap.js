(() => {
  'use strict';

  if (window.__plutoFpsCapInstalled) return;
  window.__plutoFpsCapInstalled = true;

  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const FRAME_INTERVAL = 1000 / 60;
  const EARLY_TOLERANCE = 0.35;

  let frameCursor = 0;
  let scheduled = false;
  let nextId = 1;
  const callbacks = new Map();

  function pump(now) {
    if (!frameCursor) frameCursor = now - FRAME_INTERVAL;

    const elapsed = now - frameCursor;
    if (elapsed < FRAME_INTERVAL - EARLY_TOLERANCE) {
      nativeRequestAnimationFrame(pump);
      return;
    }

    // Keep the fractional remainder instead of resetting the clock to `now`.
    // This avoids falling to 48/55 FPS on 144/165 Hz displays while still
    // keeping the application at an average maximum of 60 presented frames.
    if (elapsed > 250) {
      frameCursor = now;
    } else {
      const steps = Math.max(1, Math.floor((elapsed + EARLY_TOLERANCE) / FRAME_INTERVAL));
      frameCursor += steps * FRAME_INTERVAL;
    }

    scheduled = false;

    const batch = Array.from(callbacks.entries());
    callbacks.clear();

    for (let i = 0; i < batch.length; i += 1) {
      const [, callback] = batch[i];
      if (typeof callback !== 'function') continue;
      try {
        callback(now);
      } catch (error) {
        window.setTimeout(() => { throw error; }, 0);
      }
    }

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
