// GPU ritual renderer for Pluto Ark.
// Renders a layered 3D gyroscopic magic circle and orbiting sigils in WebGL2,
// then composites it into the existing Ark canvas while preserving gameplay,
// fog, Pluto and player draw order.

(() => {
  'use strict';

  const previousDrawRitual = typeof drawRitual === 'function' ? drawRitual : null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gpuCanvas = document.createElement('canvas');
  const isCompact = Math.min(window.innerWidth, window.innerHeight) < 720;
  const GPU_SIZE = reducedMotion ? 512 : (isCompact ? 640 : 896);
  const SIGIL_COUNT = reducedMotion ? 42 : 96;
  const DISPLAY_SIZE = 470;
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

  const ringVertex = `#version 300 es
    precision highp float;

    layout(location=0) in float aAngle;

    uniform float uTime;
    uniform float uRadius;
    uniform float uRotation;
    uniform vec3 uTilt;
    uniform float uProgress;

    out float vDepth;
    out float vArc;

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

    void main() {
      float angle = aAngle + uRotation + uTime * .12;
      vec3 p = vec3(cos(angle) * uRadius, sin(angle) * uRadius, 0.0);
      p = rotZ(uTilt.z) * rotY(uTilt.y) * rotX(uTilt.x) * p;
      p = rotY(-.24) * rotX(.34) * p;

      float cameraDistance = 3.35;
      float perspective = cameraDistance / max(.72, cameraDistance - p.z * .76);
      vec2 projected = p.xy * perspective * .70;

      vDepth = clamp((p.z + 1.2) / 2.4, 0.0, 1.0);
      vArc = aAngle / 6.283185307179586;
      gl_Position = vec4(projected, clamp(p.z * .20, -.92, .92), 1.0);
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
    out vec4 outColor;

    void main() {
      float dash = 1.0;
      if (uDash > .5) {
        float pattern = fract(vArc * (18.0 + uDash * 18.0));
        dash = smoothstep(.08, .18, pattern) * (1.0 - smoothstep(.68, .90, pattern));
      }
      float reveal = smoothstep(.08, .62, uProgress);
      float alpha = uAlpha * reveal * dash * (.28 + vDepth * .72);
      outColor = vec4(uColor, alpha);
    }
  `;

  const sigilVertex = `#version 300 es
    precision highp float;

    layout(location=0) in vec4 aSigil;

    uniform float uTime;
    uniform float uProgress;
    uniform float uPixelScale;

    out float vAlpha;
    out float vTone;

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

    void main() {
      float angle = aSigil.x + uTime * aSigil.y;
      float radius = aSigil.z;
      float lane = aSigil.w;
      vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, 0.0);

      if (lane < .5) {
        p = rotX(.18) * p;
      } else if (lane < 1.5) {
        p = rotX(.94) * rotZ(-.34) * p;
      } else {
        p = rotY(-.86) * rotZ(.52) * p;
      }

      p = rotY(-.24) * rotX(.34) * p;

      float cameraDistance = 3.35;
      float perspective = cameraDistance / max(.72, cameraDistance - p.z * .76);
      vec2 projected = p.xy * perspective * .70;
      float depth = clamp((p.z + 1.2) / 2.4, 0.0, 1.0);

      vAlpha = smoothstep(.30, .74, uProgress) * (.25 + depth * .75);
      vTone = lane / 2.0;
      gl_PointSize = uPixelScale * perspective * (2.6 + uProgress * 2.6 + depth * 1.7);
      gl_Position = vec4(projected, clamp(p.z * .20, -.92, .92), 1.0);
    }
  `;

  const sigilFragment = `#version 300 es
    precision highp float;

    in float vAlpha;
    in float vTone;
    out vec4 outColor;

    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float diamond = abs(p.x) + abs(p.y);
      if (diamond > 1.0) discard;
      float edge = pow(max(0.0, 1.0 - diamond), .72);
      float core = pow(max(0.0, 1.0 - diamond * 2.1), 2.5);
      vec3 cyan = vec3(.48, .86, 1.0);
      vec3 gold = vec3(1.0, .86, .48);
      vec3 violet = vec3(.72, .56, 1.0);
      vec3 color = vTone < .33 ? cyan : (vTone < .70 ? gold : violet);
      outColor = vec4(color, (edge * .56 + core) * vAlpha);
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

    void main() {
      vec2 p = (vUv - .5) * 2.0;
      float r = length(p);
      float angle = atan(p.y, p.x);
      float progress = smoothstep(.02, .46, uProgress);

      float ringA = 1.0 - smoothstep(.009, .024, abs(r - .43));
      float ringB = 1.0 - smoothstep(.008, .020, abs(r - .58));
      float ringC = 1.0 - smoothstep(.006, .017, abs(r - .72));
      float spokes = pow(max(0.0, cos(angle * 12.0 + uTime * .18)), 32.0);
      spokes *= smoothstep(.29, .34, r) * (1.0 - smoothstep(.70, .76, r));
      float star = abs(cos(angle * 3.0)) * .5 + abs(sin(angle * 4.0)) * .5;
      star = pow(star, 13.0) * (1.0 - smoothstep(.24, .47, r));

      float center = pow(max(0.0, 1.0 - r * 2.0), 3.0);
      float halo = pow(max(0.0, 1.0 - r), 3.4);
      float pulse = .72 + .28 * sin(uTime * 1.85);

      vec3 violet = vec3(.52, .38, 1.0);
      vec3 cyan = vec3(.28, .78, 1.0);
      vec3 gold = vec3(1.0, .82, .42);

      vec3 color = violet * (ringA * .24 + ringC * .15 + halo * .055);
      color += cyan * (ringB * .22 + spokes * .13 + center * .15);
      color += gold * star * .085;

      float alpha = (ringA * .16 + ringB * .14 + ringC * .10 + spokes * .08 + star * .07 + halo * .055 + center * .10);
      alpha *= progress * mix(.80, 1.22, uComplete) * pulse;
      outColor = vec4(color, alpha);
    }
  `;

  let ringProgram;
  let sigilProgram;
  let veilProgram;

  try {
    ringProgram = program(ringVertex, ringFragment);
    sigilProgram = program(sigilVertex, sigilFragment);
    veilProgram = program(veilVertex, veilFragment);
  } catch (error) {
    console.error('[PLUTO ARK] GPU ritual initialization failed:', error);
    return;
  }

  const RING_SEGMENTS = 320;
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
    sigilData[o] = i / SIGIL_COUNT * TAU + seeded(i, 14) * .12;
    sigilData[o + 1] = (lane === 1 ? -1 : 1) * (.055 + seeded(i, 15) * .055);
    sigilData[o + 2] = .55 + lane * .16 + seeded(i, 16) * .055;
    sigilData[o + 3] = lane;
  }

  const sigilVao = gl.createVertexArray();
  const sigilBuffer = gl.createBuffer();
  gl.bindVertexArray(sigilVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, sigilBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sigilData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 4 * 4, 0);

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
    color: gl.getUniformLocation(ringProgram, 'uColor'),
    alpha: gl.getUniformLocation(ringProgram, 'uAlpha'),
    dash: gl.getUniformLocation(ringProgram, 'uDash')
  };

  const sigilUniforms = {
    time: gl.getUniformLocation(sigilProgram, 'uTime'),
    progress: gl.getUniformLocation(sigilProgram, 'uProgress'),
    pixelScale: gl.getUniformLocation(sigilProgram, 'uPixelScale')
  };

  const veilUniforms = {
    time: gl.getUniformLocation(veilProgram, 'uTime'),
    progress: gl.getUniformLocation(veilProgram, 'uProgress'),
    complete: gl.getUniformLocation(veilProgram, 'uComplete')
  };

  const rings = [
    { radius: .48, tilt: [.08, .02, 0], speed: .17, phase: .1, color: [.42,.82,1], alpha: .24, dash: 0 },
    { radius: .60, tilt: [.88, .12, -.31], speed: -.13, phase: 1.2, color: [.67,.54,1], alpha: .22, dash: 1 },
    { radius: .70, tilt: [-.62, .72, .46], speed: .11, phase: 2.1, color: [.97,.78,.40], alpha: .15, dash: 1.7 },
    { radius: .80, tilt: [.28, -.78, -.58], speed: -.08, phase: .7, color: [.38,.78,1], alpha: .15, dash: 2.2 },
    { radius: .91, tilt: [1.02, .52, .14], speed: .065, phase: 2.7, color: [.70,.48,1], alpha: .12, dash: 2.7 },
    { radius: 1.02, tilt: [.18, .16, .0], speed: -.05, phase: 1.9, color: [.45,.73,1], alpha: .09, dash: 3.1 }
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

  function renderGpu(timeMs, progress, complete) {
    if (!available) return false;

    const time = timeMs * .001;
    const completed = complete ? 1 : 0;
    const pixelScale = GPU_SIZE / 640;

    gl.viewport(0, 0, GPU_SIZE, GPU_SIZE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Procedural ground sigil and central resonance veil.
    gl.useProgram(veilProgram);
    gl.uniform1f(veilUniforms.time, time);
    gl.uniform1f(veilUniforms.progress, progress);
    gl.uniform1f(veilUniforms.complete, completed);
    gl.bindVertexArray(veilVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Independently tilted gyroscopic rings.
    gl.useProgram(ringProgram);
    gl.uniform1f(ringUniforms.time, time);
    gl.uniform1f(ringUniforms.progress, progress);
    gl.bindVertexArray(ringVao);
    rings.forEach((ring, index) => {
      const localGate = clamp((progress - index * .055) / Math.max(.001, 1 - index * .055), 0, 1);
      if (localGate <= .002) return;
      gl.uniform1f(ringUniforms.radius, ring.radius);
      gl.uniform1f(ringUniforms.rotation, ring.phase + time * ring.speed);
      gl.uniform3f(ringUniforms.tilt, ring.tilt[0], ring.tilt[1], ring.tilt[2]);
      gl.uniform3f(ringUniforms.color, ring.color[0], ring.color[1], ring.color[2]);
      gl.uniform1f(ringUniforms.alpha, ring.alpha * (.56 + localGate * .66) * (complete ? 1.12 : 1));
      gl.uniform1f(ringUniforms.dash, ring.dash);
      gl.drawArrays(gl.LINE_STRIP, 0, RING_SEGMENTS + 1);
    });

    // Rune-like orbiting diamonds distributed through three different planes.
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
    const progress = clamp(ritualTime / RITUAL_DURATION, 0, 1);
    if (progress <= 0) return;

    if (!renderGpu(time, progress, ritualComplete)) {
      if (previousDrawRitual) previousDrawRitual(time);
      return;
    }

    const pulse = .5 + .5 * Math.sin(time * .0022);
    const completeScale = ritualComplete ? 1.035 + pulse * .012 : 1;
    const size = DISPLAY_SIZE * completeScale;

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
    ctx.restore();
  };
})();
