// Direct GPU ritual renderer for Pluto Ark.
// The WebGL canvas is composited by the browser as its own layer, avoiding the
// old WebGL -> Canvas2D drawImage transfer that caused uneven frame pacing.

(() => {
  'use strict';

  const previousDrawRitual = typeof drawRitual === 'function' ? drawRitual : null;
  const gameCanvas = document.getElementById('arkCanvas');
  const wrap = gameCanvas && gameCanvas.closest('.canvas-wrap');
  if (!gameCanvas || !wrap) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compact = Math.min(window.innerWidth, window.innerHeight) < 720;
  const GPU_SIZE = reducedMotion ? 512 : (compact ? 704 : 896);
  const SIGIL_COUNT = reducedMotion ? 72 : (compact ? 132 : 192);
  const RING_SEGMENTS = reducedMotion ? 256 : 448;
  const DISPLAY_SIZE = compact ? 470 : 550;
  const TAU = Math.PI * 2;

  const gpuCanvas = document.createElement('canvas');
  gpuCanvas.className = 'ark-ritual-gpu-layer';
  gpuCanvas.width = GPU_SIZE;
  gpuCanvas.height = GPU_SIZE;
  gpuCanvas.setAttribute('aria-hidden', 'true');
  Object.assign(gpuCanvas.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '1px',
    height: '1px',
    zIndex: '4',
    pointerEvents: 'none',
    transformOrigin: '0 0',
    willChange: 'transform, opacity',
    mixBlendMode: 'screen',
    opacity: '0',
    contain: 'layout paint style',
    backfaceVisibility: 'hidden'
  });
  wrap.appendChild(gpuCanvas);

  const gl = gpuCanvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    desynchronized: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    gpuCanvas.remove();
    console.warn('[PLUTO ARK] WebGL2 ritual layer unavailable; Canvas fallback remains active.');
    return;
  }

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed.';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function makeProgram(vertexSource, fragmentSource) {
    const p = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, vertexSource);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(p) || 'Program link failed.';
      gl.deleteProgram(p);
      throw new Error(message);
    }
    return p;
  }

  const commonRotation = `
    mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
    mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
    mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
  `;

  const ringVertex = `#version 300 es
    precision highp float;
    layout(location=0) in float aAngle;
    uniform float uTime;
    uniform float uRadius;
    uniform float uRotation;
    uniform vec3 uTilt;
    uniform float uPrecess;
    out float vDepth;
    out float vArc;
    ${commonRotation}
    void main(){
      float angle=aAngle+uRotation;
      vec3 p=vec3(cos(angle)*uRadius,sin(angle)*uRadius,0.0);
      vec3 tilt=uTilt+vec3(sin(uTime*.19+uPrecess)*.045,cos(uTime*.13+uPrecess)*.038,0.0);
      p=rotZ(tilt.z)*rotY(tilt.y)*rotX(tilt.x)*p;
      p=rotY(-.24)*rotX(.34)*p;
      float cd=3.35;
      float persp=cd/max(.72,cd-p.z*.76);
      gl_Position=vec4(p.xy*persp*.70,clamp(p.z*.20,-.92,.92),1.0);
      vDepth=clamp((p.z+1.25)/2.5,0.0,1.0);
      vArc=aAngle/6.28318530718;
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
    void main(){
      float dash=1.0;
      if(uDash>.5){
        float f=fract(vArc*(18.0+uDash*16.0));
        dash=smoothstep(.05,.16,f)*(1.0-smoothstep(.66,.91,f));
      }
      float reveal=smoothstep(.035,.60,uProgress);
      float shimmer=.76+.24*sin(vArc*31.0+uProgress*9.0);
      float alpha=uAlpha*reveal*dash*(.24+vDepth*.76)*shimmer;
      outColor=vec4(uColor,alpha);
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
    out float vShape;
    ${commonRotation}
    void main(){
      float lane=mod(aSigil.w,4.0);
      float angle=aSigil.x+uTime*aSigil.y;
      float radius=aSigil.z;
      vec3 p=vec3(cos(angle)*radius,sin(angle)*radius,0.0);
      if(lane<.5) p=rotX(.18)*p;
      else if(lane<1.5) p=rotX(.98)*rotZ(-.35)*p;
      else if(lane<2.5) p=rotY(-.88)*rotZ(.54)*p;
      else p=rotX(-.62)*rotY(.70)*p;
      p=rotY(-.24)*rotX(.34)*p;
      float cd=3.35;
      float persp=cd/max(.72,cd-p.z*.76);
      gl_Position=vec4(p.xy*persp*.70,clamp(p.z*.20,-.92,.92),1.0);
      float depth=clamp((p.z+1.2)/2.4,0.0,1.0);
      vAlpha=smoothstep(.18,.70,uProgress)*(.23+depth*.77);
      vTone=lane/3.0;
      vShape=mod(floor(aSigil.w/4.0),4.0);
      gl_PointSize=uPixelScale*persp*(3.0+uProgress*3.4+depth*2.0);
    }
  `;

  const sigilFragment = `#version 300 es
    precision highp float;
    in float vAlpha;
    in float vTone;
    in float vShape;
    out vec4 outColor;
    void main(){
      vec2 p=gl_PointCoord*2.0-1.0;
      float ax=abs(p.x), ay=abs(p.y), d=length(p);
      float mask=0.0;
      if(vShape<.5){
        mask=1.0-smoothstep(.70,1.0,ax+ay);
      }else if(vShape<1.5){
        mask=max(exp(-ax*14.0)*(1.0-smoothstep(.35,1.0,ay)),exp(-ay*14.0)*(1.0-smoothstep(.35,1.0,ax)));
      }else if(vShape<2.5){
        mask=1.0-smoothstep(.10,.24,abs(d-.58));
      }else{
        float chevron=abs(ay-(.50-ax*.48));
        mask=(1.0-smoothstep(.04,.15,chevron))*(1.0-smoothstep(.82,1.0,ax));
      }
      if(mask<.015) discard;
      vec3 cyan=vec3(.38,.86,1.0);
      vec3 violet=vec3(.72,.52,1.0);
      vec3 gold=vec3(1.0,.82,.38);
      vec3 pearl=vec3(.90,.96,1.0);
      vec3 color=vTone<.27?cyan:(vTone<.55?gold:(vTone<.82?violet:pearl));
      outColor=vec4(color,mask*vAlpha*.78);
    }
  `;

  const veilVertex = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 aPosition;
    out vec2 vUv;
    void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,.96,1.0);}
  `;

  const veilFragment = `#version 300 es
    precision highp float;
    uniform float uTime;
    uniform float uProgress;
    uniform float uComplete;
    in vec2 vUv;
    out vec4 outColor;

    float ring(float r,float at,float w){return 1.0-smoothstep(w,w*2.25,abs(r-at));}
    float band(float r,float lo,float hi){return smoothstep(lo,lo+.012,r)*(1.0-smoothstep(hi-.012,hi,r));}

    void main(){
      vec2 p=(vUv-.5)*2.0;
      float r=length(p);
      float a=atan(p.y,p.x);
      float prog=smoothstep(.015,.46,uProgress);
      float t=uTime;

      float rings=0.0;
      rings+=ring(r,.18,.005)*.80;
      rings+=ring(r,.29,.006)*.72;
      rings+=ring(r,.41,.006)*.88;
      rings+=ring(r,.53,.006)*.62;
      rings+=ring(r,.65,.005)*.82;
      rings+=ring(r,.78,.006)*.60;
      rings+=ring(r,.90,.005)*.72;

      float spokes12=pow(max(0.0,cos(a*12.0+t*.12)),30.0)*band(r,.22,.86);
      float spokes24=pow(max(0.0,cos(a*24.0-t*.09)),44.0)*band(r,.46,.92);
      float spokes36=pow(max(0.0,cos(a*36.0+t*.055)),58.0)*band(r,.64,.94);

      float ticks72=step(.74,fract((a/6.28318530718+t*.018)*72.0))*band(r,.86,.94);
      float ticks48=step(.80,fract((-a/6.28318530718+t*.015)*48.0))*band(r,.69,.77);

      float petals=pow(abs(cos(a*6.0+t*.10)),13.0)*band(r,.31,.56);
      float star6=1.0-smoothstep(.018,.050,abs(r-(.24+.055*cos(a*6.0-t*.16))));
      float star8=1.0-smoothstep(.015,.043,abs(r-(.43+.060*cos(a*8.0+t*.10))));

      float arcs=0.0;
      float arcPattern=fract((a/6.28318530718)+t*.025+r*.85);
      arcs+=(1.0-smoothstep(.05,.13,abs(arcPattern-.25)))*band(r,.56,.61);
      arcs+=(1.0-smoothstep(.05,.13,abs(fract(arcPattern+.47)-.25)))*band(r,.80,.84);

      float core=pow(max(0.0,1.0-r*2.2),3.2);
      float halo=pow(max(0.0,1.0-r),3.6);
      float pulse=.78+.22*sin(t*1.65);

      vec3 cyan=vec3(.26,.78,1.0);
      vec3 violet=vec3(.57,.38,1.0);
      vec3 gold=vec3(1.0,.79,.34);
      vec3 pearl=vec3(.82,.94,1.0);

      vec3 color=violet*(rings*.21+halo*.040+star8*.085);
      color+=cyan*(spokes12*.13+spokes24*.10+star6*.10+core*.13);
      color+=gold*(spokes36*.065+ticks48*.13+ticks72*.15+petals*.055);
      color+=pearl*arcs*.075;

      float alpha=rings*.13+spokes12*.07+spokes24*.06+spokes36*.045+ticks48*.07+ticks72*.08+petals*.04+star6*.06+star8*.055+arcs*.045+halo*.028+core*.09;
      alpha*=prog*mix(.82,1.24,uComplete)*pulse;
      outColor=vec4(color,alpha);
    }
  `;

  let ringProgram, sigilProgram, veilProgram;
  try {
    ringProgram = makeProgram(ringVertex, ringFragment);
    sigilProgram = makeProgram(sigilVertex, sigilFragment);
    veilProgram = makeProgram(veilVertex, veilFragment);
  } catch (error) {
    gpuCanvas.remove();
    console.error('[PLUTO ARK] GPU ritual initialization failed:', error);
    return;
  }

  const ringAngles = new Float32Array(RING_SEGMENTS + 1);
  for (let i = 0; i <= RING_SEGMENTS; i += 1) ringAngles[i] = i / RING_SEGMENTS * TAU;
  const ringVao = gl.createVertexArray();
  const ringBuffer = gl.createBuffer();
  gl.bindVertexArray(ringVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, ringBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ringAngles, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 4, 0);

  const sigils = new Float32Array(SIGIL_COUNT * 4);
  for (let i = 0; i < SIGIL_COUNT; i += 1) {
    const lane = i % 4;
    const o = i * 4;
    const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
    const rnd = seed - Math.floor(seed);
    sigils[o] = i / SIGIL_COUNT * TAU + rnd * .10;
    sigils[o + 1] = (lane % 2 ? -1 : 1) * (.045 + (i % 13) * .0028);
    sigils[o + 2] = .46 + lane * .135 + (i % 7) * .006;
    sigils[o + 3] = lane + (i % 4) * 4;
  }
  const sigilVao = gl.createVertexArray();
  const sigilBuffer = gl.createBuffer();
  gl.bindVertexArray(sigilVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, sigilBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sigils, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);

  const quad = new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]);
  const veilVao = gl.createVertexArray();
  const veilBuffer = gl.createBuffer();
  gl.bindVertexArray(veilVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, veilBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);

  const ringUniforms = {
    time: gl.getUniformLocation(ringProgram, 'uTime'),
    radius: gl.getUniformLocation(ringProgram, 'uRadius'),
    rotation: gl.getUniformLocation(ringProgram, 'uRotation'),
    tilt: gl.getUniformLocation(ringProgram, 'uTilt'),
    precess: gl.getUniformLocation(ringProgram, 'uPrecess'),
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
    {r:.36,t:[.04,.02,0],s:.20,p:.1,c:[.44,.88,1],a:.25,d:0},
    {r:.45,t:[.66,.20,-.18],s:-.16,p:1.1,c:[.70,.55,1],a:.22,d:1},
    {r:.53,t:[-.58,.68,.34],s:.14,p:2.1,c:[1,.80,.38],a:.18,d:1.6},
    {r:.60,t:[.20,-.82,-.42],s:-.12,p:.7,c:[.38,.82,1],a:.17,d:2.0},
    {r:.68,t:[.96,.48,.12],s:.10,p:2.8,c:[.76,.50,1],a:.15,d:2.4},
    {r:.76,t:[-.78,-.32,.76],s:-.085,p:1.6,c:[.45,.76,1],a:.14,d:2.8},
    {r:.84,t:[.38,.92,-.58],s:.072,p:3.3,c:[1,.73,.34],a:.12,d:3.0},
    {r:.92,t:[1.10,-.26,.44],s:-.061,p:2.2,c:[.66,.49,1],a:.11,d:3.3},
    {r:1.00,t:[-.28,.60,.98],s:.052,p:.4,c:[.34,.77,1],a:.095,d:3.6},
    {r:1.08,t:[.14,.10,0],s:-.044,p:1.9,c:[.54,.68,1],a:.085,d:3.9}
  ];

  gl.viewport(0, 0, GPU_SIZE, GPU_SIZE);
  gl.clearColor(0, 0, 0, 0);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  let available = true;
  let lastCssSize = 0;
  gpuCanvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    available = false;
    gpuCanvas.style.opacity = '0';
  });

  function fogVisibility() {
    const dist = Math.hypot(player.x - score.x, player.y - score.y);
    if (dist <= 155) return 1;
    if (dist <= 255) return 1 - (dist - 155) / 100 * .12;
    if (dist <= 390) return .88 - (dist - 255) / 135 * .56;
    return .22;
  }

  function placeLayer(progress) {
    const rect = gameCanvas.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const sx = rect.width / Math.max(1, camera.w);
    const sy = rect.height / Math.max(1, camera.h);
    const centerX = rect.left - wrapRect.left + (score.x - camera.x) * sx;
    const centerY = rect.top - wrapRect.top + (score.y - camera.y) * sy;
    const cssSize = DISPLAY_SIZE * (sx + sy) * .5;

    if (Math.abs(cssSize - lastCssSize) > .35) {
      lastCssSize = cssSize;
      gpuCanvas.style.width = `${cssSize.toFixed(2)}px`;
      gpuCanvas.style.height = `${cssSize.toFixed(2)}px`;
    }

    gpuCanvas.style.transform = `translate3d(${(centerX - cssSize * .5).toFixed(2)}px, ${(centerY - cssSize * .5).toFixed(2)}px, 0)`;
    const visible = centerX > -cssSize && centerX < wrapRect.width + cssSize && centerY > -cssSize && centerY < wrapRect.height + cssSize;
    gpuCanvas.style.opacity = visible ? String(Math.min(1, (.78 + progress * .22) * fogVisibility())) : '0';
  }

  function renderGpu(timeMs, progress, complete) {
    if (!available) return false;
    const time = timeMs * .001;
    const completed = complete ? 1 : 0;
    const pixelScale = GPU_SIZE / 640;

    gl.viewport(0, 0, GPU_SIZE, GPU_SIZE);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(veilProgram);
    gl.uniform1f(veilUniforms.time, time);
    gl.uniform1f(veilUniforms.progress, progress);
    gl.uniform1f(veilUniforms.complete, completed);
    gl.bindVertexArray(veilVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.useProgram(ringProgram);
    gl.uniform1f(ringUniforms.time, time);
    gl.uniform1f(ringUniforms.progress, progress);
    gl.bindVertexArray(ringVao);
    rings.forEach((ring, index) => {
      const gate = Math.max(0, Math.min(1, (progress - index * .035) / Math.max(.001, 1 - index * .035)));
      if (gate <= .002) return;
      gl.uniform1f(ringUniforms.rotation, ring.p + time * ring.s);
      gl.uniform3f(ringUniforms.tilt, ring.t[0], ring.t[1], ring.t[2]);
      gl.uniform1f(ringUniforms.precess, ring.p + index * .71);
      gl.uniform3f(ringUniforms.color, ring.c[0], ring.c[1], ring.c[2]);
      gl.uniform1f(ringUniforms.dash, ring.d);

      gl.uniform1f(ringUniforms.radius, ring.r - .0065);
      gl.uniform1f(ringUniforms.alpha, ring.a * .18 * gate);
      gl.drawArrays(gl.LINE_STRIP, 0, RING_SEGMENTS + 1);
      gl.uniform1f(ringUniforms.radius, ring.r + .0065);
      gl.drawArrays(gl.LINE_STRIP, 0, RING_SEGMENTS + 1);

      gl.uniform1f(ringUniforms.radius, ring.r);
      gl.uniform1f(ringUniforms.alpha, ring.a * (.64 + gate * .55) * (complete ? 1.13 : 1));
      gl.drawArrays(gl.LINE_STRIP, 0, RING_SEGMENTS + 1);
    });

    gl.useProgram(sigilProgram);
    gl.uniform1f(sigilUniforms.time, time);
    gl.uniform1f(sigilUniforms.progress, progress);
    gl.uniform1f(sigilUniforms.pixelScale, pixelScale);
    gl.bindVertexArray(sigilVao);
    gl.drawArrays(gl.POINTS, 0, SIGIL_COUNT);

    gl.bindVertexArray(null);
    return true;
  }

  drawRitual = function drawRitualGpuDirect(time) {
    const progress = Math.max(0, Math.min(1, ritualTime / RITUAL_DURATION));
    if (progress <= 0) {
      gpuCanvas.style.opacity = '0';
      return;
    }

    placeLayer(progress);
    if (!renderGpu(time, progress, ritualComplete)) {
      gpuCanvas.style.opacity = '0';
      if (previousDrawRitual) previousDrawRitual(time);
    }
  };
})();
