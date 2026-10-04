'use strict';
const CACHE='thai-boran-pos-20261004-14';
const ROOT=new URL('./',self.location.href).href;
const FILES=['./','index.html','styles.css?v=20261004-pos-14','variants.css?v=20261004-pos-14','polish.css?v=20261004-pos-14','menu.js?v=20261004-pos-14','set-menu.js?v=20261004-pos-14','engine.js?v=20261004-pos-14','history.js?v=20261004-pos-14','catalog.js?v=20261004-pos-14','search.js?v=20261004-pos-14','epson-print.js?v=20261004-pos-14','app.js?v=20261004-pos-14','pwa.js?v=20261004-pos-14','manifest.webmanifest?v=20261004-pos-14','icons/icon-192.png?v=20261004-pos-14','icons/icon-512.png?v=20261004-pos-14','icons/apple-touch-icon.png?v=20261004-pos-14'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new URL(file,ROOT).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('thai-boran-pos-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(ROOT))return;
 // Development/review orders use separate storage and never seed the offline app.
 if(url.searchParams.has('test'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{if(!response.ok)throw Error('Offline');return response;}).catch(()=>caches.open(CACHE).then(cache=>cache.match(ROOT))));return;
 }
 if(FILES.some(file=>new URL(file,ROOT).href===url.href))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
