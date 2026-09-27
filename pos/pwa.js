'use strict';
if('serviceWorker' in navigator && !new URLSearchParams(location.search).has('test')){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{
   document.documentElement.dataset.offlineReady='true';
   const status=document.getElementById('pwa-status');if(status)status.textContent='Offline ready on this device.';
  }).catch(()=>{});
 });
}
