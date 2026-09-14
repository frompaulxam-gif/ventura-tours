import * as THREE from '../connected-v2/vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {environment} from '../connected-v2/assets.js?v=4';
const $=s=>document.querySelector(s),journey=$('#journey'),stage=$('.stage'),visual=$('.visual'),canvas=$('#scene');
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),short=matchMedia('(max-height:650px)'),mobile=matchMedia('(max-width:760px)');
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*n*(n*(n*6-15)+10)},range=(p,a,b)=>ease((p-a)/(b-a)),mix=(a,b,t)=>a+(b-a)*t;
let progress=0,target=0,distance=1,start=0,paused=false,failed=false,visible=true,raf=0,last=0,render=null,resizeScene=null;
const isStatic=()=>paused||reduced.matches||short.matches||failed;
function measure(){start=journey.getBoundingClientRect().top+scrollY;distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);target=isStatic()?1:clamp((scrollY-start)/distance)}
function paint(p){const intro=1-range(p,.04,.19),reveal=range(p,.48,.67);$('.opening').style.opacity=intro;$('.opening').style.visibility=intro>.001?'visible':'hidden';$('#reveal').style.opacity=reveal;$('#reveal').style.visibility=reveal>.001?'visible':'hidden';$('#reveal').inert=reveal<.1;$('#reveal').style.transform=`translateY(${22*(1-reveal)}px)`;$('#progress').style.transform=`scaleX(${p})`;$('.scroll-note').textContent=p>.72?'A little more room to think.':'Scroll to find your flow ↓'}
function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick)}
function tick(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min(50,now-last):16;last=now;progress+=(target-progress)*(1-Math.exp(-dt/95));if(Math.abs(target-progress)<.00008)progress=target;paint(progress);render?.(progress);if(progress!==target)request()}
function mode(){const oldHeight=journey.offsetHeight,oldY=scrollY;document.body.classList.toggle('static',isStatic());if(isStatic()&&oldY>start)scrollTo({top:oldY>=start+oldHeight?oldY+journey.offsetHeight-oldHeight:start,behavior:'instant'});measure();progress=target;paint(progress);resizeScene?.();request()}
window.addEventListener('scroll',()=>{target=isStatic()?1:clamp((scrollY-start)/distance);request()},{passive:true});window.addEventListener('resize',()=>{measure();resizeScene?.();request()},{passive:true});window.addEventListener('pageshow',()=>{measure();progress=target;request()});
reduced.addEventListener('change',mode);short.addEventListener('change',mode);
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;$('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').textContent=paused?'Enable motion ▷':'Reduce motion Ⅱ';mode()});
$('#replay').addEventListener('click',()=>{journey.scrollIntoView({behavior:reduced.matches?'instant':'smooth'})});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden){measure();progress=target;request()}});
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible){measure();progress=target;last=0;request()}else{cancelAnimationFrame(raf);raf=0}}).observe(journey);
function fallback(error){console.warn('Flow: showing the still layout.',error);failed=true;render=null;document.body.classList.add('no-canvas');mode()}
mode();
async function build(){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});renderer.setClearColor(0x000000,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,60);camera.position.set(0,0,12);
 const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=1.1;
 scene.add(new THREE.HemisphereLight(0xfff7e4,0x333744,1.6));
 for(const [color,power,pos]of[[0xfff1d4,3,[-4,5,6]],[0xe6eeff,2.4,[4,1,5]],[0xffdfa2,2,[0,4,-3]]]){const light=new THREE.DirectionalLight(color,power);light.position.set(...pos);scene.add(light)}
 const gltf=await new GLTFLoader().loadAsync('assets/ventura-flow.glb?v=1');
 const root=gltf.scene;scene.add(root);const ribbons=[],clasps=[];
 root.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;if(o.name.startsWith('Ribbon'))ribbons.push(o);if(o.name.startsWith('Clasp'))clasps.push({mesh:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()})});
 if(ribbons.length!==9||ribbons.some(o=>o.morphTargetDictionary.Release===undefined||o.morphTargetDictionary.Flow===undefined))throw Error('Incomplete Blender morph asset');
 const pulse=new THREE.Mesh(new THREE.SphereGeometry(.042,16,12),new THREE.MeshStandardMaterial({color:0xffefc8,emissive:0xffcc69,emissiveIntensity:2,metalness:.25,roughness:.18}));root.add(pulse);
 const labels=[...document.querySelectorAll('.labels span')],v=new THREE.Vector3();let fit=1;
 const viewHeight=2*Math.tan(35*Math.PI/360)*12;
 resizeScene=()=>{const w=visual.clientWidth,h=visual.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7,Math.sqrt(1350000/(w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fit=Math.min(1,viewHeight*camera.aspect/8.6)};
 render=p=>{
  const release=range(p,.025,.25),flow=range(p,.19,.46),rise=range(p,.29,.53);
  root.scale.setScalar(fit*mix(1.18,.94,rise));root.position.set(0,mix(0,mobile.matches?1.18:1.35,rise),0);root.rotation.set(mix(.07,.04,rise),mix(-.22,-.30,rise),mix(-.10,.01,rise));
  for(const ribbon of ribbons){ribbon.morphTargetInfluences[ribbon.morphTargetDictionary.Release]=release*(1-flow);ribbon.morphTargetInfluences[ribbon.morphTargetDictionary.Flow]=flow}
  clasps.forEach((c,i)=>{const arrive=range(p,.30+i*.018,.46+i*.018);c.mesh.visible=arrive>.001;c.mesh.position.copy(c.position);c.mesh.position.z+=(1-arrive)*1.5;c.mesh.scale.copy(c.scale).multiplyScalar(arrive);c.mesh.quaternion.copy(c.quaternion)});
  const pulseT=clamp((p-.48)/.24);pulse.visible=p>.48&&p<.72;pulse.position.set(-3.7+7.4*pulseT,.32*Math.sin(pulseT*Math.PI*2-.8),.23);
  root.updateMatrixWorld(true);
  labels.forEach((label,i)=>{v.set([-2.7,0,2.7][i],-1.25,.1).applyMatrix4(root.matrixWorld).project(camera);label.style.left=`${(v.x*.5+.5)*visual.clientWidth}px`;label.style.top=`${(-v.y*.5+.5)*visual.clientHeight}px`;label.style.opacity=range(p,.44,.54)});
  renderer.render(scene,camera)
 };
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('WebGL context lost')});
 resizeScene();new ResizeObserver(()=>{resizeScene();request()}).observe(visual);await renderer.compileAsync(scene,camera);measure();progress=target;render(progress);paint(progress);document.body.classList.add('ready');request();
}
build().catch(fallback);
