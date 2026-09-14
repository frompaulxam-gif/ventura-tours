import * as THREE from '../connected-v2/vendor/three.module.min.js';
import {GLTFLoader} from '../flow/vendor/GLTFLoader.js';
import {environment} from '../connected-v2/assets.js?v=4';
const $=s=>document.querySelector(s),journey=$('#journey'),stage=$('.stage'),visual=$('.visual'),canvas=$('#scene');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),short=matchMedia('(max-height:650px)'),mobile=matchMedia('(max-width:760px)');
const variants={
 bottleneck:{edition:'01 / The bottleneck',kicker:'Make room for progress.',title:'Work stops<br><em>waiting.</em>',copy:'AI routes enquiries, prepares reports and moves routine tasks forward. Your team keeps control of the decisions.',opening:'Everything waiting on the same step.<br><span>Open a better way through.</span>',hint:'Scroll to clear the bottleneck ↓',description:'A backlog queues at a closed manual gate. AI opens the mechanism and routes the work into three organised lanes.'},
 dashboard:{edition:'02 / Living dashboard',kicker:'Connected data. Clearer decisions.',title:'See the<br><em>whole picture.</em>',copy:'AI brings scattered business data into one useful overview, with a clear summary ready for your review.',opening:'Different figures. Different places.<br><span>Bring the picture together.</span>',hint:'Scroll to reveal the bigger picture ↓',description:'Separate dimensional charts and loose data records assemble into one polished business dashboard with an AI summary.'}
};
let variant=new URLSearchParams(location.search).get('variation');if(!variants[variant])variant='bottleneck';
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10)},range=(p,a,b)=>ease((p-a)/(b-a)),mix=(a,b,t)=>a+(b-a)*t;
let progress=0,target=0,distance=1,start=0,paused=false,failed=false,visible=true,raf=0,last=0,render=null,resizeScene=null;
const isStatic=()=>paused||reduced.matches||short.matches||failed;
function measure(){start=journey.getBoundingClientRect().top+scrollY;distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);target=isStatic()?1:clamp((scrollY-start)/distance)}
function paint(p){
 const intro=1-range(p,.035,.16),reveal=range(p,.50,.70),d=variants[variant];
 $('.opening').style.opacity=intro;$('.opening').style.visibility=intro>.001?'visible':'hidden';$('#reveal').style.opacity=reveal;$('#reveal').style.visibility=reveal>.001?'visible':'hidden';$('#reveal').inert=reveal<.1;$('#reveal').style.transform=`translateY(${22*(1-reveal)}px)`;$('#progress').style.transform=`scaleX(${p})`;
 $('.scroll-note').textContent=p>.73?'Before → AI → After':d.hint;
 $('#state-tag').textContent=p<.28?'BEFORE AI':'WITH AI';
 $('#state-copy').textContent=variant==='bottleneck'?(p<.28?'A queue that never clears.':'Three routes. Work moves forward.'):(p<.28?'Useful data. An incomplete picture.':'One view. Ready for your review.');
 $('.state').style.opacity=1-range(p,.45,.65);
}
function choose(next,replay=false){
 if(!variants[next])return;variant=next;const d=variants[next];document.body.dataset.variant=next;
 $('#edition').textContent=d.edition;$('#reveal .eyebrow').textContent=d.kicker;$('#title').innerHTML=d.title;$('#reveal .copy').textContent=d.copy;$('.opening').innerHTML=d.opening;visual.setAttribute('aria-label',d.description);
 document.querySelectorAll('[data-variant]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.variant===next))});
 const url=new URL(location.href);url.searchParams.set('variation',next);history.replaceState(null,'',url);
 if(replay)scrollTo({top:0,behavior:'instant'});measure();progress=target;resizeScene?.();paint(progress);request();
}
for(const b of document.querySelectorAll('button[data-variant]'))b.addEventListener('click',()=>choose(b.dataset.variant,true));
for(const b of document.querySelectorAll('[data-replay]'))b.addEventListener('click',()=>choose(b.dataset.replay,true));

function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick)}
function tick(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min(50,now-last):16;last=now;progress+=(target-progress)*(1-Math.exp(-dt/95));if(Math.abs(target-progress)<.00008)progress=target;paint(progress);render?.(progress,variant);if(progress!==target)request()}
function mode(){const oldHeight=journey.offsetHeight,oldY=scrollY;document.body.classList.toggle('static',isStatic());if(isStatic()&&oldY>start)scrollTo({top:oldY>=start+oldHeight?oldY+journey.offsetHeight-oldHeight:start,behavior:'instant'});measure();progress=target;paint(progress);resizeScene?.();request()}
window.addEventListener('scroll',()=>{target=isStatic()?1:clamp((scrollY-start)/distance);request()},{passive:true});window.addEventListener('resize',()=>{measure();resizeScene?.();request()},{passive:true});window.addEventListener('pageshow',()=>{measure();progress=target;request()});
reduced.addEventListener('change',mode);short.addEventListener('change',mode);
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;$('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').textContent=paused?'Enable motion ▷':'Reduce motion Ⅱ';mode()});
$('#replay').addEventListener('click',()=>{journey.scrollIntoView({behavior:reduced.matches?'instant':'smooth'})});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden){measure();progress=target;request()}});
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible){measure();progress=target;last=0;request()}else{cancelAnimationFrame(raf);raf=0}}).observe(journey);
function fallback(error){console.warn('AI directions: showing the still layout.',error);failed=true;render=null;document.body.classList.add('no-canvas');mode()}
choose(variant);mode();
async function build(){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});renderer.setClearColor(0,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60);camera.position.set(0,0,12);
 const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.8;scene.add(new THREE.HemisphereLight(0xfff5de,0x303542,1.2));
 for(const [c,p,xyz]of[[0xffefd0,2.4,[-4,5,6]],[0xe3edff,1.7,[5,0,6]],[0xffdfa0,1.5,[0,4,-3]]]){const l=new THREE.DirectionalLight(c,p);l.position.set(...xyz);scene.add(l)}
 const gltf=await new GLTFLoader().loadAsync('assets/ai-directions.glb?v=1');
 const inks=new Map();gltf.scene.traverse(o=>{if(!o.isMesh)return;const fix=m=>{if(!/ink/i.test(m.name))return m;if(!inks.has(m.uuid))inks.set(m.uuid,new THREE.MeshBasicMaterial({color:/Secondary/.test(m.name)?0x5b615d:0x242b28}));return inks.get(m.uuid)};o.material=Array.isArray(o.material)?o.material.map(fix):fix(o.material)});
 const V=a=>new THREE.Vector3(...a),Q=a=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...a)),identity=Q([0,0,0]);
 const asset=name=>{const t=gltf.scene.getObjectByName(name);if(!t)throw Error(`Missing Blender object: ${name}`);const o=t.clone(true);o.traverse(m=>{if(m.isMesh)m.frustumCulled=false});return o};
 const bottleneck=new THREE.Group(),dashboard=new THREE.Group();scene.add(bottleneck,dashboard);
 const gate=asset('GateFrame'),top=asset('GateTop'),bottom=asset('GateBottom');bottleneck.add(gate,top,bottom);
 const trays=['TrayEnquiries','TrayReports','TrayTasks'].map((name,i)=>{const o=asset(name);o.position.set(3.25,(1-i)*1.05,-.13);bottleneck.add(o);return o});
 const packetNames=['PacketEnquiry','PacketReport','PacketTask'];
 const packets=Array.from({length:15},(_,i)=>{const lane=i%3,slot=Math.floor(i/3),model=asset(packetNames[lane]);bottleneck.add(model);return{model,lane,slot,from:V([-1.42-slot*.59+(lane-1)*.08,(lane-1)*.33+Math.sin(i*2)*.1,.30-slot*.055]),angle:Q([.12,Math.sin(i)*.14,Math.sin(i*1.7)*.20])}});
 const wireMaterial=new THREE.MeshStandardMaterial({color:0xd8bd83,metalness:.55,roughness:.4,transparent:true});
 const paths=[[[.76,0,-.18],[1.34,.1,-.18],[1.8,1.05,-.18],[2,1.05,-.18]],[[.76,0,-.18],[1.4,0,-.18],[2,0,-.18]],[[.76,0,-.18],[1.34,-.1,-.18],[1.8,-1.05,-.18],[2,-1.05,-.18]]];
 const wires=paths.map(points=>{const curve=new THREE.CatmullRomCurve3(points.map(V));const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,60,.018,8,false),wireMaterial.clone());bottleneck.add(tube);return tube});
 const gateBaseTop=top.position.clone(),gateBaseBottom=bottom.position.clone();
 const board=asset('DashboardFrame');dashboard.add(board);
 const panels=[['RevenueChart',[-3.0,.35,.85],[-1.34,-.22,.13],[-.17,.26,-.23]],['EnquiryChart',[2.45,1.8,.1],[1.73,.36,.13],[.14,-.3,.20]],['OperationsTable',[2.2,-1.3,.75],[1.73,-.98,.13],[-.1,.24,-.19]],['SummaryDock',[-.7,-2.9,-.3],[0,-1.80,.14],[.25,-.10,.08]]].map(([name,from,to,angle])=>{const model=asset(name);dashboard.add(model);return{model,from:V(from),to:V(to),angle:Q(angle)}});
 const records=Array.from({length:12},(_,i)=>{const model=asset('DataRecord'),angle=i*2.399963;dashboard.add(model);return{model,from:V([Math.cos(angle)*(3.5+(i%2)*.4),Math.sin(angle)*2.9,-.3+(i%3)*.4]),angle:Q([.1,.16*Math.sin(i),Math.sin(i*2)*.3])}});
 const labels=[...document.querySelectorAll('.labels span')],point=new THREE.Vector3();let width=10,fitBottle=1,fitDashboard=1;
 const vh=2*Math.tan(35*Math.PI/360)*12;
 resizeScene=()=>{const w=visual.clientWidth,h=visual.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65,Math.sqrt(1250000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();width=vh*camera.aspect;fitBottle=Math.min(1,width/10.5);fitDashboard=Math.min(1,width/8.7)};
 function label(i,text,pos,root,opacity){point.copy(pos).applyMatrix4(root.matrixWorld).project(camera);labels[i].textContent=text;labels[i].style.left=`${(point.x*.5+.5)*visual.clientWidth}px`;labels[i].style.top=`${(-point.y*.5+.5)*visual.clientHeight}px`;labels[i].style.opacity=opacity}
 function routeWork(p){
  const open=range(p,.09,.26),rise=range(p,.32,.56);bottleneck.scale.setScalar(fitBottle*1.3);bottleneck.position.set(mix(2,-2.1,rise)*fitBottle,mix(0,mobile.matches?.60:1.12,rise),0);
  const retract=1-range(p,.26,.40);top.position.copy(gateBaseTop);bottom.position.copy(gateBaseBottom);top.position.y+=open*.98;bottom.position.y-=open*.98;top.scale.setScalar(Math.max(.001,retract));bottom.scale.setScalar(Math.max(.001,retract));top.visible=bottom.visible=retract>.001;
  const show=range(p,.19,.32);trays.forEach(o=>{o.scale.setScalar(Math.max(.001,show));o.visible=show>.001});
  packets.forEach(({model,lane,slot,from,angle},i)=>{const t=range(p,.09+i*.008,.37+i*.008);const y=(1-lane)*1.05;let pos;
   if(t<.42){pos=from.clone().lerp(V([-.52,0,.26]),t/.42)}
   else if(t<.64){pos=V([mix(-.52,1.20,(t-.42)/.22),0,.26])}
   else{const a=(t-.64)/.36;pos=V([mix(1.20,3.10+slot*.19,a),y*ease(a),mix(.26,.16+slot*.018,a)])}
   model.position.copy(pos);model.quaternion.slerpQuaternions(angle,identity,range(t,.1,.7));model.scale.setScalar(mix(.91,.44,range(t,.45,1)));
  });
  wires.forEach(tube=>{const r=range(p,.24,.36);tube.visible=r>.001;tube.material.opacity=r*.9;tube.geometry.setDrawRange(0,Math.floor(tube.geometry.index.count*r/3)*3)});
  bottleneck.updateMatrixWorld(true);
  label(0,p<.35?'MANUAL BACKLOG':'BACKLOG CLEARED',V([-2.9,-1.33,0]),bottleneck,1-range(p,.42,.64));
  label(1,'AI SORTS & ROUTES',V([0,-1.87,0]),bottleneck,range(p,.25,.42));
  label(2,'THREE WORKFLOWS',V([3.25,-1.75,0]),bottleneck,range(p,.32,.49));
 }
 function assembleDashboard(p){
  const dock=range(p,.05,.43),shift=range(p,.30,.56),mobileView=mobile.matches;
  dashboard.scale.setScalar(fitDashboard*mix(mobileView?.74:1,mobileView?1.12:.98,shift));dashboard.position.set(mobileView?0:width*.245*shift,mobileView?.55*shift:.2*shift,0);dashboard.rotation.set(mix(.12,.015,shift),mix(-.16,-.08,shift),mix(-.06,0,shift));
  const frame=range(p,.16,.36);board.visible=frame>.001;board.scale.setScalar(Math.max(.001,frame));board.position.z=-.28*(1-frame);
  panels.forEach(({model,from,to,angle},i)=>{const t=range(p,.045+i*.013,.36+i*.017);model.position.lerpVectors(from,to,t);model.quaternion.slerpQuaternions(angle,identity,t);model.scale.setScalar(mix(i===3?.76:1,1,t))});
  records.forEach(({model,from,angle},i)=>{const t=range(p,.04+(i%3)*.015,.24+(i%3)*.025);model.position.lerpVectors(from,V([0,0,-.1]),t);model.position.z+=Math.sin(t*Math.PI)*.35;model.quaternion.slerpQuaternions(angle,identity,t);model.scale.setScalar(Math.max(.001,.66*(1-range(t,.32,1))));model.visible=t<.999});
  dashboard.updateMatrixWorld(true);label(0,'ONE CONNECTED OVERVIEW',V([0,-2.38,0]),dashboard,mobileView?0:range(p,.40,.58));
 }
 render=(p,type)=>{bottleneck.visible=type==='bottleneck';dashboard.visible=type==='dashboard';labels.forEach(e=>e.style.opacity=0);if(bottleneck.visible)routeWork(p);else assembleDashboard(p);renderer.render(scene,camera)};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('WebGL context lost')});resizeScene();new ResizeObserver(()=>{resizeScene();request()}).observe(visual);renderer.compile(scene,camera);measure();progress=target;render(progress,variant);paint(progress);document.body.classList.add('ready');request();
}
build().catch(fallback);
