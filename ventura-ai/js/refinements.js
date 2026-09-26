(() => {
  'use strict';
  const body = document.body;
  const descriptions = {sweep:'Sweep: a curved green return around the offer', cove:'Cove: a green island with illustrated paper notes', ribbon:'Ribbon: a tall green arc through the examples'};
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const params = new URLSearchParams(location.search);
  let reduce = params.get('motion') === 'off';
  const replay = document.getElementById('replay-intro');
  const reduceButton = document.getElementById('reduce-motion');
  const heading = document.querySelector('.hero h1');
  const fullTitle = heading.textContent.replace(/\s+/g,' ').replace('admin.More','admin. More').trim();
  heading.setAttribute('aria-label',fullTitle);
  heading.innerHTML = '';
  ['Less admin.','More time for your business.'].forEach((line,i) => {
    const row = document.createElement('span'); row.className = i ? 'hero-tail' : 'hero-first'; row.setAttribute('aria-hidden','true');
    line.split(' ').forEach((word,j) => {
      if(j) row.append(document.createTextNode(' '));
      const shell = document.createElement('span'); shell.className='word-shell';
      const inner = document.createElement('span'); inner.className='motion-word'; inner.textContent=word;
      shell.append(inner);row.append(shell);
    });
    heading.append(row);
  });
  const words = [...heading.querySelectorAll('.motion-word')];
  const liveAnimations = new Set();
  const motionAllowed = () => !reduce && !systemMotion.matches;
  function animate(el,frames,options) {
    if(!motionAllowed() || !el.animate) return;
    const animation=el.animate(frames,{easing:'cubic-bezier(.16,1,.3,1)',...options});
    liveAnimations.add(animation);
    animation.finished.catch(()=>{}).finally(()=>liveAnimations.delete(animation));
  }
  function intro() {
    liveAnimations.forEach(a=>a.cancel());liveAnimations.clear();
    if(!motionAllowed()) return;
    const style=body.dataset.design;
    words.forEach((word,i)=> {
      const frames = style==='cove' ? [{opacity:0,transform:'translateY(20px) scale(.97)',filter:'blur(7px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'}] : style==='ribbon' ? [{opacity:0,transform:'translateY(105%) rotate(2deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}] : [{opacity:0,transform:'translateY(105%)'},{opacity:1,transform:'translateY(0)'}];
      animate(word,frames,{duration:style==='cove'?720:640,delay:i*55,fill:'backwards'});
    });
    animate(document.querySelector('.intro'),[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:240,fill:'backwards'});
    animate(document.querySelector('.actions'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,delay:350,fill:'backwards'});
  }
  function storeOptions(){const url=new URL(location.href);url.searchParams.set('design',body.dataset.design);if(reduce)url.searchParams.set('motion','off');else url.searchParams.delete('motion');history.replaceState(null,'',url);}
  function choose(name,write=true){
    if(!Object.hasOwn(descriptions,name))return;
    body.dataset.design=name;
    document.querySelectorAll('[data-option]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.option===name)));
    document.getElementById('design-description').textContent=descriptions[name];
    document.querySelector('.design-picker-top a').setAttribute('href', name === 'sweep' ? '#offer' : '#everyday');
    if(write)storeOptions();
    if(scrollY<350)intro();
  }
  function updateMotion(){body.dataset.reduced=String(reduce||systemMotion.matches);reduceButton.setAttribute('aria-pressed',String(reduce||systemMotion.matches));reduceButton.textContent=systemMotion.matches?'System: reduced motion':reduce?'Motion off':'Reduce motion';replay.disabled=!motionAllowed();if(!motionAllowed()){liveAnimations.forEach(a=>a.cancel());liveAnimations.clear();}}
  document.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.option)));
  replay.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'instant'});intro();});
  reduceButton.addEventListener('click',()=>{if(systemMotion.matches)return;reduce=!reduce;updateMotion();storeOptions();});
  systemMotion.addEventListener('change',updateMotion);
  updateMotion(); choose(params.get('design')||'sweep',false);
  // Reveal only the related illustration fragments and offer siblings, never whole sections.
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const target=entry.target;
      if(target.classList.contains('story-art')){
        [...target.children].forEach((child,i)=>animate(child,[{opacity:0,transform:'translateX(-12px)'},{opacity:1,transform:'translateX(0)'}],{duration:440,delay:i*65,fill:'backwards'}));
      }else{
        [...target.children].forEach((child,i)=>animate(child,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:i*95,fill:'backwards'}));
      }
      observer.unobserve(target);
    }),{threshold:.22});
    document.querySelectorAll('.story-art,.offer-grid').forEach(el=>observer.observe(el));
  }
  const result=document.querySelector('.system-result');
  document.querySelector('.case-tabs').addEventListener('click',()=>animate(result,[{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:260}));
  document.querySelector('.case-tabs').addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))animate(result,[{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:260});});
  document.getElementById('demo-next').addEventListener('click',()=>{animate(document.querySelector('.check-note'),[{backgroundColor:'#dde9c8'},{backgroundColor:'#f0f3e5'}],{duration:480});animate(document.querySelector('.progress .active'),[{transform:'translateY(4px)',opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:240});});
  const form=document.getElementById('enquiry-form'),error=document.getElementById('form-error');
  form.addEventListener('submit',e=>{
    const missing=[form.elements.business,form.elements.task].filter(input=>!input.value.trim());
    if(missing.length){e.preventDefault();e.stopImmediatePropagation();missing.forEach(input=>{input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','form-error');});error.textContent='Add a few words about your business and the task before opening your email draft.';error.hidden=false;missing[0].focus();}
  },true);
  form.addEventListener('input',e=>{if(e.target.matches('input,textarea')&&e.target.value.trim()){e.target.removeAttribute('aria-invalid');e.target.removeAttribute('aria-describedby');}if(form.elements.business.value.trim()&&form.elements.task.value.trim())error.hidden=true;});
})();
