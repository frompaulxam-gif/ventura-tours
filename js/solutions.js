const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let sceneStarted = false;
function startScene() {
  if (sceneStarted || reduceMotion.matches || matchMedia('(max-height:650px)').matches) return;
  sceneStarted = true;
  import('./solutions-motion.js?v=20260922').catch(() => {
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
const stages = ['Receive', 'Organise', 'Review', 'Next step'];
let selected = 'enquiry', step = 0;
function renderExample() {
  const [title, description, facts] = examples[selected][step];
  const status = document.createElement('p'); status.className = 'sample-status'; status.textContent = `0${step+1} / ${stages[step]}`;
  const heading = document.createElement('h3'); heading.textContent = title;
  const copy = document.createElement('p'); copy.textContent = description;
  const list = document.createElement('dl');
  for (const [label,value] of facts) { const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd'); dt.textContent=label;dd.textContent=value;row.append(dt,dd);list.append(row); }
  output.replaceChildren(status,heading,copy,list);
  tabs.forEach(t=>{ const active=t.dataset.example===selected;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1; });
  panel.setAttribute('aria-labelledby',`tab-${selected}`);
  document.querySelectorAll('.example-track li').forEach((li,i)=>{li.classList.toggle('active',i<=step);if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  next.textContent = step===3 ? 'Replay this example ↺' : `Next: ${stages[step+1].toLowerCase()} →`;
  if(!reduceMotion.matches) output.animate([{opacity:.3,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
}
tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>{selected=tab.dataset.example;step=0;renderExample();});
  tab.addEventListener('keydown',e=>{let index;if(e.key==='ArrowRight')index=(i+1)%tabs.length;if(e.key==='ArrowLeft')index=(i-1+tabs.length)%tabs.length;if(e.key==='Home')index=0;if(e.key==='End')index=tabs.length-1;if(index!==undefined){e.preventDefault();tabs[index].focus();tabs[index].click();}});
});
next.addEventListener('click',()=>{step=(step+1)%4;renderExample();});
document.querySelectorAll('.questions details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open&&!reduceMotion.matches) detail.querySelector('div').animate([{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}));
document.querySelector('#copy-email').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('hello@venturasolutions.co.uk');status.textContent='Email address copied.';}catch{status.textContent='Select and copy hello@venturasolutions.co.uk above.';}});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting));},{threshold:.65});
document.querySelectorAll('.process li').forEach(li=>observer.observe(li));
