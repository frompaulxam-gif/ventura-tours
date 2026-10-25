/* Adapted from Leicester Nine source/site.js: native scroll, reading holds and perspective transitions. */
(()=>{
 const wrapper=document.querySelector('.opening-journey'),hero=wrapper.querySelector('.opening-scene'),d=JSON.parse(document.querySelector('#opening-data').textContent);
 const media=matchMedia('(prefers-reduced-motion: reduce)'),objects=[...hero.querySelectorAll('.opening-piece')],chapters=[...hero.querySelectorAll('[data-opening-chapter]')],copy=[...hero.querySelectorAll('.opening-title-block,.opening-copy')];
 let active=-1,frame=0,start=0,travel=1;const clamp=v=>Math.min(1,Math.max(0,v)),ease=v=>{const t=clamp(v);return t*t*(3-2*t)},still=()=>media.matches||wrapper.classList.contains('opening-paused');
 function setPiece(i){if(active===i)return;active=i;wrapper.dataset.active=String(i);hero.querySelector('#opening-title').textContent=d.titles[i];hero.querySelector('#opening-label').textContent=d.chapters[i]+' · '+d.sub;hero.querySelector('#opening-caption').textContent=d.captions[i];hero.querySelector('#opening-description').textContent=d.descriptions[i];const cta=hero.querySelector('.opening-cta');cta.textContent=d.ctas[i];cta.href=d.links[i];chapters.forEach((b,n)=>{if(n===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')})}
 function render(){frame=0;const p=clamp((scrollY-start)/travel),position=ease((p-.14)/.24)+ease((p-.58)/.24),i=Math.round(position),reduced=still();setPiece(i);wrapper.dataset.progress=p.toFixed(4);
 objects.forEach((el,n)=>{const dist=n-position,amount=Math.min(1,Math.abs(dist)),show=reduced?n===i:amount<1;el.style.visibility=show?'visible':'hidden';el.style.opacity=reduced?(show?'1':'0'):String(1-ease(amount));el.style.transform=`translate3d(${reduced?0:dist*Math.min(innerWidth*.62,800)}px,${reduced?0:dist*75}px,0) rotateY(${reduced?0:dist*-24}deg) rotate(${reduced?0:dist*28+(p*2-1)*7}deg) scale(${reduced?1:1-amount*.22})`});
 const amount=Math.abs(position-i);copy.forEach(el=>{el.style.opacity=reduced?'1':String(1-ease(amount/.5));el.style.translate=`0 ${reduced?0:(position-i)*-24}px`});hero.querySelector('.opening-progress span').style.transform=`scaleX(${p})`;hero.querySelector('.opening-orbit').style.transform=`rotate(${-22+(reduced?0:p*34)}deg)`;
 }
 function request(){if(!frame)frame=requestAnimationFrame(render)}function measure(){start=wrapper.getBoundingClientRect().top+scrollY;travel=Math.max(1,wrapper.offsetHeight-hero.offsetHeight);request()}
 function go(i){scrollTo({top:start+[0,.48,.94][i]*travel,behavior:still()?'instant':'smooth'})}
 addEventListener('scroll',request,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('pageshow',measure);new ResizeObserver(measure).observe(hero);media.addEventListener('change',request);
 chapters.forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.openingChapter))));
 hero.addEventListener('keydown',e=>{if(e.target!==hero||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();go(Math.max(0,Math.min(2,active+(e.key==='ArrowRight'?1:-1))))});
 const pause=hero.querySelector('.opening-motion');pause.addEventListener('click',()=>{const paused=wrapper.classList.toggle('opening-paused');pause.textContent=paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));request()});
 measure();
})();
