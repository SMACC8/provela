/* ProVela hub — service worker minimale per installabilità e offline della schermata iniziale. */
var VERSION='provela-hub-v11', SHELL=VERSION+'-shell';
var PRECACHE=['./','./index.html','./rf-topbar.js','./rf-astro.js','./rf-live.js','./manutenzione/','./manutenzione/catalogo.json','./calcoli/','./sole-luna/','./mob/','./manifest.webmanifest','./pwa-192.png','./pwa-512.png','./pwa-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(SHELL).then(function(c){return Promise.all(PRECACHE.map(function(u){return c.add(new Request(u,{cache:'reload'})).catch(function(){});}));}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k.indexOf('provela-hub-')===0&&k.indexOf(VERSION)!==0)return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){var req=e.request;if(req.method!=='GET')return;
  if(req.mode==='navigate'||(req.headers.get('accept')||'').indexOf('text/html')>=0){
    e.respondWith(fetch(req,{cache:'reload'}).then(function(r){caches.open(SHELL).then(function(c){c.put(req,r.clone());});return r;}).catch(function(){return caches.match(req).then(function(m){return m||caches.match('./index.html');});}));return;}
  e.respondWith(caches.match(req).then(function(m){return m||fetch(req);}));
});
