(() => {
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const setMenu = (open) => {menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);};
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {if (event.target.closest('a')) setMenu(false);});
  document.addEventListener('keydown', event => {if(event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true'){setMenu(false);menu.focus();}});
  document.addEventListener('click', event => {if(!event.target.closest('.header')) setMenu(false);});
  window.addEventListener('resize', () => {if(innerWidth>760) setMenu(false);});
  const motion = document.querySelector('.motion-toggle');
  motion.addEventListener('click', () => {const paused=body.classList.toggle('motion-paused');motion.setAttribute('aria-pressed',String(paused));motion.innerHTML=paused?'Enable motion <span aria-hidden="true">▷</span>':'Reduce motion <span aria-hidden="true">Ⅱ</span>';document.dispatchEvent(new CustomEvent('ventura:motion', {detail:{paused}}));});
  document.addEventListener('visibilitychange',()=>body.classList.toggle('page-hidden',document.hidden));
  const cases = {
    enquiries: {title:'From an incoming enquiry to a considered reply.', description:'Organise the details, prepare a helpful response and give your team a clear next step.', nodes:[['Enquiry arrives','Email or website form'],['AI organises','Extract and summarise'],['Your team reviews','Check, edit and approve'],['Next step is ready','Reply and record the task']]},
    documents: {title:'Find useful answers in the knowledge you already have.', description:'Help your team locate relevant information, with sources they can check before using an answer.', nodes:[['Question comes in','A team member needs help'],['Relevant sources found','Approved company documents'],['Your team checks','Review the answer and sources'],['Knowledge is useful','Use it in the work at hand']]},
    operations: {title:'Turn scattered updates into a clearer next step.', description:'Bring information from agreed sources together, draft a useful summary and help people follow through.', nodes:[['Updates arrive','Agreed tools and records'],['AI drafts a summary','Find tasks and open questions'],['Your team decides','Confirm ownership and priorities'],['Work moves forward','Create the approved actions']]}
  };
  const tabs = [...document.querySelectorAll('[data-case]')];
  function selectCase(tab) {
    const item=cases[tab.dataset.case];
    tabs.forEach(button=>{const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    document.querySelector('#workflow-panel').setAttribute('aria-labelledby',tab.id);
    document.querySelector('#workflow-title').textContent=item.title;
    document.querySelector('#workflow-description').textContent=item.description;
    document.querySelectorAll('.workflow-nodes li').forEach((node,i)=>{node.querySelector('h4').textContent=item.nodes[i][0];node.querySelector('p').textContent=item.nodes[i][1];});
    const demo=document.querySelector('.workflow-demo');demo.classList.remove('is-changing');
    requestAnimationFrame(()=>demo.classList.add('is-changing'));
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectCase(tab));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight') next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft') next=(index-1+tabs.length)%tabs.length;
      if(event.key==='Home') next=0;
      if(event.key==='End') next=tabs.length-1;
      if(next!==undefined){event.preventDefault();selectCase(tabs[next]);tabs[next].focus();}
    });
  });
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
    document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('reveal-pending');observer.observe(el);});
    reduced.addEventListener('change',event=>{if(event.matches){document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.add('is-visible'));observer.disconnect();}});
  }
})();
