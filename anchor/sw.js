const CACHE='anchor-v13';
const ASSETS=['../rf-topbar.js','../rf-live.js','./','./index.html','./manifest.webmanifest','./assets/boat-icon-128.png','./assets/boat-icon-256.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('anchor')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;
  const accept=req.headers.get('accept')||'';
  const isHTML=req.mode==='navigate'||accept.indexOf('text/html')>=0||req.url.endsWith('/')||req.url.endsWith('index.html');
  if(isHTML){
    // network-first: sempre l'ultima versione quando c'e' rete; cache solo offline
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp)).catch(()=>{});return r;}).catch(()=>caches.match(req).then(m=>m||caches.match('./index.html'))));
  }else{
    // asset statici: cache-first
    e.respondWith(caches.match(req).then(m=>m||fetch(req)));
  }
});
