(() => {
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.site-header');
 const logo=header?.querySelector('.logo-crop');
 const animations=[];
 let moving,veil,finished=false,releaseTimer;
 let viewportWidth=innerWidth,viewportHeight=innerHeight;
 const block=event=>{if(root.classList.contains('brand-intro-locked'))event.preventDefault()};
 const key=event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))block(event)};
 const unlock=()=>{
  clearTimeout(releaseTimer);
  root.classList.remove('brand-intro-locked');
  removeEventListener('wheel',block);removeEventListener('touchmove',block);removeEventListener('keydown',key);
 };
 const finish=(reason='complete')=>{
  if(finished)return;finished=true;
  // Reveal the settled artwork before cancelling/removing its identical travelling copy.
  root.classList.remove('brand-intro-pending','brand-intro-docked');
  animations.forEach(animation=>animation.cancel());
  moving?.remove();veil?.remove();clearTimeout(root._brandIntroFallback);
  root.dataset.logoIntroState=reason;
  if(reason==='complete'){
   root.dataset.logoIntroState='buffering';
   releaseTimer=setTimeout(()=>{unlock();root.dataset.logoIntroState='complete'},250);
  }else unlock();
 };
 if(!logo||!root.classList.contains('brand-intro-pending')||reduced.matches||scrollY>120){finish(reduced.matches?'reduced-motion':'skipped');return}
 addEventListener('wheel',block,{passive:false});addEventListener('touchmove',block,{passive:false});addEventListener('keydown',key);
 root.dataset.logoIntroState='loading';
 const image=logo.querySelector('img');
 Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('logo-load-timeout')),900))]).then(()=>{
  if(finished)return;
  if(reduced.matches){finish('reduced-motion');return}
  const rect=logo.getBoundingClientRect();
  if(!rect.width||!image.naturalWidth){finish('missing-logo');return}
  veil=document.createElement('div');veil.className='brand-intro-veil';veil.setAttribute('aria-hidden','true');
  moving=document.createElement('div');moving.className='brand-intro-logo';moving.setAttribute('aria-hidden','true');
  Object.assign(moving.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',overflow:'hidden'});
  const ratio=Number(logo.dataset.introSplit||0);
  const seam=rect.width*ratio;
  const part=(left,width)=>{
   const clip=document.createElement('div');clip.className='brand-intro-part';
   Object.assign(clip.style,{left:left+'px',width:width+'px'});
   const copy=logo.cloneNode(true);
   Object.assign(copy.style,{position:'absolute',left:-left+'px',top:'0'});
   clip.append(copy);moving.append(clip);return copy;
  };
  let sliding;
  if(ratio>0&&ratio<1){part(0,seam);sliding=part(seam,rect.width-seam)}
  else sliding=part(0,rect.width);
  document.body.append(veil,moving);
  const scale=Math.min(2.4,innerWidth*.8/rect.width,innerHeight*.28/rect.height);
  const dx=innerWidth/2-rect.left-rect.width/2,dy=innerHeight/2-rect.top-rect.height/2;
  const prefixDx=ratio?dx+(rect.width-seam)*scale/2:dx;
  const transform=(x,y,s)=>`translate3d(${x}px,${y}px,0) scale(${s})`;
  root.dataset.logoIntroState='sliding';
  const travel=moving.animate([
   {offset:0,opacity:0,transform:transform(prefixDx,dy,scale)},
   {offset:.12,opacity:1,transform:transform(prefixDx,dy,scale)},
   {offset:.18,opacity:1,transform:transform(prefixDx,dy,scale),easing:'cubic-bezier(.22,1,.36,1)'},
   {offset:.5,opacity:1,transform:transform(dx,dy,scale)},
   {offset:.64,opacity:1,transform:transform(dx,dy,scale),easing:'cubic-bezier(.76,0,.2,1)'},
   {offset:1,opacity:1,transform:transform(0,0,1)}
  ],{duration:2800,fill:'both'});
  const reveal=sliding.animate([{transform:`translate3d(-${rect.width-seam}px,0,0)`},{transform:'translate3d(0,0,0)'}],{duration:896,delay:504,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  animations.push(travel,reveal);
  const transparent=logo.dataset.transparent==='true';
  if(transparent){
   animations.push(
    veil.animate([{opacity:1},{opacity:0}],{duration:1000,delay:1700,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}),
    header.animate([{opacity:0},{opacity:1}],{duration:400,delay:2400,easing:'ease-out',fill:'both'})
   );
  }
  travel.finished.then(()=>{
   if(finished)return;
   if(transparent){finish();return}
   // Keep the brand-coloured backdrop until arrival, so an opaque source logo never
   // travels over a differently coloured surface. The real and moving crops match.
   root.classList.add('brand-intro-docked');root.dataset.logoIntroState='docked';
   const dissolve=veil.animate([{opacity:1},{opacity:0}],{duration:280,easing:'ease-out',fill:'both'});
   animations.push(dissolve);
   dissolve.finished.then(()=>finish(),()=>finish('cancelled'));
  },()=>finish('cancelled'));
 }).catch(()=>finish('image-error'));
 addEventListener('resize',()=>{if(moving&&(Math.abs(innerWidth-viewportWidth)>2||Math.abs(innerHeight-viewportHeight)>40))finish('resized')},{passive:true});
 reduced.addEventListener('change',()=>{if(reduced.matches)finish('reduced-motion')});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish('hidden')});
 setTimeout(()=>{if(!finished)finish('timeout');else unlock()},4200);
})();
