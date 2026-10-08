'use strict';
const state={brand:null,model:null,selected:new Set(),diagnosis:false,screenOption:null,models:[]};
const picker=document.querySelector('#picker');
const money=p=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',minimumFractionDigits:0,maximumFractionDigits:0}).format(p/100);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const definitions={screen:['Screen replacement','0% 0%'],'inner-screen':['Inner screen','0% 0%'],'outer-screen':['Outer screen','0% 0%'],back:['Back glass','50% 0%'],battery:['Battery replacement','100% 0%'],'battery-base':['Main battery','100% 0%'],'battery-flip':['Secondary battery','100% 0%'],charging:['Charging port','0% 100%'],camera:['Rear camera','50% 100%'],'camera-lens':['Camera lens','50% 100%'],'front-camera':['Front camera','50% 100%'],liquid:['Liquid damage','100% 100%'],housing:['Full housing replacement','50% 50%'],reset:['Device reset','50% 50%'],diagnostic:['Diagnostic assessment','50% 50%']};
const whatsapp=text=>'https://wa.me/447777748782?text='+encodeURIComponent(text);
function announce(s){document.querySelector('#announcer').textContent=s}
function stage(){return state.model?'repair':state.brand?'model':'brand'}
function updateSteps(){document.querySelectorAll('[data-step]').forEach(b=>{const v=b.dataset.step;b.disabled=v==='model'&&!state.brand||v==='repair'&&!state.model;if(v===stage())b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')})}
function render(){updateSteps();picker.setAttribute('aria-busy','false');if(state.model)renderRepairs();else if(state.brand)renderModels();else renderBrands()}
function setBrand(brand){state.brand=brand;state.model=null;state.selected.clear();state.diagnosis=false;render();announce(brand+' selected. Choose your phone.');}
function setModel(id){const m=state.models.find(m=>m.id===id);if(!m)return;state.brand=m.brand;state.model=m;state.screenOption=null;state.selected.clear();state.diagnosis=false;render();announce(m.name+' selected. Choose your repairs.');document.querySelector('.steps').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function renderBrands(){picker.innerHTML='<div class="brand-grid">'+['Apple','Samsung','Google'].map((b,i)=>{const ms=state.models.filter(m=>m.brand===b);const m=ms.find(m=>m.image)||ms[0];return `<button class="brand-card" data-brand="${b}"><span class="brand-name">${b}</span><span class="brand-count">${b==='Apple'?'iPhone':b==='Samsung'?'Galaxy':'Pixel'} repairs</span>${m?.image?`<span class="brand-art"><img src="${esc(m.image)}" alt="${esc(m.name)}" width="240" height="230"></span>`:`<span class="brand-placeholder">${b==='Samsung'?'Galaxy':'Pixel'}</span>`}<span class="choose">Choose your phone <span class="arrow-icon" aria-hidden="true"></span></span></button>`}).join('')+'</div><p class="help-line">Not sure which phone you have? <a target="_blank" rel="noopener" href="'+whatsapp('Hi Mobile Phonewala, can you help me identify my phone for a repair?')+'">Ask us on WhatsApp</a></p>';picker.querySelectorAll('[data-brand]').forEach(b=>b.onclick=()=>setBrand(b.dataset.brand))}
function renderModels(){picker.innerHTML=`<div class="picker-heading"><h3>Choose your ${state.brand==='Apple'?'iPhone':state.brand==='Samsung'?'Samsung':'Google Pixel'}</h3><label class="sr-only" for="model-search">Search your phone model</label><input class="model-search" id="model-search" type="search" placeholder="Search your model" autocomplete="off"></div><div class="model-grid" id="model-grid"></div><p class="help-line">Can’t find your phone? <a href="${whatsapp('Hi Mobile Phonewala, my phone is not listed. Can you help with a repair?')}" target="_blank" rel="noopener">Message us</a></p>`;fillModels('');picker.querySelector('input').oninput=e=>fillModels(e.target.value)}
function fillModels(query){const items=state.models.filter(m=>m.brand===state.brand&&m.name.toLowerCase().replace(/\s/g,'').includes(query.toLowerCase().replace(/\s/g,'')));document.querySelector('#model-grid').innerHTML=items.length?items.map(m=>`<button class="model-card ${m.image?'':'no-photo'}" data-model="${esc(m.id)}">${m.image?`<img src="${esc(m.image)}" alt="" width="140" height="120" loading="lazy">`:`<span class="model-family">${m.brand}</span>`}<span>${esc(m.name)}</span></button>`).join(''):'<p class="empty">No matching model. Try the model number, or message us below.</p>';picker.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>setModel(b.dataset.model))}
function renderRepairs(){const m=state.model;const sorted=[...m.repairs].sort((a,b)=>Object.keys(definitions).indexOf(a.id)-Object.keys(definitions).indexOf(b.id));picker.innerHTML=`<div class="repair-layout"><div class="device-preview"><p>YOUR PHONE</p>${m.image?`<img class="device-image" src="${esc(m.image)}" alt="${esc(m.name)}">`:`<div class="no-device-photo">${esc(m.brand)}</div>`}<h3>${esc(m.name)}</h3><p class="warranty">Final price confirmed in chat</p><button class="back-button" id="change-phone">Change phone</button></div><div class="repair-panel"><h3>What needs fixing?</h3><p class="subtext">Choose one or more repairs.</p><div class="repair-grid">${sorted.map((r,i)=>repairCard(r)+(i===Math.min(2,sorted.length-1)?screenChoices(m):'')).join('')}</div>${sorted.length?'':'<p class="empty">Tell us what needs fixing and we’ll confirm your repair price on WhatsApp.</p>'}<label class="diagnosis"><input type="checkbox" id="diagnosis" ${state.diagnosis?'checked':''}>Need another repair?</label><div class="summary" id="summary"></div></div></div>`;picker.querySelector('#change-phone').onclick=()=>{state.model=null;state.selected.clear();render()};picker.querySelectorAll('.repair-option input').forEach(el=>el.onchange=()=>{if(el.checked)state.selected.add(el.value);else state.selected.delete(el.value);if(el.value==='screen'){setScreenExpansion(el.checked)}updateSummary()});picker.querySelector('#diagnosis').onchange=e=>{state.diagnosis=e.target.checked;updateSummary()};bindScreenDropdown();updateSummary()}
function repairCard(r){
 const screen=r.id==='screen'&&r.options?.length;
 return `<div class="repair-card"><label class="repair-option"><input type="checkbox" value="${r.id}" ${state.selected.has(r.id)?'checked':''} aria-label="${definitions[r.id][0]}, ${priceLabel(r)}"><span class="repair-photo" data-repair-photo="${r.id}" style="background-position:${definitions[r.id][1]}"><span class="repair-check" aria-hidden="true">✓</span></span><span class="repair-name">${definitions[r.id][0]}</span>${screen?'':`<span class="repair-price">${priceLabel(r)}</span>`}</label>${screen?`<button type="button" class="screen-expand-button" aria-expanded="false" aria-controls="screen-options" aria-label="Choose screen type, ${priceLabel(r)}"><span class="screen-price-label">${priceLabel(r)}</span><span class="arrow-icon arrow-down" aria-hidden="true"></span></button>`:''}</div>`;
}
function screenChoices(model){
 const screen=model.repairs.find(r=>r.id==='screen');if(!screen?.options)return '';
 const images={'hard-oled':'hard','soft-oled':'soft',genuine:'genuine'};
 return `<div class="screen-expansion" id="screen-options" hidden><fieldset class="screen-options-inner"><legend>Choose your screen</legend><div class="screen-options-grid">${screen.options.map(o=>`<label class="screen-choice"><input type="radio" name="screen-type" value="${o.id}" ${state.screenOption===o.id?'checked':''} aria-label="${o.name} screen, ${priceLabel(o)}"><span class="screen-choice-photo"><img src="/shop-v2-assets/shared/assets/screen-${images[o.id]}.jpg" alt="${o.name} replacement display assembly" width="700" height="700"><span class="screen-choice-check" aria-hidden="true">✓</span></span><span class="screen-choice-name">${o.name}</span><strong>${priceLabel(o)}</strong></label>`).join('')}</div></fieldset></div>`;
}
let screenExpansionAnimation;
function setScreenExpansion(open){
 const panel=picker.querySelector('#screen-options');const button=picker.querySelector('.screen-expand-button');if(!panel||!button)return;
 const startHeight=panel.hidden?0:panel.getBoundingClientRect().height;
 screenExpansionAnimation?.cancel();button.setAttribute('aria-expanded',String(open));panel.hidden=false;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){panel.hidden=!open;return}
 const animation=panel.animate([{height:startHeight+'px',opacity:open?0:1},{height:(open?panel.scrollHeight:0)+'px',opacity:open?1:0}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
 screenExpansionAnimation=animation;
 animation.finished.then(()=>{if(screenExpansionAnimation===animation){panel.hidden=!open;animation.cancel();screenExpansionAnimation=null}},()=>{});
}
function bindScreenDropdown(){
 const panel=picker.querySelector('#screen-options');const button=picker.querySelector('.screen-expand-button');if(!panel)return;
 const screen=state.model.repairs.find(r=>r.id==='screen');
 button.onclick=()=>setScreenExpansion(button.getAttribute('aria-expanded')!=='true');
 panel.querySelectorAll('input').forEach(input=>input.onchange=()=>{
  state.screenOption=input.value;state.selected.add('screen');
  picker.querySelector('.repair-option input[value="screen"]').checked=true;
  const option=screen.options.find(o=>o.id===input.value);
  button.querySelector('.screen-price-label').textContent=priceLabel(option);
  button.setAttribute('aria-label',`${option.name} screen, ${priceLabel(option)}. Change screen type`);
  updateSummary();
 });
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){setScreenExpansion(false);button.focus()}});
}
function priceLabel(r){return r.pricePence==null?'Ask for a quote':r.pricePence===0?'Free':(r.priceFrom?'From ':'')+money(r.pricePence)}
function selectedRepair(r){const o=r.options?.find(o=>o.id===state.screenOption);return {...r,name:definitions[r.id][0]+(o?' — '+o.name:''),pricePence:o?o.pricePence:r.pricePence,priceFrom:o?!!o.priceFrom:!!r.priceFrom}}
function selectedTotal(){const selected=state.model.repairs.filter(r=>state.selected.has(r.id)).map(selectedRepair);return{selected,total:selected.reduce((a,r)=>a+(r.pricePence??0),0),from:selected.some(r=>r.priceFrom),quote:state.diagnosis||selected.some(r=>r.pricePence==null)}}
function totalPriceLabel({selected,total,from,quote}){if(quote&&total===0)return 'Ask for a quote';if(selected.length&&total===0)return 'Free';return (from?'From ':'')+money(total)+(quote?' + quote':'')}
function updateSummary(){
 const totals=selectedTotal();const {selected,total,from,quote}=totals;
 const has=selected.length||state.diagnosis;const totalLabel=totalPriceLabel(totals);
 let resetNote=document.querySelector('#reset-note');
 if(!resetNote){resetNote=document.createElement('p');resetNote.id='reset-note';resetNote.className='service-note';resetNote.textContent='A device reset can erase your data. Back up your phone first; we’ll confirm the reset with you before starting.';document.querySelector('#summary').before(resetNote)}
 resetNote.hidden=!state.selected.has('reset');
 const lines=selected.map(r=>`<div class="summary-line"><span>${r.name}</span><span>${priceLabel(r)}</span></div>`).join('');
 let msg=`Hi Mobile Phonewala, I'd like to book a repair for my ${state.model.name}.\n\n`;
 msg+=selected.map(r=>`${r.name}: ${priceLabel(r)}`).join('\n');
 if(state.diagnosis)msg+='\nOther repair: please advise.';
 if(selected.length)msg+=`\n\n${quote?'Priced repairs and quote requests':'Total'}: ${totalLabel}`;
 if(from||quote)msg+='\nPlease confirm the options and final price for the requested services.';
 msg+='\n\nPlease confirm availability and when I can bring it in.';
 document.querySelector('#summary').innerHTML=`<div class="summary-lines">${lines}${state.diagnosis?'<div class="summary-line"><span>Other repair</span><span>Ask for a quote</span></div>':''}</div><div class="summary-total"><span>${quote&&total>0?'Priced repairs':'Your total'}</span><strong>${totalLabel}</strong></div><a class="button orange book-button" ${has?`href="${whatsapp(msg)}" target="_blank" rel="noopener"`:'aria-disabled="true" tabindex="-1"'}>Book repair on WhatsApp</a><p class="booking-note">${has?(quote?'We’ll confirm the quote and availability in chat.':from?'Final screen price depends on your chosen screen option. We’ll confirm in chat.':'We’ll confirm your repair and availability in chat.'):'Choose a repair to continue.'}</p>`;
 announce(`${selected.length} repair${selected.length===1?'':'s'} selected. ${totalLabel}.`)
}
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{if(b.dataset.step==='brand'){state.brand=null;state.model=null;state.selected.clear()}else if(b.dataset.step==='model'){state.model=null;state.selected.clear()}render()});
fetch('catalogue.json?v=shops-1').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{state.models=d.models;render()}).catch(()=>{picker.innerHTML=`<p class="empty">The repair list couldn’t load. <button onclick="location.reload()">Try again</button>, or <a href="${whatsapp('Hi Mobile Phonewala, I would like to enquire about a phone repair.')}" target="_blank" rel="noopener">message us on WhatsApp</a>.</p>`;picker.setAttribute('aria-busy','false')});
const modelContext=document.modelContext;
if(modelContext?.registerTool){
 const register=tool=>{try{Promise.resolve(modelContext.registerTool(tool)).catch(()=>{})}catch{}};
 register({name:'get_repair_catalogue',description:'Read available phone models and repairs in the Mobile Phonewala picker.',inputSchema:{type:'object',properties:{brand:{type:'string',enum:['Apple','Samsung','Google']}},additionalProperties:false},annotations:{readOnlyHint:true},execute:input=>{if(input?.brand&&!['Apple','Samsung','Google'].includes(input.brand))throw Error('Unknown brand');return state.models.filter(m=>!input?.brand||m.brand===input.brand).map(m=>({id:m.id,brand:m.brand,name:m.name,repairs:m.repairs.map(r=>({id:r.id,name:definitions[r.id]?.[0],price:priceLabel(r),screenOptions:r.options}))}))}});
 register({name:'stage_repair_enquiry',description:'Select a phone and repairs in the visible picker. Does not open WhatsApp or send a message.',inputSchema:{type:'object',properties:{modelId:{type:'string'},repairIds:{type:'array',items:{type:'string'}},diagnosis:{type:'boolean'}},required:['modelId','repairIds'],additionalProperties:false},execute:input=>{const m=state.models.find(m=>m.id===input?.modelId);if(!m||!Array.isArray(input.repairIds)||input.repairIds.some(id=>!m.repairs.some(r=>r.id===id)))throw Error('Choose a listed model and valid repair IDs');state.model=m;state.brand=m.brand;state.screenOption=null;state.selected=new Set(input.repairIds);state.diagnosis=!!input.diagnosis;render();return{model:m.name,repairs:[...state.selected],total:totalPriceLabel(selectedTotal()),whatsappLink:document.querySelector('.book-button').getAttribute('href')}}});
}
// Offer a diagnostic assessment once per browser-tab session, five seconds after arrival.
const diagnosisDialog=document.querySelector('#diagnosis-dialog');
const diagnosisForm=document.querySelector('#diagnosis-form');
function diagnosisEnquiry(name,phone,email){return `Hi Mobile Phonewala, I'd like a diagnostic assessment for my phone.\n\nName: ${name.trim()}\nPhone: ${phone.trim()}\nEmail: ${email.trim()}\n\nPlease let me know when I can bring it in.`}
let diagnosisPreviouslyShown=false;
try{diagnosisPreviouslyShown=sessionStorage.getItem('mobile-phonewala-diagnosis-shown')==='1'}catch{}
if(!diagnosisPreviouslyShown)setTimeout(function showDiagnosis(){
 if(document.documentElement.classList.contains('intro-scroll-locked')||document.querySelector('.hero')?.dataset.scrollState==='playing'){setTimeout(showDiagnosis,750);return}
 diagnosisDialog.showModal();
 try{sessionStorage.setItem('mobile-phonewala-diagnosis-shown','1')}catch{}
},5000);
diagnosisDialog.querySelector('.diagnosis-close').onclick=()=>diagnosisDialog.close();
diagnosisDialog.addEventListener('click',e=>{if(e.target===diagnosisDialog){const r=diagnosisDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)diagnosisDialog.close()}});
diagnosisForm.addEventListener('submit',()=>{
 document.querySelector('#diagnosis-message').value=diagnosisEnquiry(document.querySelector('#diagnosis-name').value,document.querySelector('#diagnosis-phone').value,document.querySelector('#diagnosis-email').value);
 diagnosisDialog.close();
});
