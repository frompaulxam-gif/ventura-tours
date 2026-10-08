'use strict';
(() => {
 const track=document.querySelector('.hero-scroll');
 const hero=track.querySelector('.hero');
 const phones=[...track.querySelectorAll('.phone-scene')];
 const titles=[...track.querySelectorAll('.hero-headline')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const names=['iPhone','Samsung','Google'];
 const clamp=v=>Math.max(0,Math.min(1,v));
 // A quick slide with a 20ms controlled stop exactly halfway across.
 // Motion reaches and leaves the midpoint smoothly; landing adds no delay.
 const duration=500;
 const ease=t=>{
  const elapsed=t*duration;
  if(elapsed<240)return .5*(1-Math.pow(1-elapsed/240,2));
  if(elapsed<260)return .5;
  const u=(elapsed-260)/240;
  return .5+.5*u*u*(3-2*u);
 };
 let current=0,target=0,frame=0,drag=null,lastWheel=-Infinity,lastWheelDelta=0,wheelAmount=0,wheelPeak=0;
 const wrap=i=>(i+phones.length)%phones.length;
 function place(i,x){
  const drop=reduced.matches?0:Math.min(220,hero.offsetHeight*.24)*Math.pow(x*1.25,2);
  phones[i].style.transform=`translate3d(${x*125}vw,${drop}px,0) rotate(${reduced.matches?0:x*7}deg)`;
  phones[i].style.visibility=Math.abs(x)>=1?'hidden':'visible';
  titles[i].style.transform=`translate3d(0,${-x*115}%,0)`;
  titles[i].style.opacity=String(1-clamp(Math.abs(x)*1.5));
  titles[i].style.filter=`blur(${reduced.matches?0:clamp(Math.abs(x))*7}px)`;
 }
 function settle(scene){
  cancelAnimationFrame(frame);frame=0;current=target=scene;wheelAmount=0;
  phones.forEach((_,i)=>place(i,i===scene?0:2));
  hero.dataset.scene=String(scene);hero.dataset.targetScene=String(scene);hero.dataset.motion='settled';
  hero.setAttribute('aria-label',`${names[scene]} phones. Swipe left or right to change phones.`);
 }
 function allowed(event){
  return !document.documentElement.classList.contains('brand-intro-locked')&&!document.querySelector('dialog[open]')&&!event.target?.closest?.('a,button,input,textarea,select,[contenteditable="true"]');
 }
 function change(direction){
  // Complete this landing before accepting another swipe. Never queue momentum:
  // the guard ends on the same frame the new phone reaches the centre.
  if(frame)return;
  target=wrap(current+direction);
  hero.dataset.targetScene=String(target);
  if(reduced.matches){settle(target);return}
  const from=current,to=target,start=performance.now();
  hero.dataset.motion='transitioning';
  function tick(now){
   const p=clamp((now-start)/duration),value=ease(p);
   // Only the outgoing and incoming groups participate, even under heavy input.
   phones.forEach((_,i)=>place(i,i===from?direction*value:i===to?direction*(value-1):2));
   if(p<1){frame=requestAnimationFrame(tick);return}
   settle(to);
  }
  frame=requestAnimationFrame(tick);
 }
 hero.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-phone-direction]');
  if(!button||document.documentElement.classList.contains('brand-intro-locked')||document.querySelector('dialog[open]'))return;
  change(Number(button.dataset.phoneDirection));
 });
 hero.setAttribute('tabindex','0');
 hero.setAttribute('aria-roledescription','carousel');
 // Only horizontal gestures belong to the carousel. Vertical scrolling is native.
 hero.addEventListener('pointerdown',event=>{
  if(!allowed(event)||event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,axis:null};
 });
 hero.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>10){
   drag.axis=Math.abs(dx)>Math.abs(dy)*1.2?'horizontal':'vertical';
   if(drag.axis==='horizontal')hero.setPointerCapture?.(event.pointerId);
  }
  if(drag.axis==='horizontal')event.preventDefault();
 });
 function endDrag(event){
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(drag.axis!=='vertical'&&Math.abs(dx)>=20&&Math.abs(dx)>Math.abs(dy)*1.2&&allowed(event))change(Math.sign(dx));
  drag=null;
 }
 hero.addEventListener('pointerup',endDrag);
 hero.addEventListener('pointercancel',()=>{drag=null});
 hero.addEventListener('dragstart',event=>event.preventDefault());
 hero.addEventListener('wheel',event=>{
  if(!allowed(event)||event.ctrlKey||Math.abs(event.deltaX)<=Math.abs(event.deltaY)||!event.deltaX)return;
  event.preventDefault();
  const now=performance.now();
  const delta=event.deltaX*(event.deltaMode===1?16:event.deltaMode===2?innerWidth:1);
  const magnitude=Math.abs(delta),previous=Math.abs(lastWheelDelta);
  const fresh=now-lastWheel>120||Math.sign(delta)!==Math.sign(lastWheelDelta)||(magnitude>previous*1.35&&magnitude>previous+6);
  if(fresh){wheelAmount=0;wheelPeak=magnitude}
  wheelPeak=Math.max(wheelPeak,magnitude);
  lastWheel=now;lastWheelDelta=delta;
  // Discard input only while this slide is moving. Continuing input can start
  // the next slide as soon as it lands, without requiring a gap between swipes.
  if(frame){wheelAmount=0;return}
  // A fading momentum tail must not trigger another slide. A fresh push resets
  // the peak, while sustained deliberate input still works in either direction.
  if(magnitude<2||magnitude<wheelPeak*.75){wheelAmount=0;return}
  wheelAmount+=Math.sign(delta)*Math.min(magnitude,30);
  if(Math.abs(wheelAmount)>=30){const direction=Math.sign(wheelAmount);wheelAmount=0;change(direction)}
 },{passive:false});
 hero.addEventListener('keydown',event=>{
  if(!allowed(event)||event.repeat||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();change(event.key==='ArrowLeft'?-1:1);
 });
 hero.addEventListener('pointermove',event=>{
  if(drag||!allowed(event)||reduced.matches||event.pointerType==='touch')return;
  const r=hero.getBoundingClientRect();
  hero.style.setProperty('--pointer-x',((event.clientX-r.left)/r.width-.5)*18+'px');
  hero.style.setProperty('--pointer-y',((event.clientY-r.top)/r.height-.5)*14+'px');
 },{passive:true});
 hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--pointer-x','0px');hero.style.setProperty('--pointer-y','0px')});
 addEventListener('resize',()=>{drag=null;settle(target)},{passive:true});
 reduced.addEventListener('change',()=>{settle(target)});
 const observer=new IntersectionObserver(([entry])=>hero.classList.toggle('motion-idle',!entry.isIntersecting));observer.observe(track);
 document.addEventListener('visibilitychange',()=>{hero.classList.toggle('tab-idle',document.hidden);if(document.hidden){drag=null;settle(target)}});
 settle(0);
})();
