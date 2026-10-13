'use strict';
const CACHE='amocashs-ui-v7-private-menu';
const FILES=['./','./index.html','./styles.css','./app.js','./i18n.js','./login-client.js','./passkeys-client.js','./bridge-client.js','./install.js','./core.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new Request(new URL(file,self.registration.scope).href,{cache:"reload"}))))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('amocashs-')&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.kind==='activate-update')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Google pages, financial data and credentials are never cached by this worker.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));return;}
 const allowed=FILES.some(file=>new URL(file,self.registration.scope).pathname===url.pathname);
 if(allowed)event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request)));
});
