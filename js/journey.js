// Original Ventura geometry: no video, image sequence or external asset requests.
const track = document.querySelector('#journey');
const stage = track.querySelector('.journey-stage');
const canvas = document.querySelector('#journey-canvas');
const intro = document.querySelector('#journey-intro');
const chapter = document.querySelector('#journey-chapter');
const number = document.querySelector('#journey-number');
const title = document.querySelector('#journey-title');
const description = document.querySelector('#journey-description');
const progressBar = track.querySelector('.journey-progress > span');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 760px)');
const compact = matchMedia('(max-width: 760px) and (max-height: 660px)');
const chapters = [
  ['01 / Understand', 'See what’s<br><em>possible.</em>', 'Find the work worth changing.'],
  ['02 / Build', 'Make it<br><em>work together.</em>', 'Connect your tools. Keep your people in control.'],
  ['03 / Implement', 'A better<br><em>everyday.</em>', 'Give your team the confidence to move forward.']
];
let renderScene = null;
let target = 0;
let current = 0;
let frame = 0;
let previousTime = 0;
let lastChapter = -1;
let sceneLoading = false;
let failed = false;
let visible = true;
let paused = document.body.classList.contains('motion-paused');
let enabled = !reduced.matches && !compact.matches && !paused && window.scrollY < stage.offsetHeight;
let start = 0;
let distance = 1;
const clamp = value => Math.max(0, Math.min(1, value));

function measure() {
  start = track.getBoundingClientRect().top + window.scrollY;
  distance = Math.max(1, track.offsetHeight - stage.offsetHeight);
  target = enabled ? clamp((window.scrollY - start) / distance) : 0;
}
function updateCopy(p) {
  const fade = 1 - clamp(p / .15);
  intro.style.opacity = fade.toFixed(3);
  intro.style.visibility = fade < .01 ? 'hidden' : 'visible';
  intro.inert = fade < .01;
  intro.style.transform = mobile.matches ? `translateY(${-p * 45}px)` : `translateY(calc(-43% - ${p * 45}px))`;
  const index = p < .44 ? 0 : p < .73 ? 1 : 2;
  if (index !== lastChapter) {
    [number.textContent, title.innerHTML, description.textContent] = chapters[index];
    lastChapter = index;
  }
  // Short fades at chapter boundaries keep a fast or reverse scroll deterministic.
  const from = [.18, .44, .73][index];
  const to = [.44, .73, 1.04][index];
  const opacity = Math.min(clamp((p - from) / .055), clamp((to - p) / .04));
  chapter.style.opacity = opacity.toFixed(3);
  chapter.style.visibility = opacity > .01 ? 'visible' : 'hidden';
  chapter.style.transform = `translateY(${(1 - opacity) * 14}px)`;
  progressBar.style.transform = `scaleX(${p})`;
}
function tick(now) {
  frame = 0;
  if (document.hidden || !visible) return;
  const dt = previousTime ? Math.min(48, now - previousTime) : 16;
  previousTime = now;
  current += (target - current) * (1 - Math.exp(-dt / 85));
  if (Math.abs(current - target) < .0002) current = target;
  updateCopy(current);
  if (renderScene) renderScene(current);
  if (current !== target) frame = requestAnimationFrame(tick);
}
function requestRender() {
  if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
}
function readScroll() {
  target = enabled ? clamp((window.scrollY - start) / distance) : 0;
  requestRender();
}
function setMode(animate) {
  const wasEnabled = enabled;
  const below = window.scrollY >= start + track.offsetHeight;
  const oldHeight = track.offsetHeight;
  enabled = animate && !failed && !compact.matches;
  track.classList.toggle('is-interactive', enabled);
  track.classList.toggle('is-static', !enabled);
  if (wasEnabled && !enabled) {
    if (below) window.scrollBy({top: track.offsetHeight - oldHeight, behavior:'instant'});
    else if (window.scrollY > start) window.scrollTo({top:start, behavior:'instant'});
  }
  measure();
  current = target;
  updateCopy(current);
  requestRender();
  if (enabled && !renderScene) loadScene();
}
track.classList.toggle('is-interactive', enabled);
track.classList.toggle('is-static', !enabled);
measure();
updateCopy(target);
window.addEventListener('scroll', readScroll, {passive:true});
window.addEventListener('resize', () => {measure();requestRender();}, {passive:true});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {cancelAnimationFrame(frame);frame=0;previousTime=0;}
  else {measure();current=target;requestRender();}
});
window.addEventListener('pageshow', () => {measure();current=target;requestRender();});
document.addEventListener('ventura:motion', event => {paused=event.detail.paused;setMode(!paused && !reduced.matches);});
reduced.addEventListener('change', () => setMode(!paused && !reduced.matches));
compact.addEventListener('change', () => setMode(!paused && !reduced.matches));
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) {measure();current=target;previousTime=0;requestRender();}
    else {cancelAnimationFrame(frame);frame=0;previousTime=0;}
  }).observe(track);
}

