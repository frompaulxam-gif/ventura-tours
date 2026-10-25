(() => {"use strict";const tools=document.getElementById("menu-tools"),input=document.getElementById("dish-search"),status=document.getElementById("menu-status"),empty=document.getElementById("no-results"),groups=[...document.querySelectorAll(".menu-group")],buttons=[...document.querySelectorAll("[data-filter]")];if(!tools||!input||!status||!empty||!groups.length||!buttons.length)return;let category="All";const normal=s=>s.normalize("NFKC").toLocaleLowerCase().trim();function update(){const query=normal(input.value);let count=0;for(const group of groups){let visible=0;for(const row of group.querySelectorAll("[data-dish]")){const match=(category==="All"||group.dataset.group===category)&&(!query||normal(row.querySelector("span").textContent).includes(query));row.hidden=!match;if(match){visible++;count++;}}group.hidden=visible===0;}for(const button of buttons)button.setAttribute("aria-pressed",String(button.dataset.filter===category));empty.hidden=count!==0;status.textContent=count+" "+(count===1?"dish":"dishes")+" shown";}input.addEventListener("input",update);for(const button of buttons)button.addEventListener("click",()=>{category=button.dataset.filter;update();});tools.addEventListener("submit",e=>e.preventDefault());tools.addEventListener("reset",e=>{e.preventDefault();input.value="";category="All";update();input.focus();});update();tools.hidden=false;})();

(() => {"use strict";
const memory={},prefix="lalas:r1:",query=new URLSearchParams(location.search),motion=matchMedia("(prefers-reduced-motion: reduce)");
const read=k=>{try{return sessionStorage.getItem(prefix+k)==="1"}catch{return !!memory[k]}};
const write=k=>{memory[k]=true;try{sessionStorage.setItem(prefix+k,"1")}catch{}};
document.querySelectorAll("img").forEach(img=>{const failed=()=>img.classList.add("image-failed");img.addEventListener("error",failed);if(img.complete&&!img.naturalWidth)failed()});
let introBusy=false,finishIntro=()=>{};
const target=document.querySelector("header .brand"),source=target?.querySelector("img");
function startIntro(){if(document.querySelector('animated-opening'))return;
 if(!target||!source||!source.naturalWidth||!target.animate||query.get("reviewDemo")==="1"||document.querySelector("dialog[open]")||motion.matches||location.hash||scrollY>8||document.hidden||(!query.has("reviewIntro")&&read("intro")))return;
 const box=target.getBoundingClientRect(),previousOrigin=target.style.transformOrigin;target.style.transformOrigin="top left";target.classList.add("intro-active");target.setAttribute("data-intro-active","true");
 let scale=.88,dx=Math.min(6,box.width*.03),dy=Math.min(6,box.height*.04);
 // Compact reveal stays inside the existing brand slot. A larger desktop journey
 // is used only if its entire swept rectangle fits the header and misses core UI.
 const header=target.closest("header").getBoundingClientRect();
 if(innerWidth>850){const candidate=Math.min(1,(header.width-48)/box.width);const x=header.left+(header.width-box.width*candidate)/2,y=header.top+(header.height-box.height*candidate)/2;const sweep={left:Math.min(box.left,x),top:Math.min(box.top,y),right:Math.max(box.right,x+box.width*candidate),bottom:Math.max(box.bottom,y+box.height*candidate)};const protectedRects=[...document.querySelectorAll("header nav,.hero h1,.hero .lead,.hero .button,.food-photo,.proposal")].map(x=>x.getBoundingClientRect());const collision=protectedRects.some(r=>sweep.left<r.right&&sweep.right>r.left&&sweep.top<r.bottom&&sweep.bottom>r.top);if(candidate>=1&&sweep.left>=header.left&&sweep.right<=header.right&&sweep.top>=header.top&&sweep.bottom<=header.bottom&&!collision){scale=candidate;dx=x-box.left;dy=y-box.top;}}
 introBusy=true;write("intro");let timer,animation;
 finishIntro=()=>{introBusy=false;clearTimeout(timer);animation?.cancel();target.classList.remove("intro-active");target.removeAttribute("data-intro-active");if(previousOrigin)target.style.transformOrigin=previousOrigin;else target.style.removeProperty("transform-origin");window.removeEventListener("resize",finishIntro);window.removeEventListener("scroll",finishIntro);};
 try{animation=target.animate([{transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:1,offset:.25},{transform:"translate(0,0) scale(1)",opacity:1}],{duration:1350,easing:"cubic-bezier(.2,.7,.2,1)",fill:"both"});animation.onfinish=finishIntro;timer=setTimeout(finishIntro,1800);window.addEventListener("resize",finishIntro,{once:true});window.addEventListener("scroll",finishIntro,{once:true});}catch{finishIntro()}
}
if(source?.complete)startIntro();else source?.addEventListener("load",startIntro,{once:true});
source?.addEventListener("error",()=>finishIntro(),{once:true});
motion.addEventListener?.("change",()=>{if(motion.matches)finishIntro()});
const dialog=document.getElementById("updates-dialog"),close=document.getElementById("close-updates");let returnFocus=null,dismissed=read("updates"),waited=false;
function suppress(){dismissed=true;write("updates")}
function dismiss(){suppress();dialog?.querySelectorAll("input").forEach(x=>{x.value="";x.removeAttribute("aria-invalid")});if(dialog?.open)dialog.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
close?.addEventListener("click",dismiss);dialog?.addEventListener("cancel",e=>{e.preventDefault();dismiss()});dialog?.addEventListener("close",suppress);
document.querySelectorAll(".demo-email").forEach(form=>{
 const input=form.querySelector("input"),error=form.querySelector(".email-error"),result=form.querySelector(".demo-result");
 form.addEventListener("submit",event=>{event.preventDefault();suppress();result.textContent="";if(!input.value.trim()||!input.validity.valid){error.textContent=input.value.trim()?"Enter a valid email, such as guest@example.com.":"Enter a made-up email to try the demonstration.";input.setAttribute("aria-invalid","true");input.focus();return;}input.value="";input.removeAttribute("aria-invalid");error.textContent="";result.textContent="Demo only — nothing was sent.";});
 input.addEventListener("input",()=>{input.removeAttribute("aria-invalid");error.textContent="";result.textContent="";});form.hidden=false;
});
function offer(force=false){if(!dialog||typeof dialog.showModal!=="function"||dialog.open||introBusy||document.hidden)return;if(!force){const distance=document.documentElement.scrollHeight-innerHeight,progress=distance>0?scrollY/distance:0;if(!waited||progress<.30||dismissed||location.hash||document.activeElement?.closest("form,dialog"))return;}returnFocus=document.activeElement;try{dialog.showModal();close.focus()}catch{}}
setTimeout(()=>{waited=true;offer()},20000);window.addEventListener("scroll",()=>offer(),{passive:true});document.addEventListener("visibilitychange",()=>offer());
dialog?.addEventListener("keydown",e=>{if(e.key!=="Tab")return;const stops=[...dialog.querySelectorAll("button,input,a[href]")].filter(x=>!x.disabled&&!x.hidden);if(!stops.length)return;const first=stops[0],last=stops[stops.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
if(query.get("reviewDemo")==="1")offer(true);
})();
