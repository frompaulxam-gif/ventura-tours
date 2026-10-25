/* Approved first-ten opening choreography, isolated in a shadow tree so the
   original website's layout, selectors and customer tools keep their styles. */
(() => {
  const host=document.querySelector('animated-opening');if(!host)return;
  // Declarative shadow DOM is supported by current browsers; this fallback
  // retains the same content when a browser does not attach it automatically.
  if(!host.shadowRoot){const template=host.querySelector('template');if(!template)return;host.attachShadow({mode:'open'}).append(template.content.cloneNode(true));template.remove();}
  const tree=host.shadowRoot,root=tree.querySelector('.opening'),stage=tree.querySelector('.opening-stage');
  const data=JSON.parse(document.getElementById('animated-opening-data').textContent),media=matchMedia('(prefers-reduced-motion: reduce)');
  const objects=[...tree.querySelectorAll('.opening-piece')],chapters=[...tree.querySelectorAll('[data-opening-chapter]')],copy=[...tree.querySelectorAll('.opening-intro,.opening-copy')],pause=tree.querySelector('.opening-pause'),cta=tree.querySelector('.opening-cta');
  let active=-1,frame=0,start=0,travel=1,paused=false;
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
  function setScene(i){if(active===i)return;active=i;root.dataset.scene=String(i);const s=data.scenes[i];tree.querySelector('.opening-kicker').textContent=s.kicker;tree.querySelector('h1').textContent=s.heading;tree.querySelector('.opening-copy h2').textContent=s.title;tree.querySelector('.opening-copy p').textContent=s.caption;cta.textContent=s.action;cta.setAttribute('href',s.href);chapters.forEach((b,n)=>{if(n===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});}
  function render(){frame=0;const p=clamp((scrollY-start)/travel),still=paused||media.matches,position=ease((p-.16)/.22)+ease((p-.57)/.22),index=Math.round(position);setScene(index);root.dataset.progress=p.toFixed(4);objects.forEach((el,i)=>{const d=i-position,a=Math.min(1,Math.abs(d)),show=still?i===index:a<1;el.style.visibility=show?'visible':'hidden';el.style.opacity=still?(show?'1':'0'):String(1-ease(a));el.style.transform=`translate3d(${still?0:d*Math.min(innerWidth*.62,800)}px,${still?0:d*75}px,0) rotateY(${still?0:d*-24}deg) rotate(${still?0:d*30+(p*2-1)*7}deg) scale(${still?1:1-a*.22})`;});const alpha=still?1:1-ease(Math.abs(position-index)/.5);copy.forEach(el=>{el.style.opacity=String(alpha);el.style.translate=`0 ${still?0:(position-index)*-24}px`});tree.querySelector('.opening-progress span').style.transform=`scaleX(${p})`;tree.querySelector('.opening-cue').textContent=p>.94?'Scroll to explore more':'Scroll to discover';tree.querySelector('.opening-orbit').style.transform=`rotate(${-22+(still?0:p*30)}deg)`;document.documentElement.classList.toggle('animated-opening-visible',p<1&&host.getBoundingClientRect().bottom>0);}
  function request(){if(!frame)frame=requestAnimationFrame(render)}
  function measure(){start=host.getBoundingClientRect().top+scrollY;travel=Math.max(1,root.offsetHeight-stage.offsetHeight);request()}
  function mode(){root.classList.toggle('opening-reduced',media.matches);pause.disabled=media.matches;pause.setAttribute('aria-label',media.matches?'Reduced motion enabled':paused?'Resume motion':'Pause motion');request()}
  pause.addEventListener('click',()=>{paused=!paused;root.classList.toggle('opening-paused',paused);pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-pressed',String(paused));mode()});
  chapters.forEach((b,i)=>b.addEventListener('click',()=>scrollTo({top:start+[0,.48,.92][i]*travel,behavior:media.matches||paused?'instant':'smooth'})));
  tree.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{const id=a.getAttribute('href').slice(1),target=document.getElementById(id);if(target){event.preventDefault();history.replaceState(null,'','#'+id);target.scrollIntoView({behavior:media.matches?'instant':'smooth'});}}));
  stage.addEventListener('pointermove',e=>{if(media.matches||paused||e.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();stage.style.setProperty('--opening-x',`${(e.clientX/r.width-.5)*-10}px`);stage.style.setProperty('--opening-y',`${((e.clientY-r.top)/r.height-.5)*-7}px`)});
  stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--opening-x','0px');stage.style.setProperty('--opening-y','0px')});
  root.classList.add('opening-ready');addEventListener('scroll',request,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('pageshow',measure);media.addEventListener('change',mode);new ResizeObserver(measure).observe(stage);mode();measure();
})();