function loadScene() {
  if (sceneLoading || renderScene || failed) return;
  sceneLoading = true;
  try {
    const gl = canvas.getContext('webgl2', {antialias:true, alpha:false, powerPreference:'low-power'});
    if (!gl) throw new Error('WebGL is unavailable');
    const vertexSource = `#version 300 es
      precision highp float;
      in vec3 position; in vec3 normal; in vec3 color; in float glow;
      uniform mat4 matrix;
      out vec3 vPosition; out vec3 vNormal; out vec3 vColor; out float vGlow;
      void main(){vPosition=position;vNormal=normal;vColor=color;vGlow=glow;gl_Position=matrix*vec4(position,1.0);}`;
    const fragmentSource = `#version 300 es
      precision highp float;
      in vec3 vPosition; in vec3 vNormal; in vec3 vColor; in float vGlow;
      uniform vec3 camera; out vec4 outColor;
      void main(){
        vec3 n=normalize(vNormal);
        float sky=.23+.16*n.y;
        float sun=max(dot(n,normalize(vec3(4.,8.,8.))),0.)*.5;
        vec3 light=vec3(sky+sun);
        for(int i=0;i<4;i++){
          vec3 delta=vec3(0.,5.8,2.-float(i)*12.)-vPosition;
          float d=length(delta);
          light+=vec3(1.,.79,.50)*max(dot(n,delta/d),0.)*4.5/(1.+d*d*.16);
        }
        vec3 c=vColor*light;
        if(n.y>.8){
          float bay=mod(vPosition.z+4.,12.)-6.;
          c+=vec3(.12,.084,.038)*exp(-vPosition.x*vPosition.x*.16-bay*bay*.1);
        }
        c=mix(c,vColor*1.6,vGlow);
        float fog=1.-exp(-length(vPosition-camera)*.017);
        c=mix(c,vec3(.024,.028,.022),fog);
        c=c/(c+vec3(.7));
        c=pow(c,vec3(1./2.2));
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
        outColor=vec4(c+(grain-.5)*.008,1.);
      }`;
    function shader(type,source){
      const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const program=gl.createProgram();
    const vertex=shader(gl.VERTEX_SHADER,vertexSource), fragment=shader(gl.FRAGMENT_SHADER,fragmentSource);
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
    // All architecture is baked into one vertex buffer: one draw call per frame.
    const vertices=[];
    const materials={floor:[.13,.145,.12],wall:[.14,.15,.125],stone:[.34,.32,.26],bronze:[.36,.255,.12],dark:[.05,.065,.045],light:[1.,.77,.43]};
    function quad(a,b,c,d,normal,mat,glow=0){
      for(const v of [a,b,c,a,c,d]) vertices.push(...v,...normal,...materials[mat],glow);
    }
    function box(x,y,z,w,h,d,mat,glow=0){
      const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,f=z+d/2,k=z-d/2;
      quad([l,b,f],[r,b,f],[r,t,f],[l,t,f],[0,0,1],mat,glow);
      quad([r,b,k],[l,b,k],[l,t,k],[r,t,k],[0,0,-1],mat,glow);
      quad([l,b,k],[l,b,f],[l,t,f],[l,t,k],[-1,0,0],mat,glow);
      quad([r,b,f],[r,b,k],[r,t,k],[r,t,f],[1,0,0],mat,glow);
      quad([l,t,f],[r,t,f],[r,t,k],[l,t,k],[0,1,0],mat,glow);
      quad([l,b,k],[r,b,k],[r,b,f],[l,b,f],[0,-1,0],mat,glow);
    }
    function arch(z,inner,outer,depth,mat,glow=0){
      const stem=3.85;
      box(-(inner+outer)/2,stem/2,z,(outer-inner),stem,depth,mat,glow);
      box((inner+outer)/2,stem/2,z,(outer-inner),stem,depth,mat,glow);
      for(let i=0;i<64;i++){
        const a=i*Math.PI/64,b=(i+1)*Math.PI/64,m=(a+b)/2;
        const point=(r,angle,d)=>[r*Math.cos(angle),stem+r*Math.sin(angle),z+d];
        const f=depth/2,k=-f;
        quad(point(inner,a,f),point(outer,a,f),point(outer,b,f),point(inner,b,f),[0,0,1],mat,glow);
        quad(point(inner,b,k),point(outer,b,k),point(outer,a,k),point(inner,a,k),[0,0,-1],mat,glow);
        quad(point(inner,a,k),point(inner,a,f),point(inner,b,f),point(inner,b,k),[-Math.cos(m),-Math.sin(m),0],mat,glow);
        quad(point(outer,b,k),point(outer,b,f),point(outer,a,f),point(outer,a,k),[Math.cos(m),Math.sin(m),0],mat,glow);
      }
    }
    box(0,-.17,-18,16,.3,90,'floor');
    box(-7.5,4,-18,.5,8,90,'wall');box(7.5,4,-18,.5,8,90,'wall');
    box(0,8.05,-18,16,.3,90,'dark');
    for(let i=0;i<23;i++) box(0,.001,22-i*4,15,.004,.018,'dark');
    for(const x of [-3.15,3.15]) box(x,.005,-18,.025,.01,85,'bronze');
    for(const x of [-7.2,7.2]) box(x,7.7,-18,.045,.08,83,'light',1);
    for(const z of [0,-12,-24,-36]){
      arch(z,2.65,3.35,.85,'stone');
      arch(z+.45,2.67,2.70,.035,'light',1);
      for(const x of [-5.4,5.4]){
        box(x,3.85,z,4.05,7.7,.75,'wall');
        box(x,3.1,z+.4,.025,4.2,.02,'light',1);
      }
      box(0,7.65,z,15,.45,.75,'wall');
    }
    for(const z of [-5,-17,-29]){
      box(6.9,3,z,1.05,5,4.4,'dark');
      for(let j=0;j<9;j++) box(6.28,3,z-1.8+j*.45,.08,4.7,.05,'bronze');
      box(-6.98,2.5,z,1,4,4.4,'dark');
      box(-6.38,4.4,z,.1,.035,4.2,'light',1);
      box(4.9,.38,z,1.6,.75,3.2,'stone');
    }
    box(0,.6,-43,1.9,1.2,1.9,'dark');
    // A quiet geometric sculpture marks the end of the passage.
    for(let i=0;i<3;i++){
      const angle=i*Math.PI/3;
      for(let j=0;j<64;j++){
        const a=j*Math.PI*2/64,b=(j+1)*Math.PI*2/64;
        const p=(r,t)=>[r*Math.cos(t)*Math.cos(angle),2.85+r*Math.sin(t),-43+r*Math.cos(t)*Math.sin(angle)];
        quad(p(1.12,a),p(1.18,a),p(1.18,b),p(1.12,b),[-Math.sin(angle),0,Math.cos(angle)],i===1?'light':'bronze',i===1?1:0);
      }
    }
    box(0,4,-48,15,8,.5,'wall');
    const data=new Float32Array(vertices);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    for(const [name,count,offset] of [['position',3,0],['normal',3,3],['color',3,6],['glow',1,9]]){
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,count,gl.FLOAT,false,40,offset*4);
    }
    const matrixLocation=gl.getUniformLocation(program,'matrix'),cameraLocation=gl.getUniformLocation(program,'camera');
    gl.enable(gl.DEPTH_TEST);gl.clearColor(.025,.028,.022,1);
    const matrix=new Float32Array(16);
    function multiply(a,b){
      for(let c=0;c<4;c++) for(let r=0;r<4;r++) matrix[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
      return matrix;
    }
    let aspect=1;
    const projection=new Float32Array(16),view=new Float32Array(16);
    function size(){
      const w=stage.clientWidth,h=stage.clientHeight;
      const ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1600000/(w*h)));
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
      gl.viewport(0,0,canvas.width,canvas.height);aspect=w/h;
      const f=1/Math.tan(53*Math.PI/360),near=.15,far=110;
      projection.set([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
    }
    size();
    new ResizeObserver(()=>{size();measure();requestRender();}).observe(stage);
    renderScene=p=>{
      const x=mobile.matches?0:-3.15*(1-clamp(p/.32)),y=2.4,z=13-p*45;
      // A level, straight camera avoids vestibular tilt and keeps reverse scrolling exact.
      view.set([1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1]);
      gl.uniformMatrix4fv(matrixLocation,false,multiply(projection,view));
      gl.uniform3f(cameraLocation,x,y,z);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES,0,data.length/10);
    };
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();track.classList.remove('scene-ready');failed=true;
      renderScene=null;setMode(false);
    });
    renderScene(current);
    track.classList.add('scene-ready');
    requestRender();
  }catch(error){
    console.warn('Ventura passage: using the still artwork.',error);
    failed=true;renderScene=null;track.classList.remove('scene-ready');setMode(false);
  }
}
if(enabled) loadScene();
