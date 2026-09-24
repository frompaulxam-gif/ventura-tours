const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let sceneStarted = false;
function startScene() {
  if (sceneStarted || reduceMotion.matches || matchMedia('(max-height:650px)').matches) return;
  sceneStarted = true;
  import('./solutions-motion.js?v=20260924c').catch(() => { document.body.classList.remove('enhanced'); document.body.classList.add('static'); });
}
startScene();
reduceMotion.addEventListener('change', startScene);
window.addEventListener('resize', startScene, {passive:true});

const samples = [
  ['After closing time', '“Can I book for tomorrow?”', 'The AI answers, explains it is a virtual assistant and asks which service the caller needs.'],
  ['Check the diary', 'Find a time that fits.', 'It checks the supported calendar against your booking rules, then offers available times.'],
  ['Confirm the booking', 'Booked only when it’s saved.', 'It confirms the details after the calendar accepts the booking. If that fails, it takes a request for your team.'],
  ['Keep your team informed', 'A clear update, ready for you.', 'Your team gets the booking details or callback request through the agreed handover. Unusual questions go to a person.']
];
let step=0;
const tabs=[...document.querySelectorAll('[data-step]')], output=document.querySelector('#example-output');
function selectStep(index){
  step=index;
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  const [status,title,copy]=samples[index];
  output.querySelector('.sample-status').textContent=status;
  output.querySelector('h3').textContent=title;
  output.querySelector('p:last-child').textContent=copy;
  output.setAttribute('aria-labelledby',`step-${index}`);
  document.querySelector('#example-next').textContent=index===3?'Start again ↺':'Next step →';
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectStep(index));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectStep(next);tabs[next].focus();}
  });
});
document.querySelector('#example-next').addEventListener('click',()=>{selectStep((step+1)%samples.length);output.focus({preventScroll:true});});

const interests={
  receptionist:['Tell us how you handle calls and bookings today.','AI receptionist enquiry','How we handle calls and bookings now:'],
  implementation:['Tell us which task you want to improve and the tools you use.','AI implementation enquiry','The workflow and tools we use:'],
  admin:['Tell us what your team keeps copying, checking or chasing.','Admin and follow-up enquiry','The admin we want to make easier:'],
  website:['Share your website, or tell us what you need a new one to do.','Website enquiry','Our current website and what we would like to improve:'],
  unsure:['Tell us about your business. We can find a starting point together.','Ventura Solutions enquiry','What we would like to make easier:']
};
function selectInterest(key){
  const [hint,subject,prompt]=interests[key];
  document.querySelectorAll('[data-interest]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.interest===key)));
  document.querySelector('#interest-hint').textContent=hint;
  document.querySelector('#start-email').href=`mailto:hello@venturasolutions.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi Paul,\n\nOur business: \n${prompt} \n\nThanks`)}`;
}
document.querySelectorAll('[data-interest]').forEach(button=>button.addEventListener('click',()=>selectInterest(button.dataset.interest)));
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>selectInterest(link.dataset.service)));
selectInterest('receptionist');
document.querySelector('#copy-email').addEventListener('click',async()=>{
  const status=document.querySelector('#copy-status');
  try{await navigator.clipboard.writeText('hello@venturasolutions.co.uk');status.textContent='Email address copied.';}
  catch{status.textContent='Select and copy hello@venturasolutions.co.uk above.';}
});
