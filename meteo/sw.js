/* ProVela service worker — network-first HTML + passthrough API meteo + offline shell */
const CACHE='raffyca-meteo-v12';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('raffyca-meteo')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return; // Open-Meteo / geocoding: rete diretta
  const accept=req.headers.get('accept')||'';
  const isHTML=req.mode==='navigate'||accept.indexOf('text/html')>=0||url.pathname.endsWith('/')||url.pathname.endsWith('index.html');
  if(isHTML){e.respondWith(fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp)).catch(()=>{});return res;}).catch(()=>caches.match(req).then(m=>m||caches.match('./index.html'))));}
  else{e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});return res;}).catch(()=>caches.match('./index.html'))));}
});
