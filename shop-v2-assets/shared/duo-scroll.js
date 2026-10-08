const VIDEO_PARTS={"/shop-v2-assets/media/foneplus/mobile-reverse.mp4": 2, "/shop-v2-assets/media/foneplus/mobile.mp4": 2, "/shop-v2-assets/media/foneplus/4k-reverse.mp4": 5, "/shop-v2-assets/media/foneplus/4k.mp4": 5, "/shop-v2-assets/media/huk-communications/mobile-reverse.mp4": 2, "/shop-v2-assets/media/huk-communications/mobile.mp4": 2, "/shop-v2-assets/media/huk-communications/4k-reverse.mp4": 5, "/shop-v2-assets/media/huk-communications/4k.mp4": 6, "/shop-v2-assets/media/ismart/mobile-reverse.mp4": 2, "/shop-v2-assets/media/ismart/mobile.mp4": 2, "/shop-v2-assets/media/ismart/4k-reverse.mp4": 5, "/shop-v2-assets/media/ismart/4k.mp4": 5, "/shop-v2-assets/media/ibuy/mobile-reverse.mp4": 2, "/shop-v2-assets/media/ibuy/mobile.mp4": 2, "/shop-v2-assets/media/ibuy/4k-reverse.mp4": 6, "/shop-v2-assets/media/ibuy/4k.mp4": 6, "/shop-v2-assets/media/mobile-phonewala/mobile-reverse.mp4": 2, "/shop-v2-assets/media/mobile-phonewala/mobile.mp4": 2, "/shop-v2-assets/media/mobile-phonewala/4k-reverse.mp4": 5, "/shop-v2-assets/media/mobile-phonewala/4k.mp4": 5, "/shop-v2-assets/media/ifix-mobile-watch/mobile-reverse.mp4": 2, "/shop-v2-assets/media/ifix-mobile-watch/mobile.mp4": 2, "/shop-v2-assets/media/ifix-mobile-watch/4k-reverse.mp4": 5, "/shop-v2-assets/media/ifix-mobile-watch/4k.mp4": 5, "/shop-v2-assets/media/dr-mobile/mobile-reverse.mp4": 2, "/shop-v2-assets/media/dr-mobile/mobile.mp4": 2, "/shop-v2-assets/media/dr-mobile/4k-reverse.mp4": 5, "/shop-v2-assets/media/dr-mobile/4k.mp4": 6, "/shop-v2-assets/media/iphone-duo/mobile-reverse.mp4": 3, "/shop-v2-assets/media/iphone-duo/mobile.mp4": 3, "/shop-v2-assets/media/iphone-duo/4k-reverse.mp4": 10, "/shop-v2-assets/media/iphone-duo/4k.mp4": 10};
'use strict';
(() => {
 const track=document.querySelector('.duo-scroll'),hero=track.querySelector('.hero');
 const stage=track.querySelector('.duo-stage');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:900px)').matches;
 const wrapper=document.createElement('div');wrapper.className='duo-video';stage.append(wrapper);
 stage.querySelector('canvas').hidden=true;
 const clamp=x=>Math.max(0,Math.min(1,x));
 let automatic=false,start=0,distance=1,seekFrame=0,request=0;
 const clips=[1,-1].map(direction=>{
  const video=document.createElement('video');
  video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';
  video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('aria-hidden','true');
  video.disablePictureInPicture=true;video.style.opacity=direction===1?'1':'0';wrapper.append(video);
  return {video,direction,ready:false,url:null};
 });
 let active=clips[0];
 const frameCount=clip=>Math.round(clip.video.duration*60);
 const span=clip=>Math.max(.01,clip.video.duration-1/60);
 const progressOf=clip=>{const p=clamp(clip.video.currentTime/span(clip));return clip.direction===1?p:1-p};
 function markFrame(clip,time=clip.video.currentTime){
  if(clip!==active)return;
  const lastFrame=frameCount(clip)-1;
  const frame=Math.min(lastFrame,Math.round(time*60));
  stage.dataset.frame=String(clip.direction===1?frame:lastFrame-frame);
  // Only reveal the other clip after its matching frame is actually decoded.
  clips.forEach(item=>{item.video.style.opacity=item===clip?'1':'0'});
 }
 function measure(){
  start=track.getBoundingClientRect().top+scrollY;
  distance=Math.max(1,track.offsetHeight-hero.offsetHeight);
  const {width:w,height:h}=stage.getBoundingClientRect(),isMobile=innerWidth<=900;
  const scale=isMobile?Math.min(w/(3840*.72),h*.50/2160):Math.max(w/3840,h/2160);
  const width=3840*scale,height=2160*scale;
  clips.forEach(({video})=>Object.assign(video.style,{width:width+'px',height:height+'px',left:(w*(isMobile?.5:.68)-width/2)+'px',top:(h*(isMobile?.55:.58)-height/2)+'px'}));
 }
 function update(){
  const {video}=active;
  if(automatic||!active.ready||video.seeking)return;
  const progress=reduced.matches?0:clamp((scrollY-start)/distance);
  const time=(active.direction===1?progress:1-progress)*span(active);
  if(Math.abs(video.currentTime-time)>1/120)video.currentTime=time;
 }
 function scheduleSeek(){if(!seekFrame)seekFrame=requestAnimationFrame(()=>{seekFrame=0;update()})}
 const loaded=Promise.all(clips.map(clip=>new Promise((resolve,reject)=>{
  const {video,direction}=clip;
  function presented(_,metadata){markFrame(clip,metadata.mediaTime);video.requestVideoFrameCallback(presented)}
  if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(presented);
  else video.addEventListener('timeupdate',()=>markFrame(clip));
  video.addEventListener('seeked',()=>{if(!video.requestVideoFrameCallback)markFrame(clip);if(!automatic&&clip===active)scheduleSeek()});
  video.addEventListener('loadeddata',()=>{
   clip.ready=true;
   if(direction===1)stage.dataset.ready='true';
   resolve();measure();if(clip===active)update();
  },{once:true});
  video.addEventListener('error',()=>{stage.dataset.loadError='true';reject(Error('Opening video unavailable'))},{once:true});
  // Both directions buffer during the logo intro; reverse plays as a normal 60fps video.
  const source=`/shop-v2-assets/media/${window.SHOP.media}/${mobile?'mobile':'4k'}${direction===-1?'-reverse':''}.mp4`;
  Promise.all(Array.from({length:VIDEO_PARTS[source]},(_,i)=>fetch(source+'.part'+String(i).padStart(2,'0')).then(response=>{if(!response.ok)throw Error('Opening video unavailable');return response.arrayBuffer()}))).then(parts=>new Blob(parts,{type:'video/mp4'}))
   .then(blob=>{clip.url=URL.createObjectURL(blob);video.src=clip.url;video.load()})
   .catch(()=>{stage.dataset.loadError='true';reject(Error('Opening video unavailable'))});
 })));
 loaded.then(()=>{stage.dataset.bufferReady='true';stage.dataset.cachedFrames=String(frameCount(clips[0]))},()=>{});
 function pace(){
  active.video.playbackRate=.85+.5*Math.exp(-progressOf(active)*span(active)/.28);
 }
 track.duoPlayback={
  async play(progress,direction=1){
   const token=++request;automatic=true;clips.forEach(({video})=>video.pause());
   await loaded;
   if(!automatic||token!==request)return;
   active=clips.find(clip=>clip.direction===direction);
   active.video.currentTime=(direction===1?clamp(progress):1-clamp(progress))*span(active);
   pace();await active.video.play();
  },
  pause(){request++;automatic=false;clips.forEach(({video})=>video.pause())},
  get progress(){return active.ready?progressOf(active):0},
  get ended(){return active.video.ended},
  pace
 };
 addEventListener('scroll',scheduleSeek,{passive:true});
 addEventListener('resize',()=>{measure();scheduleSeek()},{passive:true});
 reduced.addEventListener('change',()=>{track.duoPlayback.pause();scheduleSeek()});
 document.fonts.ready.then(measure);measure();
 addEventListener('pagehide',event=>{if(!event.persisted)clips.forEach(clip=>{if(clip.url)URL.revokeObjectURL(clip.url)})});
})();
