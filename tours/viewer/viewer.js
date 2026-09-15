'use strict';
const config=window.VENTURA_TOUR;
const details=config.details;
const sceneName=id=>config.viewpoints[id].heading.replace(/\.$/,'');
const dialog=document.querySelector('#detail');
const content=document.querySelector('#detail-content');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openDetail(id){
 const d=details[id]; if(!d)return;
 content.innerHTML=`<img class="detail-image" src="${d.image}" alt="Published venue photo: ${esc(d.title)}"><div class="detail-copy"><div class="eyebrow">Original reference photo</div><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p><p class="small">Photo credit: ${esc(config.venue)} website. Included as a reference for this concept.</p><a class="enquire" href="${d.source}" target="_blank" rel="noopener">View venue information ↗</a></div>`;
 if(!dialog.open)dialog.showModal();
}
function about(){content.innerHTML=`<div class="detail-copy"><div class="eyebrow">Made by Ventura Tours</div><h2>A first look at what is possible.</h2><p>This free sample pairs an AI generated panoramic view with published photos of ${esc(config.venue)}.</p><p>${esc(config.scope)}</p><p>Layout, equipment, furniture and unseen areas are illustrative. This is not a measured scan or an official venue tour.</p><p>A finished tour would use real 360° photography captured onsite, with your own booking or enquiry links.</p><a href="${config.website}" target="_blank" rel="noopener">Original venue website ↗</a></div>`;if(!dialog.open)dialog.showModal();}
function gallery(){content.innerHTML='<div class="detail-copy"><div class="eyebrow">The starting point</div><h2>Real photos. A new way to explore.</h2><p>These published venue photos informed the concept. Select a photo for a closer look.</p></div><div class="gallery">'+Object.entries(details).map(([id,d])=>`<button data-gallery="${id}"><img src="${d.image}" alt="${esc(d.title)}"><span>${esc(d.title)}</span></button>`).join('')+'</div>';if(!dialog.open)dialog.showModal();content.querySelectorAll('[data-gallery]').forEach(b=>b.onclick=()=>openDetail(b.dataset.gallery));}
document.querySelector('#about').onclick=about;document.querySelector('#reference').onclick=gallery;
document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>goTo(b.dataset.detail));
document.querySelector('.close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelector('#retry').onclick=()=>location.reload();
document.querySelector('#fallback-photos').onclick=gallery;
let viewer,rotating=false,moving=false,ready=false,current=config.firstScene;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const viewpoints=config.viewpoints;
const preloads=new Map();
function preload(id){
 if(preloads.has(id))return preloads.get(id);
 const task=new Promise((resolve,reject)=>{
  const img=new Image();
  const timer=setTimeout(()=>reject(new Error('Image timed out')),20000);
  img.onload=()=>{clearTimeout(timer);resolve(img)};
  img.onerror=()=>{clearTimeout(timer);reject(new Error('Image unavailable'))};
  img.src=viewpoints[id].image;
 });
 preloads.set(id,task);task.catch(()=>preloads.delete(id));return task;
}
function setMoving(value){moving=value;document.querySelector('.tour').setAttribute('aria-busy',String(value));document.querySelector('#panorama').inert=value;document.querySelectorAll('[data-detail],.tools button').forEach(b=>b.disabled=value);}
function stopRotation(){rotating=false;if(viewer)viewer.stopAutoRotate();const b=document.querySelector('#rotate');b.textContent='Rotate';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Start slow rotation');}
function updatePlace(){
 const p=viewpoints[current];
 document.querySelector('.scene-label .eyebrow').textContent=p.label;
 document.querySelector('.scene-label h2').textContent=p.heading;
 document.querySelector('#help').textContent=(config.help||'Select an arrow to move. Drag to look around.');
 document.querySelectorAll('[data-detail]').forEach(b=>{const active=b.dataset.detail===current;b.setAttribute('aria-current',active?'location':'false');});
}
async function goTo(id){
 if(!viewpoints[id]||moving||!ready)return;
 stopRotation();
 if(id===current){const p=viewpoints[id];viewer.lookAt(p.pitch,p.yaw,92,reducedMotion.matches?0:700);return;}
 setMoving(true);
 document.querySelector('#help').textContent='Moving to '+sceneName(id).toLowerCase()+'…';
 const direction=viewpoints[current].links.find(l=>l.id===id);
 try{await preload(id);}catch(e){setMoving(false);document.querySelector('#help').textContent='That view could not load. Please try again.';return;}
 const yaw=direction?direction.yaw:viewer.getYaw();
 const targetYaw=direction&&direction.targetYaw!==undefined?direction.targetYaw:yaw;
 const pitch=-5,hfov=viewer.getHfov();
 const delta=Math.abs(((yaw-viewer.getYaw()+540)%360)-180);
 const duration=reducedMotion.matches?0:Math.min(1000,Math.max(250,delta*5));
 // All panoramas share the same heading. Keep zoom and horizon constant.
 viewer.lookAt(pitch,yaw,hfov,duration,()=>viewer.loadScene(id,pitch,targetYaw,hfov));
}
function marker(el,args){const b=document.createElement('button');b.setAttribute('aria-label','Move to '+args.label);b.innerHTML='↗<span>'+esc(args.label)+'</span>';b.addEventListener('click',e=>{e.stopPropagation();goTo(args.id)});el.append(b);}
function failed(){document.querySelector('#loading').hidden=true;document.querySelector('#failure').hidden=false;document.querySelectorAll('.tools button').forEach(b=>b.disabled=true);}
try {
 const scenes=Object.fromEntries(Object.entries(viewpoints).map(([id,p])=>[id,{type:'equirectangular',panorama:p.image,pitch:p.pitch,yaw:p.yaw,...(config.viewBounds||{}),hotSpots:p.links.map(l=>({pitch:l.pitch,yaw:l.yaw,cssClass:'spot',createTooltipFunc:marker,createTooltipArgs:{id:l.id,label:l.label||sceneName(l.id)}}))}]));
 viewer=pannellum.viewer('panorama',{default:{firstScene:config.firstScene,autoLoad:true,showControls:false,mouseZoom:false,hfov:92,minHfov:50,maxHfov:110,escapeHTML:true,sceneFadeDuration:reducedMotion.matches?0:1100},scenes});
 function arrived(){current=viewer.getScene();setMoving(false);updatePlace();}
 viewer.on('load',()=>{document.querySelector('#loading').hidden=true;ready=true;if(!moving||reducedMotion.matches)arrived();Object.keys(viewpoints).forEach(id=>preload(id).catch(()=>{}));});
 viewer.on('scenechangefadedone',arrived);
 viewer.on('error',()=>{ready=false;setMoving(false);failed();});
 document.querySelector('#left').onclick=()=>viewer.setYaw(viewer.getYaw()-35,700);
 document.querySelector('#right').onclick=()=>viewer.setYaw(viewer.getYaw()+35,700);
 document.querySelector('#zoom-in').onclick=()=>viewer.setHfov(viewer.getHfov()-10,400);
 document.querySelector('#zoom-out').onclick=()=>viewer.setHfov(viewer.getHfov()+10,400);
 document.querySelector('#rotate').onclick=()=>{rotating=!rotating;rotating?viewer.startAutoRotate(-2):viewer.stopAutoRotate();const b=document.querySelector('#rotate');b.textContent=rotating?'Pause':'Rotate';b.setAttribute('aria-pressed',String(rotating));b.setAttribute('aria-label',rotating?'Pause slow rotation':'Start slow rotation')};
 document.querySelector('#fullscreen').onclick=()=>{const el=document.querySelector('.tour');if(document.fullscreenElement){document.exitFullscreen()}else if(el.requestFullscreen){el.requestFullscreen()}else{viewer.toggleFullscreen()}};
}catch(e){failed();}
