'use strict';
(() => {
 const track=document.querySelector('.duo-scroll'),hero=track.querySelector('.hero');
 const stage=track.querySelector('.duo-stage'),canvas=stage.querySelector('canvas');
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:900px)').matches;
 const folder=mobile?'mobile':'4k',firstFrame=0,lastFrame=66,count=lastFrame-firstFrame+1;
 const frameAt=progress=>firstFrame+Math.round(progress*(count-1));
 // Keep compressed frames, with a bounded decoded cache (4K frames are ~32 MB each).
 const blobs=new Map(),decoded=new Map(),pending=new Map(),failed=new Set();
 const maxDecoded=mobile?12:8;
 let current=0,target=0,raf=0,lastTime=0,lastDrawn=-1,start=0,distance=1,active=true;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const filename=i=>`assets/duo-upscaled/${folder}/${String(i).padStart(3,'0')}.jpg`;
 async function decode(i){
  if(decoded.has(i))return decoded.get(i);
  if(pending.has(i))return pending.get(i);
  if(failed.has(i))return null;
  const task=(async()=>{
   try{
    let blob=blobs.get(i);
    if(!blob){const r=await fetch(filename(i));if(!r.ok)throw Error('Frame unavailable');blob=await r.blob();blobs.set(i,blob)}
    const bitmap=await createImageBitmap(blob);
    decoded.set(i,bitmap);
    const focus=frameAt(current);
    while(decoded.size>maxDecoded){
     const candidates=[...decoded.keys()].filter(k=>k!==i&&k!==lastDrawn);
     const oldest=candidates.sort((a,b)=>Math.abs(b-focus)-Math.abs(a-focus))[0];
     if(oldest===undefined)break;decoded.get(oldest).close();decoded.delete(oldest);
    }
    return bitmap;
   }catch{failed.add(i);return null}finally{pending.delete(i)}
  })();
  pending.set(i,task);return task;
 }
 function paint(index){
  const img=decoded.get(index);if(!img)return;
  // Keep the handset centred in the right-hand desktop composition; on mobile
  // crop only the empty studio background, preserving both hands and open phone.
  const w=canvas.width,h=canvas.height,isMobile=innerWidth<=900;
  const scale=isMobile?Math.min(w/(img.width*.54),h*.63/img.height):Math.max(w/img.width,h/img.height);
  const dw=img.width*scale,dh=img.height*scale;
  const cx=isMobile?w*.5:w*.68,cy=isMobile?h*.55:h*.58;
  ctx.fillStyle='#f2f5f4';ctx.fillRect(0,0,w,h);
  ctx.drawImage(img,cx-dw/2,cy-dh/2,dw,dh);
  lastDrawn=index;stage.dataset.frame=String(index);stage.dataset.ready='true';
 }
 async function show(index){
  if(index===lastDrawn)return;
  await decode(index);
  if(index===frameAt(current))paint(index);
  const direction=target>=current?1:-1;
  for(let n=1;n<=2;n++){const next=index+n*direction;if(next>=firstFrame&&next<=lastFrame)decode(next)}
 }
 function tick(time){
  raf=0;if(!active||document.hidden)return;
  const dt=lastTime?Math.min(64,time-lastTime):16;lastTime=time;
  current+= (target-current)*(1-Math.exp(-dt/85));
  if(Math.abs(target-current)<.0002)current=target;
  show(frameAt(current));
  if(current!==target)raf=requestAnimationFrame(tick);else lastTime=0;
 }
 function schedule(){if(!raf&&active&&!document.hidden)raf=requestAnimationFrame(tick)}
 function update(){
  const p=clamp((scrollY-start)/distance);
  target=reduced.matches?0:clamp((p-.02)/.90);schedule();
 }
 function measure(){
  start=track.getBoundingClientRect().top+scrollY;
  distance=Math.max(1,track.offsetHeight-hero.offsetHeight);
  const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.min(3840,Math.round(r.width*dpr));canvas.height=Math.round(canvas.width*r.height/r.width);
  if(lastDrawn>=0)paint(lastDrawn);update();
 }
 async function preload(){
  // Compressed prefetch is cheap; decode only the local playhead neighbourhood.
  const indices=Array.from({length:count-1},(_,i)=>firstFrame+i+1);let next=0;
  await Promise.all(Array.from({length:navigator.connection?.saveData?1:4},async()=>{
   while(next<indices.length&&!reduced.matches){
    const i=indices[next++];if(blobs.has(i))continue;
    try{const r=await fetch(filename(i));if(r.ok)blobs.set(i,await r.blob())}catch{}
   }
  }));
  stage.dataset.cachedFrames=String(blobs.size);
 }
 addEventListener('scroll',update,{passive:true});addEventListener('resize',measure,{passive:true});
 reduced.addEventListener('change',()=>{current=target=0;lastDrawn=-1;measure();if(!reduced.matches)preload()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastTime=0;update()}});
 new IntersectionObserver(([e])=>{active=e.isIntersecting;if(active)update()}).observe(track);
 document.fonts.ready.then(measure);
 measure();decode(firstFrame).then(()=>{paint(firstFrame);update();if(!reduced.matches)preload()});
})();
