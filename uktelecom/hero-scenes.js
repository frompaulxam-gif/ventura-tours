'use strict';
(() => {
 const track=document.querySelector('.hero-scroll');
 const hero=track.querySelector('.hero');
 const phones=[...track.querySelectorAll('.phone-scene')];
 const titles=[...track.querySelectorAll('.hero-headline')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ease=t=>t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2;
 let frame=0,current=0,target=0,position=0,holdUntil=0,holdTimer=0;
 let lastWheel=-Infinity,wheelDistance=0,touchY=null,touchUsed=false;
 function progress(){
  const rect=track.getBoundingClientRect();
  return {p:clamp(-rect.top/Math.max(1,track.offsetHeight-hero.offsetHeight)),visible:rect.bottom>0&&rect.top<innerHeight};
 }
 function paint(value){
  position=value;
  phones.forEach((phone,i)=>{
   const x=i-value;
   const drop=reduced.matches?0:Math.min(220,hero.offsetHeight*.24)*Math.pow(x*1.25,2);
   const tilt=reduced.matches?0:x*7;
   phone.style.transform=`translate3d(${x*125}vw,${drop}px,0) rotate(${tilt}deg)`;
   phone.style.visibility=Math.abs(x)>.99?'hidden':'visible';
   titles[i].style.transform=`translate3d(0,${-x*115}%,0)`;
   titles[i].style.opacity=String(1-clamp(Math.abs(x)*1.5));
   titles[i].style.filter=`blur(${reduced.matches?0:clamp(Math.abs(x))*7}px)`;
  });
 }
 function settle(scene){
  cancelAnimationFrame(frame);clearTimeout(holdTimer);holdTimer=0;holdUntil=0;frame=0;current=target=scene;
  paint(scene);hero.dataset.scene=String(scene);hero.dataset.motion='settled';
 }
 function transition(){
  if(frame||current===target)return;
  if(performance.now()<holdUntil){
   if(!holdTimer)holdTimer=setTimeout(()=>{holdTimer=0;transition()},holdUntil-performance.now());
   return;
  }
  const from=current,to=current+Math.sign(target-current),start=performance.now();
  hero.dataset.motion='transitioning';
  function tick(now){
   const t=clamp((now-start)/850);
   paint(from+(to-from)*ease(t));
   if(t<1){frame=requestAnimationFrame(tick);return}
   frame=0;current=to;paint(to);hero.dataset.scene=String(to);hero.dataset.motion='settled';
   // Every scene gets a readable pause, even after a large scroll jump.
   holdUntil=now+450;
   transition();
  }
  frame=requestAnimationFrame(tick);
 }
 function updateTarget(){
  if(reduced.matches){settle(0);return}
  const {p,visible}=progress();
  // Separate forward/back thresholds prevent jitter at a scene boundary.
  if(p>=.73)target=2;
  else if(p<=.22)target=0;
  else if(target===0&&p>=.28||target===2&&p<=.67)target=1;
  if(!visible){settle(target);return}
  transition();
 }
 // Consume oversized gestures inside the pinned hero, one phone group at a time.
 // Outside it, links, form controls and ordinary page scrolling retain their behaviour.
 function canStep(event){
  if(reduced.matches||document.documentElement.classList.contains('brand-intro-locked')||document.querySelector('dialog[open]'))return false;
  if(event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return false;
  const r=track.getBoundingClientRect();
  return r.top<=1&&r.bottom>=hero.offsetHeight-1;
 }
 function busy(){return Boolean(frame)||performance.now()<holdUntil}
 function step(direction){
  const next=Math.max(0,Math.min(phones.length-1,current+direction));
  if(next===current)return false;
  target=next;
  const distance=track.offsetHeight-hero.offsetHeight;
  const top=scrollY+track.getBoundingClientRect().top;
  // Keep the last phone pinned until the following deliberate gesture exits.
  scrollTo({top:top+distance*[0,.5,.82][next],behavior:'instant'});
  transition();return true;
 }
 addEventListener('wheel',event=>{
  if(!canStep(event)||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
  const now=performance.now(),gap=now-lastWheel;lastWheel=now;
  const direction=Math.sign(event.deltaY);
  if(busy()){event.preventDefault();wheelDistance=null;return}
  // Ignore a trackpad's momentum tail; require a short quiet gap after the hold.
  if(gap<180&&wheelDistance===null){event.preventDefault();return}
  if(gap>=180||wheelDistance===null)wheelDistance=0;
  if((current===0&&direction<0)||(current===phones.length-1&&direction>0))return;
  event.preventDefault();
  wheelDistance+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if(Math.abs(wheelDistance)>=45){step(Math.sign(wheelDistance));wheelDistance=null}
 },{passive:false});
 addEventListener('touchstart',event=>{touchY=event.touches.length===1?event.touches[0].clientY:null;touchUsed=false},{passive:true});
 addEventListener('touchmove',event=>{
  if(touchY===null||event.touches.length!==1||!canStep(event))return;
  const delta=touchY-event.touches[0].clientY;
  if(busy()||touchUsed){event.preventDefault();touchUsed=true;return}
  if((current===0&&delta<0)||(current===phones.length-1&&delta>0))return;
  event.preventDefault();
  if(Math.abs(delta)>=35){step(Math.sign(delta));touchUsed=true}
 },{passive:false});
 addEventListener('touchend',()=>{touchY=null},{passive:true});
 addEventListener('keydown',event=>{
  const direction=['ArrowDown','PageDown',' '].includes(event.key)?1:['ArrowUp','PageUp'].includes(event.key)?-1:0;
  if(!direction||event.target?.closest?.('button,a')||!canStep(event))return;
  if(busy()||event.repeat){event.preventDefault();return}
  if(step(direction))event.preventDefault();
 });
 addEventListener('scroll',updateTarget,{passive:true});
 addEventListener('resize',()=>{paint(position);updateTarget()},{passive:true});
 reduced.addEventListener('change',()=>{hero.style.removeProperty('--pointer-x');hero.style.removeProperty('--pointer-y');updateTarget()});
 hero.addEventListener('pointermove',e=>{
  if(document.documentElement.classList.contains('brand-intro-locked')||reduced.matches||e.pointerType==='touch')return;
  const r=hero.getBoundingClientRect();
  hero.style.setProperty('--pointer-x',((e.clientX-r.left)/r.width-.5)*18+'px');
  hero.style.setProperty('--pointer-y',((e.clientY-r.top)/r.height-.5)*14+'px');
 },{passive:true});
 hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--pointer-x','0px');hero.style.setProperty('--pointer-y','0px')});
 const observer=new IntersectionObserver(([entry])=>hero.classList.toggle('motion-idle',!entry.isIntersecting));observer.observe(track);
 document.addEventListener('visibilitychange',()=>{hero.classList.toggle('tab-idle',document.hidden);if(document.hidden)settle(target)});
 const initial=progress().p;settle(reduced.matches?0:initial<.25?0:initial<.70?1:2);
})();
