// Smooth-performance motion layer for Pluto Ark.
// Keeps the high-quality camera feel while avoiding expensive per-frame
// Canvas2D effects that caused unstable frame pacing on high-refresh displays.

(() => {
  'use strict';

  let qualityRenderScale = Math.min(window.innerWidth, window.innerHeight) < 720 ? 1.15 : 1.35;

  function adaptiveRate(distance, nearRate, farRate, range) {
    const t = clamp(distance / range, 0, 1);
    const eased = t * t * (3 - 2 * t);
    return nearRate + (farRate - nearRate) * eased;
  }

  function adaptiveApproach(current, target, dtMs, nearRate, farRate, range) {
    const distance = Math.abs(target - current);
    if (distance < 0.0005) return target;
    const rate = adaptiveRate(distance, nearRate, farRate, range);
    const follow = 1 - Math.exp(-dtMs * rate);
    return current + (target - current) * follow;
  }

  // The shared fps-cap.js scheduler owns the 60 FPS ceiling. Keeping a second
  // interval check here caused 144/165 Hz displays to occasionally fall to
  // roughly half-rate, so this loop only handles simulation and presentation.
  loop = function qualityLoop(now) {
    const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    render(now);
    requestAnimationFrame(loop);
  };

  function qualityResizeGameCanvas() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth || 960);
    const height = Math.max(1, rect.height || window.innerHeight || 640);
    const aspect = width / height;
    const logicalWidth = Math.max(1, Math.round(VIEW_H * aspect));
    qualityRenderScale = Math.min(window.innerWidth, window.innerHeight) < 720 ? 1.15 : 1.35;
    const targetHeight = Math.round(VIEW_H * qualityRenderScale);
    const targetWidth = Math.round(logicalWidth * qualityRenderScale);

    if (
      canvas.width === targetWidth &&
      canvas.height === targetHeight &&
      camera.w === logicalWidth &&
      camera.h === VIEW_H
    ) return;

    canvas.height = targetHeight;
    canvas.width = targetWidth;
    camera.w = logicalWidth;
    camera.h = VIEW_H;
    camera.initialized = false;
    ctx.imageSmoothingEnabled = false;
  }

  // blog.js installs a fallback resize handler before this quality layer loads.
  // Once this layer is active, keeping both listeners causes two canvas backing
  // store reallocations on the same resize/orientation event.
  window.removeEventListener('resize', resizeGameCanvas);
  qualityResizeGameCanvas();
  window.addEventListener('resize', qualityResizeGameCanvas, { passive: true });

  // Distance-aware camera return: fast while far away, progressively slower
  // near the target. This preserves the motion style requested for the site.
  let cameraMotionTime = performance.now();
  updateCamera = function updateCameraAdaptive() {
    const now = performance.now();
    const dtMs = Math.min(50, Math.max(1, now - cameraMotionTime));
    cameraMotionTime = now;

    const maxX = Math.max(0, WORLD_W - camera.w);
    const maxY = Math.max(0, WORLD_H - camera.h);
    const targetX = clamp(player.x - camera.w / 2, 0, maxX);
    const targetY = clamp(player.y - camera.h / 2, 0, maxY);

    if (!camera.initialized) {
      camera.x = targetX;
      camera.y = targetY;
      camera.initialized = true;
      return;
    }

    camera.x = adaptiveApproach(camera.x, targetX, dtMs, .0040, .020, 180);
    camera.y = adaptiveApproach(camera.y, targetY, dtMs, .0040, .020, 180);
  };

  // Reuse the cached star field from blog-performance.js. The previous quality
  // layer added hundreds of live arcs, shadowBlur calls and moving radial
  // gradients every frame; those were the largest Canvas2D cost after the
  // backing resolution. We keep quality via cheap cached glow sprites instead.
  function makeGlowSprite(size, inner, middle) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = size;
    glowCanvas.height = size;
    const g = glowCanvas.getContext('2d');
    const c = size / 2;
    const gradient = g.createRadialGradient(c, c, 0, c, c, c);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(.34, middle);
    gradient.addColorStop(1, 'rgba(80,110,190,0)');
    g.fillStyle = gradient;
    g.fillRect(0, 0, size, size);
    return glowCanvas;
  }

  const roomGlow = makeGlowSprite(192, 'rgba(145,218,255,.20)', 'rgba(108,141,235,.065)');
  const relicGlow = makeGlowSprite(144, 'rgba(130,210,255,.18)', 'rgba(118,130,230,.052)');

  // Restore a polished constellation look without per-star shadowBlur.
  if (typeof drawConstellationRoom === 'function') {
    drawConstellationRoom = function drawConstellationRoomBalanced(room, time) {
      const dist = Math.hypot(player.x - room.x, player.y - room.y);
      const proximity = clamp(1 - dist / 245, 0, 1);

      ctx.save();
      ctx.translate(room.x, room.y);
      ctx.rotate(room.rotation);
      ctx.globalCompositeOperation = 'lighter';

      ctx.globalAlpha = .16 + proximity * .30;
      ctx.drawImage(roomGlow, -96, -96, 192, 192);
      ctx.globalAlpha = 1;

      room.edges.forEach(([a, b], index) => {
        const [ax, ay] = room.points[a];
        const [bx, by] = room.points[b];
        const shimmer = .5 + .5 * Math.sin(time * .0017 + index * .77);
        ctx.strokeStyle = `rgba(137,191,241,${.09 + proximity * .27 + shimmer * .045})`;
        ctx.lineWidth = .8 + proximity * .38;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      });

      room.points.forEach(([x, y], index) => {
        const twinkle = .45 + .55 * Math.sin(time * (.0024 + index * .00005) + index * 1.71) ** 2;
        const major = index % 4 === 0;
        const size = major ? 2.2 : 1.2;

        if (major) {
          ctx.fillStyle = `rgba(126,207,255,${.08 + proximity * .10 + twinkle * .08})`;
          ctx.beginPath();
          ctx.arc(x, y, 4.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(230,245,255,${.48 + proximity * .34 + twinkle * .16})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';
      ctx.rotate(-room.rotation);
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(174,207,234,${.46 + proximity * .46})`;
      ctx.fillText(`${room.id} · ${room.name}`, 0, 78);
      ctx.restore();
    };
  }

  // Cheap cached bloom for relics instead of creating radial gradients every
  // frame. The underlying optimized relic renderer remains unchanged.
  if (typeof perfDrawRelicConstellation === 'function') {
    const baseRelicDraw = perfDrawRelicConstellation;
    perfDrawRelicConstellation = function perfDrawRelicConstellationBalanced(object, time) {
      baseRelicDraw(object, time);

      const dist = Math.hypot(player.x - object.x, player.y - object.y);
      const proximity = clamp(1 - dist / 220, 0, 1);
      if (proximity <= .04) return;

      const pulse = .5 + .5 * Math.sin(time * .0022 + object.y * .0014);
      ctx.save();
      ctx.translate(object.x, object.y);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = proximity * (.12 + pulse * .08);
      ctx.drawImage(relicGlow, -72, -72, 144, 144);
      ctx.restore();
    };
  }

  render = function renderBalanced(time) {
    updateCamera();

    ctx.setTransform(qualityRenderScale, 0, 0, qualityRenderScale, 0, 0);
    ctx.fillStyle = '#020406';
    ctx.fillRect(0, 0, camera.w, camera.h);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawFloor(time);
    drawWalls();
    drawDoors();
    drawRitual(time);
    drawScore(time);

    if (typeof drawWorldInteractables === 'function') {
      drawWorldInteractables(time);
    }

    drawExitDoor(time);
    drawLighting();
    drawPlayer();

    ctx.restore();
  };
})();
