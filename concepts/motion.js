(() => {
'use strict';
const $=s=>document.querySelector(s);
const track=$('#track'),stage=$('.stage'),visual=$('#visual'),canvas=$('#scene');
const intro=$('#intro'),chapter=$('#chapter'),labels=[...document.querySelectorAll('.labels span')];
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const compact=matchMedia('(max-width:760px) and (max-height:660px)');
const mobile=matchMedia('(max-width:760px)');
const names={unfolding:'The system unfolding',connected:'Scattered to connected'};
let concept=new URLSearchParams(location.search).get('concept')==='connected'?'connected':'unfolding';
let progress=0,target=0,raf=0,lastTime=0,active=true,paused=false,failed=false,renderScene=null;
let start=0,distance=1,chapterIndex=-1;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const range=(p,a,b)=>ease((p-a)/(b-a));
const mix=(a,b,t)=>a+(b-a)*t;
const text={
 unfolding:[['01 / Information','See the<br><em>whole picture.</em>','Bring the right information into one considered system.'],['02 / Human approval','Intelligence.<br><em>With judgement.</em>','AI prepares the work. Your people stay in control.'],['03 / Action','Built to<br><em>work together.</em>','Four considered layers. One useful, everyday workflow.']],
 connected:[['01 / The everyday','Less scattered.<br><em>More focused.</em>','Emails, documents and tasks. Give each one a clear next step.'],['02 / Connection','Everything in<br><em>the right place.</em>','Bring the tools and information your team needs together.'],['03 / Progress','Less chasing.<br><em>Clearer work.</em>','From the first message to the next action, keep work moving.']]
};
function isStatic(){return reduced.matches||compact.matches||paused||failed;}
function measure(){start=track.getBoundingClientRect().top+scrollY;distance=Math.max(1,track.offsetHeight-stage.offsetHeight);target=isStatic()?0:clamp((scrollY-start)/distance);}
function copy(p){
 const fade=1-clamp(p/.16);
 intro.style.opacity=fade;intro.style.visibility=fade<.01?'hidden':'visible';intro.inert=fade<.01;
 const i=p<.44?0:p<.73?1:2;
 if(i!==chapterIndex){const t=text[concept][i];$('#chapter-number').textContent=t[0];$('#chapter-title').innerHTML=t[1];$('#chapter-copy').textContent=t[2];chapterIndex=i;}
 const opacity=clamp((p-.17)/.055);
 chapter.style.opacity=opacity;chapter.style.visibility=opacity>.01?'visible':'hidden';
 $('#progress').style.transform=`scaleX(${p})`;
}
function tick(now){
 raf=0;if(!active||document.hidden)return;
 const dt=lastTime?Math.min(48,now-lastTime):16;lastTime=now;
 progress+=(target-progress)*(1-Math.exp(-dt/80));if(Math.abs(progress-target)<.0002)progress=target;
 copy(progress);if(renderScene)renderScene(progress,concept);
 if(progress!==target)raf=requestAnimationFrame(tick);
}
function request(){if(!raf&&active&&!document.hidden)raf=requestAnimationFrame(tick);}
function mode(){
 const oldHeight=track.offsetHeight,oldScroll=scrollY,below=scrollY>=start+oldHeight;
 document.body.classList.toggle('static',isStatic());
 if(isStatic()&&oldScroll>start){scrollTo({top:below?oldScroll+track.offsetHeight-oldHeight:start,behavior:'instant'});}
 measure();progress=target;copy(progress);request();
}
function select(next){
 concept=next;chapterIndex=-1;
 document.querySelectorAll('[data-concept]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.concept===concept)));
 $('#version').textContent=`Direction ${concept==='unfolding'?'A':'B'} / ${names[concept]}`;
 $('#object-note').textContent=concept==='unfolding'?'One system. Four considered layers.':'Separate pieces. Shared direction.';
 visual.setAttribute('aria-label',concept==='unfolding'?'Four metal layers separate to reveal an AI workflow, then come together as one connected system.':'Scattered emails, documents and tasks align into four connected workflow steps.');
 const url=new URL(location.href);url.searchParams.set('concept',concept);history.replaceState(null,'',url);
 copy(progress);request();
}
for(const b of document.querySelectorAll('[data-concept]'))b.addEventListener('click',()=>select(b.dataset.concept));
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;$('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').textContent=paused?'Enable motion ▷':'Reduce motion Ⅱ';mode();});
reduced.addEventListener('change',mode);compact.addEventListener('change',mode);
window.addEventListener('scroll',()=>{target=isStatic()?0:clamp((scrollY-start)/distance);request();},{passive:true});
window.addEventListener('resize',()=>{measure();request();},{passive:true});
window.addEventListener('pageshow',()=>{measure();progress=target;request();});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;lastTime=0;if(!document.hidden){measure();progress=target;request();}});
if('IntersectionObserver'in window)new IntersectionObserver(e=>{active=e[0].isIntersecting;if(active){measure();progress=target;lastTime=0;request();}else{cancelAnimationFrame(raf);raf=0;}}).observe(track);
// Choices are local to this preview; they never change the production homepage.
let vote=null;
function showVote(value){vote=value;$('#copy-vote').textContent='Copy my choice';document.querySelector('.vote-result').hidden=false;$('#vote-status').textContent=`Your choice: ${value==='unfolding'?'A':'B'} — ${names[value]}.`;document.querySelectorAll('[data-vote]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vote===value)));}
for(const button of document.querySelectorAll('[data-vote]'))button.addEventListener('click',()=>{const v=button.dataset.vote;showVote(v);try{localStorage.setItem('ventura-motion-vote',v);}catch{} });
try{const saved=localStorage.getItem('ventura-motion-vote');if(names[saved])showVote(saved);}catch{}
$('#clear-vote').addEventListener('click',()=>{vote=null;document.querySelector('.vote-result').hidden=true;document.querySelectorAll('[data-vote]').forEach(b=>b.setAttribute('aria-pressed','false'));try{localStorage.removeItem('ventura-motion-vote');}catch{}});
$('#copy-vote').addEventListener('click',async()=>{if(!vote)return;const u=new URL(location.href);u.search='?concept='+vote;u.hash='';const message=`I choose ${vote==='unfolding'?'A':'B'} — ${names[vote]} for Ventura Solutions. ${u.href}`;try{await navigator.clipboard.writeText(message);$('#copy-vote').textContent='Copied — paste it into our chat';}catch{$('#vote-status').textContent=message;}});
mode();select(concept);

try{
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl)throw new Error('WebGL unavailable');
 const vs=`#version 300 es
 precision highp float;
 in vec3 position;in vec3 normal;in vec3 color;in float glow;
 uniform mat4 matrix;out vec3 vPosition;out vec3 vNormal;out vec3 vColor;out float vGlow;
 void main(){vPosition=position;vNormal=normal;vColor=color;vGlow=glow;gl_Position=matrix*vec4(position,1.);}`;
 const fs=`#version 300 es
 precision highp float;
 in vec3 vPosition;in vec3 vNormal;in vec3 vColor;in float vGlow;out vec4 outColor;
 void main(){
  vec3 n=normalize(vNormal),v=normalize(vec3(0.,0.,11.)-vPosition);
  vec3 light=normalize(vec3(-3.,6.,5.));
  float diffuse=max(dot(n,light),0.);
  float rim=pow(1.-max(dot(n,v),0.),3.);
  float spec=pow(max(dot(n,normalize(light+v)),0.),30.);
  float softbox=pow(max(dot(reflect(-v,n),normalize(vec3(4.,4.,6.))),0.),8.);
  float grain=sin(vPosition.x*460.+sin(vPosition.z*5.))*sin(vPosition.z*180.)*.012;
  vec3 c=vColor*(.28+diffuse*.7+grain)+vec3(.82,.80,.71)*(spec*.9+softbox*.4)+vec3(.25,.22,.16)*rim;
  c=mix(c,vColor*1.25,vGlow);c=c/(c+vec3(.58));c=pow(c,vec3(1./2.2));
  outColor=vec4(c,1.);
 }`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram(),vertex=shader(gl.VERTEX_SHADER,vs),fragment=shader(gl.FRAGMENT_SHADER,fs);
 gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const [name,n,o]of[['position',3,0],['normal',3,3],['color',3,6],['glow',1,9]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,n,gl.FLOAT,false,40,o*4);}
 const matrixLocation=gl.getUniformLocation(program,'matrix');
 gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 const silver=[.35,.38,.33],edge=[.12,.15,.115],gold=[.58,.40,.18],warm=[1.,.77,.43],ink=[.042,.056,.036];
 let vertices=[],transform=p=>p;
 function normal(a,b,c){const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;return n.map(x=>x/len);}
 function face(points,color,glow=0){const ps=points.map(transform),n=normal(ps[0],ps[1],ps[2]);for(let i=1;i<ps.length-1;i++)for(const p of[ps[0],ps[i],ps[i+1]])vertices.push(...p,...n,...color,glow);}
 function rotate(p,ax,ay,az){let[x,y,z]=p;[y,z]=[y*Math.cos(ax)-z*Math.sin(ax),y*Math.sin(ax)+z*Math.cos(ax)];[x,z]=[x*Math.cos(ay)+z*Math.sin(ay),-x*Math.sin(ay)+z*Math.cos(ay)];[x,y]=[x*Math.cos(az)-y*Math.sin(az),x*Math.sin(az)+y*Math.cos(az)];return[x,y,z];}
 function rounded(w,d,r){const p=[];for(let k=0;k<4;k++){const cx=(k===0||k===3?1:-1)*(w/2-r),cz=(k<2?1:-1)*(d/2-r);for(let j=0;j<=4;j++){const a=k*Math.PI/2+j*Math.PI/8;p.push([cx+r*Math.cos(a),cz+r*Math.sin(a)]);}}return p;}
 function plate(w,d,h,color=silver){
  const outer=rounded(w,d,.22),inner=rounded(w-.1,d-.1,.19),n=outer.length;
  face(inner.map(([x,z])=>[x,h/2,z]).reverse(),color);
  face(inner.map(([x,z])=>[x,-h/2,z]),edge);
  for(let i=0;i<n;i++){const j=(i+1)%n,a=outer[i],b=outer[j],c=inner[i],d=inner[j];
   face([[c[0],h/2,c[1]],[d[0],h/2,d[1]],[b[0],h/2-.06,b[1]],[a[0],h/2-.06,a[1]]],silver);
   face([[a[0],h/2-.06,a[1]],[b[0],h/2-.06,b[1]],[b[0],-h/2+.06,b[1]],[a[0],-h/2+.06,a[1]]],edge);
   face([[a[0],-h/2+.06,a[1]],[b[0],-h/2+.06,b[1]],[d[0],-h/2,d[1]],[c[0],-h/2,c[1]]],silver);
  }
 }
 function line(a,b,r=.015,color=gold,glow=0){
  const v=b.map((x,i)=>x-a[i]),len=Math.hypot(...v);if(len<.0001)return;const dir=v.map(x=>x/len),ref=Math.abs(dir[1])>.9?[1,0,0]:[0,1,0];
  let u=[dir[1]*ref[2]-dir[2]*ref[1],dir[2]*ref[0]-dir[0]*ref[2],dir[0]*ref[1]-dir[1]*ref[0]];const l=Math.hypot(...u);u=u.map(x=>x/l);const w=[dir[1]*u[2]-dir[2]*u[1],dir[2]*u[0]-dir[0]*u[2],dir[0]*u[1]-dir[1]*u[0]];
  const point=(p,t)=>p.map((x,i)=>x+r*(u[i]*Math.cos(t)+w[i]*Math.sin(t)));
  for(let i=0;i<6;i++)face([point(a,i*Math.PI/3),point(b,i*Math.PI/3),point(b,(i+1)*Math.PI/3),point(a,(i+1)*Math.PI/3)],color,glow);
 }
 function path(ps,r,color,glow=0){for(let i=1;i<ps.length;i++)line(ps[i-1],ps[i],r,color,glow);}
 function icon(index,y,scale=1,highlight=0){
  const point=(x,z)=>[x*scale,y,z*scale],c=highlight?warm:[.13,.095,.047];
  let p=[];
  if(index===0){p=[[-.48,-.3],[.48,-.3],[.48,.3],[-.48,.3],[-.48,-.3]];path(p.map(v=>point(...v)),.018,c,highlight);path([[-.48,-.3],[0,.03],[.48,-.3]].map(v=>point(...v)),.018,c,highlight);}
  if(index===1){path([[0,-.47],[.43,0],[0,.47],[-.43,0],[0,-.47]].map(v=>point(...v)),.025,c,highlight);line(point(-.58,0),point(.58,0),.012,c,highlight);line(point(0,-.6),point(0,.6),.012,c,highlight);}
  if(index===2){path([[-.37,0],[-.08,.28],[.43,-.32]].map(v=>point(...v)),.032,c,highlight);}
  if(index===4){path([[-.34,-.46],[.34,-.46],[.34,.46],[-.34,.46],[-.34,-.46]].map(v=>point(...v)),.018,c,highlight);for(const z of[-.18,0,.18])line(point(-.18,z),point(.18,z),.012,c,highlight);}
  if(index===3){line(point(-.5,0),point(.5,0),.026,c,highlight);path([[.12,-.32],[.5,0],[.12,.32]].map(v=>point(...v)),.026,c,highlight);}
 }
 function circuit(w,d,y,highlight){
  const c=highlight?warm:[.13,.095,.047];
  path([[-w*.38,y,-d*.27],[-w*.19,y,-d*.27],[-w*.19,y,-d*.37],[w*.34,y,-d*.37]],.009,c,highlight);
  path([[w*.38,y,d*.28],[w*.18,y,d*.28],[w*.18,y,d*.38],[-w*.33,y,d*.38]],.009,c,highlight);
  for(const x of[-w*.36,w*.36])line([x,y,-d*.1],[x,y,d*.1],.025,c,highlight);
 }
 let aspect=1,fov=42,depth=11;
 const projection=new Float32Array(16),matrix=new Float32Array(16);
 function size(){const w=visual.clientWidth,h=visual.clientHeight;const ratio=Math.min(devicePixelRatio||1,1.6,Math.sqrt(1500000/(w*h)));canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);gl.viewport(0,0,canvas.width,canvas.height);aspect=w/h;fov=mobile.matches?43:42;depth=mobile.matches?10.8:11;}
 function project(p){const f=1/Math.tan(fov*Math.PI/360),z=depth-p[2];return[(p[0]*f/aspect/z*.5+.5)*visual.clientWidth,(-p[1]*f/z*.5+.5)*visual.clientHeight];}
 function drawLabel(i,p,opacity){const[x,y]=project(p);labels[i].style.left=x+'px';labels[i].style.top=y+'px';labels[i].style.opacity=isStatic()?0:opacity;}
 function unfolding(p){
  const opening=range(p,.1,.4)*(1-range(p,.77,.98));
  const s=mix(1.35,.92,opening),ax=.58,ay=-.50+range(p,.4,.73)*.2,az=-.12;
  const global=p=>rotate(p.map(v=>v*s),ax,ay,az);
  for(let i=0;i<4;i++){
   const y=(1.5-i)*mix(.29,1.60,opening);
   const x=(i-1.5)*opening*.06;
   transform=q=>global([q[0]+x,q[1]+y,q[2]]);
   plate(3.25,2.75,.23,i===0?[.39,.40,.35]:silver);
   const phase=clamp((p-.42)/.33)*4;
   const lit=p>.41&&p<.78&&Math.floor(phase)===i?1:0;
   icon(i,.13,.95,lit);circuit(3.25,2.75,.125,lit);
   // Narrow seams carry the light around each layer when the system closes.
   const seam=rounded(3.27,2.77,.23).map(([x,z])=>[x,0,z]);path([...seam,seam[0]],.013,p>.9?warm:gold,p>.9?1:0);
   const anchor=global([1.85,y,.6]);drawLabel(i,anchor,range(p,.2,.34)*(1-range(p,.78,.91)));
  }
  if(opening>.02){transform=global;line([0,-2.4*opening,0],[0,2.4*opening,0],.012,gold);const y=mix(2.4,-2.4,clamp((p-.42)/.33))*opening;line([0,y-.15,0],[0,y+.15,0],.046,warm,1);}
 }
 const seeds=Array.from({length:12},(_,i)=>({x:Math.sin(i*2.37+.4)*3.8,y:Math.cos(i*1.71+.8)*2.6,z:Math.sin(i*3.1)*1.8,rx:.55+Math.sin(i)*.45,ry:Math.cos(i*2)*.65,rz:Math.sin(i*3)*.5}));
 function connected(p){
  const alignment=range(p,.16,.57),end=range(p,.86,1);
  const centers=[[-2.5,1.7,0],[-.85,.57,.2],[.85,-.57,.2],[2.5,-1.7,0]];
  const baseScale=mobile.matches?.87:1.0;
  const global=q=>rotate(q.map(v=>v*baseScale),0,-.06+end*.1,0);
  for(let i=0;i<12;i++){
   const group=i%4,main=i<4,seed=seeds[i],center=centers[group];
   const s=main?mix(.95,1.06,alignment):mix(.75,.02,range(p,.32,.58));
   if(s<.025)continue;
   const pos=[mix(seed.x,center[0],alignment),mix(seed.y,center[1],alignment),mix(seed.z,center[2],alignment)];
   const ax=mix(seed.rx,1.05,alignment),ay=mix(seed.ry,-.15,alignment),az=mix(seed.rz,-.06,alignment);
   transform=q=>global(rotate(q.map(v=>v*s),ax,ay,az).map((v,j)=>v+pos[j]));
   plate(1.68,1.38,.19,main?silver:[.22,.25,.20]);
   const lit=main&&p>.57&&Math.floor(clamp((p-.57)/.31)*4)===group;
   icon(main?group:[0,4,2][i%3],.11,.86,lit?1:0);
   if(main){drawLabel(group,global([center[0],center[1]-.8,center[2]+.2]),range(p,.4,.58));}
  }
  if(alignment>.2){
   transform=global;
   for(let i=0;i<3;i++){
    const a=centers[i],b=centers[i+1];const t=range(p,.28+i*.06,.49+i*.04);
    if(t>0)line([a[0],a[1]-.25,a[2]-.28],[mix(a[0],b[0],t),mix(a[1]-.25,b[1]+.25,t),mix(a[2]-.28,b[2]-.28,t)],.014,gold);
   }
   const signal=clamp((p-.57)/.31)*3,part=Math.min(2,Math.floor(signal)),t=signal-part,a=centers[part],b=centers[part+1];
   if(p>.57&&p<.9){const c=a.map((v,i)=>mix(v,b[i],t));line([c[0]-.09,c[1]+.09,c[2]+.15],[c[0]+.09,c[1]-.09,c[2]+.15],.065,warm,1);}
  }
 }
 renderScene=(p,type)=>{
  vertices=[];labels.forEach(l=>l.style.opacity=0);
  if(type==='unfolding')unfolding(p);else connected(p);
  const f=1/Math.tan(fov*Math.PI/360),near=.1,far=60;
  projection.set([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
  matrix.set(projection);matrix[14]=projection[10]*-depth+projection[14];matrix[15]=depth;
  gl.uniformMatrix4fv(matrixLocation,false,matrix);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);
 };
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;renderScene=null;document.body.classList.add('no-canvas');mode();});
 size();new ResizeObserver(()=>{size();request();}).observe(visual);renderScene(progress,concept);request();
}catch(error){console.warn('Motion preview: using still artwork.',error);failed=true;document.body.classList.add('no-canvas');mode();}
})();
