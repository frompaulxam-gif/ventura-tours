/* Animated hero gradient. One WebGL fragment shader: soft colour fields drifting over a dark base,
   with a slow noise warp so the edges flow. Colourway comes from <body data-gradient="green|retell">.
   Pauses off screen, in background tabs, when "Pause motion" is on, and renders one still frame for
   reduced motion. Falls back to the static CSS gradient on .hero-wash if WebGL is unavailable. */
(() => {
  'use strict';

  // Each field: [colour, x, y, radius, strength]. x and y run 0 to 1 across the hero, y from the top.
  const PALETTES = {
    green: {
      base: '#020d08',
      fields: [
        ['#0c9460', 0.08, 0.10, 0.50, 0.95],
        ['#06573a', 0.50, 0.30, 0.52, 0.90],
        ['#010b06', 0.86, 0.55, 0.50, 0.95],
        ['#14a070', 0.52, 0.94, 0.42, 0.85],
        ['#c4d17e', 0.03, 0.96, 0.36, 0.88],
        ['#3fae7c', 0.98, 0.10, 0.28, 0.45]
      ]
    },
    retell: {
      base: '#010833',
      fields: [
        ['#1a7fe6', 0.07, 0.12, 0.50, 0.95],
        ['#0a3fc0', 0.50, 0.30, 0.54, 0.92],
        ['#010a3d', 0.86, 0.56, 0.50, 0.95],
        ['#177f76', 0.52, 0.95, 0.42, 0.85],
        ['#c47ab2', 0.04, 1.04, 0.36, 0.90],
        ['#5a45a8', 0.26, 0.88, 0.30, 0.55]
      ]
    }
  };

  const body = document.body;
  const wash = document.querySelector('.hero-wash');
  const palette = PALETTES[body.dataset.gradient];
  if (!wash || !palette) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-gradient';
  canvas.setAttribute('aria-hidden', 'true');
  const grain = document.createElement('div');
  grain.className = 'hero-grain';
  grain.setAttribute('aria-hidden', 'true');
  wash.prepend(grain);
  wash.prepend(canvas);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) { canvas.remove(); return; }

  const vert = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const frag = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uDrag;
uniform float uHover;
uniform vec3 uBase;
uniform vec3 uCol[6];
uniform vec4 uField[6];
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; uv.y=1.-uv.y;
  float aspect=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*aspect,uv.y);
  float t=uTime;
  vec2 w=vec2(snoise(vec3(p*1.1,t*.07)),snoise(vec3(p*1.1+17.3,t*.07)));
  // A broad, soft lens bends the existing colour field around the pointer.
  // Movement trails slightly, so the goo stretches then gently settles.
  vec2 delta=p-vec2(uPointer.x*aspect,uPointer.y);
  float influence=exp(-dot(delta,delta)/.16)*uHover;
  vec2 push=(delta*.22+vec2(-delta.y,delta.x)*.10+uDrag*.65)*influence;
  vec2 pw=p+w*.2-push;
  vec3 col=uBase;
  for(int i=0;i<6;i++){
    float fi=float(i);
    vec4 f=uField[i];
    vec2 c=vec2(f.x*aspect,f.y)+vec2(.16*sin(t*(.11+.017*fi)+fi*1.7),.12*cos(t*(.09+.013*fi)+fi*2.3));
    vec2 d=pw-c;
    float k=exp(-dot(d,d)/(f.z*f.z));
    col=mix(col,uCol[i],clamp(k*f.w,0.,1.));
  }
  float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  col+=(n-.5)*(2./255.);
  gl_FragColor=vec4(col,1.);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('hero-gradient:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) { canvas.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // Plain sRGB mixing keeps the colours deep and saturated, like a CSS gradient.
  const toLinear = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const u = name => gl.getUniformLocation(prog, name);
  gl.uniform3fv(u('uBase'), toLinear(palette.base));
  gl.uniform3fv(u('uCol'), palette.fields.flatMap(f => toLinear(f[0])));
  gl.uniform4fv(u('uField'), palette.fields.flatMap(f => [f[1], f[2], f[3], f[4]]));
  const uRes = u('uRes');
  const uTime = u('uTime');
  const uPointer = u('uPointer');
  const uDrag = u('uDrag');
  const uHover = u('uHover');

  // The field is soft, so half resolution is invisible and keeps the GPU cost tiny.
  const SCALE = 0.5;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(r.width * dpr * SCALE));
    const h = Math.max(2, Math.round(r.height * dpr * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
  }

  const params = new URLSearchParams(location.search);
  const fixedTime = params.has('t') ? parseFloat(params.get('t')) : null;
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const SPEED = 0.65; // calm drift; 1 = shader time runs at clock speed
  let time = 6;
  let last = 0;
  let running = false;
  let visible = true;
  let frameId = 0;
  const hoverQuery = matchMedia('(hover: hover) and (pointer: fine)');
  const pointer = { x: .5, y: .5, tx: .5, ty: .5, amount: 0, target: 0 };

  function releasePointer() { pointer.target = 0; }
  document.addEventListener('pointermove', event => {
    if (!hoverQuery.matches || event.pointerType === 'touch' || !shouldRun()) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) { releasePointer(); return; }
    // Start at the entry point rather than sweeping across the whole hero.
    if (pointer.amount < .001) { pointer.x = x; pointer.y = y; }
    pointer.tx = x; pointer.ty = y; pointer.target = 1;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', releasePointer);
  document.addEventListener('pointercancel', releasePointer);
  window.addEventListener('blur', releasePointer);
  window.addEventListener('scroll', releasePointer, { passive: true });
  hoverQuery.addEventListener('change', releasePointer);

  function draw() {
    resize();
    gl.uniform1f(uTime, time);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.uniform2f(uDrag, Math.max(-.12, Math.min(.12, pointer.tx - pointer.x)), Math.max(-.12, Math.min(.12, pointer.ty - pointer.y)));
    gl.uniform1f(uHover, pointer.amount);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!canvas.hasAttribute('data-ready')) { canvas.setAttribute('data-ready', ''); window.__heroGradientReady = true; }
  }
  function frame(now) {
    if (!running) return;
    frameId = requestAnimationFrame(frame);
    if (last && now - last < 15) return; // cap at about 60fps; the drift is slow, so 120Hz screens gain nothing
    const dt = last ? Math.min((now - last) / 1000, .1) : 1 / 60;
    time += dt * SPEED;
    const follow = 1 - Math.exp(-dt * 7);
    const settle = 1 - Math.exp(-dt * (pointer.target ? 5 : 3));
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;
    pointer.amount += (pointer.target - pointer.amount) * settle;
    last = now;
    draw();
  }
  const shouldRun = () => fixedTime === null && visible && !document.hidden && !reduceQuery.matches && body.dataset.reduced !== 'true';
  function update() {
    const go = shouldRun();
    if (go && !running) { running = true; last = 0; frameId = requestAnimationFrame(frame); }
    if (!go) {
      running = false;
      cancelAnimationFrame(frameId);
      releasePointer();
      if (reduceQuery.matches || !hoverQuery.matches) pointer.amount = 0;
      draw();
    }
  }

  if (fixedTime !== null) time = fixedTime;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; update(); }, { rootMargin: '80px' }).observe(wash);
  new MutationObserver(update).observe(body, { attributes: true, attributeFilter: ['data-reduced'] });
  document.addEventListener('visibilitychange', update);
  reduceQuery.addEventListener('change', update);
  new ResizeObserver(() => { if (!running) draw(); }).observe(canvas);
  draw();
  update();
})();
