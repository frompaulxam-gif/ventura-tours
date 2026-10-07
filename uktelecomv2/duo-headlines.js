'use strict';
(() => {
 const track=document.querySelector('.hero-scroll');
 const hero=track.querySelector('.hero');
 const titles=[...track.querySelectorAll('.hero-headline')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ease=t=>t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2;
 let frame=0,current=0,target=0,position=0;
 function progress(){
  const rect=track.getBoundingClientRect();
  return {p:clamp(-rect.top/Math.max(1,track.offsetHeight-hero.offsetHeight)),visible:rect.bottom>0&&rect.top<innerHeight};
 }
 function paint(value){
  position=value;
  titles.forEach((title,i)=>{
   const x=i-value;
   title.style.transform=`translate3d(0,${-x*115}%,0)`;
   title.style.opacity=String(1-clamp(Math.abs(x)*1.5));
   title.style.filter=`blur(${reduced.matches?0:clamp(Math.abs(x))*7}px)`;
  });
 }
 function settle(scene){
  cancelAnimationFrame(frame);frame=0;current=target=scene;
  paint(scene);hero.dataset.scene=String(scene);hero.dataset.motion='settled';
 }
 function transition(){
  if(frame||current===target)return;
  const from=current,to=current+Math.sign(target-current),start=performance.now();
  hero.dataset.motion='transitioning';
  function tick(now){
   const t=clamp((now-start)/600);
   paint(from+(to-from)*ease(t));
   if(t<1){frame=requestAnimationFrame(tick);return}
   frame=0;current=to;paint(to);hero.dataset.scene=String(to);hero.dataset.motion='settled';
   // Finish the current slide before honouring another threshold or a reversal.
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
 addEventListener('scroll',updateTarget,{passive:true});
 addEventListener('resize',()=>{paint(position);updateTarget()},{passive:true});
 reduced.addEventListener('change',()=>{hero.style.removeProperty('--pointer-x');hero.style.removeProperty('--pointer-y');updateTarget()});
 const observer=new IntersectionObserver(([entry])=>hero.classList.toggle('motion-idle',!entry.isIntersecting));observer.observe(track);
 document.addEventListener('visibilitychange',()=>{hero.classList.toggle('tab-idle',document.hidden);if(document.hidden)settle(target)});
 const initial=progress().p;settle(reduced.matches?0:initial<.25?0:initial<.70?1:2);
})();
