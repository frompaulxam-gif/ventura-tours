import * as THREE from '../connected-v2/vendor/three.module.min.js';
import {GLTFLoader} from '../flow/vendor/GLTFLoader.js';
import {environment} from '../connected-v2/assets.js?v=4';
const $=s=>document.querySelector(s),journey=$('#journey'),stage=$('.stage'),visual=$('.visual'),canvas=$('#scene');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),short=matchMedia('(max-height:650px)'),mobile=matchMedia('(max-width:760px)');
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10)},range=(p,a,b)=>ease((p-a)/(b-a)),mix=(a,b,t)=>a+(b-a)*t;
let progress=0,target=0,distance=1,start=0,paused=false,failed=false,visible=true,raf=0,last=0,render=null,resizeScene=null;
const isStatic=()=>paused||reduced.matches||short.matches||failed;
function measure(){start=journey.getBoundingClientRect().top+scrollY;distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);target=isStatic()?1:clamp((scrollY-start)/distance)}
function paint(p){const intro=1-range(p,.04,.19),reveal=range(p,.49,.68);$('.opening').style.opacity=intro;$('.opening').style.visibility=intro>.001?'visible':'hidden';$('#reveal').style.opacity=reveal;$('#reveal').style.visibility=reveal>.001?'visible':'hidden';$('#reveal').inert=reveal<.1;$('#reveal').style.transform=`translateY(${22*(1-reveal)}px)`;$('#progress').style.transform=`scaleX(${p})`;$('.scroll-note').textContent=p>.72?'Information → AI → Approval → Action':'Scroll to connect your work ↓'}
function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick)}
function tick(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min(50,now-last):16;last=now;progress+=(target-progress)*(1-Math.exp(-dt/95));if(Math.abs(target-progress)<.00008)progress=target;paint(progress);render?.(progress);if(progress!==target)request()}
function mode(){const oldHeight=journey.offsetHeight,oldY=scrollY;document.body.classList.toggle('static',isStatic());if(isStatic()&&oldY>start)scrollTo({top:oldY>=start+oldHeight?oldY+journey.offsetHeight-oldHeight:start,behavior:'instant'});measure();progress=target;paint(progress);resizeScene?.();request()}
window.addEventListener('scroll',()=>{target=isStatic()?1:clamp((scrollY-start)/distance);request()},{passive:true});window.addEventListener('resize',()=>{measure();resizeScene?.();request()},{passive:true});window.addEventListener('pageshow',()=>{measure();progress=target;request()});
reduced.addEventListener('change',mode);short.addEventListener('change',mode);
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;$('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').textContent=paused?'Enable motion ▷':'Reduce motion Ⅱ';mode()});
$('#replay').addEventListener('click',()=>{journey.scrollIntoView({behavior:reduced.matches?'instant':'smooth'})});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden){measure();progress=target;request()}});
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible){measure();progress=target;last=0;request()}else{cancelAnimationFrame(raf);raf=0}}).observe(journey);
function fallback(error){console.warn('Signal Studio: showing the still layout.',error);failed=true;render=null;document.body.classList.add('no-canvas');mode()}
mode();
async function build(){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60);camera.position.set(0,0,12);
 const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.8;
 scene.add(new THREE.HemisphereLight(0xfff7e4,0x333744,1.2));
 for(const [color,power,pos]of[[0xfff1d4,2.5,[-4,5,6]],[0xe6eeff,1.7,[4,1,5]],[0xffdfa2,1.4,[0,4,-3]]]){const light=new THREE.DirectionalLight(color,power);light.position.set(...pos);scene.add(light)}
 const gltf=await new GLTFLoader().loadAsync('assets/ventura-ai-workflow.glb?v=1');
 const world=new THREE.Group();scene.add(world);
 const V=a=>new THREE.Vector3(...a),Q=a=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...a));
 const names=['Enquiry','Dataset','Analytics','Processor','Approval','Actions'];
 const objects=names.map(name=>{const o=gltf.scene.getObjectByName(name);if(!o)throw Error(`Missing Blender asset: ${name}`);world.add(o);return o});
 // Printed labels retain their dark ink colour under the bright studio lighting.
 const inkCache=new Map();
 const patchInk=o=>{if(!o.isMesh)return;o.frustumCulled=false;const fix=m=>{if(!/ink/i.test(m.name))return m;if(!inkCache.has(m.uuid))inkCache.set(m.uuid,new THREE.MeshBasicMaterial({color:/Secondary/.test(m.name)?0x5b615d:0x242b28}));return inkCache.get(m.uuid)};o.material=Array.isArray(o.material)?o.material.map(fix):fix(o.material)};
 objects.forEach(o=>o.traverse(patchInk));
 const source=[[-2.65,1.35,.7],[2.45,1.80,-.25],[-2.1,-1.65,.2],[.1,.05,.9],[2.2,-1.6,.2],[.4,-2.7,-.6]].map(V);
 const rotations=[[-.10,.18,-.15],[.12,-.28,.18],[-.1,.22,-.15],[.18,-.26,.14],[.08,-.18,.12],[.12,.24,-.08]].map(Q);
 const identity=Q([0,0,0]);
 const fragmentTypes=['Message','Task','ChartTile'];
 const fragmentLayout=[[-3.4,-.05,.1,.57,.2],[3.2,.05,-.6,.67,-.18],[-.75,2.85,-.4,.6,.15],[1.2,3.15,-.6,.56,-.21],[-3.45,2.8,-1,.54,.16],[3.65,2.8,-.9,.57,.22],[-3.4,-2.95,-1,.59,-.22],[3.2,-3.05,-.8,.63,.18],[-.65,-3.15,-1,.54,.22],[.25,1.85,.2,.5,-.2],[1.0,-1.1,-.6,.45,.3],[3.5,-.85,-1,.42,-.1]];
 const fragments=fragmentLayout.map(([x,y,z,size,angle],i)=>{const template=gltf.scene.getObjectByName(fragmentTypes[i%3]);if(!template)throw Error('Missing detail asset');const model=template.clone(true);model.traverse(patchInk);world.add(model);return{model,from:V([x,y,z]),rotation:Q([.08,.16*Math.sin(i),angle]),size}});
 const wireMaterial=new THREE.MeshStandardMaterial({color:0xddc58b,metalness:.5,roughness:.42,transparent:true});
 const pulseMaterial=new THREE.MeshBasicMaterial({color:0xffeac0});
 const wires=[];
 const pulseGeo=new THREE.SphereGeometry(.052,16,10);
 let fit=1;const viewHeight=2*Math.tan(35*Math.PI/360)*12;
 const labels=[...document.querySelectorAll('.labels span')],point=new THREE.Vector3();
 let destinations=[],slots=[];
 function layout(){
  slots=mobile.matches?[[-1.65,1.45,0],[1.65,1.45,0],[-1.65,-1.50,0],[1.65,-1.50,0]].map(V):[[-4.2,0,0],[-1.4,0,0],[1.4,0,0],[4.2,0,0]].map(V);
  destinations=[slots[0].clone().add(V([.02,-.03,.18])),slots[0].clone().add(V([-.12,.10,-.02])),slots[0].clone().add(V([.10,.23,-.20])),...slots.slice(1).map(v=>v.clone())];
  for(const wire of wires){world.remove(wire.tube,wire.pulse);wire.tube.geometry.dispose();wire.tube.material.dispose()}wires.length=0;
  const paths=mobile.matches?[
   [[-.63,1.45,0],[0,1.45,0],[.50,1.45,0]],
   [[1.65,.35,-.18],[1.65,-.22,-.18],[-1.65,-.22,-.18],[-1.65,-.37,-.18]],
   [[-.60,-1.50,0],[0,-1.50,0],[.58,-1.50,0]]
  ]:[
   [[-3.17,0,0],[-2.82,0,0],[-2.51,0,0]],
   [[-.30,0,0],[0,0,0],[.40,0,0]],
   [[2.43,0,0],[2.80,0,0],[3.22,0,0]]
  ];
  paths.forEach(points=>{const curve=new THREE.CatmullRomCurve3(points.map(V));const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,50,.013,6,false),wireMaterial.clone());const pulse=new THREE.Mesh(pulseGeo,pulseMaterial);world.add(tube,pulse);wires.push({curve,tube,pulse})});
 }
 resizeScene=()=>{const w=visual.clientWidth,h=visual.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65,Math.sqrt(1300000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fit=Math.min(1,viewHeight*camera.aspect/(mobile.matches?6.2:11.6));layout()};
 render=p=>{
  const settle=range(p,.18,.47),initialFit=mobile.matches?.72:1;
  world.scale.setScalar(fit*mix(initialFit,mobile.matches?.91:1,settle));world.position.set(0,mix(0,mobile.matches?.75:1.25,settle),0);
  objects.forEach((o,i)=>{const t=range(p,i===5?.27:.04,i===5?.46:.30);o.position.lerpVectors(source[i],destinations[i],t);o.quaternion.slerpQuaternions(rotations[i],identity,t);const show=i===5?range(p,.24,.43):1;o.scale.setScalar(show*(i===3?mix(1.12,.86,t):1));o.visible=show>.002});
  fragments.forEach((f,i)=>{const t=range(p,.04+(i%3)*.016,.24+(i%3)*.025);f.model.position.lerpVectors(f.from,destinations[0],t);f.model.position.y+=Math.sin(t*Math.PI)*.45;f.model.quaternion.slerpQuaternions(f.rotation,identity,t);f.model.scale.setScalar(Math.max(.001,f.size*(1-range(t,.28,1))));f.model.visible=t<.999});
  wires.forEach((wire,i)=>{const show=range(p,.27+i*.035,.36+i*.035);wire.tube.visible=show>.001;wire.tube.material.opacity=show*.85;wire.tube.geometry.setDrawRange(0,Math.floor(wire.tube.geometry.index.count*show/3)*3);const t=(p-(.38+i*.09))/.09;wire.pulse.visible=t>0&&t<1;wire.pulse.position.copy(wire.curve.getPoint(clamp(t)))});
  world.updateMatrixWorld(true);
  labels.forEach((label,i)=>{point.copy(slots[i]);point.y-=1.38;point.applyMatrix4(world.matrixWorld).project(camera);label.style.left=`${(point.x*.5+.5)*visual.clientWidth}px`;label.style.top=`${(-point.y*.5+.5)*visual.clientHeight}px`;label.style.opacity=range(p,.36,.48)});
  renderer.render(scene,camera)
 };
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('WebGL context lost')});resizeScene();new ResizeObserver(()=>{resizeScene();request()}).observe(visual);renderer.compile(scene,camera);measure();progress=target;render(progress);paint(progress);document.body.classList.add('ready');request();
}
build().catch(fallback);
