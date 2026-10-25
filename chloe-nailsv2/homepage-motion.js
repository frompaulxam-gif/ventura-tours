/* Native-scroll choreography adapted from Alrodia jewellery-scroll.js.
   No wheel/touch interception; two eased transitions separated by reading holds. */
(() => {
  const root=document.querySelector('.opening'); if(!root)return;
  const stage=root.querySelector('.opening-stage'), data=JSON.parse(document.getElementById('opening-data').textContent);
  const media=matchMedia('(prefers-reduced-motion: reduce)'), objects=[...root.querySelectorAll('.opening-piece')], chapters=[...root.querySelectorAll('[data-opening-chapter]')], copy=[...root.querySelectorAll('.opening-intro,.opening-copy')];
  const pause=root.querySelector('.opening-pause'), cta=root.querySelector('.opening-cta');
  let active=-1,frame=0,start=0,travel=1,paused=false;
  const clamp=v=>Math.max(0,Math.min(1,v)), ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
  function setScene(index){
    if(active===index)return;active=index;root.dataset.scene=String(index);
    const item=data.scenes[index];
    root.querySelector('.opening-kicker').textContent=item.kicker;
    root.querySelector('h1').textContent=item.heading;
    root.querySelector('.opening-copy h2').textContent=item.title;
    root.querySelector('.opening-copy p').textContent=item.caption;
    cta.textContent=item.action;cta.setAttribute('href',item.href);
    chapters.forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
  }
  function render(){
    frame=0;const p=clamp((scrollY-start)/travel),still=paused||media.matches;
    const position=ease((p-.16)/.22)+ease((p-.57)/.22), index=Math.round(position);
    setScene(index);root.dataset.progress=p.toFixed(4);
    objects.forEach((object,i)=>{
      const d=i-position,a=Math.min(1,Math.abs(d)),show=still?i===index:a<1;
      object.style.visibility=show?'visible':'hidden';object.style.opacity=still?(show?'1':'0'):String(1-ease(a));
      object.style.transform=`translate3d(${still?0:d*Math.min(innerWidth*.62,800)}px,${still?0:d*75}px,0) rotateY(${still?0:d*-24}deg) rotate(${still?0:d*30+(p*2-1)*7}deg) scale(${still?1:1-a*.22})`;
    });
    const alpha=still?1:1-ease(Math.abs(position-index)/.5);
    copy.forEach(el=>{el.style.opacity=String(alpha);el.style.translate=`0 ${still?0:(position-index)*-24}px`});
    root.querySelector('.opening-progress span').style.transform=`scaleX(${p})`;
    root.querySelector('.opening-cue').textContent=p>.94?'Scroll to explore more':'Scroll to discover';
    root.querySelector('.opening-orbit').style.transform=`rotate(${-22+(still?0:p*30)}deg)`;
  }
  function request(){if(!frame)frame=requestAnimationFrame(render)}
  function measure(){start=root.getBoundingClientRect().top+scrollY;travel=Math.max(1,root.offsetHeight-stage.offsetHeight);request()}
  function mode(){root.classList.toggle('opening-reduced',media.matches);pause.disabled=media.matches;pause.setAttribute('aria-label',media.matches?'Reduced motion enabled':paused?'Resume motion':'Pause motion');request()}
  pause.addEventListener('click',()=>{paused=!paused;root.classList.toggle('opening-paused',paused);pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-pressed',String(paused));mode()});
  chapters.forEach((button,i)=>button.addEventListener('click',()=>scrollTo({top:start+[0,.48,.92][i]*travel,behavior:media.matches||paused?'instant':'smooth'})));
  stage.addEventListener('pointermove',event=>{if(media.matches||paused||event.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();stage.style.setProperty('--opening-x',`${(event.clientX/r.width-.5)*-10}px`);stage.style.setProperty('--opening-y',`${((event.clientY-r.top)/r.height-.5)*-7}px`)});
  stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--opening-x','0px');stage.style.setProperty('--opening-y','0px')});
  root.classList.add('opening-ready');addEventListener('scroll',request,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('pageshow',measure);media.addEventListener('change',mode);new ResizeObserver(measure).observe(stage);mode();measure();
})();
