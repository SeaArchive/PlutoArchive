(() => {
  'use strict';

  const system = document.querySelector('.system');
  if (!system) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'pluto-vortex';
  canvas.setAttribute('aria-hidden', 'true');

  const pluto = system.querySelector('.pluto');
  system.insertBefore(canvas, pluto || null);

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const TAU = Math.PI * 2;
  const PARTICLE_COUNT = reducedMotion ? 54 : 190;
  const particles = [];

  let cssWidth = 1;
  let cssHeight = 1;
  let dpr = 1;
  let lastTime = performance.now();
  let time = 0;

  function seeded(index, channel) {
    const value = Math.sin(index * 91.731 + channel * 47.113) * 43758.5453123;
    return value - Math.floor(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeParticle(index) {
    const lane = index % 3;
    const bright = seeded(index, 8) > .78;

    return {
      lane,
      phase: seeded(index, 1),
      angle: seeded(index, 2) * TAU,
      turns: 2.2 + seeded(index, 3) * 4.8,
      speed: .000018 + seeded(index, 4) * .000020,
      radiusBias: .80 + seeded(index, 5) * .22,
      size: (bright ? 1.55 : .72) + seeded(index, 6) * (bright ? 1.8 : 1.05),
      brightness: .42 + seeded(index, 7) * .58,
      tint: seeded(index, 9),
      wobble: seeded(index, 10) * TAU,
      wobbleAmount: .015 + seeded(index, 11) * .055
    };
  }

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push(makeParticle(i));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2.25);

    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function easeInCubic(t) {
    return t * t * t;
  }

  function particlePoint(particle, progress) {
    const minSide = Math.min(cssWidth, cssHeight);
    const outerRadius = minSide * .405 * particle.radiusBias;
    const inward = 1 - progress;
    const radius = outerRadius * Math.pow(inward, .76);

    // Angular velocity increases as the star approaches Pluto.
    const accelerated = progress + easeInCubic(progress) * .72;
    const angle = particle.angle + accelerated * particle.turns * TAU;
    const wobble = Math.sin(progress * TAU * 2 + particle.wobble) * outerRadius * particle.wobbleAmount * inward;

    let x = 0;
    let y = 0;
    let z = 0;

    if (particle.lane === 0) {
      // Rotation around the Z axis: follows the visible orbital plane.
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius;
      z = wobble;
    } else if (particle.lane === 1) {
      // Rotation around the X axis.
      x = wobble;
      y = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    } else {
      // Rotation around the Y axis.
      x = Math.cos(angle) * radius;
      y = wobble;
      z = Math.sin(angle) * radius;
    }

    // A shallow local 3D projection makes the particles visibly wrap around
    // all of Pluto's axes before the parent system's own 3D transform is applied.
    const perspective = 1 / (1 + z / Math.max(160, minSide * .95));
    const sx = x * perspective + z * .12;
    const sy = y * perspective - z * .20;

    return {
      x: cssWidth * .5 + sx,
      y: cssHeight * .5 + sy,
      z,
      perspective,
      radius
    };
  }

  function particleColor(tint, alpha) {
    if (tint > .88) return `rgba(224,211,255,${alpha})`;
    if (tint > .72) return `rgba(213,239,255,${alpha})`;
    return `rgba(112,221,255,${alpha})`;
  }

  function drawParticle(particle, nowTime) {
    const cycle = (nowTime * particle.speed + particle.phase) % 1;
    const progress = reducedMotion ? .55 : cycle;
    const point = particlePoint(particle, progress);

    const previousProgress = clamp(progress - (.012 + progress * .016), 0, 1);
    const previous = particlePoint(particle, previousProgress);

    const centerBoost = Math.pow(progress, 1.65);
    const fadeIn = clamp(progress / .10, 0, 1);
    const fadeOut = clamp((1 - progress) / .055, 0, 1);
    const depth = clamp(.62 + point.z / Math.max(1, Math.min(cssWidth, cssHeight)) * 1.8, .28, 1.15);
    const alpha = particle.brightness * fadeIn * fadeOut * (.32 + centerBoost * .68) * depth;

    if (alpha <= .012) return;

    const trailAlpha = alpha * (.16 + centerBoost * .46);
    const gradient = ctx.createLinearGradient(previous.x, previous.y, point.x, point.y);
    gradient.addColorStop(0, particleColor(particle.tint, 0));
    gradient.addColorStop(1, particleColor(particle.tint, trailAlpha));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = (.38 + particle.size * .24 + centerBoost * .62) * point.perspective;
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    const size = particle.size * (.70 + centerBoost * .62) * point.perspective;
    ctx.fillStyle = particleColor(particle.tint, alpha);
    ctx.shadowColor = particle.tint > .88
      ? 'rgba(195,177,255,.95)'
      : 'rgba(73,214,255,.95)';
    ctx.shadowBlur = 3 + size * 4.6 + centerBoost * 6;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(.42, size), 0, TAU);
    ctx.fill();

    if (particle.size > 1.8 && alpha > .2) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = particleColor(particle.tint, alpha * .34);
      ctx.lineWidth = .6;
      ctx.beginPath();
      ctx.moveTo(point.x - size * 2.7, point.y);
      ctx.lineTo(point.x + size * 2.7, point.y);
      ctx.moveTo(point.x, point.y - size * 2.7);
      ctx.lineTo(point.x, point.y + size * 2.7);
      ctx.stroke();
    }
  }

  function drawCore() {
    const cx = cssWidth * .5;
    const cy = cssHeight * .5;
    const base = Math.min(cssWidth, cssHeight);
    const pulse = reducedMotion ? .5 : .5 + .5 * Math.sin(time * .0031);

    ctx.shadowBlur = 0;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * .105);
    glow.addColorStop(0, `rgba(220,249,255,${.095 + pulse * .055})`);
    glow.addColorStop(.18, `rgba(73,214,255,${.065 + pulse * .035})`);
    glow.addColorStop(1, 'rgba(73,214,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, base * .105, 0, TAU);
    ctx.fill();
  }

  function frame(now) {
    const dt = Math.min(50, Math.max(0, now - lastTime));
    lastTime = now;
    if (!document.hidden) time += dt;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < particles.length; i += 1) {
      drawParticle(particles[i], time);
    }

    drawCore();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
