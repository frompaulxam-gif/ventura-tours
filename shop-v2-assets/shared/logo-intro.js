(()=>{
  const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const header=document.querySelector('.site-header'), logo=document.querySelector('.logo-crop');
  let mark,veil,done=false,fallback,releaseTimer; const animations=[];
  function releaseScroll(){
    const started=performance.now();
    function check(){
      if(document.querySelector('.duo-stage')?.dataset.bufferReady==='true'||performance.now()-started>2500){root._releaseIntroScroll?.();return;}
      releaseTimer=setTimeout(check,80);
    }
    check();
  }
  function finish(event){
    if(done)return; done=true; clearTimeout(fallback); clearTimeout(releaseTimer);
    root.classList.remove('brand-intro-pending'); root.dataset.logoIntroState='complete';
    // The live logo is now visible at the exact same position as the arriving mark.
    animations.forEach(a=>a.cancel());
    mark?.remove(); veil?.remove();
    removeEventListener('resize',finish); reduced.removeEventListener('change',finish);
    if(event||reduced.matches)root._releaseIntroScroll?.();else releaseScroll();
  }
  if(!logo||!header||!root.classList.contains('brand-intro-pending')||reduced.matches){finish({type:'bypass'});return;}
  const image=logo.querySelector('img');
  Promise.race([image?.decode().catch(()=>{}),new Promise(r=>setTimeout(r,650))]).then(()=>{
    if(done)return;
    const visual=logo.querySelector('.logo-lockup,.logo-window,.logo-text')||logo,r=visual.getBoundingClientRect();
    mark=document.createElement('div');mark.className='logo-crop shop-intro';mark.setAttribute('aria-hidden','true');
    mark.append(visual===logo?logo.firstElementChild.cloneNode(true):visual.cloneNode(true));
    Object.assign(mark.style,{position:'fixed',left:r.left+'px',top:r.top+'px',zIndex:101,pointerEvents:'none',transformOrigin:'center',overflow:'hidden'});
    mark.style.setProperty('width',r.width+'px','important');mark.style.setProperty('height',r.height+'px','important');
    veil=document.createElement('div');veil.className='brand-intro-veil';
    document.body.append(veil,mark);
    const scale=Math.min(2.3,innerWidth*.76/r.width,innerHeight*.26/r.height);
    const centered=`translate3d(${innerWidth/2-r.left-r.width/2}px,${innerHeight/2-r.top-r.height/2}px,0) scale(${scale})`;
    animations.push(mark.animate([{transform:centered},{offset:.38,transform:centered,easing:'cubic-bezier(.76,0,.24,1)'},{transform:'translate3d(0,0,0) scale(1)'}],{duration:2400,easing:'linear',fill:'both'}));
    animations.push(veil.animate([{opacity:1},{opacity:0}],{duration:800,delay:1500,easing:'ease',fill:'both'}));
    animations.push(header.animate([{opacity:0},{opacity:1}],{duration:550,delay:1750,easing:'ease',fill:'both'}));
    animations.push(mark.firstElementChild.animate([{transform:'translateX(-105%)'},{transform:'translateX(0)'}],{duration:750,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
    animations[0].finished.then(()=>finish(),()=>{});
  }).catch(finish);
  fallback=setTimeout(finish,3400);
  addEventListener('resize',finish,{once:true});reduced.addEventListener('change',finish);
})();
