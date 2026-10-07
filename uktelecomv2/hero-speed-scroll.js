'use strict';
(() => {
 const track=document.querySelector('.duo-scroll');
 if(!track)return;
 const hero=track.querySelector('.hero'),root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,pending=0,lastTime=0,touch=null,autoplay=false,playDirection=1,motionId=0,queuedStart=false;
 const bounds=()=>{const start=track.getBoundingClientRect().top+scrollY;return {start,end:start+track.offsetHeight-hero.offsetHeight}};
 const blocked=()=>reduced.matches||root.classList.contains('intro-scroll-locked')||!!document.querySelector('dialog[open]');
 const control=target=>target instanceof Element&&!!target.closest('input,textarea,select,[contenteditable="true"],[role="slider"]');
 const inside=()=>{const {start,end}=bounds();return scrollY>=start-2&&scrollY<=end+2};
 // A small gesture plays in either direction; page exit stays speed limited.
 const maxSpeed=()=>{const {start,end}=bounds();return (end-start)/2.7};
 function stopMotion(){
  motionId++;cancelAnimationFrame(frame);frame=0;pending=0;lastTime=0;autoplay=false;track.duoPlayback?.pause();
  hero.dataset.scrollState='idle';
 }
 function cancel(){stopMotion();touch=null;queuedStart=false}
 function tick(now){
  frame=0;
  if(blocked()||document.hidden){cancel();return}
  const dt=Math.min(32,now-lastTime)/1000;lastTime=now;
  const speed=maxSpeed();
  // Cap velocity, then soften the short tail when the user stops scrolling.
  const step=Math.sign(pending)*Math.min(Math.abs(pending),speed*dt,Math.abs(pending)*(1-Math.exp(-dt/.065)));
  const before=scrollY;
  scrollTo({top:before+step,behavior:'instant'});
  pending-=step;
  if(Math.abs(pending)<.5||(Math.abs(step)>1&&Math.abs(scrollY-before)<.1)){stopMotion();return}
  frame=requestAnimationFrame(tick);
 }
 function playOpening(direction){
  stopMotion();autoplay=true;playDirection=direction;
  const token=motionId;
  const {start,end}=bounds();
  hero.dataset.scrollState='playing';hero.dataset.playDirection=String(direction);
  const playback=track.duoPlayback;
  playback.play((scrollY-start)/(end-start),direction).then(()=>{
   if(!autoplay||token!==motionId)return;
   function play(){
    frame=0;
    if(blocked()||document.hidden){cancel();return}
    playback.pace();
    // Follow presented video time so phone motion and the headlines stay together.
    scrollTo({top:start+(end-start)*playback.progress,behavior:'instant'});
    if(!playback.ended&&(direction>0?playback.progress<1:playback.progress>0)){frame=requestAnimationFrame(play);return}
    scrollTo({top:direction>0?end:start,behavior:'instant'});stopMotion();
   }
   frame=requestAnimationFrame(play);
  }).catch(()=>{if(token===motionId)stopMotion()});
 }
 function feed(delta){
  if(!delta)return;
  if(root.classList.contains('intro-scroll-locked')){queuedStart=delta>0;return}
  if(autoplay&&Math.sign(delta)===playDirection)return;
  const {start,end}=bounds();
  if(delta>0&&scrollY<end-3||delta<0&&scrollY>start+3){playOpening(Math.sign(delta));return}
  if(autoplay)stopMotion();
  if(Math.sign(delta)!==Math.sign(pending))pending=0;
  // Discard excess distance instead of building a long queue behind a big swipe.
  const queueLimit=maxSpeed()*.25;
  pending=Math.max(-queueLimit,Math.min(queueLimit,pending+delta));
  if(!frame){lastTime=performance.now();hero.dataset.scrollState='moving';frame=requestAnimationFrame(tick)}
 }
 addEventListener('wheel',event=>{
  if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||reduced.matches||!!document.querySelector('dialog[open]')||control(event.target))return;
  if(!inside()){if(frame)cancel();return}
  if(!event.deltaY)return;
  event.preventDefault();
  feed(event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1));
 },{passive:false});
 addEventListener('touchstart',event=>{
  if(frame&&!autoplay)cancel();
  touch=event.touches.length===1&&!reduced.matches&&!document.querySelector('dialog[open]')&&!control(event.target)&&inside()
   ?{x:event.touches[0].clientX,y:event.touches[0].clientY,vertical:false}:null;
 },{passive:true});
 addEventListener('touchmove',event=>{
  if(!touch||reduced.matches||document.querySelector('dialog[open]'))return;
  if(event.touches.length!==1){cancel();return}
  const point=event.touches[0],dx=point.clientX-touch.x,dy=touch.y-point.clientY;
  if(!touch.vertical&&Math.abs(dx)>Math.abs(dy)){touch=null;return}
  if(event.cancelable)event.preventDefault();
  touch.vertical=true;touch.x=point.clientX;touch.y=point.clientY;
  feed(dy);
 },{passive:false});
 addEventListener('touchend',()=>{touch=null},{passive:true});
 addEventListener('touchcancel',cancel,{passive:true});
 addEventListener('keydown',event=>{
  if(['Escape','Home','End','Tab'].includes(event.key)){cancel();return}
  if(reduced.matches||document.querySelector('dialog[open]')||control(event.target)||event.target.closest?.('button,a')||event.ctrlKey||event.metaKey||event.altKey||!inside())return;
  const direction=['ArrowDown','PageDown',' '].includes(event.key)?(event.shiftKey?-1:1):['ArrowUp','PageUp'].includes(event.key)?-1:0;
  if(!direction)return;
  event.preventDefault();
  feed(direction*(event.key.startsWith('Arrow')?60:innerHeight*.8));
 });
 // Direct links and scrollbar navigation can always bypass the animated hero.
 document.addEventListener('click',event=>{if(event.target.closest?.('a[href^="#"]'))cancel()},true);
 addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&frame&&event.clientX>=root.clientWidth)cancel()},{passive:true});
 addEventListener('hashchange',cancel);
 addEventListener('resize',cancel,{passive:true});
 reduced.addEventListener('change',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 new MutationObserver(()=>{
  if(queuedStart&&!blocked()&&inside()){queuedStart=false;feed(1)}
 }).observe(root,{attributes:true,attributeFilter:['class']});
 hero.dataset.scrollState='idle';
})();
