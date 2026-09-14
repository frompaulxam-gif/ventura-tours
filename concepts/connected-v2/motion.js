const $=s=>document.querySelector(s);
const journey=$('#journey'),stage=$('.stage'),visual=$('#visual'),canvas=$('#scene');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),compact=matchMedia('(max-width:760px) and (max-height:680px)');
const mobile=matchMedia('(max-width:760px)');
const clamp=n=>Math.max(0,Math.min(1,n)),lerp=(a,b,t)=>a+(b-a)*t;
const smooth=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
const between=(p,a,b)=>smooth((p-a)/(b-a));
const labels=[...document.querySelectorAll('.object-labels span')],steps=[...document.querySelectorAll('.steps li')];
let progress=0,target=0,start=0,distance=1,raf=0,last=0,visible=true,paused=false,failed=false,render=null,resizeScene=null;
let currentChapter=-1;
const chapters=[['01 / Bring it together','Good things start<br><em>with the details.</em>','Enquiries, notes and everyday tasks. Bring the right information together, without the back and forth.'],['02 / Make space for judgement','A little intelligence.<br><em>A human decision.</em>','AI helps prepare the work. Your team reviews the details and decides what happens next.'],['03 / Keep things moving','Less chasing.<br><em>Clearer work.</em>','One connected path from the first message to a useful action. With your people in control.']];
function isStatic(){return reduced.matches||compact.matches||paused||failed;}
function measure(){start=journey.getBoundingClientRect().top+scrollY;distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);target=isStatic()?0:clamp((scrollY-start)/distance);}
function paintCopy(p){
 const opacity=1-between(p,.1,.22),intro=$('#intro');intro.style.opacity=opacity;intro.style.visibility=opacity>.01?'visible':'hidden';intro.inert=opacity<=.01;
 const i=p<.49?0:p<.79?1:2;
 if(i!==currentChapter){const[number,title,copy]=chapters[i];$('#chapter-step').textContent=number;$('#chapter-title').innerHTML=title;$('#chapter-copy').textContent=copy;currentChapter=i;}
 const chapterOpacity=between(p,.23,.29);$('#chapter').style.opacity=chapterOpacity;$('#chapter').style.visibility=chapterOpacity>.01?'visible':'hidden';
 $('#progress').style.transform=`scaleX(${p})`;const step=p<.51?0:p<.67?1:p<.84?2:3;
 steps.forEach((s,i)=>s.classList.toggle('current',p>.4&&i===step));
}
function tick(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min(50,now-last):16;last=now;progress+=(target-progress)*(1-Math.exp(-dt/110));if(Math.abs(progress-target)<.00008)progress=target;paintCopy(progress);render?.(progress,isStatic());if(progress!==target)raf=requestAnimationFrame(tick);}
function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
function setMode(){const height=journey.offsetHeight,y=scrollY,below=y>=start+height;document.body.classList.toggle('static',isStatic());if(isStatic()&&y>start)scrollTo({top:below?y+journey.offsetHeight-height:start,behavior:'instant'});measure();progress=target;request();}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;$('#motion-toggle').textContent=paused?'Enable motion ▷':'Reduce motion Ⅱ';$('#motion-toggle').setAttribute('aria-pressed',String(paused));setMode();});
reduced.addEventListener('change',setMode);compact.addEventListener('change',setMode);
window.addEventListener('scroll',()=>{target=isStatic()?0:clamp((scrollY-start)/distance);request();},{passive:true});
window.addEventListener('resize',()=>{measure();resizeScene?.();request();},{passive:true});
window.addEventListener('pageshow',()=>{measure();progress=target;request();});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden){measure();progress=target;request();}});
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){measure();progress=target;last=0;request();}else{cancelAnimationFrame(raf);raf=0;}}).observe(journey);
function fallback(error){console.warn('Connected preview: using the accessible still view.',error);failed=true;render=null;document.body.classList.add('no-canvas');setMode();}
setMode();

