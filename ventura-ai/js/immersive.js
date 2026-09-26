(() => {
  const init=()=>{
    const body=document.body;
    const system=matchMedia('(prefers-reduced-motion: reduce)');
    const active=new Set();
    const allowed=()=>body.dataset.reduced!=='true';
    function sync(){if(!allowed()){active.forEach(a=>a.cancel());active.clear();}}
    system.addEventListener('change',sync);sync();
    const animate=(el,frames,options)=>{if(!allowed()||!el)return;const a=el.animate(frames,{duration:750,easing:'cubic-bezier(.16,1,.3,1)',...options});active.add(a);a.finished.catch(()=>{}).finally(()=>active.delete(a));};
    const tabs=document.querySelector('.case-tabs');
    function orientation(){tabs.setAttribute('aria-orientation','horizontal');}
    orientation();matchMedia('(max-width:760px)').addEventListener('change',orientation);
    const statuses={admin:'Turning requests into clear tasks',enquiries:'Preparing a reply for your review',approvals:'Giving the next step an owner'};
    const orb=document.querySelector('.orb-stage .liquid-orb');
    function respond(event){const selected=tabs.querySelector('[aria-selected=true]');if(!selected)return;document.getElementById('orb-status').textContent=statuses[selected.dataset.case];if(event.detail.withMotion)animate(orb,[{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:500});}
    tabs.addEventListener('examplechange',respond);
    // One accessible heading label, with masked word entrances for sighted readers.
    const headings=[...document.querySelectorAll('.demo-intro h2,.features-intro h2,.offer-heading h2')];
    headings.forEach(h=>{
      h.setAttribute('aria-label',h.innerText.replace(/\s+/g,' ').trim());
      const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim()){fragment.append(document.createTextNode(word));return;}const mask=document.createElement('span');mask.className='reveal-mask';mask.setAttribute('aria-hidden','true');const text=document.createElement('span');text.className='reveal-word';text.textContent=word;mask.append(text);fragment.append(mask);});node.replaceWith(fragment);});
    });
    if('IntersectionObserver' in window){
      const once=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const words=entry.target.querySelectorAll('.reveal-word');words.forEach((word,i)=>animate(word,[{opacity:0,transform:'translateY(105%)'},{opacity:1,transform:'translateY(0)'}],{duration:900,delay:i*45,fill:'backwards'}));once.unobserve(entry.target);}),{threshold:.4});headings.forEach(h=>once.observe(h));
      const visuals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;animate(entry.target,[{opacity:.3,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000});visuals.unobserve(entry.target);}),{threshold:.3});document.querySelectorAll('.flow-window,.reply-sheet,.task-table').forEach(el=>visuals.observe(el));
      const ambient=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.dataset.offscreen=String(!entry.isIntersecting)),{rootMargin:'60px'});document.querySelectorAll('.hero,.offer-section,.contact-section,.task-marquee,.processing-bridge,.orb-stage,.feature-tile').forEach(el=>{el.classList.add('motion-visible');ambient.observe(el);});
      const occupied=new Set(),floating=document.querySelector('.floating-demo');
      const widget=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)occupied.add(e.target);else occupied.delete(e.target);});const hidden=occupied.size>0;floating.dataset.hidden=String(hidden);floating.tabIndex=hidden?-1:0;floating.setAttribute('aria-hidden',String(hidden));},{threshold:.05});widget.observe(document.querySelector('.hero'));widget.observe(document.querySelector('.orb-demo'));widget.observe(document.getElementById('contact'));
    }
    document.addEventListener('visibilitychange',()=>body.dataset.offscreen=String(document.hidden));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
