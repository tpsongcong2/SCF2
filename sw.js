const CACHE='face-mask-v555';
const CORE=['./','./index.html','./styles.css?v=555','./manifest.json','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('face-mask-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(response=>{
    const url=new URL(event.request.url);
    if(url.origin===self.location.origin&&response.ok){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
    }
    return response;
  }).catch(()=>caches.match(event.request).then(hit=>{
    if(hit)return hit;
    if(event.request.mode==='navigate')return caches.match('./index.html');
    return Response.error();
  })));
});