async function build(){
 const [THREE,assets]=await Promise.all([import('./vendor/three.module.min.js'),import('./assets.js?v=1'),document.fonts.ready]);
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setClearColor(0x080a09,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,50);camera.position.set(0,0,12.9);
 const env=assets.environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.68;
 scene.add(new THREE.HemisphereLight(0xfff8e8,0x243629,1.4));
 const key=new THREE.DirectionalLight(0xffefce,3);key.position.set(-3,5,7);scene.add(key);
 const fill=new THREE.DirectionalLight(0xdce9d9,1.5);fill.position.set(5,-1,4);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xe9c994,2);rim.position.set(2,4,-4);scene.add(rim);
 const world=new THREE.Group();scene.add(world);
 const envelope=assets.makeEnvelope(),engine=assets.makeIntelligence(),approval=assets.makeApproval(),plane=assets.makePlane(),documents=assets.makeDocuments(),tasks=assets.makeTasks();
 const models=[envelope,engine,approval,plane,documents,tasks];models.forEach(m=>world.add(m));
 const v=a=>new THREE.Vector3(...a),q=a=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...a));
 const scatter=[[-2.25,1.7,.75],[.25,.03,.9],[2,-1.25,-.25],[.2,-2.6,.8],[1.85,2,-.5],[-2.0,-1.50,.15]];
 const destination=[[-1.68,2.15,0],[1.48,.73,.08],[-1.6,-.76,.12],[1.53,-2.23,.14],[-1.68,2.15,-.3],[-1.68,2.15,-.32]];
 const scatterRot=[[.18,-.32,-.22],[.2,-.25,.1],[.05,-.36,.2],[.38,-.18,.06],[.04,-.28,.2],[-.07,.34,-.2]];
 const finalRot=[[.08,-.21,-.07],[.25,.22,.0],[.04,.16,-.035],[.25,-.20,.15],[.08,-.21,-.07],[.08,-.21,-.07]];
 const initialScale=[.92,1.04,.91,.74,.87,.80],finalScale=[.91,.97,.95,.91,.04,.04];
 const poses=models.map((m,i)=>({from:v(scatter[i]),to:v(destination[i]),start:q(scatterRot[i]),end:q(finalRot[i])}));
 const arches=[[[-.58,2.02,-.27],[.65,2.26,-.55],[1.44,1.84,-.48],[1.48,1.48,-.16]],[[.89,.23,-.17],[.02,.28,-.39],[-1.48,.42,-.48],[-1.57,.03,-.23]],[[-.48,-1.02,-.27],[.73,-.96,-.5],[1.10,-1.68,-.4],[1.15,-2.00,-.10]]];
 const connections=arches.map(a=>{const line=assets.makeConnection(a);world.add(line.tube);const signal=assets.makeSignal();world.add(signal);return {...line,signal};});
 // Minimal pinpoints give depth without creating a second, distracting particle system.
 const motes=new THREE.Group();world.add(motes);for(let i=0;i<13;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.012+(i%3)*.004,8,6),new THREE.MeshBasicMaterial({color:0xbca67c,transparent:true,opacity:.28}));dot.position.set(Math.sin(i*2.8)*3.4,Math.cos(i*1.9)*3.3,-1.5-(i%4)*.4);motes.add(dot);}
 const tmp=new THREE.Vector3();
 function placeLabel(index){const p=destination[index],offset=index===1?-.96:index===0?-1.00:index===2?-1.07:-1.05;tmp.set(p[0],p[1]+offset,p[2]).applyMatrix4(world.matrixWorld).project(camera);labels[index].style.left=`${(tmp.x*.5+.5)*visual.clientWidth}px`;labels[index].style.top=`${(-tmp.y*.5+.5)*visual.clientHeight}px`;}
 resizeScene=()=>{const w=visual.clientWidth,h=visual.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7,Math.sqrt(1200000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();world.scale.setScalar(Math.min(1,camera.aspect*1.12));};
 render=(p,staticMode)=>{
  const alignment=between(p,.17,.51);
  models.forEach((model,i)=>{const t=i<4?alignment:between(p,.24+(i-4)*.035,.48);const pose=poses[i];model.position.lerpVectors(pose.from,pose.to,t);
   // Distinct curved paths, all reversible and entirely determined by scroll progress.
   model.position.x+=Math.sin(t*Math.PI)*[.18,-.20,.28,.12,-.75,-.70][i];model.position.y+=Math.sin(t*Math.PI)*[.22,.3,-.05,.18,.60,-.16][i];model.position.z+=Math.sin(t*Math.PI)*[.4,.25,.5,.2,.6,.85][i];
   model.quaternion.slerpQuaternions(pose.start,pose.end,t);model.scale.setScalar(lerp(initialScale[i],finalScale[i],t));model.visible=i<4||t<.999;
  });
  // Subtle, scrubbed movement adds life without an endless render loop.
  envelope.userData.letter.position.y=.46+between(p,.12,.4)*.12;
  engine.rotation.y+=p*.55;engine.rotation.z+=Math.sin(p*Math.PI)*.12;
  const orbit=p*Math.PI*3;engine.userData.orb.position.set(Math.cos(orbit)*.76,Math.sin(orbit)*.65,.13);
  const seal=between(p,.73,.82);approval.userData.badge.position.z=.18+Math.sin(seal*Math.PI)*.18;approval.userData.badge.scale.setScalar(1+Math.sin(seal*Math.PI)*.12);
  plane.position.x+=between(p,.9,1)*.20;plane.position.y+=between(p,.9,1)*.10;
  plane.userData.receipt.scale.setScalar(lerp(.65,1,between(p,.82,.93)));
  for(let i=0;i<3;i++){const line=connections[i],show=between(p,.41+i*.025,.55+i*.025);line.tube.material.opacity=show*.67;line.tube.visible=show>.001;
   const a=[.52,.65,.84][i],b=[.64,.74,.96][i],signal=clamp((p-a)/(b-a));line.signal.visible=p>a&&p<b;line.signal.position.copy(line.curve.getPoint(signal));
  }
  motes.visible=p<.65;motes.children.forEach(m=>m.material.opacity=.24*(1-between(p,.3,.65)));
  world.rotation.y=lerp(-.045,.03,alignment);world.updateMatrixWorld(true);
  labels.forEach((label,i)=>{placeLabel(i);label.style.opacity=staticMode?0:between(p,.49,.56);});
  renderer.render(scene,camera);
 };
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback('WebGL context lost');});
 resizeScene();new ResizeObserver(()=>{resizeScene();request();}).observe(visual);
 await renderer.compileAsync(scene,camera);measure();progress=target;render(progress,isStatic());request();
}
build().catch(fallback);
