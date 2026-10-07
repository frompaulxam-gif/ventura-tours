(() => {
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.site-header');
 const logo=header.querySelector('.logo-crop');
 let moving,veil,finished=false;
 const animations=[];
 const finish=(reason='complete')=>{
  if(finished)return;finished=true;root.dataset.logoIntroState=reason;
  animations.forEach(animation=>animation.cancel());
  moving?.remove();veil?.remove();
  root.classList.remove('brand-intro-pending');
  clearTimeout(root._brandIntroFallback);
 };
 if(!root.classList.contains('brand-intro-pending')||reduced.matches||scrollY>120){finish(reduced.matches?'reduced-motion':scrollY>120?'scrolled':'skipped');return}
 root.dataset.logoIntroState='loading';
 const image=logo.querySelector('img');
 Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,500))]).then(()=>{
  if(finished||reduced.matches||scrollY>120){finish();return}
  const rect=logo.getBoundingClientRect();
  if(!rect.width){finish();return}
  veil=document.createElement('div');veil.className='brand-intro-veil';veil.setAttribute('aria-hidden','true');
  moving=document.createElement('div');moving.className='brand-intro-logo';moving.setAttribute('aria-hidden','true');
  moving.append(logo.cloneNode(true));
  Object.assign(moving.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
  document.body.append(veil,moving);
  const scale=Math.min(2.4,innerWidth*.82/rect.width);
  const dx=innerWidth/2-rect.left-rect.width/2;
  const dy=innerHeight/2-rect.top-rect.height/2;
  const transform=(x,y,s)=>`translate3d(${x}px,${y}px,0) scale(${s})`;
  root.dataset.logoIntroState='running';
  const travel=moving.animate([
   {offset:0,opacity:0,transform:transform(dx-Math.min(140,innerWidth*.22),dy,scale),easing:'cubic-bezier(.16,1,.3,1)'},
   {offset:.3,opacity:1,transform:transform(dx,dy,scale)},
   {offset:.53,opacity:1,transform:transform(dx,dy,scale),easing:'cubic-bezier(.76,0,.2,1)'},
   {offset:1,opacity:1,transform:transform(0,0,1)}
  ],{duration:2500,fill:'both'});
  animations.push(travel,
   veil.animate([{opacity:1},{opacity:0}],{duration:1000,delay:1450,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}),
   header.animate([{opacity:0},{opacity:1}],{duration:400,delay:2100,easing:'ease-out',fill:'both'})
  );
  travel.finished.then(()=>finish(),()=>finish('cancelled'));
 }).catch(finish);
 addEventListener('resize',()=>{if(moving)finish('resized')},{passive:true});
 reduced.addEventListener('change',()=>{if(reduced.matches)finish()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish()});
 setTimeout(finish,4200);
})();
