const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let sceneStarted = false;
function startScene() {
  if (sceneStarted || reduceMotion.matches || matchMedia('(max-height:650px)').matches) return;
  sceneStarted = true;
  import('./solutions-motion.js?v=20260922b').catch(() => {
    document.body.classList.remove('enhanced');
    document.body.classList.add('static');
  });
}
startScene();
reduceMotion.addEventListener('change', startScene);
window.addEventListener('resize', startScene, { passive: true });

const examples = {
  enquiry: [
    ['A clearer starting point.', 'A group is looking for a home. Their form includes budget, location and move date.', [['Budget','£140 per person / week'],['Location','Leicester'],['Move date','Next term']]],
    ['The useful details, together.', 'The enquiry is organised into a brief. A missing viewing preference is flagged for follow up.', [['Search criteria','Ready to review'],['Viewing preference','Still needed'],['Next action','Ask for preferred times']]],
    ['Your team checks the fit.', 'Staff check actual availability, review the details and edit the suggested response.', [['Availability','Staff check required'],['Suggested response','Draft only'],['Decision','With your team']]],
    ['A viewing request, prepared.', 'The reviewed enquiry is ready for staff to handle through the agreed process.', [['Outcome','Prepared enquiry'],['Booking','Not confirmed'],['Measure','Missing details / follow-up time']]]
  ],
  repair: [
    ['A repair report arrives.', 'A fictional tenant reports a dripping kitchen tap. The form collects the issue and access information.', [['Issue','Dripping kitchen tap'],['Access','Arrange with tenant'],['Evidence','Photo requested']]],
    ['One case. Clear context.', 'The report becomes a structured case with missing information and the next action visible.', [['Issue summary','Ready'],['Photo','Awaiting tenant'],['Urgency','Staff assessment required']]],
    ['The right person decides.', 'Staff assess urgency, review a tenant update and prepare instructions for a suitable contractor.', [['Tenant update','Draft'],['Contractor brief','Draft'],['Costs / instructions','Staff approval required']]],
    ['Updates ready to review.', 'The next tenant update and contractor brief are prepared for the team. No visit has been booked.', [['Case','Ready for staff follow up'],['Appointment','Not booked'],['Measure','Handling time / missing details']]]
  ],
  content: [
    ['Start with a proper brief.', 'A fictional venue asks for content about its new menu. The request includes the purpose and required formats.', [['Request','New menu launch'],['Formats','Social posts and email'],['Assets','Menu and photos']]],
    ['Give the work a home.', 'The brief, source files and draft tasks are brought together, with gaps clearly marked.', [['Brief','Organised'],['Missing detail','Launch date'],['Owner','To be assigned']]],
    ['Feedback in one place.', 'The team checks the wording, imagery and dates. An AI-assisted draft stays a draft until reviewed.', [['Copy','Needs review'],['Dates','Check with venue'],['Approval','With your team']]],
    ['Ready for the next person.', 'The reviewed files and decision history are ready for handover. Publishing remains a separate action.', [['Files','Prepared for handover'],['Publishing','Not scheduled'],['Measure','Review time / repeated changes']]]
  ]
};
const tabs = [...document.querySelectorAll('[data-example]')];
const panel = document.querySelector('#example-panel');
const output = document.querySelector('#example-output');
const next = document.querySelector('#example-next');
const play = document.querySelector('#example-play');
const stages = ['Receive', 'Organise', 'Review', 'Next step'];
const icons = ['↙','≡','✓','↗'];
const notes = ['Information collected. Ready to organise.', 'Context prepared. Missing details flagged.', 'A person checks the important details.', 'A clear handover. Nothing sent or booked.'];
let selected = 'enquiry', step = 0, playing = false, timer = 0, exampleVisible = false, motionPaused = false;
const calm = () => reduceMotion.matches || motionPaused;
function animateParts(elements, distance=28) {
  if(calm()) return;
  elements.forEach((el,i)=>el.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:i*55,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'}));
}
function renderExample() {
  const [title, description, facts] = examples[selected][step];
  const status = document.createElement('p'); status.className='sample-status'; status.textContent=`0${step+1} / ${stages[step]}`;
  const heading=document.createElement('h3'); heading.textContent=title;
  const copy=document.createElement('p'); copy.textContent=description;
  const list=document.createElement('dl');
  for(const [label,value] of facts){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);list.append(row);}
  output.replaceChildren(status,heading,copy,list);
  tabs.forEach(t=>{const active=t.dataset.example===selected;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
  panel.setAttribute('aria-labelledby',`tab-${selected}`);
  document.querySelectorAll('.example-track li').forEach((li,i)=>{li.classList.toggle('active',i<=step);if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  document.querySelector('.document-icon').textContent=icons[step];
  document.querySelector('#scene-note').textContent=notes[step];
  next.textContent=step===3?'Replay ↺':'Next step →';
  animateParts([heading,copy,...list.children]);
}
function stopExample(){playing=false;clearTimeout(timer);play.textContent='Play example ▷';play.setAttribute('aria-pressed','false');output.setAttribute('aria-live','polite');}
function scheduleExample(){clearTimeout(timer);if(!playing||!exampleVisible||document.hidden)return;timer=setTimeout(()=>{if(step===3){stopExample();return;}step++;renderExample();scheduleExample();},5200);}
function playExample(){if(step===3){step=0;renderExample();}playing=true;play.textContent='Pause example Ⅱ';play.setAttribute('aria-pressed','true');output.setAttribute('aria-live','off');scheduleExample();}
play.addEventListener('click',()=>playing?stopExample():playExample());
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>{stopExample();selected=tab.dataset.example;step=0;renderExample();});
 tab.addEventListener('keydown',e=>{let index;if(e.key==='ArrowRight')index=(i+1)%tabs.length;if(e.key==='ArrowLeft')index=(i-1+tabs.length)%tabs.length;if(e.key==='Home')index=0;if(e.key==='End')index=tabs.length-1;if(index!==undefined){e.preventDefault();tabs[index].focus();tabs[index].click();}});
});
next.addEventListener('click',()=>{stopExample();step=(step+1)%4;renderExample();});
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{stopExample();step=Number(button.dataset.step);renderExample();}));
let exampleSeen=false;
new IntersectionObserver(([entry])=>{exampleVisible=entry.isIntersecting;if(exampleVisible&&!exampleSeen){exampleSeen=true;if(!calm())playExample();}else if(!exampleVisible)clearTimeout(timer);else scheduleExample();},{threshold:.3}).observe(panel);
document.addEventListener('visibilitychange',()=>document.hidden?clearTimeout(timer):scheduleExample());

