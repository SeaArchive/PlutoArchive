// GPU ritual renderer for Pluto Ark.
// High-detail WebGL2 magic circle: layered gyroscopic rings, rotating sigils,
// geometric lattices and procedural resonance light. No star-dust particles.

(() => {
  'use strict';

  const previousDrawRitual = typeof drawRitual === 'function' ? drawRitual : null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gpuCanvas = document.createElement('canvas');
  const isCompact = Math.min(window.innerWidth, window.innerHeight) < 720;
  const GPU_SIZE = reducedMotion ? 512 : (isCompact ? 720 : 1024);
  const SIGIL_COUNT = reducedMotion ? 64 : (isCompact ? 120 : 168);
  const DISPLAY_SIZE = isCompact ? 460 : 540;
  const RING_SEGMENTS = reducedMotion ? 256 : 512;
  const TAU = Math.PI * 2;

  gpuCanvas.width = GPU_SIZE;
  gpuCanvas.height = GPU_SIZE;

  const gl = gpuCanvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    desynchronized: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    console.warn('[PLUTO ARK] WebGL2 ritual renderer unavailable; using Canvas fallback.');
    return;
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function seeded(index, channel) {
    const value = Math.sin(index * 93.173 + channel * 41.719) * 43758.5453123;
    return value - Math.floor(value);
  }

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Ritual shader compilation failed.';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function program(vertexSource, fragmentSource) {
    const result = gl.createProgram();
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(result, vertex);
    gl.attachShader(result, fragment);
    gl.linkProgram(result);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(result) || 'Ritual program link failed.';
      gl.deleteProgram(result);
      throw new Error(message);
    }
    return result;
  }

  const commonRotation = `
    mat3 rotX(float a) {
      float c = cos(a), s = sin(a);
      return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);
    }
    mat3 rotY(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c,0.,-s, 0.,1.,0., s,0.,c);
    }
    mat3 rotZ(float a) {
      float c = cos(a), s = sin(a);
      return mat3(c,s,0., -s,c,0., 0.,0.,1.);
    }
  `;

  const ringVertex = `#version 300 es
    precision highp float;
    layout(location=0) in float aAngle;

    uniform float uTime;
    uniform float uRadius;
    uniform float uRotation;
    uniform vec3 uTilt;
    uniform float uProgress;
    uniform float uWave;

    out float vDepth;
    out float vArc;
    out float vPulse;

    ${commonRotation}

    void main() {
      float angle = aAngle + uRotation;
      float microWave = sin(aAngle * (6.0 + uWave * 5.0) + uTime * (1.1 + uWave)) * .006 * uWave;
      vec3 p = vec3(cos(angle) * (uRadius + microWave), sin(angle) * (uRadius + microWave), 0.0);
      p = rotZ(uTilt.z) * rotY(uTilt.y) * rotX(uTilt.x) * p;
      p = rotY(-.24) * rotX(.34) * p;

      float cameraDistance = 3.28;
      float perspective = cameraDistance / max(.68, cameraDistance - p.z * .82);
      vec2 projected = p.xy * perspective * .69;

      vDepth = clamp((p.z + 1.35) / 2.70, 0.0, 1.0);
      vArc = aAngle / 6.283185307179586;
      vPulse = .72 + .28 * sin(uTime * 1.7 + aAngle * 3.0);
      gl_Position = vec4(projected, clamp(p.z * .18, -.92, .92), 1.0);
    }
  `;

  const ringFragment = `#version 300 es
    precision highp float;

    uniform vec3 uColor;
    uniform float uAlpha;
    uniform float uProgress;
    uniform float uDash;

    in float vDepth;
    in float vArc;
    in float vPulse;
    out vec4 outColor;

    void main() {
      float dash = 1.0;
      if (uDash > .5) {
        float cells = 20.0 + uDash * 14.0;
        float pattern = fract(vArc * cells);
        dash = smoothstep(.05, .12, pattern) * (1.0 - smoothstep(.64, .88, pattern));
      }

      float reveal = smoothstep(.035, .54, uProgress);
      float depthLight = .32 + vDepth * .82;
      float alpha = uAlpha * reveal * dash * depthLight * vPulse;
      vec3 color = uColor * (1.0 + vDepth * .36);
      outColor = vec4(color, alpha);
    }
  `;

  const sigilVertex = `#version 300 es
    precision highp float;
    layout(location=0) in vec4 aSigil;

    uniform float uTime;
    uniform float uProgress;
    uniform float uPixelScale;

    out float vAlpha;
    flat out float vTone;
    flat out float vGlyph;

    ${commonRotation}

    void main() {
      float angle = aSigil.x + uTime * aSigil.y;
      float radius = aSigil.z;
      float lane = aSigil.w;
      vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, 0.0);

      if (lane < .5) {
        p = rotX(.16 + sin(uTime * .18) * .04) * p;
      } else if (lane < 1.5) {
        p = rotX(.98) * rotZ(-.38 + sin(uTime * .12) * .08) * p;
      } else {
        p = rotY(-.92) * rotZ(.56 + cos(uTime * .14) * .07) * p;
      }

      p = rotY(-.24) * rotX(.34) * p;

      float cameraDistance = 3.28;
      float perspective = cameraDistance / max(.68, cameraDistance - p.z * .82);
      vec2 projected = p.xy * perspective * .69;
      float depth = clamp((p.z + 1.30) / 2.60, 0.0, 1.0);

      vAlpha = smoothstep(.20, .68, uProgress) * (.24 + depth * .82);
      vTone = lane;
      vGlyph = mod(float(gl_VertexID), 4.0);
      gl_PointSize = uPixelScale * perspective * (4.2 + uProgress * 3.4 + depth * 2.5);
      gl_Position = vec4(projected, clamp(p.z * .18, -.92, .92), 1.0);
    }
  `;

  const sigilFragment = `#version 300 es
    precision highp float;

    in float vAlpha;
    flat in float vTone;
    flat in float vGlyph;
    out vec4 outColor;

    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float ax = abs(p.x);
      float ay = abs(p.y);
      float r = length(p);

      float diamond = 1.0 - smoothstep(.58, .98, ax + ay);
      float crossShape = max(
        (1.0 - smoothstep(.12, .25, ax)) * (1.0 - smoothstep(.55, .95, ay)),
        (1.0 - smoothstep(.12, .25, ay)) * (1.0 - smoothstep(.55, .95, ax))
      );
      float ringShape = (1.0 - smoothstep(.07, .15, abs(r - .55))) * (1.0 - smoothstep(.86, 1.0, r));
      float chevron = 1.0 - smoothstep(.08, .18, abs(ay - (ax * .72 + .12)));
      chevron *= 1.0 - smoothstep(.68, .96, ax + ay * .40);

      float shape = diamond;
      if (vGlyph > .5 && vGlyph < 1.5) shape = crossShape;
      else if (vGlyph > 1.5 && vGlyph < 2.5) shape = ringShape;
      else if (vGlyph > 2.5) shape = chevron;

      if (shape <= .01) discard;

      vec3 cyan = vec3(.46, .90, 1.0);
      vec3 gold = vec3(1.0, .82, .38);
      vec3 violet = vec3(.76, .52, 1.0);
      vec3 color = vTone < .5 ? cyan : (vTone < 1.5 ? gold : violet);
      float core = pow(max(0.0, shape), 1.75);
      outColor = vec4(color * (1.0 + core * .38), shape * vAlpha * .92);
    }
  `;

  const latticeVertex = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 aPosition;

    uniform float uTime;
    uniform float uScale;
    uniform float uRotation;
    uniform vec3 uTilt;
    uniform float uPulse;

    out float vDepth;
    out float vEnergy;

    ${commonRotation}

    void main() {
      float breathe = 1.0 + sin(uTime * .82 + uPulse * 3.7) * .012 * uPulse;
      vec3 p = vec3(aPosition * uScale * breathe, 0.0);
      p = rotZ(uRotation) * p;
      p = rotZ(uTilt.z) * rotY(uTilt.y) * rotX(uTilt.x) * p;
      p = rotY(-.24) * rotX(.34) * p;

      float cameraDistance = 3.28;
      float perspective = cameraDistance / max(.68, cameraDistance - p.z * .82);
      vec2 projected = p.xy * perspective * .69;

      vDepth = clamp((p.z + 1.25) / 2.5, 0.0, 1.0);
      vEnergy = .78 + .22 * sin(uTime * 1.5 + length(aPosition) * 7.0 + uPulse);
      gl_Position = vec4(projected, clamp(p.z * .18, -.92, .92), 1.0);
    }
  `;

  const latticeFragment = `#version 300 es
    precision highp float;

    uniform vec3 uColor;
    uniform float uAlpha;
    uniform float uProgress;

    in float vDepth;
    in float vEnergy;
    out vec4 outColor;

    void main() {
      float reveal = smoothstep(.16, .78, uProgress);
      float alpha = uAlpha * reveal * (.28 + vDepth * .80) * vEnergy;
      outColor = vec4(uColor * (1.0 + vDepth * .28), alpha);
    }
  `;

  const veilVertex = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 aPosition;
    out vec2 vUv;
    void main() {
      vUv = aPosition * .5 + .5;
      gl_Position = vec4(aPosition, 0.95, 1.0);
    }
  `;

  const veilFragment = `#version 300 es
    precision highp float;

    uniform float uTime;
    uniform float uProgress;
    uniform float uComplete;

    in vec2 vUv;
    out vec4 outColor;

    const float TAU = 6.283185307179586;

    float circleLine(float r, float radius, float width) {
      return 1.0 - smoothstep(width, width * 2.4, abs(r - radius));
    }

    float radialTicks(float angle, float count, float phase, float width) {
      float cell = fract(angle / TAU * count + phase);
      float dist = abs(cell - .5);
      return 1.0 - smoothstep(width, width * 1.8, dist);
    }

    void main() {
      vec2 p = (vUv - .5) * 2.0;
      float r = length(p);
      float a = atan(p.y, p.x);
      float progress = smoothstep(.015, .44, uProgress);
      float completeBoost = mix(1.0, 1.32, uComplete);

      float ring0 = circleLine(r, .205, .0045);
      float ring1 = circleLine(r, .315, .0055);
      float ring2 = circleLine(r, .430, .0055);
      float ring3 = circleLine(r, .555, .0060);
      float ring4 = circleLine(r, .675, .0055);
      float ring5 = circleLine(r, .805, .0048);

      float tick24 = radialTicks(a + uTime * .055, 24.0, .0, .055);
      tick24 *= smoothstep(.37, .40, r) * (1.0 - smoothstep(.49, .52, r));

      float tick36 = radialTicks(a - uTime * .035, 36.0, .13, .040);
      tick36 *= smoothstep(.59, .62, r) * (1.0 - smoothstep(.73, .76, r));

      float tick72 = radialTicks(a + uTime * .022, 72.0, .31, .025);
      tick72 *= smoothstep(.755, .775, r) * (1.0 - smoothstep(.845, .865, r));

      float spokeA = pow(max(0.0, cos(a * 6.0 + uTime * .12)), 42.0);
      spokeA *= smoothstep(.22, .26, r) * (1.0 - smoothstep(.58, .62, r));
      float spokeB = pow(max(0.0, cos(a * 12.0 - uTime * .08)), 55.0);
      spokeB *= smoothstep(.42, .46, r) * (1.0 - smoothstep(.79, .83, r));

      float star6 = abs(cos(a * 3.0 + uTime * .04));
      star6 = pow(star6, 18.0) * (1.0 - smoothstep(.24, .48, r));
      float star8 = abs(cos(a * 4.0 - uTime * .03));
      star8 = pow(star8, 20.0) * smoothstep(.25, .31, r) * (1.0 - smoothstep(.49, .55, r));

      float rotatingArc = .5 + .5 * sin(a * 18.0 + uTime * .55);
      rotatingArc = smoothstep(.70, .92, rotatingArc);
      rotatingArc *= circleLine(r, .735, .014);

      float runeBand = radialTicks(a - uTime * .045, 48.0, .17, .075);
      runeBand *= smoothstep(.66, .69, r) * (1.0 - smoothstep(.72, .75, r));

      float center = pow(max(0.0, 1.0 - r * 2.35), 3.5);
      float innerHalo = pow(max(0.0, 1.0 - r * 1.55), 4.0);
      float outerHalo = pow(max(0.0, 1.0 - r), 5.4);
      float pulse = .78 + .22 * sin(uTime * 2.15);
      float wave = .82 + .18 * sin(uTime * 1.10 - r * 17.0);

      vec3 cyan = vec3(.27, .84, 1.0);
      vec3 violet = vec3(.62, .38, 1.0);
      vec3 gold = vec3(1.0, .77, .30);
      vec3 pearl = vec3(.90, .96, 1.0);

      vec3 color = cyan * (ring0 * .30 + ring2 * .23 + ring4 * .17 + tick24 * .15 + spokeB * .09);
      color += violet * (ring1 * .23 + ring3 * .22 + ring5 * .20 + tick72 * .13 + spokeA * .11 + rotatingArc * .14);
      color += gold * (tick36 * .16 + runeBand * .18 + star6 * .11 + star8 * .08);
      color += pearl * (center * .22 + innerHalo * .045);

      float alpha = ring0 * .20 + ring1 * .15 + ring2 * .17 + ring3 * .16 + ring4 * .13 + ring5 * .12;
      alpha += tick24 * .10 + tick36 * .10 + tick72 * .07 + spokeA * .07 + spokeB * .07;
      alpha += star6 * .07 + star8 * .06 + rotatingArc * .09 + runeBand * .10;
      alpha += center * .14 + innerHalo * .045 + outerHalo * .025;
      alpha *= progress * completeBoost * pulse * wave;

      outColor = vec4(color * completeBoost, alpha);
    }
  `;

  let ringProgram;
  let sigilProgram;
  let latticeProgram;
  let veilProgram;

  try {
    ringProgram = program(ringVertex, ringFragment);
    sigilProgram = program(sigilVertex, sigilFragment);
    latticeProgram = program(latticeVertex, latticeFragment);
    veilProgram = program(veilVertex, veilFragment);
  } catch (error) {
    console.error('[PLUTO ARK] GPU ritual initialization failed:', error);
    return;
  }

  const ringData = new Float32Array(RING_SEGMENTS + 1);
  for (let i = 0; i <= RING_SEGMENTS; i += 1) {
    ringData[i] = i / RING_SEGMENTS * TAU;
  }

  const ringVao = gl.createVertexArray();
  const ringBuffer = gl.createBuffer();
  gl.bindVertexArray(ringVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, ringBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ringData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 4, 0);

  const sigilData = new Float32Array(SIGIL_COUNT * 4);
  for (let i = 0; i < SIGIL_COUNT; i += 1) {
    const o = i * 4;
    const lane = i % 3;
    sigilData[o] = i / SIGIL_COUNT * TAU + seeded(i, 14) * .10;
    sigilData[o + 1] = (lane === 1 ? -1 : 1) * (.040 + seeded(i, 15) * .044);
    sigilData[o + 2] = .47 + lane * .17 + seeded(i, 16) * .075;
    sigilData[o + 3] = lane;
  }

  const sigilVao = gl.createVertexArray();
  const sigilBuffer = gl.createBuffer();
  gl.bindVertexArray(sigilVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, sigilBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sigilData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 4 * 4, 0);

  const lattice = [];
  function pushSegment(ax, ay, bx, by) {
    lattice.push(ax, ay, bx, by);
  }
  function pointOnCircle(index, count, radius = 1, offset = -Math.PI / 2) {
    const angle = offset + index * TAU / count;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  }

  for (let i = 0; i < 12; i += 1) {
    const a = pointOnCircle(i, 12, 1);
    const b = pointOnCircle(i + 1, 12, 1);
    const c = pointOnCircle(i + 5, 12, 1);
    pushSegment(a[0], a[1], b[0], b[1]);
    pushSegment(a[0], a[1], c[0], c[1]);
  }
  for (let i = 0; i < 6; i += 1) {
    const a = pointOnCircle(i, 6, .58);
    const b = pointOnCircle(i + 1, 6, .58);
    pushSegment(a[0], a[1], b[0], b[1]);
    pushSegment(-a[0], -a[1], a[0], a[1]);
  }
  for (let i = 0; i < 4; i += 1) {
    const a = pointOnCircle(i, 4, .34, Math.PI / 4);
    const b = pointOnCircle(i + 1, 4, .34, Math.PI / 4);
    pushSegment(a[0], a[1], b[0], b[1]);
  }

  const latticeData = new Float32Array(lattice);
  const latticeVao = gl.createVertexArray();
  const latticeBuffer = gl.createBuffer();
  gl.bindVertexArray(latticeVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, latticeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, latticeData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0);

  const veilData = new Float32Array([
    -1,-1, 1,-1, 1,1,
    -1,-1, 1,1, -1,1
  ]);
  const veilVao = gl.createVertexArray();
  const veilBuffer = gl.createBuffer();
  gl.bindVertexArray(veilVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, veilBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, veilData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0);
  gl.bindVertexArray(null);

  const ringUniforms = {
    time: gl.getUniformLocation(ringProgram, 'uTime'),
    radius: gl.getUniformLocation(ringProgram, 'uRadius'),
    rotation: gl.getUniformLocation(ringProgram, 'uRotation'),
    tilt: gl.getUniformLocation(ringProgram, 'uTilt'),
    progress: gl.getUniformLocation(ringProgram, 'uProgress'),
    wave: gl.getUniformLocation(ringProgram, 'uWave'),
    color: gl.getUniformLocation(ringProgram, 'uColor'),
    alpha: gl.getUniformLocation(ringProgram, 'uAlpha'),
    dash: gl.getUniformLocation(ringProgram, 'uDash')
  };

  const sigilUniforms = {
    time: gl.getUniformLocation(sigilProgram, 'uTime'),
    progress: gl.getUniformLocation(sigilProgram, 'uProgress'),
    pixelScale: gl.getUniformLocation(sigilProgram, 'uPixelScale')
  };

  const latticeUniforms = {
    time: gl.getUniformLocation(latticeProgram, 'uTime'),
    scale: gl.getUniformLocation(latticeProgram, 'uScale'),
    rotation: gl.getUniformLocation(latticeProgram, 'uRotation'),
    tilt: gl.getUniformLocation(latticeProgram, 'uTilt'),
    pulse: gl.getUniformLocation(latticeProgram, 'uPulse'),
    color: gl.getUniformLocation(latticeProgram, 'uColor'),
    alpha: gl.getUniformLocation(latticeProgram, 'uAlpha'),
    progress: gl.getUniformLocation(latticeProgram, 'uProgress')
  };

  const veilUniforms = {
    time: gl.getUniformLocation(veilProgram, 'uTime'),
    progress: gl.getUniformLocation(veilProgram, 'uProgress'),
    complete: gl.getUniformLocation(veilProgram, 'uComplete')
  };

  const rings = [
    { radius: .34, tilt: [.02,.02,0], speed: .24, phase: .0, color: [.62,.90,1], alpha: .28, dash: 0, wave: .3 },
    { radius: .43, tilt: [.18,-.12,.16], speed: -.20, phase: .7, color: [.48,.84,1], alpha: .26, dash: 1.0, wave: .7 },
    { radius: .52, tilt: [.74,.20,-.30], speed: .17, phase: 1.4, color: [.76,.58,1], alpha: .24, dash: 0, wave: .4 },
    { radius: .61, tilt: [1.02,-.18,.42], speed: -.145, phase: 2.1, color: [1,.80,.38], alpha: .20, dash: 1.5, wave: .9 },
    { radius: .70, tilt: [-.66,.74,.52], speed: .125, phase: .3, color: [.55,.82,1], alpha: .19, dash: 2.0, wave: .5 },
    { radius: .79, tilt: [.34,-.86,-.62], speed: -.105, phase: 1.1, color: [.72,.50,1], alpha: .17, dash: 2.4, wave: .8 },
    { radius: .88, tilt: [1.08,.58,.18], speed: .086, phase: 2.7, color: [1,.76,.34], alpha: .15, dash: 2.8, wave: .5 },
    { radius: .97, tilt: [.18,.98,-.34], speed: -.070, phase: 1.8, color: [.42,.80,1], alpha: .14, dash: 3.2, wave: 1.0 },
    { radius: 1.06, tilt: [-.42,.38,.78], speed: .057, phase: .5, color: [.72,.48,1], alpha: .12, dash: 3.6, wave: .6 },
    { radius: 1.14, tilt: [.12,.08,.0], speed: -.045, phase: 2.3, color: [.46,.74,1], alpha: .10, dash: 4.0, wave: .3 }
  ];

  const latticeLayers = [
    { scale: .49, tilt: [.06,.02,0], speed: .13, phase: .0, color: [.46,.88,1], alpha: .16, pulse: .2 },
    { scale: .66, tilt: [.84,.22,-.35], speed: -.095, phase: .8, color: [.77,.55,1], alpha: .13, pulse: .8 },
    { scale: .82, tilt: [-.62,.78,.44], speed: .073, phase: 1.6, color: [1,.77,.35], alpha: .105, pulse: 1.3 },
    { scale: .98, tilt: [.32,-.82,-.56], speed: -.052, phase: 2.2, color: [.45,.78,1], alpha: .09, pulse: 1.8 }
  ];

  gl.viewport(0, 0, GPU_SIZE, GPU_SIZE);
  gl.clearColor(0, 0, 0, 0);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  let available = true;
  gpuCanvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    available = false;
  });

  function drawRingLayer(ring, index, time, progress, complete) {
    const localGate = clampValue((progress - index * .035) / Math.max(.001, 1 - index * .035), 0, 1);
    if (localGate <= .002) return;

    const precess = reducedMotion ? 0 : Math.sin(time * (.07 + index * .008) + ring.phase) * .045;
    const tiltX = ring.tilt[0] + precess;
    const tiltY = ring.tilt[1] + Math.cos(time * (.05 + index * .006) + ring.phase) * .035;
    const rotation = ring.phase + time * ring.speed;
    const alpha = ring.alpha * (.58 + localGate * .72) * (complete ? 1.18 : 1);

    gl.uniform1f(ringUniforms.radius, ring.radius);
    gl.uniform1f(ringUniforms.rotation, rotation);
    gl.uniform3f(ringUniforms.tilt, tiltX, tiltY, ring.tilt[2]);
    gl.uniform3f(ringUniforms.color, ring.color[0], ring.color[1], ring.color[2]);
    gl.uniform1f(ringUniforms.alpha, alpha);
    gl.uniform1f(ringUniforms.dash, ring.dash);
    gl.uniform1f(ringUniforms.wave, ring.wave);
    gl.drawArrays(gl.LINE_STRIP, 0, RING_SEGMENTS + 1);

    // A faint neighboring pass makes the ring look optically thicker/bloomed
    // without relying on non-portable wide WebGL line widths.
    gl.uniform1f(ringUniforms.radius, ring.radius * 1.0055);
    gl.uniform1f(ringUniforms.alpha, alpha * .30);
    gl.drawArrays(gl.LINE_STRIP, 0, RING_SEGMENTS + 1);
  }

  function renderGpu(timeMs, progress, complete) {
    if (!available) return false;

    const time = timeMs * .001;
    const completed = complete ? 1 : 0;
    const pixelScale = GPU_SIZE / 640;

    gl.viewport(0, 0, GPU_SIZE, GPU_SIZE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // High-density procedural base: concentric glyph bands, ticks, spokes,
    // rotating arcs, stars and central resonance.
    gl.useProgram(veilProgram);
    gl.uniform1f(veilUniforms.time, time);
    gl.uniform1f(veilUniforms.progress, progress);
    gl.uniform1f(veilUniforms.complete, completed);
    gl.bindVertexArray(veilVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Four 3D geometric lattice planes intersect through the center.
    gl.useProgram(latticeProgram);
    gl.uniform1f(latticeUniforms.time, time);
    gl.uniform1f(latticeUniforms.progress, progress);
    gl.bindVertexArray(latticeVao);
    latticeLayers.forEach(layer => {
      gl.uniform1f(latticeUniforms.scale, layer.scale);
      gl.uniform1f(latticeUniforms.rotation, layer.phase + time * layer.speed);
      gl.uniform3f(latticeUniforms.tilt, layer.tilt[0], layer.tilt[1], layer.tilt[2]);
      gl.uniform1f(latticeUniforms.pulse, layer.pulse);
      gl.uniform3f(latticeUniforms.color, layer.color[0], layer.color[1], layer.color[2]);
      gl.uniform1f(latticeUniforms.alpha, layer.alpha * (complete ? 1.18 : 1));
      gl.drawArrays(gl.LINES, 0, latticeData.length / 2);
    });

    // Ten independently tilted, precessing gyroscopic rings.
    gl.useProgram(ringProgram);
    gl.uniform1f(ringUniforms.time, time);
    gl.uniform1f(ringUniforms.progress, progress);
    gl.bindVertexArray(ringVao);
    rings.forEach((ring, index) => drawRingLayer(ring, index, time, progress, complete));

    // Orbiting rune/glyph field spread across three 3D planes.
    gl.useProgram(sigilProgram);
    gl.uniform1f(sigilUniforms.time, time);
    gl.uniform1f(sigilUniforms.progress, progress);
    gl.uniform1f(sigilUniforms.pixelScale, pixelScale);
    gl.bindVertexArray(sigilVao);
    gl.drawArrays(gl.POINTS, 0, SIGIL_COUNT);

    gl.bindVertexArray(null);
    return true;
  }

  drawRitual = function drawRitualGpu(time) {
    const progress = clampValue(ritualTime / RITUAL_DURATION, 0, 1);
    if (progress <= 0) return;

    if (!renderGpu(time, progress, ritualComplete)) {
      if (previousDrawRitual) previousDrawRitual(time);
      return;
    }

    const pulse = .5 + .5 * Math.sin(time * .00215);
    const completeScale = ritualComplete ? 1.045 + pulse * .018 : 1;
    const activationScale = .93 + progress * .07;
    const size = DISPLAY_SIZE * completeScale * activationScale;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .88 + progress * .12;
    ctx.drawImage(
      gpuCanvas,
      score.x - size * .5,
      score.y - size * .5,
      size,
      size
    );

    // Completion bloom remains on the world canvas so it sits naturally under
    // the existing fog/light pass while the geometry itself stays GPU-driven.
    if (ritualComplete) {
      const haloRadius = size * (.37 + pulse * .025);
      const halo = ctx.createRadialGradient(score.x, score.y, 6, score.x, score.y, haloRadius);
      halo.addColorStop(0, `rgba(206,236,255,${.075 + pulse * .035})`);
      halo.addColorStop(.34, `rgba(154,120,255,${.040 + pulse * .025})`);
      halo.addColorStop(.68, `rgba(255,211,105,${.015 + pulse * .010})`);
      halo.addColorStop(1, 'rgba(100,80,220,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(score.x, score.y, haloRadius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };
})();