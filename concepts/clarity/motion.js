const $=s=>document.querySelector(s);
const journey=$('#journey'),stage=$('.stage'),visual=$('#visual'),canvas=$('#scene');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),compact=matchMedia('(max-height:650px)'),mobile=matchMedia('(max-width:760px)');
const clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10);};
const range=(p,a,b)=>smooth((p-a)/(b-a));
const directions={
 mind:{number:'01',name:'Clear the mind',kicker:'A little less noise.',title:'Make room<br><em>for better thinking.</em>',copy:'We connect the information, tools and tasks around you. So your team can focus on the work that matters.',opening:'A lot coming at you.<br><span>A clearer way ahead.</span>',hint:'Scroll to clear your space ↓',description:'Scattered data and tasks gather into one calm focal point. The sculpture rises and a centred headline appears in the space below.',reveal:[.58,.76]},
 signal:{number:'02',name:'Find the signal',kicker:'The useful things, made clear.',title:'From information<br><em>to clear direction.</em>',copy:'Bring your data into focus. Turn what you know into decisions that move your business forward.',opening:'So much information.<br><span>Let’s find what matters.</span>',hint:'Scroll to find the signal ↓',description:'Scattered charts sort into neat rows, then gather into three steps: insight, intelligence and judgement. A headline appears below.',reveal:[.48,.66]},
 connected:{number:'03',name:'Everything clicks',kicker:'Less friction. More flow.',title:'Good work.<br><em>All connected.</em>',copy:'From the first enquiry to the next action. Practical AI connects the pieces, with your team in control.',opening:'All the right pieces.<br><span>One better way to work.</span>',hint:'Scroll to connect the pieces ↓',description:'Scattered work gathers into four connected steps. The workflow moves to one side, making room for the headline.',reveal:[.69,.86]},
 untangle:{number:'04',name:'Untangle',kicker:'Let the tension fall away.',title:'A clearer mind.<br><em>A lighter day.</em>',copy:'Less pulling you in every direction. More space for the ideas, people and decisions that matter.',opening:'Pulled in every direction.<br><span>Let it slowly unravel.</span>',hint:'Scroll to untangle ↓',description:'An intricate knot of silver and champagne threads loosens into three gently flowing lines. The tension clears and the message appears beneath.',reveal:[.70,.88]},
 exhale:{number:'05',name:'Exhale',kicker:'You don’t have to hold it all.',title:'And then,<br><em>room to breathe.</em>',copy:'Less to hold in your head. More room for your next idea.',opening:'Everything, all at once.<br><span>Let a little of it go.</span>',hint:'Scroll to let go ↓',description:'A tightly packed cloud of soft pearlescent forms opens outwards in a slow release. The middle clears completely and reveals a centred message.',reveal:[.42,.67]}
};
let variation=new URLSearchParams(location.search).get('variation');if(!directions[variation])variation='untangle';
let p=0,target=0,start=0,distance=1,raf=0,last=0,visible=true,paused=false,failed=false,render=null,resizeScene=null;
function isStatic(){return reduced.matches||compact.matches||paused||failed;}
function measure(){start=journey.getBoundingClientRect().top+scrollY;distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);target=isStatic()?1:clamp((scrollY-start)/distance);}
function paint(progress){
 const d=directions[variation],intro=1-range(progress,.09,.24),reveal=range(progress,...d.reveal);
 $('#opening-caption').style.opacity=intro;$('#opening-caption').style.visibility=intro>.001?'visible':'hidden';
 $('#reveal').style.opacity=reveal;$('#reveal').style.visibility=reveal>.001?'visible':'hidden';$('#reveal').inert=reveal<.1;
 $('#reveal').style.transform=`translateY(${(1-reveal)*24}px)`;
 $('#progress').style.transform=`scaleX(${progress})`;
 $('.stage-label').style.opacity=variation==='exhale'?1-range(progress,.20,.40):1;
 $('#scroll-hint').style.opacity=variation==='exhale'?1-range(progress,.24,.42):1;
 $('#scroll-hint').textContent=progress>.93?(variation==='exhale'?'Room to breathe.':'A little more room to think.'):d.hint;
}
function tick(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min(now-last,50):16;last=now;p+=(target-p)*(1-Math.exp(-dt/105));if(Math.abs(p-target)<.00008)p=target;paint(p);render?.(p,variation);if(p!==target)raf=requestAnimationFrame(tick);}
function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
function mode(){const h=journey.offsetHeight,y=scrollY,below=y>=start+h;document.body.classList.toggle('static',isStatic());if(isStatic()&&y>start)scrollTo({top:below?y+journey.offsetHeight-h:start,behavior:'instant'});measure();p=target;paint(p);request();}
function select(next){
 if(!directions[next])return;
 const oldStart=journey.getBoundingClientRect().top+scrollY,oldHeight=journey.offsetHeight,oldY=scrollY;
 const fraction=clamp((oldY-oldStart)/Math.max(1,oldHeight-stage.offsetHeight));
 variation=next;const d=directions[next];document.body.dataset.variation=next;
 document.querySelectorAll('button[data-variation]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variation===next)));
 $('#direction-name').textContent=`${d.number} — ${d.name}`;$('#reveal-kicker').textContent=d.kicker;$('#hero-title').innerHTML=d.title;$('#reveal-copy').textContent=d.copy;$('#opening-caption').innerHTML=d.opening;visual.setAttribute('aria-label',d.description);
 // Keep the same point in the study when switching to or from Signal's shorter track.
 if(journey.offsetHeight!==oldHeight){
  const nextY=oldY>=oldStart+oldHeight?oldY+journey.offsetHeight-oldHeight:oldStart+fraction*Math.max(1,journey.offsetHeight-stage.offsetHeight);
  scrollTo({top:nextY,behavior:'instant'});
 }
 measure();p=target;
 const url=new URL(location.href);url.searchParams.set('variation',next);history.replaceState(null,'',url);paint(p);request();
}
for(const b of document.querySelectorAll('button[data-variation]'))b.addEventListener('click',()=>select(b.dataset.variation));
for(const b of document.querySelectorAll('[data-replay]'))b.addEventListener('click',()=>{select(b.dataset.replay);journey.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;$('#motion-toggle').textContent=paused?'Enable motion ▷':'Reduce motion Ⅱ';$('#motion-toggle').setAttribute('aria-pressed',String(paused));mode();});
reduced.addEventListener('change',mode);compact.addEventListener('change',mode);
window.addEventListener('scroll',()=>{target=isStatic()?1:clamp((scrollY-start)/distance);request();},{passive:true});
window.addEventListener('resize',()=>{measure();resizeScene?.();request();},{passive:true});
window.addEventListener('pageshow',()=>{measure();p=target;request();});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden){measure();p=target;request();}});
if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){measure();p=target;last=0;request();}else{cancelAnimationFrame(raf);raf=0;}}).observe(journey);
function fallback(error){console.warn('Clarity preview: showing the still layout.',error);failed=true;render=null;document.body.classList.add('no-canvas');mode();}
select(variation);mode();