// Preserve the real heading structure and italic spans; only the words are masked.
function splitHeading(heading){
 const label=heading.innerText.replace(/\s+/g,' ').trim();
 const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode())if(walker.currentNode.textContent.trim())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(part=>{if(!part.trim()){fragment.append(document.createTextNode(part));return;}const mask=document.createElement('span'),word=document.createElement('span');mask.className='word-mask';mask.setAttribute('aria-hidden','true');word.className='word';word.textContent=part;mask.append(word);fragment.append(mask);});node.replaceWith(fragment);});
 heading.setAttribute('aria-label',label);
}
document.querySelectorAll('[data-roll],#title').forEach(splitHeading);
const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;revealObserver.unobserve(entry.target);if(calm())return;entry.target.querySelectorAll('.word').forEach((word,i)=>word.animate([{transform:'translateY(125%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:800,delay:i*45,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'}));});},{threshold:.3,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('[data-roll]').forEach(heading=>revealObserver.observe(heading));
const diagramObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;diagramObserver.unobserve(entry.target);animateParts([...entry.target.querySelectorAll('.mini-message,.mini-fields>div,.queue-row,.review-pill,.report-lines p,.approval-paper,.approval-seal')],22);});},{threshold:.45});
document.querySelectorAll('.mini-demo,.approval-visual').forEach(el=>diagramObserver.observe(el));

// Native details semantics, with cancellable height animation for opening and closing.
document.querySelectorAll('.questions details').forEach(detail=>{
 const summary=detail.querySelector('summary');let animation=null,desired=detail.open;
 summary.addEventListener('click',event=>{
  if(calm()){animation?.cancel();desired=!detail.open;return;}
  event.preventDefault();desired=!desired;
  const from=detail.offsetHeight;animation?.cancel();detail.style.height='';detail.open=true;
  const to=desired?detail.offsetHeight:summary.offsetHeight;
  animation=detail.animate([{height:`${from}px`},{height:`${to}px`}],{duration:320,easing:'cubic-bezier(.23,1,.32,1)'});
  animation.onfinish=()=>{detail.open=desired;animation=null;};
 });
});
const interests={enquiries:['Tell us what people ask and which details your team has to chase.','our enquiries'],handoffs:['Tell us where work waits between people, and what gets lost along the way.','our handoffs'],reporting:['Tell us which information you gather repeatedly and where it lives.','our reporting'],unsure:['Tell us what your business does and what takes more effort than it should.','a workflow']};
document.querySelectorAll('[data-interest]').forEach(button=>button.addEventListener('click',()=>{
 const [hint,subject]=interests[button.dataset.interest];
 document.querySelectorAll('[data-interest]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#interest-hint').textContent=hint;
 document.querySelector('#start-email').href=`mailto:hello@venturasolutions.co.uk?subject=${encodeURIComponent('A first look at '+subject)}&body=${encodeURIComponent('Hi Paul,\n\nI’d like a first look at '+subject+'.\n\nOur business: \nThe task we’d like to make easier: \nThe tools we use: \n\nThanks')}`;
}));
document.querySelector('#copy-email').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('hello@venturasolutions.co.uk');status.textContent='Email address copied.';}catch{status.textContent='Select and copy hello@venturasolutions.co.uk above.';}});
function stopNonessentialMotion(){stopExample();document.querySelectorAll('.word,.mini-demo *,.approval-visual *').forEach(el=>el.getAnimations().forEach(animation=>animation.cancel()));}
reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)stopNonessentialMotion();});
document.addEventListener('ventura-motion',event=>{motionPaused=event.detail.paused;if(motionPaused)stopNonessentialMotion();});
