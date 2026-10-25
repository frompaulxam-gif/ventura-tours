'use strict';
const $=s=>document.querySelector(s);
const flags={get(k){try{return sessionStorage.getItem('sgs-level2-'+k)}catch{return null}},set(k){try{sessionStorage.setItem('sgs-level2-'+k,'1')}catch{}}};
let clone=null,animation=null,introTimer=null;
function intro(force=false){
 const logo=$('.header-logo');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||(!force&&(flags.get('intro')||location.hash||scrollY>24)))return;
 flags.set('intro');clearTimeout(introTimer);animation?.cancel();clone?.remove();logo.style.visibility='';
 const end=logo.getBoundingClientRect(),compact=innerWidth<701||innerHeight<500;
 const width=compact?Math.min(104,end.width*1.3):128;
 const start={x:end.left+(compact?8:100),y:compact?end.top:end.top+4};
 const node=document.createElement('div');clone=node;node.className='intro-clone';node.setAttribute('aria-hidden','true');const image=logo.cloneNode();image.style.visibility='visible';node.append(image);
 Object.assign(node.style,{left:start.x+'px',top:start.y+'px',width:width+'px'});document.body.append(node);logo.style.visibility='hidden';
 const finish=()=>{node.remove();if(clone===node){clone=null;logo.style.visibility=''}};
 try{animation=node.animate([{opacity:0,transform:'translate(0,0) scale(1)',offset:0},{opacity:1,transform:'translate(0,0) scale(1)',offset:.22},{opacity:1,transform:'translate(0,0) scale(1)',offset:.42},{opacity:1,transform:`translate(${end.left-start.x}px,${end.top-start.y}px) scale(${end.width/width})`,offset:1}],{duration:1800,easing:'cubic-bezier(.22,.68,.25,1)',fill:'forwards'});animation.finished.then(finish).catch(finish);introTimer=setTimeout(finish,2300);window.addEventListener('resize',finish,{once:true})}catch{finish()}
}
intro();
const interests={
 arcade:{title:'The arcade',short:'Arcade',floor:'Second floor',image:'arcade.jpeg',alt:'Level 2 arcade signage and cabinets, shown as venue context',description:'Classic coin-operated arcade games in the Silver Arcade. Check what is running when you visit.',caption:'An authentic venue photo, not a current machine list.'},
 cafe:{title:'The café',short:'Café',floor:'Second floor',image:'drinks.jpeg',alt:'Two milkshakes photographed at the Level 2 café, not a current flavour list',description:'Milkshakes, coffee and cakes. Ask at the counter for today’s choices, prices and dietary information.',caption:'Real café context. Pictured toppings and flavours are not guaranteed available.'},
 shop:{title:'The shop',short:'Shop',floor:'Ground floor',image:'shop.jpeg',alt:'Super Game Shack shop merchandise, people and main-shop sign, not verified upstairs',description:'Retro and modern games, consoles and collectables. Browse in person and check current stock with the shop.',caption:'Shop photography, not a live stock list or a claim about today’s team.'}
};
let selected='arcade',list=[];
function render(){const item=interests[selected];$('#interest-title').textContent=item.title;$('#interest-floor').textContent=item.floor;$('#interest-image').src='assets/'+item.image;$('#interest-image').alt=item.alt;$('#interest-caption').textContent=item.caption;$('#interest-description').textContent=item.description;for(const b of document.querySelectorAll('[data-interest]'))b.setAttribute('aria-pressed',String(b.dataset.interest===selected));$('#visit-list').replaceChildren();if(!list.length){const li=document.createElement('li');li.textContent='No interests added yet.';$('#visit-list').append(li)}for(const id of list){const li=document.createElement('li'),span=document.createElement('span'),b=document.createElement('button');span.textContent=interests[id].short+' · '+interests[id].floor;b.type='button';b.textContent='Remove';b.setAttribute('aria-label','Remove '+interests[id].short);b.onclick=()=>{list=list.filter(x=>x!==id);render();$('#selection-status').textContent='Interest removed.';$('#add').focus()};li.append(span,b);$('#visit-list').append(li)}}
for(const b of document.querySelectorAll('[data-interest]')){b.disabled=false;b.onclick=()=>{selected=b.dataset.interest;render();$('#selection-status').textContent=interests[selected].short+' selected.'}}
$('#add').disabled=false;$('#add').onclick=()=>{if(list.includes(selected)){$('#selection-status').textContent='Already on your visit list.';return}list.push(selected);render();$('#selection-status').textContent='Added to your local list. Nothing was sent.'};
$('#copy-list').disabled=false;$('#copy-list').onclick=async()=>{if(!list.length){$('#copy-status').textContent='Add an interest first.';return}const text='Super Game Shack visit interests\n'+list.map(id=>interests[id].short+' · '+interests[id].floor).join('\n')+'\nLocal demo only. Not a booking, order or reservation. Check current opening details before travelling.';try{await navigator.clipboard.writeText(text);$('#copy-status').textContent='Visit list copied.'}catch{$('#copy-status').textContent=text}};render();
const dialog=$('#signup-dialog');let trigger=null;
function open(t){if(document.querySelector('dialog[open]'))return;trigger=t||document.activeElement;$('#email-status').textContent='';$('#email').removeAttribute('aria-invalid');dialog.showModal()}
for(const b of document.querySelectorAll('[data-signup]')){b.disabled=false;b.onclick=()=>open(b)}
dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{flags.set('dismissed');$('#email').value='';trigger?.focus()});
$('#signup').onsubmit=e=>{e.preventDefault();const input=$('#email');if(!input.value.trim()||!input.validity.valid){input.setAttribute('aria-invalid','true');$('#email-status').textContent='Please enter a valid email address.';input.focus();return}input.removeAttribute('aria-invalid');input.value='';flags.set('dismissed');$('#email-status').textContent='Demo only — nothing was sent.'};
let elapsed=false;function maybePopup(){const distance=document.documentElement.scrollHeight-innerHeight;if(!elapsed||flags.get('dismissed')||distance<=0||scrollY/distance<.3||clone||document.querySelector('dialog[open]')||document.activeElement?.matches('input,textarea,select'))return;open()}
setTimeout(()=>{elapsed=true;maybePopup()},20000);window.addEventListener('scroll',maybePopup,{passive:true});
if(new URLSearchParams(location.search).has('review')){$('#qa').hidden=false;$('#replay').onclick=()=>intro(true);for(const b of document.querySelectorAll('[data-frame]'))b.onclick=()=>{intro(true);if(animation){clearTimeout(introTimer);animation.pause();animation.currentTime=Number(b.dataset.frame)}}}
