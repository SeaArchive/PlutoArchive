// High-quality motion layer for Pluto Ark.
// Loaded after blog-performance.js so it can restore visual detail without
// discarding the existing gameplay and archive interactions.

(() => {
  'use strict';

  const QUALITY_RENDER_SCALE = 1.65;
  const QUALITY_EXTRA_STAR_COUNT = 520;

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

  // ---------------------------------------------------------------------------
  // Full-refresh-rate loop: remove the old 45 FPS presentation cap.
  // ---------------------------------------------------------------------------
  loop = function qualityLoop(now) {
    const dt = Math.min(0.033, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    render(now);
    requestAnimationFrame(loop);
  };

  // ---------------------------------------------------------------------------
  // Higher internal canvas resolution.
  // ---------------------------------------------------------------------------
  function qualityResizeGameCanvas() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth || 960);
    const height = Math.max(1, rect.height || window.innerHeight || 640);
    const aspect = width / height;
    const logicalWidth = Math.max(1, Math.round(VIEW_H * aspect));

    canvas.height = Math.round(VIEW_H * QUALITY_RENDER_SCALE);
    canvas.width = Math.round(logicalWidth * QUALITY_RENDER_SCALE);
    camera.w = logicalWidth;
    camera.h = VIEW_H;
    camera.initialized = false;
    ctx.imageSmoothingEnabled = false;
  }

  qualityResizeGameCanvas();
  window.addEventListener('resize', qualityResizeGameCanvas, { passive: true });

  // ---------------------------------------------------------------------------
  // Distance-aware camera return. Far movement catches up rapidly, while the
  // final approach slows naturally instead of snapping into place.
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Restore a denser live star field on top of the cached background.
  // ---------------------------------------------------------------------------
  const baseDrawFloor = drawFloor;
  const qualityStars = Array.from({ length: QUALITY_EXTRA_STAR_COUNT }, (_, index) => {
    const seed = index + 9000;
    return {
      x: seededUnit(seed * 5 + 1) * WORLD_W,
      y: seededUnit(seed * 5 + 2) * WORLD_H,
      size: .45 + seededUnit(seed * 5 + 3) * 1.65,
      phase: seededUnit(seed * 5 + 4) * Math.PI * 2,
      depth: .2 + seededUnit(seed * 5 + 5) * .8
    };
  });

  drawFloor = function drawFloorHighQuality(time) {
    baseDrawFloor(time);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    SPACE_NEBULAE.forEach((nebula, index) => {
      if (
        nebula.x + nebula.radius < camera.x - 80 ||
        nebula.x - nebula.radius > camera.x + camera.w + 80 ||
        nebula.y + nebula.radius < camera.y - 80 ||
        nebula.y - nebula.radius > camera.y + camera.h + 80
      ) return;

      const dx = Math.sin(time * .00007 + index * 1.41) * 14;
      const dy = Math.cos(time * .00006 + index * 1.87) * 11;
      const glow = ctx.createRadialGradient(
        nebula.x + dx,
        nebula.y + dy,
        0,
        nebula.x + dx,
        nebula.y + dy,
        nebula.radius * .86
      );
      glow.addColorStop(0, `rgba(${nebula.tone},.035)`);
      glow.addColorStop(.52, `rgba(${nebula.tone},.014)`);
      glow.addColorStop(1, `rgba(${nebula.tone},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(nebula.x + dx, nebula.y + dy, nebula.radius * .86, 0, Math.PI * 2);
      ctx.fill();
    });

    qualityStars.forEach((star, index) => {
      if (
        star.x < camera.x - 10 ||
        star.x > camera.x + camera.w + 10 ||
        star.y < camera.y - 10 ||
        star.y > camera.y + camera.h + 10
      ) return;

      const wave = .5 + .5 * Math.sin(time * (.0010 + star.depth * .0018) + star.phase);
      const twinkle = wave * wave;
      const alpha = .10 + twinkle * (.24 + star.depth * .38);
      const size = star.size * (.7 + star.depth * .5);

      if (size > 1.55 && index % 4 === 0) {
        ctx.shadowColor = index % 3 === 0
          ? 'rgba(186,170,255,.72)'
          : 'rgba(146,214,255,.72)';
        ctx.shadowBlur = 4 + twinkle * 7;
      }

      ctx.fillStyle = `rgba(225,240,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, Math.max(.45, size * .5), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // Add full-resolution live detail over the cached ritual geometry.
  // ---------------------------------------------------------------------------
  const baseDrawRitual = drawRitual;

  drawRitual = function drawRitualHighQuality(time) {
    baseDrawRitual(time);

    const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
    if (progress <= 0) return;

    ctx.save();
    ctx.translate(score.x, score.y);
    ctx.globalCompositeOperation = 'lighter';

    const pulse = .5 + .5 * Math.sin(time * .0031);
    const detail = clamp((progress - .22) / .78, 0, 1);

    if (detail > 0) {
      for (let ring = 0; ring < 3; ring += 1) {
        const radius = 92 + ring * 15;
        const direction = ring % 2 ? -1 : 1;
        const rotation = time * (.00013 + ring * .000035) * direction;
        const segments = 18 + ring * 8;

        for (let i = 0; i < segments; i += 1) {
          if ((i + ring) % 3 === 1) continue;
          const start = rotation + i * Math.PI * 2 / segments;
          const length = Math.PI * 2 / segments * (.26 + detail * .36);
          ctx.strokeStyle = ring === 1
            ? `rgba(232,213,154,${.035 + detail * .11})`
            : `rgba(184,165,255,${.04 + detail * .13})`;
          ctx.lineWidth = ring === 0 ? 1.05 : .7;
          ctx.beginPath();
          ctx.arc(0, 0, radius, start, start + length);
          ctx.stroke();
        }
      }

      const motes = 18;
      for (let i = 0; i < motes; i += 1) {
        const phase = i * 2.3999632297;
        const angle = phase + time * (.00011 + (i % 5) * .000013);
        const radius = 88 + (i % 6) * 9 + Math.sin(time * .0011 + i) * 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const brightness = .30 + .38 * Math.sin(time * .0024 + i * 1.3) ** 2;
        ctx.fillStyle = `rgba(232,238,255,${detail * brightness})`;
        ctx.shadowColor = 'rgba(174,160,255,.75)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(x, y, i % 5 === 0 ? 1.35 : .75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    if (ritualComplete) {
      const breathe = .5 + .5 * Math.sin(time * .0018);
      const aura = ctx.createRadialGradient(0, 0, 24, 0, 0, 188);
      aura.addColorStop(0, `rgba(229,219,255,${.035 + breathe * .035})`);
      aura.addColorStop(.56, `rgba(140,115,230,${.02 + breathe * .02})`);
      aura.addColorStop(1, 'rgba(100,80,200,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 188, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // ---------------------------------------------------------------------------
  // Restore per-star bloom and halos to archive-room constellations.
  // ---------------------------------------------------------------------------
  if (typeof drawConstellationRoom === 'function') {
    drawConstellationRoom = function drawConstellationRoomHighQuality(room, time) {
      const dist = Math.hypot(player.x - room.x, player.y - room.y);
      const proximity = clamp(1 - dist / 245, 0, 1);
      const pulse = .5 + .5 * Math.sin(time * .0025 + room.x * .002);

      ctx.save();
      ctx.translate(room.x, room.y);
      ctx.rotate(room.rotation);
      ctx.globalCompositeOperation = 'lighter';

      const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 110);
      halo.addColorStop(0, `rgba(104,176,230,${.015 + proximity * .045})`);
      halo.addColorStop(.65, `rgba(104,138,220,${.006 + proximity * .020})`);
      halo.addColorStop(1, 'rgba(80,110,180,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.fill();

      room.edges.forEach(([a, b], index) => {
        const [ax, ay] = room.points[a];
        const [bx, by] = room.points[b];
        const shimmer = .5 + .5 * Math.sin(time * .0017 + index * .77);
        ctx.strokeStyle = `rgba(137,191,241,${.09 + proximity * .27 + shimmer * .055})`;
        ctx.lineWidth = .8 + proximity * .45;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      });

      room.points.forEach(([x, y], index) => {
        const twinkle = .45 + .55 * Math.sin(time * (.0025 + index * .00006) + index * 1.71) ** 2;
        const size = index % 4 === 0 ? 2.35 : 1.25;
        ctx.fillStyle = `rgba(230,245,255,${.42 + proximity * .38 + twinkle * .18})`;
        ctx.shadowColor = index % 3 === 0
          ? 'rgba(187,169,255,.92)'
          : 'rgba(133,211,255,.92)';
        ctx.shadowBlur = 5 + twinkle * 6 + proximity * 4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = 'source-over';
      ctx.rotate(-room.rotation);
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(174,207,234,${.46 + proximity * .46})`;
      ctx.fillText(`${room.id} · ${room.name}`, 0, 78);
      ctx.restore();
    };
  }

  // Relic constellation quality: keep the optimized shape logic, then add
  // proximity bloom rather than simplifying the objects to flat points.
  if (typeof perfDrawRelicConstellation === 'function') {
    const baseRelicDraw = perfDrawRelicConstellation;
    perfDrawRelicConstellation = function perfDrawRelicConstellationHighQuality(object, time) {
      baseRelicDraw(object, time);

      const dist = Math.hypot(player.x - object.x, player.y - object.y);
      const proximity = clamp(1 - dist / 220, 0, 1);
      if (proximity <= .02) return;

      ctx.save();
      ctx.translate(object.x, object.y);
      ctx.globalCompositeOperation = 'lighter';
      const pulse = .5 + .5 * Math.sin(time * .0022 + object.y * .0014);
      const halo = ctx.createRadialGradient(0, 0, 5, 0, 0, 82);
      halo.addColorStop(0, `rgba(125,198,245,${proximity * (.035 + pulse * .025)})`);
      halo.addColorStop(.55, `rgba(124,136,230,${proximity * .018})`);
      halo.addColorStop(1, 'rgba(90,110,200,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 82, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
  }

  // Re-render at the upgraded backing resolution while preserving the original
  // world draw order and fog-over-world/player-on-top composition.
  render = function renderHighQuality(time) {
    updateCamera();

    ctx.setTransform(QUALITY_RENDER_SCALE, 0, 0, QUALITY_RENDER_SCALE, 0, 0);
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
