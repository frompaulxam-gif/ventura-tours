(() => {
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduceQuery.matches;
  try { paused ||= localStorage.getItem('alrodia-motion') === 'paused'; } catch {}
  const body = document.body;
  const motionButton = document.querySelector('.motion-toggle');
  function applyMotion() {
    body.classList.toggle('motion-paused', paused);
    document.dispatchEvent(new Event('alrodia:motion'));
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
      motionButton.innerHTML = paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>';
    }
  }
  applyMotion();
  motionButton?.addEventListener('click', () => { paused = !paused; applyMotion(); try { localStorage.setItem('alrodia-motion', paused ? 'paused' : 'playing'); } catch {} });
  reduceQuery.addEventListener('change', () => { paused = reduceQuery.matches; applyMotion(); });
  const navigation = document.querySelector('.navigation-dialog');
  const menu = document.querySelector('.food-menu-dialog');
  function openDialog(dialog) { if (!dialog) return; dialog.showModal(); body.classList.add('modal-open'); }
  document.querySelectorAll('.menu-toggle').forEach(button => button.addEventListener('click', () => openDialog(navigation)));
  document.querySelectorAll('[data-open-menu]').forEach(b => b.addEventListener('click', () => { if(b.dataset.menuPanel) { const tab=document.querySelector('[data-panel="'+b.dataset.menuPanel+'"]'); if(tab) selectTab(tab); } openDialog(menu); }));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => body.classList.remove('modal-open'));
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
    dialog.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => dialog.close()));
  });
  const tabs = [...document.querySelectorAll('.menu-tabs [role=tab]')];
  function selectTab(tab) { tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !on; }); }
  tabs.forEach((t,i) => { t.addEventListener('click', () => selectTab(t)); t.addEventListener('keydown', e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs.at(-1) : tabs[(i+(e.key === 'ArrowRight' ? 1 : -1)+tabs.length)%tabs.length]; selectTab(next); next.focus(); } }); });
  const hero = document.querySelector('.hero');
  const tilt = document.querySelector('.tilt-wrap');
  hero?.addEventListener('pointermove', e => { if (paused || reduceQuery.matches || e.pointerType === 'touch') return; const r = hero.getBoundingClientRect(); tilt?.style.setProperty('--tilt-x', ((e.clientX-r.left)/r.width-.5)*9+'deg'); tilt?.style.setProperty('--tilt-y', -((e.clientY-r.top)/r.height-.5)*6+'deg'); });
  hero?.addEventListener('pointerleave', () => { tilt?.style.setProperty('--tilt-x','0deg'); tilt?.style.setProperty('--tilt-y','0deg'); });
  if (body.dataset.site === 'cafe') {
    const dishes = [{name:'Chicken adobo', origin:'A Filipino favourite', description:'Rich, savoury, made for a bowl of rice.'},{name:'La Paz batchoy',origin:'From Iloilo, with love',description:'A warming bowl. A familiar kind of comfort.'}];
    let active = 0;
    let manualUntil = 0;
    function choose(index) {
      index = (index+dishes.length)%dishes.length;
      if (index === active) return;
      const old = document.querySelector('.food-object.active'); old?.classList.add('leaving');
      document.querySelectorAll('.food-object').forEach((img,i) => { const on = i===index; img.classList.toggle('active',on); img.setAttribute('aria-hidden',String(!on)); if(on) img.classList.remove('leaving'); });
      document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.select)===index)));
      active=index; body.dataset.scene=String(index);
      document.getElementById('food-title').textContent=dishes[index].name;
      document.getElementById('food-origin').textContent=dishes[index].origin;
      document.getElementById('food-description').textContent=dishes[index].description;
      document.getElementById('scene-number').textContent=String(index+1).padStart(2,'0');
    }
    function manualChoose(index) { manualUntil = performance.now()+1200; choose(index); }
    document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>manualChoose(Number(b.dataset.select))));
    document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>manualChoose(active+Number(b.dataset.step))));
    hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();manualChoose(active+(e.key==='ArrowRight'?1:-1));}});
    let touchX=0,touchY=0;
    hero.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;},{passive:true});
    hero.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.4)manualChoose(active+(dx<0?1:-1));},{passive:true});
    let lastPhase=0, ticking=false;
    addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;if(paused||reduceQuery.matches)return;const wrapper=document.querySelector('.hero-scroll');const r=wrapper.getBoundingClientRect();const span=wrapper.offsetHeight-hero.offsetHeight;const progress=Math.min(1,Math.max(0,-r.top/Math.max(1,span)));const phase=progress>.26?1:0;if(phase!==lastPhase&&r.bottom>hero.offsetHeight*.9){if(performance.now()>manualUntil)choose(phase);lastPhase=phase;}if(tilt)tilt.style.setProperty('--scroll-y',Math.min(progress,1)*-12+'px');});},{passive:true});
  }
})();
