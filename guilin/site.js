(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],reduced=matchMedia('(prefers-reduced-motion:reduce)');
const flag={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k){try{sessionStorage.setItem(k,'1')}catch{}}};
const result=$('#meal-result'),error=$('#meal-error'),dish=$('#dish'),people=$('#people');
function invalidate(){result.hidden=true;$('#meal-summary').textContent='';error.textContent=''}
$('#meal-controls').addEventListener('input',invalidate);$('#meal-controls').addEventListener('change',invalidate);
$('#make-note').addEventListener('click',()=>{
 invalidate();if(!dish.value){error.textContent='Choose a noodle dish to ask about.';dish.focus();return}
 const count=Number(people.value);if(!people.value||!Number.isInteger(count)||count<1||count>30){error.textContent='Enter a whole number of people from 1 to 30.';people.focus();return}
 const questions=$$('.questions input:checked').map(i=>i.value);
 $('#meal-summary').textContent=`Ask about: ${dish.value}\nPeople: ${count}\n${questions.length?questions.join('\n'):'Ask the trader about today’s preparation, price and choices.'}`;
 result.hidden=false;
});
people.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#make-note').click()}});
const modal=$('#signup'),email=$('#email'),status=$('#signup-status');let opener=null,returnFocus=true,lastAction=performance.now(),introActive=false;
const engaged=()=>{lastAction=performance.now()};['pointerdown','keydown','scroll'].forEach(t=>addEventListener(t,engaged,{passive:true}));
function resetSignup(){email.value='';status.textContent='';email.removeAttribute('aria-invalid')}
function openSignup(button){if(modal.open)return;opener=button||null;returnFocus=true;resetSignup();flag.set('guilin-popup-v1');modal.showModal();email.focus()}
$$('[data-signup]').forEach(b=>b.addEventListener('click',()=>openSignup(b)));
$('.close').addEventListener('click',()=>modal.close());
modal.addEventListener('cancel',e=>{e.preventDefault();modal.close()});
modal.addEventListener('close',()=>{resetSignup();if(returnFocus&&opener&&opener.isConnected)opener.focus();opener=null;engaged()});
$('#back-menu').addEventListener('click',()=>{returnFocus=false;modal.close();const target=$('#menu');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'})});
email.addEventListener('input',()=>{status.textContent='';email.removeAttribute('aria-invalid')});
email.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#signup-button').click()}});
$('#signup-button').addEventListener('click',()=>{
 const v=email.value.trim();if(!v||!email.validity.valid||!/^\S+@[^\s@]+\.[^\s@]+$/.test(v)){status.textContent='Enter a valid email address to try the demo.';email.setAttribute('aria-invalid','true');email.focus();return}
 email.value='';email.removeAttribute('aria-invalid');status.textContent='Demo complete. Nothing was sent or saved; no subscription was created.';
});
const started=performance.now();let popupTimer=setInterval(()=>{
 if(flag.get('guilin-popup-v1')){clearInterval(popupTimer);return}
 const depth=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
 if(performance.now()-started<20000||depth<.3||performance.now()-lastAction<5000||modal.open||introActive||document.activeElement?.closest('[role="form"]'))return;
 openSignup(null);clearInterval(popupTimer);
},1000);
addEventListener('pagehide',()=>clearInterval(popupTimer),{once:true});
async function revealLogo(){
 let overlay,animation,timer,brand,done=false;
 const finish=()=>{if(done)return;done=true;introActive=false;clearTimeout(timer);animation?.cancel();overlay?.remove();if(brand)brand.style.visibility='';removeEventListener('resize',finish);removeEventListener('hashchange',finish);removeEventListener('pagehide',finish);reduced.removeEventListener('change',finish)};
 try{
  if(reduced.matches||location.hash||scrollY>24)return;
  const seen=flag.get('guilin-intro-v1');flag.set('guilin-intro-v1');
  if(seen&&!(location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).get('qaIntro')==='1'))return;
  await Promise.race([document.fonts?.ready||Promise.resolve(),new Promise(r=>setTimeout(r,800))]);
  if(reduced.matches||location.hash||scrollY>24||modal.open)return;
  brand=$('.brand');const source=brand.querySelector('.poster-window'),rect=source.getBoundingClientRect(),header=$('header').getBoundingClientRect(),nav=$('header nav').getBoundingClientRect();
  if(rect.width>207.1||rect.height>45.1||rect.left<header.left||rect.right>header.right||rect.top<header.top||rect.bottom>header.bottom||(rect.right>nav.left&&rect.left<nav.right))return;
  overlay=document.createElement('div');overlay.className='logo-reveal';overlay.setAttribute('aria-hidden','true');overlay.append(source.cloneNode(true));Object.assign(overlay.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(overlay);
  const delta=Math.max(0,Math.min(4,rect.top-header.top,header.bottom-rect.bottom));brand.style.visibility='hidden';introActive=true;
  addEventListener('resize',finish);addEventListener('hashchange',finish);addEventListener('pagehide',finish);reduced.addEventListener('change',finish);
  animation=overlay.animate([{transform:`translateY(${delta}px)`,opacity:0},{transform:'translateY(0)',opacity:1}],{duration:900,easing:'cubic-bezier(.22,.7,.25,1)',fill:'both'});timer=setTimeout(finish,1600);animation.finished.then(finish).catch(finish);
 }catch{finish()}
}
$('#meal-controls').disabled=false;$('#signup-controls').disabled=false;revealLogo();
})();
