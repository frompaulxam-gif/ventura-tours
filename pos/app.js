'use strict';
const $=s=>document.querySelector(s),money=p=>'£'+(p/100).toFixed(2),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),variant='a';
document.documentElement.dataset.style=['selected','walnut','jade','clay','impeccable','functional','functional-large'].includes(params.get('style'))?params.get('style'):'selected';
const names={a:'A · Guided',b:'B · Quick picker',c:'C · Table desk'};
let screen='tables',group='Food',category='',wineCategory='',table='1',selected=null,choice=null,setDraft=null,menuQuery='',categoryOpen=false,lastAddedId=null,feedbackTimer=null,toastTimer=null,pendingRemoval=null,historyLimit=50,pendingRestore=null,editorQuery='',editingProduct=null,pendingMove=null,tableView='map',mapZoom=1;
const key='thaiboran-billing-v1'+(params.has('test')?'-test':''),tableIds=[...Array.from({length:13},(_,i)=>String(i+1)).filter(id=>id!=='11'),...Array.from({length:5},(_,i)=>'F'+(i+1))],blank=()=>({lines:[],discount:{type:'none',value:0},serviceRate:10});
let bills=Object.fromEntries(tableIds.map(id=>[id,blank()])),storageProblem='';
try{const raw=localStorage.getItem(key);if(raw){const saved=JSON.parse(raw);if(!saved||tableIds.some(id=>!saved[id]))throw Error('Stored bills could not be read.');for(const id of tableIds){const b=saved[id];if(!Array.isArray(b.lines)||b.lines.some(l=>typeof l.name!=='string'||typeof l.option!=='string'||typeof l.sku!=='string'||l.quantity<1))throw Error('Invalid saved items.');BillingEngine.calculate(b,'afterDiscount')}bills=saved}}catch(e){storageProblem='Saved bills could not be loaded. Do not add orders until this is resolved.';}
const menuCatalog=MenuCatalog.create({storage:localStorage,key,base:JSON.parse(JSON.stringify(MENU))});
let menuProblem='';
try{MENU.splice(0,MENU.length,...menuCatalog.load())}catch{menuProblem='Saved menu changes could not be loaded. Reload before adding orders or editing prices.'}
const billHistory=BillHistory.create({storage:localStorage,key,tableIds,legacyTableIds:['11'],blank,calculate:BillingEngine.calculate});
const total=(n=table)=>BillingEngine.calculate(bills[n],'afterDiscount');
function save(){try{localStorage.setItem(key,JSON.stringify(bills));$('#save-status').textContent='Saved on this device'}catch{storageProblem='This browser could not save the bill. Keep this page open and copy your order.';$('#save-status').textContent=storageProblem;$('#save-status').classList.add('save-error')}}
function toast(s){clearTimeout(toastTimer);$('#toast').textContent=s;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),1700)}
const foodCats=[['Starters','starter'],['Mains','main'],['Soups','soup'],['Salads','salad'],['Rice & noodles','rice'],['Sides','side'],['Sauces','sauce'],['Desserts','dessert']];
const drinkCats=[['Soft drinks','drink'],['Beer & cider','rice'],['Cocktails','dessert'],['Wine','side'],['Spirits','starter'],['Mocktails','soup'],['Juices','salad'],['Tea & coffee','main'],['More drinks','special']];
const wineCats=[['White','white',['White wine']],['Rosé','rose',['Rosé wine']],['Red','red',['Red wine']],['Special','special',['Sparkling wine']],['Other','other',[]]];
const wineProducts=name=>{const entry=wineCats.find(([label])=>label===name);return MENU.filter(p=>p.group==='Wine'&&(name==='Other'?!wineCats.filter(([label])=>label!=='Other').some(([, ,sections])=>sections.includes(p.section)):entry?.[2].includes(p.section)))};
const sections={'Set menu':['Set menus'],Starters:['Starters','Vegetarian starters'],Mains:['Curries','Stir fried','Signature dishes'],Soups:['Soups'],Salads:['Salads'],'Rice & noodles':['Rice & noodles'],Sides:['Side dishes','Extra sides'],Sauces:['Extra sauces'],Desserts:['Desserts'],'Soft drinks':['Soft drinks'],'Beer & cider':['Beer & cider','Alcohol-free beer & cider'],Cocktails:['Cocktails'],Wine:['Red wine','White wine','Rosé wine','Sparkling wine'],Spirits:['Spirits, liqueurs & brandy','Shots'],Mocktails:['Mocktails'],Juices:['Fruit juice'],'Tea & coffee':['Hot drinks','Coffee liqueurs'],'More drinks':['Thai iced drinks','Iced tea','Kid’s drinks','Drink modifiers']};
function tile(label,cls,act,sub=''){return `<button class="tile ${cls}" data-action="${act}" data-value="${esc(label)}"><span class="tile-name">${esc(label)}</span>${sub?`<span class="tile-sub">${sub}</span>`:''}</button>`}
const navIcons={menu:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',bill:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 7h6M9 11h6M9 15h3"/>',tables:'<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 3v3M17 3v3M7 18v3M17 18v3"/>',history:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/>'};
function nav(){const links=[['menu',navIcons.menu,'Menu'],['bill',navIcons.bill,'Bill'],['tables',navIcons.tables,'Tables'],['history',navIcons.history,'History']];$('#nav').innerHTML=links.map(([id,icon,label])=>`<button class="nav-link ${(screen===id||(screen==='editor'&&id==='menu'))?'active':''}" data-action="${id}"><svg class="nav-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>${label}</button>`).join('')}
function render(){document.body.className='variant-'+variant+' screen-'+screen;$('#save-status').textContent=storageProblem||'Saved on this device';if(storageProblem)$('#save-status').classList.add('save-error');$('#table-name').textContent='Table '+table;nav();$('#dock').innerHTML='';if(screen==='tables')renderTables();else if(screen==='bill')renderBill();else if(screen==='history')renderHistory();else if(screen==='editor')renderEditor();else renderMenu();}
const floorTables=[['1',43,83],['2',43,143],['3',43,201],['4',108,83],['5',108,143],['6',173,143],['7',231,143],['8',173,83],['9',289,83],['10',289,143],['12',173,213],['13',231,213],['F1',229,399],['F2',181,399],['F3',133,399],['F4',85,399],['F5',37,399]];
function floorMap(){return `<div class="map-toolbar"><span>Tap a table to open</span><div class="map-zoom" aria-label="Map zoom"><button data-action="map-zoom" data-value="out" aria-label="Zoom out" ${mapZoom===1?'disabled':''}>−</button><button data-action="map-zoom" data-value="fit" aria-label="Fit map">Fit</button><button data-action="map-zoom" data-value="in" aria-label="Zoom in" ${mapZoom===2?'disabled':''}>+</button></div></div><div class="floor-scroll" tabindex="0" role="region" aria-label="Restaurant floor map; scroll to pan when zoomed"><div class="floor-plan" style="width:${mapZoom*100}%"><svg class="floor-drawing" viewBox="0 0 360 444" aria-hidden="true">
 <path class="room-fill" d="M8 24H276V49H315V24H351V430H8Z"/>
 <rect class="facility-fill" x="129" y="253" width="122" height="50" rx="3"/><rect class="facility-fill" x="317" y="350" width="28" height="73" rx="2"/>
 <path class="floor-wall" d="M8 225V24H276V49H315V190 M351 24V430H302V346H320 M340 346H351 M8 225H56V244 M120 225V244H258V310 M8 310H148 M180 310H280 M330 310H351 M8 310V430H259V377 M302 377V430"/>
 <path class="floor-opening" d="M56 244H120 M280 310H330 M259 430H302 M259 377H302 M320 346H340"/>
 <path class="floor-detail" d="M321 111H341 M321 126H341 M321 141H341 M321 156H341 M321 171H341 M148 310V279 Q179 279 180 310"/>
 <text class="floor-label" x="154" y="49" text-anchor="middle">DINING</text><text class="floor-label" x="190" y="282" text-anchor="middle">TOILETS</text><text class="floor-label" x="329" y="386" text-anchor="middle" transform="rotate(90 329 386)">BAR</text><text class="floor-label" x="131" y="352" text-anchor="middle">FRONT</text><text class="floor-label entry-label" x="281" y="415" text-anchor="middle">ENTRY</text>
 </svg>${floorTables.map(([id,x,y])=>{const t=total(id),occupied=t.quantity>0;return `<button class="map-table ${occupied?'occupied':'available'} ${id.startsWith('F')?'round-table':''} ${id===table?'current':''}" style="left:${x/360*100}%;top:${y/444*100}%" data-action="table" data-value="${id}" aria-label="Table ${id}, ${occupied?'in use, '+t.quantity+(t.quantity===1?' item, ':' items, ')+money(t.total):'available'}"><strong>${id}</strong><small>${occupied?'In use':'Free'}</small></button>`}).join('')}</div></div><p class="map-help">Use + for a closer view, then swipe to move around.</p>`}
function renderTables(){
 const open=tableIds.filter(id=>bills[id].lines.length).length;
 $('#main').innerHTML=`<div class="heading-row"><div><div class="eyebrow">YOUR TABLES</div><h1>Choose a table</h1><p class="intro">${open} in use · ${tableIds.length-open} available</p></div></div><div class="floor-controls"><div class="view-toggle" aria-label="Table view"><button data-action="table-view" data-value="map" aria-pressed="${tableView==='map'}">Map</button><button data-action="table-view" data-value="grid" aria-pressed="${tableView==='grid'}">Grid</button></div><div class="map-legend"><span><i class="legend-free"></i>Available</span><span><i class="legend-used"></i>In use</span></div></div>${tableView==='map'?floorMap():`<div class="table-list">${tableIds.map(n=>{const t=total(n);return `<button class="table-card ${t.quantity?'occupied':''} ${n===table?'active':''}" data-action="table" data-value="${n}"><span class="table-label">TABLE</span><strong>${n}</strong><small>${t.quantity?t.quantity+(t.quantity===1?' item':' items'):'Available'}</small><span class="table-amount">${t.quantity?money(t.total):'—'}</span></button>`}).join('')}</div>`}${bills['11']?.lines.length?'<div class="legacy-table-note"><p>An older Table 11 bill is still saved.</p><button class="small-btn" data-action="legacy-table">Review saved bill</button></div>':''}<p class="quiet floor-footnote">17 tables · 1–10, 12–13 and F1–F5<br>Bills stay saved until paid or cleared.</p>`;
}
function zoomMap(value){
 const scroller=$('.floor-scroll'),plan=$('.floor-plan'),oldWidth=plan.offsetWidth,centreX=(scroller.scrollLeft+scroller.clientWidth/2)/oldWidth,centreY=(scroller.scrollTop+scroller.clientHeight/2)/plan.offsetHeight;
 mapZoom=value==='fit'?1:Math.max(1,Math.min(2,mapZoom+(value==='in'?.5:-.5)));plan.style.width=mapZoom*100+'%';
 scroller.scrollLeft=mapZoom===1?0:centreX*plan.offsetWidth-scroller.clientWidth/2;scroller.scrollTop=mapZoom===1?0:centreY*plan.offsetHeight-scroller.clientHeight/2;
 $('[data-value="out"]').disabled=mapZoom===1;$('[data-value="in"]').disabled=mapZoom===2;
}
const normaliseSearch=MenuSearch.normalise;
const makeSearchIndex=()=>MenuSearch.createIndex(MENU);
let menuSearchIndex=makeSearchIndex(),searchMatches=[],searchSuggestionsOpen=false,searchSuggestionIndex=-1;
function renderMenu(){
 searchSuggestionsOpen=false;searchSuggestionIndex=-1;
 $('#main').innerHTML=`<div class="heading-row"><div><div class="eyebrow">TABLE ${table}</div><h1 id="menu-title">${category||'Add to the order'}</h1><p class="intro">Search the menu or browse the categories.</p></div></div><div class="menu-tools"><button class="text-btn install-link" data-action="install-app">Add to Home Screen</button><button class="small-btn" data-action="edit-menu">Edit menu & prices</button></div><div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 5 5"></path></svg><input class="search" id="menu-search" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="menu-suggestions" aria-expanded="false" aria-label="Search food and drinks" placeholder="Search dishes, drinks or menu no." value="${esc(menuQuery)}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100" enterkeyhint="search"><button class="search-clear" data-action="clear-search" aria-label="Clear search" ${menuQuery?'':'hidden'}>×</button><div class="search-suggestions" id="search-suggestions" hidden><div id="menu-suggestions" role="listbox" aria-label="Menu suggestions"></div><button type="button" class="search-all" data-action="show-search-results"></button></div></div><div id="menu-browse">${category?`<button class="small-btn" data-action="back">‹ ${wineCategory?'Back to Wine':'Back to categories'}</button>`:`<div class="tile-grid top-tiles">${tile('Food','food'+(group==='Food'?' chosen':''),'group','Starters, mains & more')}${tile('Drinks','drinks'+(group==='Drinks'?' chosen':''),'group','Soft drinks, wine & more')}${tile('Set menu','set-menu-tile','category','Lunch £14 · Early Bird £18')}</div>`}</div><div id="search-status" class="section-caption" role="status" aria-live="polite" aria-atomic="true"></div><div id="menu-content"></div>`;
 renderMenuContent();dock();
}
function itemGrid(products){return `<div class="tile-grid products">${products.map(p=>{
 const prices=p.variants.map(v=>v.price_pence),min=Math.min(...prices),max=Math.max(...prices),single=p.variants.length===1,serving=single&&p.variants[0].option!=='Standard'?p.variants[0].option:'',lines=bills[table].lines.filter(l=>p.variants.some(v=>v.sku===l.sku));
 return `<article class="tile item product-card ${p.setMenu?'set-menu-card ':''}${lastAddedId===p.id?'just-added':''}"><button class="item-main" data-action="product" data-value="${p.id}" aria-label="${esc(p.name+(serving?' ('+serving+')':'')+' · '+(min!==max?'From ':'')+money(min))}">${p.menu_number?`<span class="item-no">${p.menu_number}</span>`:''}<span class="tile-name">${esc(p.name)}</span>${serving?`<span class="item-serving">(${esc(serving)})</span>`:''}<span class="tile-sub">${p.setMenu?'Choose options · ':min!==max?'From ':''}${money(min)}</span></button>${lines.map(l=>`<div class="card-line">${(!single||lines.some(line=>line.unitPrice!==min))?`<div class="card-option">${esc(l.option)}<span>${money(l.unitPrice)} each</span></div>`:''}<div class="card-quantity"><button data-action="minus" data-value="${esc(l.key||l.sku)}" aria-label="Remove one ${esc(p.name+' · '+l.option)}">−</button><output aria-label="Quantity of ${esc(p.name+' · '+l.option)}">${l.quantity}</output><button data-action="plus" data-value="${esc(l.key||l.sku)}" aria-label="Add one ${esc(p.name+' · '+l.option)}" ${l.quantity>=999?'disabled':''}>+</button></div></div>`).join('')}</article>`
 }).join('')}</div>`}
function renderMenuContent(){
 const query=normaliseSearch(menuQuery),searching=menuQuery.trim().length>0;
 $('#menu-browse').hidden=searching;$('#menu-title').textContent=searching?'Search menu':wineCategory?(wineCategory==='Special'||wineCategory==='Other'?wineCategory+' wines':wineCategory+' wine'):category||'Add to the order';$('.search-clear').hidden=!menuQuery;
 if(searching){searchMatches=MenuSearch.find(menuSearchIndex,query);const approximate=searchMatches.some(match=>match.approximate);$('#search-status').textContent=`${searchMatches.length} ${searchMatches.length===1?'match':'matches'} across food & drinks${approximate?' · Includes similar spellings':''}`;$('#menu-content').innerHTML=searchMatches.length?itemGrid(searchMatches.map(match=>match.product)):'<div class="empty"><h2>No matches</h2><p>Try a dish name, drink, ingredient option or menu number.</p><button class="small-btn" data-action="clear-search">Clear search</button></div>';}
 else if(category==='Wine'){
  if(wineCategory){const products=wineProducts(wineCategory);$('#search-status').textContent=wineCategory==='Special'?'Sparkling wines · Tap to choose a serving.':'Tap to add. Wines with choices will ask for a serving.';$('#menu-content').innerHTML=products.length?itemGrid(products):'<div class="empty"><h2>No other wines yet</h2><p>All current wines are in White, Rosé, Red or Special.</p><button class="small-btn" data-action="back">Browse wine categories</button></div>';}
  else{$('#search-status').textContent='Choose a wine category';$('#menu-content').innerHTML=`<div class="tile-grid categories wine-categories">${wineCats.map(([name,colour])=>{const count=wineProducts(name).length;return tile(name,'wine-'+colour,'wine-category',name==='Special'?'Sparkling · '+count:count+' '+(count===1?'wine':'wines'))}).join('')}</div>`;}
 }
 else if(category){$('#search-status').textContent='Tap to add. Dishes with choices will ask for an option.';$('#menu-content').innerHTML=itemGrid(MENU.filter(p=>(sections[category]||[]).includes(p.section)));}
 else if(categoryOpen){$('#search-status').textContent=group+' categories';$('#menu-content').innerHTML=`<div class="tile-grid categories">${(group==='Food'?foodCats:drinkCats).map(([name,colour])=>tile(name,'tile-'+colour,'category')).join('')}</div>`;}
 else{$('#search-status').textContent='';$('#menu-content').innerHTML='';}
 if(!searching)searchMatches=[];
 renderSearchSuggestions();
}
function addedFeedback(){
 const button=Array.from(document.querySelectorAll('[data-action="product"]')).find(el=>el.dataset.value===lastAddedId);
 if(button)button.focus({preventScroll:true});
 $('.bill-dock')?.classList.add('bill-updated');
 clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{lastAddedId=null;document.querySelectorAll('.just-added,.bill-updated').forEach(el=>el.classList.remove('just-added','bill-updated'))},1400);
}
function renderSearchSuggestions(){
 const input=$('#menu-search'),popup=$('#search-suggestions'),list=$('#menu-suggestions');if(!input||!popup)return;
 const matches=searchMatches.slice(0,8),open=searchSuggestionsOpen&&matches.length>0;
 popup.hidden=!open;input.setAttribute('aria-expanded',String(open));input.removeAttribute('aria-activedescendant');$('#menu-content').hidden=open;
 if(!open){list.innerHTML='';searchSuggestionIndex=-1;return}
 list.innerHTML=matches.map(({product:p,approximate},index)=>{const prices=p.variants.map(v=>v.price_pence),min=Math.min(...prices),max=Math.max(...prices),single=p.variants.length===1,serving=single&&p.variants[0].option!=='Standard'?' · '+p.variants[0].option:'';
 return `<button type="button" role="option" aria-selected="false" tabindex="-1" class="search-suggestion" id="menu-suggestion-${index}" data-action="search-product" data-value="${esc(p.id)}"><span><strong>${esc(p.name)}</strong><small>${approximate?'Similar spelling · ':''}${esc(p.section+serving)}</small></span><span class="suggestion-price">${min!==max?'From ':''}${money(min)}<small>${p.setMenu?'Choose set':single?'Tap to add':'Choose option'}</small></span></button>`}).join('');
 $('.search-all').textContent=`View ${searchMatches.length===1?'1 match':'all '+searchMatches.length+' matches'}`;
 selectSearchSuggestion(searchSuggestionIndex);
}
function selectSearchSuggestion(index){
 const options=[...document.querySelectorAll('.search-suggestion')];searchSuggestionIndex=index>=0&&index<options.length?index:-1;
 options.forEach((option,i)=>option.setAttribute('aria-selected',String(i===searchSuggestionIndex)));
 const input=$('#menu-search');if(searchSuggestionIndex<0){input?.removeAttribute('aria-activedescendant');return}
 input.setAttribute('aria-activedescendant',options[searchSuggestionIndex].id);options[searchSuggestionIndex].scrollIntoView({block:'nearest'});
}
function closeSearchSuggestions(){searchSuggestionsOpen=false;searchSuggestionIndex=-1;renderSearchSuggestions()}
function chooseSearchProduct(id){closeSearchSuggestions();$('#menu-search')?.blur();product(id)}
document.addEventListener('input',event=>{if(event.target.id==='menu-search'){menuQuery=event.target.value;searchSuggestionsOpen=true;searchSuggestionIndex=-1;renderMenuContent()}if(event.target.id==='editor-search'){editorQuery=event.target.value;renderEditorList()}});
document.addEventListener('change',event=>{if(event.target.matches('[data-set-field]'))updateSetMenuSheet()});
document.addEventListener('focusin',event=>{if(event.target.id==='menu-search'){searchSuggestionsOpen=true;searchSuggestionIndex=-1;renderMenuContent()}});
document.addEventListener('focusout',event=>{if(event.target.closest('.search-wrap')&&!event.relatedTarget?.closest('.search-wrap'))closeSearchSuggestions()});
document.addEventListener('pointerdown',event=>{if(event.target.closest('.search-suggestion'))event.preventDefault();else if(!event.target.closest('.search-wrap'))closeSearchSuggestions()});
document.addEventListener('keydown',event=>{
 if(event.target.id!=='menu-search'||event.isComposing)return;
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
  if(!searchMatches.length)return;event.preventDefault();
  const count=Math.min(searchMatches.length,8);if(!searchSuggestionsOpen){searchSuggestionsOpen=true;renderSearchSuggestions()}
  selectSearchSuggestion(event.key==='ArrowDown'?(searchSuggestionIndex+1)%count:(searchSuggestionIndex<0?count-1:(searchSuggestionIndex-1+count)%count));
 }else if(event.key==='Enter'){
  event.preventDefault();if(searchSuggestionsOpen&&searchSuggestionIndex>=0){const match=searchMatches[searchSuggestionIndex];if(match)chooseSearchProduct(match.product.id)}else{closeSearchSuggestions();event.target.blur()}
 }else if(event.key==='Escape'){
  event.preventDefault();if(event.target.getAttribute('aria-expanded')==='true')closeSearchSuggestions();else{menuQuery='';event.target.value='';renderMenuContent()}
 }
});
function serviceExempt(b,t){return t.serviceRate===10&&b.lines.some(line=>line.serviceExempt)}
function dock(){let t=total(),b=bills[table],exempt=serviceExempt(b,t);$('#dock').innerHTML=`<button class="bill-dock" data-action="bill"><span class="dock-label"><strong>${t.quantity} ${t.quantity===1?'item':'items'} · View bill</strong><small>${b.discount.type==='cash'?(t.serviceRate===0?'10% cash discount · No service':exempt?'Lunch exempt · 10% cash discount':'10% service, then 10% cash discount'):t.serviceRate===0?'No service charge':exempt?(t.service===0?'Lunch menu · No service charge':'Lunch exempt · service on other items'):b.discount.type==='none'?'Includes 10% service':'After discount + 10% service'}</small></span><span class="dock-total">${money(t.total)} →</span></button>`}
function totalsMarkup(b,t,showNote=false){
 const d=b.discount,cash=d.type==='cash',exempt=serviceExempt(b,t),serviceLabel=t.serviceRate===0?'Service charge · removed':exempt?(t.service===0?'Service charge · lunch exempt':'Service charge · lunch items exempt'):'Service charge · 10%';
 return `<div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>${t.discount?`<div class="sum-row discount"><span>Discount${d.type==='percent'?' · '+d.value/100+'%':''}</span><span>−${money(t.discount)}</span></div><div class="sum-row"><span>After discount</span><span>${money(t.net)}</span></div>`:''}<div class="sum-row"><span>${serviceLabel}</span><span>${money(t.service)}</span></div>${cash?`<div class="sum-row"><span>Before cash discount</span><span>${money(t.beforeCash)}</span></div><div class="sum-row discount"><span>Cash discount · 10%</span><span>−${money(t.cashDiscount)}</span></div>`:''}<div class="sum-row grand"><span>Total</span><span>${money(t.total)}</span></div>${showNote?`<p class="service-note">${cash?(t.serviceRate===0?'Cash discount applies to the subtotal. No service charge added.':exempt?'Lunch menu is exempt; cash discount applies after any service on other items.':'Cash discount applies after the service charge.'):(t.serviceRate===0?'No service charge has been added.':exempt?(t.service===0?'Lunch menu items are exempt from service charge.':'Lunch menu items are exempt; service applies to other items.'):'Service is calculated after the discount.')}</p>`:''}`;
}
function renderBill(){let b=bills[table],t=total(),d=b.discount,exempt=serviceExempt(b,t);$('#main').innerHTML=`<div class="bill-layout"><div class="heading-row"><div><div class="eyebrow">TABLE ${table}</div><h1>${variant==='b'?'Check the bill':'Your bill'}</h1></div><button class="small-btn" data-action="menu">+ Items</button></div><section class="receipt"><div class="receipt-heading"><span class="restaurant">THAI BORAN</span><p>Table ${table} · ${t.quantity} ${t.quantity===1?'item':'items'} · Dine-in</p></div>${b.lines.map((l,i)=>`<div class="receipt-line"><div class="line-top"><div><div class="line-name">${esc(l.name)}</div><div class="line-option">${esc(l.option)} · ${money(l.unitPrice)} each</div></div><strong class="line-total">${money(l.unitPrice*l.quantity)}</strong></div><div class="stepper"><button data-action="minus" data-value="${esc(l.key||l.sku)}" aria-label="Remove one ${esc(l.name)}">−</button><output>${l.quantity}</output><button data-action="plus" data-value="${esc(l.key||l.sku)}" aria-label="Add one ${esc(l.name)}">+</button></div></div>`).join('')||'<p class="quiet">No items yet. Tap + Items to start.</p>'}<div class="totals">${totalsMarkup(b,t,true)}</div></section><div class="bill-controls"><div class="discount-panel"><h2>Discount</h2><div class="chips">${[['none',0,'None'],['cash',1000,'Cash 10%'],['percent',1500,'15%']].map(([type,v,s])=>`<button class="chip ${d.type===type&&d.value===v?'selected':''}" data-action="discount" data-type="${type}" data-value="${v}">${s}</button>`).join('')}<button class="chip ${d.type!=='none'&&d.type!=='cash'&&!(d.type==='percent'&&d.value===1500)?'selected':''}" data-action="custom">Custom</button></div></div><section class="service-panel" aria-label="Service charge"><button type="button" class="service-switch" role="switch" aria-label="10% service charge" aria-checked="${t.serviceRate===10}" data-action="toggle-service"><span class="service-switch-copy"><strong>Service charge · 10%</strong><small>${t.serviceRate===0?'Off · No service charge':exempt?(t.service===0?'Lunch menu exempt · '+money(t.service):'Lunch exempt · service on other items · '+money(t.service)):d.type==='cash'?'Added before cash discount · '+money(t.service):'Added after discount · '+money(t.service)}</small></span><span class="switch-track" aria-hidden="true"><span></span></span></button></section><div class="bill-actions"><button class="wide-btn" data-action="customer">Show customer bill</button><button class="wide-btn move-button" data-action="move-table" ${b.lines.length?'':'disabled'}>Move to another table</button><button class="wide-btn primary paid-button" data-action="paid" ${b.lines.length?'':'disabled'}><span class="pay-symbol" aria-hidden="true">£</span> Mark as paid</button></div><div class="void-zone"><button class="wide-btn void-button" data-action="void" ${b.lines.length?'':'disabled'}>Void bill</button><p>Cancelled or entered by mistake? Keep a record in History.</p></div><button class="text-btn danger" data-action="clear">Clear Table ${table}</button></div></div>`}
function openSheet(html){$('#sheet').innerHTML=`<div class="sheet-inner">${html}</div>`;$('#sheet').showModal()}
function header(title){return `<div class="sheet-header"><h2>${esc(title)}</h2><button class="close-btn" data-action="close" aria-label="Close">×</button></div>`}
function product(id){
 selected=MENU.find(p=>p.id===id);if(!selected)return;
 if(selected.setMenu){openSetMenu(selected);return}
 if(selected.variants.length===1){addItem(selected,selected.variants[0]);return}
 choice=null;openSheet(header(selected.name)+`<p class="sheet-desc">${esc(selected.description||'Choose a size or serving.')}</p><div class="choice-grid">${selected.variants.map((v,i)=>`<button class="choice" data-action="choose" data-value="${i}"><span>${esc(v.option)}</span><small>${money(v.price_pence)}</small></button>`).join('')}</div><button class="wide-btn primary" id="add-choice" data-action="add" disabled>Choose an option</button>`)
}
function setChoiceText(item){
 if(typeof item==='string')return item;
 if(Array.isArray(item))item={name:item[0],delta:item[1]};
 const detail=item.detail?` (${item.detail})`:'';
 const delta=item.delta?` (+${money(item.delta)})`:'';
 const portion=item.portion?` (${item.portion})`:'';
 return item.name+portion+detail+delta;
}
function setSelect(id,label,items,placeholder='Choose an option',required=true){
 const values=items.map((item,i)=>`<option value="${i}">${esc(setChoiceText(item))}</option>`).join('');
 return `<label class="form-field set-field" for="set-${id}">${esc(label)}${required?' <span class="required-mark">*</span>':''}<select class="standalone-input" id="set-${id}" data-set-field="${id}">${placeholder?`<option value="">${esc(placeholder)}</option>`:''}${values}</select></label>`;
}
function setValue(id){const el=$(`#set-${id}`);return el?el.value:''}
function selectedSetItem(items,id){const value=setValue(id);return value===''?null:items[Number(value)]}
function setPriceSummary(){
 const p=selected,set=p?.setMenu;if(!set)return null;
 const sauceItems=set.sauces;
 const values=Object.fromEntries(SetMenuBuilder.fields.map(field=>[field,setValue(field)]));
 try{const quote=SetMenuBuilder.quote(p,values);return {ready:quote.ready,total:quote.total,selections:quote.selections,extras:quote.total-p.variants[0].price_pence,quote}}catch{return {ready:false,total:p.variants[0].price_pence,selections:[],extras:0};}
}
function updateSetMenuSheet(){
 const set=selected?.setMenu;if(!set)return;
 const summary=setPriceSummary(),totalEl=$('#set-total'),summaryEl=$('#set-summary'),add=$('#add-set');
 if(totalEl)totalEl.textContent=money(summary.total);
 if(summaryEl)summaryEl.textContent=summary.selections.length?summary.selections.join(' · '):'Choose the required options to build this set menu.';
 if(add){add.disabled=!summary.ready;add.textContent=summary.ready?`Add to Table ${table} · ${money(summary.total)}`:'Choose the required options';}
}
function openSetMenu(p){
 const set=p.setMenu;setDraft=p.id;
 const drinkItems=set.drinks.map(item=>({...item,delta:set.kind==='early'?250:0}));
 const sideItems=set.kind==='early'?[{name:'Jasmine rice'},{name:'Chips'},{name:'Sticky rice',delta:100},{name:'Egg fried rice',delta:100},{name:'Egg fried noodles',delta:100}]:[];
 set.sides=sideItems;set.drinks=drinkItems;
 const sauceItems=[{name:'No extra sauce',delta:0},...set.sauces];
 const spiceItems=set.spice||[];
 openSheet(header(set.name)+`<p class="sheet-desc">${esc(set.subtitle)}</p><p class="set-menu-notice">${esc(set.notice)}</p><div class="set-menu-form">${setSelect('starter','Starter',set.starters)}${setSelect('main','Main course',set.mains)}${setSelect('protein','Protein',set.proteins)}${set.kind==='early'?setSelect('side','Side',sideItems):''}${setSelect('drink',set.kind==='lunch'?'Soft drink':'Drink (optional)',drinkItems,set.kind==='lunch'?'Choose a drink':'No drink',set.kind==='lunch')}${setSelect('sauce','Extra sauce (optional)',sauceItems,'No extra sauce',false)}${spiceItems.length?setSelect('spice','Spice level',spiceItems,'Mild',false):''}</div><div class="set-menu-total"><span>Menu total</span><strong id="set-total">${money(p.variants[0].price_pence)}</strong></div><p class="set-menu-summary" id="set-summary">Choose the required options to build this set menu.</p><p class="form-error" id="set-error" role="alert"></p><button class="wide-btn primary" id="add-set" data-action="add-set" disabled>Choose the required options</button>`);
 updateSetMenuSheet();
}
function addSetMenu(){
 const p=selected,set=p?.setMenu,summary=setPriceSummary();if(!p||!set||!summary?.ready){$('#set-error').textContent='Choose each required option before adding this set menu.';return}
 const quote=summary.quote||SetMenuBuilder.quote(p,Object.fromEntries(SetMenuBuilder.fields.map(field=>[field,setValue(field)])),true);
 addItem(p,{sku:quote.sku,option:quote.option,price_pence:quote.total});
}
function refreshOrder(){if(screen==='menu'){renderMenuContent();dock()}else render();}
function addItem(p,v){
 if(storageProblem||menuProblem){toast(storageProblem||menuProblem);return}
 const line=bills[table].lines.find(l=>l.sku===v.sku&&l.unitPrice===v.price_pence);
 if(line&&line.quantity>=999){toast('Maximum quantity reached');return}
 if(line)line.quantity++;else bills[table].lines.push({key:v.sku+'@'+v.price_pence,sku:v.sku,name:p.name,option:v.option,unitPrice:v.price_pence,quantity:1,serviceExempt:Boolean(p.setMenu?.serviceExempt)});
 save();if($('#sheet').open)$('#sheet').close();lastAddedId=p.id;refreshOrder();addedFeedback();toast('✓ '+p.name+' added to Table '+table);
}
function changeQuantity(lineKey,delta){
 if(storageProblem){toast(storageProblem);return}
 const line=bills[table].lines.find(l=>(l.key||l.sku)===lineKey);if(!line)return;
 if(delta<0&&line.quantity===1){pendingRemoval={table,lineKey};openSheet(header('Remove this item?')+`<p class="sheet-desc">Remove ${esc(line.name)} (${esc(line.option)}) from Table ${esc(table)}?</p><div class="modal-actions"><button class="wide-btn" data-action="close">Keep item</button><button class="wide-btn danger" data-action="confirm-remove">Remove item</button></div>`);return}
 if(delta>0&&line.quantity>=999){toast('Maximum quantity reached');return}
 line.quantity+=delta;save();const p=MENU.find(p=>p.variants.some(v=>v.sku===line.sku));lastAddedId=delta>0?p?.id:null;refreshOrder();
 if(delta>0){addedFeedback();toast('✓ '+line.name+' added to Table '+table)}
 else{const control=Array.from(document.querySelectorAll('[data-action="minus"]')).find(el=>el.dataset.value===lineKey);control?.focus({preventScroll:true})}
}
function confirmRemoval(){
 if(storageProblem){toast(storageProblem);return}
 const pending=pendingRemoval;pendingRemoval=null;
 if(!pending||pending.table!==table){$('#sheet').close();return}
 const index=bills[table].lines.findIndex(l=>(l.key||l.sku)===pending.lineKey),line=bills[table].lines[index];
 if(!line||line.quantity!==1){$('#sheet').close();toast('The order changed. Please check the quantity.');return}
 bills[table].lines.splice(index,1);save();$('#sheet').close();lastAddedId=null;refreshOrder();toast(line.name+' removed');
}
function receiptBody(b,t,tableLabel,kind='Dine-in bill',detail=''){return `<div class="receipt-preview"><h2>THAI BORAN</h2><div class="receipt-meta">${esc(kind)} · Table ${esc(tableLabel)}${detail?'<br>'+esc(detail):''}</div><table class="receipt-table"><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Amount</th></tr></thead><tbody>${b.lines.map(l=>`<tr><td>${esc(l.name)}<div class="bill-item-option">${esc(l.option)} · ${money(l.unitPrice)} each</div></td><td class="right">${l.quantity}</td><td class="right">${money(l.unitPrice*l.quantity)}</td></tr>`).join('')}</tbody></table>${totalsMarkup(b,t)}<p class="receipt-thanks">Thank you for dining with us.</p></div>`}
function printControls(action,id='',disabled=false){return `<button class="wide-btn primary" data-action="${action}" data-value="${esc(id)}" ${disabled?'disabled':''}>${action==='print-history'?'Print saved bill':'Print bill'}</button><p class="print-hint">Opens Epson TM Print Assistant on iPad or iPhone. Printing keeps this bill saved.</p><button class="text-btn print-alternative" data-action="${action}-system" data-value="${esc(id)}" ${disabled?'disabled':''}>Other printer / PDF</button>`}
function customer(){openSheet(header('Table '+table)+receiptBody(bills[table],total(),table)+printControls('print-current','',!bills[table].lines.length))}
function printBill(b,t,tableLabel,kind='Dine-in bill',detail='',system=false,note=''){
 if(!b.lines.length){toast('Add an item before printing.');return}
 if(!system){
  try{window.location.href=EpsonPrinter.billUrl(b,t,{tableId:tableLabel,kind,detail:detail||historyDate(new Date().toISOString()),note,noteLabel:kind==='Voided bill'?'Void reason / note':'Reference / note'},location.origin+location.pathname)}catch(e){toast(e.message)}
  return;
 }
 const target=$('#print-receipt');
 target.innerHTML=receiptBody(b,t,tableLabel,kind,detail);
 window.print();
}
function printCurrent(system=false){printBill(bills[table],total(),table,'Dine-in bill','',system)}
function printHistory(id,system=false){
 try{const entry=billHistory.read().find(e=>e.id===id);if(!entry)throw Error('Saved bill not found.');printBill(entry.bill,entry.totals,entry.tableId,entry.status==='paid'?'Paid receipt':entry.status==='void'?'Voided bill':'Cleared bill',historyDate(entry.savedAt),system,entry.note||'')}catch(e){toast(e.message)}
}
function historyDate(value){return new Date(value).toLocaleString('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'short'})}
function serviceDateLabel(value){return new Date(value+'T12:00:00.000Z').toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'long',day:'numeric',month:'short',year:'numeric'})}
const historyStatus=entry=>entry.status==='paid'?'Paid':entry.status==='void'?'Voided':'Cleared';
function historyRow(entry){return `<button class="history-row" data-action="history-entry" data-value="${esc(entry.id)}"><span><strong>Table ${esc(entry.tableId)} <span class="bill-status ${entry.status==='paid'?'is-paid':entry.status==='void'?'is-void':''}">${historyStatus(entry)}</span></strong><small>${esc(historyDate(entry.savedAt))}</small><small>${entry.totals.quantity} ${entry.totals.quantity===1?'item':'items'}</small>${entry.note?`<small class="history-reference">Ref / note: ${esc(entry.note)}</small>`:''}</span><span class="history-total">${money(entry.totals.total)} <span aria-hidden="true">›</span></span></button>`}
function dayTotalMarkup(summary){
 const counts=[summary.paidCount+' paid '+(summary.paidCount===1?'bill':'bills')];
 if(summary.voidCount)counts.push(summary.voidCount+' voided');
 if(summary.clearedCount)counts.push(summary.clearedCount+' cleared');
 return `<div class="history-day-total"><div class="history-day-amount"><span>Day total <small>(paid)</small></span><strong>${money(summary.paidTotal)}</strong></div><p>${counts.join(' · ')}</p></div>`;
}
function renderHistory(){
 let entries,groups=[],error='';try{entries=billHistory.read();groups=BillHistory.groupByServiceDate(entries).map(day=>({...day,summary:BillHistory.summariseDay(day.entries)}))}catch(e){entries=[];error='History could not be read. Your saved data has not been changed.'}
 let remaining=historyLimit;
 const days=groups.map(day=>{const visible=day.entries.slice(0,remaining);remaining-=visible.length;return visible.length?`<section class="history-day" aria-labelledby="day-${day.date}"><h2 id="day-${day.date}"><time datetime="${day.date}">${esc(serviceDateLabel(day.date))}</time></h2>${dayTotalMarkup(day.summary)}<div class="history-list">${visible.map(historyRow).join('')}</div></section>`:''}).join('');
 $('#main').innerHTML=`<div class="bill-layout"><div class="heading-row"><div><div class="eyebrow">SAVED BILLS</div><h1>History</h1><p class="intro">${entries.length} saved ${entries.length===1?'bill':'bills'}</p></div></div><p class="history-note">Grouped by service date. Bills saved before 4am count towards the previous day, using UK time. Day totals include paid bills only, after discounts and service.</p>${error?`<p class="notice error" role="alert">${error}</p>`:entries.length?`${days}${entries.length>historyLimit?'<button class="wide-btn" data-action="history-more">Show older bills</button>':''}`:'<div class="empty"><h2>No saved bills yet</h2><p>Paid, voided and cleared bills are saved here automatically.</p></div>'}<p class="quiet">History stays in this browser on this device. Clearing browser data also removes history.</p></div>`;
}
function historyEntry(id){
 try{const entry=billHistory.read().find(e=>e.id===id);if(!entry)throw Error('Saved bill not found.');openSheet(header((entry.status==='paid'?'Paid bill':entry.status==='void'?'Voided bill':'Saved bill')+' · Table '+entry.tableId)+`<div class="history-service-date"><span>Service date</span><strong>${esc(serviceDateLabel(entry.serviceDate))}</strong></div><p class="sheet-desc">${historyStatus(entry)} ${esc(historyDate(entry.savedAt))}</p>${entry.note?`<div class="saved-note"><strong>${entry.status==='void'?'Void reason / note':'Reference / note'}</strong><p>${esc(entry.note)}</p></div>`:''}`+receiptBody(entry.bill,entry.totals,entry.tableId)+printControls('print-history',entry.id)+`<button class="wide-btn" data-action="restore-bill" data-value="${esc(entry.id)}">Restore this bill</button>`)}catch(e){toast(e.message)}
}
function prepareRestore(id){
 try{const entry=billHistory.read().find(e=>e.id===id);if(!entry)throw Error('Saved bill not found.');pendingRestore=id;
 const available=tableIds.filter(id=>!bills[id].lines.length),preferred=available.includes(entry.tableId)?entry.tableId:available[0];
 openSheet(header('Restore saved bill')+`<p class="sheet-desc">Restore the ${money(entry.totals.total)} bill from Table ${esc(entry.tableId)} to an available table. ${entry.status==='paid'||entry.status==='void'?'This will reopen a copy as an unpaid bill. The original history record stays saved.':'The history copy stays saved.'}</p>${available.length?`<label class="form-field">Restore to<select id="restore-table">${available.map(id=>`<option value="${id}" ${id===preferred?'selected':''}>Table ${id}</option>`).join('')}</select></label><p class="form-error" id="restore-error" role="alert"></p><button class="wide-btn primary" data-action="confirm-restore">Restore bill</button>`:'<p class="notice">All tables have open bills. Clear a table first to make room.</p>'}`)
 }catch(e){toast(e.message)}
}
function restoreBill(){
 if(storageProblem){$('#restore-error').textContent=storageProblem;return}
 try{const target=$('#restore-table').value;bills=billHistory.restore(bills,pendingRestore,target);pendingRestore=null;table=target;screen='bill';$('#sheet').close();render();toast('Saved bill restored to Table '+table)}catch(e){$('#restore-error').textContent=e.message}
}
function preparePaid(){
 if(!bills[table].lines.length){toast('Add items before marking a bill paid.');return}
 const t=total();openSheet(header('Mark Table '+table+' as paid')+`<div class="paid-amount">${money(t.total)}</div><p class="sheet-desc">Save this bill as paid in History and make Table ${esc(table)} available again.</p><label class="form-field">Reference / note (optional)<textarea id="payment-note" maxlength="500" rows="3" placeholder="e.g. receipt or payment reference"></textarea></label><p class="form-error" id="paid-error" role="alert"></p><button class="wide-btn primary paid-button" data-action="confirm-paid">Confirm paid · ${money(t.total)}</button>`);
}
function confirmPaid(){
 if(storageProblem){$('#paid-error').textContent=storageProblem;return}
 try{const note=$('#payment-note').value,result=billHistory.archiveAndClear(bills,table,{status:'paid',note});bills=result.bills;$('#sheet').close();screen='tables';render();window.scrollTo(0,0);toast('Table '+table+' marked paid and saved to History')}
 catch(e){$('#paid-error').textContent='Table kept open. '+(e.name==='QuotaExceededError'?'Storage is full. Check History before retrying.':e.message+' Check History before retrying.')}
}
function clearToHistory(){
 if(storageProblem){$('#clear-error').textContent=storageProblem;return}
 try{const result=billHistory.archiveAndClear(bills,table);bills=result.bills;$('#sheet').close();render();toast('Table '+table+' saved to History and cleared')}catch(e){$('#clear-error').textContent='Table not cleared. '+(e.name==='QuotaExceededError'?'Storage is full; a safe copy could not be completed.':e.message)}
}
function prepareVoid(){
 if(!bills[table].lines.length){toast('This table is already empty.');return}
 openSheet(header('Void Table '+table+'?')+`<div class="paid-amount">${money(total().total)}</div><p class="sheet-desc">Save this bill as voided in History and make Table ${esc(table)} available. This will not record a payment.</p><label class="form-field" for="void-reason">Reason (optional)</label><select class="standalone-input" id="void-reason"><option value="">Choose a reason</option><option>Accidental table selection</option><option>Order entered twice</option><option>Customer cancelled</option><option>Other</option></select><label class="form-field">Notes (optional)<textarea id="void-note" maxlength="400" rows="3" placeholder="Anything else to record about this bill"></textarea></label><p class="form-error" id="void-error" role="alert"></p><div class="modal-actions"><button class="wide-btn" data-action="close">Keep bill</button><button class="wide-btn void-confirm" data-action="confirm-void">Confirm void</button></div>`);
}
function confirmVoid(){
 if(storageProblem){$('#void-error').textContent=storageProblem;return}
 try{const note=[$('#void-reason').value,$('#void-note').value.trim()].filter(Boolean).join(' — '),result=billHistory.archiveAndClear(bills,table,{status:'void',note});bills=result.bills;$('#sheet').close();screen='tables';render();window.scrollTo(0,0);toast('Table '+table+' voided and saved to History')}
 catch(e){$('#void-error').textContent='Bill kept open. '+e.message}
}
function prepareMove(){
 if(!bills[table].lines.length){toast('Add items before moving a bill.');return}
 pendingMove={table,bill:JSON.stringify(bills[table])};const available=tableIds.filter(id=>id!==table&&!bills[id].lines.length);
 openSheet(header('Move Table '+table)+`<p class="sheet-desc">Move the full ${money(total().total)} bill, including its discount and service charge. Table ${esc(table)} will become available.</p>${available.length?`<label class="form-field" for="move-target">Move to an available table</label><select class="standalone-input" id="move-target"><option value="">Choose a table</option>${available.map(id=>`<option value="${id}">Table ${id}</option>`).join('')}</select><p class="form-error" id="move-error" role="alert"></p><button class="wide-btn primary" data-action="confirm-move">Move bill</button>`:'<p class="notice">Every other table is in use. Make a table available first.</p>'}`);
}
function confirmMove(){
 if(storageProblem){$('#move-error').textContent=storageProblem;return}
 try{if(!pendingMove||pendingMove.table!==table||pendingMove.bill!==JSON.stringify(bills[table]))throw Error('This bill changed. Close and reopen Move table.');const from=table,target=$('#move-target').value;bills=billHistory.move(bills,table,target);table=target;pendingMove=null;$('#sheet').close();screen='bill';render();window.scrollTo(0,0);toast('Bill moved from Table '+from+' to Table '+target)}
 catch(e){$('#move-error').textContent=e.message}
}
function installHelp(){
 openSheet(header('Add Thai Boran to your phone')+'<p class="sheet-desc">Open this page in Safari on iPhone or iPad.</p><ol class="install-steps"><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Keep <strong>Open as Web App</strong> on, then tap <strong>Add</strong>.</li></ol><p class="sheet-desc">On Android or desktop Chrome, use the browser’s Install app option.</p><p class="install-note" id="pwa-status">'+(document.documentElement.dataset.offlineReady==='true'?'Offline ready on this device.':'Open online once to prepare this device for offline use.')+'</p><p class="install-note">Bills and menu changes stay in this browser on this device. Devices do not share bills.</p><button class="wide-btn primary" data-action="close">Done</button>');
}
const catalogSections=[...new Set([...MENU.map(p=>p.section),'Other wine'])].map(section=>({section,group:section==='Other wine'?'Wine':MENU.find(p=>p.section===section).group}));
function renderEditor(){
 $('#main').innerHTML=`<div class="heading-row"><div><div class="eyebrow">MENU SETTINGS</div><h1>Edit menu & prices</h1></div></div><p class="intro">Saved on this device. New orders use the updated prices; existing bill items keep their price.</p><div class="editor-actions"><button class="small-btn" data-action="menu">‹ Back to menu</button><button class="small-btn primary" data-action="new-product">+ Add item</button></div>${menuProblem?`<p class="form-error" role="alert">${esc(menuProblem)}</p>`:''}<label class="form-field">Find an item<input id="editor-search" type="search" placeholder="Search name or category" value="${esc(editorQuery)}" autocomplete="off"></label><div id="editor-list" class="editor-list"></div>`;
 renderEditorList();
}
function renderEditorList(){
 const tokens=normaliseSearch(editorQuery).split(' ').filter(Boolean),products=menuSearchIndex.filter(entry=>tokens.every(t=>entry.text.includes(t))).map(entry=>entry.product);
 $('#editor-list').innerHTML=products.map(p=>{const prices=p.variants.map(v=>v.price_pence);return `<button class="editor-item" data-action="edit-product" data-value="${esc(p.id)}"><span><strong>${esc(p.name)}</strong><small>${esc(p.section)}${p.custom?' · Added item':''}</small></span><span class="editor-price">${Math.min(...prices)!==Math.max(...prices)?'From ':''}${money(Math.min(...prices))}<small>Edit ›</small></span></button>`}).join('')||'<p class="quiet">No matching items. Use + Add item to create one.</p>';
}
function editProduct(id){
 if(menuProblem){toast(menuProblem);return}
 const p=MENU.find(p=>p.id===id);if(!p)return;editingProduct=JSON.parse(JSON.stringify(p));
 openSheet(header('Edit prices')+`<h3 class="editor-dish-name">${esc(p.name)}</h3><p class="sheet-desc">Each price is for one serving. Existing bill items keep their price.</p>${p.variants.map((v,i)=>`<label class="form-field">${esc(v.option)} (£)<input class="edit-price" data-index="${i}" inputmode="decimal" type="text" value="${(v.price_pence/100).toFixed(2)}" autocomplete="off"></label>`).join('')}<p class="form-error" id="catalog-error" role="alert"></p><button class="wide-btn primary" data-action="save-prices">Save prices</button>`);
}
function newProduct(){
 if(menuProblem){toast(menuProblem);return}editingProduct=null;
 const preferred=category==='Wine'?(wineCats.find(([name])=>name===wineCategory)?.[2][0]||'Other wine'):(sections[category]?.[0]||(group==='Food'?'Starters':'Soft drinks'));
 openSheet(header('Add menu item')+`<label class="form-field">Item name<input id="new-name" maxlength="150" placeholder="e.g. House special" autocomplete="off"></label><label class="form-field">Category<select id="new-section">${['Food','Drinks','Wine'].map(g=>`<optgroup label="${g}">${catalogSections.filter(c=>c.group===g).map(c=>`<option value="${esc(c.section)}" ${c.section===preferred?'selected':''}>${esc(c.section)}</option>`).join('')}</optgroup>`).join('')}</select></label><label class="form-field">Serving (optional)<input id="new-serving" maxlength="80" placeholder="e.g. 3 pcs, Glass or Bottle" autocomplete="off"></label><label class="form-field">Price (£)<input id="new-price" type="text" inputmode="decimal" placeholder="0.00" autocomplete="off"></label><p class="sheet-desc">This item will appear in the menu and search on this device.</p><p class="form-error" id="catalog-error" role="alert"></p><button class="wide-btn primary" data-action="save-product">Add to menu</button>`);
}
function saveCatalog(isNew){
 try{
  let product;
  if(isNew){const name=$('#new-name').value.trim(),section=$('#new-section').value,option=$('#new-serving').value.trim()||'Standard',id='CUSTOM-'+Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');if(!name)throw Error('Enter an item name.');product={id,name,section,group:catalogSections.find(c=>c.section===section).group,custom:true,variants:[{sku:id+'-01',option,price_pence:BillingEngine.parseMoney($('#new-price').value)}]};}
  else{if(!editingProduct)throw Error('Reopen the item to edit its prices.');product=JSON.parse(JSON.stringify(editingProduct));for(const input of document.querySelectorAll('.edit-price'))product.variants[Number(input.dataset.index)].price_pence=BillingEngine.parseMoney(input.value);}
  const updated=menuCatalog.save(product,isNew?null:editingProduct);MENU.splice(0,MENU.length,...updated);menuSearchIndex=makeSearchIndex();$('#sheet').close();renderEditor();toast(isNew?'✓ '+product.name+' added to menu':'✓ Prices saved for new orders');
 }catch(e){$('#catalog-error').textContent=e.name==='QuotaExceededError'?'Storage is full. Changes have not been saved.':e.message;}
}
document.addEventListener('click',e=>{let btn=e.target.closest('[data-action]');if(!btn)return;let a=btn.dataset.action,v=btn.dataset.value;
 if(a==='table-view'){tableView=v==='grid'?'grid':'map';renderTables();return}
 if(a==='map-zoom'){zoomMap(v);return}
 if(a==='legacy-table'){if(bills['11']?.lines.length){table='11';screen='bill';render()}return}
 if(a==='edit-menu'){screen='editor';editorQuery='';render();window.scrollTo(0,0);return}
 if(a==='edit-product'){editProduct(v);return}
 if(a==='new-product'){newProduct();return}
 if(a==='save-prices'||a==='save-product'){saveCatalog(a==='save-product');return}
 if(a==='close'){pendingRemoval=null;$('#sheet').close();return}
 if(['tables','menu','bill','history'].includes(a)){screen=a;category='';wineCategory='';render();window.scrollTo(0,0);return}
 if(a==='table'){if(!tableIds.includes(v))return;table=v;menuQuery='';categoryOpen=false;screen=variant==='c'?'bill':'menu';category='';wineCategory='';render();window.scrollTo(0,0);return}
 if(a==='clear-search'){menuQuery='';$('#menu-search').value='';renderMenuContent();$('#menu-search').focus();return}
 if(a==='group'){group=v;category='';wineCategory='';menuQuery='';categoryOpen=true;renderMenu();window.scrollTo(0,0);return}
 if(a==='category'){category=v;wineCategory='';menuQuery='';renderMenu();window.scrollTo(0,0);return}
 if(a==='wine-category'){if(!wineCats.some(([name])=>name===v))return;wineCategory=v;menuQuery='';renderMenu();window.scrollTo(0,0);return}
 if(a==='back'){if(wineCategory)wineCategory='';else category='';categoryOpen=true;renderMenu();window.scrollTo(0,0);return}
 if(a==='search-product'){chooseSearchProduct(v);return}
 if(a==='show-search-results'){closeSearchSuggestions();$('#menu-search').blur();return}
 if(a==='product'){product(v);return}
 if(a==='choose'){choice=+v;$('#sheet').querySelectorAll('.choice').forEach((el,i)=>el.classList.toggle('selected',i===choice));$('#add-choice').disabled=false;$('#add-choice').textContent='Add to Table '+table+' · '+money(selected.variants[choice].price_pence);return}
 if(a==='add'){if(selected&&choice!==null)addItem(selected,selected.variants[choice]);return}
 if(a==='add-set'){addSetMenu();return}
 if(a==='plus'||a==='minus'){changeQuantity(v,a==='plus'?1:-1);return}
 if(a==='confirm-remove'){confirmRemoval();return}
 if(a==='discount'){bills[table].discount={type:btn.dataset.type,value:+v};save();renderBill();return}
 if(a==='toggle-service'){if(storageProblem){toast(storageProblem);return}bills[table].serviceRate=total().serviceRate===10?0:10;save();renderBill();$('#main').querySelector('[data-action="toggle-service"]').focus({preventScroll:true});return}
 if(a==='custom'){openSheet(header('Custom discount')+'<label class="form-field">Discount type<select id="discount-type"><option value="amount">Amount (£)</option><option value="percent">Percentage (%)</option></select></label><label class="form-field">Discount value<input id="discount-value" type="text" inputmode="decimal" placeholder="0.00"></label><p class="service-note">Discount applies before any service charge. A £ discount is capped at the subtotal.</p><p class="form-error" id="discount-error" role="alert"></p><button class="wide-btn primary" data-action="apply-custom">Apply discount</button>');return}
 if(a==='apply-custom'){try{let type=$('#discount-type').value,value=BillingEngine[type==='amount'?'parseMoney':'parsePercent']($('#discount-value').value);bills[table].discount={type,value};save();$('#sheet').close();renderBill()}catch(e){$('#discount-error').textContent=e.message}return}
 if(a==='customer'){customer();return}
 if(a==='print-current'){printCurrent();return}
 if(a==='print-history'){printHistory(v);return}
 if(a==='print-current-system'){printCurrent(true);return}
 if(a==='print-history-system'){printHistory(v,true);return}
 if(a==='paid'){preparePaid();return}
 if(a==='void'){prepareVoid();return}
 if(a==='confirm-void'){confirmVoid();return}
 if(a==='move-table'){prepareMove();return}
 if(a==='confirm-move'){confirmMove();return}
 if(a==='install-app'){installHelp();return}
 if(a==='confirm-paid'){confirmPaid();return}
 if(a==='clear'){openSheet(header('Clear Table '+table+'?')+'<p class="sheet-desc">A full copy will be saved to History first. Then this table will be emptied and service reset to 10% for its next bill.</p><p class="form-error" id="clear-error" role="alert"></p><button class="wide-btn primary" data-action="confirm-clear">Save to History & clear</button>');return}
 if(a==='confirm-clear'){clearToHistory();return}
 if(a==='history-entry'){historyEntry(v);return}
 if(a==='history-more'){historyLimit+=50;renderHistory();return}
 if(a==='restore-bill'){prepareRestore(v);return}
 if(a==='confirm-restore'){restoreBill();return}

});
render();



window.addEventListener('storage',e=>{if(e.key===menuCatalog.storageKey){try{MENU.splice(0,MENU.length,...menuCatalog.load());menuProblem='';menuSearchIndex=makeSearchIndex();if($('#sheet').open)$('#sheet').close();render();toast('Menu updated from another tab')}catch{menuProblem='Saved menu changes could not be read. Reload before adding orders.';toast(menuProblem)}return}if(e.key===billHistory.historyKey){if(screen==='history')renderHistory();return}if(e.key!==key)return;try{if(!e.newValue)throw Error();const updated=JSON.parse(e.newValue);for(const id of tableIds)BillingEngine.calculate(updated[id],'afterDiscount');bills=updated;if($('#sheet').open)$('#sheet').close();render();toast('Bills updated from another tab')}catch{storageProblem='Saved bills changed outside this page. Reload before adding orders.';$('#save-status').textContent=storageProblem;$('#save-status').classList.add('save-error')}});