async function build(){
 const [THREE,assets,emotionalModule]=await Promise.all([import('../connected-v2/vendor/three.module.min.js'),import('../connected-v2/assets.js?v=4'),import('./emotional.js?v=2'),document.fonts.ready]);
 const renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'low-power'});renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,50);camera.position.set(0,0,12.9);
 const env=assets.environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.68;
 scene.add(new THREE.HemisphereLight(0xfff8ef,0x303036,1.4));for(const[color,intensity,position]of[[0xffefce,3,[-3,5,7]],[0xf0f2f5,1.5,[5,-1,4]],[0xe9c994,2,[2,4,-4]]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);}
 const world=new THREE.Group();scene.add(world);
 const emotional=emotionalModule.createEmotionalScenes(THREE);scene.add(emotional.untangle,emotional.exhale);
 const v=a=>new THREE.Vector3(...a),quat=a=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...a));
 const models=[assets.makeEnvelope(),assets.makeIntelligence(),assets.makeApproval(),assets.makePlane(),assets.makeDocuments(),assets.makeAnalytics()];models.forEach(m=>world.add(m));
 const sources=[[-2.25,1.70,.55],[0,0,.65],[2,-1.25,-.25],[.2,-2.6,.55],[1.85,2,-.5],[-2,-1.5,.15]].map(v);
 const angles=[[.18,-.32,-.22],[.2,-.25,.1],[.05,-.36,.2],[.38,-.18,.06],[.04,-.28,.2],[-.07,.34,-.2]].map(quat);
 const sizes=[.92,1.12,.91,.74,.87,.80];
 const templates=assets.makeClutterLibrary();
 const layout=[[6,-.63,2.52,-.7,.86,-.25],[1,-2.90,.14,.1,.79,.26],[7,2.93,.54,-.55,.87,-.22],[11,.46,3.09,-.8,.9,.13],[9,-2.99,2.99,-1.2,.78,.21],[8,.55,1.43,.22,.86,-.30],[10,2.86,-2.69,-.65,.82,.29],[1,-1.09,-3.03,-.8,.77,-.24],[7,-3.02,-2.53,-1,.78,.30],[11,1.06,-.82,-.7,.77,-.19],[9,3.08,2.66,-1.3,.76,-.28],[5,-1.44,.34,-.45,.84,.50],[6,-.39,-1.26,-1,.71,.24],[1,2.64,1.04,-1.4,.62,-.23],[10,-1.31,3.13,-1.55,.65,-.12],[11,1.74,-3.14,-1.1,.67,.14],[8,-3.2,-.79,-1.2,.78,-.23],[5,1.73,3.12,-1.1,.62,.65]];
 const fragments=layout.map(([type,x,y,z,size,az],i)=>{const model=templates[type].clone(true);world.add(model);return {model,from:v([x,y,z]),rotation:quat([.1*Math.sin(i),.25*Math.cos(i*2),az]),size};});
 const links=new THREE.Group();world.add(links);
 const connectedPositions=[[-1.8,1.20,0],[1.6,1.2,0],[-1.8,-1.35,0],[1.6,-1.35,0]].map(v);
 const curves=[[[ -.8,1.2,-.2],[.12,1.36,-.4],[.72,1.3,-.3]],[[1.56,.48,-.2],[1.25,-.05,-.3],[-1.63,-.10,-.35],[-1.76,-.65,-.2]],[[-.78,-1.40,-.2],[.16,-1.40,-.4],[.85,-1.44,-.3]]];
 const wires=curves.map(points=>{const line=assets.makeConnection(points);links.add(line.tube);const pulse=assets.makeSignal();links.add(pulse);return {...line,pulse};});
 const rail=assets.makeConnection([[-3.55,.22,-.25],[0,.22,-.25],[3.55,.22,-.25]]);world.add(rail.tube);const railSignal=assets.makeSignal();world.add(railSignal);
 const labels=[...document.querySelectorAll('.node-labels span')],point=new THREE.Vector3(),sink=new THREE.Vector3(),identity=new THREE.Quaternion();
 let fit=1,viewWidth=10;const viewHeight=2*Math.tan(36*Math.PI/360)*12.9;
 const ringBase=models[1].userData.rings.map(r=>r.rotation.clone());
 function positionLabel(index,anchor,text,opacity){point.copy(anchor).applyMatrix4(world.matrixWorld).project(camera);const e=labels[index];e.textContent=text;e.style.left=`${(point.x*.5+.5)*visual.clientWidth}px`;e.style.top=`${(-point.y*.5+.5)*visual.clientHeight}px`;e.style.opacity=opacity;}
 function move(m,from,to,a,b,t,scale){m.visible=scale>.003;m.position.lerpVectors(from,to,t);m.quaternion.slerpQuaternions(a,b,t);m.scale.setScalar(Math.max(.001,scale));}
 function clearMind(progress){
  const clear=range(progress,.12,.52),rise=range(progress,.46,.70);sink.set(0,0,-.20);
  models.forEach((m,i)=>{if(i===1){m.position.set(0,mix(0,2.12,rise),.6);m.quaternion.copy(angles[i]);m.rotation.y+=progress*.42;m.scale.setScalar(mix(sizes[i],1.42,rise));return;}const t=range(progress,.13+(i%3)*.03,.43+(i%3)*.045);move(m,sources[i],sink,angles[i],identity,t,sizes[i]*(1-range(t,.36,1)));const arc=Math.sin(t*Math.PI);m.position.x+=arc*sources[i].y*.20;m.position.y-=arc*sources[i].x*.12;});
  fragments.forEach(({model,from,rotation,size},i)=>{const t=range(progress,.08+(i%3)*.035,.38+(i%3)*.05);move(model,from,sink,rotation,identity,t,size*(1-range(t,.44,1)));model.position.x+=Math.sin(t*Math.PI)*from.y*.22;model.position.y-=Math.sin(t*Math.PI)*from.x*.14;});
  models[1].userData.rings.forEach((ring,i)=>{ring.rotation.copy(ringBase[i]);ring.rotation.z+=clear*(i-1)*.25;});
 }
 const signalDest=[[-2.55,1.35,0],[0,1.35,0],[2.55,1.35,0]].map(v),signalIndices=[5,1,2];
 function findSignal(progress){
  world.scale.setScalar(fit*(mobile.matches?.86:1));
  const order=range(progress,.04,.21),resolve=range(progress,.05,.28);sink.set(0,1.35,-.25);
  models.forEach((m,i)=>{const slot=signalIndices.indexOf(i),t=slot>=0?resolve:range(progress,.04,.23);const from=sources[i].clone();from.x*=1.14;from.y*=.76;const to=slot>=0?signalDest[slot]:sink;move(m,from,to,angles[i],identity,t,slot>=0?mix(sizes[i],i===1?.98:.92,t):sizes[i]*(1-range(t,.2,1)));m.position.y+=Math.sin(t*Math.PI)*.18;});
  fragments.forEach(({model,from,rotation,size},i)=>{const row=v([-3.05+(i%6)*1.22,-.28-Math.floor(i/6)*.72,-.4]);const initial=from.clone();initial.x*=1.14;initial.y*=.76;const collect=range(progress,.20+(i%3)*.012,.37+(i%3)*.015);move(model,initial,row,rotation,identity,order,size*mix(1,.60,order));model.position.lerp(sink,collect);model.scale.multiplyScalar(1-collect);model.visible=collect<.998;});
  const reveal=range(progress,.28,.43);rail.tube.visible=reveal>0;rail.tube.material.opacity=reveal*.75;rail.tube.geometry.setDrawRange(0,Math.floor(rail.tube.geometry.index.count*reveal/3)*3);railSignal.visible=progress>.43&&progress<.72;railSignal.position.copy(rail.curve.getPoint(clamp((progress-.43)/.29)));
  world.updateMatrixWorld(true);signalDest.forEach((pos,i)=>positionLabel(i,v([pos.x,pos.y-1.50,0]),['01 / Insight','02 / Intelligence','03 / Judgement'][i],range(progress,.38,.46)));
 }
 function everythingClicks(progress){
  const assemble=range(progress,.16,.54),shift=range(progress,.57,.82);sink.set(0,0,-.3);
  models.forEach((m,i)=>{const t=i<4?assemble:range(progress,.18,.48);move(m,sources[i],i<4?connectedPositions[i]:sink,angles[i],identity,t,i<4?mix(sizes[i],i===1?.85:.83,t):sizes[i]*(1-range(t,.30,1)));m.position.y+=Math.sin(t*Math.PI)*.18;});
  fragments.forEach(({model,from,rotation,size},i)=>{const t=range(progress,.10+(i%3)*.04,.39+(i%3)*.045);move(model,from,sink,rotation,identity,t,size*(1-range(t,.35,1)));model.position.x+=Math.sin(t*Math.PI)*from.y*.13;});
  world.scale.setScalar(fit*mix(1,mobile.matches?.74:.85,shift));world.position.set(mobile.matches?0:viewWidth*.225*shift,mobile.matches?1.56*shift:.20*shift,0);
  links.visible=true;wires.forEach((line,i)=>{const reveal=range(progress,.40+i*.035,.58+i*.035);line.tube.material.opacity=reveal*.85;line.tube.geometry.setDrawRange(0,Math.floor(line.tube.geometry.index.count*reveal/3)*3);const t=clamp((progress-(.61+i*.085))/.085);line.pulse.visible=t>0&&t<1;line.pulse.position.copy(line.curve.getPoint(t));});
  world.updateMatrixWorld(true);connectedPositions.forEach((pos,i)=>positionLabel(i,v([pos.x,pos.y-(i===0?1.00:.92),0]),['Information','AI prepares','You approve','Action'][i],range(progress,.66,.80)));
 }
 resizeScene=()=>{const w=visual.clientWidth,h=visual.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65,Math.sqrt(1200000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fit=Math.min(1,camera.aspect*1.17);viewWidth=2*Math.tan(36*Math.PI/360)*12.9*camera.aspect;};
 render=(progress,type)=>{
  const isEmotional=type==='untangle'||type==='exhale';world.visible=!isEmotional;
  emotional.update(progress,type,fit,viewWidth,viewHeight);
  labels.forEach(e=>e.style.opacity=0);
  if(isEmotional){renderer.render(scene,camera);return;}
  world.position.set(0,0,0);world.rotation.set(0,0,0);world.scale.setScalar(fit);links.visible=false;rail.tube.visible=false;railSignal.visible=false;labels.forEach(e=>e.style.opacity=0);models.forEach(m=>m.visible=true);models[1].userData.rings.forEach((r,i)=>r.rotation.copy(ringBase[i]));
  if(type==='mind')clearMind(progress);else if(type==='signal')findSignal(progress);else everythingClicks(progress);
  const orbit=progress*Math.PI*2;models[1].userData.orb.position.set(Math.cos(orbit)*.76,Math.sin(orbit)*.65,.13);
  renderer.render(scene,camera);
 };
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback('WebGL context lost');});
 resizeScene();new ResizeObserver(()=>{resizeScene();request();}).observe(visual);await renderer.compileAsync(scene,camera);measure();p=target;render(p,variation);request();
}
build().catch(fallback);
